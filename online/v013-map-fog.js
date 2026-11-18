// Visual-only Expedition fog. No map generation, routing, or save mutation.
(function(root){'use strict';
let previous=null;
const colors={blood:'#ff6666',decay:'#a7d564',vitality:'#77db9c',aegis:'#ffda87',fury:'#ffad65',magic:'#9d9dff'};
const validPoint=p=>Array.isArray(p)&&p.length===2&&p.every(Number.isFinite);
function normalized(points,indices){return [...new Set(indices)].filter(i=>Number.isInteger(i)&&i>=0&&i<points.length&&validPoint(points[i])).sort((a,b)=>a-b);}
function layer(id,points,indices,tint,old,elapsed=0,nextIndices=indices,now=Date.now()){
 const holes=indices.map(i=>{const p=points[i];return '<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="7.5" ry="12" fill="url(#'+id+'-hole)"/>';}).join('');
 const added=old?nextIndices.filter(i=>!indices.includes(i)&&validPoint(points[i])).map(i=>{const p=points[i];return '<ellipse cx="'+p[0]+'" cy="'+p[1]+'" rx="7.5" ry="12" fill="url(#'+id+'-light)"/>';}).join(''):'';
 return '<svg class="realmFog '+(old?'realmFogPrevious':'realmFogCurrent')+'"'+(old?' style="animation-delay:-'+Math.min(999,Math.max(0,elapsed))+'ms"':'')+' aria-hidden="true" focusable="false" viewBox="0 0 100 100" preserveAspectRatio="none" data-fog-revealed="'+indices.length+'">'+
 '<defs><filter id="'+id+'-color" color-interpolation-filters="sRGB"><feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  .2126 .7152 .0722 0 0" result="brightness"/><feComponentTransfer in="brightness" result="highlights"><feFuncA type="linear" slope="3.2" intercept="-0.8"/></feComponentTransfer><feComposite in="highlights" in2="SourceAlpha" operator="in" result="cloudHighlights"/><feFlood flood-color="'+tint+'" flood-opacity=".95" result="light"/><feComposite in="light" in2="cloudHighlights" operator="in" result="coloredLight"/><feMerge><feMergeNode in="SourceGraphic"/><feMergeNode in="coloredLight"/></feMerge></filter><radialGradient id="'+id+'-hole"><stop offset="0" stop-color="black"/><stop offset="55%" stop-color="black"/><stop offset="100%" stop-color="black" stop-opacity="0"/></radialGradient>'+
 '<radialGradient id="'+id+'-light"><stop offset="0" stop-color="white"/><stop offset="55%" stop-color="white"/><stop offset="100%" stop-color="white" stop-opacity="0"/></radialGradient>'+
 '<mask id="'+id+'-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse" x="0" y="0" width="100" height="100" style="mask-type:luminance"><rect width="100" height="100" fill="'+(old?'black':'white')+'"/>'+added+holes+'</mask></defs>'+
 '<g mask="url(#'+id+'-mask)"><rect width="100" height="100" fill="#121117" fill-opacity=".35"/>'+
 '<image class="realmFogDense" filter="url(#'+id+'-color)" style="animation-delay:-'+(now%108000)+'ms" href="assets/expedition-map/fog-dense.png" x="-16" y="-16" width="132" height="132" preserveAspectRatio="none" opacity=".48"/>'+
 '<image class="realmFogDispersed" filter="url(#'+id+'-color)" style="animation-delay:-'+(now%146000)+'ms" href="assets/expedition-map/fog-dispersed.png" x="-24" y="-24" width="148" height="148" preserveAspectRatio="none" opacity=".32"/></g></svg>';
}
function render({key,points,revealed,family}){
 if(!Array.isArray(points)||!Array.isArray(revealed))return '';
 const visible=normalized(points,revealed),tint=colors[family]||'#aeb5c4',same=previous&&previous.key===String(key),old=same?previous:null,now=Date.now();
 const hasNew=old&&visible.some(i=>!old.visible.includes(i));
 // Keep overlapping reveals as separate fades so a rapid second reveal cannot jump.
 const transitions=(old?.transitions||[]).filter(t=>now>=t.started&&now-t.started<1000);
 if(hasNew)transitions.unshift({points:old.points,visible:old.visible,nextVisible:visible,started:now});
 const oldMarkup=transitions.map((t,i)=>layer('realm-fog-previous-'+i,t.points,t.visible,tint,true,now-t.started,t.nextVisible,now)).join('');
 const current=layer('realm-fog-current',points,visible,tint,false,0,visible,now);
 previous={key:String(key),visible,points:points.map(p=>validPoint(p)?p.slice():p),transitions};
 return current+oldMarkup;
}
function bind(viewport){for(const old of viewport?.querySelectorAll('.realmFogPrevious')||[]){if(typeof matchMedia==='function'&&matchMedia('(prefers-reduced-motion: reduce)').matches){old.remove();continue;}old.addEventListener('animationend',event=>{if(event.animationName==='realmFogReveal')old.remove();},{once:true});}}
function reset(){previous=null;}
root.WandererV013MapFog=Object.freeze({render,bind,reset});
if(typeof module==='object'&&module.exports)module.exports=root.WandererV013MapFog;
})(globalThis);
