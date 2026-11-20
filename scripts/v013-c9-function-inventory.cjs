'use strict';
// C9 conservative inventory. An unreferenced name is NOT deletion proof.
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),ROOTS=['combat','economy','online','preview'];
function walk(p){
 const abs=path.join(ROOT,p);if(!fs.existsSync(abs))return [];
 return fs.readdirSync(abs,{withFileTypes:true}).flatMap(e=>{
  if(['node_modules','docs','.git','reports'].includes(e.name))return [];
  const rel=path.posix.join(p,e.name);
  return e.isDirectory()?walk(rel):e.isFile()&&/\.(?:[cm]?js|html)$/.test(e.name)?[rel]:[];
 });
}
const live=[...new Set(['index.html',...ROOTS.flatMap(walk)])].sort();
const aux=[...new Set([...walk('tests'),...walk('scripts')])].sort();
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');
const code=new Map([...live,...aux].map(p=>[p,read(p)]));
const htmlScripts=[];
for(const p of live.filter(p=>p.endsWith('.html'))){
 let n=0;for(const match of code.get(p).matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)){
  if(match[1].trim())htmlScripts.push({file:p+'#inline-'+(++n),source:match[1]});
 }
}
const virtual=[...live.map(file=>({file,source:code.get(file)})),...htmlScripts];
const reserve=new Set('if else for while switch catch try do return throw new function class import export typeof void delete async await get set constructor'.split(' '));
const functions=[];
function add(file,source,name,index,kind){
 if(reserve.has(name))return;
 const line=source.slice(0,index).split('\n').length;
 if(functions.some(x=>x.file===file&&x.name===name&&x.line===line))return;
 functions.push({file,line,name,kind});
}
for(const {file,source:s} of virtual){
 if(file.endsWith('.html'))continue;
 for(const m of s.matchAll(/\b(?:async\s+)?function\s*\*?\s*([A-Za-z_$][\w$]*)\s*\(/g))add(file,s,m[1],m.index,'declaration');
 for(const m of s.matchAll(/\b(?:const|let|var)\s+([A-Za-z_$][\w$]*)\s*=\s*(?:(?:async\s+)?function\b|\([^)]{0,300}\)\s*=>|(?:async\s+)?[A-Za-z_$][\w$]*\s*=>)/g))add(file,s,m[1],m.index,'assigned');
 for(const m of s.matchAll(/(?:^|[,;{])\s*(?:async\s+)?([A-Za-z_$][\w$]*)\s*\([^()]{0,200}\)\s*\{/gm))add(file,s,m[1],m.index,'method-candidate');
 for(const m of s.matchAll(/\b([A-Za-z_$][\w$]*)\s*:\s*(?:async\s*)?(?:function\b|\([^)]{0,160}\)\s*=>)/g))add(file,s,m[1],m.index,'object-property-candidate');
}
const namedExports=[];
for(const {file,source:s} of virtual){
 for(const m of s.matchAll(/\bexport\s+(?:default\s+)?(?:async\s+)?(?:function|class|const|let|var)\s+([A-Za-z_$][\w$]*)/g))namedExports.push({file,name:m[1],kind:'esm'});
 for(const m of s.matchAll(/\bexport\s*\{([^}]+)\}/g))for(const x of m[1].split(',')){const n=x.trim().split(/\s+as\s+/)[0];if(/^[A-Za-z_$][\w$]*$/.test(n))namedExports.push({file,name:n,kind:'esm-list'});}
 for(const m of s.matchAll(/(?:root|globalThis|window)\.([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\s*\(\s*)?\{/g))namedExports.push({file,name:m[1],kind:'global-object'});
 for(const m of s.matchAll(/\bmodule\.exports\s*=\s*(?:Object\.freeze\s*\(\s*)?\{/g))namedExports.push({file,name:'module.exports',kind:'commonjs-object'});
 for(const m of s.matchAll(/(?:root|globalThis|window)\.([A-Za-z_$][\w$]*)\s*=\s*(?:Object\.freeze\s*\(\s*)?[A-Za-z_$]/g))if(!namedExports.some(e=>e.file===file&&e.name===m[1]))namedExports.push({file,name:m[1],kind:'global-assignment'});
}
const buildcraft=code.get('combat/v012-buildcraft.js');
const exportLine=buildcraft.match(/(?:root|globalThis)\.WandererV012Buildcraft\s*=\s*Object\.freeze\(\{([^}]+)\}\)/)?.[1]||'';
const buildcraftMembers=exportLine.split(',').map(x=>x.trim().split(':')[0]).filter(Boolean);
function hits(expr,arr){return arr.flatMap(file=>{const text=code.get(file)||'';const count=[...text.matchAll(expr)].length;return count?[{file,count}]:[];});}
const exportedMembers=buildcraftMembers.map(name=>{
 const expr=new RegExp('(?:\\.|\\[\\s*[\\x27\\x22])'+name+'(?:\\b|[\\x27\\x22]\\s*\\])','g');
 return {name,runtimeReferences:hits(expr,live.filter(p=>p!=='combat/v012-buildcraft.js')),auxReferences:hits(expr,aux)};
});
const seen=new Set();
const namedUnique=namedExports.filter(x=>{const key=x.file+':'+x.name+':'+x.kind;if(seen.has(key))return false;seen.add(key);return true;});
// A cross-file identifier index avoids expensive repeated scans. It is a
// conservative name-mention census, NOT a resolved JavaScript call graph.
const fnNames=new Set(functions.map(f=>f.name));
function namesIn(file,text){
 const counts=new Map();
 for(const m of text.matchAll(/\b[A-Za-z_$][\w$]*\b/g))
  if(fnNames.has(m[0]))counts.set(m[0],(counts.get(m[0])||0)+1);
 return {file,counts};
}
const liveCounts=virtual.map(v=>namesIn(v.file,v.source));
const auxCounts=aux.map(f=>namesIn(f,code.get(f)));
const functionReferences=functions.map(f=>{
 const own=liveCounts.find(v=>v.file===f.file)?.counts.get(f.name)||0;
 const otherLive=liveCounts.filter(v=>v.file!==f.file&&v.counts.has(f.name)).map(v=>({file:v.file,mentions:v.counts.get(f.name)}));
 const auxiliary=auxCounts.filter(v=>v.counts.has(f.name)).map(v=>({file:v.file,mentions:v.counts.get(f.name)}));
 return {...f,ownMentions:own,otherLive,auxiliary,
  status:own<=1&&!otherLive.length&&!auxiliary.length?'UNREFERENCED_IDENTIFIER_CANDIDATE':'REVIEW_REFERENCES'};
});
const singleMentionCandidates=functionReferences.filter(f=>f.status==='UNREFERENCED_IDENTIFIER_CANDIDATE');
const byName=new Map();
for(const f of functions){let a=byName.get(f.name)||new Set();a.add(f.file);byName.set(f.name,a);}
const sharedNames=[...byName.entries()].filter(([,a])=>a.size>1).map(([name,a])=>({name,files:[...a]})).sort((a,b)=>b.files.length-a.files.length);
// Object exports in global namespace and CommonJS are distinct from ESM exports.
const globalObjectMembers=[];
for(const {file,source:content} of virtual){
 for(const m of content.matchAll(/(?:root|globalThis|window)\.([A-Za-z_$][\w$]*)\s*=\s*Object\.freeze\s*\(\s*\{([^}\n]+)\}\s*\)/g)){
  const members=m[2].split(',').map(z=>z.trim().split(':')[0]).filter(z=>/^[A-Za-z_$][\w$]*$/.test(z));
  globalObjectMembers.push({file,object:m[1],members});
 }
 for(const m of content.matchAll(/\bmodule\.exports\s*=\s*\{([^}\n]+)\}/g)){
  const members=m[1].split(',').map(z=>z.trim().split(':')[0]).filter(z=>/^[A-Za-z_$][\w$]*$/.test(z));
  globalObjectMembers.push({file,object:'module.exports',members});
 }
}
const retiredPathPattern=/\b(?:routeMap|routeEdges|routePositions|rerollsByRealm|freeBuild|legacyTopology|legacyBasic|legacyFocused|legacyV14)\b/g;
const retiredPathMatches=virtual.flatMap(v=>[...v.source.matchAll(retiredPathPattern)].map(m=>({file:v.file,line:v.source.slice(0,m.index).split('\n').length,token:m[0]})));
const inventory={
 schema:'c9-inventory-v1',sha:process.env.GITHUB_SHA||'local',
 scope:{liveFiles:live.length,auxFiles:aux.length,inlineBlocks:htmlScripts.length,
 note:'Heuristic inventory: dynamic references and aliases need manual proof before removal'},
 functions,functionReferences,namedExports:namedUnique,globalObjectMembers,sharedNames,retiredPathMatches,buildcraftExports:exportedMembers,
 candidates:exportedMembers.filter(x=>!x.runtimeReferences.length),singleMentionCandidates,
 limitations:['Object methods and unusual arrow syntaxes may be under/over-counted',
 'Computed access window[string] and reflection cannot be ruled out statically',
 'Exported names without external refs may still be used internally',
 'Generated callback and UI state reachability requires browser confirmation']
};
const out=path.join(ROOT,'reports/v013-c9-function-inventory.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(inventory,null,2)+'\n');
const summary={
 liveFiles:live.length,auxFiles:aux.length,inlineBlocks:htmlScripts.length,
 functionLike:functions.length,namedExports:namedUnique.length,
 buildcraftMembers:exportedMembers.length,globalObjectExportGroups:globalObjectMembers.length,duplicateIdentifierGroups:sharedNames.length,singleMentionCandidates:singleMentionCandidates.length,retiredPathMatches:retiredPathMatches.slice(0,25),
 noCrossRuntimeReference:inventory.candidates.map(x=>({name:x.name,aux:x.auxReferences.map(y=>y.file)})),
 perDirectory:Object.fromEntries(['combat','economy','online','preview','index.html'].map(k=>[k,functions.filter(x=>x.file===k||x.file.startsWith(k+'/')).length]))
};
console.log('C9_FUNCTION_INVENTORY='+JSON.stringify(summary));
console.log('C9_UNREFERENCED_FUNCTION_CANDIDATES='+JSON.stringify(singleMentionCandidates.slice(0,35).map(x=>({file:x.file,line:x.line,name:x.name,kind:x.kind}))));
console.log('C9_SHARED_NAMES='+JSON.stringify(sharedNames.slice(0,12).map(x=>({name:x.name,files:x.files.slice(0,8)}))));
if(process.argv.includes('--print-buildcraft'))console.log('C9_BUILDCRAFT_DETAILS='+JSON.stringify(exportedMembers));
module.exports={inventory};
