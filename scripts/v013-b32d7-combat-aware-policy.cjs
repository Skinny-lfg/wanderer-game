'use strict';
// B3.2D.7 candidate only. Reference threats are public level-dependent
// templates, not the current/future encounter. No simulated loot or RNG.
const clamp=(v,l,h)=>Math.max(l,Math.min(h,v)),n=v=>Number(v)||0;
const rankMap=nodes=>nodes.reduce((r,id)=>{const m=id.match(/^(.*)_rank(\d+)$/),k=m?m[1]:id;r[k]=Math.max(r[k]||0,m?+m[2]:1);return r;},{});
const F={Sword:1.12,Mace:1.4,Daggers:.8,Bow:1.4,'Two-Handed':2.1,Wand:1.05,Staff:1.6,Unarmed:1};
function evaluate({stats:s,equip,talents:t,level,legacy:x,core:CORE}){
 const ranks=rankMap(t.nodes),r=k=>ranks[k]||0,w=equip.weapon.subtype,o=equip.offhand?.subtype,ap=Math.max(1,n(s.attack)),sp=Math.max(0,n(s.spellPower)),aps=Math.max(.01,n(s.attacksPerSec)),hp=Math.max(1,n(s.maxhp)),caster=['Wand','Staff'].includes(w),attuned=r('element_choice')>0,mode=attuned?(t.element||'arcane'):'unattuned';
 const ref=CORE.estimateEnemy(level),P=globalThis.WandererExpeditionProgression,opening=Math.exp(-CORE.NORMAL_ROOM_BUDGET.earlyDecay*(level-1)),tankBudget=CORE.NORMAL_ROOM_BUDGET.solo.tank;
 // A public conservative tank template; no rolled stats, no chosen Realm.
 const tankHp=ref.hp*P.NORMAL_BASE.tank.hp*3*1.1*(tankBudget.hp+(tankBudget.matureHp-tankBudget.hp)*(1-opening));
 const tankWard=Math.round(tankHp*.12)/7; // Shellward cap / native cooldown, stress only
 const mana=Math.max(0,n(s.mana)),regen=Math.max(0,n(s.manaRegen)),critChance=clamp(n(s.crit)/100,0,1),crit=1+critChance*(.5+n(s.critDamage));
 const baseCost=({unattuned:[9,13],arcane:[9,13],fire:[13,18],frost:[10,15],lightning:[14,20]})[mode][w==='Staff'?1:0];
 const cost=Math.max(1,Math.ceil(baseCost*(w==='Staff'?.75:1)-(attuned?r('efficient_cast'):0))*(1-clamp(n(s.manaCostReduction),0,.25))*(Object.values(equip).some(i=>i?.v013Trait==='efficient')?.9:1));
 const tome=o==='Tome'&&mana>0?(equip.offhand?.v013Trait==='echoing_recall'?5:3)/6:0;
 const physicalHit=(factor,def)=>Math.max(1,Math.round(ap*factor)-Math.round(def*(r('affinity_fury')?.9:1)));
 const guard=clamp(n(s.blockChance)/100,0,.65),guardReduction=clamp(n(s.blockReduction),0,1),eva=CORE.evasionChance(n(s.evasionRating),level,20,.45),physicalShare=.7;
 const parry=w==='Sword'?.18:0,proc=(rate,chance,icd)=>rate*chance/(1+rate*chance*icd);
 const magicHit=Math.max(1,sp*(F[w]||1)*(1+.12*r('elemental_force')));
 // Native talent gated conservative credits, not full runtime emulation.
 const damageScale=(r('blood_focus')?.9:1)*(r('aegis_bulwark')?.9:1);
 function scenario(label,horizon,enemyDef,enemyAtk,interval,pressure,group,ward){
  const budget=Math.max(0,mana/horizon+regen+tome+(mana>0&&r('life_bloom')?Math.min(3.4,1.5*Math.sqrt(r('life_bloom'))):0));
  const rate=aps+x.daggerRate;
  const rotDemand=r('corrupting_touch')?4*proc(rate,.42+.04*(r('corrupting_touch')-1),1.3):0;
  const cycleDemand=r('corruption_cycle')?10/Math.max(2.5,Math.min(10,3.5/aps)):0;
  const infusionDemand=attuned?({arcane:10,frost:12,fire:18,lightning:20})[mode]/10:0;
  const automaticDemand=attuned&&!caster&&mode!=='arcane'?({fire:12,frost:8,lightning:14})[mode]/2.5:0;
  const mainDemand=caster?cost*aps:0,totalDemand=mainDemand+rotDemand+cycleDemand+infusionDemand+automaticDemand;
  const fraction=totalDemand?clamp(budget/totalDemand,0,1):1, funded=caster?fraction:1;
  const phys=physicalHit(caster?.55:F[w]||1,enemyDef),dag=physicalHit(.8,enemyDef)*.5;
  const hit=caster?funded*magicHit+(1-funded)*phys:phys;
  let direct=(hit*aps+dag*x.daggerRate)*crit*damageScale;
  if(!group&&!caster&&r('single_target_mastery'))direct*=1.15;
  if(r('double_strike'))direct+=hit*aps*.30*Math.min(.60,.10*Math.sqrt(r('double_strike')));
  if(r('brutal_crit'))direct+=hit*aps*critChance*Math.min(.65,.12*Math.sqrt(r('brutal_crit')));
  // Secondary status estimate retains prior DoT model, adjusted by actual
  // post-defense hit and paid resource share; no double counting old direct.
  const bleed=x.bleed*(hit/Math.max(1,caster?magicHit:ap*(F[w]||1)));
  const rotOpportunity=r('corrupting_touch')?proc(rate,.42+.04*(r('corrupting_touch')-1),1.3):0;
  const rot=rotOpportunity*fraction*.04*(hit+sp)*4*(1+.15*r('virulent_rot'));
  const dot=(bleed+rot)*(1+n(s.dotPower));
  const extraSpell=automaticDemand?sp*.70*(1+.12*r('elemental_force'))*fraction/2.5:0;
  // Modest credit for funded infusion, bounded and explicitly provisional.
  const infusion=attuned?sp*.25*fraction:0;
  const expectedAttacks=pressure/interval,physicalAvoid=1-physicalShare*(1-(1-parry)*(1-eva));
  const incoming=Math.max(enemyAtk*.24,enemyAtk*(1-Math.min(.75,n(s.defense)/(Math.max(1,n(s.defense)+enemyAtk*1.35)))))*physicalAvoid*(1-guard*guardReduction)*(1-clamp(.04*r('fortified'),0,.28))*expectedAttacks;
  const counter=w==='Sword'&&o==='Shield'?proc(expectedAttacks*physicalAvoid,guard,2.5)*physicalHit(1,enemyDef)*.65:0;
  const heal=x.healing*(1+n(s.healingPower))+(r('affinity_radiance')?hp*.002:0)+(r('life_bloom')?hp*Math.min(.006,.0025*Math.sqrt(r('life_bloom'))):0);
  const living=r('living_force')?Math.min(heal*.20,hp*.05/4):0;
  const passive=(r('vital_pulse')?hp*.02/4:0)+(r('grasping_roots')?hp*.015/8:0)+(r('ward_echo')?(hp*.01+n(s.defense)*.15)/4:0)+living;
  // Orb requires a damaging hit; credit proportionally below a ward wall.
  const gross=direct+dot+counter+extraSpell+infusion+passive;
  const shield=x.barrier*(1+n(s.wardBonus)+n(s.barrierPower))*(o==='Orb'&&ward?clamp(gross/Math.max(1,ward),.05,1):1);
  const sustain=Math.min(incoming*.90,Math.max(0,heal+shield));
  const netIncoming=Math.max(incoming*.10,incoming-sustain);
  const multi=group?direct*Math.min(1,x.secondary)*.65+dot*Math.min(1,x.secondary)*.25+(r('arcane_nova')&&attuned?infusion*.35:0)+passive*.5:0;
  // Smooth progress floor: a hard wall is not an absolute ban, and a DoT
  // bypass estimate is not asserted as exact. Ward is a stress scenario only.
  const hpDps=Math.max(gross*.03,gross-ward)+multi;
  const survival=hp/Math.max(.05,netIncoming);
  const duration=Math.min(horizon*4,(group?ref.hp*5:ward?tankHp:label==='boss'?ref.hp*5:ref.hp*3)/Math.max(.05,hpDps));
  return {label,horizon,funded,paidFraction:fraction,gross,hpDps,ward,incoming,netIncoming,survival,duration,margin:survival/Math.max(1,duration),counter,passive,heal,shield};
 }
 const scenarios=[
  {...scenario('solo',25,ref.def,ref.atk,1.8,1,false,0),weight:.18},
  {...scenario('ward',90,ref.def*1.35,ref.atk,1.9,1,false,tankWard),weight:.12},
  {...scenario('group',45,ref.def*.85,ref.atk,1.8,2.1,true,0),weight:.35},
  {...scenario('boss',100,ref.def*2,ref.atk*2,1.7,1,false,0),weight:.35}
 ];
 // Same logarithmic units and roughly comparable gain scale as legacy.
 // The soft survival term penalizes projected lethal exposure without an
 // infinite benefit for immortal but non-progressing equipment.
 const score=scenarios.reduce((v,q)=>v+q.weight*(.52*Math.log(Math.max(.05,q.hpDps))+.48*Math.log(Math.max(1,Math.min(hp*4,q.survival*ref.atk/1.8)))+.10*Math.log(clamp(q.margin,.05,4))),0);
 if(!Number.isFinite(score))throw Error('Nonfinite B3.2D.7 score');
 return {score,scenarios,tankWard,tankHp};
}
module.exports={evaluate};
