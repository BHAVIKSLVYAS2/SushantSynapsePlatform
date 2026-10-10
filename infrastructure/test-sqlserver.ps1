param([string]$Server = '.\SQLEXPRESS')
$ErrorActionPreference='Stop'
$testDatabase='synapse_schema_test_'+[guid]::NewGuid().ToString('N')
$created=$false
$restoreDatabase='synapse_schema_test_'+[guid]::NewGuid().ToString('N')
$restoreCreated=$false
$exportFile=Join-Path ([IO.Path]::GetTempPath()) ('synapse-sql-export-'+[guid]::NewGuid().ToString('N')+'.sql')
$connection=New-Object System.Data.SqlClient.SqlConnection "Server=$Server;Database=master;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;Connect Timeout=10"
$savedEnvironment=@{}
foreach($key in @('SQLSERVER_SERVER','SQLSERVER_DATABASE','SQLSERVER_AUTH','SQLSERVER_TRUST_CERTIFICATE','DATABASE_PROVIDER','SQLSERVER_AUTO_MIGRATE','SQLSERVER_TEST_EXPORT','NODE_ENV')) { $savedEnvironment[$key]=[Environment]::GetEnvironmentVariable($key,'Process') }
try {
 $connection.Open()
 $command=$connection.CreateCommand()
 $command.CommandText="CREATE DATABASE [$testDatabase]"
 [void]$command.ExecuteNonQuery();$created=$true
 $env:SQLSERVER_SERVER=$Server;$env:SQLSERVER_DATABASE=$testDatabase;$env:SQLSERVER_AUTH='integrated';$env:SQLSERVER_TRUST_CERTIFICATE='1';$env:DATABASE_PROVIDER='sqlserver';$env:SQLSERVER_AUTO_MIGRATE='1';$env:NODE_ENV='test'
 $env:SQLSERVER_TEST_EXPORT=$exportFile
 & node (Join-Path $PSScriptRoot '..\tests\sqlserver-integration.cjs')
 if($LASTEXITCODE -ne 0) { throw 'SQL Server integration checks failed' }
 $command.CommandText="CREATE DATABASE [$restoreDatabase]";[void]$command.ExecuteNonQuery();$restoreCreated=$true
 $restoreConnection=New-Object System.Data.SqlClient.SqlConnection "Server=$Server;Database=$restoreDatabase;Integrated Security=True;Encrypt=True;TrustServerCertificate=True;Connect Timeout=10"
 try {
  $restoreConnection.Open();$restoreCommand=$restoreConnection.CreateCommand();$restoreCommand.CommandTimeout=120;$restoreCommand.CommandText=[IO.File]::ReadAllText($exportFile);[void]$restoreCommand.ExecuteNonQuery()
  $restoreCommand.CommandText="SELECT COUNT(*) FROM [platform].[users]";if($restoreCommand.ExecuteScalar() -ne 3) { throw 'Restored account verification failed' }
  $restoreCommand.CommandText="SELECT COUNT(*) FROM [news].[news_editions]";if($restoreCommand.ExecuteScalar() -ne 2) { throw 'Restored News verification failed' }
  $restoreCommand.CommandText="SELECT reaction FROM [satire].[arena_all_votes]";if($restoreCommand.ExecuteScalar() -ne 'applause') { throw 'Restored Satire ballot verification failed' }
  $restoreCommand.CommandText="SELECT content FROM [chambers].[files] WHERE id='retained-document'";if([Convert]::ToBase64String($restoreCommand.ExecuteScalar()) -ne 'AAH/') { throw 'Restored document verification failed' }
  Write-Output 'Native full SQL export restored successfully into a second empty test database.'
 } finally { $restoreConnection.Dispose() }
} finally {
 foreach($key in $savedEnvironment.Keys) { [Environment]::SetEnvironmentVariable($key,$savedEnvironment[$key],'Process') }
 if($created) {
  if($testDatabase -notmatch '^synapse_schema_test_[a-f0-9]{32}$') { throw 'Refusing to clean an unexpected SQL database name' }
  $command=$connection.CreateCommand();$command.CommandText="ALTER DATABASE [$testDatabase] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$testDatabase]";[void]$command.ExecuteNonQuery()
 }
 if($restoreCreated) {
  if($restoreDatabase -notmatch '^synapse_schema_test_[a-f0-9]{32}$') { throw 'Refusing to clean an unexpected restore database name' }
  $command=$connection.CreateCommand();$command.CommandText="ALTER DATABASE [$restoreDatabase] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$restoreDatabase]";[void]$command.ExecuteNonQuery()
 }
 if(Test-Path -LiteralPath $exportFile) { Remove-Item -LiteralPath $exportFile }
 $connection.Dispose()
}
