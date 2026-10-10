'use strict';
function configFromEnv(env=process.env){
 if(!env.SQLSERVER_SERVER||!env.SQLSERVER_DATABASE)throw Error('SQLSERVER_SERVER and SQLSERVER_DATABASE are required');
 const auth=env.SQLSERVER_AUTH||'managed-identity';
 const config={server:env.SQLSERVER_SERVER,database:env.SQLSERVER_DATABASE,connectionTimeout:15000,requestTimeout:30000,pool:{min:0,max:4,idleTimeoutMillis:30000},options:{encrypt:true,trustServerCertificate:false,abortTransactionOnError:true}};
 if(env.SQLSERVER_PORT){const port=Number(env.SQLSERVER_PORT);if(!Number.isInteger(port)||port<1||port>65535)throw Error('Invalid SQLSERVER_PORT');config.port=port;}
 if(auth==='sql'){if(!env.SQLSERVER_USER||!env.SQLSERVER_PASSWORD)throw Error('SQL authentication requires SQLSERVER_USER and SQLSERVER_PASSWORD');config.user=env.SQLSERVER_USER;config.password=env.SQLSERVER_PASSWORD;}
 else if(auth==='managed-identity'){config.authentication={type:'azure-active-directory-default',options:env.AZURE_CLIENT_ID?{clientId:env.AZURE_CLIENT_ID}:{}};}
 else if(auth==='integrated'&&env.NODE_ENV!=='production'){config.options.trustedConnection=true;config.driver='ODBC Driver 18 for SQL Server';}
 else throw Error('Unsupported SQLSERVER_AUTH');
 if(env.SQLSERVER_TRUST_CERTIFICATE==='1'){if(env.NODE_ENV==='production')throw Error('Production SQL Server requires certificate verification');config.options.trustServerCertificate=true;}
 if(auth==='integrated'){
  if(/[;{}]/.test(config.server+config.database))throw Error('Invalid integrated-authentication target');
  config.connectionString=`Driver={ODBC Driver 18 for SQL Server};Server=${config.server};Database=${config.database};Trusted_Connection=Yes;Encrypt=Yes;TrustServerCertificate=${config.options.trustServerCertificate?'Yes':'No'};`;
 }
 return {config,driver:auth==='integrated'?'mssql/msnodesqlv8':'mssql'};
}
module.exports={configFromEnv};
