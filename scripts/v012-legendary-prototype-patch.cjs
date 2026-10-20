// Test-only combat hooks for the 12 proposed affinity Legendaries.
// Injected into a VM copy of the native combat runtime, never committed to runtime code.
const fs=require('node:fs'),path=require('node:path');
const native=fs.readFileSync(path.join(__dirname,'../combat/v012-combat-runtime.js'),'utf8');
function replaceOnce(src,find,sub){
 const hits=src.split(find).length-1;
 if(hits!==1)throw Error('Legacy prototype hook mismatch ('+hits+'): '+find.slice(0,85));
 return src.replace(find,sub);
}
const hooks=String.raw