import pytest
import os
import shutil
from pathlib import Path
from app.core.db import init_db

@pytest.fixture(autouse=True)
def setup_test_env(tmp_path):
    """
    Global fixture that runs before every test.
    Sets up a temporary database directory to ensure total isolation.
    """
    # Use a unique directory for each test
    db_dir = tmp_path / "db"
    db_dir.mkdir(parents=True, exist_ok=True)
    
    # Override environment variables for config.py
    os.environ["DATABASE_DIR"] = str(db_dir)
    os.environ["LOGS_DIR"] = str(tmp_path / "logs")
    os.environ["OUTPUT_DIR"] = str(tmp_path / "output")
    
    # Initialize the database in the temporary directory
    init_db()
    
    yield
    
    # Cleanup environment variables after test
    if "DATABASE_DIR" in os.environ:
        del os.environ["DATABASE_DIR"]
    if "LOGS_DIR" in os.environ:
        del os.environ["LOGS_DIR"]
    if "OUTPUT_DIR" in os.environ:
        del os.environ["OUTPUT_DIR"]
