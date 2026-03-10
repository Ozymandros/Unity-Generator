FROM python:3.11-slim

WORKDIR /workspaces/Unity-Generator/backend

COPY requirements.txt /workspaces/Unity-Generator/backend/requirements.txt
RUN pip install --no-cache-dir -r requirements.txt

COPY . /workspaces/Unity-Generator/backend

EXPOSE 35421
EXPOSE 5678

CMD ["python", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "35421"]
