// Adds named-tier upgrades to the v0.13 Forge without changing Legendary +rank reinforcements.
(function(root){'use strict';
const renderOriginal=root.renderV013Forge;
if(typeof renderOriginal!=='function')return;
const U=root.WandererV013TierUpgrade;
if(!U)throw Error('Named tier upgrade rules missing');
let selectedId=null;
function display(){
 const host=phase3ContentTarget||document.getElementById('screen');if(!host||!state)return;
 const unlocked=phase1Controller.state.unlocked;
 const owned=[...state.stash,...Object.values(state.equip).filter(Boolean)].filter(x=>U.nextTier(x));
 const unique=[...new Map(owned.map(x=>[x.id,x])).values()];
 if(!unique.some(x=>x.id===selectedId))selectedId=unique[0]?.id||null;
 const item=unique.find(x=>x.id===selectedId),p=item&&U.preview(state,item.id,unlocked);
 const busy=!economyCanAct(),req=p?.requirements||[];
 const requirements=req.map(r=>'<span class="'+(r.have>=r.need?'is-met':'is-missing')+'">'+esc(r.name)+' <b>'+r.have+' / '+r.need+'</b></span>').join('');
 const message=!p?'Find gear below Exalted to upgrade.':busy?'Finish your Expedition before using the Forge.':!p.ready?'Unlock Expedition E'+p.target.minimum+' and gather the listed materials.':'Ready: all requirements met.';
 const body=p?'<div class="tierUpgradeComparison"><div><span class="eyebrow">Current · E'+item.tier+'</span><h3>'+esc(item.name)+'</h3><p>'+esc(itemStats(item))+'</p></div><div><span class="eyebrow">Upgrade · '+esc(p.target.name)+' · E'+p.target.minimum+'</span><h3>'+esc(p.upgraded.name)+'</h3><p>'+esc(itemStats(p.upgraded))+'</p></div></div><p class="small muted">Keeps the original item ID, rarity, name, special effects, traits and equipment slot. No rerolls; tier bonuses apply to base attributes, not ability effects.</p><div class="v013TierCosts" aria-label="Upgrade requirements">'+requirements+'</div><p role="status" class="small muted">'+esc(message)+'</p><button class="primary" type="button" id="v013UpgradeTier" '+(!p.ready||busy?'disabled':'')+'>Upgrade to '+esc(p.target.name)+' · '+p.cost.fragments+' Fragments + '+p.cost.essence+' Essence</button>':'<p class="small muted">'+esc(message)+'</p>';
 const markup='<section class="panel v013TierUpgrade" aria-labelledby="v013TierTitle"><span class="eyebrow">Permanent equipment progression</span><h2 id="v013TierTitle">Upgrade existing gear</h2><p class="small muted">Improve an owned item, rather than crafting a replacement. Costs are fixed and displayed before confirmation.</p>'+(unique.length?'<label for="v013TierItem">Your item</label><select id="v013TierItem">'+unique.map(x=>'<option value="'+esc(x.id)+'" '+(x.id===selectedId?'selected':'')+'>'+esc(x.name)+' · E'+x.tier+' · '+esc(x.rarity)+(state.stash.includes(x)?' · Stash':' · Equipped')+'</option>').join('')+'</select>':'')+body+'</section>';
 host.insertAdjacentHTML('beforeend',markup);
 const chooser=document.getElementById('v013TierItem');if(chooser)chooser.onchange=event=>{selectedId=event.target.value;root.renderV013Forge();};
 const button=document.getElementById('v013UpgradeTier');if(button)button.onclick=()=>{
  const fresh=U.preview(state,selectedId,phase1Controller.state.unlocked);
  if(!fresh?.ready||!economyCanAct())return;
  showConfirm('Upgrade existing gear','Spend '+fresh.cost.fragments+' Fragments and '+fresh.cost.essence+' Essence to upgrade '+fresh.upgraded.name+' to '+fresh.target.name+'? The item keeps its identity and effects.',()=>{
   if(!economyCanAct())return;
   const result=U.prepare(state,selectedId,phase1Controller.state.unlocked);if(!result)return;
   const before={fragments:state.fragments,crafting:state.crafting,stash:state.stash,equip:state.equip};
   state.fragments=result.fragments;state.crafting=result.crafting;
   if(result.location.kind==='stash'){
    state.stash=state.stash.map((x,i)=>i===result.location.index&&x.id===result.item.id?result.item:x);
   }else{
    state.equip={...state.equip,[result.location.slot]:result.item};
   }
   if(!phase5Persist()){Object.assign(state,before);return;}
   root.renderV013Forge();
   const dialog=showModal('Equipment upgraded',previewItem(result.item,'forge')+'<p>Your equipment was upgraded permanently.</p>');
   phase3StyleGearDialog(dialog,result.item);
  },'Upgrade');
 };
}
root.renderV013Forge=function(){const result=renderOriginal.apply(this,arguments);display();return result;};
// A restored Forge view may have rendered before this script was loaded.
if(typeof view!=='undefined'&&view==='forge'&&document.querySelector('.v013Forge')&&!document.getElementById('v013TierTitle'))display();
})(globalThis);
