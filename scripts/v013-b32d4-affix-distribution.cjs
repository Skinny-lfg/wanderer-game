'use strict';
// B3.2D.4: offline native Forge distribution, not an earned account or policy.
const fs=require('node:fs'),assert=require('node:assert/strict'),{execFileSync}=require('node:child_process');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),AI=require('./v013-b32c-equipment-policy.cjs'),create=require('../tests/v012-economy-harness.cjs');
require('../economy/v013-gear-rolls.js');require('../economy/v013-crafting.js');
const C=globalThis.WandererV013Crafting,R=globalThis.WandererV013GearRolls;
const BASE='5fff891a1a27f5010c7c6e22716749b00affc590',OUT='reports/b32d4',SEED=107000001,CONTEXTS=8,ROLLS=100;
const IDS=['blood-sword','fury-daggers','fury-bow','decay-cycle-daggers','decay-cycle-wand','radiance-mace','aegis-mace','aegis-orb','arcane-arcane-wand','arcane-fire-staff','arcane-frost-wand','arcane-lightning-staff'];
const LEVELS=[3,10],ARMOR=['helm','armor','gloves','boots','belt'],TWO=new Set(['Bow','Staff','Two-Handed']);
const mean=a=>a.length?a.reduce((s,x)=>s+x,0)/a.length:null;
const sum=(a,f)=>a.reduce((s,x)=>s+f(x),0);
const snap=a=>JSON.stringify(a.state());
const count=(a,k)=>a.reduce((o,x)=>{const v=k(x);o[v]=(o[v]||0)+1;return o},{});
const quant=(sorted,p)=>sorted[Math.floor((sorted.length-1)*p)];
function dist(values){
 const a=[...values].sort((x,y)=>x-y),m=mean(a);
 return {n:a.length,mean:m,sd:Math.sqrt(mean(a.map(v=>(v-m)**2))),min:a[0],p10:quant(a,.1),p25:quant(a,.25),median:quant(a,.5),p75:quant(a,.75),p90:quant(a,.9),p95:quant(a,.95),max:a.at(-1)};
}
function fixture(pi,li,i){
 const p=G.profile(IDS[pi]),level=LEVELS[li],rarity=level===3?'Uncommon':'Rare',seed=SEED+pi*100003+li*1009+i*131;
 const a=create(seed,undefined,{}, {skipPersistence:true});
 a.setup(level,p.weapon,rarity);
 const eq=a.state().equip;
 for(const slot of ARMOR)eq[slot]=a.makeItem(level,slot,null,'loot',p.armorType,rarity);
 eq.offhand=p.offhandType?a.makeItem(level,'offhand',null,'loot',p.offhandType,rarity):null;
 const t=level===10?{...p.t,nodes:[...p.t.nodes]}:{...p.t,xp:600,nodes:p.t.nodes.slice(0,6),prepared:null};
 assert(a.talents.valid(t),'Invalid checkpoint talents '+p.id);assert.equal(t.nodes.length,level===3?6:30);
 a.state().automaticTalents=t;
 const policy={weapons:[p.weapon],armor:p.armorType,families:p.families,equipmentIntelligence:'b32d2-transition'};
 return {a,p,policy,level,seed,rarity,eq};
}
function options(p){
 // Same stat distribution for alternate untraited recipe IDs with same slot,
 // subtype, rarity and influence; retain one representative, except ring slots.
 const seen=new Set(),out=[];
 for(const r of C.RECIPES){
  const relevant=r.slot==='weapon'?r.subtype===p.weapon:r.slot==='offhand'?(!TWO.has(p.weapon)&&['Shield','Orb','Tome','Charm'].includes(r.subtype)):ARMOR.includes(r.slot)?(r.subtype===p.armorType||r.slot==='armor'):['ring1','ring2','amulet'].includes(r.slot);
  if(!relevant)continue;
  const legal=C.influenceOptions(r.id);
  const preferred=legal.find(x=>p.families.includes(x.family))?.family;
  for(const influence of [null,...(preferred?[preferred]:[])]){
   const key=[r.slot,r.subtype,r.rarity,r.trait||'',influence||'none'].join('|');
   if(seen.has(key))continue;seen.add(key);out.push({r,influence,key});
  }
 }
 return out;
}
function researchState(r){
 const crafting=C.create();crafting.essence=100000;
 for(const f of C.FAMILIES)crafting.cores[f]=1000;
 if(r.rarity!=='Uncommon')crafting.learnedRecipes=[r.id];
 return {fragments:100000,crafting};
}
function rawRoll(roller,r,level,influence){
 const state=researchState(r),price=C.cost(r.id,level,influence);
 const result=C.prepareCraft(state,r.id,level,(...args)=>roller.makeItem(...args),influence);
 assert(result?.item,'Native craft fixture rejected '+r.id);
 assert.equal(state.fragments-result.fragments,price.fragments);
 assert.equal(state.crafting.essence-result.crafting.essence,price.essence);
 for(const f of C.FAMILIES)assert.equal(state.crafting.cores[f]-result.crafting.cores[f],price.reagents[f]||0);
 const it=result.item;assert.equal(it.slot,r.slot);assert.equal(it.rarity,r.rarity);assert.equal(it.tier,price.tier);
 assert.equal(it.v013Trait||null,r.trait||null);
 assert(Number.isFinite(it.v013Budget)&&it.v013Budget>0);
 return it;
}
function evaluate(f,item){
 const {a,policy,eq,level}=f,base=AI.utility(a,policy,eq,level);
 const candidates=AI.gearTargets(item).map(slot=>({slot,next:AI.projectGear(eq,item,slot)})).filter(x=>x.next).map(x=>({slot:x.slot,gain:AI.utility(a,policy,x.next,level)-base}));
 candidates.sort((x,y)=>y.gain-x.gain||x.slot.localeCompare(y.slot));
 assert(candidates.length&&Number.isFinite(candidates[0].gain));
 return candidates[0];
}
function blockMax(values,k){const v=[];for(let i=0;i+k<=values.length;i+=k)v.push(Math.max(0,...values.slice(i,i+k)));return mean(v);}
function cell(f,opt,i,n){
 const {a,p,level,seed}=f,{r,influence,key}=opt;
 // Separate RNG instance: the diagnostic never queries future account rolls.
 const rollSeed=(seed+5000003+i*7919)>>>0,roller=create(rollSeed,undefined,{}, {skipPersistence:true});
 const before=snap(a),preview=a.forge.preview(r.id,level,influence);
 assert(preview,'Missing native preview');const forecast=evaluate(f,preview).gain;
 const gains=[],affixes={},layouts={},stats=Object.fromEntries(R.KEYS.map(k=>[k,0])),rawCosts=[],slots={};
 for(let j=0;j<n;j++){
  const item=rawRoll(roller,r,level,influence),v=evaluate(f,item);
  gains.push(v.gain);slots[v.slot]=(slots[v.slot]||0)+1;
  for(const k of item.affixes)affixes[k]=(affixes[k]||0)+1;
  const signature=[...item.affixes].sort().join('+');layouts[signature]=(layouts[signature]||0)+1;
  for(const k of R.KEYS)stats[k]+=Number(item[k])||0;
  rawCosts.push(sum(R.KEYS,k=>(Number(item[k])||0)*R.COST[k]));
 }
 assert.equal(snap(a),before,'Projection or preview changed loadout state');
 const price=C.cost(r.id,level,influence),cost=price.fragments+4*price.essence+12*sum(Object.values(price.reagents),x=>x);
 const win=gains.filter(x=>x>=2.5).length,large=gains.filter(x=>x>=5).length;
 return {key,recipe:r.id,category:ARMOR.includes(r.slot)?r.subtype:r.subtype==='Ring'?'Ring':r.subtype==='Amulet'?'Amulet':r.slot==='weapon'?'Weapon':'Offhand',slot:r.slot,subtype:r.subtype,rarity:r.rarity,trait:r.trait||null,influence,price,cost,seed,rollSeed,forecast,previewAffixes:[...preview.affixes],gains,distribution:dist(gains),upgrade:win/n,large:large/n,expectedAttempts:win?n/win:null,expectedCostPerUpgrade:win?cost*n/win:null,positiveEV:mean(gains.map(v=>Math.max(0,v))),thresholdEV:mean(gains.map(v=>v>=2.5?v:0)),best5:blockMax(gains,5),best10:blockMax(gains,10),affixes,layouts,stats:Object.fromEntries(Object.entries(stats).map(([k,v])=>[k,v/n])),realizedBudget:mean(rawCosts),slots};
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/'+name+'.json',JSON.stringify(x));}
function run(pi,li){
 const p=G.profile(IDS[pi]),opts=options(p),contexts=[];
 for(let c=0;c<CONTEXTS;c++){
  const f=fixture(pi,li,c),rows=opts.map((o,i)=>cell(f,o,i,ROLLS));
  contexts.push({seed:f.seed,level:f.level,baselineRarity:f.rarity,gear:f.eq,nodes:f.a.state().automaticTalents.nodes,rows});
 }
 write('study-'+pi+'-'+li,{pi,li,profile:p.id,commit:process.env.GITHUB_SHA,native:S.sourceFingerprint().sha256,contexts});
}
function summarize(rows){
 const gains=rows.flatMap(r=>r.gains),d=dist(gains),n=gains.length,wins=gains.filter(x=>x>=2.5).length;
 const errors=rows.map(r=>r.forecast-r.distribution.mean),up=mean(rows.map(r=>r.upgrade)),positive=mean(rows.map(r=>r.positiveEV));
 return {n,contexts:rows.length,distribution:d,meanWithinContextSD:mean(rows.map(r=>r.distribution.sd)),upgradePct:100*up,largePct:100*mean(rows.map(r=>r.large)),zeroUpgradeContexts:rows.filter(r=>!r.upgrade).length,expectedAttemptsAtMeanRate:up?1/up:null,meanFiniteContextAttempts:mean(rows.filter(r=>r.expectedAttempts!=null).map(r=>r.expectedAttempts)),positiveEV:positive,thresholdEV:mean(rows.map(r=>r.thresholdEV)),evPerWeightedCost:mean(rows.map(r=>r.thresholdEV/r.cost)),best5:mean(rows.map(r=>r.best5)),best10:mean(rows.map(r=>r.best10)),previewBias:mean(errors),previewMAE:mean(errors.map(Math.abs)),previewFalsePositive:rows.filter(r=>r.forecast>=5&&r.upgrade<.25).length,previewFalseNegative:rows.filter(r=>r.forecast<5&&r.upgrade>=.5).length,meanWeightedCost:mean(rows.map(r=>r.cost)),realizedBudget:mean(rows.map(r=>r.realizedBudget)),affixFrequency:Object.fromEntries(R.KEYS.map(k=>[k,sum(rows,r=>r.affixes[k]||0)/n])),meanLayoutCount:mean(rows.map(r=>Object.keys(r.layouts).length))};
}
function aggregate(){
 const xs=IDS.flatMap((id,pi)=>LEVELS.map((l,li)=>JSON.parse(fs.readFileSync(OUT+'/study-'+pi+'-'+li+'.json','utf8'))));assert.equal(new Set(xs.map(x=>x.native)).size,1);
 const results=[],all=[];
 for(const x of xs){assert.equal(x.commit,process.env.GITHUB_SHA);assert.equal(x.contexts.length,CONTEXTS);const groups=new Map();
  for(const ctx of x.contexts)for(const r of ctx.rows){assert.equal(r.gains.length,ROLLS);assert(r.gains.every(Number.isFinite));if(!groups.has(r.key))groups.set(r.key,[]);groups.get(r.key).push(r);all.push({...r,level:LEVELS[x.li],profile:x.profile});}
  const entries=[...groups].map(([key,rows])=>({key,recipe:rows[0].recipe,category:rows[0].category,slot:rows[0].slot,subtype:rows[0].subtype,rarity:rows[0].rarity,influence:rows[0].influence,trait:rows[0].trait,price:rows[0].price,...summarize(rows)}));assert(entries.every(e=>e.contexts===CONTEXTS));
  results.push({profile:x.profile,level:LEVELS[x.li],entries});
  const base=entries.filter(e=>!e.influence&&e.rarity===(x.li===0?'Uncommon':'Rare'));
  console.log('B32D4_PROFILE='+JSON.stringify({profile:x.profile,level:LEVELS[x.li],entries:base.map(({key,category,subtype,slot,upgradePct,meanWithinContextSD,positiveEV,thresholdEV,evPerWeightedCost,previewBias,best5,best10})=>({key,category,subtype,slot,upgradePct,meanWithinContextSD,positiveEV,thresholdEV,evPerWeightedCost,previewBias,best5,best10}))}));
 }
 const pooled=[];
 for(const level of LEVELS)for(const rarity of ['Uncommon','Rare','Epic'])for(const category of ['Ring','Amulet','Weapon','Offhand','Cloth','Leather','Plate'])for(const influenced of [false,true]){
  const rows=all.filter(r=>r.level===level&&r.rarity===rarity&&r.category===category&&Boolean(r.influence)===influenced);
  if(rows.length)pooled.push({level,rarity,category,influenced,...summarize(rows)});
 }
 const report={baseline:BASE,commit:process.env.GITHUB_SHA,native:xs[0].native,profiles:IDS.length,levels:LEVELS,contexts:xs.length*CONTEXTS,rolls:sum(all,r=>r.gains.length),pooled,results,scope:'Offline native Forge roll distributions on controlled same-tier Uncommon E3 and Rare E10 loadouts; every available representative recipe sampled, not earned recipe availability. Proxy score, not actual combat wins. Contexts and recipe variants unevenly weighted; fixed loadout and independent diagnostic RNG. No policy change.'};
 write('summary',report);console.log('B32D4_OVERVIEW='+JSON.stringify({...report,results:undefined,pooled:pooled.map(({affixFrequency,...x})=>x)}));
}
function smoke(){
 assert.equal(execFileSync('git',['diff','--name-only',BASE,'HEAD','--','combat','online','economy','index.html','docs','scripts/v013-natural-progression.cjs','scripts/v013-b32c-equipment-policy.cjs','scripts/v013-b32d2-transition-policy.cjs','scripts/v013-b32d3-acquisition-policy.cjs'],{encoding:'utf8'}).trim(),'','Native or agent drift');
 for(let pi=0;pi<IDS.length;pi++)for(let li=0;li<LEVELS.length;li++){
  const f=fixture(pi,li,0),opts=options(f.p);assert(opts.some(o=>o.r.slot==='ring1'));assert(opts.some(o=>o.r.slot==='ring2'));assert(opts.some(o=>o.r.slot==='weapon'));
  const selected=[opts.find(o=>o.r.slot==='ring1'&&o.r.rarity==='Rare'&&!o.influence),opts.find(o=>o.r.slot==='weapon'&&o.r.rarity==='Uncommon'),opts.find(o=>o.r.slot==='armor'&&o.r.rarity==='Rare'&&o.influence)].filter(Boolean);
  for(const [i,o] of selected.entries()){const x=cell(f,o,i,10);assert.equal(x.gains.length,10);assert(x.upgrade>=0&&x.upgrade<=1);}
 }
 console.log('B32D4_SMOKE='+JSON.stringify({profiles:IDS.length,levels:LEVELS,nativeDrift:false,readOnly:true}));
}
const [cmd,pi,li]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='study')run(Number(pi),Number(li));else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');
