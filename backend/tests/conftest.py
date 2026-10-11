import sys
from pathlib import Path
import pytest

# Ensure backend directory is in sys.path
backend_path = Path(__file__).resolve().parent.parent
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.core.state import app_state

@pytest.fixture(scope="session", autouse=True)
def setup_app_state():
    app_state.initialize()
    return app_state
