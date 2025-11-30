from recommender import engine
from models import UserProfile, FitnessLevel, Goal

def test_recommendation():
    print("Testing Recommender Engine...")
    
    profile = UserProfile(
        age=25,
        weight=70.0,
        fitness_level=FitnessLevel.INTERMEDIATE,
        goal=Goal.MUSCLE_GAIN
    )
    
    print(f"User Profile: {profile}")
    
    plan = engine.predict(profile)
    
    print("\nGenerated Plan:")
    print(f"Advice: {plan.advice}")
    print(f"Number of workouts: {len(plan.schedule)}")
    
    for workout in plan.schedule:
        print(f"\n- {workout.day}: {workout.name} ({workout.duration_minutes} mins)")
        print(f"  Desc: {workout.description}")
        if workout.exercises:
            print("  Exercises:")
            for ex in workout.exercises[:3]: # Print first 3
                print(f"    * {ex.name}: {ex.sets} sets x {ex.reps} reps")
                print(f"      Image: {ex.image_url}")
            if len(workout.exercises) > 3:
                print(f"    ... and {len(workout.exercises) - 3} more")

if __name__ == "__main__":
    test_recommendation()
