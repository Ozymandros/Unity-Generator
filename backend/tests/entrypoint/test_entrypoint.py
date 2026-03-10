"""
Unit tests for backend entrypoint module.

These tests validate that the entrypoint module can be imported and executed
correctly, which ensures PyInstaller will be able to package it successfully.

IMPORTANT: These tests run in ISOLATED mode and do NOT test production builds.
"""
from unittest.mock import patch


def test_entrypoint_module_imports():
    """Test that entrypoint module can be imported without errors."""
    # This validates the import structure works
    from app import entrypoint

    assert hasattr(entrypoint, 'main')
    assert callable(entrypoint.main)


def test_entrypoint_imports_app_main():
    """Test that entrypoint can import app.main successfully.

    This is the critical import that was failing in PyInstaller builds.
    """
    from app.main import app

    assert app is not None
    assert hasattr(app, 'routes')


@patch('uvicorn.run')
def test_entrypoint_main_function(mock_uvicorn_run):
    """Test that entrypoint.main() calls uvicorn.run with default port when PORT unset."""
    from app import entrypoint

    with patch.dict('app.entrypoint.os.environ', {}, clear=True):
        entrypoint.main()

    mock_uvicorn_run.assert_called_once()
    call_args = mock_uvicorn_run.call_args
    assert call_args[0][0] is not None
    assert call_args[1]['host'] == '127.0.0.1'
    assert call_args[1]['port'] == entrypoint.DEFAULT_PORT


@patch('uvicorn.run')
def test_entrypoint_main_function_respects_port_env(mock_uvicorn_run):
    """Test that entrypoint.main() uses PORT env when set."""
    from app import entrypoint

    with patch.dict('app.entrypoint.os.environ', {'PORT': '35500'}):
        entrypoint.main()

    mock_uvicorn_run.assert_called_once()
    assert mock_uvicorn_run.call_args[1]['port'] == 35500


@patch('uvicorn.run')
def test_entrypoint_main_function_invalid_port_falls_back_to_default(mock_uvicorn_run):
    """Test that invalid PORT env falls back to DEFAULT_PORT."""
    from app import entrypoint

    with patch.dict('app.entrypoint.os.environ', {'PORT': 'not_a_number'}):
        entrypoint.main()

    assert mock_uvicorn_run.call_args[1]['port'] == entrypoint.DEFAULT_PORT


def test_entrypoint_import_inside_function():
    """Test that importing app.main inside a function works.

    This simulates how PyInstaller executes the entrypoint where
    the import happens inside main() rather than at module level.
    """
    def simulate_pyinstaller_execution():
        from app.main import app
        return app

    app = simulate_pyinstaller_execution()
    assert app is not None
