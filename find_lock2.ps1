$processes = Get-WmiObject Win32_Process
foreach ($p in $processes) {
    if ($p.CommandLine -and $p.CommandLine -match 'filament_inventory_site') {
        Write-Host "PID: $($p.ProcessId) | Name: $($p.Name)"
        Write-Host "CMD: $($p.CommandLine)"
        Write-Host "---"
    }
}
