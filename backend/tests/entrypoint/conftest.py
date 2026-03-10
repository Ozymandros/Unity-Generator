"""
Isolated test configuration for entrypoint tests.

These tests do NOT use the global setup_test_env fixture because they only
test import mechanics and don't need database/filesystem setup.
"""
import pytest


# Override the global autouse fixture for this directory
@pytest.fixture(autouse=True, scope="function")
def setup_test_env():
    """
    Override the global setup_test_env fixture with a no-op version.

    Entrypoint tests only validate import mechanics and don't need
    database or filesystem setup.
    """
    # Do nothing - just override the parent fixture
    yield
