'use strict';
// B3.2A: evaluate H23 and an explicitly experimental stat-based hand ranking.
// Uses only available native items, legal loadouts and pre-fight stats.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs'),C=require('./v013-b31c-compensation-validation.cjs'),G=require('./v013-global-e10.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs');
const BASE='8a528124c140b86ed1fd86d3c427fb95e698c80d',OUT='reports/b32a',SEED=103000001,COUNT=20,SC=A.scenarios.filter(s=>['solo','group12','boss'].includes(s.id));
const specs=[
 ['blood-sword','smart-blood-sword'],['decay-cycle-daggers','smart-decay-cycle-daggers'],['fury-daggers','smart-fury-daggers'],['fury-bow','smart-fury-bow'],['aegis-mace','pure-aegis'],['radiance-mace','smart-radiance-pure'],['hybrid-decay-blood','hybrid-decay-blood'],
 ['decay-cycle-wand','smart-decay-cycle-wand'],['arcane-arcane-wand','smart-arcane-arcane-pure'],['arcane-fire-wand','smart-arcane-fire-pure'],['arcane-frost-wand','arcane-frost'],['arcane-lightning-wand','smart-arcane-lightning-pure']
].map(([id,agent])=>({id,agent}));
const TWO=new Set(['Bow','Two-Handed','Staff']),num=x=>Number(x)||0,mean=(a,f)=>a.length?a.reduce((n,x)=>n+f(x),0)/a.length:null,clamp=(x,l,h)=>Math.max(l,Math.min(h,x)),ratio=(x,y)=>Math.log(Math.max(.001,x)/Math.max(.001,y));
const id=(w,o)=>w+'+'+(o||'None'),arm=(w,o)=>[id(w,o),w,o];
function arms(p){
 const caster=p.armorType==='Cloth',raw=caster?[arm('Staff',null),...['Orb','Tome','Charm','Shield','Off-Hand Dagger',null].map(o=>arm('Wand',o))]:[
 arm('Bow',null),arm('Two-Handed',null),arm('Sword','Shield'),arm('Sword','Off-Hand Dagger'),arm('Mace','Shield'),arm('Mace','Off-Hand Dagger'),arm('Daggers','Off-Hand Dagger'),arm('Daggers','Shield'),
 ...(!TWO.has(p.weapon)?['Orb','Tome','Charm',null].map(o=>arm(p.weapon,o)):[])
 ];
 return [...new Map([arm(p.weapon,p.offhandType),...raw].map(x=>[x[0],x])).values()];
}
function evaluate(r,p){
 const s=r.stats,ap=num(s.attack),sp=num(s.spellPower),aps=Math.max(.01,num(s.attacksPerSec)),hp=Math.max(1,num(s.maxhp)),mana=num(s.mana),regen=num(s.manaRegen),w=r.weapon,o=r.off;
 const caster=w==='Staff'||w==='Wand',cost=({arcane:[9,13],fire:[13,18],frost:[10,15],lightning:[14,20]})[p.element||'arcane']?.[w==='Staff'?1:0]||9;
 const price=Math.max(1,Math.ceil(cost*(w==='Staff'?.75:1))),funded=caster?clamp((mana/60+regen+(o==='Tome'?.5:0))/(price*aps),0,1):1;
 const factor={Sword:1.12,Mace:1.4,Daggers:.8,Bow:1.4,'Two-Handed':2.1,Wand:1.05,Staff:1.6}[w],strike=caster?funded*sp*factor+(1-funded)*ap*.55:ap*factor;
 const dagger=o==='Off-Hand Dagger'||o==='Daggers';
 // Approximation only: native offhand rate uses base DAGGER interval and main
 // haste ratio; projected stat snapshots omit raw speed, so no exact rate claim.
 const daggerRate=dagger?.5*Math.min(4.2,(1+2*num(s.agi)/(100+num(s.agi)))/1.15):0;
 const crit=1+num(s.crit)/200,damage=Math.max(1,(strike*aps+ap*.4*daggerRate)*crit);
 const nodes=new Set(r.nodes),rot=p.families.includes('decay'),blood=p.families.includes('blood');
 const status=rot||blood?Math.max(.01,aps*funded+daggerRate):1;
 const aoe=({Bow:1.66,'Two-Handed':1.8,Daggers:1.44,Sword:1.25,Mace:1.30})[w]||1;
 const cleave=nodes.has('bow_pierce')&&w==='Bow'?2:nodes.has('cleave_mastery')&&w==='Two-Handed'?2.2:aoe;
 const block=clamp(num(s.blockChance)/100,0,.8),reduction=clamp(num(s.blockReduction),0,1);
 // Bounded ranking proxy, NOT actual EHP or expected DPS. Fixed horizon and
 // monotonic stat terms; no combat results or fitted outcome weights.
 const durability=hp*(1+num(s.defense)/30)*(1+num(s.evasionRating)/100)/(1-block*reduction+.0001);
 const sustain=1+(o==='Orb'?(hp*.02+sp*.05)/6/(hp/60):o==='Charm'?.015/8*60:0);
 return {damage,status,groupDamage:damage*cleave,durability:durability*sustain,funded,daggerRate};
}
function pair(st,sc,i){
 const p=G.profile(st.id),list=arms(p),src=B.sources('Staff',{factor:1.32,reference:true});
 const rows=list.map(a=>A.cell({id:st.id,profile:st.id,armor:p.armorType},sc,i,a,null,{id:a[0],seedBase:SEED,...src,runtime:C.manaRuntime(src.runtime,1),manaAudit:true,recordEquipment:true,recordAbilityMetrics:true}));
 const b=rows[0],profile={...D.approvedProfile(st.agent),offhandPolicy:'b23',adaptiveNodes:[...p.t.nodes],synergyContext:{stats:b.stats,nodes:[...p.t.nodes],weapon:b.weapon,offhand:b.off}};
 assert.equal(b.id,id(p.weapon,p.offhandType));
 for(const r of rows){
  assert.equal(r.resolved,b.resolved);assert.equal(r.rosterHash,b.rosterHash);assert.equal(r.nonHands,b.nonHands);assert.deepEqual(r.nodes,b.nodes);
  assert(!TWO.has(r.weapon)||!r.off);assert(r.equipment.weapon?.subtype===r.weapon);assert.equal(r.equipment.offhand?.subtype||null,r.off);
  for(const q of rows.filter(q=>q.weapon===r.weapon))assert.equal(q.weaponHash,r.weaponHash);
  assert(Math.abs(r.manaLedger.residual)<1e-6);
  r.H23=N.handPairScore(r.equipment,profile);r.H23NoPlanner=N.handPairScore(r.equipment,{...profile,plan:null});r.proxy=evaluate(r,p);
  assert(Number.isFinite(r.H23)&&Number.isFinite(r.H23NoPlanner));
 }
 for(const r of rows){
  const x=r.proxy,y=b.proxy,off=ratio(x.damage,y.damage),group=ratio(x.groupDamage,y.groupDamage),def=ratio(x.durability,y.durability),status=ratio(x.status,y.status);
  r.contextScores={solo:.65*off+.35*def+.12*status,group12:.55*group+.45*def+.12*status,boss:.45*off+.55*def+.12*status};
  r.contextScores.blind=mean(['solo','group12','boss'],k=>r.contextScores[k]);
  assert(Object.values(r.contextScores).every(Number.isFinite));
 }
 return {seed:b.seed,scenario:sc.id,base:b.id,rows};
}
function write(n,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+n+'.json',JSON.stringify(x,null,2));}
function run(si,ci){const st=specs[si],sc=SC[ci];assert(st&&sc);const cases=Array.from({length:COUNT},(_,i)=>pair(st,sc,i));write('study-'+si+'-'+ci,{si,ci,study:st.id,agent:st.agent,scenario:sc.id,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,cases});}
const choice=(rows,score)=>[...rows].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
function select(c,policy){if(policy==='H23')return choice(c.rows,r=>r.H23);if(policy==='noPlanner')return choice(c.rows,r=>r.H23NoPlanner);if(policy==='blind')return choice(c.rows,r=>r.contextScores.blind);if(policy==='context')return choice(c.rows,r=>r.contextScores[c.scenario]);throw Error('Unknown policy');}
function evaluatePolicy(cases,policy){
 const picks=cases.map(c=>select(c,policy)),base=cases.map(c=>c.rows.find(r=>r.id===c.base));
 const n=picks.length,wins=picks.filter(r=>r.won).length,counts={};for(const r of picks)counts[r.id]=(counts[r.id]||0)+1;
 const misses=cases.filter((c,i)=>!picks[i].won&&!picks[i].timeout&&c.rows.some(r=>r.won)).length;
 const paired=cases.map((c,i)=>({rows:[{...base[i],id:'base'},{...picks[i],id:'pick'}]}));
 return {n,wins,winPct:100*wins/n,timeouts:picks.filter(r=>r.timeout).length,missedWinningAlternative:misses,picks:counts,DPS:mean(picks,r=>r.damage/r.seconds),HPend:mean(picks,r=>100*r.hpEnd/Math.max(1,r.hpMax)),vsDefault:A.paired(paired,'base','pick')};
}
function aggregate(){
 const xs=specs.flatMap((st,si)=>SC.map((sc,ci)=>JSON.parse(fs.readFileSync(OUT+'/study-'+si+'-'+ci+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);const results=[],all=xs.flatMap(x=>x.cases.flatMap(c=>c.rows));
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.cases.length,COUNT);assert.equal(new Set(x.cases.map(c=>c.seed)).size,COUNT);const aa=arms(G.profile(x.study));for(const c of x.cases)assert.deepEqual(c.rows.map(r=>r.id),aa.map(a=>a[0]));
  const policies=Object.fromEntries(['H23','noPlanner','blind','context'].map(k=>[k,evaluatePolicy(x.cases,k)])),h=x.cases.map(c=>select(c,'H23')),comparison={};
  for(const policy of ['noPlanner','blind','context']){const picks=x.cases.map(c=>select(c,policy));comparison[policy]=A.paired(x.cases.map((c,i)=>({rows:[{...h[i],id:'H23'},{...picks[i],id:'candidate'}]})),'H23','candidate');}
  const out={study:x.study,agent:x.agent,scenario:x.scenario,policies,vsH23:comparison,oracleWinCeiling:x.cases.filter(c=>c.rows.some(r=>r.won)).length,arms:Object.fromEntries(aa.map(([id])=>{const rr=x.cases.map(c=>c.rows.find(r=>r.id===id));return [id,{...A.metrics(rr),meanH23:mean(rr,r=>r.H23),meanH23NoPlanner:mean(rr,r=>r.H23NoPlanner),meanContext:mean(rr,r=>r.contextScores[x.scenario])}]}))};
  results.push(out);console.log('B32A_STUDY='+JSON.stringify({...out,arms:undefined}));
 }
 const summary={commit:process.env.GITHUB_SHA,baseline:BASE,native:xs[0].native,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,decisions:xs.length*COUNT,results,scope:'20-seed screening on fixed E10 legal talents and native Rare gear. Full offered hand bundles; counterfactual ranking, not real earned purchases. Context scores see encounter category only, not outcome. Oracle ceiling is hindsight only. No production or agent policy modifications.'};write('summary',summary);console.log('B32A_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy','scripts/v013-natural-progression.cjs','scripts/v013-build-planner.cjs'],{encoding:'utf8'}).trim(),'');
 for(const st of specs)pair(st,SC[0],0);
 const total=specs.reduce((n,st)=>n+arms(G.profile(st.id)).length,0)*SC.length*COUNT;console.log('B32A_SMOKE='+JSON.stringify({profiles:specs.length,expectedFights:total,productionDrift:false,agentPolicyUnchanged:true}));
}
const [cmd,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(si),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
