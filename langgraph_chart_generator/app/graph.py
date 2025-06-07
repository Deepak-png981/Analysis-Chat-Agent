import os
import re
import logging
from typing import List, Optional, Tuple, TypedDict

from e2b_code_interpreter import Sandbox
from langchain.prompts import ChatPromptTemplate
from langchain_core.output_parsers import JsonOutputParser, StrOutputParser
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph

from .prompts.prompt_factory import prompt_factory

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class GraphState(TypedDict):
    file_path: Optional[str]
    prompt: str
    chat_history: List[Tuple[str, str]]
    clarification_needed: bool
    clarification_question: Optional[str]
    generation: Optional[str]
    images: List[str]
    error: Optional[str]
    retry_count: int

def handle_initial_state(state: GraphState) -> GraphState:
    logger.info("---HANDLING INITIAL STATE---")
    chat_history = state.get("chat_history", [])
    if state.get("prompt"):
        chat_history.append(("user", state["prompt"]))
    
    state["chat_history"] = chat_history
    state["images"] = []
    state["error"] = None
    state["generation"] = None
    state["retry_count"] = state.get("retry_count", 0)
    return state

def clarification_node(state: GraphState):
    logger.info("---CLARIFICATION NODE---")
    
    file_provided = state.get("file_path") and os.path.exists(state["file_path"])

    system_prompt = prompt_factory.get_prompt("clarification_system")
    prompt_template = ChatPromptTemplate.from_messages([
        ("system", system_prompt),
        ("human", "User Prompt: {prompt}\nFile Provided: {file_provided}"),
    ])
    
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    chain = prompt_template | llm | JsonOutputParser()
    
    # Prepare a default response structure
    response_payload = GraphState(
        clarification_needed=False,
        clarification_question=None,
        generation=None,
        error=None
    )

    try:
        result = chain.invoke({
            "prompt": state["prompt"],
            "file_provided": file_provided,
        })
        
        action = result.get("action")
        logger.info(f"LLM decided action: {action}")

        if action == "request_file":
            response_payload["generation"] = result.get("response")
        elif action == "clarify":
            response_payload["clarification_needed"] = True
            response_payload["clarification_question"] = result.get("question")
            response_payload["generation"] = result.get("question")
        elif action != "generate_code":
            logger.error(f"Unexpected action from LLM: {action}")
            response_payload["error"] = f"Unexpected action: {action}"
            
    except Exception as e:
        logger.error(f"Error in clarification_node: {e}")
        response_payload["error"] = str(e)
        response_payload["generation"] = "I'm sorry, I had trouble understanding your request. Could you please rephrase it?"

    return response_payload

def code_generation_node(state: GraphState):
    logger.info("---GENERATING CODE---")
    retry_count = state.get("retry_count", 0)
    
    if retry_count > 0:
        logger.info(f"Retry attempt #{retry_count}")
        if state.get("error"):
            error_context = f"The previous code execution failed with error: {state['error']}. Please fix the issue and generate new code."
            state["chat_history"].append(("system", error_context))
    
    conversation = "\n".join([f"{role}: {text}" for role, text in state["chat_history"]])
    
    file_content = ""
    try:
        with open(state["file_path"], "r", encoding='utf-8') as f:
            file_content = f.read()
    except Exception as e:
        logger.error(f"Error reading file {state['file_path']}: {e}")
        return {"error": f"Failed to read the provided file: {e}"}

    filename = os.path.basename(state["file_path"])
    
    system_prompt = prompt_factory.get_prompt("code_generation_system")
    prompt_template = ChatPromptTemplate.from_messages([("system", system_prompt)])
    llm = ChatOpenAI(model="gpt-4o", temperature=0)
    chain = prompt_template | llm | StrOutputParser()
    
    logger.info(f"Invoking code generation with conversation: {conversation}")
    generation = chain.invoke({"conversation": conversation, "filename": filename, "file_content": file_content})
    
    if "```python" in generation:
        code_match = re.search(r"```python\n(.*?)\n```", generation, re.DOTALL)
        if code_match:
            generation = code_match.group(1)
    
    logger.info(f"---FINAL CODE---\n{generation}\n--------------------")
    return {"generation": generation, "error": None}  # Clear previous error

def code_execution_node(state: GraphState):
    if state.get("error") and state.get("retry_count", 0) == 0:
        return {}
    
    logger.info("---EXECUTING CODE---")
    current_retry = state.get("retry_count", 0)
    
    try:
        with Sandbox() as sandbox:
            execution = sandbox.run_code(state["generation"])
            if execution.error:
                error_msg = execution.error.to_json()
                logger.error(f"Code execution error (attempt {current_retry + 1}): {error_msg}")
                return {"error": error_msg, "retry_count": current_retry + 1}
            
            if execution.logs.stdout:
                logger.info("Code executed successfully, base64 image found")
                return {"images": [''.join(execution.logs.stdout)], "error": None, "retry_count": current_retry}
            
            error_message = "The code executed, but it did not print a base64 string to standard output."
            if execution.logs.stderr:
                error_message += f"\nExecution logs (stderr):\n{''.join(execution.logs.stderr)}"
            
            logger.error(f"No output error (attempt {current_retry + 1}): {error_message}")
            return {"error": error_message, "retry_count": current_retry + 1}
            
    except Exception as e:
        error_msg = str(e)
        logger.error(f"Sandbox exception (attempt {current_retry + 1}): {error_msg}")
        return {"error": error_msg, "retry_count": current_retry + 1}

def should_clarify(state: GraphState) -> str:
    """
    Determines the next step after the clarification node.
    """
    logger.info("---ROUTING BASED ON CLARIFICATION---")

    if state.get("error"):
        logger.error(f"Error detected, ending workflow. Error: {state['error']}")
        return "end"

    if state.get("generation"):
        logger.info("Response or question generated, ending for now.")
        return "end"
        
    if state.get("clarification_needed"):
        # This case might be redundant if generation is always populated, but good for safety.
        logger.info("Clarification is needed, ending to ask user.")
        return "end_for_clarification"

    logger.info("Proceeding to code generation.")
    return "generate_code"

def should_retry(state: GraphState) -> str:
    """Determine if we should retry code generation or end."""
    retry_count = state.get("retry_count", 0)
    has_error = state.get("error") is not None
    has_images = len(state.get("images", [])) > 0
    
    if has_images:
        logger.info("Code execution successful, ending workflow")
        return "end"
    
    if has_error and retry_count < 3:
        logger.info(f"Code execution failed (attempt {retry_count}/3), retrying...")
        return "retry_generate"
    
    if retry_count >= 3:
        logger.error("Maximum retry attempts (3) reached, ending workflow")
    
    return "end"

def build_graph():
    workflow = StateGraph(GraphState)
    workflow.add_node("start", handle_initial_state)
    workflow.add_node("clarify_check", clarification_node)
    workflow.add_node("generate_code", code_generation_node)
    workflow.add_node("execute_code", code_execution_node)
    
    workflow.set_entry_point("start")
    workflow.add_edge("start", "clarify_check")
    workflow.add_conditional_edges(
        "clarify_check",
        should_clarify,
        {"end_for_clarification": END, "generate_code": "generate_code", "end": END},
    )
    workflow.add_edge("generate_code", "execute_code")
    workflow.add_conditional_edges(
        "execute_code",
        should_retry,
        {"retry_generate": "generate_code", "end": END},
    )
    return workflow.compile() 