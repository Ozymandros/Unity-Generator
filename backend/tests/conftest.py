
import os

import pyfakefs.fake_filesystem_unittest
import pytest

from app.core.db import init_db


@pytest.fixture(autouse=True)
def setup_test_env(tmp_path):
    """
    Global fixture that runs before every test.
    Sets up a temporary database directory to ensure total isolation.
    """
    # Create directories on REAL filesystem BEFORE pyfakefs starts
    # Since sqlite3 bypasses pyfakefs, it needs the directories to exist on the real OS
    db_path = tmp_path / "db"
    db_path.mkdir(parents=True, exist_ok=True)

    logs_path = tmp_path / "logs"
    logs_path.mkdir(parents=True, exist_ok=True)

    output_path = tmp_path / "output"
    output_path.mkdir(parents=True, exist_ok=True)

    # Start pyfakefs patcher
    fs_patcher = pyfakefs.fake_filesystem_unittest.Patcher()
    fs_patcher.setUp()

    # Map the real tmp_path into the fake filesystem so it's accessible to both patched and unpatched code
    if not fs_patcher.fs:
        raise Exception("fs_patcher.fs is None")

    fs_patcher.fs.add_real_directory(str(tmp_path))

    # Override environment variables for config.py
    os.environ["DATABASE_DIR"] = str(db_path)
    os.environ["LOGS_DIR"] = str(logs_path)
    os.environ["OUTPUT_DIR"] = str(output_path)

    # Initialize the database in the temporary directory
    init_db()
    # Seed default providers (api_key_name = provider name) and load registry
    from app.core.seeder import seed_database
    from app.services.providers.registry import provider_registry
    seed_database()
    provider_registry.load_from_db()

    yield

    # Cleanup environment variables after test
    if "DATABASE_DIR" in os.environ:
        del os.environ["DATABASE_DIR"]
    if "LOGS_DIR" in os.environ:
        del os.environ["LOGS_DIR"]
    if "OUTPUT_DIR" in os.environ:
        del os.environ["OUTPUT_DIR"]

    # Stop pyfakefs patcher
    fs_patcher.tearDown()
