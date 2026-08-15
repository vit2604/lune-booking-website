$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$runtime = Join-Path $workspace '.codex-logs\ai-content'
foreach ($name in @('backend','frontend')) {
  $pidFile = Join-Path $runtime "$name.pid"
  if (-not (Test-Path -LiteralPath $pidFile)) { continue }
  $processId = [int](Get-Content -Raw -LiteralPath $pidFile)
  $process = Get-Process -Id $processId -ErrorAction SilentlyContinue
  if ($process -and $process.ProcessName -in @('node','npm','npm.cmd')) { Stop-Process -Id $processId -ErrorAction Stop }
  Remove-Item -LiteralPath $pidFile -Force
}
Write-Output 'AI Content local processes stopped. Drafts and media were not deleted.'
