// Wanderer v0.13 Stage 4: optional exploration changes the effective final boss.
// Uses the Stage 0 deterministic manifest and its append-only decision ledger;
// never edits the manifest, combat base stats, existing Elite contract payout, or RNG streams.
(function(root){'use strict';
const F=root.WandererV013ExpeditionFoundation;
if(!F)throw Error('Stage 0 expedition foundation is required for boss preparation');
const RELIQUARY='forgotten_reliquary';
function cardFor(game){const d=game?.dungeon;return d?.cards?.find(c=>c.id===d.realm)||null;}
function stateFor(game){return game?.dungeon?.foundationState||null;}
function planRoom(card,seed){
 if(!card||!Array.isArray(card.nodes)||!Number.isInteger(seed))throw Error('Invalid map for Reliquary');
 const candidates=card.nodes.map((n,i)=>i>=5&&i<=12&&i!==card.clueRoom&&n.kind==='combat'&&n.count<18?i:-1).filter(i=>i>=0);
 if(!candidates.length)throw Error('No eligible optional Reliquary room');
 const random=F.rng(seed,'forgotten_reliquary_'+card.id),index=candidates[Math.floor(random()*candidates.length)];
 card.nodes[index].kind='event';card.nodes[index].event=RELIQUARY;
 card.reliquaryRoom=index;
 return index;
}
function markElite(game){
 const d=game?.dungeon,c=cardFor(game),s=stateFor(game),p=game?.selected;
 if(!c||!s||!p?.elite||p.boss||p.node!==c.objective||s.bossPreparation.markedElite)return false;
 d.foundationState=F.applyDecision(s,{type:'prepare_boss',source:'markedElite'},d.foundationManifest);
 return true;
}
function knownModifierIds(game,realmId){
 const d=game?.dungeon,plan=d?.foundationManifest?.cards?.find(x=>x.realmId===realmId);
 if(!plan)return [];
 const seen=plan.bossModifierIds||[];
 if(d.realm!==realmId||!d.foundationState)return seen.slice(0,1);
 const revealed=d.foundationState.revealedBossModifiers||[];
 return seen.filter((id,i)=>i===0||revealed.includes(id));
}
function nextUnrevealed(game){
 const s=stateFor(game);if(!s)return null;
 const known=new Set(knownModifierIds(game,game.dungeon.realm));
 return s.bossModifierIds.find(id=>!known.has(id))||null;
}
function revealBoss(game){
 const d=game?.dungeon,s=stateFor(game),id=nextUnrevealed(game);
 if(!d||!s||!id)return null;
 d.foundationState=F.applyDecision(s,{type:'reveal_boss',id},d.foundationManifest);
 return id;
}
function reliquaryCanDisrupt(game){
 const s=stateFor(game),c=cardFor(game),p=game?.selected;
 return !!(s&&c&&p?.node===c.reliquaryRoom&&p.event===RELIQUARY&&!s.bossPreparation.reliquary&&s.bossModifierIds.length);
}
function disrupt(game){
 if(!reliquaryCanDisrupt(game))return null;
 const d=game.dungeon,s=stateFor(game),disabledId=s.bossModifierIds[0];
 // The disabled property is always the known one. The manifest remains immutable.
 d.foundationState=F.applyDecision(s,{type:'prepare_boss',source:'reliquary'},d.foundationManifest);
 d.disabledBossModifierId=disabledId;
 return disabledId;
}
function effectiveModifiers(game){
 const d=game?.dungeon,s=stateFor(game);
 const original=d?.foundationManifest?.cards?.find(c=>c.realmId===d?.realm)?.bossModifierIds||[];
 if(!s?.bossPreparation.reliquary)return [...original];
 // Read the canonical manifest, not a stale planning copy: diagnostic harnesses
 // may override boss properties before combat; normal game manifests stay fixed.
 return original.filter(id=>id!==d.disabledBossModifierId);
}
function escortCount(game,count){
 const s=stateFor(game);return Math.max(0,count-(s?.bossPreparation.markedElite&&s.risk>0?1:0));
}
function bossAttackFactor(game){const s=stateFor(game);return s?.bossPreparation.markedElite&&s.risk===0?.90:1;}
function status(game){
 const s=stateFor(game),d=game?.dungeon;
 if(!s||!d)return null;
 const known=knownModifierIds(game,d.realm);
 return {markedElite:!!s.bossPreparation.markedElite,reliquary:!!s.bossPreparation.reliquary,
  disabledId:d.disabledBossModifierId||null,knownIds:known,hiddenCount:Math.max(0,s.bossModifierIds.length-known.length),
  activeIds:effectiveModifiers(game),bossAttackFactor:bossAttackFactor(game),escortsRemoved:s.bossPreparation.markedElite&&s.risk>0?1:0};
}
const API=Object.freeze({RELIQUARY,planRoom,cardFor,stateFor,markElite,knownModifierIds,nextUnrevealed,revealBoss,reliquaryCanDisrupt,disrupt,effectiveModifiers,escortCount,bossAttackFactor,status});
root.WandererV013BossPreparation=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
