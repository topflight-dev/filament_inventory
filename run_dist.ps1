Set-Location 'C:\Projects\filament_inventory_site'
& 'C:\Program Files\nodejs\npm.cmd' run dist 2>&1 | Tee-Object -FilePath 'C:\Projects\filament_inventory_site\dist_build.log'
