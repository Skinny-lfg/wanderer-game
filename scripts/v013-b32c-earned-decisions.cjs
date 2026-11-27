'use strict';
// B3.2C pilot: actual earned accounts, matched starting seeds and same native economy.
// Only hand equipment choice policy changes. Outcomes may change future earned inventory.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs'),A=require('./v013-b12c1-advanced-agent-audit.cjs'),AI=require('./v013-b32c-equipment-policy.cjs'),create=require('../tests/v012-economy-harness.cjs');
const BASE='9d12569d98cab7cedf65529f3f91d76821bb5c91',OUT='reports/b32c',SEED=104000001,COUNT=4;
const IDS=['smart-blood-sword','smart-blood-two-handed','smart-fury-daggers','smart-fury-bow','pure-aegis','smart-radiance-pure','smart-decay-cycle-daggers','smart-decay-cycle-wand','smart-arcane-arcane-pure','smart-arcane-fire-pure','arcane-frost','hybrid-decay-blood'];
const arms=['H23','adaptiveSoft'],TWO=new Set(['Bow','Two-Handed','Staff']),mean=(a,f)=>a.length?a.reduce((n,x)=>n+f(x),0)/a.length:null,sum=(a,f)=>a.reduce((n,x)=>n+f(x),0),clone=x=>JSON.parse(JSON.stringify(x));
function profile(id,arm,trace){return {...D.approvedProfile(id),offhandPolicy:'b23',...(arm==='adaptiveSoft'?{equipmentIntelligence:'b32c-soft',equipmentTrace:trace}: {})};}
function snapshot(a){const s=a.state();return JSON.stringify({equip:s.equip,stash:s.stash,overflow:s.expeditionOverflow,t:s.automaticTalents,gold:s.gold,fragments:s.fragments,crafting:s.crafting,runes:s.runes,runeSlots:s.runeSlots});}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy','scripts/v013-build-planner.cjs'],{encoding:'utf8'}).trim(),'');
 for(const [j,id] of IDS.entries()){
  const a=create(SEED+j,undefined,{}, {skipPersistence:true}),p=profile(id,'adaptiveSoft',()=>{});a.setup(5,'Sword','Rare');
  const item=a.makeItem(5,'weapon',null,'loot','Two-Handed','Rare'),off=a.makeItem(5,'offhand',null,'loot','Off-Hand Dagger','Rare'),before=snapshot(a);
  const x=AI.gain(a,p,item,'weapon');assert(Number.isFinite(x));assert.equal(AI.gain(a,p,item,'weapon'),x);assert.equal(snapshot(a),before,'Projection mutated native state');
  assert.equal(AI.projected(a.state().equip,item,'weapon').offhand,null);assert.equal(AI.projected(a.state().equip,off,'offhand').offhand.subtype,'Daggers');
  assert.equal(AI.projected({...a.state().equip,weapon:item},off,'offhand'),null);
  assert.equal(AI.gain(a,profile(id,'H23'),item,'weapon'),null);
 }
 console.log('B32C_SMOKE='+JSON.stringify({profiles:IDS.length,productionDrift:false,readOnlyProjection:true,compatibility:true}));
}
function account(id,arm,i,config=D.CONFIG){
 const seed=SEED+i*131,events=[],p=profile(id,arm,e=>events.push(e));
 const acc=N.simulateAccount(seed,id,{...N.DEFAULTS,...config,tickLimit:13000},{researchProfiles:{[id]:p},decisionModel:'adaptive',equipEarnedRunes:true,onCamp:({a})=>({legal:a.talents.valid(a.state().automaticTalents),stats:a.baseStats()})});
 const audit=A.audit(id,[acc]),issues=[...audit.issues];for(const t of acc.attempts)issues.push(...D.compatibilityIssues(t,p));
 const failures=acc.attempts.filter(x=>x.error).map(x=>({level:x.level,attempt:x.attempt,error:x.error,diagnostic:x.diagnostic}));
 assert.deepEqual(failures,[],'Native attempt failures '+id+'/'+arm+'/'+seed);assert.deepEqual(audit.errors,[]);assert.deepEqual(issues,[],'Native integrity issues '+id+'/'+arm+'/'+seed);
 const rs=acc.attempts.flatMap(t=>t.rooms||[]),crafts=acc.attempts.flatMap(t=>t.camp?.crafted||[]),buys=acc.attempts.flatMap(t=>t.camp?.bought||[]),equips=acc.attempts.flatMap(t=>[...(t.camp?.equipped||[]),...(t.equipped||[])]);
 const picked=events.filter(e=>['equip','buy','craft'].includes(e.kind)),offers=events.filter(e=>['offer','opportunities'].includes(e.kind));
 for(const e of picked){assert(Number.isFinite(e.gain));if(e.kind==='equip')assert(e.gain>=2.5);else if(e.kind==='buy')assert(e.gain>5);else assert(e.gain>=5);}
 const rejected=picked.filter(e=>e.kind==='equip'&&!e.accepted).length;
 return {id,arm,seed,endLevel:acc.endLevel,reachedE10:acc.endLevel>=10,clearedE10:acc.endLevel>=11,xp:acc.xp,attempts:acc.attempts.length,stopReason:acc.stopReason,initialGear:acc.initialGear,finalGear:acc.finalGear,gold:acc.gold,fragments:acc.fragments,crafts,buys,equips,events,decisions:picked.length,offers:offers.length,rejected,fights:rs.length,wins:rs.filter(r=>r.won).length,losses:rs.filter(r=>r.died).length,surrenders:rs.filter(r=>r.surrendered).length,timeouts:rs.filter(r=>r.timedOut).length,errors:failures.length,issues:issues.length,coverage:audit.coverage.all};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x,null,2));}
