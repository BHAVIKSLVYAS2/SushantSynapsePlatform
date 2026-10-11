// Sequential callbacks preserve ordering and staged read-your-write semantics.
async function map(items,fn){const out=[];for(let i=0;i<items.length;i++)out.push(await fn(items[i],i,items));return out;}
async function filter(items,fn){const out=[];for(let i=0;i<items.length;i++)if(await fn(items[i],i,items))out.push(items[i]);return out;}
async function some(items,fn){for(let i=0;i<items.length;i++)if(await fn(items[i],i,items))return true;return false;}
async function every(items,fn){for(let i=0;i<items.length;i++)if(!await fn(items[i],i,items))return false;return true;}
async function find(items,fn){for(let i=0;i<items.length;i++)if(await fn(items[i],i,items))return items[i];}
async function forEach(items,fn){for(let i=0;i<items.length;i++)await fn(items[i],i,items);}
async function flatMap(items,fn){return (await map(items,fn)).flat();}
module.exports={map,filter,some,every,find,forEach,flatMap};
