'use strict';
const G=WandererTalentGraph,graph=G.createGraph(WandererV012Buildcraft.CATALOG,WandererTalentCatalog.NODES),ids={arcane:['arcane_resonance','arcane_surge','arcane_mastery'],...G.ELEMENTS},families=G.FAMILIES,byId=new Map(graph.map(n=>[n.id,n]));
const ns='http://www.w3.org/2000/svg',svg=document.querySelector('#svg'),links=document.querySelector('#links'),nodes=document.querySelector('#nodes'),viewport=document.querySelector('#view');

const angle=f=>-Math.PI/2+families.indexOf(f)*Math.PI/3,polar=(a,r)=>({x:Math.cos(a)*r,y:Math.sin(a)*r}),positions={};
const local=(f,x,y)=>{const a=angle(f);return {x:-Math.sin(a)*x+Math.cos(a)*y,y:Math.cos(a)*x+Math.sin(a)*y};};
const rows=[[[171.6,753],[234,828],[288.6,913],[113.1,963]],[[362.7,1108],[401.7,1243],[444.6,1333],[167.7,1388]],[[507,1548],[542.1,1688],[573.3,1818],[222.3,1828]]];
for(const n of graph){
 const f=n.family,skill=n.gateFor?byId.get(n.gateFor):n;
 let xy=null;
 if(n.rotguardBranch)xy=[-240,1170];
 else if(n.adaptive){const sign=n.lane===0?-1:1;xy=n.atlasStep===0?[sign*190,1040]:[sign*240,1310];}
 else if(n.atlasSlot!==undefined){const slot=n.atlasSlot,step=n.atlasStep;xy=slot===0?[0,[673,753,833,923][step]]:[(slot===1?1:-1)*[180,190,210,240][step],[835,915,995,1080][step]];}
 else if(n.kind==='mixed'||n.id.startsWith('mixed_path_')||skill.kind==='mixed'){
  const pair=skill.pair,a=angle(pair[0])+Math.PI/6,t=skill.tier;
  positions[n.id]=polar(a+(n.id.startsWith('mixed_path_')?(f===pair[0]?-1:1)*.12:0),(n.kind==='mixed'?680+(t-1)*265:n.gateFor?635+(t-1)*265:590+(t-1)*265)*1.75);continue;
 }
 else if(n.id.startsWith('root_'))xy=[0,315];
 else if(n.kind==='affinity')xy=[0,578];
 else if(n.outerStep)xy=[n.outerSide*(n.outerStep===1?195:323.7),n.outerStep===1?578:728];
 else if(n.id==='element_choice')xy=[0,720];
 else if(skill.kind==='basic'||n.id.startsWith('basic_path_')){const [x,y]=rows[n.tier-1][n.id.startsWith('basic_path_')?0:n.gateFor?1:2];xy=[(skill.lane===0?-1:1)*x,y];}
 else if(n.id.startsWith('focus_branch_')||n.id.startsWith('arcane_side_')){const [x,y]=rows[n.tier-1][3];xy=[(n.lane===0?-1:1)*x,y];}
 else if(n.id.startsWith('focus_bridge_')||n.id.startsWith('arcane_bridge_'))xy=[(n.lane===0?-1:1)*(n.tier===2?136.5:195),n.tier===2?1188:1618];
 else if(n.basicDetour)xy=[(n.lane===0?-1:1)*340,1450];
 else if(['focused','element'].includes(skill.kind))xy=[0,n.gateFor?[1043,1478,1898][skill.tier-1]:[1133,1568,1993][skill.tier-1]];
 if(!xy)throw Error('Missing atlas position '+n.id);positions[n.id]=local(f,...xy);
}
const el=(tag,attrs)=>{const e=document.createElementNS(ns,tag);for(const [k,v] of Object.entries(attrs))e.setAttribute(k,v);return e};
for(const n of graph){const p=positions[n.id];for(const dep of [...new Set([n.requires,...(n.prerequisites||[]),...(n.anyRequires||[])].filter(Boolean))]){if((n.mixedChoice||n.focusChoice||n.elementPrevious||n.gateFor&&byId.get(n.gateFor)?.kind==='mixed'&&n.tier===3)&&n.anyRequires?.includes(dep))continue;if(dep==='element_choice'&&(n.adaptive||n.element&&n.gateFor))continue;const q=positions[dep],data={'data-from':dep,'data-to':n.id,...(n.pending||byId.get(dep)?.pending?{class:'pending-route'}:{})};links.append(el('line',{...data,x1:q.x,y1:q.y,x2:p.x,y2:p.y}));}}
const core=el('circle',{cx:0,cy:0,r:95,fill:'#171418',stroke:'#b39568','stroke-width':3});links.append(core);for(const f of families){const p=positions['root_'+f];links.prepend(el('line',{x1:Math.cos(angle(f))*95,y1:Math.sin(angle(f))*95,x2:p.x,y2:p.y,'data-from':'@core','data-to':'root_'+f}));}
const glyph={blood:'✦',fury:'⚔',aegis:'⛨',radiance:'☀',arcane:'✧',decay:'☠'},colors={blood:'#ae4b57',fury:'#d78246',aegis:'#79a7c8',radiance:'#f6d997',arcane:'#aa87d7',decay:'#9dae68'};
for(const n of graph){const p=positions[n.id],rad=n.kind==='affinity'?37:n.kind==='choice'?32:n.kind==='mixed'?29:['basic','focused','element','choice','weapon','extension','adaptive'].includes(n.kind)?23:9,g=el('g',{class:'node'+(n.pending?' pending-talent':''),'data-id':n.id,transform:`translate(${p.x} ${p.y})`,tabindex:'0',role:'button','aria-label':n.name});const c=el('circle',{r:rad,style:`stroke:${({fire:'#e88a57',frost:'#80c6df',lightning:'#dfc76b'}[n.element])||colors[n.family]||'#b39568'}`});g.append(c);
 if(n.kind==='affinity'){const image=el('image',{href:`../../assets/affinities/families/${n.family}.png`,x:-30,y:-30,width:60,height:60});g.append(image);}else if(rad>9){const t=el('text',{'font-size':n.icon?23:19});t.textContent=n.id==='element_choice'?'✺':n.icon||glyph[n.family];g.append(t);}else{const t=el('text',{'font-size':8,class:'stat'});t.textContent='•';g.append(t);}
 function select(){document.querySelector('.node.selected')?.classList.remove('selected');g.classList.add('selected');document.querySelector('aside').classList.add('has-selection');document.querySelector('#name').textContent=n.name;document.querySelector('#description').textContent=(n.pending?'COMING SOON — not yet available. ':'')+(n.description||`${n.kind} · ${n.family}`);selected=n;if(n.id==='element_choice'){optionsOpen=!optionsOpen;updateVisibility();}refresh();}
 if((n.kind==='mixed'||n.kind==='focused'||n.kind==='element')&&n.tier===3){const tag=el('text',{x:0,y:-44,'font-size':13,style:'fill:#f0d291'});tag.textContent='1 of 2';g.append(tag);}g.addEventListener('click',select);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select();}});nodes.append(g);}