function run(pi,ai){const id=IDS[pi],arm=arms[ai];assert(id&&arm);const rows=Array.from({length:COUNT},(_,i)=>account(id,arm,i));write('pilot-'+pi+'-'+ai,{pi,ai,id,arm,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,rows});}
const counts=(a,key)=>a.reduce((s,x)=>{const k=key(x);if(k!=null)s[k]=(s[k]||0)+1;return s},{});
function metrics(rows){
 const crafts=rows.flatMap(r=>r.crafts),buys=rows.flatMap(r=>r.buys),events=rows.flatMap(r=>r.events),fights=sum(rows,r=>r.fights);
 return {accounts:rows.length,reachedE10:sum(rows,r=>Number(r.reachedE10)),clearedE10:sum(rows,r=>Number(r.clearedE10)),meanEndLevel:mean(rows,r=>r.endLevel),meanXp:mean(rows,r=>r.xp),attempts:sum(rows,r=>r.attempts),fights,wins:sum(rows,r=>r.wins),winPct:fights?100*sum(rows,r=>r.wins)/fights:null,surrenders:sum(rows,r=>r.surrenders),timeouts:sum(rows,r=>r.timeouts),errors:sum(rows,r=>r.errors),issues:sum(rows,r=>r.issues),purchases:buys.length,goldSpent:sum(buys,x=>x.cost||0),crafts:crafts.length,fragmentsSpent:sum(crafts,x=>x.fragmentsSpent||0),essenceSpent:sum(crafts,x=>x.essenceSpent||0),craftEquipped:crafts.filter(x=>x.equipped).length,craftPreviewMiss:events.filter(e=>e.kind==='craft'&&!(e.actualGain>=2.5)).length,decisions:sum(rows,r=>r.decisions),opportunities:sum(rows,r=>r.offers),rejected:sum(rows,r=>r.rejected),finalWeapons:counts(rows,r=>r.finalGear.items.find(x=>x.slot==='weapon')?.subtype),finalOffhands:counts(rows,r=>r.finalGear.items.find(x=>x.slot==='offhand')?.subtype||'None'),acceptedHandEquip:counts(events.filter(e=>e.kind==='equip'&&e.accepted),e=>e.subtype),forgeOffers:events.filter(e=>e.phase==='forge'&&e.kind==='offer').length,merchantOffers:events.filter(e=>e.phase==='merchant'&&e.kind==='offer').length};
}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>arms.map((arm,ai)=>JSON.parse(fs.readFileSync(OUT+'/pilot-'+pi+'-'+ai+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[];
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.rows.length,COUNT);}
 for(let pi=0;pi<IDS.length;pi++){const h=xs.find(x=>x.pi===pi&&x.ai===0),a=xs.find(x=>x.pi===pi&&x.ai===1);for(let i=0;i<COUNT;i++){assert.equal(h.rows[i].seed,a.rows[i].seed);assert.deepEqual(h.rows[i].initialGear,a.rows[i].initialGear);}
 const r={id:IDS[pi],H23:metrics(h.rows),adaptiveSoft:metrics(a.rows),pairedEndLevel:a.rows.map((r,i)=>r.endLevel-h.rows[i].endLevel)};results.push(r);console.log('B32C_PROFILE='+JSON.stringify(r));}
 const rows=xs.flatMap(x=>x.rows),summary={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,accounts:rows.length,pairedAccounts:rows.length/2,arms:Object.fromEntries(arms.map(arm=>[arm,metrics(rows.filter(r=>r.arm===arm))])),results,scope:'Exploratory four starting seeds per profile/arm. Earned legal natural acquisition, no inserted items, no lookahead. Divergent future rewards are intentional. Candidate hand decisions only, other systems unchanged; no representative natural balance claim.'};assert.equal(rows.length,96);write('summary',summary);console.log('B32C_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(rows.some(r=>r.timeouts||r.errors||r.issues))process.exitCode=1;
}
const [cmd,pi,ai]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='pilot')run(Number(pi),Number(ai));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
