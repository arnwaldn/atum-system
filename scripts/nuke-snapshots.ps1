# Delete all shell snapshots - they're corrupted with base64 data
$dir = "$env:USERPROFILE\.claude\shell-snapshots"
if (Test-Path $dir) {
    Remove-Item "$dir\*" -Force -ErrorAction SilentlyContinue
    Write-Host "Snapshots cleaned"
} else {
    Write-Host "No snapshot dir"
}
