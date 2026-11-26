// Wanderer v0.12 — one calculation for derived character/equipment/rune stats.
// Explicit dependencies preserve the native formulas and allow isolated testing.
(function(root){'use strict';
function gearEvasionRating(item,{ARMOR_SLOTS}){
 if(!item||item.armorType!=='Leather'||!ARMOR_SLOTS.includes(item.slot))return 0;
 // Fresh Leather stores Evasion Rating explicitly; there is no legacy recalculation.
 const value=Number(item.evasionRating);
 return Number.isFinite(value)&&value>0?value:0;
}
function itemStatValue(item,key,context){
 if(key==='evasionRating')return gearEvasionRating(item,context);
 return Number(item?.[key])||0;
}
function power(s){
 // A diagnostic gear score, not a damage or survivability forecast.
 // Decay can use Spell Power with physical weapons; do not score it as zero.
 const activeSpell=!!(s.caster||s.phase2Magic||s.phase2Decay||s.phase2Aegis||s.off?.subtype==='Orb');
 return Math.round(s.attack*2+s.defense*4+s.maxhp*.15+s.attacksPerSec*35+s.crit*1.2+s.blockChance*2+(activeSpell?Math.max(0,Number(s.spellPower)||0)*1.7:0));
}
// Read-only presentation of the actual native Off-Hand procs. This is NOT a
// combat simulator and its values must never be added to the Gear Power score.
function offhandEffect(item,stats=null){
 if(item?.slot!=='offhand'||!['Orb','Tome','Charm'].includes(item.subtype))return null;
 const hp=Math.max(0,Number(stats?.maxhp)||0),sp=Math.max(0,Number(stats?.spellPower)||0);
 const ward=Math.max(0,(Number(stats?.wardBonus)||0)+(Number(stats?.barrierPower)||0)),known=!!stats;
 const two=(n)=>Math.round(n*100)/100;
 const type=item.subtype,trait=item.v013Trait||null;
 if(type==='Orb'){
  const amount=two((hp*.02+sp*.05)*(1+ward));
  const castBarrier=two(hp*.02*(1+ward));
  return {type,title:'Orb Ward',interval:6,unit:'Barrier',amount:known?amount:null,
   description:'On a damaging main-hand attack or funded automatic Magic hit: 2% Max HP + 5% Spell Power Barrier (6s cooldown).',
   condition:'Requires damage to enemy Health; Orb and Aegis Barrier stack without a cap and reset after combat.',
   epic:trait==='ward'?'Arcane Ward: funded casts also grant 2% Max HP Barrier (separate 6s cooldown).':null,
   epicAmount:trait==='ward'&&known?castBarrier:null,epicAvailable:trait!=='ward'||!known||Number(stats?.mana)>0};
 }
 if(type==='Tome'){
  const amount=trait==='echoing_recall'?5:3;
  return {type,title:'Tome Recall',interval:6,unit:'Mana',amount,
   description:'Every 3 Mana-paid actions restores up to '+amount+' Mana (6s cooldown).',
   condition:known&&!(Number(stats?.mana)>0)?'Inactive: this build has no Mana-paid actions.':'Requires paid actions and missing Mana; never exceeds Max Mana.',
   epic:trait==='echoing_recall'?'Echoing Recall: upgraded from 3 to 5 Mana per successful Recall.':null,
   epicAmount:null,epicAvailable:true};
 }
 const percent=trait==='heartbloom'?.02:.015;
 return {type,title:'Charm Renewal',interval:8,unit:'HP',amount:known?two(hp*percent):null,
  description:'Damaging main-hand hits heal '+(percent===.02?'2':'1.5')+'% Max HP while injured (8s cooldown).',
  condition:'Blocked attacks, full Health and secondary dagger strikes do not trigger healing. Healing debuffs apply.',
  epic:trait==='heartbloom'?'Heartbloom Renewal: upgraded from 1.5% to 2% Max HP.':null,
  epicAmount:null,epicAvailable:true};
}
const WEAPON_INTERVALS=Object.freeze({Sword:1.6,Mace:2.2,Bow:2,Daggers:1.15,'Two-Handed':2.8,Staff:2.3,Wand:1.65});
function attackSpeed(weapon,agility=5,speedRating=0,intellect=5){
 const agi=Math.max(0,agility-5),int=Math.max(0,intellect-5);
 const agilityBonus=2*agi/(100+agi);
 const castBonus=['Staff','Wand'].includes(weapon)?.65*int/(150+int):0;
 const bonus=Math.max(-.5,agilityBonus+speedRating*.035+castBonus);
 return Math.min(4.2,(1+bonus)/(WEAPON_INTERVALS[weapon]||1.6));
}
function totalStats(equipment,ownedRunes,equippedRuneIds,{isTwoHanded,FIELDS,itemStatValue,RUNE_FAMILIES,runeValue,setCounts,setBonuses,state,PHASE1_PREVIEW,phase6Run,build=null}){
 const itemBuff=phase6Run?.effects?.item;
 if(itemBuff?.remaining>0){equipment={...equipment};for(const [slot,item]of Object.entries(equipment))if(item?.id===itemBuff.id){equipment[slot]={...item};for(const [,key]of FIELDS)if(Number.isFinite(item[key]))equipment[slot][key]=item[key]*1.10;}}
 const equipped=isTwoHanded(equipment.weapon)?{...equipment,offhand:null}:equipment;
 const s={str:5,agi:5,int:5,end:5,cha:5,atkFlat:0,defFlat:0,hpFlat:0,spdFlat:0,manaFlat:0,spellFlat:0,evasionRating:0};
 const talentAttributes=root.WandererAutomaticTalents?.attributeBonuses(state?.automaticTalents)||{};
 for(const key of ['str','agi','int','end','cha'])s[key]+=talentAttributes[key]||0;
 for(const [slot,item] of Object.entries(equipped))if(item)for(const [,key]of FIELDS){
 const dest={atk:'atkFlat',def:'defFlat',hp:'hpFlat',spd:'spdFlat',mana:'manaFlat',spell:'spellFlat'}[key]||key;
 // Off-Hand Dagger contributes 50% of offensive item stats, independently of its separate 50%-damage strike.
 const offDagger=slot==='offhand'&&['Daggers','Off-Hand Dagger'].includes(item.subtype);
 const factor=offDagger&&['atk','str','agi','int','cha','spd','spell'].includes(key)?.5:1;
 s[dest]+=itemStatValue(item,key)*factor;
 }
 s.evasionRating=Math.min(Number.MAX_SAFE_INTEGER,s.evasionRating);
 const runeItems=ownedRunes===null?(typeof state==='undefined'?[]:state.runes||[]):ownedRunes;
 const runeSlots=equippedRuneIds===null?(typeof state==='undefined'?[]:state.runeSlots||[]):equippedRuneIds;
 const usedFamilies=new Set(),anchorBonuses=[];
 for(const id of runeSlots){const rune=runeItems.find(r=>r.id===id),type=RUNE_FAMILIES.find(x=>x.id===rune?.family);if(!rune||!type||usedFamilies.has(type.id))continue;usedFamilies.add(type.id);const value=runeValue(type.id,rune.tier,root.WandererV012Runes.rarity(rune))*(PHASE1_PREVIEW&&phase6Run?.effects.runeBoost?.remaining>0?1.20:1);if(Object.hasOwn(s,type.field)&&type.kind==='flat')s[type.field]+=value;else anchorBonuses.push({type,value});}
 // Read-only combat projection: legacy effects remain in stored items, but are inactive.
 const main=equipped.weapon?{...equipped.weapon,effect:null,magic:null}:null,off=equipped.offhand?{...equipped.offhand,effect:null,magic:null}:null,caster=!!main&&['Staff','Wand'].includes(main.subtype);
 const clothFraction=Object.values(equipped).filter(item=>item?.armorType==='Cloth'&&['helm','armor','gloves','boots','belt'].includes(item.slot)).length/5;
 const gearBonus=key=>Object.values(equipped).reduce((sum,item)=>sum+(Number(item?.[key])||0),0);
 const counts=setCounts(equipped),sets=setBonuses(counts);
 s.caster=caster;s.main=main;s.off=off;s.sets=sets.list;s.bonus=sets.values;s.counts=counts;
 s.maxhp=Math.round(55+s.end*12+s.hpFlat);
 s.attack=Math.round(4+s.str*1.8+s.agi*.4+s.atkFlat);
 s.defense=Math.round(1+s.end*.8+s.defFlat);
 s.rawAttackSpeed=attackSpeed(main?.subtype,s.agi,s.spdFlat,s.int);
 s.attacksPerSec=s.rawAttackSpeed;
 const critRating=Math.max(0,s.cha-5)/Math.sqrt(Math.max(1,main?.tier||1));
 s.crit=Math.min(100,Math.max(9,Math.round((9+41*(1-Math.exp(-critRating/25))+counts.crit*2+(sets.values.critBonus||0))/Math.sqrt(Math.max(1,s.rawAttackSpeed/1.3)))));
 s.mana=caster?Math.round(20+s.int*7+s.manaFlat):0;
 s.manaRegen=caster?+(1+s.int*.15).toFixed(1):0;
 s.spellPower=caster?Math.round(3+s.int*1.9+s.spellFlat):0;
 // Magic resources exist before percentage talents, including on physical weapons.
 const magic=PHASE1_PREVIEW&&(build?build.unlockedFamilies?.includes('arcane'):state?.automaticTalents?.nodes?.includes('affinity_arcane'));
 const decay=PHASE1_PREVIEW&&(build?build.unlockedFamilies?.includes('decay'):state?.automaticTalents?.nodes?.includes('affinity_decay'));
 const aegis=PHASE1_PREVIEW&&(build?build.unlockedFamilies?.includes('aegis'):state?.automaticTalents?.nodes?.includes('affinity_aegis'));
 if(magic||decay){s.mana=caster?s.mana:Math.max(30,Math.round(20+s.int*7+s.manaFlat));s.manaRegen=caster?s.manaRegen:+(1+s.int*.15).toFixed(1);}
 // Orb Ward and Aegis Barrier use Spell Power with physical weapons, but neither
 // unlocks Mana or spellcasting in the absence of Arcane/Decay.
 if(magic||decay||aegis||off?.subtype==='Orb')s.spellPower=caster?s.spellPower:Math.round(3+s.int*1.9+s.spellFlat);
 if(s.mana){s.mana=Math.round(s.mana*(1+.4*clothFraction));s.spellPower=Math.round(s.spellPower*(1+.4*clothFraction));}
 if(magic)s.phase2Magic=true;
 if(decay)s.phase2Decay=true;
 if(aegis)s.phase2Aegis=true;
 s.blockChance=off?.subtype==='Shield'?Math.min(48,Math.round(13+s.end*.27+Math.max(0,off.tier||1)*.25+(main?.subtype==='Mace'?7:0))):0;
 // Flat-per-item bonuses must not scale into double-digit percentages at E200.
 // These are equipment-only caps; talents, base attributes and Rune mechanics
 // continue to use their existing formulas and global combat ceilings.
 s.crit=Math.min(100,s.crit+Math.min(8,Math.max(0,gearBonus('critBonus'))));
 if(s.mana)s.manaRegen+=Math.min(6,Math.max(0,gearBonus('manaRegenBonus')))*(1+clothFraction);
 s.wardBonus=Math.min(.3,Math.max(0,gearBonus('wardBonus')));s.barrierPower=0;s.healingPower=0;s.manaCostReduction=0;s.critDamage=0;s.dotPower=0;
 if(off?.subtype==='Shield')s.blockChance=Math.min(48,s.blockChance+Math.min(8,Math.max(0,gearBonus('blockBonus'))));
 s.blockReduction=off?.subtype==='Shield'?(main?.subtype==='Mace'?.67:main?.subtype==='Sword'?.62:.58):0;
 s.lootQuality=Math.min(10,Math.round(Math.max(0,s.cha-5)*.09*10)/10);
 for(const {type,value} of anchorBonuses){const key=type.field;if(['mana','manaRegen','manaCostReduction'].includes(key)&&!s.mana||key==='spellPower'&&!s.spellPower||key==='blockChance'&&!s.blockChance)continue;if(type.kind==='percent')s[key]=(s[key]||0)*(1+value);else s[key]=(s[key]||0)+value;}
 if(state?.automaticTalents?.nodes?.length&&root.WandererAutomaticTalents)root.WandererAutomaticTalents.apply(s,state.automaticTalents);
 let result=s;
 if(PHASE1_PREVIEW&&root.WandererV012Buildcraft){let active=build;if(!active){active=root.WandererV012Buildcraft.create();root.WandererV012Buildcraft.syncPermanent(active,state?.automaticTalents||root.WandererAutomaticTalents.create());}result=root.WandererV012Buildcraft.mods(active,result);}
 // A shieldless character must unlock Guard before gear can improve it.
 if(off?.subtype!=='Shield'&&result.blockChance>0){const guardRune=anchorBonuses.filter(x=>x.type.field==='blockChance').reduce((sum,x)=>sum+x.value,0);result.blockChance=Math.min(65,result.blockChance+Math.min(8,Math.max(0,gearBonus('blockBonus')))+guardRune);result.blockReduction=.35;}
 if(PHASE1_PREVIEW&&phase6Run?.effects)result=root.WandererV012CombatCore.applyExpeditionModifiers(result,phase6Run.effects);
 result.manaCostReduction=Math.min(.25,Math.max(0,result.manaCostReduction||0));result.blockChance=Math.min(65,Math.max(0,result.blockChance||0));result.attacksPerSec=Math.min(4.2,result.attacksPerSec);result.crit=Math.min(100,Math.max(0,result.crit||0));result.power=power(result);
 return result;
}
const STAT_KEYS=Object.freeze(['str','agi','int','end','cha','attack','defense','maxhp','attacksPerSec','crit','blockChance','mana','manaRegen','spellPower','evasionRating','barrierPower','healingPower','manaCostReduction','critDamage','dotPower','power']);
function breakdown(equipment,ownedRunes,equippedRuneIds,context,current=null){
 const progress=context.state?.automaticTalents||root.WandererAutomaticTalents.create();
 // The talent-free breakdown is a temporary read-only projection.
 // A prepared advanced ability requires its owning talent node. Removing
 // nodes but retaining prepared made that projection invalid at E3+.
 // The actual saved/player talent progress is never mutated here.
 const bare={...context,state:{...context.state,automaticTalents:{...progress,nodes:[],prepared:null,attributes:{}}},build:null,phase6Run:null};
 const clean=item=>item?{subtype:item.subtype,slot:item.slot,tier:item.tier}:null;
 const stages=[totalStats({weapon:clean(equipment.weapon),offhand:clean(equipment.offhand)},[],[],bare),totalStats(equipment,[],[],bare),totalStats(equipment,ownedRunes,equippedRuneIds,bare),totalStats(equipment,ownedRunes,equippedRuneIds,{...context,build:null,phase6Run:null}),current||totalStats(equipment,ownedRunes,equippedRuneIds,context)];
 const rounded=n=>Math.round((Number(n)||0)*100)/100;
 return STAT_KEYS.map(key=>{const v=stages.map(s=>rounded(s[key]));return{key,base:v[0],equipment:rounded(v[1]-v[0]),runes:rounded(v[2]-v[1]),talents:rounded(v[3]-v[2]),temporary:rounded(v[4]-v[3]),total:v[4]};});
}
root.WandererV012GearStats=Object.freeze({gearEvasionRating,itemStatValue,totalStats,power,offhandEffect,breakdown,STAT_KEYS,attackSpeed,WEAPON_INTERVALS});
})(globalThis);
