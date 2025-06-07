from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from pydantic import BaseModel
import os
import base64
from datetime import datetime
from dotenv import load_dotenv
from .graph import build_graph, GraphState
import logging
import json
from typing import Optional, List, Tuple

load_dotenv()

app = FastAPI()

# Setup logging and directories
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)
os.makedirs("uploads", exist_ok=True)
os.makedirs("downloads", exist_ok=True)


ALLOWED_EXTENSIONS = {'csv', 'json', 'xls', 'xlsx'}

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

# Pydantic model for the response, matching GraphState
class GraphStateResponse(BaseModel):
    file_path: Optional[str]
    prompt: Optional[str]
    chat_history: List[Tuple[str, str]]
    clarification_needed: bool
    clarification_question: Optional[str]
    generation: Optional[str]
    images: List[str]
    error: Optional[str]

@app.get("/")
def read_root():
    return {"Hello": "World"}

@app.post("/chart", response_model=GraphStateResponse)
async def create_chart(
    prompt: str = Form(...),
    file: Optional[UploadFile] = File(None),
    state_json: Optional[str] = Form(None),
):
    logger.info("---Received chart request---")
    
    current_state = {}
    if state_json:
        logger.info("Follow-up request detected.")
        try:
            current_state = json.loads(state_json)
            if not current_state.get("file_path") or not os.path.exists(current_state.get("file_path")):
                logger.warning("Follow-up request with invalid file_path, treating as new conversation.")
                current_state = {}
        except json.JSONDecodeError:
            logger.error("Failed to parse state_json.")
            current_state = {}

    elif file:
        logger.info("New request with file detected.")
        if not allowed_file(file.filename):
            raise HTTPException(status_code=400, detail="Invalid file type.")
        
        # Use a more secure way to save files in a real app
        file_path = os.path.join("uploads", file.filename)
        with open(file_path, "wb") as buffer:
            buffer.write(await file.read())
        logger.info(f"File saved to {file_path}")
        
        current_state["file_path"] = file_path
    else:
        logger.info("New conversational request without file. Passing to the graph.")
        current_state = {}

    current_state["prompt"] = prompt

    try:
        langgraph_app = build_graph()
        final_state = langgraph_app.invoke(current_state)

        if final_state.get("images"):
            try:
                # Ensure image data is a single base64 string
                img_data_list = final_state["images"]
                if img_data_list and isinstance(img_data_list[0], str):
                    img_data = base64.b64decode(img_data_list[0])
                    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                    filename = f"chart_{timestamp}.png"
                    image_path = os.path.join("downloads", filename)
                    with open(image_path, "wb") as f:
                        f.write(img_data)
                    logger.info(f"Image saved successfully to {image_path}")
            except Exception as e:
                logger.error(f"Failed to save image: {e}")
                # Don't overwrite the main error, but log this one.
        
        # Create a complete default state to merge with the final state
        default_state = GraphState(
            file_path=None,
            prompt=prompt,
            chat_history=[],
            clarification_needed=False,
            clarification_question=None,
            generation=None,
            images=[],
            error=None,
            retry_count=0
        )
        
        # Merge final_state into default_state
        complete_state = {**default_state, **final_state}

        logger.info(f"Returning final state: {complete_state}")
        # Ensure the response matches the Pydantic model
        return GraphStateResponse(**complete_state)
    
    except Exception as e:
        logger.error(f"Error invoking graph or processing request: {e}", exc_info=True)
        # Return a structured error response that the frontend can handle
        return GraphStateResponse(
            file_path=current_state.get("file_path"),
            prompt=prompt,
            chat_history=[("user", prompt)],
            clarification_needed=False,
            clarification_question=None,
            generation=f"I apologize, but an unexpected error occurred on the server. Please try again. Error: {str(e)}",
            images=[],
            error=str(e),
        ) 