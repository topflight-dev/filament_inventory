Set-Location 'C:\Projects\filament_inventory_site'

# Kill any running electron / C3DW Hub processes that may be locking the exe
Get-Process | Where-Object { $_.Name -like '*electron*' -or $_.MainWindowTitle -like '*C3DW*' -or $_.Name -like '*C3DW*' } | Stop-Process -Force -ErrorAction SilentlyContinue

# Remove the locked win-unpacked folder so electron-builder can recreate it
if (Test-Path 'dist\win-unpacked') {
    Remove-Item -Recurse -Force 'dist\win-unpacked'
}

# Run the build
& 'C:\Program Files\nodejs\npm.cmd' run dist 2>&1 | Tee-Object -FilePath 'C:\Projects\filament_inventory_site\dist_build.log'
