const path=require('node:path'),os=require('node:os');
const {Store}=require('../../advocate/backend/store');
const {createNewsRepository}=require('../backend/repository');
const {edition}=require('./fixtures');
const dir=path.resolve(process.argv[2]);
if(path.dirname(dir)!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('synapse-news-'))throw Error('Fixtures require an isolated temporary News test directory');
const store=new Store(dir);
try{const repo=createNewsRepository(store);repo.publish(edition('2025-01-01'));repo.publish(edition('2025-01-03'));}finally{store.sql.close();}
