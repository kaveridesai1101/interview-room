from backend.database import SessionLocal, engine, Base 
from sqlalchemy import text

def reset_database():
    print("WARNING: Purging all database content for Real-Data Mode compliance...")
    
    # Drop all tables and recreate them to ensure a clean slate
    Base.metadata.drop_all(bind=engine)
    Base.metadata.create_all(bind=engine)
    
    print("Database purged successfully.")
    print("Users, Cameras, and Incidents have been reset to 0.")

if __name__ == "__main__":
    reset_database()
