import {test} from 'node:test';import assert from 'node:assert/strict';
import {completionCandidate,rankVerifiedEntries,EXPEDITION_RANKING} from '../online/v012-leaderboard.mjs';
test('only boss-completed runs can form an unverified submission candidate',()=>{
 const save={expedition:{lastOutcome:'victory',active:null,completed:1,attempts:1,awardKeys:['1:15:3'],presentation:{summary:{level:1,realms:15,outcome:'victory'}}}};
 assert.equal(completionCandidate(save).verification,'required');assert.equal(EXPEDITION_RANKING.submissionEnabled,false);
 for(const lastOutcome of ['active','extracted','defeat','abandoned'])assert.equal(completionCandidate({expedition:{...save.expedition,lastOutcome}}),null);
 assert.equal(completionCandidate({expedition:{...save.expedition,awardKeys:[]}}),null);
});
test('shared ranking sorts cleared scores, preserves equal ranks, rejects malformed rows',()=>{
 const row=(uid,n)=>({uid,nickname:'Player_'+uid,highestExpeditionCleared:n});
 const rows=[row('a',200),row('b',1),row('c',200)];const ranked=rankVerifiedEntries(rows);
 assert.deepEqual(ranked.map(r=>r.rank),[1,1,3]);assert.equal(rows[0].uid,'a');
 assert.throws(()=>rankVerifiedEntries([row('a',NaN)]));assert.throws(()=>rankVerifiedEntries([row('a',0)]));assert.throws(()=>rankVerifiedEntries([row('a',1),row('a',2)]));
});
