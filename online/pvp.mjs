import {cleanEquipment} from './public-loadout.mjs';
import {totalStats} from './pvp-stats.mjs';
// Proposed theft policy. No live balances are read or changed by this module.
export const PVP_POLICY=Object.freeze({percent:1,maxPerWin:20,maxDailyGain:100,maxDailyLoss:50,opponentCooldownHours:24});
export function theftPreview(defenderGold,dailyGain=0,dailyLoss=0){
 for(const n of [defenderGold,dailyGain,dailyLoss])if(!Number.isSafeInteger(n)||n<0)throw Error('Invalid balance.');
 return Math.max(0,Math.min(Math.floor(defenderGold/100),20,100-dailyGain,50-dailyLoss));
}
// Deterministic casual practice arena. Inputs are public, unverified loadouts.
// This function MUST NOT award currency or update competitive results.
export function practiceDuel(leftEquipment,rightEquipment,seed=1,leftRunes=[],leftRuneSlots=[],rightRunes=[],rightRuneSlots=[]){
 let randomState=seed>>>0;const random=()=>{randomState=(Math.imul(1664525,randomState)+1013904223)>>>0;return randomState/4294967296;};
 const create=(equipment,runes,slots)=>{const s=totalStats(cleanEquipment(equipment),runes,slots);return {s,hp:s.maxhp,mana:s.mana,barrier:0,defense:s.defense,slow:0,next:0,dots:[],legendary:false};};
 const fighters=[create(leftEquipment,leftRunes,leftRuneSlots),create(rightEquipment,rightRunes,rightRuneSlots)],events=[],log=(time,side,text)=>{if(events.length<160)events.push({time:+time.toFixed(1),side,text});};
 const hit=(target,damage)=>{const absorb=Math.min(target.barrier,damage);target.barrier-=absorb;damage-=absorb;target.hp=Math.max(0,target.hp-damage);return damage;};
 const effect=(source,target,kind,damage,time,mult=1)=>{
  const b=source.s.bonus;
  if(['poison','bleed','burn'].includes(kind)){
   const base={poison:.12,bleed:.14,burn:.16}[kind];
   const amount=Math.max(1,Math.round(damage*base*(1+(b[kind+'Multiplier']||0))*mult));
   if(target.dots.length<12)target.dots.push({amount,remaining:3});
  }else if(kind==='sunder')target.defense=Math.max(target.s.defense*.25,target.defense-(2+(b.sunderBonus||0))*mult);
  else if(kind==='slow')target.slow=Math.max(target.slow,time+3);
  else if(kind==='shield')source.barrier=Math.min(source.s.maxhp*.3,source.barrier+3+(b.shieldBonus||0));
  else if(kind==='regen'||kind==='drain')source.hp=Math.min(source.s.maxhp,source.hp+Math.max(1,damage*(kind==='drain'?.16:.1)*mult*(1+(b.drainBonus||0))));
 };
 const attack=(source,target,time,side)=>{
  const s=source.s,kind=s.main?.subtype||'Unarmed',cost=kind==='Staff'?13:kind==='Wand'?9:0,spell=s.caster&&source.mana>=cost;
  let damage;
  if(spell){source.mana-=cost;damage=s.spellPower*(kind==='Staff'?1.45:.77);if(s.off?.magic&&(s.main.magic||s.main.effect)===s.off.magic)damage*=1.3;}
  else{const factor={'Two-Handed':1.85,Mace:1.4,Bow:1.30,Daggers:.72}[kind]||(s.caster?.55:1);damage=Math.max(1,s.attack*factor-target.defense);}
  const crit=random()<s.crit/100;if(crit)damage*=1.5;
  if(s.main?.rarity==='Legendary'&&!source.legendary){damage*=1.32;source.legendary=true;}
  const blocked=random()<target.s.blockChance/100;if(blocked)damage*=1-target.s.blockReduction;
  damage=hit(target,Math.max(1,Math.round(damage)));log(time,side,`${spell?'Spell':'Attack'}: ${damage}${crit?' · Critical':''}${blocked?' · Block':''}`);
  const affinity=spell?(s.main.magic||s.main.effect||'burn'):s.main?.effect;
  if(damage>0&&random()<(spell?.9:kind==='Daggers'?.52:kind==='Two-Handed'?.26:.32))effect(source,target,affinity,damage,time,kind==='Two-Handed'?1.7:1);
  if(!spell&&s.off?.subtype==='Off-Hand Dagger'){
   const extra=hit(target,Math.max(1,Math.round(s.attack*.13+s.off.atk*.45-target.defense*.16)));log(time,side,`Off-Hand Dagger: ${extra}`);
   if(random()<.34)effect(source,target,s.off.effect,extra,time,.65);
  }else if(s.off?.magic&&random()<(spell?.25:.45))effect(source,target,s.off.magic,damage,time,.5);
  if(s.counts.shield>=2)source.barrier=Math.min(s.maxhp*.3,source.barrier+(s.bonus.shieldBonus||2));
 };
 let duration=0,lastSecond=0;
 // Simultaneous health resolution avoids awarding a win just for attacking first.
 for(let step=1;step<=2400;step++){
  const time=step*.05;duration=time;
  for(const fighter of fighters)fighter.mana=Math.min(fighter.s.mana,fighter.mana+.05*fighter.s.manaRegen);
  const due=fighters.map(f=>time>=f.next);
  for(let i=0;i<2;i++)if(due[i]){const f=fighters[i];attack(f,fighters[1-i],time,i);f.next=time+(f.slow>time?1.22:1)/Math.min(5,f.s.attacksPerSec);}
  if(Math.floor(time)>lastSecond){lastSecond=Math.floor(time);for(const f of fighters){const dot=f.dots.reduce((sum,x)=>sum+x.amount,0);f.hp=Math.max(0,f.hp-dot);f.dots=f.dots.filter(x=>--x.remaining>0);if(f.hp>0)f.hp=Math.min(f.s.maxhp,f.hp+(f.s.bonus.regenBonus||0));}}
  if(fighters.some(f=>f.hp<=0))break;
 }
 const [left,right]=fighters;return {winner:left.hp<=0&&right.hp<=0?'draw':right.hp<=0?'attacker':left.hp<=0?'defender':'draw',seconds:+duration.toFixed(1),remainingHp:fighters.map(f=>Math.ceil(f.hp)),events,reward:0,practice:true};
}
