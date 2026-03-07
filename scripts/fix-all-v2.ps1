# Complete fix: clean snapshots, rebuild scheduler, test hindsight, restart PM2

Write-Host "=== Step 1: Clean corrupted shell snapshots ==="
$snapDir = "$env:USERPROFILE\.claude\shell-snapshots"
if (Test-Path $snapDir) {
    $files = Get-ChildItem -Path $snapDir -File
    $removed = 0
    foreach ($f in $files) {
        Remove-Item -Path $f.FullName -Force -ErrorAction SilentlyContinue
        $removed++
    }
    Write-Host "  Removed $removed snapshot files"
}

Write-Host "`n=== Step 2: Rebuild scheduler ==="
Set-Location "$env:USERPROFILE\.claude\scheduler"
& npx esbuild src/daemon.ts --bundle --platform=node --target=node20 --outdir=dist --format=esm --external:better-sqlite3 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host "`n=== Step 3: Test Hindsight (Python with SSL fix) ==="
& python "$env:USERPROFILE\.claude\scripts\test-hindsight-direct.py" 2>&1 | ForEach-Object { Write-Host "  $_" }

Write-Host "`n=== Step 4: Kill remaining PM2/orphans then restart ==="
# Kill PM2 first
try { & npm exec -- pm2 kill 2>$null } catch {}
Start-Sleep -Seconds 2

# Start fresh
try {
    & npm exec -- pm2 start "$env:USERPROFILE\.claude\scheduler\dist\daemon.js" --name claude-scheduler 2>&1 | ForEach-Object { Write-Host "  $_" }
    Write-Host "  PM2 started"
} catch {
    Write-Host "  PM2 start failed: $($_.Exception.Message)"
}

Write-Host "`n=== Step 5: Verify ==="
Start-Sleep -Seconds 2
$nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
$cmdCount = (Get-Process -Name "cmd" -ErrorAction SilentlyContinue).Count
Write-Host "  Node processes: $nodeCount"
Write-Host "  Cmd processes: $cmdCount"

Write-Host "`n=== Done ==="
