'use strict';
// Research only: native combat with one payload removed at a time, retaining legal talent allocation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),Balance=require('./v013-balance-criteria.cjs');
const CUSTOM=[['blood-bow','bow',['blood_transfer','sanguine_fury','executioner']],['blood-mace','mace',['blood_drinker','heart_of_carnage','sanguine_reserve']],['blood-sword-reserve','sword',['sanguine_reserve','blood_drinker','blood_harvest']],['blood-daggers-crit','daggers',['sanguine_fury','executioner','bleeding_edge']],['blood-twohand-transfer','twohand',['blood_transfer','cleave_mastery','deep_cuts']]];
for(const [id,w,skills] of CUSTOM)G.P[id]={id,families:['blood'],w,skills,role:'audit'};
const IDS=['blood-daggers','blood-sword','blood-twohand',...CUSTOM.map(x=>x[0])];
const ABILITIES=['bleeding_edge','deep_cuts','executioner','blood_drinker','sanguine_fury','blood_transfer','blood_harvest','crimson_feast','heart_of_carnage','accelerated_bleeding','cleave_mastery','sanguine_reserve'];
const N=100,SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const OUT='reports/e10-blood-consolidation';
const B=fs.readFileSync('combat/v012-buildcraft.js','utf8'),R=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'missing/ambiguous source anchor '+a);return s.replace(a,b);}
function owned(p,id){return p.t.nodes.includes(id);}
function arms(p,mode){return ['native','core-only','affinity-bleed','minor-bleed-bonus',...ABILITIES.filter(id=>owned(p,id)),...(mode==='new'?['cooldown09']:[])];}


