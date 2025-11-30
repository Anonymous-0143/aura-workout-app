from pydantic import BaseModel
from typing import List, Optional
from enum import Enum

class FitnessLevel(str, Enum):
    BEGINNER = "Beginner"
    INTERMEDIATE = "Intermediate"
    ADVANCED = "Advanced"

class Goal(str, Enum):
    WEIGHT_LOSS = "Weight Loss"
    MUSCLE_GAIN = "Muscle Gain"
    ENDURANCE = "Endurance"
    FLEXIBILITY = "Flexibility"

class UserProfile(BaseModel):
    age: int
    weight: float
    fitness_level: FitnessLevel
    goal: Goal

class Exercise(BaseModel):
    name: str
    sets: str
    reps: str
    intensity: Optional[str] = None
    image_url: Optional[str] = None

class Workout(BaseModel):
    id: str
    name: str
    description: str
    duration_minutes: int
    difficulty: str
    day: str
    image_url: Optional[str] = None
    video_url: Optional[str] = None
    exercises: List[Exercise] = []

class WorkoutLog(BaseModel):
    id: str
    date: str
    workout_name: str
    duration_minutes: int
    notes: Optional[str] = None

class WeeklyPlan(BaseModel):
    recommendation_id: str
    user_goal: str
    schedule: List[Workout]
    advice: str
