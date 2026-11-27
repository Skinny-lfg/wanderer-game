'use strict';
// B3.2B: held-out adaptive hand ranking. No actual future encounter access.
// Uses only available native items, legal loadouts and pre-fight stats.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),A=require('./v013-b31a-twohand-budget.cjs'),B=require('./v013-b31b-twohand-compensation.cjs'),C=require('./v013-b31c-compensation-validation.cjs'),G=require('./v013-global-e10.cjs'),N=require('./v013-natural-progression.cjs'),D=require('./v013-b12d-clean-natural-rebaseline.cjs');
const BASE='ac896312657d286dcad14354f77e3f68adf816d3',OUT='reports/b32b',SEED=103500001,COUNT=100,SC=A.scenarios.filter(s=>['solo','group12','boss'].includes(s.id));
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

require('../combat/v012-gear-stats.js');require('../combat/v012-combat-core.js');
const GS=globalThis.WandererV012GearStats,CORE=globalThis.WandererV012CombatCore;
const POLICIES=['H23','noPlanner','blind','context','adaptive','adaptiveSoft'];
const BLIND_POLICIES=POLICIES.filter(x=>x!=='context');
function ownedRanks(nodes){const ranks={};for(const id of nodes){const m=id.match(/^(.*)_rank(\d+)$/);const key=m?m[1]:id;ranks[key]=Math.max(ranks[key]||0,m?+m[2]:1);}return ranks;}
function adaptiveFeatures({stats:s,adaptiveStats:extra,weapon:w,off:o,nodes,equipment},element='arcane'){
 assert(extra&&Number.isFinite(extra.rawAttackSpeed)&&Number.isFinite(extra.spdFlat));
 const rankMap=ownedRanks(nodes),rank=k=>rankMap[k]||0,ap=Math.max(1,num(s.attack)),sp=Math.max(0,num(s.spellPower)),aps=Math.max(.01,num(s.attacksPerSec)),hp=Math.max(1,num(s.maxhp));
 const caster=w==='Staff'||w==='Wand',mana=Math.max(0,num(s.mana)),regen=Math.max(0,num(s.manaRegen));
 const daggerRate=GS.offhandDaggerRate({...s,...extra,main:equipment.weapon,off:equipment.offhand});
 const baseCost=({arcane:[9,13],fire:[13,18],frost:[10,15],lightning:[14,20]})[element]?.[w==='Staff'?1:0]||9;
 let price=baseCost*(w==='Staff'?.75:1);
 if(caster&&rank('element_choice'))price=Math.max(Math.min(3,price),price-rank('efficient_cast'));
 price=Math.ceil(price);
 if(Object.values(equipment).some(x=>x?.v013Trait==='efficient'))price=Math.max(1,price-Math.max(1,Math.floor(price*.1)));
 price=Math.max(1,Math.round(price*(1-clamp(num(s.manaCostReduction),0,.25))*100)/100);
 const rotRank=rank('corrupting_touch'),bleedRank=rank('bleeding_edge');
 const procRate=(rate,chance,icd)=>rate*chance/(1+rate*chance*icd);
 // 60s resource envelope with bounded estimates for Tome and other paid actions.
 // Reserve expected cost for acquired Rot and Arcane abilities, not planned nodes.
 const rotDemand=rotRank?4*procRate(aps+daggerRate,.42+.04*(rotRank-1),1.3):0;
 const arcaneReserve=rank('element_choice')?1.5:0;
 const tomeRate=o==='Tome'&&mana>0?Math.min((equipment.offhand?.v013Trait==='echoing_recall'?5:3)/6,(caster?aps:0)*((equipment.offhand?.v013Trait==='echoing_recall'?5:3)/3)):0;
 const budget=mana/60+regen+tomeRate;
 const funded=caster?clamp((budget-.5*rotDemand-arcaneReserve)/(price*aps),0,1):1;
 const factor={Sword:1.12,Mace:1.4,Daggers:.8,Bow:1.4,'Two-Handed':2.1,Wand:1.05,Staff:1.6}[w];
 const crit=1+clamp(num(s.crit)/100,0,1)*(.5+num(extra.critDamage));
 const nominal=caster?sp*factor:ap*factor,hit=caster?funded*nominal*(1+.12*rank('elemental_force'))+(1-funded)*ap*.55:nominal;
 const direct=Math.max(1,hit*aps*crit+ap*.4*daggerRate*crit);
 const eligible=aps*(caster?funded:1)+daggerRate;
 const bleed=bleedRank?procRate(eligible,.42+.04*(bleedRank-1),.6)*Math.max(1,(hit*aps+ap*.4*daggerRate)/Math.max(.01,aps+daggerRate))*crit*.16*4*(1+.15*rank('deep_cuts')):0;
 const rotOpportunity=rotRank?procRate(eligible,.42+.04*(rotRank-1),1.3):0;
 const rotBudget=Math.max(0,budget-(caster?price*aps*funded:0)-arcaneReserve);
 const rotPaid=Math.min(rotOpportunity,rotBudget/4);
 // Four effective tick-equivalents is only a ranking proxy, not Rot's native duration.
 const rot=rotPaid*.04*(nominal+sp)*4*(1+.15*rank('virulent_rot'));
 const dots=(bleed+rot)*(1+num(extra.dotPower));
 // Credit cleave only when the actual weapon/offhand and acquired nodes enable it.
 const secondary=w==='Bow'?(rank('bow_pierce')?1:.66):w==='Two-Handed'?(rank('cleave_mastery')?1.2:.8):w==='Daggers'&&rank('fan_of_blades')?.44:w==='Sword'&&o==='Shield'&&rank('sword_sweep')?.25:w==='Mace'&&rank('mace_shockwave')?.3:0;
 const single=direct*(rank('single_target_mastery')&&!caster?1.15:1)+dots;
 // Maximum two primary foes in the native arena. Partial simultaneous target uptime.
 const group=direct*(1+Math.min(1,secondary)*.75)+dots*(1+(w==='Bow'?.75:Math.min(1,secondary)*.25));
 const guard=clamp(num(s.blockChance)/100,0,.65),guardReduction=clamp(num(s.blockReduction),0,1);
 const eva=CORE.evasionChance(num(s.evasionRating),10,20,.45);
 const def=Math.max(0,num(s.defense)),ward=1+Math.max(0,num(s.wardBonus)+num(s.barrierPower)),heal=1+Math.max(0,num(s.healingPower));
 const pulse=rank('barrier_pulse'),renewal=rank('renewal'),drinker=rank('blood_drinker');
 const barrier=(o==='Orb'?(hp*.02+sp*.05)/6:0)+(pulse?(hp*(.03+.006*(pulse-1))+sp*(.06+.012*(pulse-1)))/6:0);
 const healing=(o==='Charm'?hp*(equipment.offhand?.v013Trait==='heartbloom'?.02:.015)/8:0)+(renewal?hp*Math.min(.0125,.0055*Math.sqrt(renewal)):0)+(drinker&&bleedRank?Math.min(hp*(.008+.0025*(drinker-1)),hit*(.10+.025*(drinker-1)))/4:0);
 const effectivePool=hp+30*(barrier*ward+healing*heal);
 const durability=enemyAtk=>effectivePool/(1-Math.min(.75,def/(def+enemyAtk*1.35)))/(1-guard*guardReduction)/(1-.6*eva);
 // Fixed reference threats, not the sampled encounter's hidden enemy stats.
 return {single,group,normalDurability:durability(30),bossDurability:durability(55),funded,daggerRate,rotPaid,bleed,rot,barrier,healing,secondary};
}
function adaptiveScore(x,b,profile,weapon){
 const single=ratio(x.single,b.single),group=ratio(x.group,b.group),normal=ratio(x.normalDurability,b.normalDurability),boss=ratio(x.bossDurability,b.bossDurability);
 // Fixed expected encounter mix; a single choice for the whole Expedition.
 // 25% solo, 40% groups, 35% boss are declared test weights, not actual frequencies.
 const main=.25*(.65*single+.35*normal)+.40*(.55*group+.45*normal)+.35*(.42*single+.58*boss);
 const owned=profile.adaptiveNodes||[],commit=Math.min(1,owned.length/30);
 const preferred=profile.weapons?.includes(weapon)?1:0;
 return {adaptive:main,adaptiveSoft:main+.035*commit*preferred};
}

