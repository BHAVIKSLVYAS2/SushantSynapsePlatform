'use strict';
const {SqlServerDatabase}=require('../packages/database/sqlserver');
const command=process.argv[2];
if(!['init','import'].includes(command))throw Error('Use init or import --source <snapshot/dump>');
if(command!=='init'&&(process.argv[3]!=='--source'||!process.argv[4]))throw Error('Import requires an explicit source');
let db;try{db=new SqlServerDatabase({migrate:command==='init'});if(command==='init')console.log('Verified eight schemas in one SQL Server database.');else{const {importSqlite}=require('../packages/database/sqlserver-transfer');const result=importSqlite(db,process.argv[4]);console.log(JSON.stringify({verifiedTables:result.tables.length,rows:result.tables.reduce((n,t)=>n+t.rows,0),sessionsMigrated:false}));}}finally{db?.close();}
