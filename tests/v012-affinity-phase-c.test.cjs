const {test}=require('node:test'),assert=require('node:assert/strict');const {api,build,context,base}=require('./v012-affinity-fixture.cjs');
function fixture(p,negative=false){
 const starter={blood:'bleeding_edge',decay:'toxic_touch',vitality:'renewal',aegis:'barrier_pulse',fury:'precision',magic:'overcharge'},b=build([...p.requires.map(f=>starter[f]),...(p.requires.includes('aegis')?['guarded_block']:[]),p.id],p.requires);b.runtime.draftStats={...base,blockChance:10};
 const f=context(b);f.c.player.barrier=0;f.c.barrierBroken=true;
 if(negative){Object.assign(f.c,{critical:false,funded:false,barrierBroken:false,random:()=>1});f.c.enemy.bleedStacks=0;f.c.enemy.dots.bleed=[];f.c.enemy.v012Rot=[];f.c.player.hp=f.c.player.maxhp;f.c.player.mp=f.c.player.maxmp;}
 return {b,...f};
}
function exercise(b,c,negative=false){
 api.onDefend(b,c,negative?0:20,negative?0:20);api.onHeal(b,c,negative?0:20);
 api.onAttack(b,c);api.onCast(b,c);c.now+=.1;api.onAttack(b,c);api.onCast(b,c);api.onSecond(b,c);api.onKill(b,c);
}
for(const p of api.CATALOG.filter(p=>p.requires.length)){
 test('C '+p.id+' positive trigger, unique gate and serializable cooldown',()=>{
  const {b,c}=fixture(p);if(p.id==='redline')c.player.hp=400;
  exercise(b,c);assert((b.runtime.passiveTelemetry?.[p.id]?.activations||0)>0,'positive trigger must execute');assert.equal(p.max,1);const saved=api.validate(JSON.parse(JSON.stringify(b)));assert.equal(api.rank(saved,p.id),1);assert(!api.eligible(saved,p.family).some(q=>q.requires.length&&q.requires.every(f=>p.requires.includes(f))));
  const free=fixture(p),before=JSON.stringify(free.b.runtime);api.onAttack(free.b,{...free.c,proc:true});api.onCast(free.b,{...free.c,proc:true});assert.equal(JSON.stringify(free.b.runtime),before,'extra hits cannot recurse');
 });
 test('C '+p.id+' missing trigger does not proc',()=>{
  const {b,c}=fixture(p,true);if(p.id==='crimson_pact')c.player.hp=100;
  // Test each trigger in isolation: do not let an enabling starter generate a missing status.
  b.picks=[p.id];exercise(b,c,true);assert.equal(b.runtime.passiveTelemetry?.[p.id]?.activations||0,0);
 });
}
test('C DoT conversions consume and repay exactly one stack; Frost extension bounded to six total ticks',()=>{
 for(const id of ['carrion_detonation','venom_shatter','hemal_sigil']){const p=api.CATALOG.find(p=>p.id===id),{b,c,calls}=fixture(p);b.picks=[id];const owed=id==='carrion_detonation'?50:id==='venom_shatter'?20:30;id==='hemal_sigil'?api.onCast(b,c):api.onAttack(b,c);const total=calls.filter(x=>x[0]==='damage').reduce((n,x)=>n+x[1],0);assert(total>=owed);assert.equal(id==='hemal_sigil'?c.enemy.dots.bleed.length:c.enemy.v012Rot.length,0);const before=total;id==='hemal_sigil'?api.onCast(b,c):api.onAttack(b,c);assert.equal(calls.filter(x=>x[0]==='damage').reduce((n,x)=>n+x[1],0),before);}
 const b=build(['elemental_blight'],['decay','magic'],'frost'),{c}=context(b);for(let i=0;i<7;i++){c.now=i*8;api.onCast(b,c);const rot=c.enemy.v012Rot[0];if(rot){api.onSecond(b,c);assert((rot.ticks||0)+rot.remaining<=6);}}assert(!c.enemy.v012Rot.length);
});
test('C all 15 pairs gate both families and functional prerequisites, not enemy statuses',()=>{
 for(const p of api.CATALOG.filter(p=>p.requires.length)){
  const {b}=fixture(p);b.picks=b.picks.filter(id=>id!==p.id);assert(api.eligible(b,p.family).some(q=>q.id===p.id),p.id);b.unlockedFamilies=[p.requires[0]];assert(!api.eligible(b,p.family).some(q=>q.id===p.id));
 }
 const b=build(['iron_skin','quick_hands'],['aegis','fury']);assert(!api.eligible(b,'aegis').some(p=>p.id==='counterstrike'));b.runtime.draftStats={...base,blockChance:10};assert(api.eligible(b,'aegis').some(p=>p.id==='counterstrike'));
});
test('C real healing reduction, Barrier breaks, kill snapshots and once per Wave after refresh',()=>{
 const b=build(['fervent_life'],['vitality','fury']),{c,calls}=context(b,{healingMultiplier:.6});c.player.hp=999;api.onAttack(b,c);assert.equal(calls.find(x=>x[0]==='barrier')[1],5.5);
 const g=build(['guardians_oath','rot_husk'],['vitality','aegis','decay']),f=context(g);f.c.barrierBroken=true;api.onDefend(g,f.c,0,10);const hp=f.c.player.hp;const saved=JSON.parse(JSON.stringify(g));api.resetWave(saved,f.c.enemy);api.onDefend(saved,f.c,0,10);assert.equal(f.c.player.hp,hp);f.c.waveKey='1:2';api.onDefend(saved,f.c,0,10);assert(f.c.player.hp>hp);
 const rot=build(['rot_recovery'],['decay','vitality']),r=context(rot);r.c.enemy.hp=1;r.c.enemy.v012Rot=[{damage:5,remaining:1}];api.onSecond(rot,r.c);assert.equal(r.c.enemy.v012Rot.length,0);api.onKill(rot,r.c);assert(r.c.player.hp>300);
});
