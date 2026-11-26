'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const E=require('./v013-stage648c2e-rot-mana.cjs'),A=require('./v013-stage648c2e1-mana-calibration.cjs'),C=require('./v013-stage648c2c-offensive-scaling.cjs'),S=require('./simulate-progression.cjs');
const W=['daggers','sword','twohand','bow','wand','staff'],N=50;
const IDS=[...W.map(w=>'cycle-'+w),...W.map(w=>'focus-'+w),'hybrid-blood-daggers','hybrid-blood-twohand','hybrid-arcane-sword','hybrid-arcane-wand'];
const CYCLE={control:{},noCycle:{disable:true},doubleOnly:{double:true,disable:true},fixedVirtual:{double:true,burst:'virtual',speed:false},speedVirtual:{double:true,burst:'virtual',speed:true},speed2:{double:true,burst:2,speed:true},speed4:{double:true,burst:4,speed:true}};
const FOCUS={control:null,uncapped:{limit:4,bonus:2,reserve:0},cap1:{limit:1,bonus:2,reserve:0},cap2:{limit:2,bonus:2,reserve:0},cap1reserve:{limit:1,bonus:2,reserve:.15},cap1low:{limit:1,bonus:1,reserve:0}};
function rep(s,a,b){assert.equal(s.split(a).length,2,'anchor '+a.slice(0,120));return s.replace(a,b);}
function cycleCooldown(stats,scaled){return scaled?Math.max(2.5,Math.min(10,5*.7/Math.max(.01,Number(stats?.attacksPerSec)||.7))):5;}
function cycleSource(arm){
 assert(Object.hasOwn(CYCLE,arm));const v=CYCLE[arm];let s=A.decaySource('A');
 if(arm==='control')return s;
 if(v.double){
  // The second stack has paid-primary provenance for persistence and burst,
  // but does not trigger a second paid action, Soul Drain or Contagious Touch.
  s=rep(s,"...(origin==='paid_primary_corrupting_touch'?{primaryPaid:true}:{})","...(['paid_primary_corrupting_touch','paid_primary_cycle_extra'].includes(origin)?{primaryPaid:true}:{})");
  s=rep(s,"damage:origin==='paid_primary_corrupting_touch'?","damage:['paid_primary_corrupting_touch','paid_primary_cycle_extra'].includes(origin)?");
  s=rep(s,"if(d.primaryPaid){c.metric?.('decayPrimaryPaidDiagnosticAppliedWithStacks'","if(origin==='paid_primary_cycle_extra'){c.metric?.('decayPrimaryPaidStageE2ExtraStacks',1);c.metric?.('decayPrimaryPaidStageE2ExtraStackRaw',d.damage);}if(origin==='paid_primary_corrupting_touch'){c.metric?.('decayPrimaryPaidDiagnosticAppliedWithStacks'");
  const from="&&ready(b,'corruptingTouch',c.now,1.3)&&activated(b,'corrupting_touch'))applyRot(b,c,(weaponBase(c.player.stats)+Math.max(0,Number(c.player.stats.spellPower)||0))*0.04,'paid_primary_corrupting_touch');";
  const to="&&ready(b,'corruptingTouch',c.now,1.3)&&activated(b,'corrupting_touch')){const potency=(weaponBase(c.player.stats)+Math.max(0,Number(c.player.stats.spellPower)||0))*0.04;applyRot(b,c,potency,'paid_primary_corrupting_touch');if(specialized(b,'corruption_cycle')&&e.hp>0)applyRot(b,c,potency,'paid_primary_cycle_extra');}";
  s=rep(s,from,to);
 }
 const start=s.indexOf(" if(specialized(b,'corruption_cycle')){const stacks="),end=s.indexOf(" if(rank(b,'blightburst')",start);
 assert(start>=0&&end>start);const old=s.slice(start,end);assert(old.includes('corruptionCycleConsumedRawRot'));
 let next='';
 if(!v.disable){
  const ticks=v.burst==='virtual'?"Math.max(0,d.remaining-(d.ticks||0))":String(v.burst);
  next=" if(specialized(b,'corruption_cycle')&&e.hp>0&&c.player.hp>0){const eligible=(e.v012Rot||[]).filter(primaryPaidRot);const metric=(k,n=1)=>c.metric?.('decayPrimaryPaidStageE2Cycle'+k,n);metric('Checks');if(eligible.length<3)metric('Below3');else if((b.cooldowns.corruptionCycle??-1e10)>c.now)metric('CooldownBlocked');else{metric('Eligible');if(spendDarkMana(c,10)){const cd=("+cycleCooldown.toString()+")(c.player.stats,"+!!v.speed+");if(!ready(b,'corruptionCycle',c.now,cd))throw Error('Cycle cooldown race');const consumed=eligible.slice(0,3),remove=new Set(consumed);e.v012Rot=e.v012Rot.filter(d=>!remove.has(d));const remaining=consumed.reduce((n,d)=>n+d.damage*("+ticks+"),0),ap=Math.max(0,Number(c.player.stats?.attack)||0),sp=Math.max(0,Number(c.player.stats?.spellPower)||0),raw=remaining+.20*ap+.20*sp,hp=e.hp;c.damage(raw,'🦠 Corruption Cycle');activated(b,'corruption_cycle');c.metric?.('corruptionCycleActivations',1);c.metric?.('corruptionCycleConsumedRawRot',remaining);c.metric?.('corruptionCycleRawBurst',raw);c.metric?.('corruptionCycleDamage',Math.max(0,hp-Math.max(0,e.hp)));metric('Consumed',consumed.length);metric('NominalMana',10);metric('CooldownSum',cd);metric('RawRot',remaining);metric('RawAPSP',.20*(ap+sp));metric('RawBurst',raw);}else metric('Denied');}}\n";
 }
 s=rep(s,old,next);
 return s;
}
function focusSource(arm){
 assert(Object.hasOwn(FOCUS,arm));const v=FOCUS[arm];let s=A.decaySource('A');if(!v)return s;
 const old="const damage=Math.round(rot.reduce((sum,s)=>sum+s.damage,0)*(e.incubationTicks%3===0?1+.12*incubationRank+(specialized(b,'plagueheart')?.35:0):1));";
 // Each target independently rolls on each actual Rot tick, including weaker
 // spread stacks. The per-timestamp budget is shared by all visible targets.
 const next="const scaledBase=baseRot*(e.incubationTicks%3===0?1+.12*incubationRank:1);let focusedBonus=0;if(specialized(b,'plagueheart')&&c.player.hp>0&&e.hp>0&&baseRot>0){const m=(k,n=1)=>c.metric?.('decayPrimaryPaidStageE2Focus'+k,n);if(!Array.isArray(b.families)||b.families.length!==1||!hasFamily(b,'decay'))m('HybridBlocked');else{m('Eligible');if(c.random()<.30){m('Rolls');const state=decayState(c);if(state.plagueheartTick!==c.now){state.plagueheartTick=c.now;state.plagueheartCount=0;}const count=rot.length,cost=2+2*count;if(state.plagueheartCount>="+v.limit+")m('Capped');else if("+v.reserve+">0&&c.player.mp-cost<"+v.reserve+"*c.player.maxmp)m('ReserveBlocked');else if(spendDarkMana(c,cost)){state.plagueheartCount++;focusedBonus=baseRot*"+v.bonus+";activated(b,'plagueheart');m('Activations');m('NominalMana',cost);m('Stacks',count);m('RawBonus',focusedBonus);m('PeakSlot'+state.plagueheartCount);if(rot.some(primaryPaidRot))m('PrimaryTarget');else m('SecondaryOnly');}else m('Denied');}}}const damage=Math.round(scaledBase+focusedBonus);";
 s=rep(s,old,next);
 // Extra tick scales all Rot origins equally: retain the existing secondary
 // fraction. No extra tick scheduler, no recursion, no stack consumption.
 return s;
}
function profile(id){
 assert(IDS.includes(id));const parts=id.split('-'),w=parts.at(-1),other=parts[0]==='hybrid'?parts[1]:null;
 if(parts[0]==='cycle')return {w,kind:'cycle',arms:Object.keys(CYCLE),talents:C.talent('decay'),families:['decay']};
 return {w,kind:'focus',arms:other?['control','cap1']:Object.keys(FOCUS),other,talents:A.focusTalent(other),families:['decay',...(other?[other]:[])]};
}
function cell(id,arm,sc,i){
 const p=profile(id);assert(p.arms.includes(arm));const source=p.kind==='cycle'?cycleSource(arm):focusSource(arm);
 const row=E.cell(p.w,'rot4',sc,i,true,{talents:p.talents,families:p.families,buildcraftSource:source});row.id=id;row.arm=arm;
 const m=row.stageE2||{},get=k=>m['decayPrimaryPaidStageE2'+k]||0;
 assert(row.ledger);assert(Math.abs(row.ledger.residual)<1e-6);assert(Math.abs(row.ledger.paid-['stage648ManaWeaponSpent','stage648ManaInfusionSpent','stage648ManaElementalSpent','stage648ManaDarkSpent'].reduce((n,k)=>n+(row.ledger.metrics[k]||0),0))<1e-5,'paid categories');
 if(p.kind==='cycle'&&CYCLE[arm].double){assert(get('ExtraStacks')<=row.apps);if(CYCLE[arm].disable)assert.equal(row.cycle,0);else assert.equal(get('CycleConsumed'),3*row.cycle);}
 if(p.kind==='focus'&&FOCUS[arm]){const f=FOCUS[arm];assert.equal(get('FocusRolls'),get('FocusActivations')+get('FocusCapped')+get('FocusDenied')+get('FocusReserveBlocked'));assert.equal(get('FocusActivations'),get('FocusPrimaryTarget')+get('FocusSecondaryOnly'));assert.equal(get('FocusNominalMana'),2*get('FocusActivations')+2*get('FocusStacks'));for(let slot=f.limit+1;slot<=4;slot++)assert.equal(get('FocusPeakSlot'+slot),0);if(p.other){assert.equal(get('FocusActivations'),0);assert.equal(get('FocusNominalMana'),0);}}
 return row;
}
function verify(a,b){A.verify(a,b,{regen:1});}
function summary(rows){
 const v=E.summary(rows),sec=rows.reduce((n,x)=>n+x.seconds,0),n=rows.length;const f=k=>rows.reduce((n,x)=>n+(x.stageE2?.['decayPrimaryPaidStageE2'+k]||0),0);
 const apps=rows.reduce((n,x)=>n+x.apps,0),extra=f('ExtraStacks'),fA=f('FocusActivations');
 return {...v,extraStacks:extra,stacksPerMinute:sec?60*(apps+extra)/sec:0,meanExtraStack:extra?f('ExtraStackRaw')/extra:null,cycleConsumed:f('CycleConsumed'),cycleEligible:f('CycleEligible'),cycleDenied:f('CycleDenied'),cycleNominalMana:f('CycleNominalMana')/n,cycleMeanCooldown:v.cycle?f('CycleCooldownSum')/v.cycle:null,cycleRawRotPerBurst:v.cycle?f('CycleRawRot')/v.cycle:null,cycleRawAPSPPerBurst:v.cycle?f('CycleRawAPSP')/v.cycle:null,cycleRawBurst:v.cycle?f('CycleRawBurst')/v.cycle:null,focusEligible:f('FocusEligible'),focusRolls:f('FocusRolls'),focusActivations:fA,focusCapped:f('FocusCapped'),focusDenied:f('FocusDenied'),focusReserveBlocked:f('FocusReserveBlocked'),focusHybridBlocked:f('FocusHybridBlocked'),focusPrimary:f('FocusPrimaryTarget'),focusSecondary:f('FocusSecondaryOnly'),focusMeanStacks:fA?f('FocusStacks')/fA:null,focusNominalMana:f('FocusNominalMana')/n,focusRawBonusPerSecond:sec?f('FocusRawBonus')/sec:0,focusSlots:[1,2,3,4].map(i=>f('FocusPeakSlot'+i)),regenWastePct:v.regenPotential?100*v.regenWasted/v.regenPotential:0};
}
function write(p,x){fs.mkdirSync(path.dirname(p),{recursive:true});fs.writeFileSync(p,JSON.stringify(x,null,2)+'\n');}
function run(id,smoke=false){
 const p=profile(id),rows=[];for(const sc of E.SC)for(let i=0;i<(smoke?1:N);i++){const base=cell(id,p.arms[0],sc,i);rows.push(base);for(const arm of p.arms.slice(1)){const r=cell(id,arm,sc,i);verify(base,r);rows.push(r);}}
 if(!smoke)write('reports/stage648c2e2/'+id+'.json',{id,complete:true,source:S.sourceFingerprint().sha256,rows});
 console.log('STAGE648C2E2_SHARD='+JSON.stringify({id,smoke,fights:rows.length,arms:Object.fromEntries(p.arms.map(arm=>[arm,summary(rows.filter(r=>r.arm===arm))]))}));
}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/stage648c2e2/'+id+'.json','utf8')),p=profile(id);assert(x.complete&&x.id===id);assert.equal(x.rows.length,p.arms.length*E.SC.length*N);assert.equal(new Set(x.rows.map(r=>r.arm+'/'+r.scenario+'/'+r.trial)).size,x.rows.length);return x;});
 assert.equal(new Set(all.map(x=>x.source)).size,1);const report={stage:'6.48C.2E.2',source:all[0].source,fights:all.reduce((n,x)=>n+x.rows.length,0),profiles:{}};
 for(const x of all){const p=profile(x.id),base=new Map(x.rows.filter(r=>r.arm===p.arms[0]).map(r=>[r.scenario+'/'+r.trial,r]));report.profiles[x.id]={};for(const arm of p.arms){const rows=x.rows.filter(r=>r.arm===arm);for(const r of rows)verify(base.get(r.scenario+'/'+r.trial),r);report.profiles[x.id][arm]={overall:summary(rows),byScenario:Object.fromEntries(E.SC.map(sc=>[sc.id,summary(rows.filter(r=>r.scenario===sc.id))])),lossToWin:rows.filter(r=>r.won&&base.get(r.scenario+'/'+r.trial).died).length,winToLoss:rows.filter(r=>r.died&&base.get(r.scenario+'/'+r.trial).won).length};}}
 write('reports/v013-stage648c2e2-cycle-plagueheart.json',report);
 const keys=['n','wins','timeouts','dps','rotDps','appsPerMinute','meanStack','stacksPerMinute','meanPrimaryStacks','cap','cycle','cycleDps','cycleConsumed','cycleEligible','cycleDenied','cycleNominalMana','cycleMeanCooldown','cycleRawRotPerBurst','cycleRawAPSPPerBurst','cycleRawBurst','endPct','paidPerSecond','darkPaid','starvedSeconds','unfunded','focusEligible','focusRolls','focusActivations','focusCapped','focusDenied','focusReserveBlocked','focusHybridBlocked','focusPrimary','focusSecondary','focusMeanStacks','focusNominalMana','focusRawBonusPerSecond','focusSlots','regenWastePct'];
 for(const type of ['cycle','focus','hybrid']){const selected=Object.entries(report.profiles).filter(([k])=>k.startsWith(type+'-'));console.log('STAGE648C2E2_'+type.toUpperCase()+'='+JSON.stringify({fights:selected.reduce((n,[k,v])=>n+Object.values(v).reduce((a,r)=>a+r.overall.n,0),0),profiles:Object.fromEntries(selected.map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([arm,r])=>[arm,{...Object.fromEntries(keys.map(key=>[key,r.overall[key]])),lossToWin:r.lossToWin,winToLoss:r.winToLoss,scenarios:Object.fromEntries(Object.entries(r.byScenario).map(([sc,m])=>[sc,{wins:m.wins,endPct:m.endPct,paidPerSecond:m.paidPerSecond,focusActivations:m.focusActivations,focusCapped:m.focusCapped,focusDenied:m.focusDenied,cycle:m.cycle}]))}]))]))}));}
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke'){for(const id of IDS)run(id,true);}else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={cycleSource,focusSource,cycleCooldown,profile,cell,verify,CYCLE,FOCUS,IDS};
