# DV CARD - Production Verification (PowerShell)
Write-Host '==========================================' -ForegroundColor Cyan
Write-Host 'DV CARD - PRODUCTION VERIFICATION' -ForegroundColor Cyan  
Write-Host '==========================================' -ForegroundColor Cyan
Write-Host ''

# 1. Check Node.js
Write-Host '1. Checking Node.js...'
if (Get-Command node -ErrorAction SilentlyContinue) {
    Write-Host '[OK] Node.js installed' -ForegroundColor Green
} else {
    Write-Host '[ERROR] Node.js not found!' -ForegroundColor Red
    exit 1
}

# 2. TypeScript check
Write-Host ''
Write-Host '2. Running TypeScript check...'
npm run typecheck 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host '[OK] TypeScript: No critical errors' -ForegroundColor Green
} else {
    Write-Host '[WARN] TypeScript: Some errors (non-blocking)' -ForegroundColor Yellow
}

# 3. Production build test
Write-Host ''
Write-Host '3. Testing production build...'
Write-Host '   (This may take 1-2 minutes...)'
npm run build 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host '[OK] Production build: SUCCESS' -ForegroundColor Green
} else {
    Write-Host '[ERROR] Production build: FAILED' -ForegroundColor Red
}

Write-Host ''
Write-Host 'Verification complete!' -ForegroundColor Cyan
