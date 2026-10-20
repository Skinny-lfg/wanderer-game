/* Wanderer — current equipment economy. Pure, browser/Node compatible. */
(function(root){
  'use strict';
  const fields=['atk','def','hp','spd','str','agi','int','end','cha','mana','spell','evasionRating'];
  const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
  // Forge investments: 0 = Standard (1x), 1 = High Quality (2x), 2 = Masterwork (3x).
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




  root.WandererEconomyV0101=Object.freeze({qualityOdds,rarityFromOdds,upgradeCost,upgradeLegendary});
})(globalThis);
