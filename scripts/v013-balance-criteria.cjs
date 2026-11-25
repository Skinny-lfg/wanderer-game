'use strict';
// User-approved reference bands for aggregate player win rates, in percentage points.
// Diagnostic guidance, not a hard per-build quota or an automatic gameplay change.
const TOLERANCE_PP=7.5;
const TARGETS=Object.freeze(Object.fromEntries(Object.entries({
 normal:[80,90],elite:[60,70],boss:[35,45]
}).map(([kind,[min,max]])=>[kind,Object.freeze({idealMin:min,idealMax:max,acceptableMin:Math.max(0,min-TOLERANCE_PP),acceptableMax:Math.min(100,max+TOLERANCE_PP)})])));
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
module.exports={TOLERANCE_PP,TARGETS,kindOf,classify,summarize};
