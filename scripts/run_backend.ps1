Set-Location "$PSScriptRoot\..\backend"
python -m uvicorn app.main:app --reload --port 8000
