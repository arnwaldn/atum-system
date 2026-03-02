---
name: powershell-windows
description: "Windows PowerShell scripting patterns and system administration. Use when working with registry operations, WMI/CIM queries, Windows services, firewall rules, scheduled tasks, Active Directory, or Windows-specific troubleshooting. Covers error handling with -ErrorAction, -WhatIf/-Confirm support, and proper Windows path handling."
version: "1.0.0"
---

# PowerShell & Windows Scripting Patterns

Comprehensive reference for Windows system administration, automation, and troubleshooting using PowerShell.

## When to Invoke

- User needs to manage Windows services, registry, or scheduled tasks
- Working with WMI/CIM queries for system information
- Configuring Windows Firewall rules
- File system operations with Windows-specific paths (UNC, long paths)
- Active Directory queries and management
- Windows event log analysis
- Network configuration and diagnostics
- System troubleshooting on Windows

## When NOT to Use

- Cross-platform scripts (use Bash or Python instead)
- Simple file operations that work the same on all platforms
- Linux/macOS-specific administration

## Core Principles

### 1. Always Use -ErrorAction Appropriately

```powershell
# Stop on error (strict mode)
$ErrorActionPreference = 'Stop'

# Per-command error handling
Get-Service -Name 'NonExistent' -ErrorAction SilentlyContinue
Get-Item -Path 'C:\missing' -ErrorAction Stop

# Try/Catch for graceful handling
try {
    $result = Get-WmiObject -Class Win32_Service -Filter "Name='MyService'" -ErrorAction Stop
} catch [System.Management.Automation.CommandNotFoundException] {
    Write-Warning "WMI not available, falling back to CIM"
    $result = Get-CimInstance -ClassName Win32_Service -Filter "Name='MyService'"
} catch {
    Write-Error "Failed to query service: $_"
}
```

### 2. Support -WhatIf and -Confirm

```powershell
function Remove-OldLogs {
    [CmdletBinding(SupportsShouldProcess)]
    param(
        [string]$Path,
        [int]$DaysOld = 30
    )

    $cutoff = (Get-Date).AddDays(-$DaysOld)
    $files = Get-ChildItem -Path $Path -Filter '*.log' |
        Where-Object { $_.LastWriteTime -lt $cutoff }

    foreach ($file in $files) {
        if ($PSCmdlet.ShouldProcess($file.FullName, "Delete log file")) {
            Remove-Item -Path $file.FullName -Force
        }
    }
}

# Usage: Remove-OldLogs -Path 'C:\Logs' -WhatIf
# Usage: Remove-OldLogs -Path 'C:\Logs' -Confirm
```

### 3. Prefer CIM over WMI

```powershell
# OLD (WMI) -- deprecated, DCOM-based
Get-WmiObject -Class Win32_OperatingSystem

# NEW (CIM) -- preferred, WSMAN-based
Get-CimInstance -ClassName Win32_OperatingSystem

# Query with filter
Get-CimInstance -ClassName Win32_Process -Filter "Name='chrome.exe'"

# Remote machine
$session = New-CimSession -ComputerName 'SERVER01'
Get-CimInstance -CimSession $session -ClassName Win32_LogicalDisk
```

## Registry Operations

```powershell
# Read registry value
$value = Get-ItemProperty -Path 'HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion' -Name 'ProgramFilesDir'

# Check if key exists
$exists = Test-Path 'HKLM:\SOFTWARE\MyApp'

# Create key and set value
New-Item -Path 'HKLM:\SOFTWARE\MyApp' -Force
Set-ItemProperty -Path 'HKLM:\SOFTWARE\MyApp' -Name 'Version' -Value '1.0.0' -Type String

# Registry value types: String, ExpandString, Binary, DWord, MultiString, QWord

# Enumerate subkeys
Get-ChildItem -Path 'HKLM:\SOFTWARE\Microsoft' | Select-Object Name

# Delete registry value
Remove-ItemProperty -Path 'HKLM:\SOFTWARE\MyApp' -Name 'OldSetting'

# Delete entire key (recursive)
Remove-Item -Path 'HKLM:\SOFTWARE\MyApp' -Recurse -Force
```

**Warning:** Always back up registry before modifications. Use `-WhatIf` first.

## Service Management

```powershell
# List services
Get-Service | Where-Object { $_.Status -eq 'Running' }

# Start/Stop/Restart
Start-Service -Name 'wuauserv' -PassThru
Stop-Service -Name 'Spooler' -Force
Restart-Service -Name 'W32Time'

# Check service status
$svc = Get-Service -Name 'ssh-agent'
if ($svc.Status -ne 'Running') {
    Start-Service -Name 'ssh-agent'
}

# Set startup type
Set-Service -Name 'ssh-agent' -StartupType Automatic

# Create a new service
New-Service -Name 'MyDaemon' -BinaryPathName 'C:\MyApp\daemon.exe' `
    -DisplayName 'My Daemon' -StartupType Automatic -Description 'Custom background service'

