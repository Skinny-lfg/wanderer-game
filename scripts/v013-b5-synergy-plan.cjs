'use strict';
// B5: legal equal-cost factorial plans, no combat alterations.
const fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),assert=require('node:assert/strict');
const DEFS=[
 ['blood-speed',['blood','fury'],'arcane',['quick_hands',3],['deep_cuts',3],['Daggers','Off-Hand Dagger','Leather'],['bleeding_edge','accelerated_bleeding']],
 ['blood-crit',['blood','fury'],'arcane',['precision',3],['sanguine_fury',3],['Daggers','Off-Hand Dagger','Leather'],['bleeding_edge','deep_cuts']],
 ['fury-crit',['fury'],'arcane',['precision',3],['brutal_crit',3],['Two-Handed',null,'Leather'],['quick_hands','double_strike']],
 ['decay-speed',['decay','fury'],'arcane',['quick_hands',3],['corruption_cycle',1],['Daggers','Off-Hand Dagger','Leather'],['corrupting_touch','virulent_rot','lingering_rot']],
 ['rot-sp',['arcane','decay'],'arcane',['arcane_focus',3],['virulent_rot',3],['Wand','Tome','Cloth'],['corrupting_touch','mana_spring']],
 ['rot-mana',['arcane','decay'],'arcane',['mana_spring',3],['corruption_cycle',1],['Staff',null,'Cloth'],['corrupting_touch','virulent_rot','lingering_rot']],
 ['barrier-sp',['aegis','arcane'],'arcane',['arcane_focus',3],['barrier_pulse',3],['Wand','Orb','Cloth'],['runic_shield','ward_echo']],
 ['barrier-guard',['aegis'],'arcane',['guarded_block',3],['barrier_pulse',3],['Sword','Shield','Plate'],['ward_echo','stored_force']],
 ['defense-healing',['radiance','aegis'],'arcane',['iron_skin',3],['renewal',3],['Mace','Shield','Plate'],['strong_heart','guarded_block']],
 ['healing-barrier',['radiance','aegis'],'arcane',['renewal',3],['sanctuary',1],['Mace','Shield','Plate'],['strong_heart','ward_echo']],
 ['fury-sustain',['fury','radiance'],'arcane',['precision',3],['fervent_life',1],['Mace','Shield','Plate'],['quick_hands','renewal']],
 ['cleave-spread',['decay','blood'],'arcane',['cleave_mastery',1],['plague_spread',1],['Two-Handed',null,'Plate'],['corrupting_touch','bleeding_edge']],
 ['carrion-spread',['decay','blood'],'arcane',['plague_spread',1],['carrion_detonation',1],['Two-Handed',null,'Plate'],['corrupting_touch','bleeding_edge']],
 ['lightning-chain',['arcane'],'lightning',['overcharge',3],['forked_lightning',1],['Staff',null,'Cloth'],['mana_spring','arcane_focus']],
 ['fire-spread',['arcane'],'fire',['kindling',3],['fire_spread',1],['Wand','Tome','Cloth'],['mana_spring','arcane_focus']],
 ['grave-sp',['arcane','decay'],'arcane',['arcane_focus',2],['grave_bloom',1],['Wand','Tome','Cloth'],['corrupting_touch','virulent_rot']],
 ['frost-freeze',['arcane'],'frost',['deep_winter',3],['shatter',1],['Wand','Tome','Cloth'],['frost_spread','mana_spring']]
];
function makePlans(T,ensure){
 const byId=new Map(T.NODES.map(n=>[n.id,n])),baseId=id=>id.replace(/_rank\d+$/,'');
 const count=(v,id)=>v.nodes.filter(k=>baseId(k)===id).length;
 function seed(families,mode){
  let v={...T.create(),xp:30*T.POINT_XP,...(mode==='arcane'?{}:{element:mode})};
  for(const f of families){v=ensure(v,'affinity_'+f);assert(v,'Missing affinity '+f);}
  if(families.includes('arcane')){v=ensure(v,'element_choice');assert(v);}
  return v;
 }
 function statList(families){return T.NODES.filter(n=>n.kind==='stat'&&!n.pending&&families.includes(n.family)).sort((a,b)=>(a.tier||0)-(b.tier||0)||a.id.localeCompare(b.id));}
 function allocate(v,id){const z=T.allocate(v,id);return z&&z.nodes.length===v.nodes.length+1?z:null;}
 function add(v,id,n){for(let i=0;i<n;i++){v=allocate(v,id);if(!v)return null;}return v;}
 function prep(v,id){if(!v)return null;return id?{...v,prepared:id}:v;}
 function choice(v,ids){for(const id of ids){v=allocate(v,id);if(!v)return null;}return v;}
 function fill(v,pool,target){
  while(v.nodes.length<target){let z=null;for(const n of pool){if(v.nodes.includes(n.id))continue;z=allocate(v,n.id);if(z)break;}if(!z)return null;v=z;}return v;
 }
 function factorial(def,red=false){
  const [key,families,mode,[a,ar],[b,br],kit,support]=def;
  const pool=statList(families),factorIds=[a,b];let full=seed(families,mode);
  if(red){full=ensure(full,'reapers_cadence');assert(full,key+' Rupture');full=ensure(full,'red_guillotine');assert(full,key+' Guillotine');}
  full=ensure(full,a);assert(full,key+' missing '+a);
  if(!red){full=ensure(full,b);assert(full,key+' missing '+b);}
  // Preserve all prerequisites including any required first rank. If removing a first rank invalidates the
  // other branch, use a rank-1 reference and test additional ranks only. Never remove prerequisite nodes.
  let base=null,lowA=0,lowB=0;
  for(const [la,lb] of [[0,0],[1,0],[0,1],[1,1]]){
   if(la>=ar||(!red&&lb>=br))continue;
   const v={...full,nodes:full.nodes.filter(x=>!(x===a&&!la)&&!(x===b&&!lb&&!red)),prepared:null};
   if(T.valid(v)){base=v;lowA=la;lowB=lb;break;}
  }
  assert(base,key+' no independent legal factor path');
  const na=ar-lowA,nb=red?0:br-lowB,limit=30-na-nb;
  assert(base.nodes.length<=limit,key+' exceeds budget '+base.nodes.length+'/'+limit);
  for(const id of support){if(factorIds.includes(id))continue;const z=ensure(base,id);if(z&&z.nodes.length<=limit&&count(z,a)===lowA&&(red||count(z,b)===lowB))base=z;}
  base=fill(base,pool,limit);assert(base,key+' cannot fill shared baseline');
  const addA=v=>add(v,a,na),addB=v=>red?prep(v,b):prep(add(v,b,nb),byId.get(b)?.advanced?b:null);
  const aFull=addA(base),bFull=addB(base);assert(aFull&&bFull,key+' cannot allocate factor');
  // Select identical legal stat substitutes in the two opposite cells; all four arms retain 30 points.
  let aSubs=[],bSubs=[],p=base,q=bFull;
  for(let i=0;i<na;i++){let found=false;for(const n of pool){if(p.nodes.includes(n.id)||q.nodes.includes(n.id))continue;const x=allocate(p,n.id),y=allocate(q,n.id);if(x&&y){aSubs.push(n.id);p=x;q=y;found=true;break;}}assert(found,key+' no A substitute');}
  let x=p,y=aFull;
  for(let i=0;i<nb;i++){let found=false;for(const n of pool){if(x.nodes.includes(n.id)||y.nodes.includes(n.id))continue;const z=allocate(x,n.id),w=allocate(y,n.id);if(z&&w){bSubs.push(n.id);x=z;y=w;found=true;break;}}assert(found,key+' no B substitute');}
  const before=choice(choice(base,aSubs),bSubs),alternative=choice(addA(base),bSubs),extra=addB(choice(base,aSubs)),after=addB(addA(base));
  for(const [label,v] of Object.entries({before,alternative,extra,after})){assert(v&&T.valid(v),key+' invalid '+label);assert.equal(v.nodes.length,30,key+' points '+label);}
  for(const [v,ra,rb,on] of [[before,lowA,lowB,false],[alternative,ar,lowB,false],[extra,lowA,br,true],[after,ar,br,true]]){
   assert.equal(count(v,a),ra,key+' rank A');if(red)assert.equal(v.prepared===b,on,key+' preparation');else assert.equal(count(v,b),rb,key+' rank B');
  }
  const [weapon,offhand,armor]=kit;
  return {key,id:a,name:key,family:families[0],families,mode,rank:ar,weapon,offhand,armor,before,after,alternative,extra,factorial:{a,b,lowA,highA:ar,lowB:red?'unprepared':lowB,highB:red?'prepared':br,altA:aSubs,altB:bSubs},red,contrast:'Matched legal equal-cost talent choice factorial; stat substitutes, not pure mechanical ablation'};
 }
 const cases=DEFS.map(d=>factorial(d));
 cases.push(factorial(['red-crit',['blood','fury'],'arcane',['precision',3],['red_guillotine',1],['Daggers','Off-Hand Dagger','Leather'],['quick_hands','bleeding_edge']],true));
 return cases;
}
function plan(){
 const file=path.join(__dirname,'v013-b4-individual-ability-audit.cjs'),source=fs.readFileSync(file,'utf8').split('const [cmd,f,b]=process.argv.slice(2);')[0];
 const m=new Module(file,module);m.filename=file;m.paths=Module._nodeModulePaths(path.dirname(file));m._compile(source+'\nmodule.exports={T,ensure};',file);
 return makePlans(m.exports.T,m.exports.ensure);
}
module.exports={plan,makePlans,DEFS};
