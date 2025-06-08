from fastapi import FastAPI, File, UploadFile, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
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

# In production, this should be set to the frontend's URL.
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000").split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Setup logging and directories
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

UPLOAD_DIR = os.getenv("UPLOAD_DIR", "uploads")
DOWNLOAD_DIR = os.getenv("DOWNLOAD_DIR", "downloads")

os.makedirs(UPLOAD_DIR, exist_ok=True)
os.makedirs(DOWNLOAD_DIR, exist_ok=True)


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
        logger.info(f"Received state_json: {state_json}")
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
        
        file_path = os.path.join(UPLOAD_DIR, file.filename)
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
                img_data_list = final_state["images"]
                if img_data_list and isinstance(img_data_list[0], str):
                    img_data = base64.b64decode(img_data_list[0])
                    timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
                    filename = f"chart_{timestamp}.png"
                    image_path = os.path.join(DOWNLOAD_DIR, filename)
                    with open(image_path, "wb") as f:
                        f.write(img_data)
                    logger.info(f"Image saved successfully to {image_path}")
            except Exception as e:
                logger.error(f"Failed to save image: {e}")

        default_state = GraphState(
            file_path=current_state.get("file_path"),
            prompt=prompt,
            chat_history=[],
            clarification_needed=False,
            clarification_question=None,
            generation=None,
            images=[],
            error=None,
            retry_count=0
        )
        
        complete_state = {**default_state, **final_state}

        logger.info(f"Returning final state: {complete_state}")
        return GraphStateResponse(**complete_state)
    
    except Exception as e:
        logger.error(f"Error invoking graph or processing request: {e}", exc_info=True)
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