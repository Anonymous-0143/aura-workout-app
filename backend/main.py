from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uuid
import json

from models import UserProfile, WeeklyPlan, WorkoutLog
from recommender import engine
from rag_engine import rag_engine
from vision_engine import VisionEngine

app = FastAPI()

origins = [
    "http://localhost:5173",
    "http://localhost:3000",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

vision_engine = VisionEngine()

@app.get("/")
def read_root():
    return {"message": "Welcome to the Workout Recommendation API"}

# Mock Database for Guest History
guest_history = []

@app.post("/recommend", response_model=WeeklyPlan)
def get_recommendation(profile: UserProfile):
    try:
        plan = engine.predict(profile)
        return plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workouts/log", response_model=dict)
async def log_workout(log: WorkoutLog):
    try:
        guest_history.append(log)
        return {"message": "Workout logged successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/workouts/history", response_model=list[WorkoutLog])
async def get_workout_history():
    return guest_history

class ChatRequest(BaseModel):
    message: str

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    response = rag_engine.generate_response(request.message)
    return {"response": response}

@app.websocket("/ws/vision")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            message = await websocket.receive()
            
            if "text" in message:
                text = message["text"]
                if text.startswith("exercise:"):
                    exercise = text.split(":")[1]
                    vision_engine.reset_state(exercise)
                    await websocket.send_json({"status": "exercise_updated", "exercise": exercise})
            elif "bytes" in message:
                frame_bytes = message["bytes"]
                result = vision_engine.process_frame(frame_bytes)
                if result:
                    await websocket.send_json(result)
                    
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"Error: {e}")
        try:
            await websocket.close()
        except:
            pass
