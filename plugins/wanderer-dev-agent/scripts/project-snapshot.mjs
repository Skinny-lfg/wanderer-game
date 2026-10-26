import {existsSync,readFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../../..');
const read=relative=>{try{return readFileSync(path.join(root,relative),'utf8');}catch{return '';}};
const git=(...args)=>spawnSync('git',args,{cwd:root,encoding:'utf8',timeout:10000,stdio:['ignore','pipe','ignore']});
const files=(git('ls-files','-co','--exclude-standard').stdout||'').split(/\r?\n/).filter(Boolean);
const takeHeading=(source)=>source.split(/\r?\n/).slice(0,12).find(line=>/^\s*#/.test(line))||'';
const versionTokens=text=>[...new Set((text.match(/\bv?\d+\.\d+(?:\.\d+)?\b/g)||[]).map(x=>x.replace(/^v/i,'')))];
const readme=read('README.md'),changelog=read('CHANGELOG.md'),html=read('index.html');
const title=html.match(/<title[^>]*>(.*?)<\/title>/is)?.[1]?.replace(/<[^>]+>/g,'').trim()||'';
const badge=html.match(/class=["'][^"']*\bversion\b[^"']*["'][^>]*>(.*?)<\/[^>]+>/is)?.[1]?.replace(/<[^>]+>/g,'').trim()||'';
const docs=files.filter(f=>f.startsWith('docs/')&&/\.(md|txt)$/i.test(f));
const relevantDocs=docs.filter(f=>/(roadmap|masterplan|architecture|engine|cleanup|handoff|current|parity)/i.test(f)).slice(0,30);
const versionedDocs=docs.filter(f=>/\bv?\d+[._-]\d+/i.test(f)).slice(0,40);
const documentEvidence=relevantDocs.slice(0,20).map(file=>{
 const body=read(file);
 return {path:file,heading:takeHeading(body),versionLabels:[...new Set([...versionTokens(file),...versionTokens(takeHeading(body))])]};
});
const recentLog=(git('log','-8','--format=%h %s').stdout||'').trim().split(/\r?\n/).filter(Boolean);
const signals=[
 {source:'README heading',heading:takeHeading(readme),versions:versionTokens(takeHeading(readme))},
 {source:'CHANGELOG leading heading',heading:takeHeading(changelog),versions:versionTokens(takeHeading(changelog))},
 {source:'active HTML title',heading:title,versions:versionTokens(title)},
 {source:'active HTML version badge',heading:badge,versions:versionTokens(badge)},
 {source:'relevant project documents',documents:documentEvidence},
 {source:'versioned document paths',paths:versionedDocs.slice(0,20)},
 {source:'recent commits',subjects:recentLog}
];
const explicit=[...new Set(signals.slice(0,4).flatMap(s=>s.versions))];
const documentationCandidates=[...new Set(documentEvidence.flatMap(item=>item.versionLabels))].sort();
const scripts=[...html.matchAll(/<script\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi)].map(m=>m[1]);
const experimentFiles=files.filter(f=>/^(experiments\/.*\.(html|js|mjs)|online\/[^/]*prototype[^/]*\.(html|js|mjs))$/i.test(f));
const topDirs=['combat','online','economy','experiments','preview','ui-kit'];
const architecture={
 canonicalEntrypoint:existsSync(path.join(root,'index.html'))?'index.html':null,
 directScriptLoads:[...new Set(scripts)].slice(0,60),
 codeAreas:Object.fromEntries(topDirs.map(dir=>[dir,files.filter(f=>f.startsWith(dir+'/')).length])),
 standaloneOrPrototypeFiles:experimentFiles.map(file=>({file,referencedByEntrypoint:html.includes(file)})),
 relevantDocs:documentEvidence
};
const versionsInEvidence=new Set(explicit);
const versionAssessment=versionsInEvidence.size===0?'NO_CLEAR_VERSION_SIGNAL':versionsInEvidence.size===1?'CONSISTENT_VERSION_SIGNAL':'CONFLICTING_VERSION_SIGNALS';
export function collectProjectSnapshot(){
 const head=git('rev-parse','--short','HEAD').stdout?.trim()||null;
 const branch=git('branch','--show-current').stdout?.trim()||null;
 const status=git('status','--porcelain=v1');
 return {branch,head,workingTree:status.status===0?(status.stdout?'DIRTY':'CLEAN'):'UNKNOWN',version:{assessment:versionAssessment,explicitCandidates:[...versionsInEvidence].sort(),documentationCandidates,evidence:signals},architecture};
}
if(import.meta.url===`file://${process.argv[1]}`) process.stdout.write(JSON.stringify(collectProjectSnapshot(),null,2)+'\n');