function mechanicsBuild(v){let s=B;
 if(v.cd!==undefined){s=rep(s,'bleeding_edge:{chance:.42+.04*t,bleed:.16,icd:.9}','bleeding_edge:{chance:.42+.04*t,bleed:.16,icd:'+v.cd+'}');s=rep(s,"ready(b,'bleedEdge',c.now,.9)","ready(b,'bleedEdge',c.now,"+v.cd+")");}
 if(v.uncapped)s=rep(s,'if(target.dots.bleed.length<12){','if(true){');
 if(v.crit){s=rep(s,"c.dot('bleed',base*.16);","c.dot('bleed',(c.bloodCritBase??base)*.16);");s=rep(s,"c.dot('bleed',base*.14);","c.dot('bleed',(c.bloodCritBase??base)*.14);");}
 return s;
}
function mechanicsRuntime(v){
 let s=R;
 const helpers="const bloodObserved=new WeakMap(),bloodEverCap=new WeakSet(),bloodEverApplied=new WeakSet();\nfunction bloodCount(r,e,key,n=1){if(!r||!Number.isFinite(n)||!n)return;const m=r.bloodStackAudit??={};m[key]=(m[key]||0)+n;const kind=e?.boss?'boss':e?.miniboss?'elite':'normal';const k=kind+'_'+key;m[k]=(m[k]||0)+n;}\nfunction bloodN(e){return (e.dots?.bleed||[]).filter(d=>d.remaining>0).length;}\nfunction bloodObserve(e){const r=ports.state.run;if(!r||e.hp<=0)return;const n=bloodN(e),before=bloodObserved.get(e)||0;bloodObserved.set(e,n);if(n>0&&!bloodEverApplied.has(e)){bloodEverApplied.add(e);bloodCount(r,e,'enemiesBled');}if(n>=12&&before<12){bloodCount(r,e,'capEntries');if(!bloodEverCap.has(e)){bloodEverCap.add(e);bloodCount(r,e,'uniqueCapEnemies');}}if(n>before)bloodCount(r,e,'positiveStackTransitions',n-before);const m=r.bloodStackAudit??={};m.peakStacks=Math.max(m.peakStacks||0,n);}\nfunction bloodExpire(r,e,before,after){if(before<=after)return;bloodCount(r,e,'expiredStacks',before-after);if(after===0){bloodCount(r,e,e.hp>0?'expiredToZeroAlive':'expiredToZeroLethal');}}\nfunction bloodSample(r,dt){for(const e of r.enemies||[r.enemy])if(e&&e.hp>0){const n=bloodN(e);bloodCount(r,e,'observedEnemySeconds',dt);bloodCount(r,e,'stackSeconds',n*dt);if(n>0)bloodCount(r,e,'bleedingEnemySeconds',dt);if(n>=12)bloodCount(r,e,'atCapSeconds',dt);bloodCount(r,e,'hist_'+Math.min(12,n),dt);}}\n";
 s=rep(s,"function synchronizeDots(enemy){",helpers+"function synchronizeDots(enemy){");
 s=rep(s," enemy[key+'Stacks']=active.length;\n }\n}"," enemy[key+'Stacks']=active.length;\n }\n bloodObserve(enemy);\n}");
 s=rep(s,"const dots=enemy.dots?.bleed||[];let raw=0;","const dots=enemy.dots?.bleed||[],before=bloodN(enemy);let raw=0;");
 s=rep(s,"enemy.hp-=damage;ports.phase6Metric(r,'damageDealt',actual);","enemy.hp-=damage;bloodExpire(r,enemy,before,bloodN(enemy));ports.phase6Metric(r,'damageDealt',actual);");
 s=rep(s,"const applied=Math.round(ports.tickDots(e)*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));","const before=bloodN(e),applied=Math.round(ports.tickDots(e)*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));");
 s=rep(s,"e.hp-=applied;ports.addLog('☠️ Damage over time: '","e.hp-=applied;bloodExpire(r,e,before,bloodN(e));ports.addLog('☠️ Damage over time: '");
 s=rep(s,"const rawDots=ports.tickDots(mob);","const before=bloodN(mob),rawDots=ports.tickDots(mob);");
 s=rep(s,"mob.hp-=damage;if(damage>0)ports.floatText(damage,'enemy',false,bleeding?","mob.hp-=damage;bloodExpire(r,mob,before,bloodN(mob));if(damage>0)ports.floatText(damage,'enemy',false,bleeding?");
 s=rep(s," advanceAcceleratedBleed(r,dt);"," bloodSample(r,dt);advanceAcceleratedBleed(r,dt);");

 if(v.refresh||v.seconds){
 const clock="const bloodKnown=new WeakSet(),bloodClocks=new WeakMap();\nfunction bloodPrepare(e){const r=ports.state.run;if(!r)return;const now=ports.setNow(r),dots=e.dots?.bleed||[],fresh=dots.filter(d=>!bloodKnown.has(d));if(!fresh.length)return;for(const d of fresh){bloodKnown.add(d);"+(v.seconds?"bloodClocks.set(d,{created:now,expires:now+"+v.seconds+",next:null});":"")+"}"+(v.refresh?(v.seconds?"for(const d of dots){const c=bloodClocks.get(d);if(c)c.expires=now+"+v.seconds+";}":"for(const d of dots)d.remaining=3;"):"")+"}\n";
 s=rep(s,'function bloodObserve(e){',clock+'function bloodObserve(e){');
 s=rep(s," if(!enemy.dots)return;\n for(const key of ['bleed','burn']){"," if(!enemy.dots)return;\n bloodPrepare(enemy);\n for(const key of ['bleed','burn']){");
 }
 if(v.ticks){
 s=rep(s,"remaining:3});enemy.dots[effect]=src;","remaining:effect==='bleed'?"+v.ticks+":3});enemy.dots[effect]=src;");
 s=rep(s,"remaining:3,...(controlled?","remaining:kind==='bleed'?"+v.ticks+":3,...(controlled?");
 s=rep(s,"damage*.12)),s),remaining:3});e.dots","damage*.12)),s),remaining:"+v.ticks+"});e.dots");
 }
 if(v.uncapped){
 s=rep(s,"if(dots.length>=12)dots.shift();","/* uncapped Bleed */");
 s=rep(s,"if(src.length>=12)src.shift();","if(effect!=='bleed'&&src.length>=12)src.shift();");
 s=rep(s,"if(values.length>=12)values.shift();","if(kind!=='bleed'&&values.length>=12)values.shift();");
 s=rep(s,"if(target.dots.bleed.length<12){","if(true){");
 }
 if(v.crit){
 s=rep(s," const added=ports.setOnAttack(r,base,critical,perfect)"," r.bloodCritBase=critical?damage:base;\n const added=ports.setOnAttack(r,base,critical,perfect)");
 s=rep(s,"ctx.base=base;ctx.critical=critical;ctx.magical=cast;","ctx.base=base;ctx.critical=critical;ctx.bloodCritBase=critical?r.bloodCritBase:base;ctx.magical=cast;");
 }
 if(v.seconds){
 const timed="function bloodTimedAdvance(r){const now=ports.setNow(r);for(const e of r.enemies||[r.enemy]){if(!e||e.hp<=0)continue;const dots=e.dots?.bleed||[];if(!dots.length)continue;const before=bloodN(e);let raw=0,secondaryRaw=0;for(const d of dots){let c=bloodClocks.get(d);if(!c){c={created:now,expires:now+"+v.seconds+",next:null};bloodClocks.set(d,c);bloodKnown.add(d);}const period=learned('accelerated_bleeding')&&acceleratedPrimary(d)?.75:1;if(c.next===null)c.next=c.created+period;while(c.next<=Math.min(now,c.expires)+1e-9){raw+=d.damage;if(d.spread||d.secondaryOrigin||d.transferred)secondaryRaw+=d.damage;bloodCount(r,e,'bleedTicks');c.next+=period;}d.remaining=Math.max(1,Math.floor((c.expires-now)/period+1e-9)+1);}e.dots.bleed=dots.filter(d=>bloodClocks.get(d).expires>now+1e-9);ports.synchronizeDots(e);if(!e.bleedStacks)e.carrionCharge=0;if(raw>0){const damage=Math.round(raw*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1)),actual=Math.min(Math.max(0,e.hp),damage);e.lastBleedTick=now;if(damage>=e.hp)e.v012DeathBleed=true;e.hp-=damage;ports.phase6Metric(r,'damageDealt',actual);ports.phase6Metric(r,'periodicDamage',actual);bloodCount(r,e,'bleedDamage',actual);if(e!==r.enemy&&secondaryRaw>0){const secondary=Math.min(actual,Math.round(actual*secondaryRaw/raw));ports.phase6Metric(r,'secondaryTargetDamage',secondary);ports.phase6Metric(r,'secondaryDotDamage',secondary);ports.phase6Metric(r,'secondaryTargetHits',Number(secondary>0));}if(damage>0)ports.floatText(damage,'enemy',false,'BLEED',e);}bloodExpire(r,e,before,bloodN(e));}}\n";
 s=rep(s,'function advanceAcceleratedBleed(r,dt){',timed+'function advanceAcceleratedBleed(r,dt){');
 s=rep(s,"bloodSample(r,dt);advanceAcceleratedBleed(r,dt);","bloodSample(r,dt);bloodTimedAdvance(r);");
 s=rep(s,"function ordinaryBleed(enemy){return (enemy.dots?.bleed||[]).some(d=>d.remaining>0&&(!learned('accelerated_bleeding')||!acceleratedPrimary(d)));}","function ordinaryBleed(enemy){return false;}");
 s=rep(s,"if(key==='bleed'&&learned('accelerated_bleeding')&&acceleratedPrimary(d))continue;","if(key==='bleed')continue;");
 s=rep(s,"tickDots,advanceAcceleratedBleed,","tickDots,advanceAcceleratedBleed,bloodTimedAdvance,");
 }
 return s;
}
function instrumentBuild(s,arm,v){
 const off=id=>arm===id||(arm==='core-only'&&ABILITIES.includes(id));
 const edge=v.crit?'(c.bloodCritBase??base)*.16':'base*.16',fury=v.crit?'(c.bloodCritBase??base)*.14':'base*.14';
 const helpers="function bloodAuditBleed(c,id,amount){c.dot('bleed',amount);const d=c.enemy.dots?.bleed?.at(-1);c.metric?.('bloodAudit_'+id+'_Applications',1);if(d){c.metric?.('bloodAudit_'+id+'_ScheduledDamage',d.damage*d.remaining);c.metric?.('bloodAudit_'+id+'_TickPotency',d.damage);}return true;}\nfunction bloodAuditDamage(c,id,amount,label){const hp=c.enemy.hp;const out=c.damage(amount,label);c.metric?.('bloodAudit_'+id+'_Activations',1);c.metric?.('bloodAudit_'+id+'_Damage',Math.max(0,hp-Math.max(0,c.enemy.hp)));return out;}\nfunction bloodAuditHeal(b,c,id,amount){const actual=heal(b,c,amount);c.metric?.('bloodAudit_'+id+'_Activations',1);c.metric?.('bloodAudit_'+id+'_RequestedHealing',amount);c.metric?.('bloodAudit_'+id+'_Healing',actual);return actual;}\n";
 s=rep(s,'function onSecondaryWeaponStatus(b,c,q=.5,p=.5){',helpers+'function onSecondaryWeaponStatus(b,c,q=.5,p=.5){');
 s=rep(s,"   c.dot('bleed',base*v.bleed*p);e.secondaryBleedReady=c.now+v.icd;\n   const d=e.dots?.bleed?.at(-1);if(d)d.secondaryOrigin='weapon';\n   c.metric?.('secondaryBleedApplied',1);","   const applied=bloodAuditBleed(c,'secondary_edge',base*v.bleed*p);e.secondaryBleedReady=c.now+v.icd;\n   if(applied){const d=e.dots?.bleed?.at(-1);if(d)d.secondaryOrigin='weapon';c.metric?.('secondaryBleedApplied',1);}");
 s=rep(s,"c.dot('bleed',"+edge+");","bloodAuditBleed(c,'primary_edge',"+edge+");");
 s=rep(s,"c.dot('bleed',"+fury+");c.damage(base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');","bloodAuditBleed(c,'sanguine_fury',"+fury+");bloodAuditDamage(c,'sanguine_fury',base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');");
 for(const [id,expr,label] of [['executioner','Math.min(base*.32,e.maxhp*.025)','🩸 Execute'],['crimson_feast','base*.45','🫀 Crimson Feast'],['heart_of_carnage','base*(e.hp<e.maxhp*.5?.60:.40)','🩸 Heart of Carnage'],['sanguine_reserve','amount','🩸 Sanguine Reserve']]){
  s=rep(s,"c.damage("+expr+",'"+label+"')","bloodAuditDamage(c,'"+id+"',"+expr+",'"+label+"')");
 }
 s=rep(s,"heal(b,c,Math.min(c.player.maxhp*values('blood_drinker',rank(b,'blood_drinker')).hp,base*values('blood_drinker',rank(b,'blood_drinker')).base))","bloodAuditHeal(b,c,'blood_drinker',Math.min(c.player.maxhp*values('blood_drinker',rank(b,'blood_drinker')).hp,base*values('blood_drinker',rank(b,'blood_drinker')).base))");
 s=rep(s,"if(specialized(b,'blood_harvest')&&(c.enemy.bleedStacks>0||c.enemy.v012DeathBleed))heal(b,c,c.player.maxhp*.03);","if(specialized(b,'blood_harvest')&&(c.enemy.bleedStacks>0||c.enemy.v012DeathBleed))bloodAuditHeal(b,c,'blood_harvest',c.player.maxhp*.03);");
 s=rep(s,"target.bleedStacks=target.dots.bleed.length;","target.bleedStacks=target.dots.bleed.length;c.metric?.('bloodAudit_blood_transfer_Applications',1);c.metric?.('bloodAudit_blood_transfer_ScheduledDamage',tick*Math.min(3,dot.remaining));");
 s=rep(s,"if((c.secondaryHit?.(target,Math.round(tick*3))||0)>0)c.trigger?.('blood_transfer_burst');","{const actual=c.secondaryHit?.(target,Math.round(tick*3))||0;if(actual>0){c.metric?.('bloodAudit_blood_transfer_Damage',actual);c.trigger?.('blood_transfer_burst');}}");
 s=rep(s,"if(e.bleedStacks>0&&specialized(b,'crimson_feast'))","if(specialized(b,'crimson_feast'))c.metric?.('bloodAudit_crimson_feast_Checks',1);\n if(e.bleedStacks>0&&specialized(b,'crimson_feast'))");
 s=rep(s,"if(e.bleedStacks>0&&c.player.hp<c.player.maxhp*.5&&specialized(b,'heart_of_carnage')","if(specialized(b,'heart_of_carnage')){c.metric?.('bloodAudit_heart_of_carnage_Checks',1);if(e.bleedStacks>0&&c.player.hp<c.player.maxhp*.5)c.metric?.('bloodAudit_heart_of_carnage_Eligible',1);}\n if(e.bleedStacks>0&&c.player.hp<c.player.maxhp*.5&&specialized(b,'heart_of_carnage')");
 s=rep(s,"if(rank(b,'executioner')&&e.bleedStacks>0","if(rank(b,'executioner')){c.metric?.('bloodAudit_executioner_Checks',1);if(e.bleedStacks>0&&e.hp<=e.maxhp*.30)c.metric?.('bloodAudit_executioner_Eligible',1);}\n if(rank(b,'executioner')&&e.bleedStacks>0");
 s=rep(s,"const r=sanguineReserve(b,c);r.sanguineReserve=Math.min(r.maxhp*.05,(r.sanguineReserve||0)+healed*.25);","const r=sanguineReserve(b,c);const before=r.sanguineReserve||0;r.sanguineReserve=Math.min(r.maxhp*.05,before+healed*.25);c.metric?.('bloodAudit_sanguine_reserve_Charge',r.sanguineReserve-before);");
 // Payload ablations preserve ownership and stat nodes. Bleeding Edge means invested
 // ranks only: innate chance stays 42%. The affinity arm separately disables edge applications.
 if(arm==='affinity-bleed')s=rep(s,"function bloodAuditBleed(c,id,amount){c.dot","function bloodAuditBleed(c,id,amount){if(id==='primary_edge'||id==='secondary_edge')return false;c.dot");
 if(off('bleeding_edge'))s=rep(s,'bleeding_edge:{chance:.42+.04*t,','bleeding_edge:{chance:.42,');
 if(off('deep_cuts'))s=rep(s,"1+.15*rank(b,'deep_cuts')+(b?.runtime?.talentBonuses?.bleedBonus||0)","1+(b?.runtime?.talentBonuses?.bleedBonus||0)");
 if(arm==='minor-bleed-bonus')s=rep(s,"1+.15*rank(b,'deep_cuts')+(b?.runtime?.talentBonuses?.bleedBonus||0)","1+.15*rank(b,'deep_cuts')");
 if(off('sanguine_fury')){s=rep(s,"bloodAuditBleed(c,'sanguine_fury',"+fury+");bloodAuditDamage(c,'sanguine_fury',base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');","/* diagnostic: no Sanguine Fury payload */");}
 {const blocked=['executioner','crimson_feast','heart_of_carnage','sanguine_reserve'].filter(off);if(blocked.length)s=rep(s,'function bloodAuditDamage(c,id,amount,label){const hp=',"function bloodAuditDamage(c,id,amount,label){if("+JSON.stringify(blocked)+".includes(id))return 0;const hp=");}
 {const blocked=['blood_drinker','blood_harvest'].filter(off);if(blocked.length)s=rep(s,'function bloodAuditHeal(b,c,id,amount){const actual=',"function bloodAuditHeal(b,c,id,amount){if("+JSON.stringify(blocked)+".includes(id))return 0;const actual=");}
 if(off('blood_transfer'))s=rep(s,"if(specialized(b,'blood_transfer')||c.traits?.includes('blood_transfer'))","if(c.traits?.includes('blood_transfer'))");
 return s;
}

