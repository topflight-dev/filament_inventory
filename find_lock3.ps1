$processes = Get-WmiObject Win32_Process
foreach ($p in $processes) {
    if ($p.CommandLine -and ($p.CommandLine -match 'app\.asar' -or $p.CommandLine -match 'win-unpacked')) {
        Write-Host "PID: $($p.ProcessId) | Name: $($p.Name)"
        Write-Host "CMD: $($p.CommandLine)"
        Write-Host "---"
    }
}

# Also check if VS Code has the file open via its extension host
Write-Host ""
Write-Host "Checking VS Code extension host processes..."
$vsCodeProcs = Get-WmiObject Win32_Process | Where-Object { $_.Name -eq 'Code.exe' }
foreach ($p in $vsCodeProcs) {
    Write-Host "PID: $($p.ProcessId) | CMD: $($p.CommandLine)"
}
