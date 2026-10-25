// Source contracts follow the loaded canonical modules after extraction.
const fs=require('node:fs'),path=require('node:path');
module.exports=function runtimeSource(html){
 return html+[...html.matchAll(/<script[^>]+src="([^"]+-runtime\.js)"/g)].map(m=>fs.readFileSync(path.join(__dirname,'..',m[1]),'utf8').replaceAll('ports.','')).join('\n');
};
