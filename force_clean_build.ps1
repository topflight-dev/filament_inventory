Set-Location 'C:\Projects\filament_inventory_site'

# Kill all electron-related processes
taskkill /F /IM "electron.exe" 2>$null
taskkill /F /IM "C3DW Hub.exe" 2>$null
taskkill /F /IM "app-builder.exe" 2>$null

Start-Sleep -Seconds 3

# Force-remove the entire dist folder using cmd rmdir (bypasses PowerShell handle issues)
if (Test-Path 'dist') {
    cmd /c "rmdir /S /Q dist"
    Write-Host "Removed dist folder."
} else {
    Write-Host "No dist folder found."
}

Start-Sleep -Seconds 1

# Run the build fresh
Write-Host "Starting electron-builder..."
& 'C:\Program Files\nodejs\npm.cmd' run dist 2>&1 | Tee-Object -FilePath 'C:\Projects\filament_inventory_site\dist_build.log'

Write-Host ""
Write-Host "=== Build complete. Checking dist folder ==="
if (Test-Path 'dist') {
    Get-ChildItem -Path 'dist' -Filter '*.exe' | Select-Object Name, Length, LastWriteTime
} else {
    Write-Host "dist folder does not exist - build may have failed."
}
