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
].map(([family,id,name,description,requires=[],element=null])=>Object.freeze({family,id,name,description,requires,element,max:requires.length||['executioner','blight','last_stand','retaliation'].includes(id)?1:5}));
const descriptions={bleeding_edge:'Hits: Bleed chance; 16% base per tick, ICD 0.9s.',deep_cuts:'All player Bleed +15% per rank, applied on creation.',executioner:'Bleeding foe at ≤30% HP: bounded burst, ICD 6s.',blood_drinker:'Hit bleeding foe: bounded heal, ICD 4s; healing reduction applies.',sanguine_fury:'Critical: Bleed 14% base + direct burst, ICD 2.5s.',toxic_touch:'Hit: Poison 12% and Rot 6.5% base; ICD 1.3s.',virulent_rot:'New Rot stacks +15% damage per rank.',wasting_curse:'Rotted enemy deals less damage; combined reduction cap 28%.',wither:'Rot reduces enemy healing and direct damage; player healing unaffected.',blight:'Hit rotted foe: bounded burst, ICD 7s.',strong_heart:'Maximum HP scales with square root of rank; no free healing.',renewal:'Continuous healing per second; healing reduction applies.',last_stand:'Survive one lethal hit per Expedition at 6% MaxHP.',second_breath:'Heal once per completed Wave.',life_bloom:'Restore HP and Mana each combat second.',iron_skin:'Defense scales with square root of rank.',fortified:'Incoming damage −4% per rank, within global 28% cap.',guarded_block:'Bonus block chance; total cap 65%, existing block reduction.',barrier_pulse:'Barrier every 6s; engine Barrier cap applies.',retaliation:'Real Barrier absorption empowers next hit by 15% base, once.',quick_hands:'Attack speed +8% per rank; total cap 5/s.',precision:'Extra critical chance, total cap 65%.',brutal_crit:'Real critical adds non-recursive base damage.',double_strike:'Chance of one 30% extra hit, no recursive procs.',adrenaline:'Real critical: 3s attack speed buff, ICD 3s.',arcane_focus:'Elemental spell power scales with square root of rank.',mana_spring:'Mana regeneration scales with square root of rank.',efficient_cast:'Funded elemental cast Mana cost: 7/6/5/4/3.',arcane_echo:'Every fourth funded elemental hit echoes without recursion.',elemental_force:'Elemental power +12% per rank, once per funded cast.',kindling:'Funded Fire cast applies Burn.',deep_winter:'Funded Frost: Chill, bounded burst vs chilled foe, ICD 4s; boss Chill ≤1.2s.',overcharge:'Four funded Lightning casts discharge Static; charges persist between Realms.'};
const TAGS={
 PRODUCE_BLEED:['bleeding_edge','sanguine_fury','hex_bleed','crimson_pact','sanguine_reprisal'],CONSUMES_BLEED:['deep_cuts','executioner','blood_drinker','blood_ward','hemovore','plague_rupture','carrion_detonation','crimson_rush','reapers_cadence','hemal_sigil'],
 PRODUCE_ROT:['toxic_touch','toxic_precision'],CONSUMES_ROT:['virulent_rot','wasting_curse','wither','blight','plague_rupture','carrion_detonation','rot_recovery','rot_symbiosis','rot_ward','rot_husk','venom_shatter','hex_bolt','elemental_blight'],
 CRIT_SOURCE:['precision'],CRIT_PAYOFF:['sanguine_fury','brutal_crit','adrenaline','crimson_rush','reapers_cadence','toxic_precision','venom_shatter','plague_rupture','fervent_life','spell_surge'],
 BARRIER_SOURCE:['barrier_pulse','blood_ward','rot_ward','runic_shield','sanctuary','fervent_life'],BARRIER_PAYOFF:['retaliation','rot_husk','prismatic_rebound','guardians_oath','sanguine_reprisal'],
 HEAL_SOURCE:['renewal','life_bloom','second_breath','blood_drinker','hemovore','rot_recovery','rot_symbiosis','fervent_life'],HEAL_PAYOFF:['sanctuary','life_conduit'],
 FUNDED_CAST:['kindling','deep_winter','overcharge'],MAGIC_PAYOFF:['arcane_focus','mana_spring','efficient_cast','arcane_echo','elemental_force','hex_bleed','hemal_sigil','hex_bolt','elemental_blight','life_conduit','lifeweave','runic_shield','prismatic_rebound','spellblade','spell_surge'],
 BLOCK_SOURCE:['guarded_block'],BLOCK_PAYOFF:['counterstrike','iron_reversal','sanguine_reprisal']
};
const CATALOG=P.map(p=>Object.freeze({...p,description:descriptions[p.id]||p.description,tags:Object.freeze(Object.keys(TAGS).filter(tag=>TAGS[tag].includes(p.id)))}));
const BY_ID=Object.fromEntries(CATALOG.map(p=>[p.id,p]));
const clamp=(n,min,max)=>Math.max(min,Math.min(max,n));
function create(){return {version:3,element:null,initialFamily:null,initialPassive:null,unlockedFamilies:[],picks:[],cooldowns:Object.create(null),runtime:{frenzyUntil:0,counterBlock:0,counterBarrier:0,spellblade:false,magicHits:0,staticCharges:0,adrenalineUntil:0,conduit:false,lastStand:false,lastSpellAt:-999}};}
function ownedRank(b,id){return b?.picks?.filter(x=>x===id).length||0;}
function rank(b,id){
 const p=BY_ID[id];if(!p)return 0;
 if(p.requires.length){const pairs=new Set();let count=0;for(const pick of new Set(b?.picks||[])){const q=BY_ID[pick];if(!q?.requires.length)continue;const pair=[...q.requires].sort().join(':');if(pairs.has(pair))continue;pairs.add(pair);if(++count>3)return 0;if(pick===id)return 1;}return 0;}
 const n=ownedRank(b,id),echo=b?.runtime?.echo;
 return clamp(n&&echo?.id===id&&echo.remaining>0?n+echo.power:n,0,p.max);
}
function values(id,r){const t=Math.max(0,r-1),sqrt=Math.sqrt(r);return ({
 bleeding_edge:{chance:.42+.04*t,bleed:.16,icd:.9},deep_cuts:{bleedBonus:.15*r},executioner:{burst:.32,enemyCap:.025,threshold:.30,icd:6},blood_drinker:{hp:.008+.0025*t,base:.10+.025*t,icd:4},sanguine_fury:{bleed:.14,burst:.08+.02*t,icd:2.5},
 toxic_touch:{chance:.42+.04*t,poison:.12,rot:.065,icd:1.3},virulent_rot:{rotBonus:.15*r},wasting_curse:{reduction:.04*r},wither:{healingReduction:.20+.10*t,reduction:.02*r},blight:{burst:.38,enemyCap:.025,icd:7},
 strong_heart:{maxhp:.10*sqrt},renewal:{heal:Math.min(.0125,.0055*sqrt)},last_stand:{hp:.06,uses:1},second_breath:{heal:.015+.004*t},life_bloom:{heal:Math.min(.006,.0025*sqrt),mana:Math.min(3.4,1.5*sqrt)},
 iron_skin:{defense:.12*sqrt},fortified:{reduction:.04*r},guarded_block:{block:Math.round(24*(1-Math.exp(-r/4)))},barrier_pulse:{barrier:.02+.006*t,icd:6},retaliation:{burst:.15},
 quick_hands:{speed:.08*r},precision:{crit:Math.round(19*(1-Math.exp(-r/3)))},brutal_crit:{burst:Math.min(.65,.12*sqrt)},double_strike:{chance:Math.min(.60,.10*sqrt),burst:.30},adrenaline:{speed:.10+.025*t,duration:3,icd:3},
 arcane_focus:{power:.15*sqrt},mana_spring:{regen:.12*sqrt},efficient_cast:{cost:8-r},arcane_echo:{power:.25+.05*t,hits:4},elemental_force:{power:.12*r},kindling:{burn:.15*(1+.15*r)},deep_winter:{burst:.18+.03*t,bossCap:.015,normalCap:.05,icd:4},overcharge:{burst:.32+.06*t,enemyCap:.035,charges:4}
 })[id]||{};}
