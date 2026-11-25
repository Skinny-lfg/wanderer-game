'use strict';
// Research only: native combat with one payload removed at a time, retaining legal talent allocation.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),Balance=require('./v013-balance-criteria.cjs');
const CUSTOM=[['blood-bow','bow',['blood_transfer','sanguine_fury','executioner']],['blood-mace','mace',['blood_drinker','heart_of_carnage','sanguine_reserve']],['blood-sword-reserve','sword',['sanguine_reserve','blood_drinker','blood_harvest']],['blood-daggers-crit','daggers',['sanguine_fury','executioner','bleeding_edge']],['blood-twohand-transfer','twohand',['blood_transfer','cleave_mastery','deep_cuts']]];
for(const [id,w,skills] of CUSTOM)G.P[id]={id,families:['blood'],w,skills,role:'audit'};
const IDS=['blood-daggers','blood-sword','blood-twohand',...CUSTOM.map(x=>x[0])];
const ABILITIES=['bleeding_edge','deep_cuts','executioner','blood_drinker','sanguine_fury','blood_transfer','blood_harvest','crimson_feast','heart_of_carnage','accelerated_bleeding','cleave_mastery','sanguine_reserve'];
const N=100,SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],F=['blood','decay','vitality','aegis','fury','magic'],ELITES=G.SC.filter(x=>x.kind==='elite').map(x=>x.elite);
const OUT=process.env.BLOOD_OUT||'reports/e10-blood-individual';
const B=fs.readFileSync('combat/v012-buildcraft.js','utf8'),R=fs.readFileSync('combat/v012-combat-runtime.js','utf8');
function rep(s,a,b){assert.equal(s.split(a).length,2,'missing/ambiguous source anchor '+a);return s.replace(a,b);}
function owned(p,id){return p.t.nodes.includes(id);}
function arms(p){return ['native','affinity-bleed','minor-bleed-bonus',...ABILITIES.filter(id=>owned(p,id))];}
function buildSource(arm){
 let s=B;
 const helpers="function bloodAuditBleed(c,id,amount){c.dot('bleed',amount);const d=c.enemy.dots?.bleed?.at(-1);c.metric?.('bloodAudit_'+id+'_Applications',1);if(d){c.metric?.('bloodAudit_'+id+'_ScheduledDamage',d.damage*d.remaining);c.metric?.('bloodAudit_'+id+'_TickPotency',d.damage);}return true;}\nfunction bloodAuditDamage(c,id,amount,label){const hp=c.enemy.hp;const out=c.damage(amount,label);c.metric?.('bloodAudit_'+id+'_Activations',1);c.metric?.('bloodAudit_'+id+'_Damage',Math.max(0,hp-Math.max(0,c.enemy.hp)));return out;}\nfunction bloodAuditHeal(b,c,id,amount){const actual=heal(b,c,amount);c.metric?.('bloodAudit_'+id+'_Activations',1);c.metric?.('bloodAudit_'+id+'_RequestedHealing',amount);c.metric?.('bloodAudit_'+id+'_Healing',actual);return actual;}\n";
 s=rep(s,'function onSecondaryWeaponStatus(b,c,q=.5,p=.5){',helpers+'function onSecondaryWeaponStatus(b,c,q=.5,p=.5){');
 s=rep(s,"   c.dot('bleed',base*v.bleed*p);e.secondaryBleedReady=c.now+v.icd;\n   const d=e.dots?.bleed?.at(-1);if(d)d.secondaryOrigin='weapon';\n   c.metric?.('secondaryBleedApplied',1);","   const applied=bloodAuditBleed(c,'secondary_edge',base*v.bleed*p);e.secondaryBleedReady=c.now+v.icd;\n   if(applied){const d=e.dots?.bleed?.at(-1);if(d)d.secondaryOrigin='weapon';c.metric?.('secondaryBleedApplied',1);}");
 s=rep(s,"c.dot('bleed',base*.16);","bloodAuditBleed(c,'primary_edge',base*.16);");
 s=rep(s,"c.dot('bleed',base*.14);c.damage(base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');","bloodAuditBleed(c,'sanguine_fury',base*.14);bloodAuditDamage(c,'sanguine_fury',base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');");
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
 if(arm==='bleeding_edge')s=rep(s,'bleeding_edge:{chance:.42+.04*t,','bleeding_edge:{chance:.42,');
 if(arm==='deep_cuts')s=rep(s,"1+.15*rank(b,'deep_cuts')+(b?.runtime?.talentBonuses?.bleedBonus||0)","1+(b?.runtime?.talentBonuses?.bleedBonus||0)");
 if(arm==='minor-bleed-bonus')s=rep(s,"1+.15*rank(b,'deep_cuts')+(b?.runtime?.talentBonuses?.bleedBonus||0)","1+.15*rank(b,'deep_cuts')");
 if(arm==='sanguine_fury'){s=rep(s,"bloodAuditBleed(c,'sanguine_fury',base*.14);bloodAuditDamage(c,'sanguine_fury',base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');","/* diagnostic: no Sanguine Fury payload */");}
 if(['executioner','crimson_feast','heart_of_carnage','sanguine_reserve'].includes(arm))s=rep(s,'function bloodAuditDamage(c,id,amount,label){const hp=',"function bloodAuditDamage(c,id,amount,label){if(id==="+JSON.stringify(arm)+")return 0;const hp=");
 if(['blood_drinker','blood_harvest'].includes(arm))s=rep(s,'function bloodAuditHeal(b,c,id,amount){const actual=',"function bloodAuditHeal(b,c,id,amount){if(id==="+JSON.stringify(arm)+")return 0;const actual=");
 if(arm==='blood_transfer')s=rep(s,"if(specialized(b,'blood_transfer')||c.traits?.includes('blood_transfer'))","if(c.traits?.includes('blood_transfer'))");
 return s;
}
function runtimeSource(arm){
 let s=R;
 // Attribute actual ordinary periodic damage to Bleed proportionally if Burn also exists.
 const helper="function bloodAuditOrdinaryRaw(e){return (e.dots?.bleed||[]).filter(d=>d.remaining>0&&(!learned('accelerated_bleeding')||!acceleratedPrimary(d))).reduce((a,d)=>a+d.damage,0);}\nfunction bloodAuditOrdinary(r,enemy,raw,bleed,actual){if(raw>0&&bleed>0)ports.phase6Metric(r,'bloodAudit_ordinary_BleedDamage',Math.min(actual,actual*bleed/raw));}\n";
 s=rep(s,'function tickDots(enemy){',helper+'function tickDots(enemy){');
 s=rep(s,"const applied=Math.round(ports.tickDots(e)*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));","const bleedRaw=bloodAuditOrdinaryRaw(e),raw=ports.tickDots(e);const applied=Math.round(raw*(root.WandererV013ExpeditionBoons?.dotFactor(r)||1));bloodAuditOrdinary(r,e,raw,bleedRaw,Math.min(Math.max(0,e.hp),applied));");
 s=rep(s,"const rawDots=ports.tickDots(mob);","const bleedRaw=bloodAuditOrdinaryRaw(mob),rawDots=ports.tickDots(mob);");
 s=rep(s,"const applied=Math.min(Math.max(0,mob.hp),damage);ports.phase6Metric(r,'damageDealt',applied);ports.phase6Metric(r,'periodicDamage',applied);","const applied=Math.min(Math.max(0,mob.hp),damage);bloodAuditOrdinary(r,mob,rawDots,bleedRaw,applied);ports.phase6Metric(r,'damageDealt',applied);ports.phase6Metric(r,'periodicDamage',applied);");
 s=rep(s,"ports.phase6Metric(r,'acceleratedBleedDamage',actual);","ports.phase6Metric(r,'acceleratedBleedDamage',actual);ports.phase6Metric(r,'bloodAudit_accelerated_BleedDamage',actual);");
 s=rep(s,"const actual=v013SecondaryHit(r,enemy,amount);\n  if(physical)v013SecondaryWeaponStatus(r,enemy,amount,actual);","const actual=v013SecondaryHit(r,enemy,amount);\n  if(label.includes('Cleave')){ports.phase6Metric(r,'bloodAudit_cleave_Hits',1);ports.phase6Metric(r,'bloodAudit_cleave_Damage',actual||0);}\n  if(physical)v013SecondaryWeaponStatus(r,enemy,amount,actual);");
 if(arm==='accelerated_bleeding')s=s.replaceAll("learned('accelerated_bleeding')","false");
 if(arm==='cleave_mastery')s=rep(s,"ports.state.automaticTalents?.nodes?.includes('cleave_mastery')?.6:.4",".4");
 return s;
}
const SOURCES=new Map();
function sources(arm){if(!SOURCES.has(arm))SOURCES.set(arm,[buildSource(arm),runtimeSource(arm)]);return SOURCES.get(arm);}
function cell(p,sc,i,arm){
 const kind=sc.startsWith('normal')?'normal':sc,size=kind==='normal'?Number(sc.split('-')[1]):undefined;
 const family=F[i%F.length],elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,seed=65901001+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[]};
 const [b,r]=sources(arm||'native');
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(elite?{stage619EliteType:elite}:{}),...(arm?{stage648c1BuildcraftSource:b,stageArmorRuntimeSource:r}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,size);
 assert.equal(x.level,10);assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.armorType,p.armorType);assert.equal(x.offhandType,p.offhandType);assert(x.won||x.died||x.timedOut);
 if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);if(size)assert.equal(x.requestedGroupSize,size);
 return {sc,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,taken:x.damageTaken,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,healed:x.affinityMetrics?.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,stats:x.heroBaseStats,metrics:x.bloodAuditMetrics||{},passives:x.affinityMetrics?.passiveActivations||{},attacks:x.affinityMetrics?.attackCalls||0};
}
function paired(b,a){for(const k of ['sc','seed','resolved','realm','gear','roster','roles','trait','condition','bossMods','elite','boss','stats'])assert.deepEqual(a[k],b[k],'pair drift '+k);}
function trial(p,sc,i,smoke=false){
 const rows={};for(const arm of arms(p)){rows[arm]=cell(p,sc,i,arm);if(arm!=='native')paired(rows.native,rows[arm]);}
 if(smoke){const plain=cell(p,sc,i,null);for(const k of ['won','died','timeout','seconds','damage','taken','secondary','secondaryDot','healed','hpEnd','stats','passives','attacks'])assert.deepEqual(rows.native[k],plain[k],'observer drift '+p.id+'/'+sc+'/'+k);}
 return {sc,i,rows};
}
function summarize(cases,aa,kind){
 return Object.fromEntries(aa.map(arm=>{
 const rs=cases.map(c=>c.rows[arm]),n=rs.length,sum=k=>rs.reduce((a,r)=>a+(Number(r[k])||0),0),sec=sum('seconds'),wins=sum('won'),metrics={},passives={};
 for(const r of rs){for(const [k,v] of Object.entries(r.metrics))if(Number.isFinite(v))metrics[k]=(metrics[k]||0)+v;for(const [k,v] of Object.entries(r.passives))passives[k]=(passives[k]||0)+v;}
 const activeFights=Object.fromEntries([...new Set(rs.flatMap(r=>Object.keys(r.metrics)))].map(k=>[k,rs.filter(r=>(r.metrics[k]||0)>0).length]));
 return [arm,{n,wins,winPct:100*wins/n,balance:Balance.classify(kind,100*wins/n,n),dps:sum('damage')/sec,secondaryDps:sum('secondary')/sec,secondaryDotDps:sum('secondaryDot')/sec,hps:sum('healed')/sec,takenPerSecond:sum('taken')/sec,meanSeconds:sec/n,meanHPPercent:rs.reduce((a,r)=>a+100*r.hpEnd/r.hpMax,0)/n,timeouts:sum('timeout'),attacks:sum('attacks'),metrics,passives,activeFights,pairedGains:cases.filter(c=>!c.rows.native.won&&c.rows[arm].won).length,pairedLosses:cases.filter(c=>c.rows.native.won&&!c.rows[arm].won).length}];
 }));
}
function write(name,x){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(x)+'\n');}
function run(id,n=N){
 const p=G.profile(id),aa=arms(p),cases=[];
 for(const sc of SC)for(let i=0;i<n;i++)cases.push(trial(p,sc,i,i===0));
 const grouped=Object.fromEntries(['all','normal',...SC].map(sc=>[sc,summarize(cases.filter(c=>sc==='all'||(sc==='normal'?c.sc.startsWith('normal'):c.sc===sc)),aa,sc)]));
 const out={id,source:S.sourceFingerprint().sha256,armor:p.armorType,weapon:p.weapon,nodes:p.t.nodes,arms:aa,n,cases,grouped};write(id+'.json',out);
 console.log('BLOOD_AUDIT_SHARD='+JSON.stringify({id,arms:aa,n:cases.length*aa.length,global:Object.fromEntries(aa.map(a=>[a,grouped.all[a].winPct]))}));
}
function smoke(){
 const covered=new Set();
 for(const id of IDS){const p=G.profile(id);assert.equal(p.t.nodes.length,30);for(const arm of arms(p)){covered.add(arm);for(const src of sources(arm))new Function(src);}for(const sc of ['normal-1','normal-4','elite','boss'])trial(p,sc,0,true);}
 for(const id of ABILITIES)assert(covered.has(id),'uncovered '+id);
 console.log('BLOOD_AUDIT_SMOKE_OK');
}
function aggregate(){
 const profiles=[];let n=0;const sources=new Set();
 for(const id of IDS){const x=JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'),'utf8')),p=G.profile(id);assert.equal(x.n,N);assert.deepEqual(x.nodes,p.t.nodes);assert.deepEqual(x.arms,arms(p));assert.equal(x.cases.length,SC.length*N);assert.equal(new Set(x.cases.map(c=>c.sc+'/'+c.i)).size,SC.length*N);for(const c of x.cases)for(const arm of x.arms)paired(c.rows.native,c.rows[arm]);n+=x.cases.length*x.arms.length;sources.add(x.source);profiles.push({...x,cases:undefined});console.log('BLOOD_AUDIT_PROFILE='+JSON.stringify(profiles.at(-1)));}
 assert.equal(sources.size,1);write('summary.json',{n,profiles});console.log('BLOOD_AUDIT_OVERVIEW='+JSON.stringify({n,profiles:profiles.length,abilities:ABILITIES,criteria:Balance.TARGETS,source:[...sources][0]}));
}
const [cmd,id]=process.argv.slice(2);if(cmd==='smoke')smoke();else if(cmd==='run')run(id);else if(cmd==='aggregate')aggregate();else if(cmd==='plan')console.log(JSON.stringify(IDS.map(id=>({id,arms:arms(G.profile(id))}))));else throw Error('unknown command');
