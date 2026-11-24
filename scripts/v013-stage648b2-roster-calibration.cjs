'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const D=require('./v013-stage628-postcap-difficulty.cjs'),S=require('./simulate-progression.cjs');
const {row,stats}=require('./v013-stage648b1-distribution.cjs');
const IDS=["cautious","balanced","plate-warden","cloth-battlemage","leather-duelist","hexblade-hybrid","smart-blood-pure","smart-fury-daggers","smart-vitality-pure","smart-aegis-vitality","smart-magic-arcane-pure","smart-magic-fire-pure","magic-frost","smart-magic-lightning-pure","smart-decay-magic-aegis","smart-blood-sword","smart-blood-fury","smart-blood-fury-vitality","smart-blood-fury-vitality-no-mixed","smart-fury-blood-aegis","smart-fury-pure","smart-magic-fire-aegis","smart-magic-frost-vitality","smart-magic-wand","smart-magic-staff","smart-magic-wand-offense","smart-magic-wand-defense","decay-wand","decay-two-handed","aegis-sword-shield","aegis-mace-shield","aegis-wand-orb","vitality-sword-charm","vitality-staff","magic-sword-infusion"],SIZES=[4,5,8,12],TRIALS=50,OLD='686cd06098af3ee950363030c809d08383832e4021f23568e2aa4bbf161b550f';
function write(file,data){fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(data,null,2)+'\n');}
function read(dir,id){const a=fs.readdirSync(dir,{recursive:true}).filter(p=>path.basename(p)===id+'.json');assert.equal(a.length,1,'missing artifact '+id);return JSON.parse(fs.readFileSync(path.join(dir,a[0]),'utf8'));}
function summarize(rows){
 const o={};
 for(const v of ['original','random','calibrated','reducedTotal']){const a=rows.map(x=>x[v]);o[v]=stats(a);o[v+'Wins']=stats(a.filter(x=>x.won));o[v+'Losses']=stats(a.filter(x=>x.died));}
 o.changedComposition=rows.filter(x=>x.changed).length;
 o.lossToWin=rows.filter(x=>x.random.died&&x.calibrated.won).length;o.winToLoss=rows.filter(x=>x.random.won&&x.calibrated.died).length;return o;
}
function run(id,trials=TRIALS){
 assert(IDS.includes(id));assert(Number.isInteger(trials)&&trials>=1&&trials<=TRIALS);
 const a=read('input/earned',id),b=read('input/baseline',id);assert.equal(a.id,id);assert.equal(a.source,OLD);assert(a.complete&&b.complete);assert.equal(b.id,id);assert.equal(b.trials,TRIALS);assert.equal(b.rows.length,TRIALS*SIZES.length);
 const actors=a.accounts.filter(x=>x.snapshot);assert(actors.length);
 const rows=[],file='reports/stage648b2/'+id+'.json';
 for(let i=0;i<trials;i++){const actor=actors[i%actors.length];for(const size of SIZES){try{
  const prev=b.rows.find(x=>x.trial===i&&x.size===size),original=a.rows.find(x=>x.trial===i&&x.scenario==='normal-'+size);
  assert(prev&&original&&prev.actor===actor.seed&&original.naturalSeed===actor.seed);
  const base=prev.random;assert.equal(base.seed,original.seed);assert.equal(base.gear,original.gear);
  const sc={id:'normal-'+size,type:'normal',realm:'blood',size},x=D.native(actor.snapshot,sc,64791000+i*101),c=row(x);
  assert.equal(c.seed,base.seed);assert.equal(c.gear,base.gear);assert.equal(x.initialEnemies,size);
  assert.equal(c.initialVisible,Math.min(4,size));assert(x.peakVisibleEnemies<=4);
  const principals=v=>v.initialRoles.tank+v.initialRoles.skirmisher+v.initialRoles.caster;
  const count=principals(c);assert(size<=5?count===2:count>=2&&count<=3,'invalid calibrated principal count');
  assert.equal(c.initialRoles.minion+count,size);
  if(c.won){assert.equal(c.remainingReserve,0);assert.equal(c.remainingActors,0);}
  const changed=count!==principals(base);
  if(!changed){assert.deepEqual(c.initialRoles,base.initialRoles,'unchanged roles drift');assert.equal(c.rosterHp,base.rosterHp,'unchanged HP drift');assert.equal(c.initialPrincipalAttack,base.initialPrincipalAttack);assert.equal(c.won,base.won,'unchanged win drift');assert.equal(c.died,base.died);assert.equal(c.timeout,base.timeout);assert.equal(c.damage,base.damage,'unchanged damage drift');assert.equal(c.secondary,base.secondary);}
  rows.push({trial:i,size,actor:actor.seed,changed,original:prev.baseline,random:base,calibrated:c,reducedTotal:prev.reducedTotal});
 }catch(error){write(file,{id,complete:false,rows,failure:{trial:i,size,error:String(error)}});throw error;}}if(i%10===9)write(file,{id,complete:false,rows});}
 write(file,{id,complete:true,trials,actors:actors.length,source:S.sourceFingerprint().sha256,rows});
 console.log('STAGE648B2_PROFILE='+JSON.stringify({id,actors:actors.length,results:Object.fromEntries(SIZES.map(size=>[size,summarize(rows.filter(r=>r.size===size))]))}));
}
function aggregate(){
 const dir='reports/stage648b2',a=fs.readdirSync(dir,{recursive:true}).filter(p=>p.endsWith('.json')).map(p=>JSON.parse(fs.readFileSync(path.join(dir,p),'utf8')));
 assert.equal(new Set(a.map(x=>x.id)).size,a.length);
 const valid=a.filter(x=>x.complete),missing=IDS.filter(id=>!valid.some(x=>x.id===id));assert(new Set(valid.map(x=>x.source)).size<=1);
 for(const x of valid){assert.equal(x.trials,TRIALS);assert.equal(x.rows.length,TRIALS*SIZES.length);assert.equal(new Set(x.rows.map(r=>r.trial+'/'+r.size)).size,x.rows.length);}
 const rows=valid.flatMap(x=>x.rows);
 const report={stage:'6.48B.2',baselineRun:45443121512,source:valid[0]?.source,missing,fights:rows.length,profiles:valid.map(x=>({id:x.id,actors:x.actors,results:Object.fromEntries(SIZES.map(size=>[size,summarize(x.rows.filter(r=>r.size===size))]))})),all:Object.fromEntries(SIZES.map(size=>[size,summarize(rows.filter(r=>r.size===size))]))};
 write('reports/v013-stage648b2-roster-calibration.json',report);
 const compact=x=>Object.fromEntries(Object.entries(x).map(([k,v])=>[k,typeof v==='number'?v:{n:v.n,winPct:v.winPct,timeouts:v.timeouts,seconds:v.seconds,secondaryDps:v.secondaryDps,secondaryShare:v.secondaryShare,healed:v.healed,absorbed:v.absorbed,initialPrincipals:v.initialPrincipals,peakPrincipals:v.peakPrincipals,threePrincipalSeconds:v.threePrincipalSeconds,rosterHp:v.rosterHp,initialPrincipalAttack:v.initialPrincipalAttack}]));
 console.log('STAGE648B2='+JSON.stringify({...report,profiles:report.profiles.map(p=>({id:p.id,actors:p.actors,results:Object.fromEntries(SIZES.map(size=>[size,compact(p.results[size])]))})),all:Object.fromEntries(SIZES.map(size=>[size,compact(report.all[size])]))}));
 assert.equal(missing.length,0,'missing cohorts '+missing.join(', '));
}
if(require.main===module){const [cmd,id,n]=process.argv.slice(2);if(cmd==='run')run(id,n===undefined?TRIALS:Number(n));else if(cmd==='aggregate')aggregate();else if(cmd==='smoke')run('balanced',5);else throw Error('unknown command');}
