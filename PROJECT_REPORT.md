# Project Documentation: Aura Workout App

## 1. Project Overview
Aura is an intelligent workout application that provides personalized workout plans and real-time AI coaching. It uses a hybrid recommendation engine to suggest workouts based on user goals and fitness levels, and a computer vision-based "AI Coach" to track exercise form and count reps using the webcam.

## 2. Architecture & Flow

### High-Level Flow
1.  **User Onboarding**: The user inputs their fitness level (Beginner/Intermediate/Advanced) and goal (Weight Loss/Muscle Gain/etc.).
2.  **Recommendation Engine**:
    *   The backend processes this profile.
    *   **Primary System**: A Neural Network (TensorFlow/Keras) predicts the most suitable "Workout Type" (classification).
    *   **Retrieval**: The system searches the SQLite database (`workout.db`) for programs matching the predicted type.
    *   **Fallback**: If the NN is uncertain or data is missing, a K-Nearest Neighbors (KNN) model finds the closest matching program based on feature vectors.
3.  **Frontend Display**: The recommended weekly plan is sent to the frontend (React) and cached in `localStorage` for quick access.
4.  **Workout Execution**:
    *   User selects a workout.
    *   **AI Coach**: The `AuraVision` component uses MediaPipe Pose to track 33 body landmarks in real-time.
    *   It calculates joint angles (e.g., hip-knee-ankle for squats) to count reps and provide form feedback (e.g., "Go lower").

## 3. Technology Stack

### Frontend
-   **Framework**: React 19 (Vite)
-   **Styling**: TailwindCSS 4 + Vanilla CSS (Glassmorphism design system)
-   **AI/CV**: `@mediapipe/pose` (Real-time body tracking)
-   **State Management**: React Hooks + LocalStorage
-   **Icons**: Lucide React

### Backend
-   **Framework**: FastAPI (Python)
-   **ML Core**: TensorFlow 2 (Keras), Scikit-learn
-   **Data Processing**: Pandas, NumPy
-   **Database**: SQLite (`workout.db`) with ~2600 workout variations
-   **Computer Vision**: MediaPipe Python (for server-side validation/testing)

## 4. Machine Learning Model Details

### Recommendation Model (`backend/train_recommender.py`)
-   **Type**: Multi-class Classification Neural Network.
-   **Input Features**:
    *   Fitness Level (Encoded)
    *   User Goal (Encoded)
-   **Architecture**:
    *   Input Layer: 2 neurons
    *   Hidden Layer 1: 64 neurons (ReLU activation)
    *   Dropout Layer: 0.2 (to prevent overfitting)
    *   Hidden Layer 2: 32 neurons (ReLU activation)
    *   Output Layer: Softmax (Probability distribution over workout types)
-   **Performance**:
    *   **Accuracy**: ~99.9% (Test Set)
    *   **Loss**: < 0.01 (Sparse Categorical Crossentropy)

### AI Coach Logic (`frontend/src/utils/poseLogic.js`)
-   **Mechanism**: Geometric heuristic analysis.
-   **Tracking**: Bilateral (tracks both left and right sides automatically based on visibility).
-   **Logic**: Calculates angles between 3 landmarks (e.g., Shoulder-Elbow-Wrist for Pushups) to determine implementation state (UP/DOWN/HOLD).


