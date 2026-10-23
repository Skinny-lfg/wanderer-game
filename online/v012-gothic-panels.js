(() => {
  'use strict';

  if (window.__wandererGothicCornersV2) return;
  window.__wandererGothicCornersV2 = true;

  const css = document.createElement('link');
  css.rel = 'stylesheet';
  css.href = 'online/v012-gothic-panels.css';
  css.dataset.gothicCornerSystem = 'v2';
  document.head.append(css);

  const ornateSelector = [
    '#screen > .panel:not(.phase3Camp)',
    '#screen > .combatLayout > .panel',
    '#screen > .equipmentLayout > .equipmentLeft > .panel',
    '#screen > .equipmentLayout > .equipmentRight > .panel',
    '.phase3Camp', '.phase3CampSideStats', '.phase3ExpeditionPanel',
    '.phase3Between', '.phase3CityCenter', '.phase3AffinityShrine',
    '.phase5VisualSummary',
  ].join(',');

  const makeLayer = (panel, style) => {
    let layer = panel.querySelector(':scope > .gothic-corner-layer');
    if (!layer) {
      layer = document.createElement('span');
      layer.className = 'gothic-corner-layer';
      layer.setAttribute('aria-hidden', 'true');
      panel.prepend(layer);
    }

    const source = style === 'ornate'
      ? 'assets/ui-kit/gothic-corners/ornate-tr.png'
      : 'assets/ui-kit/gothic-corners/standard-tr.png';
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
    if (panel.matches('dialog') && dialogSizes && !panel.dataset.gothicCornerObserved) {
      panel.dataset.gothicCornerObserved = 'true';
      dialogSizes.observe(panel);
    }
  };

  const applyStyle = panel => {
    if (!(panel instanceof Element)) return;
    const isDialog = panel.matches('dialog');
    const style = isDialog
      ? (panel.getBoundingClientRect().width >= 740 || panel.getBoundingClientRect().height >= 620 ? 'ornate' : 'standard')
      : 'ornate';
    panel.classList.remove('gothic-panel--standard', 'gothic-panel--ornate');
    panel.classList.add(`gothic-panel--${style}`);
    makeLayer(panel, style);
  };

  const scan = root => {
    if (!(root instanceof Element || root instanceof Document)) return;
    if (root instanceof Element && root.matches(ornateSelector)) applyStyle(root);
    if (root instanceof Element && root.matches('dialog')) applyStyle(root);
    root.querySelectorAll(`${ornateSelector}, dialog`).forEach(applyStyle);
  };

  const observer = new MutationObserver(records => {
    for (const record of records) {
      record.addedNodes.forEach(node => {
        if (node instanceof Element) scan(node);
      });
    }
  });
  const dialogSizes = typeof ResizeObserver === 'function' ? new ResizeObserver(entries => entries.forEach(entry => {
    if (entry.target instanceof HTMLDialogElement) applyStyle(entry.target);
  })) : null;
  observer.observe(document.body, { childList: true, subtree: true });

  const refreshDialogs = () => document.querySelectorAll('dialog').forEach(applyStyle);
  document.addEventListener('toggle', event => {
    if (event.target instanceof HTMLDialogElement) applyStyle(event.target);
  }, true);
  window.addEventListener('resize', refreshDialogs, { passive: true });
  scan(document);
})();
