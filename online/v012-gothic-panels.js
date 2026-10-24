(() => {
  'use strict';

  if (window.__wandererGothicCornersV3) return;
  window.__wandererGothicCornersV3 = true;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'online/v012-gothic-panels.css';
  css.dataset.gothicCornerSystem = 'v3';
  document.head.append(css);

  const largeSelector = [
    '.phase3Camp', '.phase3Between',
    '.phase3CityCenter', '.phase5VisualSummary',
    '.equipmentOverview', '.equipmentInventory',
    '#screen > .combatLayout > .panel',
    '#screen > .panel:not(.phase3CampSideStats):not(.phase3AffinityShrine):not(.phase3AffinityPending)',
    '#screen > .equipmentLayout > .equipmentLeft > .panel',
    '#screen > .equipmentLayout > .equipmentRight > .panel',
  ].join(',');

  const mediumSelector = [
    '.phase3CampSideStats',
    '.phase3AffinityShrine',
    '.phase3AffinityPending',
    '.phase3ExpeditionPanel',
    '.phase3CityCenter .cityCenterLayout .panel:not(.forgeUnified):not(.forgeCraftOdds)',
    'dialog.phase3InitialAffinityDialog',
    'dialog.phase3MagicElementDialog',
    '[data-gothic-size="medium"]',
  ].join(',');

  const smallSelector = [
    '.phase3BetweenTabs [role="tab"]',
    '#nav button',
    '.phase3Nav button',
    '.cityCenterTabs button',
    '.merchantCategoryTabs button',
    '.cityBlacksmithNav [role="tab"]',
    '.inventoryJumpNav button',
    '.merchantCardActions button',
    '.potionOffer button',
    '.forgePicker button',
    '.forgeCraftLayout button',
    '.phase3RealmActions button',
    '.cityBlacksmithNav a',
    'dialog button[data-confirm]',
    'dialog button[data-close]',
    '[data-gothic-size="small"]',
  ].join(',');

  const conventionalButtonSelector = [
    'button:not(.phase3Start):not(.slotTile):not(.miniSlot):not(.invItem)',
    ':not(.phase3PotionSlot):not(.phase1DraftCard):not(.phase1Offer)',
    ':not(.lootCard):not(.phase3BagItem):not(.phase3MagicElementChoice)',
    ':not(.phase3PassiveChoice):not(.protectionChoice):not(.potionStackTile)',
    ':not(.phase3CharacterPickerHitbox)',
  ].join('') + ',.cityBlacksmithNav a';

  const sizes = ['large', 'medium', 'small'];
  const imageBySize = {
    large: 'assets/ui-kit/gothic-corners/ornate-tr.png',
    medium: 'assets/ui-kit/gothic-corners/medium-gold-tr.png',
    small: 'assets/ui-kit/gothic-corners/small-silver-tr.png',
  };

  const makeLayer = (panel, size, isButton = false) => {
    let layer = panel.querySelector(':scope > .gothic-corner-layer');
    if (!layer) {
      layer = document.createElement('span');
      layer.className = 'gothic-corner-layer' + (isButton ? ' gothic-corner-layer--button' : '');
      layer.setAttribute('aria-hidden', 'true');
      panel.prepend(layer);
    }
    layer.classList.toggle('gothic-corner-layer--button', isButton);

    const source = imageBySize[size];
    for (const corner of ['tl', 'tr', 'bl', 'br']) {
      let image = layer.querySelector(`.gothic-corner--${corner}`);
      if (!image) {
        image = document.createElement('img');
        image.className = `gothic-corner gothic-corner--${corner}`;
        image.alt = '';
        image.draggable = false;
        layer.append(image);
      }
      if (image.getAttribute('src') !== source) image.src = source;
    }
  };

  const inferredSize = panel => {
    if (panel.matches(mediumSelector)) return 'medium';
    if (panel.matches(largeSelector)) return 'large';
    if (panel.matches(smallSelector)) {
      if (panel.matches('button,a') && !panel.matches('[data-gothic-size="small"]')) {
        const rect = panel.getBoundingClientRect();
        if (rect.width < 34 || rect.height < 30) return null;
      }
      return 'small';
    }
    if (panel.matches(conventionalButtonSelector)) {
      const rect = panel.getBoundingClientRect();
      if (rect.width >= 68 && rect.height >= 34 && rect.height <= 100) return 'small';
      return null;
    }
    if (panel.matches('dialog')) {
      const rect = panel.getBoundingClientRect();
      if (rect.width >= 820 || rect.height >= 720) return 'large';
      if (rect.width >= 480 || rect.height >= 360) return 'medium';
      return 'small';
    }
    return null;
  };

  const applyStyle = panel => {
    if (!(panel instanceof Element)) return;
    const size = inferredSize(panel);
    const isButton = panel.matches('button,a') && panel.matches(conventionalButtonSelector);
    if (!size) {
      if (isButton && panel.classList.contains('gothic-button-ornamented')) {
        panel.classList.remove('gothic-button-ornamented');
        panel.querySelector(':scope > .gothic-corner-layer')?.remove();
      }
      return;
    }
    if (isButton) {
      panel.classList.remove(...sizes.map(value => `gothic-panel--${value}`), 'gothic-panel--ornate', 'gothic-panel--standard');
      panel.classList.add('gothic-button-ornamented');
      const rect = panel.getBoundingClientRect();
      const cornerSize = Math.max(8, Math.min(13, rect.height * .30, rect.width * .12));
      if (panel.style.getPropertyValue('--gothic-corner-size') !== `${cornerSize}px`) {
        panel.style.setProperty('--gothic-corner-size', `${cornerSize}px`);
      }
      makeLayer(panel, size, true);
      if (dialogSizes && !panel.dataset.gothicButtonObserved) {
        panel.dataset.gothicButtonObserved = 'true';
        dialogSizes.observe(panel);
      }
      return;
    }
    panel.classList.remove(...sizes.map(value => `gothic-panel--${value}`), 'gothic-panel--ornate', 'gothic-panel--standard');
    panel.classList.remove('gothic-button-ornamented');
    panel.classList.add(`gothic-panel--${size}`);
    makeLayer(panel, size);
    if (panel.matches('dialog') && panel.querySelector(':scope > .gothic-corner-layer')) {
      panel.querySelector(':scope > .gothic-corner-layer').classList.add('gothic-corner-layer--viewport');
      syncDialogLayer(panel);
    }
    if (panel.matches('dialog') && dialogSizes && !panel.dataset.gothicCornerObserved) {
      panel.dataset.gothicCornerObserved = 'true';
      dialogSizes.observe(panel);
    }
  };

  function syncDialogLayer(dialog) {
    const layer = dialog.querySelector(':scope > .gothic-corner-layer');
    if (!layer) return;
    const rect = dialog.getBoundingClientRect();
    layer.style.setProperty('--gothic-layer-top', `${rect.top}px`);
    layer.style.setProperty('--gothic-layer-left', `${rect.left}px`);
    layer.style.setProperty('--gothic-layer-width', `${rect.width}px`);
    layer.style.setProperty('--gothic-layer-height', `${rect.height}px`);
  }

  const scan = root => {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches(`${largeSelector},${mediumSelector},${smallSelector},${conventionalButtonSelector},dialog`)) applyStyle(root);
    root.querySelectorAll(`${largeSelector},${mediumSelector},${smallSelector},${conventionalButtonSelector},dialog`).forEach(applyStyle);
  };

  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node instanceof Element) scan(node);
      });
    }
  });
  const dialogSizes = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => {
    entries.forEach(entry => {
      if (entry.target instanceof HTMLDialogElement) {
        applyStyle(entry.target);
        syncDialogLayer(entry.target);
      } else applyStyle(entry.target);
    });
  }) : null;

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('toggle', event => {
    if (event.target instanceof HTMLDialogElement) applyStyle(event.target);
  }, true);
  window.addEventListener('resize', () => document.querySelectorAll('dialog').forEach(applyStyle), { passive: true });
  window.addEventListener('scroll', () => document.querySelectorAll('dialog.gothic-panel--medium,dialog.gothic-panel--large').forEach(syncDialogLayer), { passive: true, capture: true });
  scan(document);
})();
