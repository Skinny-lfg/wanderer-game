const {test}=require('node:test'),assert=require('node:assert/strict'),harness=require('./combat-harness.cjs');
test('production combat is deterministic across 1×/2×/4× for every affinity and six builds',()=>{
 const h=harness();for(const affinity of ['poison','bleed','sunder','crit','shield','regen','burn','slow','drain'])for(const weapon of ['Sword','Mace','Two-Handed','Daggers','Staff','Wand']){
  const results=[1,2,4].map(speed=>JSON.stringify(h.simulate({level:30,affinity,weapon,seed:17,speed}),(key,value)=>['id','obtainedAt'].includes(key)?undefined:value));
  assert.equal(results[0],results[1],affinity+' '+weapon+' 2x');assert.equal(results[0],results[2],affinity+' '+weapon+' 4x');
 }
});
test('legacy Legendary keeps exact item data and first-hit power; two-handed reservation counts only one item',()=>{
 const h=harness(),a=h.combatAccess;
 for(const subtype of ['Bow','Staff','Two-Handed']){const equip={weapon:{id:'legacy',subtype,effect:'poison'},offhand:{id:'old-off',subtype:'Shield',effect:'poison'}};assert.equal(a.setCounts(equip).poison,1);}
 const equipment={weapon:{id:'old-legendary',name:'Old Sword',slot:'weapon',subtype:'Sword',rarity:'Legendary',tier:20,atk:80}},saved=JSON.stringify(equipment),s=a.totalStats(equipment);
 s.crit=0;const r={stats:s,enemy:{hp:10000,maxhp:10000,def:0,baseDef:0,barrier:0,dots:{poison:[],bleed:[],burn:[]}},hp:s.maxhp,maxhp:s.maxhp,mp:0,barrier:0,enc:1};a.getState().run=r;
 const first=a.weaponAttack(r),second=a.weaponAttack(r);assert.equal(first,Math.round(second*1.32));assert.equal(JSON.stringify(equipment),saved);
});
test('production comparisons explicitly describe activated/lost tiers and their effects',()=>{
 const h=harness(),a=h.combatAccess,state=a.getState();state.equip=a.makeSlots();for(const slot of ['weapon','helm','armor','boots','gloves'])state.equip[slot]={id:slot,slot,subtype:slot==='weapon'?'Sword':'Armor',effect:'poison',rarity:'Rare'};
 const html=a.setPreview({id:'replacement',slot:'helm',subtype:'Helm',effect:'crit',rarity:'Rare'});assert.ok(html.includes('Removes 5-piece effect'));assert.ok(html.includes('Venom Burst'));assert.ok(html.includes('+15% Poison damage'));
});