# Query service recovery options
sc.exe qfailure 'MyDaemon'

# Set recovery to restart on failure
sc.exe failure 'MyDaemon' reset=86400 actions=restart/60000/restart/60000/restart/60000
```

## Windows Firewall

```powershell
# List firewall rules
Get-NetFirewallRule | Where-Object { $_.Enabled -eq 'True' } |
    Select-Object DisplayName, Direction, Action

# Create inbound rule
New-NetFirewallRule -DisplayName 'Allow HTTP' -Direction Inbound `
    -Protocol TCP -LocalPort 80 -Action Allow

# Create outbound rule
New-NetFirewallRule -DisplayName 'Block Telemetry' -Direction Outbound `
    -RemoteAddress '13.107.4.50' -Action Block

# Remove rule
Remove-NetFirewallRule -DisplayName 'Allow HTTP'

# Enable/Disable rule
Enable-NetFirewallRule -DisplayName 'Allow SSH'
Disable-NetFirewallRule -DisplayName 'Allow SSH'

# Check firewall profile status
Get-NetFirewallProfile | Select-Object Name, Enabled
```

## Scheduled Tasks

```powershell
# Create a scheduled task
$action = New-ScheduledTaskAction -Execute 'powershell.exe' `
    -Argument '-NoProfile -File C:\Scripts\backup.ps1'
$trigger = New-ScheduledTaskTrigger -Daily -At '02:00'
$settings = New-ScheduledTaskSettingsSet -AllowStartIfOnBatteries -DontStopIfGoingOnBatteries
$principal = New-ScheduledTaskPrincipal -UserId 'SYSTEM' -LogonType ServiceAccount -RunLevel Highest

Register-ScheduledTask -TaskName 'DailyBackup' `
    -Action $action -Trigger $trigger -Settings $settings -Principal $principal

# List tasks
Get-ScheduledTask | Where-Object { $_.State -eq 'Ready' }

# Run task immediately
Start-ScheduledTask -TaskName 'DailyBackup'

# Disable/Remove
Disable-ScheduledTask -TaskName 'DailyBackup'
Unregister-ScheduledTask -TaskName 'DailyBackup' -Confirm:$false
```

## Network Configuration

```powershell
# IP configuration
Get-NetIPAddress | Where-Object {
    $_.AddressFamily -eq 'IPv4' -and $_.PrefixOrigin -ne 'WellKnown'
}

# DNS settings
Get-DnsClientServerAddress -InterfaceAlias 'Ethernet'
Set-DnsClientServerAddress -InterfaceAlias 'Ethernet' -ServerAddresses '8.8.8.8','8.8.4.4'

# Test connectivity
Test-NetConnection -ComputerName 'google.com' -Port 443
Test-NetConnection -ComputerName '192.168.1.1' -TraceRoute

# List open ports
Get-NetTCPConnection -State Listen |
    Select-Object LocalPort, OwningProcess | Sort-Object LocalPort

# Resolve DNS
Resolve-DnsName -Name 'example.com' -Type A

# Flush DNS cache
Clear-DnsClientCache

# Network adapter info
Get-NetAdapter | Select-Object Name, Status, LinkSpeed, MacAddress
```

## File System Operations

```powershell
# Handle long paths (>260 chars) -- requires Windows 10 1607+
Get-ChildItem -LiteralPath '\\?\C:\VeryLongPath\...'

# UNC paths
Get-ChildItem -Path '\\server\share\folder'

# ACL operations
$acl = Get-Acl -Path 'C:\Secure'
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    'Users', 'ReadAndExecute', 'Allow')
$acl.AddAccessRule($rule)
Set-Acl -Path 'C:\Secure' -AclObject $acl

# Take ownership
$acl = Get-Acl -Path 'C:\Protected'
$owner = New-Object System.Security.Principal.NTAccount('Administrators')
$acl.SetOwner($owner)
Set-Acl -Path 'C:\Protected' -AclObject $acl

# Find large files
Get-ChildItem -Path 'C:\' -Recurse -ErrorAction SilentlyContinue |
    Where-Object { $_.Length -gt 100MB } |
    Sort-Object Length -Descending |
    Select-Object FullName, @{N='SizeMB';E={[math]::Round($_.Length/1MB,2)}}
```

## Event Log Analysis

```powershell
# Query recent errors
Get-WinEvent -LogName System -MaxEvents 50 | Where-Object { $_.Level -eq 2 }

