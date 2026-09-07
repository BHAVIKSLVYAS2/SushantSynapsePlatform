$ErrorActionPreference = 'Stop'
$platformRoot = Split-Path $PSScriptRoot -Parent
Set-Location -LiteralPath $platformRoot
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