const CONFIG={old:{},new:{seconds:4,refresh:true,uncapped:true,crit:true,cd:.6}};
const SOURCES=new Map();
function sources(mode,arm){
 const key=mode+'/'+arm;if(SOURCES.has(key))return SOURCES.get(key);
 const v=arm==='cooldown09'?{...CONFIG[mode],cd:.9}:CONFIG[mode];assert(v,mode);
 let b=instrumentBuild(mechanicsBuild(v),arm,v),r=mechanicsRuntime(v);
 const off=id=>arm===id||(arm==='core-only'&&ABILITIES.includes(id));
 if(off('accelerated_bleeding'))r=r.replaceAll("learned('accelerated_bleeding')","false");
 if(off('cleave_mastery'))r=rep(r,"ports.state.automaticTalents?.nodes?.includes('cleave_mastery')?.6:.4",".4");
 r=rep(r,"const actual=v013SecondaryHit(r,enemy,amount);\n  if(physical)v013SecondaryWeaponStatus(r,enemy,amount,actual);","const actual=v013SecondaryHit(r,enemy,amount);\n  if(label.includes('Cleave')){ports.phase6Metric(r,'bloodAudit_cleave_Hits',1);ports.phase6Metric(r,'bloodAudit_cleave_Damage',actual||0);}\n  if(physical)v013SecondaryWeaponStatus(r,enemy,amount,actual);");
 new Function(b);new Function(r);SOURCES.set(key,[b,r]);return [b,r];
}
function cell(p,sc,i,mode,arm){
 const kind=sc.startsWith('normal')?'normal':sc,size=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[]};
 
 const pair=arm?sources(mode,arm):null;
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(elite?{stage619EliteType:elite}:{}),...(arm?{stage648c1BuildcraftSource:pair[0],stageArmorRuntimeSource:pair[1]}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(size)assert.equal(x.requestedGroupSize,size);
 return {sc,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,healed:x.affinityMetrics?.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,stats:x.heroBaseStats,metrics:x.bloodStackAudit||{},abilityMetrics:x.bloodAuditMetrics||{},dotDamage:x.affinityMetrics?.dotDamageActual||0,passives:x.affinityMetrics?.passiveActivations||{},attacks:x.affinityMetrics?.attackCalls||0};
}

