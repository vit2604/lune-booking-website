param([string]$Destination, [int]$RetentionDays = 14)
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
if (-not $Destination) { $Destination = Join-Path $workspace 'backups\ai-content' }
$resolvedBase = [System.IO.Path]::GetFullPath($Destination)
New-Item -ItemType Directory -Force -Path $resolvedBase | Out-Null
$stamp = Get-Date -Format 'yyyyMMdd-HHmmss'
$target = Join-Path $resolvedBase $stamp
New-Item -ItemType Directory -Force -Path $target | Out-Null
$envFile = Join-Path $workspace 'server\.env'
if (-not $env:DATABASE_URL) {
  if (Test-Path -LiteralPath $envFile) {
    $line = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^DATABASE_URL=' } | Select-Object -First 1
    if ($line) { $env:DATABASE_URL = ($line -replace '^DATABASE_URL=', '').Trim('"').Trim("'") }
  }
}
if (-not $env:DATABASE_URL) { throw 'Set DATABASE_URL or configure it in server/.env before backup.' }
if (-not (Get-Command pg_dump -ErrorAction SilentlyContinue)) { throw 'pg_dump is required for database backup.' }
& pg_dump $env:DATABASE_URL --format=custom --file=(Join-Path $target 'database.dump')
if ($LASTEXITCODE -ne 0) { throw 'pg_dump failed.' }
$mediaRootSetting = $env:AI_CONTENT_MEDIA_ROOT
if (-not $mediaRootSetting -and (Test-Path -LiteralPath $envFile)) {
  $mediaLine = Get-Content -LiteralPath $envFile | Where-Object { $_ -match '^AI_CONTENT_MEDIA_ROOT=' } | Select-Object -First 1
  if ($mediaLine) { $mediaRootSetting = ($mediaLine -replace '^AI_CONTENT_MEDIA_ROOT=', '').Trim('"').Trim("'") }
}
if (-not $mediaRootSetting) { $mediaRootSetting = '.\data\ai-content-media' }
$serverRoot = Join-Path $workspace 'server'
$media = if ([System.IO.Path]::IsPathRooted($mediaRootSetting)) { [System.IO.Path]::GetFullPath($mediaRootSetting) } else { [System.IO.Path]::GetFullPath((Join-Path $serverRoot $mediaRootSetting)) }
if (Test-Path -LiteralPath $media) { Copy-Item -LiteralPath $media -Destination (Join-Path $target 'media') -Recurse }
Get-ChildItem -LiteralPath $target -Recurse -File | Get-FileHash -Algorithm SHA256 | Select-Object Hash, Path | ConvertTo-Json | Set-Content -LiteralPath (Join-Path $target 'SHA256.json') -Encoding UTF8
if ($RetentionDays -gt 0) {
  $cutoff = (Get-Date).AddDays(-$RetentionDays)
  Get-ChildItem -LiteralPath $resolvedBase -Directory | Where-Object { $_.FullName -ne $target -and $_.LastWriteTime -lt $cutoff } | Remove-Item -Recurse -Force
}
Write-Output "Backup created: $target"
