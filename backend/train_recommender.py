import os
import pandas as pd
import numpy as np
import pickle
import tensorflow as tf
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from tensorflow.keras.models import Sequential
from tensorflow.keras.layers import Dense, Dropout

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_PATH = os.path.join(BASE_DIR, "backend", "data", "workout_data.csv")
MODEL_PATH = os.path.join(BASE_DIR, "workout_model.h5")
ENCODER_PATH = os.path.join(BASE_DIR, "encoders.pkl")

def train_model():
    print("Loading data...")
    if not os.path.exists(DATA_PATH):
        print(f"Error: Data file not found at {DATA_PATH}")
        return

    df = pd.read_csv(DATA_PATH)
    
    # Preprocessing
    print("Preprocessing data...")
    le_fitness = LabelEncoder()
    le_goal = LabelEncoder()
    le_target = LabelEncoder()
    
    df['fitness_level_encoded'] = le_fitness.fit_transform(df['fitness_level'])
    df['goal_encoded'] = le_goal.fit_transform(df['goal'])
    df['workout_type_encoded'] = le_target.fit_transform(df['workout_type'])
    
    # Features and Target
    X = df[['fitness_level_encoded', 'goal_encoded']].values
    y = df['workout_type_encoded'].values
    
    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    # Model Architecture
    print("Building model...")
    model = Sequential([
        Dense(64, activation='relu', input_shape=(2,)),
        Dropout(0.2),
        Dense(32, activation='relu'),
        Dense(len(le_target.classes_), activation='softmax')
    ])
    
    model.compile(optimizer='adam',
                  loss='sparse_categorical_crossentropy',
                  metrics=['accuracy'])
    
    # Training
    print("Starting training...")
    history = model.fit(X_train, y_train, 
                        epochs=50, 
                        batch_size=32, 
                        validation_data=(X_test, y_test),
                        verbose=1)
    
    # Evaluation
    loss, accuracy = model.evaluate(X_test, y_test, verbose=0)
    print(f"\nTraining Complete!")
    print(f"Final Test Accuracy: {accuracy*100:.2f}%")
    
    # Save Artifacts
    print("Saving model and encoders...")
    model.save(MODEL_PATH)
    
    encoders = {
        "fitness": le_fitness,
        "goal": le_goal,
        "target": le_target
    }
    
    with open(ENCODER_PATH, "wb") as f:
        pickle.dump(encoders, f)
        
    print(f"Model saved to {MODEL_PATH}")
    print(f"Encoders saved to {ENCODER_PATH}")

if __name__ == "__main__":
    train_model()
