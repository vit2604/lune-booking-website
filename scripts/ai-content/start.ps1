$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtime = Join-Path $workspace '.codex-logs\ai-content'
New-Item -ItemType Directory -Force -Path $runtime | Out-Null
@('backend.out.log','backend.err.log','frontend.out.log','frontend.err.log') | ForEach-Object {
  $log = Join-Path $runtime $_
  if ((Test-Path -LiteralPath $log) -and (Get-Item -LiteralPath $log).Length -gt 5MB) {
    $rotated = "$log.1"
    if (Test-Path -LiteralPath $rotated) { Remove-Item -LiteralPath $rotated -Force }
    Move-Item -LiteralPath $log -Destination $rotated
  }
}
& (Join-Path $PSScriptRoot 'check-system.ps1')
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 20+ is required.' }
if (-not (Test-Path (Join-Path $workspace 'node_modules'))) { throw 'Run npm ci in the repository root first.' }
if (-not (Test-Path (Join-Path $workspace 'server\node_modules'))) { throw 'Run npm ci in the server folder first.' }
$lan = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -ExpandProperty IPAddress)
$allowedOrigins = @('http://localhost:4173','http://127.0.0.1:4173') + @($lan | ForEach-Object { "http://${_}:4173" })
$env:CORS_ORIGIN = $allowedOrigins -join ','
$env:SOCKET_CORS_ORIGIN = $env:CORS_ORIGIN
Push-Location (Join-Path $workspace 'server')
try { & npm run prisma:deploy; if ($LASTEXITCODE -ne 0) { throw 'Database migration failed. Start PostgreSQL and retry.' } }
finally { Pop-Location }
$previousMockPassword = $env:VITE_MOCK_ADMIN_PASSWORD
$env:VITE_MOCK_ADMIN_PASSWORD = ''
Push-Location $workspace
try { & npm run build; if ($LASTEXITCODE -ne 0) { throw 'Safe production frontend build failed.' } }
finally { Pop-Location; $env:VITE_MOCK_ADMIN_PASSWORD = $previousMockPassword }
$env:AI_CONTENT_WORKER_ENABLED = 'true'
$backend = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','start') -WorkingDirectory (Join-Path $workspace 'server') -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'backend.out.log') -RedirectStandardError (Join-Path $runtime 'backend.err.log')
$frontend = Start-Process -FilePath 'npm.cmd' -ArgumentList @('run','preview','--','--host','0.0.0.0','--port','4173') -WorkingDirectory $workspace -WindowStyle Hidden -PassThru -RedirectStandardOutput (Join-Path $runtime 'frontend.out.log') -RedirectStandardError (Join-Path $runtime 'frontend.err.log')
Set-Content -LiteralPath (Join-Path $runtime 'backend.pid') -Value $backend.Id
Set-Content -LiteralPath (Join-Path $runtime 'frontend.pid') -Value $frontend.Id
Write-Output 'AI Content started.'
Write-Output 'Desktop: http://localhost:4173/admin/ai-content'
$lan | ForEach-Object { Write-Output "Phone (same Wi-Fi): http://${_}:4173/admin/ai-content" }
