const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const trace=require('./v012-runtime-trace.cjs'),reference=require('./fixtures/v012-runtime-reference.json');
for(const {scenario,steps,digest}of reference.cases)test(`runtime parity ${reference.reference}: E${scenario.E} ${scenario.weapon} ${scenario.family} ${scenario.element||''}`,()=>{
 const hashes=trace(scenario);
 assert.equal(hashes.length,steps,'same lifecycle transitions');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),digest,'combat, RNG, gear, rewards, checkpoint and restored state must remain identical');
});
test('runtime functions have one implementation outside the UI entrypoint',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const modules=[...html.matchAll(/<script[^>]+src="([^"]+-runtime\.js)"/g)];
 assert.equal(modules.length,4);
 const names=new Set();
 for(const [,file]of modules){
  const source=fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context={};
  vm.runInNewContext(source,context,{filename:file});
  const factory=Object.values(context)[0];
  for(const name of Object.keys(factory.create({}))){
   assert(!names.has(name),`duplicate runtime export ${name}`);names.add(name);
   assert(!new RegExp(`function ${name}\\(`).test(html),`inline duplicate ${name}`);
  }
 }
});
test('player attack clock retains fractional time and stays within 2% of configured cadence',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),context={};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','combat/v012-combat-runtime.js'),'utf8'),context);
 const advance=context.WandererV012CombatRuntime.create({}).advancePlayerAttackClock;
 for(const rate of [1,2,3,4.2]){
  const state={tPlayer:0},dt=.11,ticks=Math.ceil(120/dt);let attacks=0;
  for(let i=0;i<ticks;i++)if(advance(state,dt,rate))attacks++;
  const observed=attacks/(ticks*dt),error=Math.abs(observed-rate)/rate;
  assert(error<.02,`${rate} attacks/s configured, ${observed.toFixed(4)} observed (${(error*100).toFixed(3)}% error)`);
 }
});
test('temporary speed changes preserve cycle progress, and buffs respect the 4.2/s cap',()=>{
 const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),context={};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'..','combat/v012-combat-runtime.js'),'utf8'),context);
 const advance=context.WandererV012CombatRuntime.create({}).advancePlayerAttackClock,state={tPlayer:.4,playerAttackPeriod:.5};
 for(let i=0;i<1000;i++)assert.equal(advance(state,0,i%2?4:2),false,'changing haste alone must not create an attack');
 assert(Math.abs(state.tPlayer/state.playerAttackPeriod-.8)<1e-10,'cycle fraction is unchanged by toggling haste');
 const capped={tPlayer:0},ticks=Math.ceil(120/.11);let attacks=0;
 for(let i=0;i<ticks;i++)if(advance(capped,.11,100))attacks++;
 assert(attacks/(ticks*.11)<=4.2+1e-9,'buffed cadence must stay at or below 4.2/s');
});
test('enemy attack clock remains separate and unchanged in this phase',()=>{
 const fs=require('node:fs'),path=require('node:path'),source=fs.readFileSync(path.join(__dirname,'..','combat/v012-combat-runtime.js'),'utf8');
 assert.match(source,/r\.tEnemy\+=dt/);
 assert.match(source,/if\(r\.tEnemy>=e\.attackEvery\*slowed\)\{\s*r\.tEnemy=0;/);
});
