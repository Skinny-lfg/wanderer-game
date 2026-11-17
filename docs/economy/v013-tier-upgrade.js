// v0.13 named equipment-tier upgrade. Pure calculations; game UI owns transactions.
(function(root){'use strict';
const P=root.WandererExpeditionProgression;
const C=root.WandererV013Crafting;
if(!P||!C)throw Error('Expedition progression and crafting must load first');
const STATS=Object.freeze(['atk','def','hp','str','agi','int','end','cha','mana','spell','evasionRating']);
const RARITY=Object.freeze({Common:1,Uncommon:1.2,Rare:1.5,Epic:2,Legendary:2.5});
const TARGETS=Object.freeze(P.tiers.filter(t=>t.minimum>1));
const round=n=>Math.round(n*100)/100;
function budget(tier){
 const level=Math.min(tier,5),base=2+level*.91;
 return base*(tier<=5?1:P.gearTier(tier).multiplier/P.gearTier(5).multiplier);
}
function nextTier(item){
 if(!item||!Number.isSafeInteger(item.tier)||item.tier<1||!RARITY[item.rarity])return null;
 const current=P.gearTier(item.tier).minimum;
 return TARGETS.find(t=>t.minimum>current)||null;
}
function price(item,target){
 if(!nextTier(item)||!target||target.minimum!==nextTier(item).minimum)return null;
 const rarity=RARITY[item.rarity];
 return {fragments:Math.ceil((30+9*target.minimum)*rarity),essence:Math.ceil((1+target.minimum/5)*rarity)};
}
function scaledItem(item,target){
 if(!target||target.minimum<=P.gearTier(item.tier).minimum)return null;
 const factor=budget(target.minimum)/budget(item.tier);
 if(!Number.isFinite(factor)||factor<=1)return null;
 const result={...item,tier:target.minimum};
 const rank=Number(item.upgradeRank)||0;
 if(item.rarity==='Legendary'&&rank>0){
  if(!item.upgradeBase||typeof item.upgradeBase!=='object')return null;
  result.upgradeBase={...item.upgradeBase};
  for(const key of STATS){
   const base=item.upgradeBase[key];
   if(base===undefined)continue;
   if(typeof base!=='number'||!Number.isFinite(base)||base<0)return null;
   if(base>0){const upgraded=round(base*factor);result.upgradeBase[key]=upgraded;result[key]=round(upgraded*(1+rank*.02));}
  }
 }else{
  for(const key of STATS)if(typeof item[key]==='number'&&Number.isFinite(item[key])&&item[key]>0)result[key]=round(item[key]*factor);
 }
 return result;
}
function owned(state,id){
 if(!state||typeof id!=='string'||!id)return null;
 const found=[];
 for(let i=0;i<(state.stash||[]).length;i++)if(state.stash[i]?.id===id)found.push({kind:'stash',index:i,item:state.stash[i]});
 for(const [slot,item]of Object.entries(state.equip||{}))if(item?.id===id)found.push({kind:'equip',slot,item});
 return found.length===1?found[0]:null;
}
function preview(state,id,unlocked){
 const location=owned(state,id),item=location?.item,target=nextTier(item);
 if(!location||!target||!Number.isSafeInteger(unlocked)||unlocked<1)return null;
 const cost=price(item,target),upgraded=scaledItem(item,target);
 if(!upgraded||!C.valid(state.crafting||C.create()))return null;
 const fragments=state.fragments,essence=(state.crafting||C.create()).essence;
 const requirements=[
  {name:'Expedition',have:unlocked,need:target.minimum},
  {name:'Fragments',have:fragments,need:cost.fragments},
  {name:'Essence',have:essence,need:cost.essence}
 ];
 const ready=Number.isSafeInteger(fragments)&&fragments>=0&&requirements.every(x=>x.have>=x.need);
 return {location,target,cost,upgraded,requirements,ready};
}
function prepare(state,id,unlocked){
 const p=preview(state,id,unlocked);if(!p?.ready)return null;
 const source=state.crafting||C.create();
 const crafting={...source,cores:{...source.cores},dryRooms:{...source.dryRooms},realmFamilies:[...source.realmFamilies],bossFamilies:[...source.bossFamilies]};
 crafting.essence-=p.cost.essence;
 return {location:{kind:p.location.kind,index:p.location.index,slot:p.location.slot},item:p.upgraded,fragments:state.fragments-p.cost.fragments,crafting};
}
root.WandererV013TierUpgrade=Object.freeze({STATS,budget,nextTier,price,scaledItem,owned,preview,prepare});
})(globalThis);
