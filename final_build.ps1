Set-Location 'C:\Projects\filament_inventory_site'

Write-Host "Step 1: Killing any leftover electron/node processes..."
taskkill /F /IM "electron.exe" 2>$null
taskkill /F /IM "C3DW Hub.exe" 2>$null
taskkill /F /IM "app-builder.exe" 2>$null
Start-Sleep -Seconds 2

Write-Host "Step 2: Removing old dist folder..."
if (Test-Path 'dist') {
    cmd /c "rmdir /S /Q dist"
    Write-Host "  dist folder removed."
}
Start-Sleep -Seconds 1

Write-Host "Step 3: Running electron-builder..."
& 'C:\Program Files\nodejs\npm.cmd' run dist 2>&1 | Tee-Object -FilePath 'C:\Projects\filament_inventory_site\dist_build.log'

Write-Host ""
Write-Host "=== BUILD RESULT ==="
if (Test-Path 'dist') {
    $exes = Get-ChildItem -Path 'dist' -Filter '*.exe' -ErrorAction SilentlyContinue
    if ($exes) {
        Write-Host "SUCCESS! Executable(s) found in dist/:"
        $exes | Select-Object Name, @{N='SizeMB';E={[math]::Round($_.Length/1MB,1)}}, LastWriteTime | Format-Table -AutoSize
    } else {
        Write-Host "WARNING: dist folder exists but no .exe found. Check dist_build.log."
        Get-ChildItem -Path 'dist' | Select-Object Name, LastWriteTime
    }
} else {
    Write-Host "FAILED: dist folder was not created. Check dist_build.log for errors."
}

Write-Host ""
Write-Host "Press any key to close..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
