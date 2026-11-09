/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · общая обвязка страниц
   Режим отрисовки (фото / иконки), навигация, мелкие помощники.
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  const MODE = document.documentElement.dataset.mode === 'icons' ? 'icons' : 'images';
  document.body.dataset.mode = MODE;

  const ICON_OF = {
    outer: 'coat',
    top: { shirt: 'shirt', longsleeve: 'sweater', tshirt: 'tee' },
    bottom: { pants: 'trousers', shorts: 'trousers', skirt: 'skirt' },
    dress: 'dress',
    shoes: 'sneakers',
    hat: 'cap'
  };

  function iconId(item) {
    const v = ICON_OF[item.slot];
    return typeof v === 'string' ? v : (v && v[item.type]) || 'tee';
  }

  function itemVisual(item, cls = '') {
    if (MODE === 'images') {
      return `<img class="${cls}" src="${item.src}" alt="${item.name}" loading="lazy">`;
    }
    const lum = D.hslOf(item.hex)[2];
    const stroke = D.shade(item.hex, lum > 0.78 ? -0.5 : lum < 0.16 ? 0.45 : -0.12);
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" style="stroke:${stroke}"><use href="assets/img/sprite.svg#i-${iconId(item)}"/></svg>`;
  }

  const fmt = n => n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ') + ' ₽';

  /* переключатель варианта страницы */
  function initModeSwitch() {
    const sw = $('#modeSwitch');
    if (!sw) return;
    const next = MODE === 'images' ? 'icons' : 'images';
    const url = new URL(window.location.href);
    url.searchParams.set('mode', next);
    sw.href = url.pathname.split('/').pop() + url.search;
    sw.querySelector('.mode-label').textContent = next === 'icons' ? 'Иконки' : 'Фото';
    sw.title = next === 'icons' ? 'Показать линейные иконки вместо фото' : 'Показать фотографии вместо иконок';

    // запоминаем выбор, чтобы он переносился между страницами
    try { localStorage.setItem('obraz-mode', MODE); } catch (e) { /* noop */ }
    sw.addEventListener('click', () => {
      try { localStorage.setItem('obraz-mode', next); } catch (e) { /* noop */ }
    });
  }

  /* подсветка текущего раздела в меню */
  function initNav() {
    const file = window.location.pathname.split('/').pop() || 'index.html';
    $$('.nav a').forEach(a => {
      if (a.getAttribute('href') === file) a.classList.add('is-active');
    });
  }

  window.OBRAZ_UI = {
    MODE, itemVisual, iconId, fmt,
    $, $$,
    state: {},
    setOutfit: null,
    toast(text) {
      let el = $('#toast');
      if (!el) {
        el = document.createElement('div');
        el.id = 'toast';
        el.className = 'toast';
        document.body.appendChild(el);
      }
      el.textContent = text;
      el.classList.add('is-on');
      clearTimeout(el._t);
      el._t = setTimeout(() => el.classList.remove('is-on'), 2200);
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { initNav(); initModeSwitch(); });
  } else {
    initNav(); initModeSwitch();
  }
})();
