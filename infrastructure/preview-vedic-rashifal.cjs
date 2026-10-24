const {createPreviewServer}=require('./preview-vedic-charts.cjs');
createPreviewServer(Number(process.argv[2]??4179),{rashifal:true}).then(server=>{
 console.log('Local Rashifal editorial preview: '+server.origin);process.on('SIGINT',()=>server.close().then(()=>process.exit(0)));
}).catch(error=>{console.error(error.message);process.exitCode=1;});
