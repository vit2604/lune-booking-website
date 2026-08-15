$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$drive = Get-PSDrive -Name ([System.IO.Path]::GetPathRoot($workspace).TrimEnd(':\'))
$os = try { Get-CimInstance Win32_OperatingSystem -ErrorAction Stop } catch { $null }
$cpu = try { Get-CimInstance Win32_Processor -ErrorAction Stop | Select-Object -First 1 } catch { $null }
$gpus = try { @(Get-CimInstance Win32_VideoController -ErrorAction Stop | Select-Object Name, AdapterRAM) } catch { @() }
$lan = @(Get-NetIPAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254.*' } | Select-Object -ExpandProperty IPAddress)

function Get-ToolVersion([string]$command, [string[]]$arguments) {
  $tool = Get-Command $command -ErrorAction SilentlyContinue
  if (-not $tool) { return @{ available = $false; version = $null } }
  $previousPreference = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  try { $line = (& $command @arguments 2>&1 | Select-Object -First 1) -join '' }
  catch { $line = $_.Exception.Message }
  finally { $ErrorActionPreference = $previousPreference }
  return @{ available = $true; version = $line }
}

$ollama = Get-ToolVersion 'ollama' @('--version')
$ffmpeg = Get-ToolVersion 'ffmpeg' @('-version')
$ffprobe = Get-ToolVersion 'ffprobe' @('-version')
$python = Get-ToolVersion 'python' @('--version')
$docker = Get-ToolVersion 'docker' @('--version')
$pgDump = Get-ToolVersion 'pg_dump' @('--version')
$opencv = @{ available = $false; version = $null }
if ($python.available) {
  $cvVersion = (& python -c "import cv2; print(cv2.__version__)" 2>$null | Select-Object -First 1) -join ''
  if ($LASTEXITCODE -eq 0) { $opencv = @{ available = $true; version = $cvVersion } }
}
$models = @()
if ($ollama.available) { $models = @((& ollama list 2>$null | Select-Object -Skip 1) -join "`n") }

$report = [ordered]@{
  checkedAt = (Get-Date).ToString('o'); os = if ($os) { $os.Caption } else { [System.Environment]::OSVersion.VersionString }; architecture = $env:PROCESSOR_ARCHITECTURE
  cpu = if ($cpu) { $cpu.Name } else { $env:PROCESSOR_IDENTIFIER }; logicalProcessors = if ($cpu) { $cpu.NumberOfLogicalProcessors } else { [System.Environment]::ProcessorCount }
  totalMemoryGB = if ($os) { [math]::Round($os.TotalVisibleMemorySize / 1MB, 2) } else { $null }; freeMemoryGB = if ($os) { [math]::Round($os.FreePhysicalMemory / 1MB, 2) } else { $null }
  freeDiskGB = [math]::Round($drive.Free / 1GB, 2); gpu = $gpus
  node = Get-ToolVersion 'node' @('--version'); npm = Get-ToolVersion 'npm' @('--version')
  ollama = $ollama; ollamaModels = $models; ffmpeg = $ffmpeg; ffprobe = $ffprobe
  python = $python; opencv = $opencv; docker = $docker; pgDump = $pgDump
  lanAddresses = $lan; desktopUrl = 'http://localhost:4173/admin/ai-content'
  phoneUrls = @($lan | ForEach-Object { "http://${_}:4173/admin/ai-content" })
  note = 'LAN HTTP supports mobile web uploads. Installable/offline PWA and notifications need HTTPS.'
}
$report | ConvertTo-Json -Depth 6
