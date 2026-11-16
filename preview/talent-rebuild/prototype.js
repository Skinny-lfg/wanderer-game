'use strict';
const G=WandererTalentGraph,graph=G.createGraph(WandererV012Buildcraft.CATALOG,WandererAutomaticTalents.NODES),families=G.FAMILIES,byId=new Map(graph.map(n=>[n.id,n]));
const ns='http://www.w3.org/2000/svg',svg=document.querySelector('#svg'),links=document.querySelector('#links'),nodes=document.querySelector('#nodes'),viewport=document.querySelector('#view');
const angle=f=>-Math.PI/2+families.indexOf(f)*Math.PI/3,polar=(a,r)=>({x:Math.cos(a)*r,y:Math.sin(a)*r}),positions={};
for(const n of graph){let a=angle(n.family),r=0;
 if(n.kind==='affinity')r=330;
 else if(n.id.startsWith('root_'))r=180;
 else if(n.kind==='basic'||n.id.startsWith('basic_path_')){a+=(n.lane===0?-1:1)*Math.PI/10;r=450+(n.tier-1)*265+(n.kind==='basic'?105:0);}
 else if(n.id.startsWith('focus_branch_')){a+=(n.lane===0?-1:1)*Math.PI/20;r=505+(n.tier-1)*265;}
 else if(n.kind==='focused'||n.id.startsWith('focus_path_'))r=450+(n.tier-1)*265+(n.kind==='focused'?105:0);
 else if(n.kind==='mixed'||n.id.startsWith('mixed_path_')){const pair=n.pair;a=angle(pair[0])+Math.PI/6;if(n.kind==='mixed')r=680+(n.tier-1)*265;else{a+=(n.family===pair[0]?-1:1)*.12;r=590+(n.tier-1)*265;}}
 else if(n.id.startsWith('element_junction_')){a=angle('magic')+({fire:-1,frost:0,lightning:1}[n.element]||0)*.14;r=1160;}
 else if(n.kind==='element'||n.id.startsWith('element_path_')){a=angle('magic')+({fire:-1,frost:0,lightning:1}[n.element]||0)*.14;r=1230+(n.tier-1)*115+(n.kind==='element'?55:0);}
 positions[n.id]=polar(a,r);
}
// The approved ability positions stay unchanged. Fit each new minor-stat gate
// along its incoming link, shifting it only if another icon would overlap.
const iconRadius=n=>n.kind==='affinity'?37:n.kind==='mixed'?29:['basic','focused','element'].includes(n.kind)?23:9;
const occupied=graph.filter(n=>!n.approachOf).map(n=>({id:n.id,x:positions[n.id].x,y:positions[n.id].y,r:iconRadius(n)}));
for(const n of graph.filter(n=>n.approachOf)){
 const from=positions[n.approachFrom],to=positions[n.approachOf];
 if(!from||!to)throw Error('Missing stat-node connection '+n.id);
 const dx=to.x-from.x,dy=to.y-from.y,length=Math.hypot(dx,dy)||1;
 const normal={x:-dy/length,y:dx/length};
 let best=null;
 for(const t of [.48,.34,.62,.24,.74,.85,.15]){
  for(const offset of [0,14,-14,22,-22,30,-30,40,-40,54,-54,72,-72,96,-96]){
   const x=from.x+dx*t+normal.x*offset,y=from.y+dy*t+normal.y*offset;
   let penalty=0;
   for(const p of occupied){
    const clearance=Math.hypot(p.x-x,p.y-y)-p.r-9-5;
    if(clearance<0)penalty+=10000+1000*clearance*clearance;
   }
   const score=penalty+Math.abs(offset)*2+Math.abs(t-.48)*70;
   if(!best||score<best.score)best={x,y,score};
  }
 }
 positions[n.id]={x:best.x,y:best.y};
 occupied.push({id:n.id,x:best.x,y:best.y,r:9});
}
const el=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e};
for(const n of graph){const p=positions[n.id];for(const dep of [...new Set([n.requires,...(n.prerequisites||[]),...(n.anyRequires||[])].filter(Boolean))]){const q=positions[dep];links.append(el('line',{x1:q.x,y1:q.y,x2:p.x,y2:p.y}));}}
const core=el('circle',{cx:0,cy:0,r:95,fill:'#171418',stroke:'#b39568','stroke-width':3});links.append(core);for(const f of families){const p=positions['root_'+f];links.prepend(el('line',{x1:Math.cos(angle(f))*95,y1:Math.sin(angle(f))*95,x2:p.x,y2:p.y}));}
const glyph={blood:'✦',fury:'⚔',aegis:'⛨',vitality:'✿',magic:'✧',decay:'☠'},colors={blood:'#ae4b57',fury:'#d78246',aegis:'#79a7c8',vitality:'#8ebc72',magic:'#aa87d7',decay:'#9dae68'};
for(const n of graph){const p=positions[n.id],rad=n.kind==='affinity'?37:n.kind==='mixed'?29:['basic','focused','element'].includes(n.kind)?23:9,g=el('g',{class:'node','data-id':n.id,transform:`translate(${p.x} ${p.y})`,tabindex:'0',role:'button','aria-label':n.name});const c=el('circle',{r:rad,style:`stroke:${colors[n.family]||'#b39568'}`});g.append(c);
 if(n.kind==='affinity'){const image=el('image',{href:`../../assets/affinities/families/${n.family}.png`,x:-30,y:-30,width:60,height:60});g.append(image);}else if(rad>9){const t=el('text',{'font-size':n.icon?23:19});t.textContent=n.icon||glyph[n.family];g.append(t);}else{const t=el('text',{'font-size':8,class:'stat'});t.textContent='•';g.append(t);}
 function select(){document.querySelector('.node.selected')?.classList.remove('selected');g.classList.add('selected');document.querySelector('#name').textContent=n.name;document.querySelector('#description').textContent=n.description||`${n.kind} · ${n.family}`;const req=[n.requires,...(n.prerequisites||[])].filter(Boolean).map(id=>byId.get(id)?.name||id),any=(n.anyRequires||[]).map(id=>byId.get(id)?.name||id);document.querySelector('#requirements').textContent=[req.length?'Requires: '+req.join(' + '):'',any.length?'One path: '+any.join(' or '):'',n.maxRank>1?'Ranks: '+n.maxRank:''].filter(Boolean).join(' · ');selected=n;refresh();}
 g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});nodes.append(g);}
