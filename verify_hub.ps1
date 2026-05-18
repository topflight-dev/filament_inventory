Write-Host '=== DESKTOP INTEGRITY VERIFICATION ===' -ForegroundColor Cyan
Write-Host ''

$file = Get-Content 'c:\Projects\filament_inventory_site\src\pages\admin\hub.html' -Raw

$checks = @(
    @{ Label = 'overflow: hidden on html/body (desktop ghost-scroll prevention)'; Pattern = 'overflow: hidden;' },
    @{ Label = 'hub-wrapper height: 100vh (desktop layout)'; Pattern = 'height: 100vh;' },
    @{ Label = 'hub-wrapper overflow-y: auto (desktop scroll)'; Pattern = 'overflow-y: auto;' },
    @{ Label = 'action-btn min-width: 140px (desktop button size)'; Pattern = 'min-width: 140px;' },
    @{ Label = 'hub-btn-delete-selected margin-left: auto (desktop right-align)'; Pattern = 'margin-left: auto;' },
    @{ Label = 'queue-table th padding: 8px 12px (desktop cell padding)'; Pattern = 'padding: 8px 12px;' },
    @{ Label = 'job-checkbox width: 16px (desktop checkbox size)'; Pattern = 'width: 16px;' },
    @{ Label = 'hub-brand-bar padding: 10px 24px (desktop brand bar)'; Pattern = 'padding: 10px 24px;' },
    @{ Label = 'hub-controls padding: 16px 20px (desktop controls)'; Pattern = 'padding: 16px 20px;' },
    @{ Label = 'Existing 640px media query intact'; Pattern = '@media (max-width: 640px)' },
    @{ Label = 'New 1024px tablet block present'; Pattern = 'max-width: 1024px' },
    @{ Label = 'New 768px tablet block present'; Pattern = 'max-width: 768px' },
    @{ Label = 'Touch target: checkbox size in media query'; Pattern = 'width: 24px;' },
    @{ Label = 'Touch target: min-height 40px in media query'; Pattern = 'min-height: 40px;' },
    @{ Label = 'iOS dvh fix present'; Pattern = '100dvh' },
    @{ Label = 'iOS safe-area-inset present'; Pattern = 'safe-area-inset-bottom' }
)

$pass = 0
$fail = 0

foreach ($check in $checks) {
    if ($file.Contains($check.Pattern)) {
        Write-Host ('  PASS: ' + $check.Label) -ForegroundColor Green
        $pass++
    } else {
        Write-Host ('  FAIL: ' + $check.Label) -ForegroundColor Red
        $fail++
    }
}

Write-Host ''
Write-Host ('=== RESULT: ' + $pass + ' passed, ' + $fail + ' failed ===') -ForegroundColor Cyan

$mqCount = ([regex]::Matches($file, '@media')).Count
Write-Host ('Total @media blocks in file: ' + $mqCount)