function preview(b,id,base={}){
 const p=BY_ID[id],current=ownedRank(b,id),next=Math.min(p?.max||0,current+1),before=values(id,current),after=values(id,next);
 let useful=!!p&&current<p.max;
 if(id==='precision'&&(base.crit||0)>=65||id==='guarded_block'&&(base.blockChance||0)>=65||id==='quick_hands'&&(base.attacksPerSec||0)>=5)useful=false;
 const reduction=.04*rank(b,'fortified')+.04*rank(b,'wasting_curse')+.02*rank(b,'wither');
 if(['fortified','wasting_curse','wither'].includes(id)&&reduction>=.28&&id!=='wither')useful=false;
 if(base.maxhp&&['strong_heart','iron_skin','quick_hands','precision','guarded_block','arcane_focus','mana_spring'].includes(id)){const field={strong_heart:'maxhp',iron_skin:'defense',quick_hands:'attacksPerSec',precision:'crit',guarded_block:'blockChance',arcane_focus:'spellPower',mana_spring:'manaRegen'}[id],up={...b,picks:[...(b.picks||[]),id]};if(!(mods(up,base)[field]>mods(b,base)[field]))useful=false;}
 if(id==='adrenaline'&&base.maxhp){const speed=mods(b,base).attacksPerSec;if(Math.min(5,speed*(1+after.speed))<=Math.min(5,speed*(1+(current?before.speed:0))))useful=false;}
 const text=Object.entries(after).map(([key,v])=>key+': '+(current?Number((before[key]||0).toFixed(4))+' → ':'')+(typeof v==='number'?Number(v.toFixed(4)):v)).join(' · ');
 return {current,next,max:p?.max,useful,before,after,description:text};
}
function canModify(b,id,power,base={}){const p=BY_ID[id],n=ownedRank(b,id);return !!p&&p.max===5&&n>0&&clamp(n+power,0,p.max)!==rank(b,id)&&(power<0||preview(b,id,base).useful);}
function bleedDamage(b,amount){return amount*(1+.15*rank(b,'deep_cuts'));}
function elementalPower(b,power){return power*(1+.12*rank(b,'elemental_force'))*(b.runtime.conduit?1.10:1);}
function hasFamily(b,family){return Array.isArray(b?.families)&&b.families.includes(family);}
function capabilities(b){
 const owns=id=>rank(b,id)>0,tag=t=>(TAGS[t]||[]).some(owns),stats=b.runtime.draftStats||{};
 const funded=b.unlockedFamilies?.includes('magic')&&elements.includes(b.element)&&b.runtime.fundedAvailable!==false;
 const crit=stats.crit===undefined||stats.crit>0||owns('precision'),block=(stats.blockChance||0)>0||owns('guarded_block');
 const bleed=owns('bleeding_edge')||owns('sanguine_fury')&&crit||owns('crimson_pact')||owns('hex_bleed')&&funded||owns('sanguine_reprisal')&&(block||tag('BARRIER_SOURCE'));
 const rot=owns('toxic_touch')||owns('toxic_precision')&&crit;
 const barrier=owns('barrier_pulse')||owns('blood_ward')&&bleed||owns('rot_ward')&&rot||owns('runic_shield')&&funded||owns('fervent_life')&&crit||owns('sanctuary')&&tag('HEAL_SOURCE')||stats.main?.subtype==='Two-Handed'||stats.main?.subtype==='Staff';
 const heal=owns('renewal')||owns('life_bloom')||owns('second_breath')||owns('blood_drinker')&&bleed||owns('hemovore')&&bleed||owns('rot_recovery')&&rot||owns('rot_symbiosis')&&rot||owns('fervent_life')&&crit;
 return {bleed:!!bleed,rot:!!rot,crit:!!crit,block:!!block,barrier:!!barrier,heal:!!heal,funded:!!funded};
}
function functional(b,p){
 const c=capabilities(b),gates={
 deep_cuts:c.bleed,executioner:c.bleed,blood_drinker:c.bleed,sanguine_fury:c.crit,virulent_rot:c.rot,wasting_curse:c.rot,wither:c.rot,blight:c.rot,retaliation:c.barrier,brutal_crit:c.crit,adrenaline:c.crit,
 plague_rupture:c.bleed&&c.rot&&c.crit,carrion_detonation:c.bleed&&c.rot,blood_ward:c.bleed,sanguine_reprisal:c.block||c.barrier,hemovore:c.bleed,crimson_rush:c.crit&&c.bleed,reapers_cadence:c.crit&&c.bleed,hex_bleed:c.funded,hemal_sigil:c.funded&&c.bleed,
 rot_recovery:c.rot,rot_symbiosis:c.rot,rot_ward:c.rot,rot_husk:c.rot&&c.barrier,toxic_precision:c.crit,venom_shatter:c.rot&&c.crit,hex_bolt:c.rot&&c.funded,elemental_blight:c.rot&&c.funded,
 sanctuary:c.heal,guardians_oath:c.barrier,fervent_life:c.crit,life_conduit:c.heal&&c.funded,lifeweave:c.funded,counterstrike:c.block,iron_reversal:c.block,runic_shield:c.funded,prismatic_rebound:c.barrier&&c.funded,spellblade:c.funded,spell_surge:c.funded&&c.crit
 };
 if(p.family==='magic'&&!p.requires.length&&!c.funded)return false;
 return gates[p.id]!==false;
}
function eligible(b,family){
 if(!FAMILIES.includes(family)||!hasFamily(b,family)||family==='magic'&&!b.element||!b.unlockedFamilies?.includes(family))return [];
 const hybrids=[...new Set(b.picks)].map(id=>BY_ID[id]).filter(p=>p?.requires.length),pairs=new Set(hybrids.map(p=>[...p.requires].sort().join(':')));
 return CATALOG.filter(p=>p.family===family&&ownedRank(b,p.id)<p.max&&preview(b,p.id,b.runtime.draftStats||{}).useful&&functional(b,p)&&(!p.element||p.element===b.element)&&(!p.requires.length||(b.realmIndex||0)>=5&&hybrids.length<3&&!pairs.has([...p.requires].sort().join(':'))&&p.requires.every(f=>b.unlockedFamilies.includes(f))));
}
function synergy(b,p){
 const c=capabilities(b),tags=p.tags;
 return p.requires.length||tags.includes('CONSUMES_BLEED')&&c.bleed||tags.includes('CONSUMES_ROT')&&c.rot||tags.includes('CRIT_PAYOFF')&&c.crit||tags.includes('BARRIER_PAYOFF')&&c.barrier||tags.includes('HEAL_PAYOFF')&&c.heal||tags.includes('MAGIC_PAYOFF')&&c.funded||tags.includes('BLOCK_PAYOFF')&&c.block||ownedRank(b,p.id)>0;
}
function options(b,family,rng=Math.random){
 const all=b.unlockedFamilies.flatMap(f=>eligible(b,f)),pool=[...new Map(all.map(p=>[p.id,p])).values()];
 if(pool.length<3)throw Error('No three legal useful passives available; checkpoint retained');
 const chosen=[],remaining=()=>pool.filter(p=>!chosen.some(o=>o.id===p.id)),pick=a=>a[Math.min(a.length-1,Math.floor(rng()*a.length))];
 const prefer=a=>{const local=a.filter(p=>p.family===family||p.requires.includes(family));return local.length?local:a;};
 const add=(p,category)=>{if(p)chosen.push({...p,category,pity:p.requires.length?due.includes([...p.requires].sort().join(':')):false,preview:preview(b,p.id,b.runtime.draftStats||{})});};
 const hybrids=pool.filter(p=>p.requires.length),pairs=[...new Set(hybrids.map(p=>[...p.requires].sort().join(':')))];
 const pity={...(b.runtime.hybridPity||{})},due=pairs.filter(pair=>(pity[pair]||0)>=2);
 let hybrid=null;if(due.length){const pair=pick(due);hybrid=pick(hybrids.filter(p=>[...p.requires].sort().join(':')===pair));}
 else if(hybrids.length&&rng()<.35)hybrid=pick(prefer(hybrids));
 // Reserve Synergy first internally so an Upgrade cannot consume the mandatory pity card.
 const reserved=hybrid?.id;
 add(pick(prefer(remaining().filter(p=>!p.requires.length&&ownedRank(b,p.id)>0&&p.id!==reserved))),'Upgrade');
 add(hybrid||pick(prefer(remaining().filter(p=>!p.requires.length&&synergy(b,p)))),'Synergy');
 add(pick(prefer(remaining().filter(p=>!p.requires.length&&!ownedRank(b,p.id)))),'Discovery');
 while(chosen.length<3){let rest=remaining();const normal=rest.filter(p=>!p.requires.length);if(chosen.some(p=>p.requires.length)&&normal.length)rest=normal;const candidate=pick(prefer(rest));add(candidate,candidate.requires.length?'Synergy':ownedRank(b,candidate.id)?'Upgrade':'Discovery');}
 for(const pair of pairs)pity[pair]=chosen.some(p=>p.requires.length&&[...p.requires].sort().join(':')===pair)?0:Math.min(3,(pity[pair]||0)+1);
 for(let i=chosen.length-1;i>0;i--){const j=Math.floor(rng()*(i+1));[chosen[i],chosen[j]]=[chosen[j],chosen[i]];}
 // Commit counters only once the complete legal draft exists; the caller persists cards and RNG together.
 b.runtime.hybridPity=pity;return chosen;
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
  s.manaRegen=+(Math.max(1.5,s.manaRegen||1.5+s.int*.23)*(1+.12*Math.sqrt(rank(b,'mana_spring')))).toFixed(2);
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
 stacks.push({ticks:0,damage:Math.max(1,Math.round(power*(1+.15*rank(b,'virulent_rot')))),remaining:4});
 c.log('☠ Rot '+stacks.length+'/6');
}
function onHeal(b,c,healed){
 if(healed>0&&rank(b,'sanctuary')&&ready(b,'sanctuary',c.now,1)){activated(b,'sanctuary');c.barrier(healed*.20);}
 if(healed>0&&rank(b,'life_conduit')&&ready(b,'life_conduit',c.now,3)){activated(b,'life_conduit');c.mana(4);b.runtime.conduit=true;}
}
function heal(b,c,amount){const healed=c.heal(Math.max(0,amount))||0;if(!c.healTriggersPassives)onHeal(b,c,healed);return healed;}
function activated(b,id){b.runtime.passiveTelemetry??={};const t=b.runtime.passiveTelemetry[id]??={activations:0,combatSeconds:0};t.activations++;return true;}
function onAttack(b,c){
 if(c.proc||c.extra||c.recursive)return;
 const e=c.enemy,base=Math.max(1,c.base||1),crit=!!c.critical;
 if(rank(b,'bleeding_edge')&&ready(b,'bleedEdge',c.now,.9)&&c.random()<values('bleeding_edge',rank(b,'bleeding_edge')).chance&&activated(b,'bleeding_edge')) c.dot('bleed',base*.16);
 if(rank(b,'sanguine_fury')&&crit&&ready(b,'sanguineFury',c.now,2.5)&&activated(b,'sanguine_fury')){
  c.dot('bleed',base*.14);c.damage(base*values('sanguine_fury',rank(b,'sanguine_fury')).burst,'🩸 Sanguine Fury');
 }
 if(rank(b,'executioner')&&e.bleedStacks>0&&e.hp<=e.maxhp*.30&&ready(b,'execute',c.now,6)&&activated(b,'executioner'))c.damage(Math.min(base*.32,e.maxhp*.025),'🩸 Execute');
 if(rank(b,'blood_drinker')&&e.bleedStacks>0&&ready(b,'bloodHeal',c.now,4)&&activated(b,'blood_drinker'))heal(b,c,Math.min(c.player.maxhp*values('blood_drinker',rank(b,'blood_drinker')).hp,base*values('blood_drinker',rank(b,'blood_drinker')).base));
 if(rank(b,'toxic_touch')&&ready(b,'toxicTouch',c.now,1.3)&&c.random()<values('toxic_touch',rank(b,'toxic_touch')).chance&&activated(b,'toxic_touch')){c.dot('poison',base*.12);applyRot(b,c,base*.065);}
 if(rank(b,'blight')&&e.v012Rot?.length&&ready(b,'blight',c.now,7)&&activated(b,'blight'))c.damage(Math.min(base*.38,e.maxhp*.025),'☠ Blight');
 if(rank(b,'toxic_precision')&&crit&&ready(b,'toxicPrecision',c.now,2)&&activated(b,'toxic_precision')){c.dot('poison',base*.11);applyRot(b,c,base*.06);}
 if(rank(b,'plague_rupture')&&crit&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'plagueRupture',c.now,8)&&activated(b,'plague_rupture'))c.damage(Math.min(base*.55,e.maxhp*.032),'🩸 Plague Rupture');
 if(rank(b,'crimson_rush')&&crit&&e.bleedStacks>0&&activated(b,'crimson_rush'))c.damage(base*.15,'🩸 Crimson Rush');
 if(rank(b,'brutal_crit')&&crit&&activated(b,'brutal_crit'))c.damage(base*Math.min(.65,.12*Math.sqrt(rank(b,'brutal_crit'))),'⚔ Brutal Critical');
 if(rank(b,'double_strike')&&c.random()<Math.min(.60,.10*Math.sqrt(rank(b,'double_strike')))&&activated(b,'double_strike'))c.damage(base*.30,'🗡 Extra Strike');
 if(rank(b,'fervent_life')&&crit&&ready(b,'ferventLife',c.now,4)&&activated(b,'fervent_life')){const amount=c.player.maxhp*.02,restorable=amount*(c.healingMultiplier??1),actual=heal(b,c,amount);if(actual<restorable)c.barrier((restorable-actual)*.5);}
 if(rank(b,'adrenaline')&&crit&&ready(b,'adrenaline',c.now,3)&&activated(b,'adrenaline'))b.runtime.adrenalineUntil=c.now+3;
 if(rank(b,'counterstrike')&&b.runtime.counterBlock&&activated(b,'counterstrike')){b.runtime.counterBlock=0;c.damage(base*.18,'🛡 Counterstrike');}
 if(rank(b,'retaliation')&&b.runtime.counterBarrier&&activated(b,'retaliation')){b.runtime.counterBarrier=0;c.damage(base*.15,'🛡 Retaliation');}
 if(rank(b,'spellblade')&&b.runtime.spellblade&&activated(b,'spellblade')){b.runtime.spellblade=false;c.damage(base*.15,'✨ Spellblade');}
 if(rank(b,'carrion_detonation')&&e.bleedStacks>0&&e.v012Rot?.length&&ready(b,'carrionDetonation',c.now,8)&&activated(b,'carrion_detonation')){
  const bleed=e.dots?.bleed?.shift();e.bleedStacks=e.dots?.bleed?.length||0;e.bleed=(e.dots?.bleed||[]).reduce((n,d)=>n+d.damage,0);const rot=e.v012Rot.shift();const owed=(bleed?bleed.damage*bleed.remaining:0)+rot.damage*rot.remaining;c.damage(owed+Math.min(base*.25,e.maxhp*.02),'☠ Carrion Detonation');
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
 if(c.proc||c.extra||c.recursive||c.funded!==true||!hasFamily(b,'magic')||!elements.includes(b.element))return;
 const power=elementalPower(b,Math.max(1,c.power))*(c.amp||1);b.runtime.conduit=false;
 const e=c.enemy; b.runtime.magicHits++;
 if(b.element==='fire'&&rank(b,'kindling')&&activated(b,'kindling'))c.dot('burn',power*values('kindling',rank(b,'kindling')).burn);
 else if(b.element==='frost'&&rank(b,'deep_winter')&&activated(b,'deep_winter')){
  if(e.slowTime>0&&ready(b,'winterBurst',c.now,4))c.damage(Math.min(power*values('deep_winter',rank(b,'deep_winter')).burst,e.maxhp*(e.boss?.015:.05)),'❄ Winter Fracture');
  c.chill(e.boss?1.2:Math.min(5,3.5*(c.amp||1)));
 }else if(b.element==='lightning'&&rank(b,'overcharge')&&activated(b,'overcharge')){
  b.runtime.staticCharges=Math.min(4,(b.runtime.staticCharges||0)+1);
  if(b.runtime.staticCharges===4){b.runtime.staticCharges=0;c.damage(Math.min(power*values('overcharge',rank(b,'overcharge')).burst,e.maxhp*.035),'⚡ Static Discharge');}
 }
 if(rank(b,'arcane_echo')&&b.runtime.magicHits%4===0&&activated(b,'arcane_echo'))c.damage(power*values('arcane_echo',rank(b,'arcane_echo')).power,'✨ Arcane Echo');
 if(rank(b,'hex_bleed')&&ready(b,'hexBleed',c.now,3)&&activated(b,'hex_bleed'))c.dot('bleed',power*.11);
 if(rank(b,'hex_bolt')&&e.v012Rot?.length&&ready(b,'hexBolt',c.now,3)&&activated(b,'hex_bolt'))c.damage(power*.25+c.enemy.v012Rot.reduce((n,r)=>n+r.damage,0),'☠ Hex Bolt');
 if(rank(b,'runic_shield')&&ready(b,'runicShield',c.now,3)&&activated(b,'runic_shield'))c.barrier(c.player.maxhp*.02);
 if(rank(b,'hemal_sigil')&&e.bleedStacks>0&&ready(b,'hemalSigil',c.now,6)&&activated(b,'hemal_sigil')){
  const consumed=e.dots?.bleed?.shift();e.bleedStacks=e.dots?.bleed?.length||0;e.bleed=(e.dots?.bleed||[]).reduce((n,d)=>n+d.damage,0);if(consumed)c.damage(consumed.damage*consumed.remaining,'🩸 Hemal conversion');
  if(b.element==='fire')c.dot('burn',power*.34);
  else if(b.element==='frost')c.chill(2.5);
  else c.damage(Math.min(power*.56,e.maxhp*.03),'🩸 Hemal Sigil');
 }
 if(rank(b,'elemental_blight')&&e.v012Rot?.length&&ready(b,'elementalBlight',c.now,7)&&activated(b,'elemental_blight')){
  if(b.element==='fire'){const rot=e.v012Rot.shift();c.damage(Math.min(power*.32+rot.damage*3,e.maxhp*.032),'🔥 Blight');}
  else if(b.element==='frost')e.v012Rot[0].remaining=Math.min(Math.max(0,6-(e.v012Rot[0].ticks||0)),e.v012Rot[0].remaining+2);
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
  e.v012Rot=rot.map(s=>({...s,remaining:s.remaining-1,ticks:(s.ticks||0)+1})).filter(s=>s.remaining>0);
  if(c.enemy.hp>0&&damage>=c.enemy.hp)c.enemy.v012DeathRot=true;
  c.dotDamage(damage,'☠ Rot');
  if(rank(b,'rot_ward')&&ready(b,'rotWard',c.now,5)&&activated(b,'rot_ward'))c.barrier(c.player.maxhp*.018);
  if(rank(b,'rot_symbiosis')&&ready(b,'rotSymbiosis',c.now,6)&&activated(b,'rot_symbiosis'))heal(b,c,c.player.maxhp*.018);
 }
 if(rank(b,'renewal')&&activated(b,'renewal'))heal(b,c,c.player.maxhp*values('renewal',rank(b,'renewal')).heal);
 if(rank(b,'life_bloom')&&activated(b,'life_bloom')){heal(b,c,c.player.maxhp*values('life_bloom',rank(b,'life_bloom')).heal);c.mana(values('life_bloom',rank(b,'life_bloom')).mana);}
 if(rank(b,'barrier_pulse')&&ready(b,'barrierPulse',c.now,6)&&activated(b,'barrier_pulse'))c.barrier(c.player.maxhp*values('barrier_pulse',rank(b,'barrier_pulse')).barrier);
 if(rank(b,'blood_ward')&&e.bleedStacks>0&&ready(b,'bloodWard',c.now,5)&&activated(b,'blood_ward'))c.barrier(c.player.maxhp*.022);
 if(rank(b,'lifeweave')&&c.player.mp<c.player.maxmp*.30&&c.player.hp>c.player.maxhp*.20&&ready(b,'lifeweave',c.now,8)&&activated(b,'lifeweave')){
  c.player.hp=Math.max(1,c.player.hp-c.player.maxhp*.03);c.mana(10);
 }
}
function incoming(b,c,raw){
 let reduction=.04*rank(b,'fortified')+(.04*rank(b,'wasting_curse')+.02*rank(b,'wither'))*(c.enemy.v012Rot?.length?1:0);
 const vulnerability=b.runtime?.ironExposedUntil>c.now||b.runtime?.redlineUntil>c.now?1.10:1;return Math.max(1,Math.round(raw*(1-clamp(reduction,0,.28))*vulnerability));
}
function onDefend(b,c,blocked,barrierAbsorbed){
 const broken=c.barrierBroken??(barrierAbsorbed>0&&c.player.barrier<=0);
 if(blocked>0&&rank(b,'counterstrike'))b.runtime.counterBlock=1;
 if(barrierAbsorbed>0&&rank(b,'retaliation'))b.runtime.counterBarrier=1;
 if(rank(b,'sanguine_reprisal')&&(blocked>0||barrierAbsorbed>0)&&activated(b,'sanguine_reprisal'))b.runtime.reprisalReady=true;
 if(rank(b,'iron_reversal')&&blocked>0&&activated(b,'iron_reversal'))b.runtime.ironReady=true;
 if(rank(b,'prismatic_rebound')&&barrierAbsorbed>0&&activated(b,'prismatic_rebound'))
  b.runtime.prismaticCharge=Math.min(c.player.maxhp*.06,(b.runtime.prismaticCharge||0)+barrierAbsorbed*.45);
 if(rank(b,'rot_husk')&&barrierAbsorbed>0&&c.enemy?.v012Rot?.length&&broken&&ready(b,'rotHusk',c.now,9)&&activated(b,'rot_husk'))c.barrier(c.player.maxhp*.035);
 if(rank(b,'guardians_oath')&&barrierAbsorbed>0&&broken&&b.runtime.guardianWave!==(c.waveKey??c.enemy)&&activated(b,'guardians_oath')){
  b.runtime.guardianWave=c.waveKey??c.enemy;heal(b,c,c.player.maxhp*.045);
 }
}
function onKill(b,c){
 const waveKey=c.waveKey??c.enemy;if(b.runtime.lastKillWave===waveKey)return;b.runtime.lastKillWave=waveKey;
 if(rank(b,'hemovore')&&(c.enemy.bleedStacks>0||c.enemy.v012DeathBleed)&&activated(b,'hemovore'))heal(b,c,c.player.maxhp*.04);
 if(rank(b,'rot_recovery')&&(c.enemy.v012Rot?.length||c.enemy.v012DeathRot)&&activated(b,'rot_recovery'))heal(b,c,c.player.maxhp*.04);
 const key=c.waveKey??c.enemy;if(rank(b,'second_breath')&&b.runtime.lastWaveHeal!==key){b.runtime.lastWaveHeal=key;activated(b,'second_breath');heal(b,c,c.player.maxhp*values('second_breath',rank(b,'second_breath')).heal);}
}
function survive(b,c){if(!rank(b,'last_stand')||b.runtime.lastStand)return false;activated(b,'last_stand');b.runtime.lastStand=true;c.player.hp=Math.max(1,c.player.maxhp*.06);c.log('💚 Last Stand (once per Expedition)');return true;}
function speed(b,now){return b?.runtime?.adrenalineUntil>now?1+values('adrenaline',rank(b,'adrenaline')).speed:1;}
function enemyHealMultiplier(b,e){return 1-(e.v012Rot?.length&&rank(b,'wither')?values('wither',rank(b,'wither')).healingReduction:0);}
function nextCost(b){return 8-rank(b,'efficient_cast');}
function resetWave(b,e){e.v012Rot=[];e.v012Shock=0;}
function canCast(b){return !!b&&!!b.element&&['kindling','deep_winter','overcharge','arcane_focus','arcane_echo','spell_surge','spellblade','hex_bolt','hex_bleed','hemal_sigil','elemental_blight','prismatic_rebound','runic_shield'].some(id=>rank(b,id));}
function validate(b){
 if(!b||![undefined,1,2,3].includes(b.version)||!Array.isArray(b.families)||b.families.length>3||new Set(b.families).size!==b.families.length||!b.families.every(f=>FAMILIES.includes(f))||b.element!==null&&(!elements.includes(b.element)||!hasFamily(b,'magic'))||!Array.isArray(b.picks)||b.picks.length>20)throw Error('Invalid saved build');
 if(!Array.isArray(b.unlockedFamilies))b.unlockedFamilies=[...new Set(b.picks.map(id=>BY_ID[id]?.family).filter(Boolean))];
 if(new Set(b.unlockedFamilies).size!==b.unlockedFamilies.length||!b.unlockedFamilies.every(f=>hasFamily(b,f)))throw Error('Invalid unlocked affinity');
 for(const id of b.picks){const p=BY_ID[id];if(!p||!hasFamily(b,p.family)||!b.unlockedFamilies.includes(p.family)||p.requires.some(f=>!b.unlockedFamilies.includes(f))||p.element&&p.element!==b.element)throw Error('Invalid saved passive');}
 if(b.version>=3){const h=[...new Set(b.picks)].map(id=>BY_ID[id]).filter(p=>p?.requires.length);if(h.length>3||new Set(h.map(p=>[...p.requires].sort().join(':'))).size!==h.length)throw Error('Invalid hybrid combinations');}
 if(b.version>=3&&P.some(p=>ownedRank(b,p.id)>p.max))throw Error('Invalid passive rank');
 if(b.initialPassive!==null&&(b.initialPassive!==initialId(b.initialFamily,b.element)||!b.picks.includes(b.initialPassive)||!hasFamily(b,b.initialFamily)))throw Error('Invalid initial passive');
 if(!b.cooldowns||typeof b.cooldowns!=='object'||!Object.values(b.cooldowns).every(n=>typeof n==='number'&&Number.isFinite(n)&&n>=0)||!b.runtime||typeof b.runtime!=='object'||!['frenzyUntil','magicHits','lastSpellAt'].every(k=>typeof b.runtime[k]==='number'&&Number.isFinite(b.runtime[k]))||typeof b.runtime.lastStand!=='boolean')throw Error('Invalid saved cooldowns');
 if(b.runtime.hybridPity!==undefined&&(!b.runtime.hybridPity||typeof b.runtime.hybridPity!=='object'||Object.entries(b.runtime.hybridPity).some(([key,n])=>!/^([a-z]+):([a-z]+)$/.test(key)||key!==key.split(':').sort().join(':')||!key.split(':').every(f=>FAMILIES.includes(f))||!Number.isInteger(n)||n<0||n>3)))throw Error('Invalid hybrid pity');
 if(b.runtime.staticCharges===undefined)b.runtime.staticCharges=0;
 if(!Number.isInteger(b.runtime.staticCharges)||b.runtime.staticCharges<0||b.runtime.staticCharges>3)throw Error('Invalid Static charges');
 return b;
}
function clear(b){if(!b)return;b.picks.length=0;b.element=null;b.initialFamily=null;b.initialPassive=null;b.unlockedFamilies=[];b.families=[];b.cooldowns=Object.create(null);b.runtime={frenzyUntil:0,counterBlock:0,counterBarrier:0,spellblade:false,magicHits:0,staticCharges:0,adrenalineUntil:0,conduit:false,lastStand:false,lastSpellAt:-999};}
root.WandererV012Buildcraft=Object.freeze({CATALOG,FAMILIES,ELEMENTS:elements,create,initial,initialId,ownedRank,rank,values,preview,canModify,capabilities,functional,synergy,bleedDamage,elementalPower,eligible,options,choose,element,mods,onHeal,onAttack,onCast,onSecond,incoming,onDefend,onKill,survive,speed,enemyHealMultiplier,nextCost,resetWave,canCast,validate,clear});
})(globalThis);
