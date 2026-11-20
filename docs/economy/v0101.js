/* Wanderer — current equipment economy. Pure, browser/Node compatible. */
(function(root){
  'use strict';
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
  root.WandererEconomyV0101=Object.freeze({qualityOdds,rarityFromOdds});
})(globalThis);
