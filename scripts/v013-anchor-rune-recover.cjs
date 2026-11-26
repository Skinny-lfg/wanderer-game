'use strict';
// One-off recovery of the original successful simulation artifacts, not a simulation rerun.
// Fail closed on unknown run, artifact IDs, build counts, fingerprints, or pairing.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const dir=process.argv[2]||'reports/anchor-rune-scaling';
const runId=45592535013,commit='ee2080895b5fea541cb2a258be104a25f80c72c3';
const hashes={scale:'2b197ac2dc4f2f2b6905968778e919880811399cb9bb7051904449cae5c4bc68',controlled:'5f6f93dbf303aa6367f41edbe895bff2208ad4c89485845cec665a80be86c1ac'};
const F=['blood','decay','radiance','aegis','fury','arcane'],SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'];
const expectedArtifacts={'anchor-controlled-decay':15012871182,'anchor-controlled-radiance':15012681049,'anchor-controlled-arcane':15011878208,'anchor-controlled-fury':15011838514,'anchor-natural-arcane':15011811614,'anchor-natural-radiance':15011682013,'anchor-natural-fury':15011607613,'anchor-scale':15011418092,'anchor-natural-blood':15011134031,'anchor-controlled-aegis':15011084345,'anchor-natural-decay':15010879673,'anchor-natural-aegis':15010593561,'anchor-controlled-blood':15010549891};
const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name),'utf8'));
const run=read('original-run.json'),artifacts=read('original-artifacts.json').artifacts;
assert.equal(run.id,runId);assert.equal(run.head_sha,commit);assert.equal(run.status,'completed');assert.equal(run.path,'.github/workflows/v013-anchor-rune-scaling.yml');
for(const [name,id] of Object.entries(expectedArtifacts)){const a=artifacts.find(x=>x.name===name&&x.id===id);assert(a&&!a.expired,'Missing original artifact '+name);}
const scale=read('scale.json');assert.equal(scale.source,hashes.scale);assert.equal(scale.values.length,575);
const controlled={},natural={};let fights=0,accounts=0;
for(const family of F){
 const c=read('controlled-'+family+'.json'),n=read('natural-'+family+'.json');
 assert.equal(c.family,family);assert.equal(n.family,family);assert.equal(c.source,hashes.controlled);assert.equal(c.trials,50);assert.equal(n.n,10);
 assert.equal(c.rows.length,SC.length*50*c.arms.length);
 const rows=new Map(c.rows.map(r=>[r.sc+'/'+r.i+'/'+r.arm,r]));assert.equal(rows.size,c.rows.length);
 for(const sc of SC)for(let i=0;i<50;i++){const base=rows.get(sc+'/'+i+'/none');assert(base);for(const arm of c.arms){const r=rows.get(sc+'/'+i+'/'+arm.id);assert(r);assert.deepEqual(r.match,base.match);}}
 for(const group of ['all',...SC])for(const arm of c.arms){const rs=c.rows.filter(r=>r.arm===arm.id&&(group==='all'||r.sc===group)),m=c.summary[group][arm.id];assert.equal(m.n,rs.length);assert.equal(m.wins,rs.filter(r=>r.won).length);}
 assert.equal(n.accounts.none.length,10);assert.equal(n.accounts.earned.length,10);
 for(let i=0;i<10;i++){const a=n.accounts.none[i],b=n.accounts.earned[i];assert.equal(a.seed,b.seed);assert.deepEqual(a.initialGear,b.initialGear);}
 for(const [arm,aa] of Object.entries(n.accounts))for(const a of aa)for(const t of a.attempts){assert(!t.error&&t.status!=='error');assert.equal(t.after.runeBag.length,t.before.runeBag.length+Number(t.bossWon));if(arm==='none')assert(t.before.runeSlots.every(x=>x===null));}
 fights+=c.rows.length;accounts+=20;controlled[family]={profile:c.profile,arms:c.arms,summary:c.summary};natural[family]={profile:n.profile,summary:n.summary};
}
assert.equal(fights,23700);assert.equal(accounts,120);
const families=[...new Set(scale.values.map(r=>r.family))];assert.equal(families.length,23);
const singles=families.map(family=>({family,profiles:F.filter(f=>controlled[f].arms.some(a=>a.id==='single-'+family)).map(f=>({build:f,...controlled[f].summary.all['single-'+family]}))}));assert(singles.every(x=>x.profiles.length));
const report={originalRunId:runId,originalCommit:commit,originalArtifacts:expectedArtifacts,sourceFingerprints:hashes,fights,accounts,controlled,natural,singles,scale,notes:['Original artifacts recovered, no combat rerun. The original scale fingerprint precedes a lazy host require; controlled artifacts must all match the original controlled fingerprint. Both hashes are retained rather than relabeling results.','E10 controlled, 30 talents, Rare gear, matched encounter/gear fingerprints, 50 seeds per aggregate scenario. Elite and Boss types rotate across seeds; not 50 per individual subtype. Common trio is E1; Rare and Legendary trios E5.','Natural same initial seed, divergent routes allowed, native earned drops only. Not a representative estimate of all player strategies.']};
fs.writeFileSync(path.join(dir,'summary.json'),JSON.stringify(report,null,2)+'\n');
const format=n=>n===null?'—':Number(n).toFixed(1),line=(cells)=>'| '+cells.join(' | ')+' |';
const md=['# Anchor Rune Scaling — recovered report','', 'Original run: '+runId+' / '+commit,'',fights+' controlled fights; '+accounts+' natural accounts. Original artifacts validated; no simulation rerun.','', '## Controlled E10 (victory %)','',line(['Build','Arm','All','1 mob','4 mobs','8 mobs','12 mobs','Elite','Boss','DPS','HP end %','Mana end %']),line(Array(11).fill('---'))];
for(const f of F){const c=controlled[f];for(const a of c.arms){const m=c.summary.all[a.id];md.push(line([f,a.id,format(m.winPct),...SC.map(k=>format(c.summary[k][a.id].winPct)),format(m.dps),format(m.hpEndPct),format(m.manaEndPct)]));}}
md.push('','## Natural E1–E10','',line(['Build','Arm','Accounts','Mean unlocked','Reached E5','Reached E10','Attempts','Victories','Deaths','Extractions','Normal win %','Elite win %','Boss win %']),line(Array(13).fill('---')));
for(const f of F)for(const [a,m] of Object.entries(natural[f].summary))md.push(line([f,a,m.accounts,format(m.meanUnlocked),m.reachedE5,m.reachedE10,m.attempts,m.victories,m.deaths,m.extractions,...['normal','elite','boss'].map(k=>format(m.rooms[k].winPct))]));
md.push('','## Scope and provenance','',...report.notes.map(n=>'- '+n),'','Scale SHA-256: '+hashes.scale,'Controlled SHA-256: '+hashes.controlled);
fs.writeFileSync(path.join(dir,'summary.md'),md.join('\n')+'\n');
for(const f of F){const c=controlled[f];console.log('ANCHOR_RECOVERED_BUILD='+JSON.stringify({f,arms:c.arms.map(a=>({id:a.id,overall:c.summary.all[a.id],byScenario:Object.fromEntries(SC.map(k=>[k,{n:c.summary[k][a.id].n,win:c.summary[k][a.id].winPct,delta:c.summary[k][a.id].deltaWinPp}]))}))}));}
console.log('ANCHOR_RECOVERY_OK='+JSON.stringify({originalRun:runId,commit,fights,accounts,hashes}));
