# Complete fix script: clean snapshots, rebuild scheduler, restart PM2
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
} else {
    Write-Host "  No snapshot directory found"
}

Write-Host "`n=== Step 2: Rebuild scheduler (TypeScript) ==="
Set-Location "$env:USERPROFILE\.claude\scheduler"
# Check if dist exists and has the executor
if (Test-Path "dist\executor.js") {
    Write-Host "  dist/executor.js exists — checking if update needed"
}
# Rebuild
try {
    & npx esbuild src/daemon.ts --bundle --platform=node --target=node20 --outdir=dist --format=esm --external:better-sqlite3 2>&1
    Write-Host "  Build complete"
} catch {
    Write-Host "  Build failed: $($_.Exception.Message)"
}

Write-Host "`n=== Step 3: Test Hindsight connectivity ==="
# Load env vars from .bashrc
$bashrc = Get-Content "$env:USERPROFILE\.bashrc" -ErrorAction SilentlyContinue
$url = ""
$key = ""
foreach ($line in $bashrc) {
    if ($line -match 'export\s+HINDSIGHT_URL="([^"]+)"') { $url = $matches[1] }
    if ($line -match 'export\s+HINDSIGHT_API_KEY="([^"]+)"') { $key = $matches[1] }
}

if ($url -and $key) {
    # Test with Python (uses our fixed SSL context)
    $testScript = @"
import ssl, json, urllib.request
ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE
headers = {"Authorization": "Bearer $key", "Content-Type": "application/json"}
req = urllib.request.Request("$url/health", headers=headers)
try:
    r = urllib.request.urlopen(req, timeout=15, context=ctx)
    print(f"Health: {r.status} - {r.read().decode()}")
except Exception as e:
    print(f"Health FAILED: {e}")
req2 = urllib.request.Request("$url/v1/default/banks/atum/stats", headers=headers)
try:
    r2 = urllib.request.urlopen(req2, timeout=15, context=ctx)
    print(f"Stats: {r2.status} - {r2.read().decode()}")
except Exception as e:
    print(f"Stats FAILED: {e}")
"@
    $testScript | python 2>&1
} else {
    Write-Host "  Could not find HINDSIGHT_URL/KEY in .bashrc"
}

Write-Host "`n=== Step 4: Restart PM2 ==="
try {
    & npm exec -- pm2 restart claude-scheduler 2>&1
    Write-Host "  PM2 restarted"
} catch {
    Write-Host "  Trying pm2 start..."
    try {
        & npm exec -- pm2 start "$env:USERPROFILE\.claude\scheduler\dist\daemon.js" --name claude-scheduler 2>&1
        Write-Host "  PM2 started"
    } catch {
        Write-Host "  PM2 start failed: $($_.Exception.Message)"
    }
}

Write-Host "`n=== Step 5: Verify ==="
$nodeCount = (Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
$cmdCount = (Get-Process -Name "cmd" -ErrorAction SilentlyContinue).Count
Write-Host "  Node processes: $nodeCount"
Write-Host "  Cmd processes: $cmdCount"

Write-Host "`n=== All fixes applied ==="