const EXPECTED={'blood-daggers':[291,41,27],'blood-sword':[360,65,47],'blood-twohand':[203,9,19],'blood-bow':[180,17,17],'blood-mace':[317,64,50],'blood-sword-reserve':[347,61,45],'blood-daggers-crit':[305,56,39],'blood-twohand-transfer':[272,16,28]};
function compare(a,b){for(const k of Object.keys(a))if(!['metrics','abilityMetrics'].includes(k))assert.deepEqual(a[k],b[k],'observer drift '+k);}
function summarize(rows){
 const sums={};for(const r of rows)for(const [k,v] of Object.entries(r.metrics)){assert(Number.isFinite(v)&&v>=0,k);if(k==='peakStacks')sums[k]=Math.max(sums[k]||0,v);else sums[k]=(sums[k]||0)+v;}
 const sum=k=>sums[k]||0, n=rows.length;const metrics={...sums,capEntries:sum('capEntries'),uniqueCapEnemies:sum('uniqueCapEnemies'),expiredToZeroAlive:sum('expiredToZeroAlive'),expiredToZeroLethal:sum('expiredToZeroLethal'),expiredStacks:sum('expiredStacks'),enemiesBled:sum('enemiesBled'),fightsAtCap:rows.filter(r=>r.metrics.capEntries>0).length,fightsWithExpiry:rows.filter(r=>r.metrics.expiredToZeroAlive>0).length,meanStacks:sum('stackSeconds')/Math.max(1e-12,sum('observedEnemySeconds')),meanWhileBleeding:sum('stackSeconds')/Math.max(1e-12,sum('bleedingEnemySeconds')),uptimePct:100*sum('bleedingEnemySeconds')/Math.max(1e-12,sum('observedEnemySeconds')),histogram:Array.from({length:13},(_,i)=>sum('hist_'+i))};
 assert(metrics.uniqueCapEnemies<=metrics.enemiesBled);assert(metrics.uniqueCapEnemies<=metrics.capEntries);assert(metrics.expiredToZeroAlive+metrics.expiredToZeroLethal<=metrics.expiredStacks);
 assert(Math.abs(metrics.histogram.reduce((a,b)=>a+b,0)-sum('observedEnemySeconds'))<1e-5*Math.max(1,sum('observedEnemySeconds')));
 const wins=rows.filter(r=>r.won).length,sec=rows.reduce((a,r)=>a+r.seconds,0),sumRow=k=>rows.reduce((a,r)=>a+(Number(r[k])||0),0);const abilityMetrics={},abilityFights={};for(const r of rows)for(const [k,v] of Object.entries(r.abilityMetrics)){if(Number.isFinite(v)){abilityMetrics[k]=(abilityMetrics[k]||0)+v;if(v>0)abilityFights[k]=(abilityFights[k]||0)+1;}}const passiveActivations={};for(const r of rows)for(const [k,v] of Object.entries(r.passives))passiveActivations[k]=(passiveActivations[k]||0)+v;return {n,wins,winPct:100*wins/n,abilityMetrics,abilityFights,passiveActivations,dotDps:sumRow('dotDamage')/sec,dps:sumRow('damage')/sec,hps:sumRow('healed')/sec,secondaryDps:sumRow('secondary')/sec,takenPerSecond:sumRow('taken')/sec,timeouts:sumRow('timeout'),meanSeconds:sec/n,metrics};
}

