// Resolve the saved appearance before styles or body content can paint.
function earlyTheme(html){
 const theme=html.match(/<script\b[^>]*\bsrc=["']\/shared\/theme\.js(?:\?[^"']*)?["'][^>]*>\s*<\/script>/i);
 if(!theme)return html;
 const script=theme[0].replace(/\s+defer\b/gi,'').replace(/\s+async\b/gi,'');
 return html.replace(theme[0],'').replace(/<head>/i,'<head>'+script);
}
module.exports={earlyTheme};
