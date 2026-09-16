// Isolated test data only. Never load this module from production code.
function edition(date){return {date,cutoff:date+'T04:00:00.000Z',publishedAt:date+'T04:01:00.000Z',model:'test-fixture',promptVersion:'test-1',satire:{title:'Test satire',body:'Fictional commentary for an isolated test.',storyPosition:1},stories:Array.from({length:10},(_,i)=>({title:`Test headline ${i+1} for ${date}`,brief:'Test brief. <script>window.injected=true</script>',source:'Example source',url:`https://example.com/${date}/${i+1}`,publishedAt:date+'T03:00:00.000Z'}))};}
module.exports={edition};
