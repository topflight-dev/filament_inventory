$f = 'C:\Projects\filament_inventory_site\dist\win-unpacked\resources\app.asar'
try {
    $s = [System.IO.File]::Open($f, 'Open', 'ReadWrite', 'None')
    $s.Close()
    Write-Host "File is NOT locked"
} catch {
    Write-Host ("File IS locked: " + $_.Exception.Message)
}
