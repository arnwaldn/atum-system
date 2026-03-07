# Kill zombie node/cmd processes from PM2 scheduler and orphan MCP servers
# Safe: only kills processes matching Claude Code patterns

Write-Host "=== Claude Code Zombie Process Cleanup ==="

# 1. Stop PM2 first
Write-Host "`n[1] Stopping PM2 daemon..."
$pm2 = Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object {
    try { $_.CommandLine -match "pm2" -or $_.CommandLine -match "ProcessContainerFork" } catch { $false }
}
if ($pm2) {
    try {
        & npm exec -- pm2 kill 2>$null
        Write-Host "  PM2 kill command sent"
    } catch {
        Write-Host "  pm2 kill failed, forcing..."
    }
    Start-Sleep -Seconds 2
}

# 2. Kill orphan node processes (Claude scheduler, MCP servers from scheduled tasks)
Write-Host "`n[2] Killing orphan node processes..."
$nodeProcs = Get-Process -Name "node" -ErrorAction SilentlyContinue
$killed = 0
foreach ($proc in $nodeProcs) {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        # Kill if it's a Claude-related process (MCP server, scheduler, etc.)
        if ($cmdLine -match "npx.*@modelcontextprotocol" -or
            $cmdLine -match "npx.*@anthropic" -or
            $cmdLine -match "npx.*@railway" -or
            $cmdLine -match "npx.*@pluv" -or
            $cmdLine -match "npx.*@anthropic-ai" -or
            $cmdLine -match "claude-scheduler" -or
            $cmdLine -match "ProcessContainerFork" -or
            $cmdLine -match "pm2" -or
            $cmdLine -match "mcp-server" -or
            $cmdLine -match "desktop-commander" -or
            $cmdLine -match "skillsync" -or
            $cmdLine -match "sequential-thinking" -or
            $cmdLine -match "memory-server") {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $killed++
        }
    } catch { }
}
Write-Host "  Killed $killed node processes"

# 3. Kill orphan cmd.exe processes (from cmd /c npx pattern)
Write-Host "`n[3] Killing orphan cmd.exe processes..."
$cmdProcs = Get-Process -Name "cmd" -ErrorAction SilentlyContinue
$killedCmd = 0
foreach ($proc in $cmdProcs) {
    try {
        $cmdLine = (Get-CimInstance Win32_Process -Filter "ProcessId=$($proc.Id)" -ErrorAction SilentlyContinue).CommandLine
        if ($cmdLine -match "npx" -or $cmdLine -match "mcp" -or $cmdLine -match "/c.*npx") {
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
            $killedCmd++
        }
    } catch { }
}
Write-Host "  Killed $killedCmd cmd processes"

# 4. Summary
Write-Host "`n=== Cleanup Complete ==="
$remainingNode = (Get-Process -Name "node" -ErrorAction SilentlyContinue).Count
Write-Host "Remaining node processes: $remainingNode"
$remainingCmd = (Get-Process -Name "cmd" -ErrorAction SilentlyContinue).Count
Write-Host "Remaining cmd processes: $remainingCmd"
