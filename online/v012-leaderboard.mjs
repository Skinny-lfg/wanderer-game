// Shared ranking contract only: no network, Firebase writes or client-side verification.
// A future authenticated server must verify a boss-completion receipt, enforce replay
// protection and account ownership, then atomically retain max(previous, cleared).
// Never accept a browser save, award ledger or this candidate as proof of victory.
export const EXPEDITION_RANKING = Object.freeze({
 version:1,metric:'highestExpeditionCleared',direction:'desc',ties:'equal',
 provisionalSafetyLimit:200,submissionEnabled:false,
});
export function completionCandidate(save){
 const e=save?.expedition,s=e?.presentation?.summary;
 if(e?.lastOutcome!=='victory'||e.active!==null||s?.outcome!=='victory'||
  !Number.isSafeInteger(e.completed)||e.completed<1||s.level!==e.completed||s.realms!==15||
  !e.awardKeys?.includes(e.attempts+':15:3'))return null;
 return Object.freeze({version:1,metric:EXPEDITION_RANKING.metric,cleared:e.completed,
  attempt:e.attempts,verification:'required'});
}
// Input rows must come from a trusted server, never from client profile collections.
// Equal scores share a rank. No time-based gameplay tiebreak is assumed.
export function rankVerifiedEntries(rows){
 if(!Array.isArray(rows)||rows.length>1000)throw Error('Invalid ranking page');
 const ids=new Set();
 const sorted=rows.map(r=>{
  if(!r||typeof r.uid!=='string'||!r.uid||ids.has(r.uid)||typeof r.nickname!=='string'||
   !/^[A-Za-z0-9_]{3,20}$/.test(r.nickname)||!Number.isSafeInteger(r.highestExpeditionCleared)||r.highestExpeditionCleared<1)throw Error('Invalid verified ranking row');
  ids.add(r.uid);return {uid:r.uid,nickname:r.nickname,highestExpeditionCleared:r.highestExpeditionCleared};
 }).sort((a,b)=>b.highestExpeditionCleared-a.highestExpeditionCleared||a.uid.localeCompare(b.uid));
 let rank=0,previous=null;
 return sorted.map((r,i)=>{if(r.highestExpeditionCleared!==previous)rank=i+1;previous=r.highestExpeditionCleared;return {...r,rank};});
}
