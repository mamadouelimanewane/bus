# ============================================
# SunuBus v5.0 — Build APK pour Android
# Exécuter dans PowerShell sur Windows
# ============================================

Write-Host "=== SunuBus v5.0 APK Builder ===" -ForegroundColor Cyan

# 1. Installer les dependances
Write-Host "[1/4] Installation des dependances..." -ForegroundColor Yellow
npm install

# 2. Build web
Write-Host "[2/4] Build de l'application web..." -ForegroundColor Yellow
npm run build

# 3. Sync Capacitor
Write-Host "[3/4] Synchronisation Capacitor..." -ForegroundColor Yellow
npx cap sync android

# 4. Build APK
Write-Host "[4/4] Build APK Android..." -ForegroundColor Yellow
Set-Location android
.\gradlew.bat assembleDebug --no-daemon

# Result
$apk = "app\build\outputs\apk\debug\app-debug.apk"
if (Test-Path $apk) {
    $size = [math]::Round((Get-Item $apk).Length / 1MB, 1)
    Copy-Item $apk "..\sunubus-v5.0.apk"
    Write-Host ""
    Write-Host "APK GENERE AVEC SUCCES!" -ForegroundColor Green
    Write-Host "Fichier: sunubus-v5.0.apk ($size MB)" -ForegroundColor Green
    Write-Host "Transferez-le sur votre telephone Android pour l'installer." -ForegroundColor White
} else {
    Write-Host "ERREUR: APK non genere. Verifiez qu'Android Studio ou le SDK est installe." -ForegroundColor Red
    Write-Host "Installez Android Studio: https://developer.android.com/studio" -ForegroundColor Yellow
}
Set-Location ..
