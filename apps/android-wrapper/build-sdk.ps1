param([Parameter(Mandatory=$true)][string]$SdkRoot)
$ErrorActionPreference = 'Stop'
$projectRoot = $PSScriptRoot
$work = Join-Path $projectRoot 'app/build/sdk'
$tools = Join-Path $SdkRoot 'build-tools/36.0.0'
$androidJar = Join-Path $SdkRoot 'platforms/android-36/android.jar'
$version = ConvertFrom-StringData ([System.IO.File]::ReadAllText((Join-Path $projectRoot 'version.properties')))
if ($version.versionCode -notmatch '^[1-9][0-9]*$' -or $version.versionName -notmatch '^[0-9]+\.[0-9]+\.[0-9]+$') { throw 'Invalid version.properties' }
foreach ($folder in @($work, "$work/generated/com/sushantsynapse/platform", "$work/classes", "$work/dex")) { New-Item -ItemType Directory -Force $folder | Out-Null }
function Run-Tool([string]$tool, [string[]]$arguments) { & $tool @arguments; if ($LASTEXITCODE -ne 0) { throw "Android tool failed: $tool" } }
$manifest = [System.IO.File]::ReadAllText((Join-Path $projectRoot 'app/src/main/AndroidManifest.xml')).Replace('<manifest xmlns:', '<manifest package="com.sushantsynapse.platform" xmlns:')
[System.IO.File]::WriteAllText("$work/AndroidManifest.xml", $manifest, [System.Text.UTF8Encoding]::new($false))
$config = 'package com.sushantsynapse.platform; public final class BuildConfig { public static final boolean DEBUG=false; public static final String VERSION_NAME="' + $version.versionName + '"; public static final String SITE_URL="https://apps.sushantsynapse.com/"; }'
[System.IO.File]::WriteAllText("$work/generated/com/sushantsynapse/platform/BuildConfig.java", $config, [System.Text.UTF8Encoding]::new($false))
Run-Tool "$tools/aapt2.exe" @('compile', '--dir', "$projectRoot/app/src/main/res", '-o', "$work/resources.zip")
Run-Tool "$tools/aapt2.exe" @('link', '-o', "$work/unsigned.apk", '-I', $androidJar, '--manifest', "$work/AndroidManifest.xml", '--java', "$work/generated", '--min-sdk-version', '26', '--target-sdk-version', '36', '--version-code', $version.versionCode, '--version-name', $version.versionName, '-A', "$projectRoot/app/src/main/assets", "$work/resources.zip")
$sources = @(Get-ChildItem -LiteralPath "$projectRoot/app/src/main/java" -Recurse -Filter '*.java' | ForEach-Object FullName) + @(Get-ChildItem -LiteralPath "$work/generated" -Recurse -Filter '*.java' | ForEach-Object FullName)
Run-Tool 'javac' (@('-encoding', 'UTF-8', '-source', '17', '-target', '17', '-classpath', $androidJar, '-d', "$work/classes") + $sources)
Run-Tool 'jar' @('--create', '--file', "$work/classes.jar", '-C', "$work/classes", '.')
Run-Tool "$tools/d8.bat" @('--release', '--lib', $androidJar, '--min-api', '26', '--output', "$work/dex", "$work/classes.jar")
Run-Tool 'jar' @('--update', '--file', "$work/unsigned.apk", '-C', "$work/dex", 'classes.dex')
Run-Tool "$tools/zipalign.exe" @('-f', '-p', '4', "$work/unsigned.apk", "$work/aligned.apk")
if (!$env:SYNAPSE_ANDROID_KEYSTORE -or !$env:SYNAPSE_ANDROID_STORE_PASSWORD) { throw 'Run build-apk.ps1 to initialize signing.' }
Run-Tool "$tools/apksigner.bat" @('sign', '--ks', $env:SYNAPSE_ANDROID_KEYSTORE, '--ks-key-alias', 'synapse-platform', '--ks-pass', 'env:SYNAPSE_ANDROID_STORE_PASSWORD', '--key-pass', 'env:SYNAPSE_ANDROID_STORE_PASSWORD', '--out', "$work/app-release.apk", "$work/aligned.apk")
