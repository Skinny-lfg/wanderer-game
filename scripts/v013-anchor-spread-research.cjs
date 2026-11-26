'use strict';
// Isolated VM research: 100% copied stack potency, not a live balance change.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
require('../combat/v012-runes.js');
const F=['blood','decay','radiance','aegis','fury','arcane'],ELITES=G.SC.filter(s=>s.kind==='elite').map(s=>s.elite),SC=['normal-1','normal-4','normal-8','normal-12','elite','boss'],N=50,OUT='reports/anchor-spread-research';
G.P['blood-spread-twohand']={id:'blood-spread-twohand',families:['blood'],w:'twohand',skills:['blood_transfer','cleave_mastery','accelerated_bleeding'],role:'aoe'};
const PROFILES=['decay-cycle-wand','hybrid-arcane-decay','hybrid-decay-blood','blood-spread-twohand','arcane-fire-wand'];
const B='combat/v012-buildcraft.js',C='combat/v012-combat-runtime.js',E='online/v012-expedition-runtime.js',O='online/v013-expedition-boons.js';
const originals=Object.fromEntries([B,C,E,O].map(p=>[p,fs.readFileSync(p,'utf8')]));
function replace(s,a,b){assert.equal(s.split(a).length,2,'source anchor '+a.slice(0,120));return s.replace(a,b);}
function overlay(full){
 const src={...originals};
 const edit=(p,a,b)=>{src[p]=replace(src[p],a,b);};
 const buildMetric=(name,value)=>"c.metric?.('anchorSpread"+name+"',1);c.metric?.('anchorSpread"+name+"Potency',"+value+");";
 const nativeMetric=(name,value)=>"ports.phase6Metric(r,'anchorSpread"+name+"',1);ports.phase6Metric(r,'anchorSpread"+name+"Potency',"+value+");";
 // Preserve all existing eligibility, target limits, flags, duration and CD.
 edit(B,"target.v012Rot.push({damage:d.damage*.65,remaining:specialized(b,'lingering_rot')?6:4,ticks:0,spread:true,secondaryOrigin:'contagious_touch'});","target.v012Rot.push({damage:"+(full?"d.damage":"d.damage*.65")+",remaining:specialized(b,'lingering_rot')?6:4,ticks:0,spread:true,secondaryOrigin:'contagious_touch'});"+buildMetric("ContagiousTouch","target.v012Rot.at(-1).damage"));
 edit(B,"target.v012Rot.push({damage:Math.max(1,Math.round(source.damage*.75)),remaining:Math.min(3,source.remaining),ticks:0,spread:true,secondaryOrigin:\"grave_bloom\"});","target.v012Rot.push({damage:"+(full?"source.damage":"Math.max(1,Math.round(source.damage*.75))")+",remaining:Math.min(3,source.remaining),ticks:0,spread:true,secondaryOrigin:\"grave_bloom\"});"+buildMetric("GraveBloom","target.v012Rot.at(-1).damage"));
 // Bloodshed immediate burst intentionally retains its historical 50% reference.
 edit(B,"target.dots.bleed.push({...dot,damage:tick,remaining:Math.min(3,dot.remaining),transferred:true});","target.dots.bleed.push({...dot,damage:"+(full?"dot.damage":"tick")+",remaining:Math.min(3,dot.remaining),transferred:true});"+buildMetric("Bloodshed","target.dots.bleed.at(-1).damage"));
 for(const [kind,source] of [['Bleed','sourceBleed'],['Rot','sourceRot']]){
  const field=kind==='Bleed'?'target.dots.bleed':'target.v012Rot',old=field+".push({damage:Math.max(1,Math.round("+source+".damage*.5)),";
  edit(C,old,field+".push({damage:"+(full?source+".damage":"Math.max(1,Math.round("+source+".damage*.5))")+",");
  const metric='ports.phase6Metric(r,"carrionSpread'+kind+'",1);';
  edit(C,metric,metric+nativeMetric("Carrion"+kind,field+".at(-1).damage"));
 }
 // Controlled Burn retains its original Wildfire immediate-hit reference.
 // Full spread copies the actual original Burn, not its pre-Controlled-Burn base.
 edit(C,"enemy.dots.burn.push({damage:Math.max(1,Math.round(spreadBase*.65)),remaining:Math.min(3,burn.remaining),spread:true});","enemy.dots.burn.push({damage:"+(full?"burn.damage":"Math.max(1,Math.round(spreadBase*.65))")+",remaining:Math.min(3,burn.remaining),spread:true});"+nativeMetric("FireSpread","enemy.dots.burn.at(-1).damage"));
 edit(C,"enemy.dots.burn.push({damage:Math.max(1,Math.round(controlledSpreadBase(burn,nodes.includes('controlled_burn'))*.50)),remaining:Math.min(3,burn.remaining),spread:true});","enemy.dots.burn.push({damage:"+(full?"burn.damage":"Math.max(1,Math.round(controlledSpreadBase(burn,nodes.includes('controlled_burn'))*.50))")+",remaining:Math.min(3,burn.remaining),spread:true});"+nativeMetric("Conflagration","enemy.dots.burn.at(-1).damage"));
 // Contagion (plague_spread) still detonates five historical 50% ticks immediately.
 for(const kind of ['bleed','rot']){
  const field=kind==='bleed'?'target.dots.bleed':'target.v012Rot',old=field+".push({damage:tick,remaining:Math.min(2,"+kind+".remaining),";
  edit(E,old,field+".push({damage:"+(full?kind+".damage":"tick")+",remaining:Math.min(2,"+kind+".remaining),");
  const marker=kind==='bleed'?"transferredTick+=tick;transferred++;ports.combatLinkEffect?.(r,'bleed',enemy,[target]);":"transferredTick+=tick;transferred++;ports.combatLinkEffect?.(r,'rot',enemy,[target]);";
  edit(E,marker,marker+nativeMetric("Contagion"+kind,field+".at(-1).damage"));
 }
 // Rotbound Echo still spreads at most twice, once per encounter; all three kinds.
 edit(O,"const potency=Math.max(1,Math.round(dot.damage*scale)),duration=","const potency="+(full?"dot.damage":"Math.max(1,Math.round(dot.damage*scale))")+",duration=");
 edit(E,"if(spread)ports.addLog('Rotbound Echo spreads a lingering curse to '+spread+' '+(spread===1?'enemy':'enemies')+'.','spell');","if(spread){ports.phase6Metric(r,'anchorSpreadRotboundEcho',spread);ports.addLog('Rotbound Echo spreads a lingering curse to '+spread+' '+(spread===1?'enemy':'enemies')+'.','spell');}");
 return src;
}
const variants={base:overlay(false),full:overlay(true)};
const arms=[];for(const variant of ['base','full'])for(const boon of [false,true])for(const rune of [false,true])arms.push({id:variant+(boon?'-echo':'')+(rune?'-rune':''),variant,boon,rune});
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const sourceHashes=Object.fromEntries(Object.entries(variants).map(([k,v])=>[k,Object.fromEntries(Object.entries(v).map(([p,s])=>[p,hash(s)]))]));
function cell(p,sc,i,arm){
 const family=F[i%F.length],seed=65301001+i*101,kind=sc.startsWith('normal')?'normal':sc,size=kind==='normal'?Number(sc.slice(7)):undefined,elite=kind==='elite'?ELITES[i%ELITES.length]:undefined,src=variants[arm.variant];
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:30,gear:'current',rarity:'Rare',runes:false,anchorRuneFixture:arm.rune?[{family:'corruption',tier:5,rarity:'Rare'}]:[],contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,stage648c1BuildcraftSource:src[B],stageArmorRuntimeSource:src[C],stage648b1ExpeditionSource:src[E],anchorSpreadResearch:true,anchorSpreadBoonSource:src[O],anchorSpreadBoon:arm.boon,...(elite?{stage619EliteType:elite}:{})};
 const x=S.encounter(10,build,seed,kind,opts,undefined,undefined,family,1,size);
 assert.equal(x.pointsSpent,30);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert(x.won||x.died||x.timedOut);if(elite)assert.equal(x.eliteType,elite);if(kind==='boss')assert.equal(x.bossAffinity,family);
 return {arm:arm.id,sc,i,seed,won:!!x.won,died:!!x.died,timeout:!!x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,secondaryDot:x.secondaryDotDamage,periodic:x.affinityMetrics.dotDamageActual,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,spread:x.anchorSpreadMetrics,decay:x.decayTalentMetrics,bloom:x.graveBloomMetrics,weapon:x.weaponStatusMetrics,match:{resolved:x.resolvedSeed,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId}};
}
function paired(p,sc,i){const rows=arms.map(a=>cell(p,sc,i,a));for(const r of rows.slice(1))assert.deepEqual(r.match,rows[0].match,p.id+'/'+sc+'/'+i+'/'+r.arm);return rows;}
const mean=(rs,fn)=>rs.length?rs.reduce((s,r)=>s+fn(r),0)/rs.length:null;
function stats(rs){const wins=rs.filter(r=>r.won),keys=[...new Set(rs.flatMap(r=>Object.keys(r.spread||{})))];return {n:rs.length,wins:wins.length,winPct:100*wins.length/rs.length,timeouts:rs.filter(r=>r.timeout).length,dps:mean(rs,r=>r.damage/Math.max(.11,r.seconds)),secondaryDps:mean(rs,r=>r.secondary/Math.max(.11,r.seconds)),secondaryDotDps:mean(rs,r=>r.secondaryDot/Math.max(.11,r.seconds)),periodicDps:mean(rs,r=>r.periodic/Math.max(.11,r.seconds)),winSeconds:mean(wins,r=>r.seconds),hpEndPct:mean(rs,r=>100*r.hpEnd/r.hpMax),manaEndPct:mean(rs.filter(r=>r.mpMax>0),r=>100*r.mpEnd/r.mpMax),spread:Object.fromEntries(keys.map(k=>[k,rs.reduce((s,r)=>s+(r.spread?.[k]||0),0)]))};}
function summary(rows){const out={};for(const sc of ['all',...SC]){const rs=rows.filter(r=>sc==='all'||r.sc===sc);out[sc]={};for(const arm of arms){const selected=rs.filter(r=>r.arm===arm.id),base=rs.filter(r=>r.arm===arm.id.replace('full','base')),m=stats(selected),b=stats(base),lookup=new Map(base.map(r=>[r.sc+'/'+r.i,r]));out[sc][arm.id]={...m,deltaWinPp:m.winPct-b.winPct,pairedGains:selected.filter(r=>r.won&&!lookup.get(r.sc+'/'+r.i).won).length,pairedLosses:selected.filter(r=>!r.won&&lookup.get(r.sc+'/'+r.i).won).length};}}return out;}
function write(name,obj){fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(path.join(OUT,name),JSON.stringify(obj)+'\n');}
function run(id){assert(PROFILES.includes(id));const p=G.profile(id),rows=[];for(const sc of SC)for(let i=0;i<N;i++)rows.push(...paired(p,sc,i));const report={id,n:rows.length,profile:p,source:S.sourceFingerprint().sha256,sourceHashes,arms,summary:summary(rows),rows};write(id+'.json',report);console.log('ANCHOR_SPREAD='+JSON.stringify({id,n:rows.length,summary:report.summary}));}
function smoke(){
 for(const src of Object.values(variants))for(const text of Object.values(src))new Function(text);
 for(const full of [false,true]){
  const src=variants[full?'full':'base'],root={WandererAutomaticTalents:T,WandererV013ExpeditionFoundation:globalThis.WandererV013ExpeditionFoundation};
  new Function('globalThis','module',src[B])(root,undefined);new Function('globalThis','module',src[O])(root,undefined);
  const Bc=root.WandererV012Buildcraft,boon=root.WandererV013ExpeditionBoons,b=Bc.create(),fallen={hp:0,v012Rot:[{damage:100,remaining:4}]},e={hp:10000,maxhp:10000,v012Rot:[],dots:{bleed:[],burn:[]}},r={hp:100,mp:100,maxmp:100,boonIds:['rotbound_echo'],enemies:[fallen,e],stats:{dotPower:0}},c={enemy:e,player:r,now:1,log(){},metric(){}};
  assert.equal(boon.spreadOnDeath(r,fallen),1);assert.equal(e.v012Rot[0].damage,full?100:30);assert(e.v012Rot[0].spread);assert.equal(e.v012Rot[0].remaining,2);
  Bc.applyRot(b,c,100,'paid_primary_toxic_touch');assert.deepEqual(e.v012Rot.map(d=>d.damage),[full?100:30,100]);assert(e.v012Rot[1].primaryPaid);assert.equal(e.v012Rot[0].primaryPaid,undefined);
  assert.equal(boon.spreadOnDeath(r,fallen),0);
  for(let i=0;i<4;i++)Bc.applyRot(b,c,100,'paid_primary_cycle_extra');assert.equal(e.v012Rot.length,6);Bc.applyRot(b,c,110,'paid_primary_cycle_extra');assert.deepEqual(e.v012Rot.map(d=>d.damage),[100,100,100,100,100,110]);
  for(const kind of ['bleed','burn']){const srcEnemy={hp:0,dots:{[kind]:[{damage:115,remaining:3}]}},target={hp:1000,dots:{bleed:[],burn:[]}},rr={boonIds:['rotbound_echo'],enemies:[srcEnemy,target]};assert.equal(boon.spreadOnDeath(rr,srcEnemy,()=>{}),1);assert.equal(target.dots[kind][0].damage,full?115:Math.round(115*.3));assert(target.dots[kind][0].spread);}
 }
 for(const id of PROFILES){const p=G.profile(id);paired(p,'normal-4',0);}
 console.log('ANCHOR_SPREAD_SMOKE_OK');
}
function aggregate(){const reports=PROFILES.map(id=>JSON.parse(fs.readFileSync(path.join(OUT,id+'.json'))));let n=0;for(const r of reports){assert.equal(r.n,SC.length*N*arms.length);assert.deepEqual(r.sourceHashes,sourceHashes);n+=r.n;}assert.equal(new Set(reports.map(r=>r.source)).size,1);const report={n,profiles:Object.fromEntries(reports.map(r=>[r.id,{profile:r.profile,summary:r.summary}])),arms,sourceHashes,source:reports[0].source,notes:['Native runtime with research-only source overlays. E10 30 points Rare gear; 50 seeds per scenario; boss and elite variants rotate. Corruption Rare Veteran and Rotbound Echo independently crossed with spread potency. No Blood Tribute change. Immediate burst coefficients remain historical; 100% applies only to copied stack. Existing durations, cooldowns, cap and propagation provenance retained. Full Burn copies actual primary potency, including Controlled Burn. Conflagration only occurs if present in rolled gear. No production balance change.']};write('summary.json',report);console.log('ANCHOR_SPREAD_OVERVIEW='+JSON.stringify({n,profiles:Object.fromEntries(reports.map(r=>[r.id,Object.fromEntries(Object.entries(r.summary).map(([sc,m])=>[sc,Object.fromEntries(Object.entries(m).map(([id,v])=>[id,{n:v.n,win:v.winPct,delta:v.deltaWinPp,aoe:v.secondaryDps,periodic:v.periodicDps,spread:v.spread}]))]))]))}));}
if(require.main===module){const arg=process.argv[2];if(arg==='smoke')smoke();else if(arg==='aggregate')aggregate();else run(arg);}
