// Summarize the paired B.3 chunks without changing gameplay state.
const fs=require('node:fs'),path=require('node:path');
const {builds}=require('./v012-phase-b3-sim.cjs');
const dir=process.argv[2]||'/tmp/v012-phase-b3-chunks';
const mean=(a,key)=>+(a.reduce((s,r)=>s+(typeof key==='function'?key(r):r[key]),0)/a.length).toFixed(2);
const prefix=(a,b)=>a.slice(0,Math.min(a.length,b.length)).every((v,i)=>v===b[i]);
const summaries=[],pairs=[],profiles=[];
for(const E of [50,100,200])for(let bi=0;bi<builds.length;bi++)for(const policy of ['triple','random']){
 const build=builds[bi],controls=[];
 for(let pi=0;pi<build.profiles.length;pi++){
  const get=mode=>{const file=path.join(dir,`${E}-${bi}-${policy}-${pi}-${mode}.json`);const data=JSON.parse(fs.readFileSync(file,'utf8'));if(data.rows.length!==64||data.rows.some((r,i)=>r.rep!==i||r.error||r.timeout))throw Error('Invalid chunk: '+file);return data.rows;};
  const control=get('control');controls.push(control);
  const summarize=(rows,mode)=>({E,build:build.name,policy,profile:build.profiles[pi].join('/'),mode,n:rows.length,wins:rows.filter(r=>r.win).length,realm:mean(rows,'realm'),dps:mean(rows,'dps'),hpRemainingWins:rows.some(r=>r.win)?mean(rows.filter(r=>r.win),'hpRemaining'):0,damageReceived:mean(rows,'damageReceived'),heal:mean(rows,'healPerSecond'),barrier:mean(rows,'barrierPerSecond'),ehp:mean(rows,'observedEhpBudget'),bossReached:rows.filter(r=>r.bossReached).length});
  summaries.push(summarize(control,'control'));
  if(build.variant){const candidate=get('candidate');summaries.push(summarize(candidate,'candidate'));const routePrefix=control.filter((r,i)=>prefix(r.routes,candidate[i].routes)).length,passivePrefix=control.filter((r,i)=>prefix(r.passives,candidate[i].passives)).length;pairs.push({E,build:build.name,policy,profile:build.profiles[pi].join('/'),...{control:summarize(control,'control'),candidate:summarize(candidate,'candidate')},routePrefix,passivePrefix,pairedWinGain:candidate.filter((r,i)=>r.win&&!control[i].win).length,pairedWinLoss:control.filter((r,i)=>r.win&&!candidate[i].win).length,realmDelta:mean(candidate,(r)=>r.realm-control[r.rep].realm),dpsDelta:mean(candidate,(r)=>r.dps-control[r.rep].dps),hpDeltaWins:mean(candidate,(r)=>r.hpRemaining-control[r.rep].hpRemaining)});}
 }
 if(controls.length===2){const a=controls[0],b=controls[1];profiles.push({E,build:build.name,policy,profileA:build.profiles[0].join('/'),profileB:build.profiles[1].join('/'),routePrefix:a.filter((r,i)=>prefix(r.routes,b[i].routes)).length,passivePrefix:a.filter((r,i)=>prefix(r.passives,b[i].passives)).length,winsA:a.filter(r=>r.win).length,winsB:b.filter(r=>r.win).length,realmA:mean(a,'realm'),realmB:mean(b,'realm'),dpsA:mean(a,'dps'),dpsB:mean(b,'dps'),hpA:a.some(r=>r.win)?mean(a.filter(r=>r.win),'hpRemaining'):0,hpB:b.some(r=>r.win)?mean(b.filter(r=>r.win),'hpRemaining'):0});}
}
const result={baseCommit:'15e8bd8',seedCount:64,policies:['triple','random'],levels:[50,100,200],summaries,pairs,profiles};
fs.writeFileSync(process.argv[3]||'/tmp/v012-phase-b3-aggregate.json',JSON.stringify(result,null,2)+'\n');
process.stdout.write(JSON.stringify({groups:summaries.length,pairs:pairs.length,profiles:profiles.length})+'\n');
