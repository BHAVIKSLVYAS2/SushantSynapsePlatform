// Split SQLite SQL without interpreting semicolons/comment words inside strings,
// quoted identifiers or trigger bodies. Also used to validate offline SQL exports.
function statements(source){
 const result=[];let current='',quote=null,word='',tokens=[],trigger=false,depth=0,began=false;
 const token=()=>{if(!word)return;const value=word.toUpperCase();tokens.push(value);if(tokens[0]==='CREATE'&&(tokens[1]==='TRIGGER'||(['TEMP','TEMPORARY'].includes(tokens[1])&&tokens[2]==='TRIGGER')))trigger=true;if(trigger&&(value==='BEGIN'||value==='CASE')){depth++;began=true;}else if(trigger&&value==='END')depth--;word='';};
 const finish=()=>{token();if(current.trim())result.push(current.trim());current='';tokens=[];trigger=false;depth=0;began=false;};
 for(let i=0;i<source.length;i++){
  const c=source[i],next=source[i+1];
  if(quote){current+=c;if(c===quote){if(next===quote&&quote!==']'){current+=next;i++;}else quote=null;}continue;}
  if(c==='-'&&next==='-'){token();while(i<source.length&&source[i]!=='\n')i++;current+='\n';continue;}
  if(c==='/'&&next==='*'){token();i+=2;while(i<source.length&&!(source[i]==='*'&&source[i+1]==='/'))i++;if(i>=source.length)throw Error('Unclosed SQL comment');i++;current+=' ';continue;}
  if(c==="'"||c==='"'||c==='`'||c==='['){token();quote=c==='['?']':c;current+=c;continue;}
  if(/[A-Za-z_]/.test(c)){word+=c;current+=c;continue;}
  token();if(c===';'&&(!trigger||(began&&depth===0))){finish();continue;}current+=c;
 }
 if(quote)throw Error('Unclosed SQL string or identifier');token();if(trigger&&depth!==0)throw Error('Unclosed SQL trigger');finish();return result;
}
module.exports={statements};
