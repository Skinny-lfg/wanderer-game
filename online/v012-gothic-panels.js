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
    '.phase3Camp', '.phase3ExpeditionPanel', '.phase3Between',
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
    'dialog.phase3InitialAffinityDialog',
    'dialog.phase3MagicElementDialog',
    '[data-gothic-size="medium"]',
  ].join(',');

  const smallSelector = [
    '.phase3BetweenTabs [role="tab"]',
    '.cityBlacksmithNav [role="tab"]',
    '.inventoryJumpNav button',
    '[data-gothic-size="small"]',
  ].join(',');

  const sizes = ['large', 'medium', 'small'];
  const imageBySize = {
    large: 'assets/ui-kit/gothic-corners/ornate-tr.png',
    medium: 'assets/ui-kit/gothic-corners/medium-gold-tr.png',
    small: 'assets/ui-kit/gothic-corners/small-silver-tr.png',
  };

  const makeLayer = (panel, size) => {
    let layer = panel.querySelector(':scope > .gothic-corner-layer');
    if (!layer) {
      layer = document.createElement('span');
      layer.className = 'gothic-corner-layer';
      layer.setAttribute('aria-hidden', 'true');
      panel.prepend(layer);
    }

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
    if (panel.matches(smallSelector)) return 'small';
    if (panel.matches(largeSelector)) return 'large';
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
    if (!size) return;
    panel.classList.remove(...sizes.map(value => `gothic-panel--${value}`), 'gothic-panel--ornate', 'gothic-panel--standard');
    panel.classList.add(`gothic-panel--${size}`);
    makeLayer(panel, size);
    if (panel.matches('dialog') && dialogSizes && !panel.dataset.gothicCornerObserved) {
      panel.dataset.gothicCornerObserved = 'true';
      dialogSizes.observe(panel);
    }
  };

  const scan = root => {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches(`${largeSelector},${mediumSelector},${smallSelector},dialog`)) applyStyle(root);
    root.querySelectorAll(`${largeSelector},${mediumSelector},${smallSelector},dialog`).forEach(applyStyle);
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
      if (entry.target instanceof HTMLDialogElement) applyStyle(entry.target);
    });
  }) : null;

  observer.observe(document.body, { childList: true, subtree: true });
  document.addEventListener('toggle', event => {
    if (event.target instanceof HTMLDialogElement) applyStyle(event.target);
  }, true);
  window.addEventListener('resize', () => document.querySelectorAll('dialog').forEach(applyStyle), { passive: true });
  scan(document);
})();
