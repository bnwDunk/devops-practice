param(
  [string]$BaseUrl = "http://localhost"
)

$ErrorActionPreference = "Stop"

Write-Host "Checking API health at $BaseUrl/api/health"
$health = Invoke-RestMethod -Uri "$BaseUrl/api/health" -Method Get

if ($health.status -ne "ok") {
  throw "API health is not ok"
}

Write-Host "Checking deployments endpoint"
$deployments = Invoke-RestMethod -Uri "$BaseUrl/api/deployments" -Method Get

if ($deployments.Count -lt 1) {
  throw "No deployments returned"
}

Write-Host "Smoke test passed"
