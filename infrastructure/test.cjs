'use strict';
const {spawnSync}=require('node:child_process'),fs=require('node:fs');
// Compatibility tests own temporary DATA_DIR fixtures; never inherit live SQL settings.
const env={...process.env,DATABASE_PROVIDER:'sqlite',NODE_ENV:'test'};
for(const key of Object.keys(env))if(key.startsWith('SQLSERVER_'))delete env[key];
const files=fs.readdirSync('tests').filter(file=>file.endsWith('.test.js')).map(file=>'tests/'+file);
const result=spawnSync(process.execPath,['--test',...files],{env,stdio:'inherit',windowsHide:true});
if(result.error)throw result.error;
process.exitCode=result.status??1;
