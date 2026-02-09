import requests


def main() -> None:
    response = requests.get("http://127.0.0.1:8000/health", timeout=10)
    response.raise_for_status()
    print(response.json())


if __name__ == "__main__":
    main()
