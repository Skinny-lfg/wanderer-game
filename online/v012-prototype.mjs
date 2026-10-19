import {STORAGE_KEY,FAMILIES,PATHS,PASSIVES,SLOTS,newProfile,stats,begin,choosePassive,choosePath,rerollPath,resolveRoom,usePotion,tick,abandon,leaveFinished,equip,inventoryScore} from './v012-engine.mjs';
let profile,open=false,healthPots=2,paused=false,speed=2,error='',autosave=0;
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const $=(sel)=>document.querySelector(sel);
try{const raw=localStorage.getItem(STORAGE_KEY);const loaded=raw?JSON.parse(raw):null;profile=loaded&&loaded.version===1&&Array.isArray(loaded.inventory)&&loaded.equipped&&Number.isFinite(loaded.unlocked)?loaded:newProfile();}catch{profile=newProfile();error='The isolated prototype save could not be read. Started a new test profile.';}
function persist(){try{localStorage.setItem(STORAGE_KEY,JSON.stringify(profile));}catch{error='Prototype local save unavailable. Real Wanderer saves have not been changed.';}}
function idFromButton(b){return b.dataset.id;}
function passiveCard(id){
 const p=PASSIVES.find(x=>x.id===id),a=FAMILIES[p.affinity],hybrid=p.requires.length>0;
 return '<button class="v12-passive" data-action="passive" data-id="'+esc(id)+'"><span class="v12-tag" style="--accent:'+a.color+'">'+esc(a.icon+' '+a.name)+(hybrid?' + hybrid':'')+'</span><strong>'+esc(p.name)+'</strong><small>'+esc(p.description)+'</small></button>';
}
function affChip(f){return '<span class="v12-chip" style="--accent:'+FAMILIES[f].color+'">'+esc(FAMILIES[f].icon+' '+FAMILIES[f].name)+'</span>';}
function statsBar(label,current,total){
 const pct=total?Math.max(0,Math.min(100,100*current/total)):0;
 return '<div class="v12-bar-label"><span>'+esc(label)+'</span><b>'+Math.ceil(Math.max(0,current))+' / '+Math.round(total)+'</b></div><div class="v12-bar"><span style="width:'+pct+'%"></span></div>';
}
function gearPanel(){
 const rows=SLOTS.map(slot=>{
 const equipped=profile.inventory.find(x=>x.id===profile.equipped[slot]);
 const options=profile.inventory.filter(x=>x.slot===slot).sort((a,b)=>(b.atk+b.armor+b.hp*.1+b.mana*.1)-(a.atk+a.armor+a.hp*.1+a.mana*.1));
 return '<div class="v12-gear-row"><span class="v12-gear-slot">'+esc(slot)+'</span><div><strong>'+esc(equipped?.name||'Empty')+'</strong><small>'+esc(equipped?'ATK '+equipped.atk+' · ARM '+equipped.armor+' · HP '+equipped.hp+(equipped.affinity?' · '+FAMILIES[equipped.affinity].name+' trait':''):'No equipment')+'</small></div><select data-slot="'+esc(slot)+'" aria-label="Equip '+esc(slot)+'">'+options.map(x=>'<option value="'+x.id+'"'+(x.id===profile.equipped[slot]?' selected':'')+'>'+esc(x.name)+' (ATK '+x.atk+', ARM '+x.armor+')</option>').join('')+'</select></div>';
 }).join('');
 return '<section class="v12-panel"><div class="v12-section-head"><h3>Permanent Equipment</h3><span>'+profile.inventory.length+' items · Gear score '+Math.round(inventoryScore(profile))+'</span></div><div class="v12-gear-list">'+rows+'</div><p class="v12-muted">Gear survives wins and defeats. This prototype stores it separately from the live game. Merchant and Forge remain unchanged in the classic mode.</p></section>';
}
function camp(){
 const status='<div class="v12-metrics"><span><b>D'+profile.unlocked+'</b><small>Highest unlocked</small></span><span><b>'+profile.gold+'</b><small>Gold</small></span><span><b>'+profile.fragments+'</b><small>Fragments</small></span><span><b>'+profile.record.length+'</b><small>Runs</small></span></div>';
 const potionSelector='<div class="v12-pot-grid"><strong>Health Potions</strong><div>'+[0,1,2,3].map(n=>'<button data-action="pots" data-count="'+n+'" class="'+(n===healthPots?'active':'')+'">'+n+'</button>').join('')+'</div><span>'+healthPots+' HP / '+(3-healthPots)+' Mana · three slots total</span></div>';
 const families=Object.entries(FAMILIES).map(([id,a])=>'<button class="v12-family" data-action="begin" data-id="'+id+'" style="--accent:'+a.color+'"><span>'+a.icon+'</span><strong>'+esc(a.name)+'</strong><small>'+esc(a.kind)+'</small></button>').join('');
 return '<div class="v12-stack"><section class="v12-panel"><h2>Choose an initial affinity</h2><p class="v12-muted">Start at D'+profile.unlocked+' with your permanent gear. The first path offer is guaranteed to include your chosen affinity. Only one enemy fights at a time; no manual targeting.</p>'+status+potionSelector+'<div class="v12-family-grid">'+families+'</div></section>'+gearPanel()+'</div>';
}
function startReward(r){
 return '<section class="v12-panel"><span class="v12-eyebrow">Start of adventure</span><h2>Choose one initial '+esc(FAMILIES[r.initial].name)+' passive</h2><p class="v12-muted">Your base affinity activates immediately. These three passives are drawn from the selected family.</p><div class="v12-rewards">'+r.passiveOffers.map(passiveCard).join('')+'</div></section>';
}
function pathSelect(r){
 const locked=r.lastPathAffinity&&r.room>1?FAMILIES[r.lastPathAffinity]:null;
 const cards=r.pathOffers.map((id,index)=>{
 const p=PATHS.find(x=>x.id===id),a=FAMILIES[p.affinity];
 return '<div class="v12-path"><div class="v12-path-image" style="background-image:linear-gradient(0deg,#13121b 0%,transparent 80%),url('+esc(p.background)+')"></div><div class="v12-path-body"><span class="v12-tag" style="--accent:'+a.color+'">'+esc(a.icon+' '+a.name)+'</span><strong>'+esc(p.name)+'</strong><small>Earn 1 of 3 '+esc(a.name)+' passives after completing this room.</small><button data-action="path" data-id="'+esc(id)+'" class="v12-primary">Enter plan</button><button data-action="reroll" data-index="'+index+'" '+(r.rerolls<1||(r.room===1&&p.affinity===r.initial)?'disabled':'')+'>↻ Reroll plan ('+r.rerolls+' left)</button></div></div>';
 }).join('');
 const upcoming=r.rooms[r.room-1];
 return '<section class="v12-panel"><span class="v12-eyebrow">Room '+r.room+'/15 · '+esc(upcoming.toUpperCase())+'</span><h2>Choose a plan</h2><p class="v12-muted">'+(locked?'Affinity locked for this choice: '+esc(locked.name)+'. ':'')+'Select the environment and affinity of the passive reward. You can collect all five families in one run.</p><div class="v12-path-grid">'+cards+'</div></section>';
}
function reward(r){
 const p=PATHS.find(x=>x.id===r.selectedPath),a=FAMILIES[p.affinity];
 return '<section class="v12-panel"><span class="v12-eyebrow">Room '+r.room+' cleared</span><h2>'+esc(a.icon+' '+a.name)+' — choose a passive</h2><p class="v12-muted">Hybrid effects appear when their prerequisite families are already unlocked. Affinities and passives expire when the expedition ends.</p><div class="v12-rewards">'+r.passiveOffers.map(passiveCard).join('')+'</div></section>';
}
function combat(r,s){
 const f=r.fight,e=f.enemy;
 const health=statsBar('Health',r.hp,s.hp),mana=statsBar('Mana',r.mp,s.mana);
 return '<section class="v12-panel v12-combat"><div class="v12-section-head"><div><span class="v12-eyebrow">Room '+r.room+'/15 · '+esc(r.rooms[r.room-1])+'</span><h2>Wave '+(f.wave+1)+' / '+f.waves+'</h2></div><button data-action="pause">'+(paused?'Resume':'Pause')+'</button></div><div class="v12-combat-scene"><div class="v12-player"><div class="v12-portrait">🛡️</div><strong>Your Wanderer</strong>'+health+mana+'<small>ATK '+s.attack.toFixed(1)+' · DEF '+s.armor.toFixed(1)+' · Speed '+s.speed.toFixed(2)+'</small></div><div class="v12-versus">VS</div><div class="v12-enemy"><div class="v12-portrait">'+(e.boss?'👑':e.elite?'💀':'⚔️')+'</div><strong>'+esc(e.name)+'</strong>'+statsBar('Enemy HP',e.hp,e.maxhp)+'<small>Bleed stacks: '+e.bleed+' · Attack: '+e.attack+'</small></div></div><div class="v12-pot-actions"><button data-action="potion" data-kind="hp" '+(r.potions.hp<1?'disabled':'')+'>❤️ Health potion ('+r.potions.hp+')</button><button data-action="potion" data-kind="mana" '+(r.potions.mana<1?'disabled':'')+'>💧 Mana potion ('+r.potions.mana+')</button></div><p class="v12-muted">Attacks and enemies are automatic. One enemy is active per wave. Potion timing is the combat decision; enemies attack on their own cooldown.</p></section>';
}
function nonCombat(r,s){
 const type=r.stage;
 let title='',desc='',buttons='';
 if(type==='chest'){title='Hidden chest';desc='A chest has been found. Take permanent equipment or recover some health.';buttons='<button class="v12-primary" data-action="resolve" data-id="treasure">Open for gear</button><button data-action="resolve" data-id="heal">Recover 25% HP</button>';}
 if(type==='event'){title='Uncertain encounter';desc='Take a risk and lose 17% Max HP for guaranteed equipment, or recover 12% HP safely.';buttons='<button class="v12-primary" data-action="resolve" data-id="risk">Risk: guaranteed gear</button><button data-action="resolve" data-id="safe">Safe: recover HP</button>';}
 if(type==='altar'){title='Ancient altar';desc='Choose whether to restore HP or Mana.';buttons='<button class="v12-primary" data-action="resolve" data-id="heal">Recover 35% HP</button><button data-action="resolve" data-id="mana">Recover 65% Mana</button>';}
 return '<section class="v12-panel"><span class="v12-eyebrow">Room '+r.room+'/15</span><h2>'+title+'</h2><p>'+desc+'</p>'+statsBar('Health',r.hp,s.hp)+statsBar('Mana',r.mp,s.mana)+'<div class="v12-pot-actions">'+buttons+'</div></section>';
}
function finished(r){
 const won=r.result.startsWith('Victory');
 return '<section class="v12-panel v12-finish"><span class="v12-big-icon">'+(won?'🏆':'☠️')+'</span><h2>'+esc(r.result)+'</h2><p>Your gear, Gold and Fragments persist. Your temporary affinities and passives will be reset before the next adventure.</p><div class="v12-metrics"><span><b>'+r.loot.length+'</b><small>Gear items found</small></span><span><b>'+r.passives.length+'</b><small>Passives learned</small></span><span><b>'+r.affinities.length+'</b><small>Affinities explored</small></span></div><button class="v12-primary" data-action="leave">Return to camp</button></section>';
}
function render(){
 if(!open)return;
 const host=$('#v012-overlay');if(!host)return;
 const r=profile.run,s=stats(profile);
 const rbar=r&&r.stage!=='finished'?'<div class="v12-progress"><span>Difficulty '+r.level+' · Room '+r.room+'/15</span><span>'+r.passives.length+' passives · '+r.rerolls+' rerolls</span></div>':'';
 const affinities=r?r.affinities.map(affChip).join(''):'';
 let body=!r?camp():r.stage==='startReward'?startReward(r):r.stage==='path'?pathSelect(r):r.stage==='reward'?reward(r):r.stage==='combat'?combat(r,s):r.stage==='finished'?finished(r):nonCombat(r,s);
 let gearStrip=r&&r.stage!=='finished'?'<div class="v12-side"><section class="v12-panel"><div class="v12-section-head"><h3>Active affinities</h3><span>'+r.affinities.length+'/5</span></div><div class="v12-chips">'+affinities+'</div><p class="v12-muted">'+r.passives.length+' temporary passives · '+profile.inventory.length+' permanent items</p><div class="v12-pot-actions"><button data-action="potion" data-kind="hp" '+(!r.potions.hp?'disabled':'')+'>❤️ '+r.potions.hp+'</button><button data-action="potion" data-kind="mana" '+(!r.potions.mana?'disabled':'')+'>💧 '+r.potions.mana+'</button></div></section><section class="v12-panel"><h3>Expedition log</h3><div class="v12-log">'+r.log.slice(0,8).map(x=>'<div>'+esc(x)+'</div>').join('')+'</div></section><button class="v12-danger" data-action="abandon">Abandon expedition</button></div>':'';
 host.innerHTML='<div class="v12-shell"><header class="v12-header"><div><span class="v12-eyebrow">DEVELOPMENT ONLY · ISOLATED SAVE</span><h1>WANDERER <small>v0.12 prototype</small></h1></div><button data-action="close" class="v12-close" aria-label="Close prototype">✕ Close</button></header>'+rbar+(error?'<div class="v12-error">'+esc(error)+'</div>':'')+'<div class="v12-layout"><div class="v12-main">'+body+'</div>'+gearStrip+'</div><footer class="v12-footer">Experimental battle balance. Original D1–D200 gameplay, accounts and cloud saves are unchanged. Local prototype save key: '+STORAGE_KEY+'</footer></div>';
}
function dispatch(action,b){
 error='';
 switch(action){
  case 'close':open=false;paused=true;$('#v012-overlay').remove();document.body.classList.remove('v12-open');return;
  case 'pots':healthPots=+b.dataset.count;break;
  case 'begin':begin(profile,idFromButton(b),healthPots);paused=false;break;
  case 'passive':choosePassive(profile,idFromButton(b));break;
  case 'path':choosePath(profile,idFromButton(b));paused=false;break;
  case 'reroll':rerollPath(profile,+b.dataset.index);break;
  case 'resolve':resolveRoom(profile,idFromButton(b));break;
  case 'potion':usePotion(profile,b.dataset.kind);break;
  case 'pause':paused=!paused;break;
  case 'abandon':if(!confirm('End this prototype run? Permanent loot will remain.'))return;abandon(profile);break;
  case 'leave':leaveFinished(profile);break;
  default:return;
 }
 persist();render();
}
function show(){
 if(open)return;open=true;paused=false;
 const el=document.createElement('div');el.id='v012-overlay';el.setAttribute('role','dialog');el.setAttribute('aria-label','Wanderer v0.12 prototype');document.body.appendChild(el);document.body.classList.add('v12-open');
 el.addEventListener('click',evt=>{const b=evt.target.closest('button[data-action]');if(!b)return;try{dispatch(b.dataset.action,b);}catch(e){error=e.message;render();}});
 el.addEventListener('change',evt=>{const select=evt.target.closest('select[data-slot]');if(!select)return;try{equip(profile,+select.value);persist();render();}catch(e){error=e.message;render();}});
 render();
}
function addLauncher(){
 if($('#v012-launch'))return;
 const b=document.createElement('button');b.id='v012-launch';b.type='button';b.textContent='⚗ v0.12 Playtest';b.title='Opens a separate experimental prototype. Live saves remain unchanged.';b.addEventListener('click',show);
 const header=$('.brandRow');if(header)header.appendChild(b);else document.body.appendChild(b);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',addLauncher,{once:true});else addLauncher();
setInterval(()=>{if(!open||paused||profile.run?.stage!=='combat'||document.hidden)return;
 try{for(let i=0;i<speed;i++)tick(profile,.2);autosave++;if(autosave%4===0)persist();render();}
 catch(e){paused=true;error='Combat paused: '+e.message;render();}
},150);
document.addEventListener('visibilitychange',()=>{if(document.hidden&&profile.run?.stage==='combat')persist();});
