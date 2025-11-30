from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
import uuid

from models import UserProfile, WeeklyPlan, WorkoutLog
from recommender import engine
from rag_engine import rag_engine

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
