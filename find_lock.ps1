Set-Location 'C:\Projects\filament_inventory_site'

$targetFile = 'C:\Projects\filament_inventory_site\dist\win-unpacked\resources\app.asar'

Write-Host "Searching for processes locking: $targetFile"
Write-Host ""

# Use handle.exe if available (Sysinternals)
$handleExe = Get-Command handle.exe -ErrorAction SilentlyContinue
if ($handleExe) {
    & handle.exe $targetFile
} else {
    Write-Host "handle.exe not found. Trying openfiles..."
    $result = cmd /c "openfiles /query /fo table 2>&1"
    $result | Select-String -Pattern "asar" -CaseSensitive:$false
    
    Write-Host ""
    Write-Host "Listing all running processes that might be electron-related:"
    Get-Process | Where-Object { $PSItem.Name -match 'electron|node|C3DW|Hub' } | Format-Table Name, Id, CPU -AutoSize
    
    Write-Host ""
    Write-Host "All processes with open handles to the dist folder (via WMI):"
    $processes = Get-WmiObject Win32_Process | Select-Object ProcessId, Name, CommandLine
    foreach ($p in $processes) {
        if ($p.CommandLine -and ($p.CommandLine -match 'filament_inventory_site' -or $p.CommandLine -match 'electron' -or $p.CommandLine -match 'C3DW')) {
            Write-Host "PID: $($p.ProcessId) | Name: $($p.Name) | CMD: $($p.CommandLine)"
        }
    }
}