const label=el('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'middle',fill:'#d6bc8c','font-size':'18','letter-spacing':'3'});label.textContent='WANDERER';nodes.append(label);
let selected=null;const api=window.parent!==window?window.parent.WandererTreeAPI:null;
const action=document.createElement('button'),prepare=document.createElement('button'),status=document.createElement('p');let elementSummary=null,elementHint=null,elementButtons=[];
if(api){document.querySelector('aside small').textContent='PERMANENT TALENTS';action.textContent='Invest 1 point';prepare.textContent='Prepare ability';document.querySelector('aside').append(status,action,prepare);action.onclick=()=>{if(selected&&api.allocate(selected.id))refresh();};prepare.onclick=()=>{if(selected&&api.prepare(selected.id))refresh();};
 const chooser=document.createElement('details');chooser.className='elementChooser';elementSummary=document.createElement('summary');chooser.append(elementSummary);const panel=document.createElement('div');panel.className='elementPanel';const title=document.createElement('strong');title.textContent='Choose your active element';elementHint=document.createElement('p');const help=document.createElement('p');help.textContent='No elemental weapon is needed. With a physical weapon, Magic casts automatically when you have Mana; Staff and Wand cast through their attacks. Elemental talents add effects such as Burn or Chill.';const choices=document.createElement('div');choices.className='elementChoices';for(const id of ['fire','frost','lightning']){const b=document.createElement('button');b.type='button';b.dataset.element=id;b.textContent=id[0].toUpperCase()+id.slice(1);b.onclick=()=>{if(api.element(id))refresh();};choices.append(b);elementButtons.push(b);}panel.append(title,elementHint,help,choices);chooser.append(panel);document.querySelector('header').append(chooser);
 const reset=document.createElement('button');reset.textContent='Reset talents';reset.onclick=()=>{if(confirm('Reset all allocated talent points?')&&api.reset())refresh();};document.querySelector('aside').append(reset);}
function refresh(){if(!api)return;const p=api.snapshot();for(const n of graph){const element=nodes.querySelector(`[data-id="${n.id}"]`);element?.classList.toggle('owned',!!p.ranks[n.id]);}const active=p.element||'fire';elementSummary.textContent='Magic: '+active[0].toUpperCase()+active.slice(1)+' ▾';elementHint.textContent=p.ranks.affinity_magic?'Magic unlocked · changing element costs no points.':'Choose now; spells unlock when you allocate the Magic affinity.';for(const b of elementButtons)b.setAttribute('aria-pressed',String(b.dataset.element===active));const rank=selected?(p.ranks[selected.id]||0):0;status.textContent=`${p.points} points available`+(selected?` · Rank ${rank}/${selected.maxRank||1}`:'');action.disabled=!selected||p.points<1||rank>=(selected.maxRank||1)||!G.requirements(selected,p.ranks);prepare.hidden=!selected?.advanced;prepare.disabled=!rank;}
refresh();
let view={x:-1650,y:-1650,w:3300,h:3300};function render(){const ratio=viewport.clientWidth/viewport.clientHeight;view.h=view.w/ratio;svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`)}function centre(x,y,w){view.w=w;view.x=x-w/2;view.y=y-w/viewport.clientWidth*viewport.clientHeight/2;render()}function zoom(f){const x=view.x+view.w/2,y=view.y+view.h/2;centre(x,y,Math.max(300,Math.min(4800,view.w*f)))}document.querySelector('#in').onclick=()=>zoom(.75);document.querySelector('#out').onclick=()=>zoom(1.33);document.querySelector('#fit').onclick=()=>centre(0,0,Math.max(3300,3300*viewport.clientWidth/viewport.clientHeight));document.querySelector('#home').onclick=()=>centre(0,0,900);
for(const f of families){const b=document.createElement('button');b.textContent=f[0].toUpperCase()+f.slice(1);b.onclick=()=>{const p=polar(angle(f),720);centre(p.x,p.y,1150)};document.querySelector('#families').append(b)}
let drag=null;viewport.addEventListener('pointerdown',e=>{if(e.target.closest('.node'))return;drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};viewport.setPointerCapture(e.pointerId)});viewport.addEventListener('pointermove',e=>{if(!drag)return;view.x=drag.vx-(e.clientX-drag.x)*view.w/viewport.clientWidth;view.y=drag.vy-(e.clientY-drag.y)*view.h/viewport.clientHeight;render()});viewport.addEventListener('pointerup',()=>drag=null);viewport.addEventListener('pointercancel',()=>drag=null);viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:.87)},{passive:false});window.addEventListener('resize',render);document.querySelector('#fit').click();
