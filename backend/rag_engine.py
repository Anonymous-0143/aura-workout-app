import os
import google.generativeai as genai
import sqlite3
import pandas as pd
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure Gemini
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
else:
    print("Warning: GEMINI_API_KEY not found in environment variables.")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DB_PATH = os.path.join(BASE_DIR, "workout.db")

class RAGEngine:
    def __init__(self):
        self.model = genai.GenerativeModel('gemini-2.0-flash')

    def _extract_keywords(self, query):
        """
        Extracts 1-2 search keywords from the user query using the LLM.
        """
        try:
            prompt = f"Extract 1 or 2 main search keywords from this fitness query. Return ONLY the keywords separated by space. Query: {query}"
            response = self.model.generate_content(prompt)
            keywords = response.text.strip().split()
            return keywords[:2] # Limit to 2 keywords
        except:
            return [query]

    def _retrieve_context(self, query):
        """
        Keyword-based retrieval from the database.
        """
        context_parts = []
        try:
            conn = sqlite3.connect(DB_PATH)
            
            # Extract keywords
            keywords = self._extract_keywords(query)
            print(f"Search keywords: {keywords}")
            
            for keyword in keywords:
                query_term = f"%{keyword}%"
                
                # 1. Search Programs
                df_programs = pd.read_sql(
                    "SELECT title, description, level, goal FROM programs WHERE title LIKE ? OR description LIKE ? LIMIT 2",
                    conn,
                    params=(query_term, query_term)
                )
                
                if not df_programs.empty:
                    context_parts.append(f"Found Programs for '{keyword}':")
                    for _, row in df_programs.iterrows():
                        context_parts.append(f"- {row['title']} ({row['level']}, {row['goal']}): {row['description']}")

                # 2. Search Exercises
                df_exercises = pd.read_sql(
                    "SELECT DISTINCT exercise_name, intensity FROM program_details WHERE exercise_name LIKE ? LIMIT 3",
                    conn,
                    params=(query_term,)
                )
                
                if not df_exercises.empty:
                    context_parts.append(f"\nFound Exercises for '{keyword}':")
                    for _, row in df_exercises.iterrows():
                        context_parts.append(f"- {row['exercise_name']} (Intensity: {row['intensity']})")

            conn.close()
            
            if not context_parts:
                return "No specific workout data found in the database for this query."
            
            return "\n".join(context_parts)

        except Exception as e:
            print(f"Error retrieving context: {e}")
            return "Error retrieving database context."

    def generate_response(self, user_query):
        if not GEMINI_API_KEY:
            return "I'm sorry, but the AI service is not configured (missing API Key)."

        context = self._retrieve_context(user_query)
        
        system_prompt = f"""
        You are an expert fitness coach for the Aura Workout App.
        Answer the user's question based on the following context from our database.
        
        Context:
        {context}
        
        User Question: {user_query}
        
        If the context doesn't answer the question, use your general fitness knowledge but mention that it's general advice.
        Keep the answer concise, motivating, and safe.
        """
        
        try:
            response = self.model.generate_content(system_prompt)
            return response.text
        except Exception as e:
            return f"I encountered an error generating a response: {str(e)}"

rag_engine = RAGEngine()
