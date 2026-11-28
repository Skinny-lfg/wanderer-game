'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const ARMS=['current','uncapped','steady','outbreak'];
const BUILD='combat/v012-buildcraft.js',RUNTIME='combat/v012-combat-runtime.js';
function once(s,a,b){assert.equal(s.split(a).length,2,'Unexpected candidate anchor '+a.slice(0,120));return s.replace(a,b);}
function sources(root,arm){
 assert(ARMS.includes(arm));let build=fs.readFileSync(path.join(root,BUILD),'utf8'),runtime=fs.readFileSync(path.join(root,RUNTIME),'utf8');
 if(arm==='current')return {};
 const start=build.indexOf("  if(specialized(b,'plagueheart')&&b.families?.length===1"),end=build.indexOf("  const terminal=",start);
 assert(start>=0&&end>start&&build.slice(start,end).includes("c.random()<.45")&&build.slice(start,end).includes("state.plagueheartTick!==c.now"),'Frozen Plagueheart mismatch');
 const old=build.slice(start,end);
 const eligible="specialized(b,'plagueheart')&&b.families?.length===1&&hasFamily(b,'decay')&&c.player.hp>0&&e.hp>0&&baseRot>0";
 let replacement;
 if(arm==='uncapped'||arm==='steady'){
  const chance=arm==='uncapped'?'&&c.random()<.45':'',cost=arm==='uncapped'?'2+2*rot.length':'rot.length',mult=arm==='uncapped'?'2':'.75';
  replacement="  if("+eligible+chance+"){\n"+
    "   const cost="+cost+";c.metric?.('b71PaymentAttempts',1);\n"+
    "   if(c.player.mp-cost>=.15*c.player.maxmp){const before=c.player.mp;if(spendDarkMana(c,cost)){bonus="+mult+"*baseRot;activated(b,'plagueheart');c.metric?.('decayPrimaryPaidPlagueheartActivations',1);c.metric?.('decayPrimaryPaidPlagueheartMana',Math.max(0,before-c.player.mp));c.metric?.('b71AmplifiedTargets',1);c.metric?.('b71AmplifiedStacks',rot.length);}}\n  }\n";
 }else{
  replacement="  if("+eligible+"&&decayState(c).b71PulseAt===c.now&&!e.stage84Node){bonus=2*baseRot;c.metric?.('b71AmplifiedTargets',1);c.metric?.('b71AmplifiedStacks',rot.length);}\n";
  const helper="function b71Outbreak(b,c){\n if(!specialized(b,'plagueheart')||b.families?.length!==1||!hasFamily(b,'decay')||c.player.hp<=0)return false;\n const state=decayState(c);if(state.b71CheckedAt===c.now)return false;state.b71CheckedAt=c.now;\n const living=(c.player.enemies||[c.enemy]).filter(e=>e&&e.hp>0&&!e.stage84Node);\n if(!living.some(e=>(e.v012Rot||[]).some(d=>d.remaining>0&&d.damage>0)))return false;\n c.metric?.('b71GlobalRolls',1);if(c.random()>=.25)return false;\n const cost=16;c.metric?.('b71PaymentAttempts',1);if(c.player.mp-cost<.15*c.player.maxmp)return false;\n const before=c.player.mp;if(!spendDarkMana(c,cost))return false;\n state.b71PulseAt=c.now;activated(b,'plagueheart');c.metric?.('decayPrimaryPaidPlagueheartActivations',1);c.metric?.('decayPrimaryPaidPlagueheartMana',Math.max(0,before-c.player.mp));\n if(living.includes(c.enemy)){\n  const n=c.random()<.5?1:2;\n  for(let i=0;i<n;i++){applyRot(b,c,rotPotency(c),'ability_plagueheart');c.metric?.('b71ExtraRotSeeds',1);}\n }\n return true;\n}\n";
  build=once(build,'function tickRot(b,c){',helper+'function tickRot(b,c){');
  build=once(build,'onSecond,tickRot,incoming','onSecond,tickRot,b71Outbreak,incoming');
  runtime=once(runtime,'  r.tDot-=1;\n  const renewal=','  r.tDot-=1;\n  if(ports.isPhase1Run()&&ports.phase1Build)WandererV012Buildcraft.b71Outbreak(ports.phase1Build,ports.phase2Context(r));\n  const renewal=');
 }
 build=once(build,old,replacement);
 build=once(build,'  const terminal=specialized(b,','  if(bonus>0)c.metric?.("b71RawBonus",bonus);\n  const terminal=specialized(b,');
 new Function(build);new Function(runtime);
 return {[BUILD]:build,...(arm==='outbreak'?{[RUNTIME]:runtime}:{})};
}
module.exports={ARMS,BUILD,RUNTIME,sources};
