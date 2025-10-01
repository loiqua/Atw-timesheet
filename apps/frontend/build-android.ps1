# Script PowerShell pour automatiser la creation de l'APK Android
# Usage: .\build-android.ps1 [debug|release]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('debug', 'release')]
    [string]$BuildType = 'debug'
)

Write-Host "Demarrage du build Android ($BuildType)..." -ForegroundColor Cyan

# Etape 1 : Verifier que nous sommes dans le bon dossier
if (-not (Test-Path "package.json")) {
    Write-Host "Erreur : Executez ce script depuis apps/frontend" -ForegroundColor Red
    exit 1
}

# Etape 2 : Build Next.js
Write-Host "`nEtape 1/4 : Build de l'application Next.js..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors du build Next.js" -ForegroundColor Red
    exit 1
}
Write-Host "Build Next.js termine" -ForegroundColor Green

# Etape 3 : Synchroniser Capacitor
Write-Host "`nEtape 2/4 : Synchronisation Capacitor..." -ForegroundColor Yellow
npx cap sync
if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la synchronisation" -ForegroundColor Red
    exit 1
}
Write-Host "Synchronisation terminee" -ForegroundColor Green

# Etape 4 : Build Android
Write-Host "`nEtape 3/4 : Compilation Android..." -ForegroundColor Yellow
if ($BuildType -eq 'release') {
    npm run android:build
} else {
    npm run android:build:debug
}

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erreur lors de la compilation Android" -ForegroundColor Red
    exit 1
}
Write-Host "Compilation Android terminee" -ForegroundColor Green

# Etape 5 : Localiser l'APK
Write-Host "`nEtape 4/4 : Localisation de l'APK..." -ForegroundColor Yellow
$apkPath = "android\app\build\outputs\apk\$BuildType\app-$BuildType.apk"
if (Test-Path $apkPath) {
    $fullPath = Resolve-Path $apkPath
    Write-Host "`nAPK genere avec succes !" -ForegroundColor Green
    Write-Host "Emplacement : $fullPath" -ForegroundColor Cyan
    
    # Ouvrir le dossier contenant l'APK
    $folder = Split-Path $fullPath
    Start-Process explorer.exe -ArgumentList $folder
} else {
    Write-Host "APK non trouve a l'emplacement attendu" -ForegroundColor Red
    exit 1
}

Write-Host "`nBuild termine avec succes !" -ForegroundColor Green
