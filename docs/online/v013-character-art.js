// Equipment-driven character portraits. Presentation only; no save or combat changes.
(function(root){
  'use strict';
  const mainTypes=Object.freeze({
    Sword:'sword',Mace:'mace',Daggers:'dagger',Wand:'wand',
    'Two-Handed':'twohand',Bow:'bow',Staff:'staff'
  });
  const offhandTypes=Object.freeze({
    Shield:'shield',Orb:'orb',Tome:'tome',Charm:'charm',
    'Off-Hand Dagger':'dagger',Daggers:'dagger'
  });
  const singleHanded=new Set(['sword','mace','dagger','wand']);
  const has=(map,key)=>typeof key==='string'&&Object.prototype.hasOwnProperty.call(map,key);
  function imageForEquipment(equipment){
    const primary=equipment?.weapon?.subtype;
    const secondary=equipment?.offhand?.subtype;
    const main=has(mainTypes,primary)?mainTypes[primary]:'base';
    const off=has(offhandTypes,secondary)?offhandTypes[secondary]:null;
    const name=(singleHanded.has(main)&&off)?main+'-'+off:main;
    return 'assets/characters/loadouts/'+name+'.webp';
  }
  root.WandererCharacterArt=Object.freeze({imageForEquipment});
})(typeof window!=='undefined'?window:globalThis);
