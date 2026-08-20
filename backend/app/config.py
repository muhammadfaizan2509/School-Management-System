import os

class Settings:
    PROJECT_NAME: str = "INFORMATION TECHNOLOGY COLLEGE GHOTKI"
    PROJECT_VERSION: str = "1.0.0"
    
    SECRET_KEY: str = os.getenv("SECRET_KEY", "super-secret-school-management-key-2026-secure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # SQLite Database URI (Relative to backend folder)
    BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    DATABASE_URL: str = f"sqlite:///{os.path.join(BASE_DIR, 'school_system.db')}"

settings = Settings()
