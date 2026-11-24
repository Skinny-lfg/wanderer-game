'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const E=require('./v013-stage648c2e-rot-mana.cjs'),S=require('./simulate-progression.cjs');
const {T,buy}=require('../tests/v013-current-talent-helper.cjs');
const W=['daggers','sword','twohand','bow','wand','staff'],MAGIC=['arcane','fire','frost','lightning'],N=50,POINTS=24;
const IDS=[...W.map(w=>'decay-'+w),...MAGIC.flatMap(m=>['sword','wand','staff'].map(w=>m+'-'+w)),...W.map(w=>'focus-'+w),'hybrid-blood-daggers','hybrid-blood-twohand','hybrid-magic-sword','hybrid-magic-wand'];
const COST={base:[1,3,4,2],A:[4,8,10,4],B:[6,10,15,6],C:[8,12,20,8]};
const DECAY_ARMS={base:{cost:'base',regen:1},A:{cost:'A',regen:1},B:{cost:'B',regen:1},C:{cost:'C',regen:1},regen75:{cost:'base',regen:.75},regen50:{cost:'base',regen:.5},Aregen75:{cost:'A',regen:.75}};
const MAGIC_ARMS={base:{regen:1,infusion:0},regen75:{regen:.75,infusion:0},regen50:{regen:.5,infusion:0},infusion4:{regen:1,infusion:4}};
const FOCUS_ARMS={control:{cost:'A',regen:1,focus:0},focus10:{cost:'A',regen:1,focus:10},focus18:{cost:'A',regen:1,focus:18}};
const BC=fs.readFileSync('combat/v012-buildcraft.js','utf8'),GEAR=fs.readFileSync('combat/v012-gear-stats.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'anchor '+a.slice(0,100));return s.replace(a,b);}
function gearSource(factor){assert([1,.75,.5].includes(factor));return factor===1?GEAR:rep(GEAR,'result.power=power(result);','result.manaRegen*= '+factor+';result.power=power(result);');}
function magicSource(add){assert([0,4].includes(add));return add?rep(BC,'charges:2,cost:12,arcaneCost:10','charges:2,cost:16,arcaneCost:14'):BC;}
function decaySource(cost,focus=0){
 assert(Object.hasOwn(COST,cost));assert([0,10,18].includes(focus));let s=E.rotSource('rot4');const [rot,blight,cycle,soul]=COST[cost];
 // Preserve native order, chance, ICD and affordability prechecks; only vary prices.
 s=rep(s,"c.random()<v.chance*q&&spendDarkMana(c,1)","c.random()<v.chance*q&&spendDarkMana(c,"+rot+")");
 s=rep(s,"rank(b,'toxic_touch')&&(c.player?.mp||0)>=1","rank(b,'toxic_touch')&&(c.player?.mp||0)>="+rot);
 s=rep(s,"&&spendDarkMana(c,1)&&ready(b,'toxicTouch'","&&spendDarkMana(c,"+rot+")&&ready(b,'toxicTouch'");
 s=rep(s,"e.v012Rot?.length&&(c.player?.mp||0)>=3&&ready(b,'blight'","e.v012Rot?.length&&(c.player?.mp||0)>="+blight+"&&ready(b,'blight'");
 s=rep(s,"&&spendDarkMana(c,3)&&activated(b,'blight')","&&spendDarkMana(c,"+blight+")&&activated(b,'blight')");
 s=rep(s,"e.v012Rot?.length>=3&&(c.player?.mp||0)>=4","e.v012Rot?.length>=3&&(c.player?.mp||0)>="+cycle);
 s=rep(s,"if(spendDarkMana(c,4)&&ready(b,'corruptionCycle'","if(spendDarkMana(c,"+cycle+")&&ready(b,'corruptionCycle'");
 s=rep(s,"(c.player?.mp||0)<4)m('InsufficientMana')","(c.player?.mp||0)<"+cycle+")m('InsufficientMana')");
 s=rep(s,"const before=c.player.mp;c.mana(2);activated(b,'soul_drain')","const before=c.player.mp;c.mana("+soul+");activated(b,'soul_drain')");
 // Experimental Plagueheart replaces its free 35% third-tick bonus.
 // Only pure Decay may pay for a +100% primary-stack tick; global 3s ICD.
 if(focus){
  const old="const damage=Math.round(rot.reduce((sum,s)=>sum+s.damage,0)*(e.incubationTicks%3===0?1+.12*incubationRank+(specialized(b,'plagueheart')?.35:0):1));";
  const next="let focusedBonus=0;const third=e.incubationTicks%3===0;if(third&&specialized(b,'plagueheart')&&c.player.hp>0&&e.hp>0){const primary=rot.filter(primaryPaidRot).reduce((n,d)=>n+d.damage,0);if(primary>0){if(!Array.isArray(b.families)||b.families.length!==1||!hasFamily(b,'decay'))c.metric?.('decayPrimaryPaidStageE1FocusHybridBlocked',1);else if((b.cooldowns.plagueheartFunded??-1e10)<=c.now){c.metric?.('decayPrimaryPaidStageE1FocusEligible',1);if(spendDarkMana(c,"+focus+")&&ready(b,'plagueheartFunded',c.now,3)){focusedBonus=primary;activated(b,'plagueheart');c.metric?.('decayPrimaryPaidStageE1FocusActivations',1);c.metric?.('decayPrimaryPaidStageE1FocusNominalCost',"+focus+");c.metric?.('decayPrimaryPaidStageE1FocusRawBonus',primary);}else c.metric?.('decayPrimaryPaidStageE1FocusDenied',1);}}}const damage=Math.round(baseRot*(third?1+.12*incubationRank:1)+focusedBonus);";
  s=rep(s,old,next);
  // Correct secondary attribution when the primary-only extra tick is present.
  s=rep(s,"const secondaryFraction=baseRot>0?secondaryRot/baseRot:0;","let secondaryFraction=baseRot>0?secondaryRot/baseRot:0;");
  s=rep(s,"const damage=Math.round(baseRot*(third?1+.12*incubationRank:1)+focusedBonus);","const scaledBase=baseRot*(third?1+.12*incubationRank:1);const damage=Math.round(scaledBase+focusedBonus);if(focusedBonus>0)secondaryFraction=secondaryRot*(third?1+.12*incubationRank:1)/(scaledBase+focusedBonus);");
 }
 return s;
}
function focusTalent(other){
 const ids=['plagueheart',...(other?['affinity_'+other]:[])];
 let t=buy(ids,{xp:POINTS*T.POINT_XP});
 for(let pass=0;pass<POINTS&&t.nodes.length<POINTS;pass++){
  let changed=false;
  for(const n of T.NODES){if(t.nodes.length>=POINTS)break;if(n.family!=='decay'||n.pair||n.advanced||t.nodes.includes(n.id))continue;const next=T.allocate(t,n.id);if(next){t=next;changed=true;}}
  if(!changed)break;
 }
 assert(T.valid(t));assert.equal(t.nodes.length,POINTS);assert(t.nodes.includes('plagueheart'));assert.deepEqual(t.nodes.filter(x=>x.startsWith('affinity_')).sort(),['affinity_decay',...(other?['affinity_'+other]:[])].sort());return t;
}
function profile(id){assert(IDS.includes(id));const parts=id.split('-'),w=parts.at(-1),type=parts[0];if(type==='decay')return {w,mode:'rot4',arms:DECAY_ARMS};if(MAGIC.includes(type))return {w,mode:type,arms:MAGIC_ARMS};const other=type==='hybrid'?parts[1]:null;return {w,mode:'rot4',arms:FOCUS_ARMS,other,talents:focusTalent(other),families:['decay',...(other?[other]:[])]};}
function cell(id,arm,sc,i){
 const p=profile(id),a=p.arms[arm];assert(a);const source=p.mode==='rot4'?decaySource(a.cost,a.focus||0):magicSource(a.infusion);
 const row=E.cell(p.w,p.mode,sc,i,true,{buildcraftSource:source,gearSource:gearSource(a.regen),talents:p.talents,families:p.families});
 row.id=id;row.arm=arm;assert(row.ledger);assert(Math.abs(row.ledger.residual)<1e-6);assert(Math.abs(row.ledger.paid-['stage648ManaWeaponSpent','stage648ManaInfusionSpent','stage648ManaElementalSpent','stage648ManaDarkSpent'].reduce((n,k)=>n+(row.ledger.metrics[k]||0),0))<1e-5,'paid categories');
 if(p.other&&a.focus){assert.equal(row.focus.decayPrimaryPaidStageE1FocusActivations||0,0,'hybrid paid focused talent');assert.equal(row.focus.decayPrimaryPaidStageE1FocusNominalCost||0,0);}
 return row;
}
function verify(a,b,config){
 for(const k of ['id','w','mode','scenario','trial','seed','gear','roster','nodes'])assert.deepEqual(a[k],b[k],'matched '+k);
 for(const [k,v] of Object.entries(a.stats)){if(k==='power')continue;const expected=k==='manaRegen'?v*config.regen:v;assert(Math.abs((b.stats[k]??0)-(expected??0))<1e-7,'matched stats '+k);}
 assert.equal(a.mpStart,b.mpStart);assert.equal(a.mpMax,b.mpMax);
}
function compact(rows){
 const v=E.summary(rows),sec=rows.reduce((n,x)=>n+x.seconds,0),n=rows.length;
 const f=k=>rows.reduce((n,x)=>n+(x.focus?.['decayPrimaryPaidStageE1Focus'+k]||0),0);
 return {...v,focusActivations:f('Activations'),focusEligible:f('Eligible'),focusDenied:f('Denied'),focusHybridBlocked:f('HybridBlocked'),focusNominalCost:f('NominalCost')/n,focusRawBonusPerSecond:sec?f('RawBonus')/sec:0,regenWastePct:v.regenPotential?100*v.regenWasted/v.regenPotential:0};
}
function write(p,x){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');}
function run(id,smoke=false){
 const p=profile(id),arms=Object.keys(p.arms),rows=[];
 for(const sc of E.SC)for(let i=0;i<(smoke?1:N);i++){
  const base=cell(id,arms[0],sc,i);rows.push(base);
  for(const arm of arms.slice(1)){const r=cell(id,arm,sc,i);verify(base,r,p.arms[arm]);rows.push(r);}
 }
 if(!smoke)write('reports/stage648c2e1/'+id+'.json',{id,complete:true,source:S.sourceFingerprint().sha256,rows});
 console.log('STAGE648C2E1_SHARD='+JSON.stringify({id,smoke,fights:rows.length,arms:Object.fromEntries(arms.map(arm=>[arm,compact(rows.filter(r=>r.arm===arm))]))}));
}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/stage648c2e1/'+id+'.json','utf8')),p=profile(id);assert(x.complete&&x.id===id);assert.equal(x.rows.length,Object.keys(p.arms).length*E.SC.length*N);assert.equal(new Set(x.rows.map(r=>r.arm+'/'+r.scenario+'/'+r.trial)).size,x.rows.length);return x;});
 assert.equal(new Set(all.map(x=>x.source)).size,1);
 const report={stage:'6.48C.2E.1',source:all[0].source,fights:all.reduce((n,x)=>n+x.rows.length,0),profiles:{}};
 for(const x of all){const p=profile(x.id),arms=Object.keys(p.arms),base=new Map(x.rows.filter(r=>r.arm===arms[0]).map(r=>[r.scenario+'/'+r.trial,r]));report.profiles[x.id]={};for(const arm of arms){const rows=x.rows.filter(r=>r.arm===arm);for(const r of rows)verify(base.get(r.scenario+'/'+r.trial),r,p.arms[arm]);report.profiles[x.id][arm]={overall:compact(rows),byScenario:Object.fromEntries(E.SC.map(sc=>[sc.id,compact(rows.filter(r=>r.scenario===sc.id))])),lossToWin:rows.filter(r=>r.won&&base.get(r.scenario+'/'+r.trial).died).length,winToLoss:rows.filter(r=>r.died&&base.get(r.scenario+'/'+r.trial).won).length};}}
 write('reports/v013-stage648c2e1-mana-calibration.json',report);
 for(const type of ['decay','magic','focus','hybrid']){
  const selected=Object.entries(report.profiles).filter(([k])=>type==='magic'?MAGIC.includes(k.split('-')[0]):k.startsWith(type+'-'));
  console.log('STAGE648C2E1_'+type.toUpperCase()+'='+JSON.stringify({fights:selected.reduce((n,[k,v])=>n+Object.values(v).reduce((a,r)=>a+r.overall.n,0),0),profiles:Object.fromEntries(selected.map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([arm,r])=>[arm,{...Object.fromEntries(['n','wins','timeouts','seconds','dps','rotDps','appsPerMinute','meanRegen','mpStart','mpEnd','endPct','minMana','paid','paidPerSecond','regenActual','regenWasted','regenWastePct','refundActual','atCapPct','starvedSeconds','unfunded','weaponPaid','infusionPaid','elementalPaid','darkPaid','darkDenied','focusActivations','focusEligible','focusDenied','focusHybridBlocked','focusNominalCost','focusRawBonusPerSecond'].map(key=>[key,r.overall[key]])),lossToWin:r.lossToWin,winToLoss:r.winToLoss}]))]))}));
 }
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke'){for(const id of IDS)run(id,true);}else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={decaySource,magicSource,gearSource,focusTalent,profile,cell,verify,IDS,DECAY_ARMS,MAGIC_ARMS,FOCUS_ARMS};
