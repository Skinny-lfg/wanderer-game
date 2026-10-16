// Legal, mixed-investment fixtures; combat is reused unchanged from simulate-v091.
const {harness}=require('./simulate-v091.cjs');
const weapons=['Sword','Mace','Daggers','Bow','Staff','Wand','Two-Handed'];
const affinities={Sword:'poison',Mace:'shield',Daggers:'crit',Bow:'crit',Staff:'burn',Wand:'burn','Two-Handed':'bleed'};
const profiles={
 'mixed-low':{tiers:[.6,.75,1],rarities:['Common','Uncommon','Rare'],points:2},
 'mixed-mid':{tiers:[.75,.9,1],rarities:['Uncommon','Rare','Epic'],points:3},
 'mixed-high':{tiers:[.8,.9,1],rarities:['Rare','Epic','Legendary'],points:3},
 'epic-3':{tiers:[1],rarities:['Epic'],points:3},
 'epic-5':{tiers:[1],rarities:['Epic'],points:5}
};
function plan(api,level,weapon,profile,rotation=0){
 const p=profiles[profile],primary=affinities[weapon],counts={},result=[];
 const heavy=['Bow','Staff','Two-Handed'].includes(weapon);
 const kinds={weapon,offhand:weapon==='Wand'?'Orb':weapon==='Daggers'?'Off-Hand Dagger':'Shield',helm:'Helm',amulet:'Amulet',armor:'Armor',gloves:'Gloves',ring1:'Ring',ring2:'Ring',boots:'Boots'};
 for(const slot of ['weapon','offhand','armor','helm','amulet','gloves','ring1','ring2','boots']){
  if(slot==='offhand'&&heavy)continue;
  const subtype=kinds[slot],weight=slot==='weapon'&&heavy?2:1,pool=api.elementPool(slot,subtype);
  const effect=pool.includes(primary)&&(counts[primary]||0)+weight<=p.points?primary:
   [...pool].filter(x=>x!==primary).sort((a,b)=>(counts[a]||0)-(counts[b]||0))[0];
  if(!effect)throw Error('No legal affinity');counts[effect]=(counts[effect]||0)+weight;
  const i=result.length+rotation;
  result.push({slot,subtype,effect,tier:Math.max(1,Math.round(level*p.tiers[i%p.tiers.length])),rarity:p.rarities[i%p.rarities.length]});
 }
 if(counts[primary]!==p.points)throw Error('Incorrect set threshold');
 return result;
}
function run(){
 const c=harness(),rows=[];
 for(const level of [10,30,50,100,200])for(const weapon of weapons)for(const profile of Object.keys(profiles)){
  const sum={win:0,hp:0,seconds:0,damageIn:0,damageOut:0,attacks:0,casts:0,fallbacks:0,attack:0,spell:0,aps:0,crit:0,maxhp:0,defense:0,manaRegen:0},elites={};let timeouts=0,winningSeconds=0;
  for(let i=0;i<100;i++){
   const elite=['tank','berserker','vampire','caster'][i%4];
   const r=c.trial({level,weapon,seed:7001+i,elite,gearPlan:plan(c.inspect,level,weapon,profile,i%3),diagnostics:true});
   timeouts+=r.timeout;if(r.win)winningSeconds+=r.seconds;for(const k in sum)sum[k]+=Number(r[k]??r.stats[k]);elites[elite]=(elites[elite]||0)+Number(r.win);
  }
  const winSeconds=sum.win?+(winningSeconds/sum.win).toFixed(3):null;
  for(const k in sum)sum[k]=+(sum[k]/100).toFixed(3);for(const k in elites)elites[k]/=25;
  rows.push({level,weapon,profile,...sum,winSeconds,timeouts,...Object.fromEntries(Object.entries(elites).map(([k,v])=>[k+'Win',v]))});
 }return rows;
}
if(require.main===module){const rows=run(),keys=Object.keys(rows[0]);console.log(keys.join(','));for(const r of rows)console.log(keys.map(k=>r[k]).join(','));}
module.exports={plan,profiles,weapons,affinities,run};
