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
 ['blood','sanguine_fury','Sanguine Fury','Critical hits inflict Bleed; damage against bleeding foes increases by 8%.'],
 ['decay','toxic_touch','Toxic Touch','Hits may apply Poison and one Rot stack (1.3s cooldown).'],
 ['decay','virulent_rot','Virulent Rot','Rot ticks deal 18% more damage per rank.'],
 ['decay','wasting_curse','Wasting Curse','Rotted enemies deal 8% less damage per rank.'],
 ['decay','wither','Withering Hex','Rot reduces healing by 35% and direct attack damage by 3% per rank (70% healing cap).'],
 ['decay','blight','Blight','Strike a rotted enemy for a capped corruption burst (7s cooldown).'],
 ['vitality','strong_heart','Strong Heart','Increase maximum Health by 10% per rank.'],
 ['vitality','renewal','Renewal','Recover 0.55% maximum Health per combat second per rank.'],
 ['vitality','last_stand','Last Stand','Survive one lethal hit per Expedition, recovering 6% HP.'],
 ['vitality','second_breath','Second Breath','Recover 2.5% maximum HP after each completed Wave per rank.'],
 ['vitality','life_bloom','Life Bloom','Every combat second restores 0.25% HP and up to 1.5 Mana per rank.'],
 ['aegis','iron_skin','Iron Skin','Increase Defense by 12% per rank.'],
 ['aegis','fortified','Fortified','Reduce incoming damage by 6% per rank.'],
 ['aegis','guarded_block','Guarded Block','Gain 6% Block chance and partial block protection per rank.'],
 ['aegis','barrier_pulse','Barrier Pulse','Gain Barrier equal to 2% max HP every 6 combat seconds.'],
 ['aegis','retaliation','Retaliation','Absorbed Barrier empowers the next hit by up to 15%.'],
 ['fury','quick_hands','Quick Hands','Increase attack speed by 8% per rank.'],
 ['fury','precision','Precision','Increase Critical chance by 6 percentage points per rank (65% cap).'],
 ['fury','brutal_crit','Brutal Critical','Critical strikes add 12% of base hit damage per rank.'],
 ['fury','double_strike','Double Strike','10% chance per rank for one non-recursive 30% bonus hit.'],
 ['fury','adrenaline','Adrenaline','Critical strikes grant 10% attack speed for 3s (3s cooldown).'],
 ['magic','arcane_focus','Arcane Focus','Increase elemental Spell Power by 15% per rank.'],
 ['magic','mana_spring','Mana Spring','Increase Mana regeneration by 18% per rank.'],
 ['magic','efficient_cast','Efficient Casting','Reduce temporary elemental cast cost by 12% per rank.'],
 ['magic','arcane_echo','Arcane Echo','Every fourth elemental hit echoes for 25% Spell Power (no recursion).'],
 ['magic','elemental_force','Elemental Force','Increase temporary Magic status potency by 15% per rank.'],
 ['magic','kindling','Kindling','Fire Burn gains 20% potency per rank.',[],'fire'],
 ['magic','deep_winter','Deep Winter','Funded Frost casts Chill; chilled foes take a bounded 18% Spell Power burst every 4s. Boss Chill lasts at most 1.2s.',[],'frost'],
 ['magic','overcharge','Overcharge','Funded Lightning casts add Static. Four player charges discharge for 38.4% Spell Power; charges persist between Realms.',[],'lightning'],
 ['blood','plague_rupture','Plague Rupture','Bleed + Rot unleash a burst on critical hits (8s cooldown).',['blood','decay']],
 ['blood','blood_ward','Blood Ward','Bleeding enemies generate Barrier every 5s.',['blood','aegis']],
 ['blood','hemovore','Hemovore','Kills on bleeding foes heal 4% max HP.',['blood','vitality']],
 ['blood','crimson_rush','Crimson Rush','Critical strikes against bleeding foes deal 15% bonus damage.',['blood','fury']],
 ['blood','hex_bleed','Hex Bleed','Funded Magic hits inflict Bleed (3s cooldown).',['blood','magic']],
 ['decay','rot_recovery','Rot Recovery','Defeating a rotted enemy heals 4% max HP.',['decay','vitality']],
 ['decay','rot_ward','Rot Ward','Rot ticks grant Barrier every 5s.',['decay','aegis']],
 ['decay','toxic_precision','Toxic Precision','Crits inflict Poison and Rot (2s cooldown).',['decay','fury']],
 ['decay','hex_bolt','Hex Bolt','Funded spells against Rot deal 25% Spell Power plus one Rot tick (3s cooldown).',['decay','magic']],
 ['vitality','sanctuary','Sanctuary','Recovering Health grants Barrier equal to 20% of the heal.',['vitality','aegis']],
 ['vitality','fervent_life','Fervent Life','Critical strikes restore 2% maximum HP; overhealing grants Barrier (4s cooldown).',['vitality','fury']],
 ['vitality','life_conduit','Life Conduit','Effective healing restores 4 Mana and empowers the next spell by 10% (3s cooldown).',['vitality','magic']],
 ['aegis','counterstrike','Counterstrike','Blocking grants one 18% base-hit counterstrike.',['aegis','fury']],
 ['aegis','runic_shield','Runic Shield','Funded elemental spells grant Barrier (3s cooldown).',['aegis','magic']],
 ['fury','spellblade','Spellblade','Each funded cast empowers the next weapon hit, including Staff and Wand, by 15%.',['fury','magic']],
 ['blood','carrion_detonation','Carrion Detonation','Consume Bleed and Rot for a bounded damage burst (8s cooldown).',['blood','decay']],
 ['blood','crimson_pact','Crimson Pact','Pay 2% max HP to inflict an immediate empowered Bleed (8s cooldown; requires more than 20% HP).',['blood','vitality']],
 ['blood','sanguine_reprisal','Sanguine Reprisal','Blocking or absorbing Barrier charges a counter-bleed.',['blood','aegis']],
 ['blood','reapers_cadence',"Reaper's Cadence",'Critical hits on wounded bleeding enemies add a bounded finisher and restore 2 Mana (7s cooldown).',['blood','fury']],
 ['blood','hemal_sigil','Hemal Sigil','Magic converts Bleed into elemental Fire, Frost or Lightning effects.',['blood','magic']],
 ['decay','rot_symbiosis','Rot Symbiosis','Rot ticks recover a little HP (6s cooldown).',['decay','vitality']],
 ['decay','rot_husk','Rot Husk','Breaking a Barrier while Rot is active grants a small new ward.',['decay','aegis']],
 ['decay','venom_shatter','Venom Shatter','Critical hits consume Rot for a bounded burst (5s cooldown).',['decay','fury']],
 ['decay','elemental_blight','Elemental Blight','Fire, Frost and Lightning manipulate accumulated Rot differently.',['decay','magic']],
 ['vitality','guardians_oath',"Guardian's Oath",'After a Barrier shatters, heal once per Wave.',['vitality','aegis']],
 ['vitality','redline','Redline','When wounded, deal a bounded burst but take increased damage briefly.',['vitality','fury']],
 ['vitality','lifeweave','Lifeweave','Convert HP into Mana when nearly empty (8s cooldown).',['vitality','magic']],
 ['aegis','iron_reversal','Iron Reversal','A successful Block charges a heavy counter at the cost of brief vulnerability.',['aegis','fury']],
 ['aegis','prismatic_rebound','Prismatic Rebound','Damage absorbed by Barrier empowers your next Magic cast.',['aegis','magic']],
 ['fury','spell_surge','Spell Surge','A critical strike charges your next elemental cast.',['fury','magic']]
].map(([family,id,name,description,requires=[],element=null])=>Object.freeze({family,id,name,description,requires,element,max:null}));
const BY_ID=Object.fromEntries(P.map(p=>[p.id,p]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function create(){return {version:2,element:null,initialFamily:null,initialPassive:null,unlockedFamilies:[],picks:[],cooldowns:Object.create(null),runtime:{frenzyUntil:0,counterBlock:0,counterBarrier:0,spellblade:false,magicHits:0,staticCharges:0,adrenalineUntil:0,conduit:false,lastStand:false,lastSpellAt:-999}};}
function rank(b,id){const n=b?.picks?.filter(x=>x===id).length||0;return n&&b.runtime?.echo?.id===id&&b.runtime.echo.remaining>0?Math.max(0,n+b.runtime.echo.power):n;}
function hasFamily(b,family){return Array.isArray(b?.families)&&b.families.includes(family);}
function eligible(b,family){
 if(!FAMILIES.includes(family)||!hasFamily(b,family)||family==='magic'&&!b.element)return [];
 if(!Array.isArray(b.unlockedFamilies)||!b.unlockedFamilies.includes(family))return [];
 const hybrids=[...new Set(b.picks)].map(id=>BY_ID[id]).filter(p=>p?.requires.length),pairs=new Set(hybrids.map(p=>[...p.requires].sort().join(':')));
 const owns=id=>rank(b,id)>0;
 const barrier=['barrier_pulse','blood_ward','rot_ward','runic_shield'].some(owns),healing=['renewal','life_bloom','second_breath','blood_drinker','rot_recovery'].some(owns);
 const prerequisites=p=>{
  if(['retaliation','rot_husk','prismatic_rebound','guardians_oath'].includes(p.id)&&!barrier)return false;
  if(['counterstrike','iron_reversal'].includes(p.id)&&!owns('guarded_block'))return false;
  if(['sanctuary','life_conduit'].includes(p.id)&&!healing)return false;
  return true;
 };
 return P.filter(p=>prerequisites(p)&&p.family===family&&(!p.requires.length||(!b.runtime.hybridRules||b.runtime.hybridWindow)&&(!pairs.has([...p.requires].sort().join(':'))?hybrids.length<3:hybrids.some(h=>h.id===p.id)))&&p.requires.every(f=>b.unlockedFamilies.includes(f))&&(!p.element||p.element===b.element));
}
function options(b,family,rng=Math.random){
 const acquired=[...new Set(b.picks||[])].map(id=>BY_ID[id]).filter(p=>p?.requires.length).length;
 const gate=[6,8,10][acquired]??99;
 const open=(p)=>!p.requires.length||(b.realmIndex||0)>=gate;
 const primary=eligible(b,family).filter(open);
 const pool=primary.length>=3?primary:[...primary,...b.families.filter(f=>f!==family).flatMap(f=>eligible(b,f).filter(open))];
 if(pool.length<3)throw Error('No three implemented passives available');
 const unowned=pool.filter(p=>!rank(b,p.id)),weighted=unowned.length>=3?unowned:pool;
 const chosen=[],hybrids=b.runtime.hybridRules&&b.runtime.hybridWindow?b.families.flatMap(f=>eligible(b,f)).filter(p=>p.requires.length):[];if(hybrids.length)chosen.push(hybrids[Math.floor(rng()*hybrids.length)]);
 const specific=weighted.filter(p=>p.element===b.element&&p.element);
 if(family==='magic'&&specific.length&&chosen.length===0)chosen.push(specific[Math.floor(rng()*specific.length)]);
 const rest=weighted.filter(p=>!chosen.includes(p));
 while(chosen.length<3){let index=Math.floor(rng()*rest.length);chosen.push(rest.splice(index,1)[0]);}
 const legacyHybrids=weighted.filter(p=>p.requires.length);
 if(legacyHybrids.length&&!chosen.some(p=>p.requires.length))chosen[2]=legacyHybrids[Math.floor(rng()*legacyHybrids.length)];
 return chosen;
}
function choose(b,family,id,offers){
 const p=BY_ID[id];
 if(!p||!b.unlockedFamilies?.includes(p.family)||!Array.isArray(offers)||!offers.some(x=>x.id===id)||!eligible(b,p.family).some(x=>x.id===id))throw Error('Passive unavailable');
 b.picks.push(id);return p;
}
function element(b,id){if(!hasFamily(b,'magic')||!elements.includes(id)||b.element!==null)throw Error('Magic element already chosen or ineligible');b.element=id;return id;}
function initialId(family,element){return family==='magic'?({fire:'kindling',frost:'deep_winter',lightning:'overcharge'})[element]:({blood:'bleeding_edge',decay:'toxic_touch',vitality:'strong_heart',aegis:'iron_skin',fury:'quick_hands'})[family];}
// Unlock the enabling passive only after successfully clearing the first Realm of this family.
function initial(b,family){
 if(!hasFamily(b,family)||family==='magic'&&!b.element)throw Error('Initial affinity unavailable');
 b.unlockedFamilies??=[];
 if(b.unlockedFamilies.includes(family))return null;
 const id=initialId(family,b.element);if(!BY_ID[id])throw Error('Unknown initial affinity');
 if(!b.initialFamily){b.initialFamily=family;b.initialPassive=id;}
 b.unlockedFamilies.push(family);b.picks.push(id);return BY_ID[id];
}
function ready(b,id,now,seconds){if((b.cooldowns[id]??-1e10)>now)return false;b.cooldowns[id]=now+seconds;return true;}
function mods(b,base){
 const s={...base},h=rank(b,'strong_heart'),a=rank(b,'iron_skin'),q=rank(b,'quick_hands'),p=rank(b,'precision');
 s.maxhp=Math.round(s.maxhp*(1+.10*Math.sqrt(h)));
 s.defense=Math.round(s.defense*(1+.12*Math.sqrt(a)));
 s.attacksPerSec=Math.min(5,s.attacksPerSec*(1+.08*q));
 s.crit=Math.min(65,s.crit+Math.round(19*(1-Math.exp(-p/3))));
 if(b.unlockedFamilies?.includes('magic')){
  // Do not change s.caster: Staff/Wand keep their original funded-attack path.
  s.mana=Math.max(30,Math.round(s.mana||20+s.int*7+s.manaFlat));
  s.manaRegen=+(Math.max(1.5,s.manaRegen||1.5+s.int*.23)*(1+.18*rank(b,'mana_spring'))).toFixed(2);
  s.spellPower=Math.round((s.spellPower||3+s.int*1.9+s.spellFlat)*(1+.15*Math.sqrt(rank(b,'arcane_focus'))));
  s.phase2Magic=true;
 }
 const attackBuff=clamp(Number(b.runtime?.eventAttack)||0,-.15,.15),defenseBuff=clamp(Number(b.runtime?.eventDefense)||0,-.15,.15);
 s.attack=Math.max(1,Math.round(s.attack*(1+attackBuff)));
 s.defense=Math.max(1,Math.round(s.defense*(1+defenseBuff)));
 if(hasFamily(b,'magic'))s.spellPower=Math.max(1,Math.round(s.spellPower*(1+attackBuff)));
 s.blockChance=Math.min(65,(s.blockChance||0)+Math.round(24*(1-Math.exp(-rank(b,'guarded_block')/4))));
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
 if(healed>0&&rank(b,'life_conduit')&&ready(b,'life_conduit',c.now,3)){c.mana(4);b.runtime.conduit=true;}
 return healed;
}
function activated(b,id){b.runtime.passiveTelemetry??={};const t=b.runtime.passiveTelemetry[id]??={activations:0,combatSeconds:0};t.activations++;return true;}
function onAttack(b,c){
 const e=c.enemy,base=Math.max(1,c.base||1),crit=!!c.critical;
 if(rank(b,'bleeding_edge')&&ready(b,'bleedEdge',c.now,rank(b,'bleeding_edge')?.9:1.8)&&c.random()<Math.min(.8,.22+.12*Math.sqrt(rank(b,'bleeding_edge')))&&activated(b,'bleeding_edge')) c.dot('bleed',base*.16*(1+.20*rank(b,'deep_cuts')));
 if(rank(b,'sanguine_fury')&&crit&&ready(b,'sanguineFury',c.now,2.5)&&activated(b,'sanguine_fury')){
  c.dot('bleed',base*.14*(1+.20*rank(b,'deep_cuts')));c.damage(base*.08,'🩸 Sanguine Fury');
 }
 if(rank(b,'executioner')&&e.bleedStacks>0&&e.hp<=e.maxhp*.30&&ready(b,'execute',c.now,6)&&activated(b,'executioner'))c.damage(Math.min(base*.32,e.maxhp*.025),'🩸 Execute');
 if(rank(b,'blood_drinker')&&e.bleedStacks>0&&ready(b,'bloodHeal',c.now,4)&&activated(b,'blood_drinker'))heal(b,c,Math.min(c.player.maxhp*.015,base*.10));
 if(rank(b,'toxic_touch')&&ready(b,'toxicTouch',c.now,rank(b,'toxic_touch')?1.3:2)&&c.random()<Math.min(.8,.28+.14*Math.sqrt(rank(b,'toxic_touch')))&&activated(b,'toxic_touch')){c.dot('poison',base*.12);applyRot(b,c,base*.065);}
 if(rank(b,'blight')&&e.v012Rot?.length&&ready(b,'blight',c.now,7)&&activated(b,'blight'))c.damage(Math.min(base*.38,e.maxhp*.025),'☠ Blight');
 if(rank(b,'toxic_precision')&&crit&&ready(b,'toxicPrecision',c.now,2)&&activated(b,'toxic_precision')){c.dot('poison',base*.11);applyRot(b,c,base*.06);}
 if(rank(b,'plague_rupture')&&crit&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'plagueRupture',c.now,8)&&activated(b,'plague_rupture'))c.damage(Math.min(base*.45,e.maxhp*.03),'🩸 Plague Rupture');
 if(rank(b,'crimson_rush')&&crit&&e.bleedStacks>0&&activated(b,'crimson_rush'))c.damage(base*.15,'🩸 Crimson Rush');
 if(rank(b,'brutal_crit')&&crit&&activated(b,'brutal_crit'))c.damage(base*Math.min(.65,.12*Math.sqrt(rank(b,'brutal_crit'))),'⚔ Brutal Critical');
 if(rank(b,'double_strike')&&c.random()<Math.min(.60,.10*Math.sqrt(rank(b,'double_strike')))&&activated(b,'double_strike'))c.damage(base*.30,'🗡 Extra Strike');
 if(rank(b,'fervent_life')&&crit&&ready(b,'ferventLife',c.now,4)&&activated(b,'fervent_life')){const amount=c.player.maxhp*.02,actual=heal(b,c,amount);if(actual<amount)c.barrier((amount-actual)*.5);}
 if(rank(b,'adrenaline')&&crit&&ready(b,'adrenaline',c.now,3)&&activated(b,'adrenaline'))b.runtime.adrenalineUntil=c.now+3;
 if(rank(b,'counterstrike')&&b.runtime.counterBlock&&activated(b,'counterstrike')){b.runtime.counterBlock=0;c.damage(base*.18,'🛡 Counterstrike');}
 if(rank(b,'retaliation')&&b.runtime.counterBarrier&&activated(b,'retaliation')){b.runtime.counterBarrier=0;c.damage(base*.15,'🛡 Retaliation');}
 if(rank(b,'spellblade')&&b.runtime.spellblade&&activated(b,'spellblade')){b.runtime.spellblade=false;c.damage(base*.15,'✨ Spellblade');}
 if(rank(b,'carrion_detonation')&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'carrionDetonation',c.now,8)&&activated(b,'carrion_detonation')){
  const bleed=e.dots?.bleed?.shift();e.bleedStacks=Math.max(0,e.bleedStacks-1);const rot=e.v012Rot.shift();const owed=(bleed?bleed.damage*bleed.remaining:0)+rot.damage*rot.remaining;c.damage(owed+Math.min(base*.25,e.maxhp*.02),'☠ Carrion Detonation');
 }
 if(rank(b,'crimson_pact')&&c.player.hp>c.player.maxhp*.20&&ready(b,'crimsonPact',c.now,8)&&activated(b,'crimson_pact')){
  c.player.hp=Math.max(1,c.player.hp-c.player.maxhp*.02);c.dot('bleed',base*.32);
 }
 if(rank(b,'sanguine_reprisal')&&b.runtime.reprisalReady&&activated(b,'sanguine_reprisal')){
  b.runtime.reprisalReady=false;c.dot('bleed',base*.3);c.damage(base*.18,'🩸 Sanguine Reprisal');
 }
 if(rank(b,'reapers_cadence')&&crit&&e.bleedStacks>0&&e.hp<=e.maxhp*.5&&ready(b,'reapersCadence',c.now,7)&&activated(b,'reapers_cadence'))
  {c.damage(Math.min(base*.22,e.maxhp*.02),"🩸 Reaper's Cadence");c.mana(2);}
 if(rank(b,'venom_shatter')&&crit&&e.v012Rot?.length&&ready(b,'venomShatter',c.now,5)&&activated(b,'venom_shatter')){
  const rot=e.v012Rot.shift();c.damage(rot.damage*rot.remaining+Math.min(base*.20,e.maxhp*.015),'☠ Venom Shatter');
 }
 if(rank(b,'redline')&&c.player.hp<=c.player.maxhp*.5&&ready(b,'redline',c.now,8)&&activated(b,'redline')){
  c.damage(base*.33,'🩸 Redline');b.runtime.redlineUntil=c.now+3;
 }
 if(rank(b,'iron_reversal')&&b.runtime.ironReady&&activated(b,'iron_reversal')){
  b.runtime.ironReady=false;c.damage(base*.35,'🛡 Iron Reversal');b.runtime.ironExposedUntil=c.now+3;
 }
 if(rank(b,'spell_surge')&&crit&&!b.runtime.spellSurge&&activated(b,'spell_surge')){
  b.runtime.spellSurge=true;b.runtime.spellSurgeArmedAt=c.now;
 }
}
function onCast(b,c){
 if(c.funded!==true||!hasFamily(b,'magic')||!elements.includes(b.element))return;
 const power=Math.max(1,c.power)*(1+.15*rank(b,'elemental_force'))*(c.amp||1)*(b.runtime.conduit?1.10:1);b.runtime.conduit=false;
 const e=c.enemy; b.runtime.magicHits++;
 if(b.element==='fire'&&rank(b,'kindling')&&activated(b,'kindling'))c.dot('burn',power*.15*(1+.20*rank(b,'kindling')));
 else if(b.element==='frost'&&rank(b,'deep_winter')&&activated(b,'deep_winter')){
  if(e.slowTime>0&&ready(b,'winterBurst',c.now,4))c.damage(Math.min(power*.18,e.maxhp*(e.boss?.015:.05)),'❄ Winter Fracture');
  c.chill(e.boss?1.2:Math.min(5,3.5*(c.amp||1)));
 }else if(b.element==='lightning'&&rank(b,'overcharge')&&activated(b,'overcharge')){
  b.runtime.staticCharges=Math.min(4,(b.runtime.staticCharges||0)+1);
  if(b.runtime.staticCharges===4){b.runtime.staticCharges=0;c.damage(Math.min(power*.32*(1+.20*rank(b,'overcharge')),e.maxhp*.035),'⚡ Static Discharge');}
 }
 if(rank(b,'arcane_echo')&&b.runtime.magicHits%4===0&&activated(b,'arcane_echo'))c.damage(power*.25,'✨ Arcane Echo');
 if(rank(b,'hex_bleed')&&ready(b,'hexBleed',c.now,3)&&activated(b,'hex_bleed'))c.dot('bleed',power*.11);
 if(rank(b,'hex_bolt')&&e.v012Rot?.length&&ready(b,'hexBolt',c.now,3)&&activated(b,'hex_bolt'))c.damage(power*.25+c.enemy.v012Rot.reduce((n,r)=>n+r.damage,0),'☠ Hex Bolt');
 if(rank(b,'runic_shield')&&ready(b,'runicShield',c.now,3)&&activated(b,'runic_shield'))c.barrier(c.player.maxhp*.02);
 if(rank(b,'hemal_sigil')&&e.bleedStacks>0&&ready(b,'hemalSigil',c.now,6)&&activated(b,'hemal_sigil')){
  const consumed=e.dots?.bleed?.shift();e.bleedStacks=Math.max(0,e.bleedStacks-1);if(consumed)c.damage(consumed.damage*consumed.remaining,'🩸 Hemal conversion');
  if(b.element==='fire')c.dot('burn',power*.34);
  else if(b.element==='frost')c.chill(2.5);
  else c.damage(Math.min(power*.56,e.maxhp*.03),'🩸 Hemal Sigil');
 }
 if(rank(b,'elemental_blight')&&e.v012Rot?.length&&ready(b,'elementalBlight',c.now,7)&&activated(b,'elemental_blight')){
  if(b.element==='fire'){const rot=e.v012Rot.shift();c.damage(Math.min(power*.32+rot.damage*3,e.maxhp*.032),'🔥 Blight');}
  else if(b.element==='frost')e.v012Rot[0].remaining=Math.min(6,e.v012Rot[0].remaining+2);
  else {e.v012Rot.shift();c.damage(Math.min(power*.68,e.maxhp*.035),'⚡ Blight');}
 }
 if(rank(b,'prismatic_rebound')&&b.runtime.prismaticCharge>0&&activated(b,'prismatic_rebound')){
  c.damage(Math.min(power*.65,b.runtime.prismaticCharge),'💠 Prismatic Rebound');b.runtime.prismaticCharge=0;
 }
 if(rank(b,'spell_surge')&&b.runtime.spellSurge&&c.now>(b.runtime.spellSurgeArmedAt??-1e10)+.001&&activated(b,'spell_surge')){
  b.runtime.spellSurge=false;c.damage(power*.3,'✨ Spell Surge');
 }
 if(rank(b,'spellblade')&&activated(b,'spellblade'))b.runtime.spellblade=true;
}
function onSecond(b,c){
 b.runtime.passiveTelemetry??={};for(const id of b.picks){const t=b.runtime.passiveTelemetry[id]??={activations:0,combatSeconds:0};t.combatSeconds+=1/b.picks.filter(p=>p===id).length;}
 const e=c.enemy;
 if(e.v012Rot?.length){
  const rot=e.v012Rot;
  const damage=rot.reduce((sum,s)=>sum+s.damage,0);
  e.v012Rot=rot.map(s=>({...s,remaining:s.remaining-1})).filter(s=>s.remaining>0);
  c.dotDamage(damage,'☠ Rot');
  if(rank(b,'rot_ward')&&ready(b,'rotWard',c.now,5)&&activated(b,'rot_ward'))c.barrier(c.player.maxhp*.015);
  if(rank(b,'rot_symbiosis')&&ready(b,'rotSymbiosis',c.now,6)&&activated(b,'rot_symbiosis'))heal(b,c,c.player.maxhp*.018);
 }
 if(rank(b,'renewal')&&activated(b,'renewal'))heal(b,c,c.player.maxhp*Math.min(.035,.0055*Math.sqrt(rank(b,'renewal'))));
 if(rank(b,'life_bloom')&&activated(b,'life_bloom')){heal(b,c,c.player.maxhp*Math.min(.018,.0025*Math.sqrt(rank(b,'life_bloom'))));c.mana(Math.min(10,1.5*Math.sqrt(rank(b,'life_bloom'))));}
 if(rank(b,'barrier_pulse')&&ready(b,'barrierPulse',c.now,6)&&activated(b,'barrier_pulse'))c.barrier(c.player.maxhp*.02);
 if(rank(b,'blood_ward')&&e.bleedStacks>0&&ready(b,'bloodWard',c.now,5)&&activated(b,'blood_ward'))c.barrier(c.player.maxhp*.018);
 if(rank(b,'lifeweave')&&c.player.mp<c.player.maxmp*.30&&c.player.hp>c.player.maxhp*.20&&ready(b,'lifeweave',c.now,8)&&activated(b,'lifeweave')){
  c.player.hp=Math.max(1,c.player.hp-c.player.maxhp*.03);c.mana(10);
 }
}
function incoming(b,c,raw){
 let reduction=.06*rank(b,'fortified')+(.08*rank(b,'wasting_curse')+.03*rank(b,'wither'))*(c.enemy.v012Rot?.length?1:0);
 const vulnerability=b.runtime?.ironExposedUntil>c.now||b.runtime?.redlineUntil>c.now?1.10:1;return Math.max(1,Math.round(raw*(1-clamp(reduction,0,.28))*vulnerability));
}
function onDefend(b,c,blocked,barrierAbsorbed){
 if(blocked>0&&rank(b,'counterstrike'))b.runtime.counterBlock=1;
 if(barrierAbsorbed>0&&rank(b,'retaliation'))b.runtime.counterBarrier=1;
 if(rank(b,'sanguine_reprisal')&&(blocked>0||barrierAbsorbed>0)&&activated(b,'sanguine_reprisal'))b.runtime.reprisalReady=true;
 if(rank(b,'iron_reversal')&&blocked>0&&activated(b,'iron_reversal'))b.runtime.ironReady=true;
 if(rank(b,'prismatic_rebound')&&barrierAbsorbed>0&&activated(b,'prismatic_rebound'))
  b.runtime.prismaticCharge=Math.min(c.player.maxhp*.06,(b.runtime.prismaticCharge||0)+barrierAbsorbed*.45);
 if(rank(b,'rot_husk')&&barrierAbsorbed>0&&c.enemy?.v012Rot?.length&&c.player.barrier<=0&&ready(b,'rotHusk',c.now,9)&&activated(b,'rot_husk'))c.barrier(c.player.maxhp*.035);
 if(rank(b,'guardians_oath')&&barrierAbsorbed>0&&c.player.barrier<=0&&!b.runtime.guardianUsed&&activated(b,'guardians_oath')){
  b.runtime.guardianUsed=true;heal(b,c,c.player.maxhp*.045);
 }
}
function onKill(b,c){
 if(rank(b,'hemovore')&&c.enemy.bleedStacks>0&&activated(b,'hemovore'))heal(b,c,c.player.maxhp*.04);
 if(rank(b,'rot_recovery')&&c.enemy.v012Rot?.length&&activated(b,'rot_recovery'))heal(b,c,c.player.maxhp*.04);
 if(rank(b,'second_breath')&&activated(b,'second_breath'))heal(b,c,c.player.maxhp*.025*rank(b,'second_breath'));
}
function survive(b,c){if(!rank(b,'last_stand')||b.runtime.lastStand)return false;activated(b,'last_stand');b.runtime.lastStand=true;c.player.hp=Math.max(1,c.player.maxhp*Math.min(.20,.06+.018*Math.sqrt(Math.max(0,rank(b,'last_stand')-1))));c.log('💚 Last Stand (once per Expedition)');return true;}
function speed(b,now){return b?.runtime?.adrenalineUntil>now||b?.runtime?.frenzyUntil>now?Math.min(1.25,1.10+.035*Math.sqrt(Math.max(0,rank(b,'adrenaline')-1))):1;}
function enemyHealMultiplier(b,e){return 1-(e.v012Rot?.length ? Math.min(.7,.35*rank(b,'wither')) : 0);}
function nextCost(b){return Math.max(4,Math.round(8*(1-Math.min(.70,.12*Math.sqrt(rank(b,'efficient_cast'))))));}
function resetWave(b,e){e.v012Rot=[];e.v012Shock=0;b.runtime.guardianUsed=false;}
function canCast(b){return !!b&&!!b.element&&['kindling','deep_winter','overcharge','arcane_focus','arcane_echo','spell_surge','spellblade','hex_bolt','hex_bleed','hemal_sigil','elemental_blight','prismatic_rebound','runic_shield'].some(id=>rank(b,id));}
function validate(b){
 if(!b||!Array.isArray(b.families)||b.families.length>3||new Set(b.families).size!==b.families.length||!b.families.every(f=>FAMILIES.includes(f))||b.element!==null&&(!elements.includes(b.element)||!hasFamily(b,'magic'))||!Array.isArray(b.picks)||b.picks.length>20)throw Error('Invalid saved build');
 if(!Array.isArray(b.unlockedFamilies))b.unlockedFamilies=[...new Set(b.picks.map(id=>BY_ID[id]?.family).filter(Boolean))];
 if(new Set(b.unlockedFamilies).size!==b.unlockedFamilies.length||!b.unlockedFamilies.every(f=>hasFamily(b,f)))throw Error('Invalid unlocked affinity');
 for(const id of b.picks){const p=BY_ID[id];if(!p||!hasFamily(b,p.family)||!b.unlockedFamilies.includes(p.family)||p.requires.some(f=>!b.unlockedFamilies.includes(f))||p.element&&p.element!==b.element)throw Error('Invalid saved passive');}
 if(b.runtime.hybridRules||b.version===2){const h=[...new Set(b.picks)].map(id=>BY_ID[id]).filter(p=>p?.requires.length);if(h.length>3||new Set(h.map(p=>[...p.requires].sort().join(':'))).size!==h.length)throw Error('Invalid hybrid combinations');}
 if(b.initialPassive!==null&&(b.initialPassive!==initialId(b.initialFamily,b.element)||!b.picks.includes(b.initialPassive)||!hasFamily(b,b.initialFamily)))throw Error('Invalid initial passive');
 if(!b.cooldowns||typeof b.cooldowns!=='object'||!Object.values(b.cooldowns).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)||!b.runtime||typeof b.runtime!=='object'||!['frenzyUntil','magicHits','lastSpellAt'].every(k=>typeof b.runtime[k]==='number'&&Number.isFinite(b.runtime[k]))||typeof b.runtime.lastStand!=='boolean')throw Error('Invalid saved cooldowns');
 if(b.runtime.staticCharges===undefined)b.runtime.staticCharges=0;
 if(!Number.isInteger(b.runtime.staticCharges)||b.runtime.staticCharges<0||b.runtime.staticCharges>3)throw Error('Invalid Static charges');
 return b;
}
function clear(b){if(!b)return;b.picks.length=0;b.element=null;b.initialFamily=null;b.initialPassive=null;b.unlockedFamilies=[];b.families=[];b.cooldowns=Object.create(null);b.runtime={frenzyUntil:0,counterBlock:0,counterBarrier:0,spellblade:false,magicHits:0,staticCharges:0,adrenalineUntil:0,conduit:false,lastStand:false,lastSpellAt:-999};}
root.WandererV012Buildcraft=Object.freeze({CATALOG:P,FAMILIES,ELEMENTS:elements,create,initial,initialId,rank,eligible,options,choose,element,mods,onAttack,onCast,onSecond,incoming,onDefend,onKill,survive,speed,enemyHealMultiplier,nextCost,resetWave,canCast,validate,clear});
})(globalThis);
