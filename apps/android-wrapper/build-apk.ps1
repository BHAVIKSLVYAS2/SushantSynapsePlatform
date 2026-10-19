param([switch]$Offline, [switch]$UseGradle)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$repoRoot = [System.IO.Path]::GetFullPath((Join-Path $projectRoot '../..'))
$version = ConvertFrom-StringData ([System.IO.File]::ReadAllText((Join-Path $projectRoot 'version.properties')))
if ($version.versionName -notmatch '^[0-9]+\.[0-9]+\.[0-9]+$') { throw 'Invalid versionName' }
$sdkRoot = $env:ANDROID_HOME
if (!$sdkRoot) { $sdkRoot = Join-Path $env:LOCALAPPDATA 'Android/Sdk' }
if (!(Test-Path (Join-Path $sdkRoot 'platforms/android-36/android.jar'))) { throw 'Install Android SDK platform 36 and build-tools 36.0.0, and set ANDROID_HOME.' }
$sdkProperty = $sdkRoot.Replace('\','/')
[System.IO.File]::WriteAllText((Join-Path $projectRoot 'local.properties'), "sdk.dir=$sdkProperty`n", [System.Text.UTF8Encoding]::new($false))
$signingRoot = Join-Path $repoRoot '.publish/android-signing'
New-Item -ItemType Directory -Force $signingRoot | Out-Null
$configPath = Join-Path $signingRoot 'signing.json'
$keyPath = Join-Path $signingRoot 'platform-release.jks'
if (!(Test-Path $configPath)) {
    if (Test-Path $keyPath) { throw 'Signing key exists without signing.json. Restore its matching configuration; do not replace the key.' }
    $random = New-Object byte[] 32
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($random) } finally { $rng.Dispose() }
    $config = @{password=[Convert]::ToBase64String($random)}
    [System.IO.File]::WriteAllText($configPath, ($config | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
}
$signing = Get-Content -LiteralPath $configPath -Raw | ConvertFrom-Json
$env:SYNAPSE_ANDROID_STORE_PASSWORD = $signing.password
$env:SYNAPSE_ANDROID_KEYSTORE = $keyPath
try {
    if (!(Test-Path $keyPath)) {
        & keytool -genkeypair -keystore $keyPath -alias synapse-platform -keyalg RSA -keysize 3072 -validity 10000 -storetype JKS -storepass:env SYNAPSE_ANDROID_STORE_PASSWORD -keypass:env SYNAPSE_ANDROID_STORE_PASSWORD -dname 'CN=Sushant Synapse Platform, O=Sushant Synapse, C=IN' -noprompt
        if ($LASTEXITCODE -ne 0) { throw 'Signing key creation failed.' }
    }
    Copy-Item -LiteralPath (Join-Path $repoRoot 'apps/portal/frontend/logo-adaptive-512.png') -Destination (Join-Path $projectRoot 'app/src/main/res/drawable-nodpi/company_logo.png')
    if ($UseGradle) {
        $arguments = @('-p', $projectRoot, 'assembleRelease', 'lintRelease', '--console=plain')
        if ($Offline) { $arguments += '--offline' }
        & (Join-Path $projectRoot 'gradlew.bat') @arguments
        if ($LASTEXITCODE -ne 0) { throw 'Android build or lint failed.' }
        $builtApk = Join-Path $projectRoot 'app/build/outputs/apk/release/app-release.apk'
    } else {
        & (Join-Path $projectRoot 'build-sdk.ps1') -SdkRoot $sdkRoot
        $builtApk = Join-Path $projectRoot 'app/build/sdk/app-release.apk'
    }
    $output = Join-Path $repoRoot '.publish/android'
    New-Item -ItemType Directory -Force $output | Out-Null
    $apk = Join-Path $output ("Sushant-Synapse-Platform-" + $version.versionName + '.apk')
    Copy-Item -LiteralPath $builtApk -Destination $apk
    & (Join-Path $sdkRoot 'build-tools/36.0.0/apksigner.bat') verify --verbose --print-certs $apk
    if ($LASTEXITCODE -ne 0) { throw 'APK signature verification failed.' }
    Get-FileHash -LiteralPath $apk -Algorithm SHA256 | Format-List
    $release = [ordered]@{
        appName='Sushant Synapse Platform'; applicationId='com.sushantsynapse.platform'
        versionName=$version.versionName; versionCode=[int]$version.versionCode
        website='https://apps.sushantsynapse.com/'; minSdk=26; targetSdk=36
        file=[System.IO.Path]::GetFileName($apk); bytes=(Get-Item -LiteralPath $apk).Length
        sha256=(Get-FileHash -LiteralPath $apk -Algorithm SHA256).Hash.ToLowerInvariant()
        signatureVerified=$true; buildMethod=$(if ($UseGradle) { 'gradle' } else { 'android-sdk-tools' })
        onDeviceVerification='Not performed by build script'
    }
    [System.IO.File]::WriteAllText((Join-Path $output 'release.json'), ($release | ConvertTo-Json), [System.Text.UTF8Encoding]::new($false))
    Write-Output "APK: $apk"
    Write-Output 'Keep .publish/android-signing/platform-release.jks AND signing.json in a secure private backup; future compatible updates require this same key.'
} finally {
    Remove-Item Env:SYNAPSE_ANDROID_STORE_PASSWORD -ErrorAction SilentlyContinue
    Remove-Item Env:SYNAPSE_ANDROID_KEYSTORE -ErrorAction SilentlyContinue
}
