/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · главная страница: образ дня и быстрые переходы
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const S = window.OBRAZ_SETS;
  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = UI.fmt;

  const PRICE_BASE = { outer:[6900,11900], top:[1900,3900], bottom:[2900,5400],
                       dress:[3900,6900], shoes:[4500,7900], hat:[1200,2500] };

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000003;
    const x = Math.sin(h * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  function priceOf(item) {
    const r = PRICE_BASE[item.slot] || [1900, 3900];
    return Math.round((r[0] + (r[1] - r[0]) * hash(item.id)) / 100) * 100;
  }

  const state = { variants: [], idx: 0 };

  function renderCard(v, w) {
    $('#hcDay').textContent = w.label + ' · ' + w.date;
    $('#hcTitle').textContent = v.mood.title;
    $('#hcTemp').textContent = (w.temp > 0 ? '+' : '') + w.temp + '°';
    $('#hcSky').textContent = w.sky;
    $('#hcLook').innerHTML = v.items.map(i => `
      <figure class="hc-item">${UI.itemVisual(i)}<figcaption>${i.short}</figcaption></figure>`).join('');
    $('#hcWhy').innerHTML = 'Почему так: ' + v.reason + '.';
  }

  function init() {
    if (!$('#hcLook')) return;

    const w = D.WEATHER[0];
    const ctx = {
      gender: 'w', size: 44, temp: w.temp, baseHex: '#2C4A6E', recentIds: new Set()
    };
    const { variants } = S.dayVariants('today', ctx, 3);
    state.variants = variants;
    renderCard(variants[0], w);

    $('#heroNext').addEventListener('click', () => {
      state.idx = (state.idx + 1) % state.variants.length;
      renderCard(state.variants[state.idx], w);
    });
    $('#heroWear').addEventListener('click', e => {
      e.target.textContent = 'Записано ✓';
      UI.toast('Вещь ушла в историю носки');
      setTimeout(() => { e.target.textContent = 'Надеть сегодня'; }, 1500);
    });

    // мини-витрина
    const picks = S.items.filter(i => ['outer','top','bottom','shoes'].includes(i.slot)).slice(0, 4);
    $('#miniMarket').innerHTML = picks.map(i => `
      <a class="mini-card" href="catalog.html">
        <div class="mini-img">${UI.itemVisual(i)}</div>
        <span class="mini-name">${i.short}, ${i.color}</span>
        <b>${fmt(priceOf(i))}</b>
      </a>`).join('');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
