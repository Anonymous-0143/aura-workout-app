import sqlite3
import pandas as pd
import os

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
ARCHIVE_DIR = os.path.join(BASE_DIR, "..", "archive")
DB_PATH = os.path.join(BASE_DIR, "workout.db")

SUMMARY_CSV = os.path.join(ARCHIVE_DIR, "program_summary.csv")
DETAILED_CSV = os.path.join(ARCHIVE_DIR, "programs_detailed_boostcamp_kaggle.csv")

def init_db():
    print(f"Initializing database at {DB_PATH}...")
    conn = sqlite3.connect(DB_PATH)
    
    # Load Summary CSV
    if os.path.exists(SUMMARY_CSV):
        print(f"Loading {SUMMARY_CSV}...")
        df_summary = pd.read_csv(SUMMARY_CSV)
        # Clean column names
        df_summary.columns = [c.lower().replace(" ", "_") for c in df_summary.columns]
        df_summary.to_sql("programs", conn, if_exists="replace", index=False)
        print("Loaded programs table.")
    else:
        print(f"Error: {SUMMARY_CSV} not found.")

    # Load Detailed CSV
    if os.path.exists(DETAILED_CSV):
        print(f"Loading {DETAILED_CSV}...")
        # Read in chunks to avoid memory issues
        chunksize = 100000
        first_chunk = True
        for chunk in pd.read_csv(DETAILED_CSV, chunksize=chunksize):
            # Clean column names
            chunk.columns = [c.lower().replace(" ", "_") for c in chunk.columns]
            
            if first_chunk:
                chunk.to_sql("program_details", conn, if_exists="replace", index=False)
                first_chunk = False
            else:
                chunk.to_sql("program_details", conn, if_exists="append", index=False)
            print(f"Processed chunk of {len(chunk)} rows...")
        print("Loaded program_details table.")
    else:
        print(f"Error: {DETAILED_CSV} not found.")

    # Create indices for faster lookup
    print("Creating indices...")
    cursor = conn.cursor()
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_programs_title ON programs(title)")
    cursor.execute("CREATE INDEX IF NOT EXISTS idx_details_title ON program_details(title)")
    conn.commit()
    
    conn.close()
    print("Database initialization complete.")

if __name__ == "__main__":
    init_db()