# Filter by time range
$start = (Get-Date).AddHours(-24)
Get-WinEvent -FilterHashtable @{LogName='Application'; Level=2; StartTime=$start}

# Search for specific event ID
Get-WinEvent -FilterHashtable @{LogName='System'; ID=7045}

# Export to CSV
Get-WinEvent -LogName Security -MaxEvents 1000 |
    Export-Csv -Path 'security-events.csv' -NoTypeInformation

# Blue screen (BSOD) analysis
Get-WinEvent -FilterHashtable @{
    LogName='System'; ProviderName='Microsoft-Windows-WER-SystemErrorReporting'
}
```

## Active Directory (When Available)

```powershell
# Requires RSAT AD module
Import-Module ActiveDirectory

# Find user
Get-ADUser -Identity 'jdoe' -Properties *
Get-ADUser -Filter "Name -like '*Smith*'" -Properties Department, Title

# List group members
Get-ADGroupMember -Identity 'Domain Admins' -Recursive

# Find locked accounts
Search-ADAccount -LockedOut | Select-Object Name, LastLogonDate

# Find disabled accounts
Search-ADAccount -AccountDisabled | Select-Object Name, DistinguishedName

# Password expiration
Get-ADUser -Filter * -Properties PasswordLastSet, PasswordNeverExpires |
    Where-Object { -not $_.PasswordNeverExpires } |
    Select-Object Name, PasswordLastSet
```

## System Information and Troubleshooting

```powershell
# System overview
Get-CimInstance -ClassName Win32_ComputerSystem |
    Select-Object Name, Manufacturer, Model, TotalPhysicalMemory
Get-CimInstance -ClassName Win32_OperatingSystem |
    Select-Object Caption, Version, BuildNumber, LastBootUpTime

# Disk space
Get-CimInstance -ClassName Win32_LogicalDisk -Filter "DriveType=3" |
    Select-Object DeviceID,
        @{N='FreeGB';E={[math]::Round($_.FreeSpace/1GB,2)}},
        @{N='TotalGB';E={[math]::Round($_.Size/1GB,2)}}

# CPU usage
Get-CimInstance -ClassName Win32_Processor | Select-Object Name, LoadPercentage

# Memory usage
$os = Get-CimInstance -ClassName Win32_OperatingSystem
$freeGB = [math]::Round($os.FreePhysicalMemory/1MB, 2)
$totalGB = [math]::Round($os.TotalVisibleMemorySize/1MB, 2)
Write-Output "Memory: $freeGB GB free / $totalGB GB total"

# Installed software
Get-CimInstance -ClassName Win32_Product |
    Select-Object Name, Version, Vendor | Sort-Object Name

# Windows Update history
Get-HotFix | Sort-Object InstalledOn -Descending | Select-Object -First 20

# Process troubleshooting
Get-Process | Sort-Object WorkingSet64 -Descending |
    Select-Object -First 10 Name,
        @{N='MemMB';E={[math]::Round($_.WorkingSet64/1MB,2)}}, CPU
```

## Best Practices Checklist

| Practice | Why |
|----------|-----|
| Use `$ErrorActionPreference = 'Stop'` at script start | Fail fast instead of silently continuing |
| Add `[CmdletBinding()]` to all functions | Enables -Verbose, -Debug, -WhatIf, -Confirm |
| Use `-WhatIf` before destructive operations | Preview changes before applying |
| Prefer CIM over WMI | CIM is faster, supports remote WSMAN, not deprecated |
| Use `Write-Verbose` for debug output | Visible only with -Verbose flag |
| Never use `Write-Host` in functions | It bypasses the pipeline; use `Write-Output` |
| Quote all paths | Spaces in Windows paths break unquoted commands |
| Use `-LiteralPath` for paths with brackets | `Get-Item [test].txt` fails without -LiteralPath |
| Test with `-WhatIf` then run without | Two-pass approach prevents accidents |
| Use `Start-Transcript` for auditing | Logs all session output to file |

## Common Anti-Patterns

| Anti-Pattern | Fix |
|-------------|-----|
| `Set-ExecutionPolicy Unrestricted` globally | Use `RemoteSigned` or scope to `Process` |
| Hardcoded credentials in scripts | Use `Get-Credential` or Windows Credential Manager |
| `Invoke-Expression` with user input | Never. Use `&` call operator or `Start-Process` |
| Ignoring exit codes from native commands | Check `$LASTEXITCODE` after exe calls |
| Using `Format-*` cmdlets in pipeline mid-stream | Format cmdlets kill the object pipeline; use only at the end |
| `Select-String` when `Where-Object` is clearer | Use the right tool for structured vs. text data |
