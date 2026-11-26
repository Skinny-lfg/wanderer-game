'use strict';
// Cheap diagnostic screen, not an E10 balance estimate. Native earned accounts only.
const fs=require('node:fs'),assert=require('node:assert/strict'),B=require('./v013-b1-e10-rebaseline.cjs');
const T=globalThis.WandererAutomaticTalents,P=globalThis.WandererV012Consumables,C=globalThis.WandererV013Crafting;
const nodes=new Map(T.NODES.map(n=>[n.id,n])),potions=new Set(P.CATALOG.map(p=>p.id)),recipes=new Set(C.RECIPES.map(r=>r.id));
const policy='observed-stalemate-v1',base=id=>id.replace(/_rank\d+$/,'');
const tally=(rows,key)=>{const out={};for(const row of rows){const k=key(row);if(k!=null)out[k]=(out[k]||0)+1;}return out;};
function audit(id,accounts){
 const p=B.naturalProfile(id),ts=accounts.flatMap(a=>a.attempts),valid=ts.filter(t=>t.before&&t.after),rooms=ts.flatMap(t=>t.rooms||[]),issues=[],observations=[];
 const issue=(t,msg)=>issues.push({level:t.level,attempt:t.attempt,message:msg});
 for(const t of valid){
  const n=t.before.talentNodes||[],owned=n.map(base),foreign=owned.filter(id=>{const x=nodes.get(id);return !x||x.pending||(x.family&&!p.families.includes(x.family))||(x.pair&&!x.pair.every(f=>p.families.includes(f)));});
  if(foreign.length)issue(t,'foreign/retired nodes '+foreign.join(','));
  if(t.before.spent>t.before.earned||t.after.spent>t.after.earned)issue(t,'talent overspend');
  if(t.before.prepared&&!owned.includes(base(t.before.prepared)))issue(t,'unowned prepared ability');
  if(t.before.potionSelection.length>3||t.before.potionSelection.some(x=>!potions.has(x)))issue(t,'illegal potion loadout');
  if(t.potions?.some(x=>!potions.has(x.kind)))issue(t,'obsolete potion use');
  if(t.camp?.crafted?.some(x=>!recipes.has(x.recipe)))issue(t,'obsolete Forge recipe');
  if(t.before.runeSlots.filter(Boolean).length>3)issue(t,'too many rune slots');
  if(t.after.unlocked>t.before.unlocked&&!t.bossWon)issue(t,'unlock without boss victory');
  if(t.surrendered&&(t.bossWon||t.error||t.status!=='defeat'))issue(t,'invalid surrender settlement');
  if(t.contractPaid&&!['victory','extracted'].includes(t.status))issue(t,'contract paid on unsafe exit');
  if(p.element&&owned.includes('element_choice')&&t.before.element!==p.element)issue(t,'incorrect element');
 }
 const equip=slot=>valid.map(t=>t.before.gear.items.find(i=>i.slot===slot)).filter(Boolean);
 const weapon=equip('weapon'),armor=equip('armor'),offhand=equip('offhand'),spell=rooms.filter(r=>r.mpMax>0),spent=valid.map(t=>t.before.spent);
 return {id,intent:{families:p.families,weapons:p.weapons,armor:p.armor,offhands:p.offhands||[],element:p.element||null},accounts:accounts.length,attempts:ts.length,endLevels:tally(accounts,a=>a.endLevel),errors:ts.filter(t=>t.error).map(t=>({level:t.level,error:t.error})),issues,observations:{weapon:tally(weapon,x=>x.subtype),weaponMismatch:weapon.filter(x=>!p.weapons.includes(x.subtype)).length,armor:tally(armor,x=>x.armorType),armorMismatch:armor.filter(x=>x.armorType!==p.armor).length,offhand:tally(offhand,x=>x.subtype),pointsMax:Math.max(0,...spent),owned:tally(valid.flatMap(t=>t.before.talentNodes.map(base)),x=>x),prepared:tally(valid,t=>t.before.prepared),potionsUsed:tally(ts.flatMap(t=>t.potions||[]),x=>x.kind),potionCrafts:tally(ts.flatMap(t=>t.camp?.potions||[]).filter(x=>x.action==='craft'),x=>x.kind),forgeCrafts:tally(ts.flatMap(t=>t.camp?.crafted||[]),x=>x.recipe),runeEquips:ts.flatMap(t=>t.camp?.runes||[]).filter(x=>x.action==='equip').length,contractPayouts:ts.filter(t=>t.contractPaid).length,spellFights:spell.length,manaSpent:spell.reduce((s,r)=>s+(r.manaSpent||0),0),unfundedCasterAttacks:rooms.reduce((s,r)=>s+(r.unfundedCasterAttacks||0),0),surrenders:rooms.filter(r=>r.surrendered).length,timeouts:rooms.filter(r=>r.timedOut).length}};
}
const manifest=B.manifest();assert.equal(manifest.natural.length,28);
const results=B.NATURAL.map(id=>audit(id,[0,1].map(i=>B.naturalAccount(id,i,3,3,9,{surrenderPolicy:policy}))));
const replay=B.naturalAccount('smart-radiance-pure',36,10,12,60,{surrenderPolicy:policy});
const replaySummary={seed:replay.seed,endLevel:replay.endLevel,errors:replay.attempts.filter(t=>t.error).map(t=>({level:t.level,error:t.error})),surrenders:replay.attempts.flatMap(t=>t.rooms.filter(r=>r.surrendered).map(r=>({level:t.level,attempt:t.attempt,seconds:r.seconds,reason:r.surrenderReason})))};
const result={scope:'28 profiles x 2 seeds E1-E3, max 3 attempts/level; targeted E9 replay',policy,profiles:results,replay:replaySummary};
fs.mkdirSync('reports/b12c',{recursive:true});fs.writeFileSync('reports/b12c/agent-audit.json',JSON.stringify(result,null,2));
console.log('B12C_OVERVIEW='+JSON.stringify({profiles:results.map(({id,accounts,attempts,endLevels,errors,issues,observations:o})=>({id,accounts,attempts,endLevels,errors,issues,weapon:o.weapon,weaponMismatch:o.weaponMismatch,armor:o.armor,armorMismatch:o.armorMismatch,pointsMax:o.pointsMax,spellFights:o.spellFights,manaSpent:o.manaSpent,unfunded:o.unfundedCasterAttacks,potionsUsed:o.potionsUsed,potionCrafts:o.potionCrafts,forgeCrafts:o.forgeCrafts,runeEquips:o.runeEquips,contractPayouts:o.contractPayouts,surrenders:o.surrenders,timeouts:o.timeouts})),replay:replaySummary}));
if(results.some(r=>r.errors.length||r.issues.length)||replaySummary.errors.length)process.exitCode=1;
