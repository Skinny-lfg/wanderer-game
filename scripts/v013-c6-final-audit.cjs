'use strict';
const fs=require('node:fs'),path=require('node:path'),ROOT=path.resolve(__dirname,'..');
const ext=new Set(['.js','.cjs','.mjs','.html','.css']);
function walk(dir){
 const root=path.join(ROOT,dir);
 if(!fs.existsSync(root))return [];
 let paths=[];
 for(const item of fs.readdirSync(root,{withFileTypes:true})){
  if(['node_modules','docs','.git','reports'].includes(item.name))continue;
  const rel=path.posix.join(dir,item.name);
  if(item.isDirectory())paths.push(...walk(rel));
  else if(item.isFile()&&ext.has(path.extname(rel)))paths.push(rel);
 }
 return paths;
}
const active=['index.html',...walk('combat'),...walk('economy'),...walk('online'),...walk('preview/talent-rebuild')];
const auxiliary=[...walk('tests'),...walk('scripts')];
const files=[...new Set([...active,...auxiliary])];
const texts=new Map(files.map(f=>[f,fs.readFileSync(path.join(ROOT,f),'utf8')]));
const entrypoints=[];
for(const file of ['index.html','preview/talent-rebuild/index.html']){
 const html=texts.get(file);
 for(const match of html.matchAll(/<(script|link|iframe)\b[^>]*?\b(src|href)\s*=\s*["']([^"'<>]+)["']/gi)){
  const url=match[3];
  if(/^(?:https?:|data:|blob:|#|mailto:|\/\/)/.test(url)||/[{}$]/.test(url))continue;
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(file),url.split(/[?#]/)[0]));
  entrypoints.push({source:file,target,exists:fs.existsSync(path.join(ROOT,target))});
 }
}
const missingEntries=entrypoints.filter(x=>!x.exists),missingImports=[];
for(const [p,s] of texts){
 if(!/\.[cm]?js$/.test(p))continue;
 for(const m of [...s.matchAll(/\brequire\s*\(\s*["'](\.[^"']+)["']\s*\)/g),...s.matchAll(/\bfrom\s*["'](\.[^"']+)["']/g)]){
  const target=path.posix.normalize(path.posix.join(path.posix.dirname(p),m[1]));
  if([target,target+'.js',target+'.mjs',target+'.cjs',target+'/index.js'].some(t=>fs.existsSync(path.join(ROOT,t))))continue;
  missingImports.push({source:p,target});
 }
}
const retired=['combat/automatic-talents.js','combat/automatic-talent-layout.js','tests/v013-legacy-fixture.cjs'];
const retiredRefs=active.flatMap(p=>retired.filter(name=>texts.get(p).includes(name)).map(name=>({source:p,name})));
const counts={},details={};
const patterns={
 removedMethods:/phase1Controller\.(?:allowed|influence|select|chooseInitial|reroll|reachable)\s*\(/g,
 oldPaths:/\b(?:routeMap|routeEdges|routePositions|rerollsByRealm|freeBuild|legacyTopology|legacyBasic|legacyFocused|legacyV14)\b/g,
 historicalTree:/\b(?:allocateAttribute|attributePoints|migrateSave|migrateProfile)\b/g,
 debugMarkers:/\b(?:TODO|FIXME|HACK|NOT IMPLEMENTED)\b/gi
};
for(const [k,re] of Object.entries(patterns)){
 const matches=[];
 for(const p of active){
  const source=texts.get(p);
  for(const m of source.matchAll(re))matches.push({file:p,line:source.slice(0,m.index).split('\n').length,token:m[0],excerpt:source.slice(Math.max(0,m.index-80),m.index+105).replace(/\s+/g,' ')});
 }
 counts[k]=matches.length;details[k]=matches.slice(0,60);
}
const css=texts.get('online/v012-uiux-tuning.css')||'';
const routeTokens=[...new Set(css.match(/\.(?:expeditionRouteMap\w*|expeditionRouteNode|routeBranch\w+|routeMapViewport|routeScrollHint|routeLegend)\b/g)||[])].sort();
const deadCss=routeTokens.filter(s=>!active.some(p=>!p.endsWith('.css')&&texts.get(p).includes(s.slice(1))));
const orphanCandidates=active.filter(f=>/\.(?:js|mjs|cjs)$/.test(f)&&!entrypoints.some(x=>x.target===f)&&!files.some(other=>other!==f&&(texts.get(other).includes(f)||texts.get(other).includes(path.posix.basename(f)))));
const report={sha:process.env.GITHUB_SHA||'local',activeFiles:active.length,auxFiles:auxiliary.length,entrypoints:entrypoints.length,missingEntries,missingImports,retiredRefs,retiredPresent:retired.filter(p=>fs.existsSync(path.join(ROOT,p))),counts,details,deadCss,orphanCandidates,caveat:'A candidate is NOT proof of dead code; dynamic references need manual review.'};
fs.mkdirSync(path.join(ROOT,'reports'),{recursive:true});
fs.writeFileSync(path.join(ROOT,'reports/v013-c6-final-static-audit.json'),JSON.stringify(report,null,2)+'\n');
const summary=['# Final v0.13 C6 static audit','',report.caveat,'','Commit: '+report.sha,'','Missing entrypoints: '+missingEntries.length,'Missing relative imports: '+missingImports.length,'Deleted-module references in active source: '+retiredRefs.length,'','## Leftover route CSS',...deadCss.map(s=>'- '+s),'','## Candidate unused modules',...orphanCandidates.map(s=>'- '+s),'','## Reference matches',...Object.entries(details).flatMap(([k,rows])=>['','### '+k+' ('+counts[k]+')',...rows.map(x=>'- '+x.file+':'+x.line+' '+x.excerpt)]),'','## Broken paths',...missingEntries.map(x=>'- '+JSON.stringify(x)),...missingImports.map(x=>'- '+JSON.stringify(x))];
fs.writeFileSync(path.join(ROOT,'reports/v013-c6-final-static-audit.md'),summary.join('\n')+'\n');
console.log('C6_FINAL_STATIC='+JSON.stringify({activeFiles:active.length,entrypoints:entrypoints.length,missingEntries:missingEntries.length,missingImports:missingImports.length,retiredRefs:retiredRefs.length,counts,deadCss,orphanCandidates:orphanCandidates.slice(0,25)}));
if(missingEntries.length||retiredRefs.length)process.exitCode=1;
module.exports={report};
