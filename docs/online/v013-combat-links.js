// Wanderer v0.13 — visual-only linked combat effects; never mutate gameplay or saves.
(function(root){'use strict';
const COLORS=Object.freeze({
 aoe:['#e7bf80','#fff4d8'],cleave:['#e3bd8a','#fff2d0'],pierce:['#d9d6b6','#fff9d7'],
 shock:['#9bcaff','#f1fbff'],bleed:['#d95d7b','#ffc2d0'],rot:['#7bcb85','#dcffd7'],
 burn:['#ef9358','#ffe2a1'],frost:['#91d8e7','#e7ffff'],ward:['#82c2df','#d6f9ff'],
 heal:['#83d5a2','#dcffda'],rally:['#edac72','#fff2bf'],siphon:['#d87194','#ffdbec'],
 summon:['#b1a1d6','#ebe0ff'],pulse:['#b0a7ed','#eee9ff']
});
const MAX_ACTIVE=7,MAX_TARGETS=3,DURATION=660,COOLDOWN=.16,recent=new WeakMap();
function nodeFor(scene,run,actor){
 if(actor===null||actor===undefined||actor==='hero')return scene.querySelector('#heroPortrait');
 if(run?.enemies?.length){
  const index=run.enemies.indexOf(actor);if(index<0)return null;
  const wrapper=scene.querySelector('[data-group-index="'+index+'"]');
  return wrapper?.querySelector('.arenaSprite img')||wrapper?.querySelector('img')||wrapper||null;
 }
 return actor===run?.enemy?scene.querySelector('#enemyPortrait'):null;
}
function point(scene,el){
 if(!el||typeof el.getBoundingClientRect!=='function')return null;
 const a=el.getBoundingClientRect(),b=scene.getBoundingClientRect();
 if(!a.width||!a.height||!b.width||!b.height)return null;
 return {x:a.left-b.left+a.width*.5,y:a.top-b.top+a.height*.44};
}
function show(run,kind,origin,receivers){
 const colors=COLORS[kind];
 if(!colors||!run||run.status!=='fight'||!run.phase1||typeof document==='undefined'||document.visibilityState==='hidden')return 0;
 if(typeof root.matchMedia==='function'&&root.matchMedia('(prefers-reduced-motion: reduce)').matches)return 0;
 const scene=document.getElementById?.('scene');
 if(!scene||typeof scene.getBoundingClientRect!=='function'||typeof scene.querySelectorAll!=='function'||
    typeof scene.appendChild!=='function'||typeof document.createElement!=='function')return 0;
 const now=Number(run.combatSeconds)||0,prev=recent.get(run);
 const targets=[...new Set((Array.isArray(receivers)?receivers:[receivers]).filter(Boolean))].slice(0,MAX_TARGETS);
 if(prev?.kind===kind&&prev.origin===origin&&now-prev.at>=0&&now-prev.at<COOLDOWN&&
    prev.targets.length===targets.length&&targets.every((target,i)=>prev.targets[i]===target))return 0;
 const from=point(scene,nodeFor(scene,run,origin));if(!from)return 0;
 let shown=0;
 for(const target of targets){
  const to=point(scene,nodeFor(scene,run,target));if(!to)continue;
  const existing=scene.querySelectorAll('.combatLinkFx');
  if(existing.length>=MAX_ACTIVE)existing[0]?.remove?.();
  const dx=to.x-from.x,dy=to.y-from.y,fx=document.createElement('span');
  fx.className='combatLinkFx effect-'+kind+(target===origin?' is-self':'');
  fx.dataset.effect=kind;fx.setAttribute?.('aria-hidden','true');
  for(const [key,value] of Object.entries({
   '--link-x':from.x.toFixed(1)+'px','--link-y':from.y.toFixed(1)+'px',
   '--link-length':Math.hypot(dx,dy).toFixed(1)+'px','--link-angle':Math.atan2(dy,dx)+'rad',
   '--link-color':colors[0],'--link-glow':colors[1]
  }))fx.style?.setProperty?.(key,value);
  scene.appendChild(fx);shown++;
  fx.addEventListener?.('animationend',()=>fx.remove?.(),{once:true});
  if(typeof setTimeout==='function')setTimeout(()=>fx.remove?.(),DURATION);
 }
 if(shown)recent.set(run,{kind,at:now,origin,targets});
 return shown;
}
const API=Object.freeze({COLORS,MAX_ACTIVE,MAX_TARGETS,DURATION,nodeFor,show});
root.WandererV013CombatLinks=API;
if(typeof module==='object'&&module.exports)module.exports=API;
})(globalThis);