function paired(a,b){for(const k of ['sc','seed','resolved','realm','gear','roster','roles','trait','condition','bossMods','elite','boss','stats'])assert.deepEqual(a[k],b[k],'pair drift '+k);}
function group(rows){return Object.fromEntries(['all','normal',...SC].map(sc=>{const r=summarize(rows.filter(r=>sc==='all'||(sc==='normal'?r.sc.startsWith('normal'):r.sc===sc)));return [sc,{...r,balance:Balance.classify(sc,r.winPct,r.n)}];}));}

function run(id,mode,n=N){
 const p=G.profile(id),aa=arms(p,mode),variants={};
 for(const arm of aa){
  const rows=[];for(const sc of SC)for(let i=0;i<n;i++){
   const a=cell(p,sc,i,mode,arm);if(arm==='native'&&mode==='old'&&i===0)compare(a,cell(p,sc,i,mode,null));rows.push(a);
  }
  if(arm!=='native')for(let i=0;i<rows.length;i++)paired(variants.native.rows[i],rows[i]);
  const grouped=group(rows);if(mode==='old')assert(grouped.all.metrics.peakStacks<=12);
  if(mode==='old'&&arm==='native'&&n===N)assert.deepEqual(['normal','elite','boss'].map(k=>grouped[k].wins),EXPECTED[id],'old baseline drift');
  variants[arm]={rows,grouped};
  console.log('BLOOD_CONSOLIDATION_ARM='+JSON.stringify({id,mode,arm,n:rows.length,winPct:grouped.all.winPct}));
 }
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,id+'-'+mode+'.json'),JSON.stringify({id,mode,n,source:S.sourceFingerprint().sha256,nodes:p.t.nodes,variants}));
}
function unit(){
 const env={WandererV012Buildcraft:{migrateEnemyDots(){}}};
 new Function('globalThis','WandererV012Buildcraft',sources('new','native')[1])(env,env.WandererV012Buildcraft);
 const e={hp:10000,maxhp:10000,dots:{bleed:[],burn:[]}},r={hp:1000,enemy:e,enemies:[e],combatSeconds:0};
 const ports={state:{run:r,automaticTalents:{nodes:[]}},setNow:r=>r.combatSeconds,phase6Metric(){},floatText(){},synchronizeDots(e){runtime.synchronizeDots(e);}};
 const runtime=env.WandererV012CombatRuntime.create(ports),advance=t=>{r.combatSeconds=t;runtime.bloodTimedAdvance(r);};
 e.dots.bleed.push({damage:10,remaining:3});runtime.synchronizeDots(e);advance(1);assert.equal(e.hp,9990);
 advance(1.5);e.dots.bleed.push({damage:20,remaining:3});runtime.synchronizeDots(e);advance(2);assert.equal(e.hp,9980);advance(2.5);assert.equal(e.hp,9960);
 advance(4);assert.equal(e.dots.bleed.length,2);advance(5.5);assert.equal(e.dots.bleed.length,0);
}
function smoke(){
 unit();const covered=new Set();
 for(const id of IDS){const p=G.profile(id);for(const mode of Object.keys(CONFIG)){
  for(const arm of arms(p,mode)){sources(mode,arm);covered.add(arm);}
  for(const sc of ['normal-1','normal-4','elite','boss']){
   const b=cell(p,sc,0,mode,'native');if(mode==='old')compare(b,cell(p,sc,0,mode,null));
   for(const arm of arms(p,mode).slice(1))paired(b,cell(p,sc,0,mode,arm));
  }
 }}
 for(const id of ABILITIES)assert(covered.has(id),id);console.log('BLOOD_CONSOLIDATION_SMOKE_OK');
}
function aggregate(){
 let n=0;const profiles=[],fingerprints=new Set();
 for(const id of IDS){
 const p=G.profile(id),data={};
 for(const mode of Object.keys(CONFIG)){
  const x=JSON.parse(fs.readFileSync(path.join(OUT,id+'-'+mode+'.json')));assert.equal(x.n,N);assert.equal(x.id,id);assert.equal(x.mode,mode);assert.deepEqual(x.nodes,p.t.nodes);assert.deepEqual(Object.keys(x.variants),arms(p,mode));fingerprints.add(x.source);
  data[mode]=x.variants;
 }
 const baseline=data.old.native.rows;assert.equal(baseline.length,N*SC.length);assert.equal(new Set(baseline.map(r=>r.sc+'/'+r.seed)).size,baseline.length);
 const result={};
 for(const [mode,variants] of Object.entries(data)){
  result[mode]={};for(const [arm,x] of Object.entries(variants)){
   assert.equal(x.rows.length,baseline.length);for(let i=0;i<baseline.length;i++)paired(baseline[i],x.rows[i]);n+=x.rows.length;
   result[mode][arm]=x.grouped;
  }
 }
 const impact={};
 for(const k of ['all','normal',...SC]){
  const old=result.old.native[k],next=result.new.native[k],oc=result.old['core-only'][k],nc=result.new['core-only'][k];
  impact[k]={totalGain:next.winPct-old.winPct,coreGain:nc.winPct-oc.winPct,skillSynergyGain:(next.winPct-nc.winPct)-(old.winPct-oc.winPct),oldSkillGain:old.winPct-oc.winPct,newSkillGain:next.winPct-nc.winPct,cooldownGain:next.winPct-result.new.cooldown09[k].winPct};
  assert(Math.abs(impact[k].totalGain-impact[k].coreGain-impact[k].skillSynergyGain)<1e-8);
 }
 const compact={};
 for(const mode of Object.keys(CONFIG))compact[mode]=Object.fromEntries(Object.entries(result[mode]).map(([a,g])=>[a,Object.fromEntries(['all','normal','elite','boss'].map(k=>{const s=g[k];return [k,{win:s.winPct,dps:s.dps,hps:s.hps,dotDps:s.dotDps,secondaryDps:s.secondaryDps,peak:s.metrics.peakStacks,zero:s.metrics.expiredToZeroAlive,uptime:s.metrics.uptimePct,mean:s.metrics.meanWhileBleeding,timeout:s.timeouts}];}))]));
 const skillTelemetry=Object.fromEntries(Object.keys(CONFIG).map(mode=>[mode,Object.fromEntries(['all','normal','elite','boss'].map(k=>{const s=result[mode].native[k];return [k,{metrics:s.abilityMetrics,fights:s.abilityFights,passives:s.passiveActivations}];}))]));
 profiles.push({id,result,impact});
 console.log('BLOOD_CONSOLIDATION_PROFILE='+JSON.stringify({id,variants:compact,impact,skillTelemetry}));
 }
 assert.equal(fingerprints.size,1);
 const planned=IDS.reduce((n,id)=>n+Object.keys(CONFIG).reduce((s,m)=>s+arms(G.profile(id),m).length,0)*N*SC.length,0);assert.equal(n,planned);
 fs.writeFileSync(path.join(OUT,'summary.json'),JSON.stringify({n,config:CONFIG,criteria:Balance.TARGETS,profiles}));console.log('BLOOD_CONSOLIDATION_OVERVIEW='+JSON.stringify({n,config:CONFIG,criteria:Balance.TARGETS,profiles:profiles.length}));
}
const [cmd,id,mode]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id,mode);else if(cmd==='aggregate')aggregate();else throw Error('unknown command');
