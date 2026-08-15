# Run from an elevated PowerShell. This removes only the named task, never drafts, database rows, or media.
$ErrorActionPreference = 'Stop'
if (Get-ScheduledTask -TaskName 'Lune AI Content' -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName 'Lune AI Content' -Confirm:$false }
if (Get-ScheduledTask -TaskName 'Lune AI Content Backup' -ErrorAction SilentlyContinue) { Unregister-ScheduledTask -TaskName 'Lune AI Content Backup' -Confirm:$false }
Write-Output 'Windows scheduled tasks removed. Data was preserved.'
