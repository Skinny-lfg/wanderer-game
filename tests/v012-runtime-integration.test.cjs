const test=require('node:test'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const trace=require('./v012-runtime-trace.cjs'),reference=require('./fixtures/v012-runtime-reference.json');
for(const {scenario,steps,digest}of reference.cases)test(`runtime parity ${reference.reference}: E${scenario.E} ${scenario.weapon} ${scenario.family} ${scenario.element||''}`,()=>{
 const hashes=trace(scenario);
 assert.equal(hashes.length,steps,'same lifecycle transitions');
 assert.equal(crypto.createHash('sha256').update(JSON.stringify(hashes)).digest('hex'),digest,'combat, RNG, gear, rewards, checkpoint and restored state must remain identical');
});
