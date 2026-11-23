'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
require('../combat/expedition-progression.js');
const P=globalThis.WandererExpeditionProgression;
test('Stage 6.42 replaces E1-only overrides with one smooth absolute identity budget',()=>{
 const mature={hp:2.3,atk:1.5,def:1.2,interval:1.5};
 for(const id of P.ELITE_IDENTITIES){
  const early=P.OPENING_ELITE_BASE[id];
  assert.deepEqual(P.leaderIdentityBudget(mature,1,null,id),early);
  assert.strictEqual(P.leaderIdentityBudget(mature,10,null,id),mature);
  for(let E=2;E<10;E++){
   const x=P.leaderIdentityBudget(mature,E,null,id);
   for(const stat of ['hp','atk','def','interval'])
    assert(x[stat]>=Math.min(mature[stat],early[stat])-1e-10&&x[stat]<=Math.max(mature[stat],early[stat])+1e-10);
  }
 }
 assert.equal(P.firstExpeditionLeader,undefined);
});
