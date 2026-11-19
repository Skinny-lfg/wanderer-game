'use strict';
// Non-destructive audit of active game; candidates are NOT proof of dead code.
const fs=require('node:fs'),path=require('node:path'),ROOT=path.resolve(__dirname,'..');
const ext=new Set(['.js','.cjs','.mjs','.html','.css']);
function walk(dir){
 if(!fs.existsSync(path.join(ROOT,dir)))return [];
 const out=[];
 for(const e of fs.readdirSync(path.join(ROOT,dir),{withFileTypes:true})){
  const p=path.posix.join(dir,e.name);
  if(e.isDirectory())out.push(...walk(p));
  else if(ext.has(path.extname(e.name)))out.push(p);
 }
 return out;
}
const active=['index.html',...walk('combat'),...walk('online'),...walk('economy')];
const auxiliary=[...walk('scripts'),...walk('tests')];
const read=f=>fs.readFileSync(path.join(ROOT,f),'utf8');
const sources=new Map(active.map(p=>[p,read(p)]));
const scans=[
 ['old_tree_migration',/\bmigrate\s*\(|\blegacyGraph(?:11|12|13|14)\b|\btreeVersion\s*(?:===|<=|<)\s*(?:[0-9]|1[0-4])\b/g],
 ['old_manual_attributes',/\b(?:allocateAttribute|attributePoints|attributesAtEntry|attributePointsSpent)\b/g],
 ['old_save_handling',/\b(?:normalizedLegacy|migrateSave|migrateProfile|legacyTalentCap|oldCheckpoint|legacyHistory)\b/g],
 ['historical_saved_fields',/\b(?:maxDungeon|onlineProgress|chosen|expedition\.session)\b/g],
 ['legacy_modes',/\b(?:legacyTopology|legacyBasic|legacyV14|legacyFocused|freeBuild|stage74)\b/g],
 ['stale_ui_names',/\b(?:automaticTalentTree|renderClassicForge|renderAutomaticTalents|renderRebuiltTalents|legacyForge)\b/g],
 ['legacy_comments',/\b(?:deprecated|unreachable|obsolete|historical|legacy|compatibility|migration)\b/gi]
];
const findings={};
for(const [key,regex] of scans){
 const matches=[];
 for(const [p,s] of sources){
  s.split('\n').forEach((line,i)=>{
   if(line.length>12000)return;
   regex.lastIndex=0;if(regex.test(line))
    matches.push({file:p,line:i+1,code:line.trim().slice(0,290)});
  });
 }
 findings[key]={total:matches.length,matches:matches.slice(0,110)};
}
const index=read('index.html');
const loadedScripts=[...index.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)]
 .map(m=>m[1].split('?')[0]);
const functions=[...index.matchAll(/^\s*function\s+([a-zA-Z_$][\w$]*)\s*\(/gm)].map(m=>m[1]);
const oneRefs=functions.map(name=>({name,count:(index.match(new RegExp('\\b'+name+'\\b','g'))||[]).length}))
 .filter(x=>x.count===1);
const moduleReferences=active.filter(p=>p!=='index.html').map(p=>({
 path:p,scriptTag:loadedScripts.includes(p),
 otherFileReferences:[...sources.keys()].filter(other=>other!==p&&sources.get(other).includes(p)).slice(0,9)
}));
const report={
 caution:'Static candidates, NOT automatically proven-safe deletions',
 files:{active:active.length,auxiliary:auxiliary.length,docsMirror:walk('docs').length},
 loadedScripts,findings,functionsDeclared: functions.length,oneReferenceCandidates:oneRefs,
 moduleReferences,
 safeguards:[
  'v15 builds solely from combat/talent-catalog.js and talent-graph-next.js; reject pre-v15 tree versions.',
  'Drop versioned migration only after confirming fresh-save semantics and tests.',
  'Current save validation, revision locks, anti-duplication, award ledger and checkpoint recovery are NOT save-migration.',
  'Dynamic globals, DOM events, assets and test harnesses need manual cross-check.',
  'docs/ may publish gameplay: preserve source/docs mirrors.'
 ]
};
const out=path.join(ROOT,'reports','v013-clean-sheet-audit.json');
fs.mkdirSync(path.dirname(out),{recursive:true});
fs.writeFileSync(out,JSON.stringify(report,null,2)+'\n');
const lines=['# Wanderer v0.13 — Clean sheet candidate audit','',
 'No automatically safe deletions implied. Scope: '+active.length+' active source files; '+auxiliary.length+' scripts/tests; '+walk('docs').length+' docs mirror files.','',
 '## Scan classes','',
 '| Class | Hits |','|---|---:|',
 ...scans.map(x=>'| '+x[0]+' | '+findings[x[0]].total+' |'),
 '','## Single-reference functions (require human review)','',
 ...oneRefs.map(x=>'- '+x.name),
 '','## Safeguards',...report.safeguards.map(x=>'- '+x),
 '','## Evidence by file and line'];
for(const [k] of scans)lines.push('','### '+k+' ('+findings[k].total+')','',
 ...findings[k].matches.map(m=>'- '+m.file+':'+m.line+': '+m.code.replace(/\|/g,'/')));
fs.writeFileSync(out.replace(/\.json$/,'.md'),lines.join('\n')+'\n');
console.log('CLEAN_SHEET_AUDIT='+JSON.stringify({
 files:report.files,scriptTagCount:loadedScripts.length,
 counts:Object.fromEntries(scans.map(x=>[x[0],findings[x[0]].total])),
 possibleUnused:oneRefs.length,sample:oneRefs.slice(0,30).map(x=>x.name)
}));
module.exports={report};
