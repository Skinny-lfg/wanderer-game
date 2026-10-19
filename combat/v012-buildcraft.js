// Wanderer v0.12 Phase 2 — isolated temporary buildcraft atop the classic combat engine.
// Never persists to profile, alters equipment affinities or imports the prototype simulator.
(function(root){
'use strict';
const FAMILIES=['blood','decay','vitality','aegis','fury','magic'];
const elements=['fire','frost','lightning'];
const P=[
 ['blood','bleeding_edge','Bleeding Edge','Hits may inflict Bleed (0.9s internal cooldown).'],
 ['blood','deep_cuts','Deep Cuts','Your temporary Bleed deals 20% more damage per rank.'],
 ['blood','executioner','Executioner','Strike a bleeding foe below 30% HP for a bounded burst (6s cooldown).'],
 ['blood','blood_drinker','Blood Drinker','Hits on a bleeding foe heal up to 1.5% maximum HP (4s cooldown).'],
 ['blood','sanguine_fury','Sanguine Fury','Critical hits inflict Bleed and briefly increase attack speed.'],
 ['decay','toxic_touch','Toxic Touch','Hits may apply Poison and one Rot stack (1.3s cooldown).'],
 ['decay','virulent_rot','Virulent Rot','Rot ticks deal 18% more damage per rank.'],
 ['decay','wasting_curse','Wasting Curse','Rotted enemies deal 8% less damage per rank.'],
 ['decay','wither','Withering Hex','Rot reduces enemy healing by 35% per rank (capped 70%).'],
 ['decay','blight','Blight','Strike a rotted enemy for a capped corruption burst (7s cooldown).'],
 ['vitality','strong_heart','Strong Heart','Increase maximum Health by 10% per rank.'],
 ['vitality','renewal','Renewal','Recover 0.55% maximum Health per combat second per rank.'],
 ['vitality','last_stand','Last Stand','Survive one lethal hit per Expedition, recovering 6% HP.'],
 ['vitality','second_breath','Second Breath','Recover 2.5% maximum HP after each completed Wave per rank.'],
 ['vitality','life_bloom','Life Bloom','Periodic healing also restores 1.5 Mana per rank.'],
 ['aegis','iron_skin','Iron Skin','Increase Defense by 12% per rank.'],
 ['aegis','fortified','Fortified','Reduce incoming damage by 6% per rank.'],
 ['aegis','guarded_block','Guarded Block','Gain 6% Block chance and partial block protection per rank.'],
 ['aegis','barrier_pulse','Barrier Pulse','Gain Barrier equal to 2% max HP every 6 combat seconds.'],
 ['aegis','retaliation','Retaliation','Absorbed Barrier empowers the next hit by up to 15%.'],
 ['fury','quick_hands','Quick Hands','Increase attack speed by 8% per rank.'],
 ['fury','precision','Precision','Increase Critical chance by 6 percentage points per rank (65% cap).'],
 ['fury','brutal_crit','Brutal Critical','Critical strikes add 12% of base hit damage per rank.'],
 ['fury','double_strike','Double Strike','10% chance per rank for one non-recursive 30% bonus hit.'],
 ['fury','adrenaline','Adrenaline','Critical strikes boost attack speed by 10% briefly (3s cooldown).'],
 ['magic','arcane_focus','Arcane Focus','Increase elemental Spell Power by 15% per rank.'],
 ['magic','mana_spring','Mana Spring','Increase Mana regeneration by 18% per rank.'],
 ['magic','efficient_cast','Efficient Casting','Reduce temporary elemental cast cost by 12% per rank.'],
 ['magic','arcane_echo','Arcane Echo','Every fourth elemental hit echoes for 25% Spell Power (no recursion).'],
 ['magic','elemental_force','Elemental Force','Increase temporary Magic status potency by 15% per rank.'],
 ['magic','kindling','Kindling','Fire Burn gains 20% potency per rank.',[],'fire'],
 ['magic','deep_winter','Deep Winter','Frost Chill duration increases by 0.45s per rank.',[],'frost'],
 ['magic','overcharge','Overcharge','Lightning burst damage increases by 20% per rank.',[],'lightning'],
 ['blood','plague_rupture','Plague Rupture','Bleed + Rot unleash a burst on critical hits (8s cooldown).',['blood','decay']],
 ['blood','blood_ward','Blood Ward','Bleeding enemies generate Barrier every 5s.',['blood','aegis']],
 ['blood','hemovore','Hemovore','Kills on bleeding foes heal 4% max HP.',['blood','vitality']],
 ['blood','crimson_rush','Crimson Rush','Critical strikes against bleeding foes deal 15% bonus damage.',['blood','fury']],
 ['blood','hex_bleed','Hex Bleed','Funded Magic hits inflict Bleed (3s cooldown).',['blood','magic']],
 ['decay','rot_recovery','Rot Recovery','Defeating a rotted enemy heals 4% max HP.',['decay','vitality']],
 ['decay','rot_ward','Rot Ward','Rot ticks grant Barrier every 5s.',['decay','aegis']],
 ['decay','toxic_precision','Toxic Precision','Crits inflict Poison and Rot (2s cooldown).',['decay','fury']],
 ['decay','hex_bolt','Hex Bolt','Funded elemental casts pulse bonus damage against Rot (3s cooldown).',['decay','magic']],
 ['vitality','sanctuary','Sanctuary','Recovering Health grants Barrier equal to 20% of the heal.',['vitality','aegis']],
 ['vitality','fervent_life','Fervent Life','Critical strikes restore 1% maximum HP (4s cooldown).',['vitality','fury']],
 ['vitality','life_conduit','Life Conduit','Healing restores 2 Mana (3s cooldown).',['vitality','magic']],
 ['aegis','counterstrike','Counterstrike','Blocking grants one 18% base-hit counterstrike.',['aegis','fury']],
 ['aegis','runic_shield','Runic Shield','Funded elemental spells grant Barrier (3s cooldown).',['aegis','magic']],
 ['fury','spellblade','Spellblade','Each funded cast empowers the next weapon attack by 15%.',['fury','magic']]
].map(([family,id,name,description,requires=[],element=null])=>Object.freeze({family,id,name,description,requires,element,max:element||requires.length?1:2}));
const BY_ID=Object.fromEntries(P.map(p=>[p.id,p]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function create(){return {element:null,picks:[],cooldowns:Object.create(null),runtime:{frenzyUntil:0,counter:0,spellblade:false,magicHits:0,lastStand:false,lastSpellAt:-999}};}
function rank(b,id){return b?.picks?.filter(x=>x===id).length||0;}
function hasFamily(b,family){return Array.isArray(b?.families)&&b.families.includes(family);}
function eligible(b,family){
 if(!FAMILIES.includes(family)||!hasFamily(b,family))return [];
 return P.filter(p=>p.family===family&&p.requires.every(f=>hasFamily(b,f))&&(!p.element||p.element===b.element)&&rank(b,p.id)<p.max);
}
function options(b,family,rng=Math.random){
 const primary=eligible(b,family);
 const pool=primary.length>=3?primary:[...primary,...b.families.filter(f=>f!==family).flatMap(f=>eligible(b,f))];
 if(pool.length<3)throw Error('No three implemented passives available');
 const unowned=pool.filter(p=>!rank(b,p.id)),weighted=unowned.length>=3?unowned:pool;
 const chosen=[],specific=weighted.filter(p=>p.element===b.element&&p.element);
 if(family==='magic'&&specific.length)chosen.push(specific[Math.floor(rng()*specific.length)]);
 const rest=weighted.filter(p=>!chosen.includes(p));
 while(chosen.length<3){let index=Math.floor(rng()*rest.length);chosen.push(rest.splice(index,1)[0]);}
 return chosen;
}
function choose(b,family,id,offers){
 const p=BY_ID[id];
 if(!p||!b.families.includes(p.family)||!Array.isArray(offers)||!offers.some(x=>x.id===id)||!eligible(b,p.family).some(x=>x.id===id))throw Error('Passive unavailable');
 b.picks.push(id);return p;
}
function element(b,id){if(!hasFamily(b,'magic')||!elements.includes(id)||b.element!==null)throw Error('Magic element already chosen or ineligible');b.element=id;return id;}
function ready(b,id,now,seconds){if((b.cooldowns[id]??-1e10)>now)return false;b.cooldowns[id]=now+seconds;return true;}
function mods(b,base){
 const s={...base},h=rank(b,'strong_heart'),a=rank(b,'iron_skin'),q=rank(b,'quick_hands'),p=rank(b,'precision');
 s.maxhp=Math.round(s.maxhp*(1+.10*h));
 s.defense=Math.round(s.defense*(1+.12*a));
 s.attacksPerSec=Math.min(5,s.attacksPerSec*(1+.08*q));
 s.crit=Math.min(65,s.crit+6*p);
 if(hasFamily(b,'magic')){
  // Do not change s.caster: Staff/Wand keep their original funded-attack path.
  s.mana=Math.max(30,Math.round(s.mana||20+s.int*7+s.manaFlat));
  s.manaRegen=+(Math.max(1.5,s.manaRegen||1.5+s.int*.23)*(1+.18*rank(b,'mana_spring'))).toFixed(2);
  s.spellPower=Math.round((s.spellPower||3+s.int*1.9+s.spellFlat)*(1+.15*rank(b,'arcane_focus')));
  s.phase2Magic=true;
 }
 s.blockChance=Math.min(65,(s.blockChance||0)+rank(b,'guarded_block')*6);
 if(s.blockChance&&!s.blockReduction)s.blockReduction=.35;
 return s;
}
function applyRot(b,c,power){
 const e=c.enemy;if(!e||e.hp<=0)return;
 const stacks=e.v012Rot||(e.v012Rot=[]);
 if(stacks.length>=6)stacks.shift();
 stacks.push({damage:Math.max(1,Math.round(power*(1+.18*rank(b,'virulent_rot')))),remaining:4});
 c.log('☠ Rot '+stacks.length+'/6');
}
function heal(b,c,amount){const healed=c.heal(Math.max(0,amount))||0;
 if(healed>0&&rank(b,'sanctuary')&&ready(b,'sanctuary',c.now,1))c.barrier(healed*.20);
 if(healed>0&&rank(b,'life_conduit')&&ready(b,'life_conduit',c.now,3))c.mana(2);
 return healed;
}
function onAttack(b,c){
 const e=c.enemy,base=Math.max(1,c.base||1),crit=!!c.critical;
 if(hasFamily(b,'blood')&&ready(b,'bleedEdge',c.now,rank(b,'bleeding_edge')?.9:1.8)&&c.random()<(.22+.12*rank(b,'bleeding_edge'))) c.dot('bleed',base*.16*(1+.20*rank(b,'deep_cuts')));
 if(rank(b,'sanguine_fury')&&crit&&ready(b,'sanguineFury',c.now,2.5)){
  c.dot('bleed',base*.14*(1+.20*rank(b,'deep_cuts')));b.runtime.frenzyUntil=Math.max(b.runtime.frenzyUntil,c.now+3);
 }
 if(rank(b,'executioner')&&e.bleedStacks>0&&e.hp<=e.maxhp*.30&&ready(b,'execute',c.now,6))c.damage(Math.min(base*.32,e.maxhp*.025),'🩸 Execute');
 if(rank(b,'blood_drinker')&&e.bleedStacks>0&&ready(b,'bloodHeal',c.now,4))heal(b,c,Math.min(c.player.maxhp*.015,base*.10));
 if(hasFamily(b,'decay')&&ready(b,'toxicTouch',c.now,rank(b,'toxic_touch')?1.3:2)&&c.random()<(.28+.14*rank(b,'toxic_touch'))){c.dot('poison',base*.12);applyRot(b,c,base*.065);}
 if(rank(b,'blight')&&e.v012Rot?.length&&ready(b,'blight',c.now,7))c.damage(Math.min(base*.38,e.maxhp*.025),'☠ Blight');
 if(rank(b,'toxic_precision')&&crit&&ready(b,'toxicPrecision',c.now,2)){c.dot('poison',base*.11);applyRot(b,c,base*.06);}
 if(rank(b,'plague_rupture')&&crit&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'plagueRupture',c.now,8))c.damage(Math.min(base*.45,e.maxhp*.03),'🩸 Plague Rupture');
 if(rank(b,'crimson_rush')&&crit&&e.bleedStacks>0)c.damage(base*.15,'🩸 Crimson Rush');
 if(rank(b,'brutal_crit')&&crit)c.damage(base*.12*rank(b,'brutal_crit'),'⚔ Brutal Critical');
 if(rank(b,'double_strike')&&c.random()<.10*rank(b,'double_strike'))c.damage(base*.30,'🗡 Extra Strike');
 if(rank(b,'fervent_life')&&crit&&ready(b,'ferventLife',c.now,4))heal(b,c,c.player.maxhp*.01);
 if(rank(b,'adrenaline')&&crit&&ready(b,'adrenaline',c.now,3))b.runtime.frenzyUntil=Math.max(b.runtime.frenzyUntil,c.now+3);
 if(rank(b,'counterstrike')&&b.runtime.counter){b.runtime.counter=0;c.damage(base*.18,'🛡 Counterstrike');}
 if(rank(b,'retaliation')&&b.runtime.counter){b.runtime.counter=0;c.damage(base*.15,'🛡 Retaliation');}
 if(rank(b,'spellblade')&&!c.magical&&b.runtime.spellblade){b.runtime.spellblade=false;c.damage(base*.15,'✨ Spellblade');}
}
function onCast(b,c){
 if(!hasFamily(b,'magic')||!elements.includes(b.element))return;
 const power=Math.max(1,c.power)*(1+.15*rank(b,'elemental_force'))*c.amp;
 const e=c.enemy; b.runtime.magicHits++;
 if(b.element==='fire')c.dot('burn',power*.15*(1+.20*rank(b,'kindling')));
 else if(b.element==='frost')c.chill((2.5+.45*rank(b,'deep_winter'))*(1+.15*rank(b,'elemental_force')));
 else {
  e.v012Shock=Math.min(4,(e.v012Shock||0)+1);
  if(e.v012Shock>=4&&ready(b,'shockBurst',c.now,2)){
   e.v012Shock=0;
   c.damage(Math.min(power*.65*(1+.20*rank(b,'overcharge')),e.maxhp*.035),'⚡ Lightning Burst');
  }
 }
 if(rank(b,'arcane_echo')&&b.runtime.magicHits%4===0)c.damage(power*.25,'✨ Arcane Echo');
 if(rank(b,'hex_bleed')&&ready(b,'hexBleed',c.now,3))c.dot('bleed',power*.11);
 if(rank(b,'hex_bolt')&&e.v012Rot?.length&&ready(b,'hexBolt',c.now,3))c.damage(power*.18,'☠ Hex Bolt');
 if(rank(b,'runic_shield')&&ready(b,'runicShield',c.now,3))c.barrier(c.player.maxhp*.02);
 if(rank(b,'spellblade'))b.runtime.spellblade=true;
}
function onSecond(b,c){
 const e=c.enemy;
 if(e.v012Rot?.length){
  const rot=e.v012Rot;
  const damage=rot.reduce((sum,s)=>sum+s.damage,0);
  e.v012Rot=rot.map(s=>({...s,remaining:s.remaining-1})).filter(s=>s.remaining>0);
  c.dotDamage(damage,'☠ Rot');
  if(rank(b,'rot_ward')&&ready(b,'rotWard',c.now,5))c.barrier(c.player.maxhp*.015);
 }
 if(hasFamily(b,'vitality'))heal(b,c,c.player.maxhp*(.002+.0055*rank(b,'renewal')));
 if(rank(b,'life_bloom'))c.mana(1.5*rank(b,'life_bloom'));
 if(rank(b,'barrier_pulse')&&ready(b,'barrierPulse',c.now,6))c.barrier(c.player.maxhp*.02);
 if(rank(b,'blood_ward')&&e.bleedStacks>0&&ready(b,'bloodWard',c.now,5))c.barrier(c.player.maxhp*.018);
}
function incoming(b,c,raw){
 let reduction=.06*rank(b,'fortified')+.08*rank(b,'wasting_curse')*(c.enemy.v012Rot?.length?1:0);
 return Math.max(1,Math.round(raw*(1-clamp(reduction,0,.28))));
}
function onDefend(b,c,blocked,barrierAbsorbed){
 if((blocked>0||barrierAbsorbed>0)&&(rank(b,'counterstrike')||rank(b,'retaliation')))b.runtime.counter=1;
}
function onKill(b,c){
 if(rank(b,'hemovore')&&c.enemy.bleedStacks>0)heal(b,c,c.player.maxhp*.04);
 if(rank(b,'rot_recovery')&&c.enemy.v012Rot?.length)heal(b,c,c.player.maxhp*.04);
 if(rank(b,'second_breath'))heal(b,c,c.player.maxhp*.025*rank(b,'second_breath'));
}
function survive(b,c){if(!rank(b,'last_stand')||b.runtime.lastStand)return false;b.runtime.lastStand=true;c.player.hp=Math.max(1,c.player.maxhp*.06);c.log('💚 Last Stand (once per Expedition)');return true;}
function speed(b,now){return b?.runtime?.frenzyUntil>now?1.10:1;}
function enemyHealMultiplier(b,e){return 1-(e.v012Rot?.length ? Math.min(.7,.35*rank(b,'wither')) : 0);}
function nextCost(b){return Math.max(4,Math.round(8*(1-.12*rank(b,'efficient_cast'))));}
function resetWave(b,e){e.v012Rot=[];e.v012Shock=0;}
function clear(b){if(!b)return;b.picks.length=0;b.element=null;b.families=[];b.cooldowns=Object.create(null);b.runtime={frenzyUntil:0,counter:0,spellblade:false,magicHits:0,lastStand:false,lastSpellAt:-999};}
root.WandererV012Buildcraft=Object.freeze({CATALOG:P,FAMILIES,ELEMENTS:elements,create,rank,eligible,options,choose,element,mods,onAttack,onCast,onSecond,incoming,onDefend,onKill,survive,speed,enemyHealMultiplier,nextCost,resetWave,clear});
})(globalThis);
