'use strict';
// Replay only original unresolved B5 trials. Preserve native outcomes and use
// previously accepted optional research surrender policy for a second replay.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),assert=require('node:assert/strict'),Module=require('node:module'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'..'),STUDY='6e65d559a24846331f9ca9719de176ff88ea8322',BASE='f598fdb8056be59291b23baa36728c8865addfdc',RUN=46132894111;
const IN=path.join(ROOT,'reports/b5-original'),OUT=path.join(ROOT,'reports/b5-replay');
const KEYS=['newBefore','newAlternative','newExtra','newAfter','oldBefore','oldAlternative','oldExtra','oldAfter'];
const git=(...args)=>execFileSync('git',['-C',ROOT,...args],{encoding:'utf8'}).trim();
const read=f=>JSON.parse(fs.readFileSync(f,'utf8'));
const write=(f,x)=>{fs.mkdirSync(path.dirname(f),{recursive:true});fs.writeFileSync(f,JSON.stringify(x,null,2));};
function replace(s,a,b){assert.equal(s.split(a).length,2,'Replay instrumentation anchor '+a);return s.replace(a,b);}
function original(){
 const file=path.join(ROOT,'scripts/v013-b5-synergy-interaction-audit.cjs'),source=fs.readFileSync(file,'utf8').split("const [cmd,a,b,c]=process.argv.slice(2);")[0];
 let s=source;
 s=replace(s,"const {case:c,scenarios,count,arm,revision}=JSON.parse(fs.readFileSync(input,'utf8'));","const {case:c,scenarios,count,arm,revision,trial,allowSurrender}=JSON.parse(fs.readFileSync(input,'utf8'));");
 s=replace(s,"for(const sc of scenarios)for(let i=0;i<count;i++){","for(const sc of scenarios)for(let i=trial;i<trial+count;i++){");
 s=replace(s,"const opts={mode:'encounter'","const audit=require('./v013-b23b-stalemate.cjs').observer(allowSurrender);const opts={stalemateAudit:audit,mode:'encounter'");
 s=replace(s,"Number(x.won)+Number(x.died)+Number(x.timedOut),1","Number(x.won)+Number(x.died)+Number(x.timedOut)+Number(!!x.surrendered),1");
 s=replace(s,"rows.push({sc:sc.id,trial:i,seed,gear,scenario,won:x.won,timeout:x.timedOut,","rows.push({sc:sc.id,trial:i,seed,gear,scenario,won:x.won,timeout:x.timedOut,surrendered:!!x.surrendered,settlement:x.surrenderSettlement||null,roster:x.roster,audit:audit.report(),");
 const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(s+'\nmodule.exports={worker,brief,SC,plan};',file);return m.exports;
}
function child(input,output){original().worker(ROOT,input,output);}
function main(){
 const commit=git('rev-parse','HEAD');
 assert.equal(git('diff','--name-only',STUDY,'HEAD','--','combat','online','economy','index.html','docs','scripts/simulate-progression.cjs','scripts/v013-agent-strategy.cjs','scripts/v013-b23b-stalemate.cjs','scripts/v013-b5-synergy-plan.cjs','scripts/v013-b5-synergy-interaction-audit.cjs','tests'),'','Native/agent/replay source drift');
 const {brief,SC,plan}=original(),cs=plan(),results=cs.map(c=>read(path.join(IN,c.key+'.json')));
 let fights=0,unresolved=[];
 for(let i=0;i<results.length;i++){
  const r=results[i];assert.deepEqual(r.case,cs[i]);assert.equal(r.commit,STUDY);assert.equal(r.baseline,BASE);assert.equal(r.rows.length,200);assert.equal(new Set(r.rows.map(x=>x.sc+'/'+x.trial)).size,200);
  for(const row of r.rows){
   const arms=KEYS.filter(k=>row[k]);assert.equal(arms.length,r.case.red?8:4);fights+=arms.length;
   for(const k of arms)if(row[k].timeout)unresolved.push({r,row,k});
  }
 }
 assert.equal(fights,15200);assert.equal(unresolved.length,4);
 assert.deepEqual(unresolved.map(x=>[x.r.case.key,x.row.sc,x.row.trial,x.k].join('/')).sort(),['defense-healing/solo/33/newAfter','defense-healing/solo/33/newExtra','healing-barrier/solo/33/newAfter','healing-barrier/solo/33/newAlternative'].sort());
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'b5-replay-')),input=path.join(dir,'input.json'),output=path.join(dir,'output.json'),evidence=[];
 try{
  for(const {r,row,k} of unresolved){
   const prior=row[k],arm={newBefore:'before',newAlternative:'alternative',newExtra:'extra',newAfter:'after'}[k],sc=SC.find(s=>s.id===row.sc);assert(arm&&sc);
   const replays={};
   for(const allowSurrender of [false,true]){
    write(input,{case:r.case,scenarios:[sc],count:1,arm,revision:commit,trial:row.trial,allowSurrender});
    execFileSync(process.execPath,[__filename,'worker',input,output],{stdio:['ignore','inherit','inherit'],timeout:25*60*1000});
    const result=read(output);assert.equal(result.rows.length,1);assert.equal(result.nativeSha,r.source[k].nativeSha);assert.equal(result.observer,r.source[k].observer);
    const x=result.rows[0];
    for(const field of ['seed','gear','scenario','sc','trial','stats'])assert.deepEqual(x[field],prior[field],'Original mismatch '+field+' '+r.case.key+'/'+k);
    replays[allowSurrender?'policy':'exact']=x;
   }
   const {exact,policy}=replays;
   assert.equal(exact.timeout,true);assert.equal(exact.surrendered,false);
   for(const field of ['won','timeout','seconds','damage','taken','hp','maxHp','mp','maxMp','healing','absorbed','barrierGenerated','active','observation'])assert.deepEqual(exact[field],prior[field],'Exact replay mismatch '+field);
   const certified=policy.surrendered&&!policy.timeout&&!policy.won&&policy.settlement?.stage==='failed'&&policy.settlement?.outcome==='defeat'&&policy.audit?.decision?.reason==='observed_solo_stalemate';
   evidence.push({case:r.case.key,arm:k,scenario:row.sc,trial:row.trial,seed:prior.seed,original:prior,exact,policy,certified});
   // Only previously censored outcomes use the already approved fallback.
   // Preserve the original timeout separately; never pretend the enemy was defeated.
   if(certified)row[k]={...policy,originalTimeout:true};
   console.log('B5_REPLAY='+JSON.stringify({case:r.case.key,arm:k,seed:prior.seed,roster:exact.roster,exact:{seconds:exact.seconds,hp:exact.hp,damage:exact.damage,final:exact.audit.final,totals:exact.audit.totals},policy:{seconds:policy.seconds,decision:policy.audit.decision,settlement:policy.settlement},certified}));
  }
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
 const remaining=evidence.filter(x=>!x.certified).length;
 const report={studyCommit:STUDY,replayCommit:commit,sourceRun:RUN,originalFights:fights,originalTimeouts:unresolved.length,exactReplays:evidence.length,surrenders:evidence.length-remaining,remainingTimeouts:remaining,scope:'Original B5 outcomes preserved, with separate replay of four originally censored trials; optional existing observed-solo-stalemate policy counts native surrender as defeat. Not an automatic gameplay feature. Other outcomes not retroactively changed; no new balance or agent coefficients. Replay metrics of certified surrenders stop at policy decision time; original timeout metrics remain in evidence.',results:results.map(x=>({case:x.case,source:x.source,...brief(x,x.rows),scenarios:SC.map(sc=>({id:sc.id,...brief(x,x.rows.filter(r=>r.sc===sc.id))}))})),evidence};
 write(path.join(OUT,'summary.json'),report);
 console.log('B5_REPLAY_OVERVIEW='+JSON.stringify({...report,results:undefined,evidence:undefined}));
 if(remaining)process.exitCode=1;
}
const [cmd,a,b]=process.argv.slice(2);
if(cmd==='worker')child(a,b);else main();
