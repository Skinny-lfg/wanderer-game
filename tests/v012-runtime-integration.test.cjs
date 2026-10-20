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
