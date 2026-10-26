// Local-only v0.13 sequential combat experiment. This module contains no
// combat/economy formulas; it only owns the deterministic mob/checkpoint IDs.
(function(root){'use strict';
const COUNTS=Object.freeze([8,10,12]);
function localCount(preview,hostname,search){
 if(preview!==true||!['localhost','127.0.0.1','[::1]','::1'].includes(String(hostname||'').toLowerCase()))return 0;
 const value=new URLSearchParams(String(search||'')).get('gauntlet');
 const count=Number(value);return COUNTS.includes(count)?count:0;
}
function create({attempt,plane,seed,count,waves}){
 if(!Number.isSafeInteger(attempt)||attempt<1||!Number.isInteger(plane)||plane<1||plane>15||!Number.isSafeInteger(seed)||seed<0||seed>0xffffffff||!COUNTS.includes(count)||!Number.isInteger(waves)||waves<1||waves>3)throw Error('Invalid Gauntlet checkpoint');
 return {version:1,attempt,plane,seed,count,waves,index:0,kills:[],awardKeys:[],checkpointId:`${attempt}:${plane}:gauntlet`};
}
function mobId(state,index=state?.index){
 if(!valid(state)||!Number.isInteger(index)||index<0||index>=state.count)throw Error('Invalid Gauntlet mob index');
 return `g${state.seed.toString(36)}-${state.plane}-${index+1}`;
}
function baselineWave(state,index=state?.index){
 if(!valid(state)||!Number.isInteger(index)||index<0||index>=state.count)throw Error('Invalid Gauntlet mob index');
 return 1+(index%state.waves);
}
function recordKill(state,id){
 if(!valid(state)||state.index>=state.count)return false;
 const expected=mobId(state);if(id!==expected)return false;
 if(state.kills.includes(id))return false;
 state.kills.push(id);state.index++;
 return true;
}
function award(state,id){
 if(!valid(state)||state.index!==state.count||state.kills.length!==state.count)throw Error('Gauntlet checkpoint is incomplete');
 if(typeof id!=='string'||!id.startsWith(state.checkpointId+':'))throw Error('Invalid reward award ID');
 if(state.awardKeys.includes(id))return false;
 state.awardKeys.push(id);return true;
}
function valid(state){
 return !!state&&state.version===1&&Number.isSafeInteger(state.attempt)&&state.attempt>0&&Number.isInteger(state.plane)&&state.plane>=1&&state.plane<=15&&Number.isSafeInteger(state.seed)&&state.seed>=0&&state.seed<=0xffffffff&&COUNTS.includes(state.count)&&Number.isInteger(state.waves)&&state.waves>=1&&state.waves<=3&&Number.isInteger(state.index)&&state.index>=0&&state.index<=state.count&&Array.isArray(state.kills)&&state.kills.length===state.index&&new Set(state.kills).size===state.kills.length&&state.kills.every((id,i)=>id===`g${state.seed.toString(36)}-${state.plane}-${i+1}`)&&Array.isArray(state.awardKeys)&&new Set(state.awardKeys).size===state.awardKeys.length&&typeof state.checkpointId==='string'&&state.checkpointId===`${state.attempt}:${state.plane}:gauntlet`;
}
root.WandererV013Gauntlet=Object.freeze({COUNTS,localCount,create,mobId,baselineWave,recordKill,award,valid});
})(globalThis);
