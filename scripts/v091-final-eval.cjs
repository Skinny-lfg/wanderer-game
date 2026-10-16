// Focused, reproducible exploration; never changes production balance at runtime.
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {harness}=require('./simulate-v091.cjs');
const {plan,affinities}=require('./validate-v091-builds.cjs');

const original=fs.readFileSync('index.html','utf8');
const speed="const weaponMult={Sword:1,Mace:.66,Bow:1.15,Daggers:1.48,'Two-Handed':.50,Staff:.69,Wand:1.20}[main?.subtype]||1;";
const raw="const rawSpeed=Math.max(.25,speed*weaponMult);s.rawAttackSpeed=rawSpeed;";
const tuned="const baseSpeed=Math.max(.25,speed*weaponMult);\n // Low-speed catch-up for Staff and Two-Handed; naturally tapers as base speed grows.\n const catchUp=main?.subtype==='Staff'?Math.max(0,.56-.25*baseSpeed):main?.subtype==='Two-Handed'?Math.max(0,.43-.25*baseSpeed):0;\n const rawSpeed=baseSpeed+catchUp;s.rawAttackSpeed=rawSpeed;";
if(!original.includes(speed)||!original.includes(tuned))throw Error('Expected tuned combat formulas have changed');
const baseline=original.replace(tuned,raw);

const candidates={
 baseline,
 permanentSpeed:baseline.replace(speed,speed.replace("'Two-Handed':.50,Staff:.69","'Two-Handed':.70,Staff:.91")),
 earlySpeed:original
};
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'wanderer-final-v091-'));
const NUM=100,levels=[10,30,50,100,200],weapons=['Staff','Two-Handed'],profiles=['epic-3','mixed-high'];
const output=[];
function sample(c,gearPlan,level,weapon,seed){
 return c.trial({level,weapon,seed,elite:['tank','berserker','vampire','caster'][seed%4],gearPlan});
}
try{
 for(const [candidate,html] of Object.entries(candidates)){
  const file=path.join(dir,candidate+'.html');fs.writeFileSync(file,html);
  const c=harness(file);
  for(const level of levels)for(const weapon of weapons)for(const profile of profiles){
   let wins=0,hp=0,seconds=0;
   for(let i=0;i<NUM;i++){
    const r=sample(c,plan(c.inspect,level,weapon,profile,i%3),level,weapon,7001+i);
    wins+=Number(r.win);hp+=r.hp;seconds+=r.seconds;
   }
   const row={candidate,level,weapon,profile,win:+(100*wins/NUM).toFixed(1),hp:+(hp/NUM).toFixed(1),seconds:+(seconds/NUM).toFixed(1)};
   output.push(row);
  }
  // Controlled legal 3+2 versus 5 affinity points: matched tiers, rarities and no runes.
  // The secondary is Regen on two compatible armor slots (all three tested weapons allow it).
  for(const level of [30,50,100])for(const weapon of ['Staff','Wand','Daggers'])for(const mix of ['threePlusTwo','five']){
   let wins=0,hp=0;
   for(let i=0;i<NUM;i++){
    let gearPlan=plan(c.inspect,level,weapon,mix==='five'?'epic-5':'epic-3',i%3);
    if(mix==='threePlusTwo'){
     let n=0;
     gearPlan=gearPlan.map(p=>{
      if(p.effect===affinities[weapon])return p;
      if(n<2&&c.inspect.elementPool(p.slot,p.subtype).includes('regen')){n++;return {...p,effect:'regen'};}
      return p;
     });
     if(n!==2)throw Error('Could not form legal 3+2');
    }
    const r=sample(c,gearPlan,level,weapon,7001+i);
    wins+=Number(r.win);hp+=r.hp;
   }
   output.push({candidate,level,weapon,profile:mix,win:+(100*wins/NUM).toFixed(1),hp:+(hp/NUM).toFixed(1)});
  }
 }
 console.log('FINAL_V091_EVALUATION_BEGIN');
 for(const o of output)console.log(JSON.stringify(o));
 console.log('FINAL_V091_EVALUATION_END');
}finally{fs.rmSync(dir,{recursive:true,force:true});}
