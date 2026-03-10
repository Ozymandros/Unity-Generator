import os

import requests

DEFAULT_BACKEND_PORT = 35421


def main() -> None:
    port = os.environ.get("BACKEND_PORT", str(DEFAULT_BACKEND_PORT))
    url = f"http://127.0.0.1:{port}/health"
    response = requests.get(url, timeout=10)
    response.raise_for_status()
    print(response.json())


if __name__ == "__main__":
    main()
