Set-Location 'C:\Projects\filament_inventory_site'

# Kill any electron processes by name using taskkill (avoids $_ quoting issues)
taskkill /F /IM "electron.exe" 2>$null
taskkill /F /IM "C3DW Hub.exe" 2>$null

# Wait a moment for handles to release
Start-Sleep -Seconds 2

# Force-remove the entire dist\win-unpacked folder
if (Test-Path 'dist\win-unpacked') {
    cmd /c "rmdir /S /Q dist\win-unpacked"
}

# Also remove any existing portable exe in dist root
Get-ChildItem -Path 'dist' -Filter '*.exe' -ErrorAction SilentlyContinue | Remove-Item -Force -ErrorAction SilentlyContinue

# Run the build
& 'C:\Program Files\nodejs\npm.cmd' run dist 2>&1 | Tee-Object -FilePath 'C:\Projects\filament_inventory_site\dist_build.log'

Write-Host ""
Write-Host "=== Build complete. Checking dist folder ==="
Get-ChildItem -Path 'dist' -Filter '*.exe' -ErrorAction SilentlyContinue | Select-Object Name, Length, LastWriteTime
