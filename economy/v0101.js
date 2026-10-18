/* Wanderer v0.10.1 — economy primitives. Pure, browser/Node compatible. */
(function(root){
  'use strict';
  const fields=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell'];
  const levels=Object.freeze({
    economy:{chance:.35,costFactor:.5},
    balanced:{chance:.50,costFactor:1},
    secure:{chance:.65,costFactor:1.5}
  });
  const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
  // Forge investments: 0 = Standard (1x), 1 = High Quality (2x), 2 = Masterwork (3x).
  // The boolean overload is retained for older v0.10.1 tests and save-independent callers.
  function qualityOdds(base,investment=0){
    const mode=investment===true?1:investment===false?0:Math.max(0,Math.min(2,Math.floor(Number(investment)||0)));
    const odds={...base};
    if(mode){
      if((odds.Legendary||0)!==0)throw new Error('Forge cannot make Legendary');
      const shift=Math.min(mode===2?.25:.17,Math.max(0,odds.Common));
      const uncommon=Math.min(mode===2?.05:.03,Math.max(0,odds.Uncommon));
      odds.Common-=shift;odds.Uncommon-=uncommon;
      odds.Rare+=shift*.7+uncommon*.7;
      odds.Epic+=shift*.3+uncommon*.3;
    }
    return odds;
  }
  function rarityFromOdds(odds,rng=Math.random){
    let x=rng();
    for(const key of ['Common','Uncommon','Rare','Epic']){
      x-=(odds[key]||0);
      if(x<0)return key;
    }
    return 'Epic'; // A Forge craft cannot roll Legendary.
  }
  function upgradeCost(tier,rank){
    if(!Number.isInteger(rank)||rank<0||rank>=10)throw new Error('Legendary already at max rank');
    const t=Math.max(1,Math.min(200,Math.floor(Number(tier)||1)));
    return Math.round((25+4*t)*Math.pow(1.14,rank));
  }
  function upgradeLegendary(item){
    if(!item||item.rarity!=='Legendary'||!Number.isInteger(item.upgradeRank||0)||(item.upgradeRank||0)>=10||(item.upgradeRank||0)<0)throw new Error('Not eligible for Legendary reinforcement');
    const current=item.upgradeRank||0;
    if(current>0&&(!item.upgradeBase||typeof item.upgradeBase!=='object'))throw new Error('Missing original Legendary stats');
    const base=item.upgradeBase||Object.fromEntries(fields.filter(k=>finite(Number(item[k]))&&Number(item[k])>0).map(k=>[k,Number(item[k])]));
    for(const [key,v]of Object.entries(base)){
      if(!fields.includes(key)||!finite(v)||v<0)throw new Error('Invalid original stat');
      item[key]=Math.round(v*(1+(current+1)*.02)*100)/100;
    }
    item.upgradeBase={...base};
    item.upgradeRank=current+1;
    return item;
  }
  function sigilPrice(tier){return 100+9*Math.max(1,Math.floor(Number(tier)||1));}
  function transferCost(tier,kind){
    const p=levels[kind];if(!p)throw new Error('Unknown investment');
    const t=Math.max(1,Math.min(200,Math.floor(Number(tier)||1)));
    return Math.max(1,Math.round((10+10*t)*p.costFactor));
  }
  function rollOffer(keys,rng=Math.random){
    if(!Array.isArray(keys)||keys.length<4||new Set(keys).size!==keys.length)throw new Error('Invalid affinity pool');
    const pool=[...keys],result=[];
    for(let i=0;i<4;i++){
      const j=Math.floor(rng()*pool.length);
      result.push(pool.splice(Math.min(pool.length-1,Math.max(0,j)),1)[0]);
    }
    return result;
  }
  function transfer(item,affinity,pool,kind,rng=Math.random){
    const p=levels[kind];
    if(!p||!item||item.rarity==='Legendary'||!pool.includes(affinity)||item.effect===affinity)throw new Error('Illegal affinity transfer');
    if(rng()>=p.chance)return false;
    item.effect=affinity;
    if(['Staff','Wand','Orb','Tome','Charm'].includes(item.subtype))item.magic=affinity;
    return true;
  }
  root.WandererEconomyV0101=Object.freeze({qualityOdds,rarityFromOdds,upgradeCost,upgradeLegendary,sigilPrice,transferCost,rollOffer,transfer,levels});
})(globalThis);
