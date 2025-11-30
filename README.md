# Aura Workout App 🏋️‍♂️✨

**Aura** is a next-generation AI-powered fitness application designed to provide personalized workout plans, real-time form correction, and intelligent coaching.

Built with **React**, **FastAPI**, and **Google Gemini**, Aura combines traditional workout tracking with cutting-edge Computer Vision and LLM technology.

## 🚀 Key Features

### 🧠 AI Workout Recommendations
-   Generates personalized weekly workout plans based on your age, weight, fitness level, and goals.
-   Adapts to your progress and feedback.

### 👁️ Aura Vision (AI Form Coach)
-   **Real-time Form Correction**: Uses your webcam and **MediaPipe** to track your body movements in real-time.
-   **Rep Counting**: Automatically counts reps for supported exercises.
-   **Multi-Exercise Support**: Currently supports **Squats**, **Pushups**, and **Bicep Curls**.
-   *Privacy Focused*: All video processing happens locally in your browser; no video is sent to the server.

### 💬 AI Chat Assistant
-   **RAG-Powered**: Chat with an AI coach that knows your workout context.
-   Powered by **Google Gemini 2.0 Flash** for fast, accurate fitness advice.

### ⚡ Guest Mode
-   Frictionless experience with no login required.
-   Plans are persisted locally, so you can pick up where you left off.

## 🛠️ Tech Stack

### Frontend
-   **React 19** (Vite)
-   **Tailwind CSS** (Styling)
-   **MediaPipe Pose** (Computer Vision)
-   **React Webcam**
-   **Lucide React** (Icons)

### Backend
-   **FastAPI** (Python)
-   **SQLite** (Database)
-   **Google Generative AI** (Gemini API)
-   **Scikit-learn** (Recommendation Engine)

## 📦 Installation & Setup

### Prerequisites
-   Node.js (v18+)
-   Python (v3.9+)
-   Google Gemini API Key

### 1. Clone the Repository
  - bash command
git clone [https://github.com/Anonymous-0143/aura-workout-app.git](https://github.com/Anonymous-0143/aura-workout-app.git)
cd aura-workout-app

## Backend Setup
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
echo "GEMINI_API_KEY=your_api_key_here" > .env

# Initialize Database
python init_db.py

# Run Server
uvicorn main:app --reload

## Frontend Setup
cd frontend

# Install dependencies
npm install

# Run Dev Server
npm run dev

🏃‍♂️ Usage
Open the app in your browser (usually http://localhost:5173).
Complete the Onboarding form to generate your plan.
View your Weekly Plan on the Dashboard.
Click "Start AI Coach" to try the real-time form correction.
Use the Chat button (bottom right) to ask fitness questions.
🛡️ Privacy Note
The Aura Vision feature processes video feeds entirely on your device (client-side) using MediaPipe. No video data is ever transmitted to our servers.
