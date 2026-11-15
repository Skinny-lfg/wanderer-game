'use strict';
globalThis.WandererArenaHud = (() => {
  function mount(run) {
    const scene = document.getElementById('scene');
    if (!scene || document.getElementById('arenaHud')) return;
    const hero = scene.querySelector('.combatant:not(.arenaSingleEnemy)');
    const bar = document.getElementById('combatActionBar');
    if (!hero || !bar) return;
    const hud = document.createElement('section');
    hud.id = 'arenaHud';
    hud.className = 'arenaHud';
    hud.setAttribute('aria-label', 'Combat resources and automatic actions');
    hud.innerHTML = '<div class="arenaHeroReadout"><img class="arenaHudPortrait" alt=""><div class="arenaResources"></div></div><div class="arenaAbilities"><span class="arenaAutoLabel">Auto combat</span></div><div class="arenaControls"></div><p class="arenaImpact" id="arenaImpact" aria-live="off"></p>';
    const portrait = hud.querySelector('.arenaHudPortrait');
    portrait.src = document.getElementById('heroPortrait').src;
    const resources = hud.querySelector('.arenaResources');
    resources.append(document.getElementById('heroName'));
    const health = hero.querySelector('.hpbar.player');
    health.classList.add('arenaHealth');
    health.append(document.getElementById('heroHpText'));
    resources.append(health);
    const mana = document.getElementById('heroMpBar');
    if (mana) {
      const label = document.createElement('small');
      label.id = 'arenaManaText';
      mana.append(label);
      resources.append(mana);
    }
    const barrier = document.getElementById('barrierText');
    const oldSummary = barrier?.parentElement;
    const shield = document.createElement('div');
    shield.className = 'arenaShieldBar';
    shield.setAttribute('role', 'progressbar');
    shield.setAttribute('aria-label', 'Barrier');
    shield.innerHTML = '<i id="arenaBarrierFill"></i><small>Barrier <span id="arenaBarrierValue"></span></small>';
    if (barrier) shield.querySelector('small').replaceChild(barrier, shield.querySelector('span'));
    resources.append(shield);
    if (oldSummary) oldSummary.hidden = true;
    hud.querySelector('.arenaAbilities').append(bar);
    const actions = scene.parentElement.querySelector('.combatActions');
    if (actions) hud.querySelector('.arenaControls').append(actions);
    scene.after(hud);
    scene.classList.add('hasArenaHud');
    update(run);
  }
  function update(run) {
    const hud = document.getElementById('arenaHud');
    if (!hud) return;
    const mana = document.getElementById('arenaManaText');
    if (mana) mana.textContent = Math.floor(run.mp) + ' / ' + Math.ceil(run.maxmp);
    const barrierMax = Math.max(8, Math.round(run.maxhp * .3));
    const shield = hud.querySelector('.arenaShieldBar');
    shield.setAttribute('aria-valuemin', '0');
    shield.setAttribute('aria-valuemax', String(barrierMax));
    shield.setAttribute('aria-valuenow', String(Math.round(run.barrier)));
    document.getElementById('arenaBarrierFill').style.width = Math.min(100, run.barrier / barrierMax * 100) + '%';
    document.querySelector('.heroArenaSprite')?.classList.toggle('hasBarrier', run.barrier > 0);
    const impact = run.lastImpact;
    document.getElementById('arenaImpact').textContent = !impact ? 'Your build fights automatically.' :
      impact.dodge ? 'Attack avoided' :
      'Barrier absorbed ' + Math.round(impact.barrier || 0) + '  ·  Health lost ' + Math.round(impact.hit || 0);
  }
  return {mount, update};
})();