const label=el('text',{x:0,y:0,'text-anchor':'middle','dominant-baseline':'middle',fill:'#d6bc8c','font-size':'18','letter-spacing':'3'});label.textContent='WANDERER';nodes.append(label);
let selected=null,chosenElement=null;const api=window.parent!==window?window.parent.WandererTreeAPI:null;
function nodeLabel(id){const n=byId.get(id);if(!n)return id;const family=n.family?n.family[0].toUpperCase()+n.family.slice(1)+' · ':'';if(n.kind==='affinity')return 'Unlock '+n.family[0].toUpperCase()+n.family.slice(1)+' affinity';if(n.gateFor)return family+n.name+' · before '+(byId.get(n.gateFor)?.name||n.gateFor);if(n.id.startsWith('focus_branch_'))return family+'Focused side '+(n.lane+1)+' · layer '+n.tier+' · '+n.name;if(n.id.startsWith('focus_path_'))return family+'Focused centre · layer '+n.tier+' · '+n.name;if(n.id.startsWith('mixed_path_'))return family+'Mixed approach '+n.pair.join(' + ')+' · layer '+n.tier+' · '+n.name;if(n.id.startsWith('basic_path_'))return family+'Basic side '+(n.lane+1)+' · layer '+n.tier+' · '+n.name;if(n.outerStep)return family+'Outer path · step '+n.outerStep+' · '+n.name;return family+n.name;}
function showRequirements(progress){
 const area=document.querySelector('#requirements');area.replaceChildren();nodes.querySelectorAll('.planned').forEach(e=>e.classList.remove('planned'));links.querySelectorAll('.planned').forEach(e=>e.classList.remove('planned'));if(!selected)return;
 const ranks=progress.ranks||{},gate=byId.get(selected.requires),effective=gate?.gateFor===selected.id?gate:selected;
 function group(title,ids){if(!ids.length)return;const heading=document.createElement('strong');heading.textContent=title;area.append(heading);const ul=document.createElement('ul');for(const id of ids){const li=document.createElement('li');li.textContent=(ranks[id]?'✓ ':'○ ')+nodeLabel(id);li.className=ranks[id]?'met':'missing';ul.append(li);}area.append(ul);}
 group('All required:',[effective.requires,...(effective.prerequisites||[])].filter(Boolean));group('Choose at least one:',effective.anyRequires||[]);
 const mode=api?api.snapshot().element:(chosenElement||'arcane');const eligible=graph.filter(n=>(!n.element||n.element===mode)&&(!n.pending||selected.pending));const route=WandererTalentRequirements.plan(eligible,ranks,selected.id);if(!route){const p=document.createElement('p');p.textContent='No available route found.';area.append(p);return;}
 const pending=route.steps.filter(id=>id!==selected.id),heading=document.createElement('strong');heading.textContent=route.steps.length?'One possible route · '+route.steps.length+' point'+(route.steps.length===1?'':'s')+' including this node:':'Requirements met';area.append(heading);
 if(pending.length){const list=document.createElement('ol');for(const id of pending){const li=document.createElement('li');li.textContent=nodeLabel(id);list.append(li);}area.append(list);}
 if(progress.points!==null&&route.steps.length>progress.points){const p=document.createElement('p');p.textContent='Need '+(route.steps.length-progress.points)+' more point(s) to complete this route.';area.append(p);}
 for(const id of route.steps)nodes.querySelector(`[data-id="${id}"]`)?.classList.add('planned');for(const [from,to] of route.edges)for(const edge of links.querySelectorAll('[data-from][data-to]'))if(edge.dataset.from===from&&edge.dataset.to===to)edge.classList.add('planned');
}
const action=document.createElement('button'),prepare=document.createElement('button'),status=document.createElement('p');
const attributeButtons=new Map();let attributeSummary=null,elementSummary=null,elementHint=null,elementButtons=[];
if(api){const aside=document.querySelector('aside'),details=document.querySelector('#requirements');aside.querySelector('small').textContent='PERMANENT TALENTS';action.textContent='Invest 1 point';prepare.textContent='Prepare ability';aside.insertBefore(status,details);aside.insertBefore(action,details);aside.insertBefore(prepare,details);action.onclick=()=>{if(selected&&api.allocate(selected.id))refresh();};prepare.onclick=()=>{if(selected&&api.prepare(selected.id))refresh();};
 const panel=document.createElement('section');panel.className='post100Attributes';panel.setAttribute('aria-label','Permanent attribute points after the Talent Tree cap');
 const heading=document.createElement('h3');heading.textContent='Beyond 100 Talent Points';
 const hint=document.createElement('p');hint.textContent='Earn one permanent main-stat point for every 100 XP after the first 10,000 XP. Resetting talents keeps these attributes.';
 attributeSummary=document.createElement('p');attributeSummary.className='post100Counter';
 const choices=document.createElement('div');choices.className='post100Choices';
 const labels={str:'Strength',agi:'Agility',int:'Intellect',end:'Endurance',cha:'Charisma'};
 for(const [key,title] of Object.entries(labels)){
  const button=document.createElement('button');button.type='button';button.dataset.attribute=key;
  button.title='Spend one permanent attribute point on '+title;
  button.addEventListener('click',()=>{if(api.attribute(key))refresh();});
  attributeButtons.set(key,button);choices.append(button);
 }
 panel.append(heading,hint,attributeSummary,choices);aside.insertBefore(panel,details);
 const reset=document.createElement('button');reset.textContent='Reset talents';reset.onclick=()=>{if(confirm('Reset all allocated talent points? Your permanent attribute points will stay.')&&api.reset())refresh();};document.querySelector('aside').append(reset);
}
function refresh(){const p=api?api.snapshot():{ranks:{},points:null};showRequirements(p);if(!api)return;for(const edge of links.querySelectorAll('[data-from][data-to]'))edge.classList.toggle('owned',!!p.ranks[edge.dataset.to]&&(edge.dataset.from==='@core'||!!p.ranks[edge.dataset.from]));for(const n of graph){const element=nodes.querySelector(`[data-id="${n.id}"]`);element?.classList.toggle('owned',!!p.ranks[n.id]);}const rank=selected?(p.ranks[selected.id]||0):0;status.textContent=`Level ${p.level} · ${p.points} Talent points · ${p.attributePoints} Attribute points`+(selected?` · Rank ${rank}/${selected.maxRank||1}`:'');
 action.disabled=!selected||selected.pending||p.points<1||rank>=(selected.maxRank||1)||!G.requirements(selected,p.ranks);
 prepare.hidden=!selected?.advanced;prepare.disabled=!rank;
 if(attributeSummary)attributeSummary.textContent=`${p.attributePoints} available · ${p.attributeTotal} earned after cap`;
 for(const [key,button] of attributeButtons){
  button.disabled=p.attributePoints<1;
  button.textContent=`+${key.toUpperCase()} · ${p.attributes?.[key]||0} invested`;
 }
}
refresh();
let view={x:-1900,y:-1900,w:3800,h:3800};function render(){const width=viewport.clientWidth,height=viewport.clientHeight;if(!width||!height)return;const ratio=width/height;view.h=view.w/ratio;svg.setAttribute('viewBox',`${view.x} ${view.y} ${view.w} ${view.h}`)}function centre(x,y,w){const width=Math.max(1,viewport.clientWidth),height=Math.max(1,viewport.clientHeight);view.w=w;view.x=x-w/2;view.y=y-w/width*height/2;render()}function zoom(f){const x=view.x+view.w/2,y=view.y+view.h/2;centre(x,y,Math.max(300,Math.min(10000,view.w*f)))}document.querySelector('#in').onclick=()=>zoom(.75);document.querySelector('#out').onclick=()=>zoom(1.33);document.querySelector('#fit').onclick=()=>centre(0,0,Math.max(4520,4520*(viewport.clientHeight>0?viewport.clientWidth/viewport.clientHeight:1)));document.querySelector('#home').onclick=()=>centre(0,0,900);
for(const f of families){const b=document.createElement('button');b.textContent=f[0].toUpperCase()+f.slice(1);b.onclick=()=>{const p=polar(angle(f),1260);centre(p.x,p.y,Math.max(1950,1800*viewport.clientWidth/Math.max(1,viewport.clientHeight)))};document.querySelector('#families').append(b)}
let drag=null;viewport.addEventListener('pointerdown',e=>{if(e.target.closest('.node, .element-popup'))return;drag={x:e.clientX,y:e.clientY,vx:view.x,vy:view.y};viewport.setPointerCapture(e.pointerId)});viewport.addEventListener('pointermove',e=>{if(!drag)return;view.x=drag.vx-(e.clientX-drag.x)*view.w/viewport.clientWidth;view.y=drag.vy-(e.clientY-drag.y)*view.h/viewport.clientHeight;render()});viewport.addEventListener('pointerup',()=>drag=null);viewport.addEventListener('pointercancel',()=>drag=null);viewport.addEventListener('wheel',e=>{e.preventDefault();zoom(e.deltaY>0?1.15:.87)},{passive:false});window.addEventListener('resize',render);document.querySelector('#fit').click();// Full atlas on open.









