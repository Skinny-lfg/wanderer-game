// Deterministic first-wave smoke comparison; this is not a substitute for playtesting.
const create=require('../tests/v012-economy-harness.cjs');
function run(E,weapon,size,seed){
 const a=create(seed);a.setup(E,weapon,'Epic');if(weapon==='Staff')a.state().automaticTalents={xp:0,nodes:[],element:'lightning'};
 const c=a.controller();c.state.unlocked=E;a.start(E,true);const offer=c.state.offers.find(p=>p.groupSize===size&&c.reachable(p));if(!offer)throw Error('Missing encounter size');a.select(offer.id);if(!a.enter())throw Error('Entry rejected');
 const r=a.state().run,wave=r.enc,initialHp=r.hp;let ticks=0;while(r.status==='fight'&&r.enc===wave&&c.state.stage!=='failed'&&ticks<1200){a.tick();ticks++;}
 return {win:r.status!=='fight'&&c.state.stage!=='failed',timeout:ticks>=1200,seconds:+(ticks*.11).toFixed(2),hpLost:+Math.max(0,initialHp-r.hp).toFixed(1)};
}
const rows=[];for(const E of [1,50,200,300])for(const weapon of ['Sword','Daggers','Two-Handed','Staff'])for(const size of [1,2,4]){
 const samples=[11,23,47].map(seed=>run(E,weapon,size,seed));rows.push({E,weapon,size,wins:samples.filter(x=>x.win).length,timeouts:samples.filter(x=>x.timeout).length,averageSeconds:+(samples.reduce((n,x)=>n+x.seconds,0)/samples.length).toFixed(1),averageHpLost:+(samples.reduce((n,x)=>n+x.hpLost,0)/samples.length).toFixed(1)});
}
console.log(JSON.stringify(rows,null,2));