function pair(st,sc,i){
 const p=G.profile(st.id),list=arms(p),src=B.sources('Staff',{factor:1.32,reference:true});
 const rows=list.map(a=>A.cell({id:st.id,profile:st.id,armor:p.armorType},sc,i,a,null,{id:a[0],seedBase:SEED,...src,runtime:C.manaRuntime(src.runtime,1),manaAudit:true,recordEquipment:true,recordAbilityMetrics:true,recordAdaptiveStats:true}));
 const b=rows[0],profile={...D.approvedProfile(st.agent),offhandPolicy:'b23',adaptiveNodes:[...p.t.nodes],synergyContext:{stats:b.stats,nodes:[...p.t.nodes],weapon:b.weapon,offhand:b.off}};
 assert.equal(b.id,id(p.weapon,p.offhandType));
 for(const r of rows){
  assert.equal(r.resolved,b.resolved);assert.equal(r.rosterHash,b.rosterHash);assert.equal(r.nonHands,b.nonHands);assert.deepEqual(r.nodes,b.nodes);
  assert(!TWO.has(r.weapon)||!r.off);assert(r.equipment.weapon?.subtype===r.weapon);assert.equal(r.equipment.offhand?.subtype||null,r.off);
  for(const q of rows.filter(q=>q.weapon===r.weapon))assert.equal(q.weaponHash,r.weaponHash);
  assert(Math.abs(r.manaLedger.residual)<1e-6);
  r.H23=N.handPairScore(r.equipment,profile);r.H23NoPlanner=N.handPairScore(r.equipment,{...profile,plan:null});r.proxy=evaluate(r,p);r.adaptiveFeatures=adaptiveFeatures({stats:r.stats,adaptiveStats:r.adaptiveStats,weapon:r.weapon,off:r.off,nodes:r.nodes,equipment:r.equipment},p.element||'arcane');
  assert(Number.isFinite(r.H23)&&Number.isFinite(r.H23NoPlanner));
 }
 for(const r of rows){
  const x=r.proxy,y=b.proxy,off=ratio(x.damage,y.damage),group=ratio(x.groupDamage,y.groupDamage),def=ratio(x.durability,y.durability),status=ratio(x.status,y.status);
  r.contextScores={solo:.65*off+.35*def+.12*status,group12:.55*group+.45*def+.12*status,boss:.45*off+.55*def+.12*status};
  r.contextScores.blind=mean(['solo','group12','boss'],k=>r.contextScores[k]);Object.assign(r.contextScores,adaptiveScore(r.adaptiveFeatures,b.adaptiveFeatures,profile,r.weapon));
  assert(Object.values(r.contextScores).every(Number.isFinite));
 }
 return {seed:b.seed,scenario:sc.id,base:b.id,rows};
}
function write(n,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+n+'.json',JSON.stringify(x,null,2));}
function run(si,ci){const st=specs[si],sc=SC[ci];assert(st&&sc);const cases=Array.from({length:COUNT},(_,i)=>pair(st,sc,i));write('study-'+si+'-'+ci,{si,ci,study:st.id,agent:st.agent,scenario:sc.id,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,cases});}
const choice=(rows,score)=>[...rows].sort((a,b)=>score(b)-score(a)||a.id.localeCompare(b.id))[0];
function select(c,policy){if(policy==='H23')return choice(c.rows,r=>r.H23);if(policy==='noPlanner')return choice(c.rows,r=>r.H23NoPlanner);if(policy==='blind')return choice(c.rows,r=>r.contextScores.blind);if(policy==='context')return choice(c.rows,r=>r.contextScores[c.scenario]);if(['adaptive','adaptiveSoft'].includes(policy))return choice(c.rows,r=>r.contextScores[policy]);throw Error('Unknown policy');}
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
  const policies=Object.fromEntries(POLICIES.map(k=>[k,evaluatePolicy(x.cases,k)])),h=x.cases.map(c=>select(c,'H23')),comparison={};
  for(const policy of POLICIES.filter(k=>k!=='H23')){const picks=x.cases.map(c=>select(c,policy));comparison[policy]=A.paired(x.cases.map((c,i)=>({rows:[{...h[i],id:'H23'},{...picks[i],id:'candidate'}]})),'H23','candidate');}
  const out={study:x.study,agent:x.agent,scenario:x.scenario,policies,vsH23:comparison,oracleWinCeiling:x.cases.filter(c=>c.rows.some(r=>r.won)).length,arms:Object.fromEntries(aa.map(([id])=>{const rr=x.cases.map(c=>c.rows.find(r=>r.id===id));return [id,{...A.metrics(rr),meanH23:mean(rr,r=>r.H23),meanH23NoPlanner:mean(rr,r=>r.H23NoPlanner),meanContext:mean(rr,r=>r.contextScores[x.scenario]),meanAdaptive:mean(rr,r=>r.contextScores.adaptive),meanAdaptiveSoft:mean(rr,r=>r.contextScores.adaptiveSoft)}]}))};
  results.push(out);console.log('B32B_STUDY='+JSON.stringify({...out,arms:undefined}));
 }
 // A blind policy must select the same loadout on the same offered items/owned stats,
 // regardless of the category of the subsequently simulated encounter.
 let noLookaheadChecks=0;
 for(let si=0;si<specs.length;si++){
  const panels=xs.filter(x=>x.si===si);assert.equal(panels.length,3);
  for(let i=0;i<COUNT;i++){const cs=panels.map(x=>x.cases[i]);for(const c of cs.slice(1)){assert.equal(c.seed,cs[0].seed);
   for(const r of c.rows){const q=cs[0].rows.find(x=>x.id===r.id);assert.equal(r.gearHash,q.gearHash);assert.deepEqual(r.adaptiveStats,q.adaptiveStats);assert.deepEqual(r.stats,q.stats);assert.equal(r.contextScores.adaptive,q.contextScores.adaptive);assert.equal(r.contextScores.adaptiveSoft,q.contextScores.adaptiveSoft);}
   for(const k of BLIND_POLICIES){assert.equal(select(c,k).id,select(cs[0],k).id,'Scenario leakage '+k);noLookaheadChecks++;}
  }}
 }
 const pooled=Object.fromEntries(['all',...SC.map(x=>x.id)].map(sc=>{const panels=xs.filter(x=>sc==='all'||x.scenario===sc),cases=panels.flatMap(x=>x.cases);return [sc,Object.fromEntries(POLICIES.map(k=>[k,evaluatePolicy(cases,k)]))];}));
 assert.equal(all.length,33300);
 const summary={commit:process.env.GITHUB_SHA,baseline:BASE,native:xs[0].native,noLookaheadChecks,pooled,fights:all.length,timeouts:all.filter(x=>x.timeout).length,surrenders:all.filter(x=>x.surrendered).length,decisions:xs.length*COUNT,results,scope:'100 held-out matched seeds per profile/scenario. Adaptive and adaptiveSoft use a fixed predeclared expedition mix and cannot see encounter category or outcomes; B32A context remains informational upper comparator only. Native E10 Rare gear, fixed legal talents, not earned purchases. No production or agent policy modifications.'};write('summary',summary);console.log('B32B_OVERVIEW='+JSON.stringify({...summary,results:undefined}));if(summary.timeouts)process.exitCode=1;
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs/index.html','docs/combat','docs/online','docs/economy','scripts/v013-natural-progression.cjs','scripts/v013-build-planner.cjs'],{encoding:'utf8'}).trim(),'');
 for(const st of specs){const x=pair(st,SC[0],0),y=pair(st,SC[1],0);for(const k of BLIND_POLICIES)assert.equal(select(x,k).id,select(y,k).id,'Smoke scenario leakage '+k);}
 const total=specs.reduce((n,st)=>n+arms(G.profile(st.id)).length,0)*SC.length*COUNT;console.log('B32B_SMOKE='+JSON.stringify({profiles:specs.length,expectedFights:total,productionDrift:false,agentPolicyUnchanged:true}));
}
const [cmd,si,ci]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(si),Number(ci));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
