// Production combat scaling audit, isolated from Firebase and saves.
const assert=require('node:assert/strict'),fs=require('node:fs');
const {harness}=require('../scripts/simulate-v091.cjs');
const source=fs.readFileSync('index.html','utf8');
const changes=[
 ["['sunder','Sunder Set','sunderBonus',.20","['sunder','Sunder Set','sunderBonus',2"],
 ["['shield','Shield Set','shieldBonus',.006","['shield','Shield Set','shieldBonus',3"],
 ["['regen','Regen Set','regenBonus',.006","['regen','Regen Set','regenBonus',2"],
 ["function regenPerSecond(maxhp,rate=.006){return Math.max(0,maxhp)*Math.max(0,rate)}","function regenPerSecond(maxhp){return 2+Math.min(8,Math.max(0,maxhp)*.002)}"],
 ["if(effect==='sunder')enemy.def=Math.max(Math.round(enemy.baseDef*.25),enemy.def-Math.max(1,Math.round(enemy.baseDef*(bonus.sunderBonus||.1))));","if(effect==='sunder')enemy.def=Math.max(Math.round(enemy.baseDef*.25),enemy.def-Math.max(1,1+(bonus.sunderBonus||0)));"],
 ["const gained=setBarrier(r,Math.max(1,Math.round((baseDamage||s.spellPower||s.attack||5)*.07+r.maxhp*(bonus.shieldBonus||0))));","const gained=setBarrier(r,Math.max(1,Math.round(2+(bonus.shieldBonus||0)+(baseDamage||0)*.07)));"],
 ["const gained=setHeal(r,Math.max(1,Math.round((baseDamage||s.attack||5)*.1)));","const gained=setHeal(r,Math.max(2,Math.round((baseDamage||s.attack||5)*.1)));"],
 ["if(s.counts.shield>=2){const gained=setBarrier(r,Math.max(1,Math.round(r.maxhp*(s.bonus.shieldBonus||0))));","if(s.counts.shield>=2){const gained=setBarrier(r,Math.max(1,s.bonus.shieldBonus||2));"],
 ["if(s.bonus.regenBonus){const healed=setHeal(r,regenPerSecond(r.maxhp,s.bonus.regenBonus));","if(s.bonus.regenBonus){const healed=setHeal(r,regenPerSecond(r.maxhp));"]
];
const current=harness('index.html',{legendary:true});
const before=harness('index.html',{legendary:true,transform:s=>{
 for(const [newText,oldText] of changes){assert.equal(s.split(newText).length,2,'Missing baseline anchor '+newText.slice(0,35));s=s.replace(newText,oldText);}
 return s;
}});
for(const [kind,key,n] of [['sunder','sunderBonus',.2],['shield','shieldBonus',.006],['regen','regenBonus',.006]])
 assert.equal(current.inspect.setBonuses({[kind]:2}).values[key],n,kind+' percent bonus');
const api=current.inspect;
for(const level of [10,40,100,200]){
 const base=api.estimateEnemy(level,4).def;
 const enemy={def:base,baseDef:base,hp:100000,maxhp:100000,barrier:0};
 const state=api.getState();state.equip={weapon:{subtype:'Sword',rarity:'Common'}};
 const stats={bonus:api.setBonuses({sunder:3}).values,attack:100,spellPower:0};
 state.run={stats,enemy,combatSeconds:1};
 for(let n=0;n<3;n++)api.applyAffinity('sunder',enemy,stats,1,100);
 assert(enemy.def<=base*.5,'Sunder Expose reachable in 3 applications, D'+level);
 for(let n=0;n<10;n++)api.applyAffinity('sunder',enemy,stats,1,100);
 assert.equal(enemy.def,Math.round(base*.25),'Sunder 25% floor D'+level);
}
const regenText=source.match(/function regenPerSecond\(maxhp,rate=\.006\)\{[^}]+\}/)?.[0];
assert(regenText,'Missing production percentage Regen helper');
const regen=Function('return ('+regenText+')')();
for(const hp of [150,400,1200,4000,12000])assert(Math.abs(regen(hp)/hp-.006)<1e-10,'Regen stays percentage at '+hp);
for(const hp of [150,400,1200,4000,12000]){
 const state=api.getState(),weapon={subtype:'Sword',rarity:'Common',effect:null};
 const enemy={hp:100000,maxhp:100000,barrier:0,baseDef:20,def:20};
 state.equip={weapon};
 const r={stats:{main:weapon,off:null,caster:false,bonus:api.setBonuses({shield:2}).values,
  attack:60,crit:0,counts:{shield:2},defense:10},
  enemy,hp,maxhp:hp,barrier:0,mp:0,combatSeconds:1,enc:1,setCooldowns:{}};
 state.run=r;api.weaponAttack(r);
 assert.equal(r.barrier,Math.max(1,Math.round(hp*.006)),'Shield scales per hit at '+hp);
 assert(r.barrier<=hp*.30,'Shield retains 30% cap');
}
const slots=['weapon','offhand','armor','helm','amulet','gloves','ring1','ring2','boots'];
const kinds={weapon:'Sword',offhand:'Shield',armor:'Armor',helm:'Helm',amulet:'Amulet',gloves:'Gloves',ring1:'Ring',ring2:'Ring',boots:'Boots'};
const selected={sunder:['weapon','offhand','armor','helm','gloves'],shield:['weapon','offhand','armor','helm','gloves'],regen:['offhand','armor','helm','gloves','ring1']};
function plan(level,effect){
 return slots.map((slot,i)=>{
  const subtype=slot==='weapon'&&effect!=='sunder'?'Mace':kinds[slot];
  const pool=api.elementPool(slot,subtype);
  const affinity=selected[effect].includes(slot)?effect:pool.find(x=>!['sunder','shield','regen'].includes(x))||pool[0];
  assert(pool.includes(affinity),'legal '+effect+' '+slot);
  return {slot,subtype,effect:affinity,tier:Math.max(1,Math.round(level*[.8,.9,1][i%3])),rarity:['Rare','Epic','Epic'][i%3]};
 });
}
const table=[];
for(const level of [10,40,100,200])for(const kind of ['sunder','shield','regen']){
 const gearPlan=plan(level,kind),n=10;
 const old={wins:0,healing:0,barrier:0,damage:0},fresh={wins:0,healing:0,barrier:0,damage:0};
 for(let seed=1;seed<=n;seed++){
  const opts={level,weapon:kind==='sunder'?'Sword':'Mace',gearPlan,seed:11000+seed,
    elite:['tank','berserker','vampire','caster'][seed%4],theme:'bastion'};
  for(const [ctx,o] of [[before,old],[current,fresh]]){
   const r=ctx.trial(opts);
   assert(!r.timeout,'Combat timeout '+level+'/'+kind);
   o.wins+=+r.win;o.healing+=r.healing;o.barrier+=r.barrierGained;o.damage+=r.damageOut;
  }
 }
 const row={level,kind,winsBefore:old.wins,winsAfter:fresh.wins,
  healBefore:Math.round(old.healing/n),healAfter:Math.round(fresh.healing/n),
  barrierBefore:Math.round(old.barrier/n),barrierAfter:Math.round(fresh.barrier/n),
  damageBefore:Math.round(old.damage/n),damageAfter:Math.round(fresh.damage/n)};
 table.push(row);
}
console.log('SCALING_AUDIT_V0100='+JSON.stringify(table));
console.log('PASS v0.10.0 scaling: percent Sunder, Shield and Regen at D10/D40/D100/D200 plus paired 5-piece combat');
