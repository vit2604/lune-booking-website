# Run this script from an elevated PowerShell only after reviewing the command.
$ErrorActionPreference = 'Stop'
$workspace = (Resolve-Path (Join-Path $PSScriptRoot '..\..')).Path
$script = Join-Path $PSScriptRoot 'start.ps1'
$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$script`"" -WorkingDirectory $workspace
$trigger = New-ScheduledTaskTrigger -AtLogOn
$settings = New-ScheduledTaskSettingsSet -ExecutionTimeLimit (New-TimeSpan -Hours 0) -RestartCount 3 -RestartInterval (New-TimeSpan -Minutes 2)
Register-ScheduledTask -TaskName 'Lune AI Content' -Action $action -Trigger $trigger -Settings $settings -Description 'Local zero-cost AI Content worker for Lune' | Out-Null
$backupScript = Join-Path $PSScriptRoot 'backup.ps1'
$backupAction = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$backupScript`"" -WorkingDirectory $workspace
$backupTrigger = New-ScheduledTaskTrigger -Daily -At '02:30'
Register-ScheduledTask -TaskName 'Lune AI Content Backup' -Action $backupAction -Trigger $backupTrigger -Settings $settings -Description 'Daily local PostgreSQL and AI media backup for Lune' | Out-Null
Write-Output 'Windows scheduled task installed: Lune AI Content'
Write-Output 'Windows scheduled task installed: Lune AI Content Backup'
