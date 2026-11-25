'use strict';
// User-approved reference bands for aggregate player win rates, in percentage points.
// Diagnostic guidance, not a hard per-build quota or an automatic gameplay change.
// Tolerance is measured from the central target, NOT from the edges of the ideal band.
const TOLERANCE_PP=12.5,IDEAL_HALF_WIDTH_PP=5;
const CENTERS=Object.freeze({normal:85,elite:70,boss:50});
const TARGETS=Object.freeze(Object.fromEntries(Object.entries(CENTERS).map(([kind,target])=>[kind,Object.freeze({target,idealMin:Math.max(0,target-IDEAL_HALF_WIDTH_PP),idealMax:Math.min(100,target+IDEAL_HALF_WIDTH_PP),acceptableMin:Math.max(0,target-TOLERANCE_PP),acceptableMax:Math.min(100,target+TOLERANCE_PP)})])));
function kindOf(value){
 if(typeof value!=='string')return null;
 for(const kind of Object.keys(TARGETS))if(value===kind||value.startsWith(kind+'-'))return kind;
 return value==='combat'?'normal':null;
}
function classify(kind,winPct,n){
 kind=kindOf(kind);
 if(!kind)return {kind:null,status:'not-applicable'};
 const limits=TARGETS[kind];
 if(!Number.isFinite(winPct)||winPct<0||winPct>100||!Number.isFinite(n)||n<=0)return {kind,...limits,status:'no-data'};
 const status=winPct<limits.acceptableMin?'below':winPct>limits.acceptableMax?'above':winPct>=limits.idealMin&&winPct<=limits.idealMax?'ideal':'acceptable';
 return {kind,...limits,status};
}
function summarize(rows,winPct){
 const kinds=new Set(rows.map(r=>kindOf(r.sc)||kindOf(r.kind)||kindOf(r.roomType)));
 return classify(kinds.size===1?[...kinds][0]:null,winPct,rows.length);
}
module.exports={TOLERANCE_PP,IDEAL_HALF_WIDTH_PP,CENTERS,TARGETS,kindOf,classify,summarize};
