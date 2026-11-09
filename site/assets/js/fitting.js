/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · страница примерки: модели, свой образ, своё фото
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const S = window.OBRAZ_SETS;
  const M = window.OBRAZ_MODEL;
  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const state = {
    modelId: D.MODELS[0].id,
    current: null,
    photo: null
  };

  const model = () => D.MODELS.find(m => m.id === state.modelId) || D.MODELS[0];

  const temp = () => D.WEATHER.find(w => w.day === 'today').temp;

  function ctxBase(over = {}) {
    return {
      gender: over.gender || (model().gender === 'm' ? 'm' : 'w'),
      size: D.DEFAULT_PROFILE.size,
      temp: temp(),
      baseHex: D.DEFAULT_PROFILE.baseColor,
      recentIds: new Set(),
      ...over
    };
  }

  function pickFromStorage() {
    try {
      const raw = sessionStorage.getItem('obraz-look');
      if (!raw) return null;
      const ids = JSON.parse(raw);
      const items = ids.map(id => S.byId.get(id)).filter(Boolean);
      return items.length ? items : null;
    } catch (e) { return null; }
  }

  function defaultOutfit() {
    const f = S.funnel(ctxBase({ occ: 'office' }));
    const mood = S.MOODS[0];
    return S.buildSet(f.pool, ctxBase({ occ: 'office' }), mood, 42);
  }

  /* ── рендер ──────────────────────────────────────────── */
  function renderModels() {
    $('#modelList').innerHTML = D.MODELS.map(m => `
      <button class="model-card${m.id === state.modelId ? ' is-on' : ''}" data-model="${m.id}" type="button">
        <span class="model-mini">${M.scene(m, state.current)}</span>
        <span class="model-meta"><b>${m.name}</b><small>${m.gender === 'w' ? 'девочка' : 'мальчик'} · ${m.note}</small></span>
      </button>`).join('');
  }

  function renderStage() {
    const m = model();
    $('#stageArt').innerHTML = M.scene(m, state.current);
    $('#stageBadge').textContent = m.name + ' · ' + m.note;
    $('#stageItems').innerHTML = state.current && state.current.items
      ? state.current.items.map(i => `<span class="stage-item"><i style="background:${i.hex}"></i>${i.short}, ${i.color}</span>`).join('')
      : '';
    if (state.photo) renderLayers();
  }

  function renderLayers() {
    const box = $('#userLayers');
    if (!state.photo || !state.current) { box.innerHTML = ''; return; }
    const scale = +$('#layerScale').value / 100;
    const shift = +$('#layerShift').value;
    box.innerHTML = `<svg viewBox="0 0 300 600" preserveAspectRatio="xMidYMid meet"
        style="transform:scale(${scale}) translateY(${shift}%)">
        ${state.current.items.map(i => M.garment(i)).join('')}
      </svg>`;
  }

  function setOutfit(outfit, opts = {}) {
    state.current = outfit;
    if (outfit.items.some(i => i.slot === 'dress') && model().gender === 'm') state.modelId = 'mila';
    renderModels();
    renderStage();
    if (opts.scroll) {
      $('#stage').classList.add('pulse');
      setTimeout(() => $('#stage').classList.remove('pulse'), 700);
    }
  }

  function handlePhoto(file) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = e => {
      state.photo = e.target.result;
      $('#userPhoto').src = state.photo;
      $('#uploadEmpty').hidden = true;
      $('#uploadStage').hidden = false;
      $('#uploadControls').hidden = false;
      renderLayers();
    };
    reader.readAsDataURL(file);
  }

  function init() {
    if (!$('#stage')) return;

    const fromStorage = pickFromStorage();
    setOutfit(fromStorage
      ? { items: fromStorage, mood: { title: 'Образ с витрины' }, reason: 'выбран вами', fit: 100, occ: 'walk', temp: temp() }
      : defaultOutfit());

    $('#modelList').addEventListener('click', e => {
      const card = e.target.closest('[data-model]');
      if (!card) return;
      state.modelId = card.dataset.model;
      renderModels();
      renderStage();
    });

    $('#fitBuild').addEventListener('click', () => {
      const occ = $('#fitOcc').value;
      const mood = S.MOODS.find(m => m.occ === occ) || S.MOODS[1];
      const ctx = ctxBase({ occ, gender: model().gender === 'm' ? 'm' : 'w' });
      const f = S.funnel(ctx);
      if (!f.pool.length) return;
      setOutfit(S.buildSet(f.pool, ctx, mood, Date.now() % 7919), { scroll: true });
    });

    $('#uploadBtn').addEventListener('click', () => $('#photoInput').click());
    $('#photoInput').addEventListener('change', e => handlePhoto(e.target.files[0]));
    ['#layerScale', '#layerShift'].forEach(sel => $(sel).addEventListener('input', renderLayers));

    $('#clearPhoto').addEventListener('click', () => {
      state.photo = null;
      $('#uploadStage').hidden = true;
      $('#uploadControls').hidden = true;
      $('#uploadEmpty').hidden = false;
      $('#photoInput').value = '';
    });

    const box = $('#uploadBox');
    ['dragover', 'drop'].forEach(ev => box.addEventListener(ev, e => {
      e.preventDefault();
      if (ev === 'drop') handlePhoto(e.dataTransfer.files[0]);
      box.classList.toggle('is-drag', ev === 'dragover');
    }));

    UI.setOutfit = (items, title) => setOutfit({
      items, mood: { title: title || 'Свой образ' }, reason: 'собран вручную', fit: 100, occ: 'walk', temp: temp()
    }, { scroll: true });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
