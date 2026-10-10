param([string]$Database = 'SushantSynapsePlatform',[string]$Server = '(localdb)\MSSQLLocalDB')
$ErrorActionPreference = 'Stop'
if ($Database -notmatch '^[A-Za-z][A-Za-z0-9_]{0,100}$') { throw 'Invalid database name' }
if ($Server -notin @('(localdb)\MSSQLLocalDB','.\SQLEXPRESS')) { throw 'Only this computer LocalDB or SQL Express instance is supported' }
$root = Split-Path $PSScriptRoot -Parent
$encrypt = $Server -ne '(localdb)\MSSQLLocalDB'
$connection = New-Object System.Data.SqlClient.SqlConnection "Server=$Server;Database=master;Integrated Security=True;Encrypt=$encrypt;TrustServerCertificate=True;Connect Timeout=15"
$keys = @('DATABASE_PROVIDER','SQLSERVER_SERVER','SQLSERVER_DATABASE','SQLSERVER_AUTH','SQLSERVER_LOCAL_INSTANCE','SQLSERVER_TRUST_CERTIFICATE','NODE_ENV')
$saved = @{}
foreach ($key in $keys) { $saved[$key] = [Environment]::GetEnvironmentVariable($key,'Process') }
try {
    $connection.Open()
    $command = $connection.CreateCommand()
    $command.CommandText = "IF DB_ID(@database) IS NULL CREATE DATABASE [$Database]"
    [void]$command.Parameters.AddWithValue('@database',$Database)
    [void]$command.ExecuteNonQuery()
    $env:DATABASE_PROVIDER='sqlserver'; $env:SQLSERVER_SERVER=$Server; $env:SQLSERVER_DATABASE=$Database
    $env:SQLSERVER_AUTH='integrated'; $env:SQLSERVER_LOCAL_INSTANCE='1'; $env:SQLSERVER_TRUST_CERTIFICATE='1'; $env:NODE_ENV='production'
    & node (Join-Path $root 'infrastructure/sqlserver.cjs') init
    if ($LASTEXITCODE -ne 0) { throw 'Local SQL schema initialization failed' }
    Write-Output "Local database ready: $Server / $Database. Existing records were not replaced."
} finally {
    $connection.Dispose()
    foreach ($key in $keys) { [Environment]::SetEnvironmentVariable($key,$saved[$key],'Process') }
}
