'use strict';
globalThis.WandererActionBar = (() => {
  const snapshots = new WeakMap();
  const webpIcons = new Set(["blood_ward","carrion_detonation","counterstrike","crimson_pact","crimson_rush","elemental_blight","fervent_life","guardians_oath","hemal_sigil","hemovore","hex_bleed","hex_bolt","iron_reversal","lifeweave","life_conduit","plague_rupture","prismatic_rebound","reapers_cadence","redline","rot_husk","rot_recovery","rot_symbiosis","rot_ward","runic_shield","sanctuary","sanguine_reprisal","spellblade","spell_surge","toxic_precision","venom_shatter"]);
  const passiveIcon = id => "passives/"+id+(webpIcons.has(id)?".webp":".png");
  const weaponActions = {
    arcaneGuard:{name:'Arcane Guard',icon:'passives/barrier_pulse.png'},
    wandOrbBarrier:{name:'Orb Ward',icon:'passives/runic_shield.webp'},
    heavyGuard:{name:'Heavy Guard',icon:'passives/iron_skin.png'},
    shieldBaseCounter:{name:'Shield Counter',icon:'passives/retaliation.png'}
  };
  function slots(run, build, now) {
    const cycle = run.playerAttackPeriod || 1 / run.stats.attacksPerSec;
    const weapon = run.stats.main;
    const rows = [{label:run.unfundedAttack?'Fallback Strike':weapon?.subtype==='Staff'||weapon?.subtype==='Wand'?'Basic Cast':'Basic Attack', icon:'equipment/'+({Staff:'staff', 'Two-Handed':'two_handed', Daggers:'dagger',Bow:'bow',Mace:'mace',Wand:'wand'}[weapon?.subtype] || 'sword')+'_01.png',
      left:Math.max(0,cycle-(run.tPlayer||0)), period:cycle, count:run.autoUses||0}];
    const labels = globalThis.WandererV012Buildcraft.CATALOG;
    for (const [key, expiry] of Object.entries({...run.setCooldowns,...build?.cooldowns})) {
      const action = weaponActions[key];
      const normalized = key.toLowerCase().replace(/[^a-z0-9]/g,'');
      const talent = labels.find(t=>t.id.replaceAll('_','')===normalized);
      rows.push({label:talent?.name || action?.name || key.replace(/([A-Z])/g,' $1').trim(),icon:talent?passiveIcon(talent.id):action?.icon||'passives/barrier_pulse.png',
        left:Math.max(0,expiry-now),period:build?.cooldownPeriods?.[key]||run.cooldownPeriods?.[key]||0,count:expiry});
    }
    for(const [id,record] of Object.entries(build?.runtime.passiveTelemetry||{})){
      const talent=labels.find(t=>t.id===id);
      if(record.activations&&!rows.some(row=>row.label===talent?.name))
        rows.push({label:talent?.name||id,icon:passiveIcon(id),left:0,period:0,count:record.activations});
    }
    for(const id of new Set(build?.runtime.permanentTalents||[])){
      if(!['barrier_pulse','retaliation','adrenaline','brutal_crit'].includes(id))continue;
      const talent=labels.find(t=>t.id===id);
      if(talent&&!rows.some(r=>r.label===talent.name))rows.push({label:talent.name,icon:passiveIcon(id),left:0,period:0,count:0});
    }
    if(build?.runtime.prepared){
      const id=build.runtime.prepared,ability=globalThis.WandererAutomaticTalents.NODES.find(n=>n.id===id);
      const hints={red_guillotine:(run.aim||0)+'/3',turn_tide:run.riposteUntil>now?'Riposte ready':'Guard',last_bastion:run.bastionUntil?'Triggered':'Lethal hit',lifeweaver:run.lifeCharge?'Charged':'Overheal',grave_bloom:(run.echoCount||0)+'/3',septic_wound:run.enemy?.septicMark?'Marked':'Rot + Bleed'};
      if(ability)rows.push({label:ability.name,emoji:ability.icon,hint:hints[id],count:run.outerUses?.[id]||0,left:0,period:0});
    }
    return [rows[0],...rows.slice(1).sort((a,b)=>a.label.localeCompare(b.label))];
  }
  function draw(host,rows,resolveIcon=name=>'assets/'+name){
    if(!host)return;
    let previous=snapshots.get(host)||[];
    rows.forEach((row,i)=>{
      let cell=host.children[i];
      if(!cell){cell=document.createElement('div');cell.className='actionSlot';cell.innerHTML='<b></b><span></span><small></small><progress max="1"></progress>';host.append(cell);}
      const [icon,label,status,bar]=cell.children;
      cell.tabIndex=0;
      cell.title=row.label+(row.left>0?' · '+row.left.toFixed(1)+'s remaining':row.period?' · Available when triggered':' · Triggered '+row.count+' times');
      cell.style.setProperty('--cooldown',Math.round(100*Math.min(1,Math.max(0,row.period?row.left/row.period:0)))+'%');
      icon.style.backgroundImage=row.icon?'url("'+resolveIcon(row.icon)+'")':'none';
      icon.textContent=row.emoji||'';label.textContent=row.label;status.textContent=row.hint|| (row.left>0?row.left.toFixed(1):row.period?'Ready':row.count?'×'+row.count:'…');
      bar.value=row.period?Math.max(0,1-row.left/row.period):1;
      if(previous[row.label]!==undefined&&row.count!==previous[row.label]&&row.count)cell.dataset.used=String(Date.now());
      cell.classList.toggle('used',Date.now()-Number(cell.dataset.used||0)<380);
    });
    while(host.children.length>rows.length)host.lastChild.remove();
    snapshots.set(host,Object.fromEntries(rows.map(r=>[r.label,r.count])));
  }
  return {slots,draw};
})();
