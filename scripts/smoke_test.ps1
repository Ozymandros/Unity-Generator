$baseUrl = "http://127.0.0.1:8000"

Write-Host "Health check..."
Invoke-RestMethod "$baseUrl/health"

Write-Host "Text generation smoke test..."
$body = @{
  prompt = "Write a one-line NPC dialogue."
  provider = ""
  options = @{ }
} | ConvertTo-Json

Invoke-RestMethod "$baseUrl/generate/text" -Method Post -Body $body -ContentType "application/json"
