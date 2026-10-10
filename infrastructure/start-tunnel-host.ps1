param([string]$ReleaseRoot,[string]$RuntimeConfig)
$ErrorActionPreference = 'Stop'
$platformRoot = Split-Path $PSScriptRoot -Parent
if (-not $ReleaseRoot) { $ReleaseRoot = $platformRoot }
$releasePath = (Resolve-Path -LiteralPath $ReleaseRoot).Path
if (-not (Test-Path -LiteralPath (Join-Path $releasePath 'server/index.js'))) {
    throw 'Release directory must contain server/index.js'
}
Set-Location -LiteralPath $releasePath
if (-not $RuntimeConfig) { $RuntimeConfig = Join-Path $platformRoot 'data/local-host.json' }
if (Test-Path -LiteralPath $RuntimeConfig) {
    $hostSettings = Get-Content -LiteralPath $RuntimeConfig -Raw | ConvertFrom-Json
    $allowedSettings = @('DATABASE_PROVIDER','SQLSERVER_SERVER','SQLSERVER_DATABASE','SQLSERVER_AUTH','SQLSERVER_LOCAL_INSTANCE','SQLSERVER_TRUST_CERTIFICATE','SQLSERVER_PORT','SQLSERVER_AUTO_MIGRATE','SQLSERVER_USER','SQLSERVER_PASSWORD','AZURE_CLIENT_ID','ARENA_COOKIE_SECRET','ARENA_PROXY_SECRET')
    foreach ($setting in $hostSettings.PSObject.Properties) {
        if ($allowedSettings -notcontains $setting.Name -or $setting.Value -isnot [string]) { throw 'Invalid protected runtime configuration' }
        [Environment]::SetEnvironmentVariable($setting.Name,$setting.Value,'Process')
    }
}
$env:NODE_ENV = 'production'
$env:PUBLIC_ORIGIN = 'https://apps.sushantsynapse.com'
$env:HOST = '127.0.0.1'
$env:PORT = '3001'
$env:DATA_DIR = Join-Path $platformRoot 'data'
# The existing owner keeps setup locked. Generate a private token for each run.
$env:SETUP_TOKEN = & node -e "process.stdout.write(require('node:crypto').randomBytes(32).toString('hex'))"
while ($true) {
    $ErrorActionPreference = 'Continue'
    & node server/index.js >> (Join-Path $platformRoot 'data/public-server.log') 2>&1
    Start-Sleep -Seconds 5
}
