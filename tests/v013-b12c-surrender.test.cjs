'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),create=require('./v012-economy-harness.cjs'),A=require('../scripts/v013-agent-strategy.cjs');
require('../online/v013-anchor-campaign.js');
const Anchor=globalThis.WandererV013AnchorCampaign;
function fixture(kind='combat'){
 const a=create(9312,undefined,{}, {skipPersistence:true,now:1720000009312});a.setup(35,'Sword','Rare');a.setUnlocked(35);a.start(35,true);
 const c=a.controller(),g=c.state,card=g.dungeon.cards[2];c.chooseRealm(card.id);
 card.nodes[1].kind=kind;card.nodes[1].event=null;
 if(kind==='elite'){card.objective=1;card.nodes[1].escorts=0;}
 if(kind==='boss')card.nodes[1].escorts=0;
 assert(c.visitRoom(1));assert(a.enter());assert.equal(a.state().run.status,'fight');
 const item=a.makeItem(35,'helm',null,'loot','random','Rare');a.bag.mark(item);a.recordItem(item);
 return {a,g,item};
}
function outcome(a){const s=a.state();return JSON.stringify({gold:s.gold,fragments:s.fragments,xp:s.automaticTalents.xp,crafting:s.crafting,consumables:s.consumables,runes:s.runes,slots:s.runeSlots,equip:s.equip,stash:s.stash,overflow:s.expeditionOverflow,anchors:s.anchorCollection,unlocked:a.controller().state.unlocked,stage:a.controller().state.stage});}
for(const kind of ['combat','elite','boss'])test('Surrender '+kind+' uses the same native defeat settlement',()=>{
 const x=fixture(kind),y=fixture(kind),a=x.a,r=a.state().run,xp=a.state().automaticTalents.xp,level=x.g.unlocked;
 assert.equal(a.requestSurrender(r),true);assert.equal(a.resolveConfirmation(false),true);assert.equal(a.state().run,r);
 assert.equal(a.requestSurrender(r),true);assert.equal(a.resolveConfirmation(true),true);
 y.a.death();
 assert.equal(outcome(a),outcome(y.a));assert.equal(a.state().run,null);assert.equal(x.g.stage,'failed');assert.equal(x.g.unlocked,level);
 assert.equal(a.state().automaticTalents.xp,xp);assert.equal(a.results().summary.outcome,'defeat');
 assert(!a.state().stash.some(i=>i.id===x.item.id));assert.equal(a.surrender(r),false);assert.equal(a.requestSurrender(r),false);
 const after=outcome(a);assert.equal(a.surrender(),false);assert.equal(outcome(a),after);assert(a.exitResult());
});
test('pending Runestone Shard is lost like defeat; secured shards retained; stale confirmation does not surrender',()=>{
 const {a}=fixture(),r=a.state().run;const family=r.planeFamily;
 let c=Anchor.collection();const secure=Anchor.get(family).shards[0].id;c={...c,campaign:Anchor.grantSecuredShard(c.campaign,secure)};
 for(let seed=0;seed<10000;seed++){const x=Anchor.observeVictory(c,{seed,family,node:2,kind:'normal'});if(x.expedition.pending){c=x;break;}}
 assert(c.expedition?.pending);a.state().anchorCollection=c;
 assert.equal(a.surrender({status:'fight'}),false);assert.equal(a.state().run,r);
 assert(a.surrender(r));assert.equal(a.state().anchorCollection.expedition,null);
 assert(Anchor.bag(a.state().anchorCollection).secured.some(s=>s.id===secure));
});
test('agent policy is independent of cap, conservative and observes only a stable solo target',()=>{
 const p=(tick,seconds,hp,extra={})=>({tick,seconds,status:'fight',stage:'combat',player:{hp:50},active:[{name:'Tank',family:'aegis',hp,maxhp:100}],reserve:[],...extra});
 const trace=[p(0,0,100),p(4500,495,82),p(5500,605,75)];
 assert.equal(A.surrenderDecision(trace).reason,'observed_solo_stalemate');
 assert.equal(A.surrenderDecision([p(0,0,100),p(4000,440,82),p(5000,550,75)]),null);
 assert.equal(A.surrenderDecision([p(0,0,100),p(4500,495,82),p(5500,605,60)]),null);
 assert.equal(A.surrenderDecision([p(0,0,100),p(4500,495,82),p(5500,605,75,{reserve:[{}]})]),null);
});
test('both deployed HTML copies expose the confirmed action and share identical native settlement',()=>{
 for(const file of ['index.html','docs/index.html']){const html=fs.readFileSync(file,'utf8');assert(html.includes('id="combatSurrender"'));assert(html.includes("()=>phase1Surrender(run),'Surrender'"));}
 assert.equal(fs.readFileSync('online/v012-expedition-runtime.js','utf8'),fs.readFileSync('docs/online/v012-expedition-runtime.js','utf8'));
});
