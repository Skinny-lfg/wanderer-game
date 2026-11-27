'use strict';
// B2.3B diagnostic only. No gameplay or policy threshold changes.
const assert=require('node:assert/strict'),fs=require('node:fs'),S=require('./simulate-progression.cjs'),G=require('./v013-global-e10.cjs'),A=require('./v013-agent-strategy.cjs');
const seeds=[100302164,100304636,100307108],OUT='reports/b23b',historical=[1041,41,1109];
function observer(allowSurrender){
 let previous=null,trace=[],cycles=[],totals={enemyWardGainObserved:0,enemyWardLossObserved:0,enemyHpLossObserved:0,enemyHpGainObserved:0,playerBarrierGainObserved:0,playerBarrierLossObserved:0},decision=null;
 return {observe(r,tick,stage){
  const p=A.combatTracePoint(r,tick,stage),e=p.active[0],old=previous?.active[0];
  if(e&&old&&e.name===old.name){
   const ward=e.barrier-old.barrier,hp=e.hp-old.hp,pb=p.player.barrier-previous.player.barrier;
   totals.enemyWardGainObserved+=Math.max(0,ward);totals.enemyWardLossObserved+=Math.max(0,-ward);
   totals.enemyHpGainObserved+=Math.max(0,hp);totals.enemyHpLossObserved+=Math.max(0,-hp);
   totals.playerBarrierGainObserved+=Math.max(0,pb);totals.playerBarrierLossObserved+=Math.max(0,-pb);
   if(e.cycles>old.cycles)cycles.push({seconds:p.seconds,cycle:e.cycles,enemyHp:e.hp,wardBefore:old.barrier,wardAfter:e.barrier,playerHp:p.player.hp,playerBarrier:p.player.barrier});
  }
  previous=p;
  if(tick%250===0){trace.push(p);if(allowSurrender&&r.status==='fight'&&r.enemy&&!r.enemy.boss&&!r.enemy.miniboss&&p.active.length===1&&!p.reserve.length)decision=A.surrenderDecision(trace);}
  return decision;
 },report(){return {totals,cycles,trace,final:previous,decision,measurement:'Per-tick net changes; simultaneous grant/absorption can cancel, not exact gross damage.'};}};
}
function run(id,armor,seed,surrender){
 const p=G.profile(id),o=observer(surrender),build={id:p.id,weapon:p.weapon,families:p.families,skills:[],element:p.element};
 const x=S.encounter(10,build,seed,'normal',{...S.DEFAULTS,mode:'encounter',points:p.t.nodes.length,gear:'current',rarity:'Rare',runes:false,contracts:'none',boons:'none',targetPolicy:'mechanics',measure:true,tickLimit:13000,lockScenarioStreams:true,controlledTalents:p.t,armorType:armor||p.armorType,offhandType:p.offhandType,stalemateAudit:o},undefined,undefined,'aegis',1,1);
 assert.equal([x.won,x.died,x.timedOut,!!x.surrendered].filter(Boolean).length,1);
 if(x.surrendered){assert.equal(x.surrenderSettlement.stage,'failed');assert.equal(x.surrenderSettlement.outcome,'defeat');}
 return {id,armor:x.armorType,seed,policy:surrender?'observed-stalemate-v1':'disabled',won:x.won,died:x.died,timedOut:x.timedOut,surrendered:!!x.surrendered,seconds:x.seconds,damage:x.damageDealt,damageTaken:x.damageTaken,gearHash:x.gearFingerprint,roster:x.roster,stats:x.heroBaseStats,metrics:x.affinityMetrics,settlement:x.surrenderSettlement||null,...o.report()};
}
function main(){
 const rows=[];
 for(let i=0;i<seeds.length;i++){
  const a=run('aegis-mace','Cloth',seeds[i],false),b=run('aegis-mace','Cloth',seeds[i],true);
  assert.equal(a.roster[0].name,'Breakwater Sentinel');assert.equal(a.roster[0].ability,'Shellward');assert.equal(a.damage,historical[i]);assert.equal(a.seconds,1430);assert(a.timedOut);assert.equal(a.gearHash,b.gearHash);assert.deepEqual(a.roster,b.roster);
  rows.push(a,b);
 }
 for(const id of ['aegis-mace','radiance-mace','radiance-sword','blood-sword'])for(const seed of seeds)rows.push(run(id,null,seed,true));
 for(const r of rows)console.log('B23B_CASE='+JSON.stringify({id:r.id,armor:r.armor,seed:r.seed,policy:r.policy,enemy:r.roster[0],won:r.won,died:r.died,timedOut:r.timedOut,surrendered:r.surrendered,seconds:r.seconds,damage:r.damage,damageTaken:r.damageTaken,wardCycles:r.cycles.length,totals:r.totals,final:r.final,decision:r.decision,settlement:r.settlement}));
 const summary={commit:process.env.GITHUB_SHA||null,native:S.sourceFingerprint().sha256,sourceRun:45983097723,recoveryRun:45985885699,scope:'Targeted diagnostics; user accepts legitimate incompatible-build stalemates via Surrender; no automatic human surrender or balance changes.',historicalMatched:3,policyCases:rows.filter(r=>r.policy!=='disabled').length,policyTimeouts:rows.filter(r=>r.policy!=='disabled'&&r.timedOut).length,policySurrenders:rows.filter(r=>r.surrendered).length,rows};
 fs.mkdirSync(OUT,{recursive:true});fs.writeFileSync(OUT+'/summary.json',JSON.stringify(summary,null,2));console.log('B23B_OVERVIEW='+JSON.stringify({...summary,rows:undefined}));
}
if(require.main===module)main();
module.exports={observer};
