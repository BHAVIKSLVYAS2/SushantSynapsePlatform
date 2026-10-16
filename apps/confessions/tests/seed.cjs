// Isolated browser fixtures only. Never load from application code.
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{Store}=require('../../advocate/backend/store');
const dir=path.resolve(process.argv[2]);if(path.dirname(dir)!==path.resolve(os.tmpdir())||!path.basename(dir).startsWith('synapse-confession-browser-'))throw Error('Use an isolated temporary confession fixture directory');
const store=new Store(dir);try{store.setSetting('confessions-v1',{version:1,items:Array.from({length:8},(_,i)=>({id:crypto.randomUUID(),message:'A reviewed thought '+i+' <script>window.injected=true</script>',status:'approved',createdAt:new Date(Date.now()-10000+i).toISOString(),expiresAt:new Date(Date.now()+86400000).toISOString()}))});}finally{store.sql.close();}