const choiceAt=positions.element_choice,popup=el('g',{class:'element-popup',transform:'translate('+choiceAt.x+' '+choiceAt.y+')'});nodes.append(popup);const popupBack=el('rect',{x:-160,y:-104,width:320,height:57,rx:9,fill:'#211a24',stroke:'#a48a68','stroke-width':2});popup.append(popupBack);const optionButtons=[];for(const [i,value] of ['arcane','fire','frost','lightning'].entries()){const btn=el('g',{class:'element-option',role:'button',tabindex:'0','aria-label':({arcane:'Arcane',fire:'Fire',frost:'Frost',lightning:'Lightning'})[value],transform:'translate('+(-120+i*80)+' -77)'}),circle=el('circle',{r:20,fill:'#171418',stroke:({arcane:'#aa87d7',fire:'#e88a57',frost:'#80c6df',lightning:'#dfc76b'})[value],'stroke-width':2}),t=el('text',{'text-anchor':'middle','dominant-baseline':'central','font-size':19,fill:'#e8d5ac'});t.textContent=({arcane:'✧',fire:'🔥',frost:'❄',lightning:'ϟ'})[value];btn.append(circle,t);popup.append(btn);const select=e=>{e.stopPropagation();chooseElement(value)};btn.addEventListener('click',select);btn.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();select(e)}});optionButtons.push(btn);}chosenElement=api&&api.snapshot().element!=='arcane'?api.snapshot().element:null;let optionsOpen=false;function updateVisibility(){popup.style.display=optionsOpen?'':'none';const displayElement=chosenElement||'arcane';for(const n of graph.filter(n=>n.element)){const node=nodes.querySelector('[data-id="'+n.id+'"]');if(!node)continue;node.style.display=n.element===displayElement?'':'none';const circle=node.querySelector('circle');if(circle)circle.style.stroke=({arcane:'#aa87d7',fire:'#e88a57',frost:'#80c6df',lightning:'#dfc76b'})[n.element];const txt=node.querySelector('text');if(txt){txt.style.fill='';if(n.kind==='element')txt.textContent=n.icon||glyph[n.family];}}for(const edge of links.querySelectorAll('[data-from][data-to]')){const a=byId.get(edge.dataset.from),b=byId.get(edge.dataset.to),element=a?.element||b?.element;edge.style.display=!element||element===displayElement?'':'none';}}function chooseElement(value){if(api&&!api.element(value)){document.querySelector('#description').textContent='Invest in the elemental choice node first.';return;}chosenElement=value==='arcane'?null:value;selected=null;document.querySelector('.node.selected')?.classList.remove('selected');optionsOpen=false;updateVisibility();document.querySelector('#name').textContent=({arcane:'Arcane',fire:'Fire',frost:'Frost',lightning:'Lightning'})[value];document.querySelector('#description').textContent='Branch selected. Changing the element refunds points spent on element-specific skills.';if(api)refresh();document.querySelector('#requirements').replaceChildren();}updateVisibility();document.querySelector('#description').textContent='Invest in the ✺ node to choose an element. Switching refunds points spent on element-specific skills.';

