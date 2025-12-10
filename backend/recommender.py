import pandas as pd
from sklearn.neighbors import NearestNeighbors
from sklearn.preprocessing import MultiLabelBinarizer
import numpy as np
from models import UserProfile, WeeklyPlan, Workout, FitnessLevel, Goal, Exercise
import uuid
import os
import sqlite3
import ast
import random

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "workout.db")

class RecommenderEngine:
    def __init__(self):
        self.mlb_fitness = MultiLabelBinarizer()
        self.mlb_goal = MultiLabelBinarizer()
        self.model = None # NN Model
        self.encoders = None
        self.knn_model = NearestNeighbors(n_neighbors=1, metric='hamming') # Fallback
        self.df_programs = pd.DataFrame()
        
        # Load Data for Fallback
        if os.path.exists(DB_PATH):
            self._load_data_and_train()
        else:
            print(f"Warning: Database not found at {DB_PATH}")

        # Load Trained NN Model
        self._load_nn_model()

    def _load_nn_model(self):
        try:
            model_path = os.path.join(BASE_DIR, "workout_model.h5")
            encoder_path = os.path.join(BASE_DIR, "encoders.pkl")
            
            if os.path.exists(model_path) and os.path.exists(encoder_path):
                import tensorflow as tf
                import pickle
                self.model = tf.keras.models.load_model(model_path)
                with open(encoder_path, "rb") as f:
                    self.encoders = pickle.load(f)
                print("Trained Neural Network model loaded successfully.")
            else:
                print("Trained model not found. Using KNN fallback.")
        except Exception as e:
            print(f"Error loading NN model: {e}")

    def _load_data_and_train(self):
        try:
            conn = sqlite3.connect(DB_PATH)
            self.df_programs = pd.read_sql("SELECT * FROM programs", conn)
            conn.close()

            # Filter out invalid programs (numeric titles or too short)
            # Remove rows where title is purely numeric
            self.df_programs = self.df_programs[~self.df_programs['title'].astype(str).str.match(r'^\d+$')]
            # Remove rows where title is suspiciously short
            self.df_programs = self.df_programs[self.df_programs['title'].astype(str).str.len() >= 3]


            # Parse stringified lists
            self.df_programs['level_list'] = self.df_programs['level'].apply(lambda x: self._safe_eval(x))
            self.df_programs['goal_list'] = self.df_programs['goal'].apply(lambda x: self._safe_eval(x))

            # Create feature matrix for KNN fallback
            all_levels = set([item for sublist in self.df_programs['level_list'] for item in sublist])
            all_goals = set([item for sublist in self.df_programs['goal_list'] for item in sublist])
            
            self.mlb_fitness.fit([list(all_levels)])
            self.mlb_goal.fit([list(all_goals)])
            
            X_fitness = self.mlb_fitness.transform(self.df_programs['level_list'])
            X_goal = self.mlb_goal.transform(self.df_programs['goal_list'])
            
            self.X = np.hstack([X_fitness, X_goal])
            self.knn_model.fit(self.X)
            print(f"KNN Recommender trained on {len(self.df_programs)} programs.")
            
        except Exception as e:
            print(f"Error loading data: {e}")

    def _safe_eval(self, x):
        try:
            return ast.literal_eval(x)
        except:
            return []

    def predict(self, profile: UserProfile) -> WeeklyPlan:
        # Try NN Prediction first
        if self.model and self.encoders:
            try:
                print("Using Neural Network for prediction...")
                # Encode inputs
                fitness_val = profile.fitness_level.value
                goal_val = profile.goal.value
                
                # Handle potential encoding errors if value not seen during training
                try:
                    f_enc = self.encoders['fitness'].transform([fitness_val])[0]
                    g_enc = self.encoders['goal'].transform([goal_val])[0]
                except ValueError:
                    print("Input value not seen in training. Falling back to KNN.")
                    raise ValueError("Unknown category")

                # Predict
                prediction = self.model.predict([[f_enc, g_enc]])
                predicted_class = np.argmax(prediction)
                predicted_workout_type = self.encoders['target'].inverse_transform([predicted_class])[0]
                
                print(f"NN Predicted Workout Type: {predicted_workout_type}")
                
                # Find matching program in DB
                # We assume 'workout_type' maps to 'title' or we search for it
                # For now, let's try to find a program where title contains this string
                # or is close to it.
                
                # Simple exact match or substring match
                matches = self.df_programs[self.df_programs['title'].str.contains(predicted_workout_type, case=False, regex=False)]
                
                if not matches.empty:
                    program = matches.iloc[0]
                    return self._generate_plan_from_program(program, profile)
                else:
                    print(f"No program found for type '{predicted_workout_type}'. Falling back.")
                    
            except Exception as e:
                print(f"NN Prediction failed: {e}")
                # Fall through to KNN

        # Fallback to KNN
        if self.df_programs.empty:
            return self._generate_fallback_plan(profile)

        try:
            print("Using KNN Fallback...")
            level_map = {
                FitnessLevel.BEGINNER: ['Beginner', 'Novice'],
                FitnessLevel.INTERMEDIATE: ['Intermediate'],
                FitnessLevel.ADVANCED: ['Advanced']
            }
            
            goal_map = {
                Goal.WEIGHT_LOSS: ['Fat Loss', 'Cardio', 'Athletics'],
                Goal.MUSCLE_GAIN: ['Bodybuilding', 'Muscle & Sculpting', 'Powerbuilding', 'Hypertrophy'],
                Goal.ENDURANCE: ['Athletics', 'Cardio'],
                Goal.FLEXIBILITY: ['Yoga', 'Mobility']
            }

            user_levels = level_map.get(profile.fitness_level, [])
            user_goals = goal_map.get(profile.goal, [])
            
            valid_levels = [l for l in user_levels if l in self.mlb_fitness.classes_]
            valid_goals = [g for g in user_goals if g in self.mlb_goal.classes_]
            
            if not valid_levels: valid_levels = []
            if not valid_goals: valid_goals = []

            u_fitness = self.mlb_fitness.transform([valid_levels])
            u_goal = self.mlb_goal.transform([valid_goals])
            
            query_vec = np.hstack([u_fitness, u_goal])
            
            distances, indices = self.knn_model.kneighbors(query_vec)
            best_idx = indices[0][0]
            program = self.df_programs.iloc[best_idx]
            
            return self._generate_plan_from_program(program, profile)

        except Exception as e:
            print(f"Prediction error: {e}")
            return self._generate_fallback_plan(profile)

    def _generate_plan_from_program(self, program, profile):
        title = program['title']
        description = program['description']
        
        # Fetch details from DB
        conn = sqlite3.connect(DB_PATH)
        # Get first week's schedule
        query = "SELECT * FROM program_details WHERE title = ? AND week = 1 ORDER BY day"
        df_details = pd.read_sql(query, conn, params=(title,))
        conn.close()
        
        # Exercise image mapping (placeholders/public GIFs)
        # Exercise image mapping (Static Gym Photos)
        # Using a sleek gym aesthetic photo for all exercises as requested
        GYM_PHOTO_URL = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80"
        
        EXERCISE_IMAGES = {
            "squat": GYM_PHOTO_URL,
            "pushup": GYM_PHOTO_URL,
            "push up": GYM_PHOTO_URL,
            "bench press": GYM_PHOTO_URL,
            "row": GYM_PHOTO_URL,
            "lunge": GYM_PHOTO_URL,
            "deadlift": GYM_PHOTO_URL,
            "pullup": GYM_PHOTO_URL,
            "pull up": GYM_PHOTO_URL,
            "curl": GYM_PHOTO_URL,
            "press": GYM_PHOTO_URL,
        }

        def get_exercise_image(name):
            name_lower = name.lower()
            for key, url in EXERCISE_IMAGES.items():
                if key in name_lower:
                    return url
            return "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=1200&q=80" # Default

        schedule = []
        if not df_details.empty:
            # Group by day
            for day_num, group in df_details.groupby('day'):
                # Construct description from exercises
                exercises_desc = []
                workout_exercises = []
                
                for _, row in group.iterrows():
                    ex_name = row['exercise_name']
                    sets = str(row['sets'])
                    reps = str(row['reps'])
                    intensity = row['intensity'] if pd.notnull(row['intensity']) else None
                    
                    exercises_desc.append(f"{ex_name} ({sets}x{reps})")
                    
                    workout_exercises.append(Exercise(
                        name=ex_name,
                        sets=sets,
                        reps=reps,
                        intensity=str(intensity) if intensity else None,
                        image_url=get_exercise_image(ex_name)
                    ))
                
                desc_str = ", ".join(exercises_desc[:5]) # Limit to 5 for brevity
                if len(exercises_desc) > 5:
                    desc_str += f", +{len(exercises_desc)-5} more"
                
                # Map day number to name
                day_names = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]
                day_idx = (int(day_num) - 1) % 7
                day_name = day_names[day_idx]
                
                schedule.append(Workout(
                    id=str(uuid.uuid4()),
                    name=f"Day {int(day_num)}: {title[:20]}...",
                    description=desc_str,
                    duration_minutes=int(program['time_per_workout']) if pd.notnull(program['time_per_workout']) else 60,
                    difficulty=profile.fitness_level.value,
                    day=day_name,
                    image_url="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80", # Placeholder
                    exercises=workout_exercises
                ))
        else:
            # Fallback if no details found (shouldn't happen if DB is consistent)
             schedule.append(Workout(
                id=str(uuid.uuid4()),
                name=title,
                description=description,
                duration_minutes=60,
                difficulty=profile.fitness_level.value,
                day="Monday",
                image_url="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80"
            ))

        return WeeklyPlan(
            recommendation_id=str(uuid.uuid4()),
            user_goal=profile.goal.value,
            schedule=schedule,
            advice=f"Based on your goal of {profile.goal.value}, we recommend: {title}. {description[:100]}..."
        )

    def _generate_fallback_plan(self, profile):
        # ... (Keep existing fallback logic or simplified version)
        schedule = [
            Workout(
                name="Full Body Strength",
                description="Squat, Pushup, Row",
                duration_minutes=45,
                difficulty=profile.fitness_level.value,
                day="Monday",
                image_url="https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=800&q=80"
            ),
             Workout(
                name="Cardio",
                description="30 mins Jog",
                duration_minutes=30,
                difficulty=profile.fitness_level.value,
                day="Wednesday",
                image_url="https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&w=800&q=80"
            )
        ]
        return WeeklyPlan(
            recommendation_id=str(uuid.uuid4()),
            user_goal=profile.goal.value,
            schedule=schedule,
            advice="Could not find a specific program, but here is a balanced routine for you."
        )

engine = RecommenderEngine()

