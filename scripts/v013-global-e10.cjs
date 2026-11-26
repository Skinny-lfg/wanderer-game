'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict'),S=require('./simulate-progression.cjs'),{T,buy}=require('../tests/v013-current-talent-helper.cjs');
const Balance=require('./v013-balance-criteria.cjs');
const LEVEL=10,POINTS=30,N=50,FAMILIES=['blood','decay','radiance','aegis','fury','arcane'];
const W={daggers:['Daggers','Off-Hand Dagger','Leather'],sword:['Sword','Shield','Plate'],mace:['Mace','Shield','Plate'],twohand:['Two-Handed',null,'Plate'],bow:['Bow',null,'Leather'],wand:['Wand','Tome','Cloth'],orb:['Wand','Orb','Cloth'],staff:['Staff',null,'Cloth']};
const P={};
function add(id,families,w,skills,role,element,prepared){assert(!P[id]);P[id]={id,families,w,skills,role,element,prepared};}
add('blood-daggers',['blood'],'daggers',['accelerated_bleeding','deep_cuts','blood_harvest'],'single');
add('blood-sword',['blood'],'sword',['blood_drinker','third_cut','blood_harvest'],'sustain');
add('blood-twohand',['blood'],'twohand',['cleave_mastery','accelerated_bleeding','deep_cuts'],'aoe');
add('fury-daggers',['fury'],'daggers',['fan_of_blades','double_strike','quick_hands'],'aoe');
add('fury-bow',['fury'],'bow',['bow_pierce','precision','quick_hands'],'aoe');
add('fury-twohand',['fury'],'twohand',['single_target_mastery','brutal_crit','battle_tempo'],'single');
add('radiance-sword',['radiance'],'sword',['living_recovery','strong_heart','renewal'],'sustain');
add('radiance-mace',['radiance'],'mace',['living_force','vital_pulse','renewal'],'aoe');
add('radiance-wand',['radiance'],'wand',['vital_pulse','grasping_roots','life_bloom'],'aoe');
add('aegis-sword',['aegis'],'sword',['sword_sweep','guarded_block','barrier_pulse'],'aoe');
add('aegis-mace',['aegis'],'mace',['mace_shockwave','guarded_block','barrier_pulse'],'aoe');
add('aegis-orb',['aegis'],'orb',['ward_echo','stored_force','barrier_pulse'],'sustain');
for(const w of ['daggers','sword','twohand','bow','wand','staff']){
 add('decay-cycle-'+w,['decay'],w,['corruption_cycle','contagious_touch','corruption_nova'],'aoe');
 add('decay-focus-'+w,['decay'],w,['plagueheart','contagious_touch'],'sustain');
}
const ELEMENT_SKILLS={arcane:['arcane_resonance','arcane_nova','mana_spring'],fire:['kindling','fire_spread','controlled_burn'],frost:['deep_winter','frost_resonance','glacial_echo'],lightning:['overcharge','forked_lightning','static_focus']};
for(const [element,skills] of Object.entries(ELEMENT_SKILLS))for(const w of ['sword','wand','staff'])add('arcane-'+element+'-'+w,['arcane'],w,['element_choice','arcane_focus',...skills],element==='frost'?'control':'aoe',element);
add('hybrid-blood-fury',['blood','fury'],'daggers',['crimson_onslaught','reapers_cadence','red_guillotine'],'single',null,'red_guillotine');
add('hybrid-fury-radiance',['fury','radiance'],'twohand',['fervent_life','redline','defiant_surge'],'sustain',null,'defiant_surge');
add('hybrid-radiance-aegis',['radiance','aegis'],'mace',['sanctuary','guardians_oath','last_bastion'],'sustain',null,'last_bastion');
add('hybrid-aegis-arcane',['aegis','arcane'],'orb',['runic_shield','prismatic_rebound','arcane_bastion'],'sustain','arcane','arcane_bastion');
add('hybrid-arcane-decay',['arcane','decay'],'wand',['hex_bolt','elemental_blight','grave_bloom'],'aoe','arcane','grave_bloom');
add('hybrid-decay-blood',['decay','blood'],'twohand',['plague_spread','carrion_detonation','septic_wound'],'aoe',null,'septic_wound');
const IDS=Object.keys(P),ELITES=['tank','berserker','vampire','caster','gravecaller','the_shepherd','the_gilded','the_headsman'];
const SC=[...[1,2,3,4,8,12].map(size=>({id:'normal-'+size,kind:'normal',size})),...ELITES.map(elite=>({id:'elite-'+elite,kind:'elite',elite})),...FAMILIES.map(family=>({id:'boss-'+family,kind:'boss',family}))];
function profile(id){
 const p=P[id];assert(p,id);const [weapon,offhandType,armorType]=W[p.w],options={xp:POINTS*T.POINT_XP,...(p.element&&p.element!=='arcane'?{element:p.element}:{})};
 const mandatory=[...p.families.map(f=>'affinity_'+f),...p.skills];let t=buy(mandatory,options);assert(t.nodes.length<=POINTS,id+' mandatory budget');const used=()=>t.nodes.length;
 for(let pass=0;pass<POINTS&&used()<POINTS;pass++){let changed=false;for(const skill of p.skills){if(used()>=POINTS)break;const n=T.NODES.find(x=>x.id===skill);if(n?.maxRank>1){const next=T.allocate(t,skill);if(next){t=next;changed=true;}}}if(!changed)break;}
 const kindOrder={stat:0,basic:1,extension:2,focused:3,weapon:4,adaptive:5,element:6};
 const candidates=T.NODES.filter(n=>p.families.includes(n.family)&&!n.pair&&!n.advanced&&!n.pending&&(!n.element||n.element===(p.element||'arcane'))&&!(n.id==='plagueheart'&&p.families.length>1)&&Object.hasOwn(kindOrder,n.kind)).sort((a,b)=>kindOrder[a.kind]-kindOrder[b.kind]||((a.tier||1)-(b.tier||1))||a.id.localeCompare(b.id));
 for(let pass=0;pass<POINTS&&used()<POINTS;pass++){let changed=false;for(const n of candidates){if(used()>=POINTS)break;if(t.nodes.includes(n.id))continue;const next=T.allocate(t,n.id);if(next){t=next;changed=true;}}if(!changed)break;}
 if(p.prepared)t={...t,prepared:p.prepared};assert(T.valid(t),id+' valid');assert.equal(used(),POINTS,id+' point budget');assert.deepEqual(t.nodes.filter(n=>n.startsWith('affinity_')).sort(),p.families.map(f=>'affinity_'+f).sort(),id+' affinity drift');for(const skill of mandatory)assert(t.nodes.includes(skill),id+' missing '+skill);
 return {...p,weapon,offhandType,armorType,t};
}
function cell(p,sc,i){
 const family=sc.family||FAMILIES[i%FAMILIES.length],seed=64823000+i*101;
 const build={id:p.id,weapon:p.weapon,families:p.families,skills:[],...(p.element?{element:p.element}:{})};
 const opts={mode:'encounter',points:POINTS,gear:'current',rarity:'Rare',runes:false,contracts:'none',targetPolicy:'mechanics',measure:true,tickLimit:6500,lockScenarioStreams:true,controlledTalents:p.t,armorType:p.armorType,offhandType:p.offhandType,...(sc.elite?{stage619EliteType:sc.elite}:{})};
 const x=S.encounter(LEVEL,build,seed,sc.kind,opts,undefined,undefined,family,1,sc.size);
 assert.equal(x.level,LEVEL);assert.equal(x.pointsSpent,POINTS);assert.deepEqual(x.controlledTalentNodes,p.t.nodes);assert.equal(x.affinity,family);assert.equal(x.offhandType,p.offhandType);assert.equal(x.armorType,p.armorType);assert(x.won||x.died||x.timedOut);
 if(sc.elite)assert.equal(x.eliteType,sc.elite);if(sc.family)assert.equal(x.bossAffinity,sc.family);if(sc.size)assert.equal(x.requestedGroupSize,sc.size);
 const m=x.affinityMetrics||{};
 return {id:p.id,sc:sc.id,kind:sc.kind,trial:i,seed,resolved:x.resolvedSeed,realm:family,gear:x.gearFingerprint,roster:x.roster,roles:x.initialRoles,trait:x.traitId,condition:x.conditionId,bossMods:x.bossModifierIds,elite:x.eliteType,boss:x.bossId,won:x.won,died:x.died,timeout:x.timedOut,seconds:x.seconds,damage:x.damageDealt,secondary:x.secondaryTargetDamage,taken:x.damageTaken,absorbed:x.absorbed,healed:m.healingActual||0,hpEnd:x.hpEnd,hpMax:x.hpMax,mpEnd:x.mpEnd,mpMax:x.mpMax,paid:m.manaSpent||0,unfunded:x.unfundedCasterAttacks,starved:m.manaStarvedSeconds||0,firstKill:x.firstKillSeconds??null,stats:x.heroBaseStats};
}
function summary(rows){
 const n=rows.length,sum=k=>rows.reduce((s,x)=>s+(Number(x[k])||0),0),sec=sum('seconds'),mean=k=>sum(k)/n,wins=rows.filter(x=>x.won).length,mp=rows.filter(x=>x.mpMax>0);
 return {n,wins,winPct:100*wins/n,balance:Balance.summarize(rows,n?100*wins/n:null),timeouts:rows.filter(x=>x.timeout).length,meanSeconds:mean('seconds'),meanDps:rows.reduce((s,x)=>s+(x.seconds?x.damage/x.seconds:0),0)/n,secondaryDps:sec?sum('secondary')/sec:0,takenPerSecond:sec?sum('taken')/sec:0,absorbedPerSecond:sec?sum('absorbed')/sec:0,healedPerSecond:sec?sum('healed')/sec:0,manaEndPct:mp.length?mp.reduce((s,x)=>s+100*x.mpEnd/x.mpMax,0)/mp.length:null,paidPerSecond:sec?sum('paid')/sec:0,unfunded:mean('unfunded'),starved:mean('starved'),hpEndPct:rows.reduce((s,x)=>s+100*x.hpEnd/Math.max(1,x.hpMax),0)/n,meanAP:rows.reduce((s,x)=>s+(x.stats.attack||0),0)/n,meanSP:rows.reduce((s,x)=>s+(x.stats.spellPower||0),0)/n,meanDefense:rows.reduce((s,x)=>s+(x.stats.defense||0),0)/n};
}
function write(file,obj){fs.mkdirSync(require('node:path').dirname(file),{recursive:true});fs.writeFileSync(file,JSON.stringify(obj));}
function run(id){const p=profile(id),rows=[];for(const sc of SC)for(let i=0;i<N;i++)rows.push(cell(p,sc,i));write('reports/global-e10/'+id+'.json',{id,source:S.sourceFingerprint().sha256,nodes:p.t.nodes,element:p.t.element||null,prepared:p.t.prepared||null,rows});console.log('GLOBAL_E10_SHARD='+JSON.stringify({id,n:rows.length,summary:summary(rows)}));}
function smoke(){
 for(const id of IDS){const p=profile(id);for(const sc of [SC[0],SC[3],SC.find(x=>x.id==='elite-tank'),SC.find(x=>x.id==='boss-blood')])cell(p,sc,0);}
 const p=profile(IDS[0]);for(const sc of SC)cell(p,sc,1);
 console.log('GLOBAL_E10_SMOKE='+JSON.stringify({profiles:IDS.length,scenarios:SC.length,fights:IDS.length*4+SC.length}));
}
function aggregate(){
 const all=IDS.map(id=>{const x=JSON.parse(fs.readFileSync('reports/global-e10/'+id+'.json','utf8'));assert.equal(x.id,id);assert.equal(x.rows.length,N*SC.length);assert.equal(new Set(x.rows.map(r=>r.sc+'/'+r.trial)).size,x.rows.length);return x;});assert.equal(new Set(all.map(x=>x.source)).size,1);
 const base=new Map(all[0].rows.map(r=>[r.sc+'/'+r.trial,r])),gear=new Map(),pairing={cases:0,encounterMatches:0,gearComparisons:0,gearMatches:0,mismatches:[]};
 for(const x of all){const p=P[x.id];for(const r of x.rows){const key=r.sc+'/'+r.trial,b=base.get(key);assert(b);const fields=['seed','resolved','realm','roster','roles','trait','condition','bossMods','elite','boss'];pairing.cases++;const diff=fields.filter(k=>JSON.stringify(r[k])!==JSON.stringify(b[k]));if(!diff.length)pairing.encounterMatches++;else if(pairing.mismatches.length<20)pairing.mismatches.push({id:x.id,key,diff});const gk=p.w+'/'+key;if(gear.has(gk)){pairing.gearComparisons++;if(gear.get(gk)===r.gear)pairing.gearMatches++;else if(pairing.mismatches.length<20)pairing.mismatches.push({id:x.id,key,diff:['gear']});}else gear.set(gk,r.gear);}}
 const profiles={},allRows=all.flatMap(x=>x.rows);
 function group(rows){return {overall:summary(rows),normal:summary(rows.filter(r=>r.kind==='normal')),elite:summary(rows.filter(r=>r.kind==='elite')),boss:summary(rows.filter(r=>r.kind==='boss')),scenarios:Object.fromEntries(SC.map(sc=>[sc.id,summary(rows.filter(r=>r.sc===sc.id))]))};}
 for(const x of all){const p=P[x.id];profiles[x.id]={families:p.families,weapon:p.w,role:p.role,element:p.element||null,nodes:x.nodes,prepared:x.prepared,...group(x.rows)};}
 const families={};for(const f of FAMILIES)families[f]=group(allRows.filter(r=>P[r.id].families.length===1&&P[r.id].families[0]===f));families.hybrid=group(allRows.filter(r=>P[r.id].families.length>1));
 const byEncounter=Object.fromEntries(SC.map(sc=>[sc.id,summary(allRows.filter(r=>r.sc===sc.id))]));
 const report={stage:'Global balance E10',source:all[0].source,n:allRows.length,profiles,families,byEncounter,pairing};write('reports/v013-global-e10.json',report);
 const short=s=>({n:s.n,wins:s.wins,winPct:+s.winPct.toFixed(2),balance:s.balance,timeouts:s.timeouts,dps:+s.meanDps.toFixed(2),aoe:+s.secondaryDps.toFixed(2),mana:s.manaEndPct===null?null:+s.manaEndPct.toFixed(2),paid:+s.paidPerSecond.toFixed(2),hp:+s.hpEndPct.toFixed(2)});
 console.log('GLOBAL_E10_OVERVIEW='+JSON.stringify({n:report.n,pairing,families:Object.fromEntries(Object.entries(families).map(([k,v])=>[k,Object.fromEntries(['overall','normal','elite','boss'].map(t=>[t,short(v[t])]))])),encounters:Object.fromEntries(Object.entries(byEncounter).map(([k,v])=>[k,short(v)]))}));
 for(const f of [...FAMILIES,'hybrid']){const selected=Object.entries(profiles).filter(([id,p])=>f==='hybrid'?p.families.length>1:p.families.length===1&&p.families[0]===f);console.log('GLOBAL_E10_'+f.toUpperCase()+'='+JSON.stringify(Object.fromEntries(selected.map(([id,p])=>[id,{...Object.fromEntries(['overall','normal','elite','boss'].map(t=>[t,short(p[t])])),scenarios:Object.fromEntries(Object.entries(p.scenarios).map(([k,v])=>[k,{wins:v.wins,n:v.n,balance:v.balance,aoe:+v.secondaryDps.toFixed(2),mana:v.manaEndPct===null?null:+v.manaEndPct.toFixed(2)}]))}]))));}
}
if(require.main===module){const [cmd,id]=process.argv.slice(2);if(cmd==='run')run(id);else if(cmd==='smoke')smoke();else if(cmd==='aggregate')aggregate();else throw Error('Unknown command');}
module.exports={profile,cell,summary,IDS,SC,P};
