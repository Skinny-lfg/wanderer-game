// v0.9.3 pre-simulation QoL regression: terminal D200, stash filters and refreshed art.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const harness=require('./combat-harness.cjs');
const html=fs.readFileSync('index.html','utf8');
const model=fs.readFileSync('online/model.mjs','utf8');
const manifest=require('../assets/characters/manifest.json');
assert(html.includes('id="affinityFilter"'),'affinity selector');
assert(html.includes('Item power (stats)'),'item-power sorting');
assert(html.includes('resetInventoryFilters'),'reset filters');
assert(html.includes("completedAttempt()?'tavern':'dungeons'"),'go home after final extraction');
assert(html.includes('id="newAttempt"'),'homepage reset button');
assert(html.includes("const reset=$('resetProgress')"),'existing confirmed account reset path');
assert(model.includes('assets/characters/avatars/${id}.png'),'online uses new PNG avatars');

const ids=['wanderer','ranger','knight','spellblade','duelist'];
assert.deepEqual(manifest.characters.map(c=>c.id),ids);
for(const c of manifest.characters){
 assert.equal(c.avatar,'characters/avatars/'+c.id+'.png');
 const icon=fs.readFileSync('assets/'+c.avatar);
 assert.equal(icon.toString('ascii',1,4),'PNG',c.id+' PNG format');
 assert.equal(icon.readUInt32BE(16),256,c.id+' icon width');
 assert.equal(icon.readUInt32BE(20),256,c.id+' icon height');
 const full=fs.readFileSync('assets/'+c.fullBody);
 assert.equal(full.toString('ascii',0,4),'RIFF',c.id+' WebP full body');
}

function playSaved(level,completed=false){
 const h=harness(),a=h.combatAccess,s=a.getState();
 s.maxDungeon=level;s.chosen=level;s.onlineProgress.deepestCleared=level-1;
 s.run={tier:level,path:'temple',enc:level%10===0?5:4,status:completed?'win':'ready',loot:[],valuables:[],gold:0,fragments:0};
 return {a,s};
}
{
 const {a,s}=playSaved(199,true);
 a.extract();
 assert.equal(a.completedAttempt(),false,'D199 not final');
 assert.equal(s.maxDungeon,200,'advance to D200');
}
{
 const {a,s}=playSaved(200,true);
 assert.equal(a.completedAttempt(),false,'unlocking D200 is not clearing it');
 a.extract();
 assert.equal(s.attemptCompleted,true,'D200 completion persisted in save state');
 assert.equal(s.onlineProgress.deepestCleared,200);
 assert.equal(s.run,null);
 a.startDungeon();
 assert.equal(s.run,null,'entry blocked after D200');
}
{
 const h=harness(),a=h.combatAccess,s=a.getState();
 s.stash=[
  {id:'p1',slot:'weapon',effect:'poison',name:'Weak Poison',tier:8,atk:1},
  {id:'p2',slot:'weapon',effect:'poison',name:'Strong Poison',tier:8,atk:50},
  {id:'f1',slot:'weapon',effect:'burn',name:'Fire',tier:9,atk:20},
  {id:'n1',slot:'boots',effect:null,name:'Neutral',tier:12,hp:45}
 ];
 a.setFilters({affinity:'poison',sortBy:'power'});
 assert.deepEqual(a.stashVisible().map(x=>x.id),['p2','p1'],'power sort + poison');
 a.setFilters({affinity:'none'});
 assert.deepEqual(a.stashVisible().map(x=>x.id),['n1'],'no-affinity filter');
 a.setFilters({slot:'weapon'});
 assert.equal(a.stashVisible().length,3,'slot filter');
 a.setFilters({affinity:'all'});
 assert.equal(a.stashVisible().length,4,'clear filters');
}
console.log('PASS endgame D200 extraction lock, filter + power sort, full/avatar art mapping');
