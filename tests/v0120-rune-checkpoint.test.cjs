// Fixed-entry Rune mutation checks with synthetic profiles only.
const {test}=require('node:test'),assert=require('node:assert/strict'),create=require('./v012-economy-harness.cjs');
function fixture(){const a=create(611),s=a.state(),home=a.makeRune('might',10),spare=a.makeRune('might',10),best=a.makeRune('might',20);s.runes.push(home,spare,best);s.runeSlots[0]=home.id;a.start();a.initial('blood');return {a,home,spare,best};}
function checkpoint(a){a.select(a.controller().state.offers.find(p=>p.family==='blood').id);a.enter();a.checkpoint.restore(a.checkpoint.capture());}
test('resumed checkpoint rejects Rune unequip, equip, salvage and duplicate recycling without state changes',()=>{
 const {a,spare,best}=fixture();checkpoint(a);const before=JSON.stringify(a.state());
 assert.equal(a.runes.unequip(0),false);assert.equal(a.runes.equip(best.id,1),false);assert.equal(a.runes.salvage(spare.id),false);assert.equal(a.runes.recycle(),false);assert.equal(JSON.stringify(a.state()),before);
});
for(const action of ['salvage','recycle'])test('pending '+action+' confirmation rechecks the checkpoint guard',()=>{
 const {a,spare}=fixture();assert.equal(action==='salvage'?a.runes.salvage(spare.id):a.runes.recycle(),true);checkpoint(a);const before=JSON.stringify(a.state());a.runes.confirm();assert.equal(JSON.stringify(a.state()),before);
});
