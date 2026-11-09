/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · страница ИИ-стилиста: воронка, комплекты, чат
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const S = window.OBRAZ_SETS;
  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = n => n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');

  const state = {
    profile: { ...D.DEFAULT_PROFILE, baseHex: '#2C4A6E' },
    day: 'today',
    variants: { today: [], tomorrow: [] },
    worn: new Set(),
    pipe: { occ: 'office', temp: 6, gender: 'w' }
  };

  const ctxBase = (over = {}) => ({
    gender: state.profile.gender,
    size: state.profile.size,
    temp: D.WEATHER.find(w => w.day === (over.day || state.day)).temp,
    baseHex: state.profile.baseHex,
    recentIds: state.worn,
    ...over
  });

  const pipeCtx = () => ({
    gender: state.pipe.gender,
    size: state.profile.size,
    temp: state.pipe.temp,
    occ: state.pipe.occ,
    baseHex: state.profile.baseHex,
    recentIds: state.worn
  });

  function thumb(item) {
    return `<figure class="thumb" title="${item.name}">
      <div class="thumb-img">${UI.itemVisual(item)}</div>
      <figcaption>${item.short}</figcaption>
    </figure>`;
  }

  /* ── воронка ─────────────────────────────────────────── */
  function renderFunnel() {
    const f = S.funnel(pipeCtx());
    const max = f.stages[0].count;
    $('#funnel').innerHTML = f.stages.map((st, i) => `
      <div class="fstep" style="--i:${i}">
        <div class="fstep-head">
          <span class="fstep-n">${i + 1}</span>
          <span class="fstep-label">${st.label}</span>
          <span class="fstep-count" data-count="${st.count}">${fmt(st.count)}</span>
        </div>
        <div class="fbar"><span style="width:${Math.max(1.6, st.count / max * 100)}%"></span></div>
        <p class="fstep-note">${st.note}</p>
      </div>`).join('');

    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$('[data-count]', $('#funnel')).forEach(el => {
      const target = +el.dataset.count;
      if (reduce) { el.textContent = fmt(target); return; }
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / 520);
        el.textContent = fmt(Math.round(target * (1 - Math.pow(1 - k, 3))));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });

    const pool = f.pool.slice(0, 12);
    $('#funnelPool').innerHTML = pool.length
      ? pool.map(thumb).join('')
      : '<p class="tiny">Под эти условия ничего не подошло — ослабьте фильтры.</p>';
  }

  /* ── комплекты ───────────────────────────────────────── */
  function makeVariants(day) {
    const { variants } = S.dayVariants(day, ctxBase({ day }), 3);
    state.variants[day] = variants;
    return variants;
  }

  function renderToday() {
    const day = state.day;
    const variants = state.variants[day] && state.variants[day].length ? state.variants[day] : makeVariants(day);

    $('#todayGrid').innerHTML = variants.map((v, i) => `
      <article class="variant">
        <div class="variant-head">
          <div>
            <p class="variant-mood">${v.mood.title}</p>
            <p class="variant-tag">${v.mood.tag}</p>
          </div>
          <span class="variant-fit">${v.fit}%</span>
        </div>
        <div class="variant-look">${v.items.map(thumb).join('')}</div>
        <p class="variant-why">${v.reason}</p>
        <div class="variant-actions">
          <button class="btn btn-ink btn-sm" type="button" data-try="${i}">Примерить</button>
          <button class="btn btn-ghost btn-sm" type="button" data-wear="${i}">Надеть</button>
        </div>
      </article>`).join('');
  }

  function tryOn(idx) {
    const v = state.variants[state.day][idx];
    if (!v) return;
    try {
      sessionStorage.setItem('obraz-look', JSON.stringify(v.items.map(i => i.id)));
      sessionStorage.setItem('obraz-look-title', v.mood.title);
    } catch (e) { /* noop */ }
    window.location.href = 'fitting.html';
  }

  function wearOutfit(outfit) {
    outfit.items.forEach(i => state.worn.add(i.id));
    state.variants = { today: [], tomorrow: [] };
    renderToday();
  }

  /* ── чат ─────────────────────────────────────────────── */
  function outfitText(v) {
    return '<b>' + v.mood.title + '</b> (' + D.OCC_LABEL[v.occ] + ', ' + (v.temp > 0 ? '+' : '') + v.temp + '°):<br>' +
      v.items.map(i => '· ' + i.short.toLowerCase() + ', ' + i.color).join('<br>') +
      '<br><span class="chat-why">' + v.reason + '</span><br><a href="fitting.html" class="chat-link">Примерить на модели →</a>';
  }

  function answer(text) {
    const t = text.toLowerCase();
    const day = /завтра|томор/.test(t) ? 'tomorrow' : 'today';
    const variants = state.variants[day] && state.variants[day].length ? state.variants[day] : makeVariants(day);

    if (/привет|здравств/.test(t)) return 'Привет. Я вижу каталог на 100 500 позиций и историю носки. Скажите повод — соберу три комплекта и покажу на модели.';
    if (/почему|как ты|объясн/.test(t)) {
      const f = S.funnel(ctxBase({ day }));
      return 'Пайплайн: ' + f.stages.map(s => '<b>' + s.label.toLowerCase() + '</b> — ' + fmt(s.count)).join(' → ') +
        '. Дальше оцениваю теплоту, свежесть и сочетаемость цвета.';
    }
    if (/модел|примерь|примерк/.test(t)) return 'Примерка — на <a href="fitting.html" class="chat-link">отдельной странице</a>: четыре модели, две девочки и два мальчика, плюс загрузка своего фото.';
    if (/каталог|купить|цена|сколько/.test(t)) return 'Вещи с ценами и доставкой — в <a href="catalog.html" class="chat-link">каталоге</a>. Комиссия у нас 6%, поэтому цена ниже, чем на маркетплейсе.';
    if (/свидан|вечер|ужин/.test(t)) return 'На вечер:' + outfitText(variants.find(x => x.occ === 'date') || variants[0]);
    if (/встреч|работ|офис|собеседован/.test(t)) return 'На встречу:' + outfitText(variants.find(x => x.occ === 'office') || variants[0]);
    if (/надеть|что надеть|завтра|сегодня|собер/.test(t)) return 'Вот что я собрал на ' + (day === 'tomorrow' ? 'завтра' : 'сегодня') + ':' + outfitText(variants[0]);
    return 'Скажите повод и день: «что надеть завтра на встречу», «собери на свидание», «почему эти вещи». Или откройте блок «Что надеть» — там три готовых варианта.';
  }

  function initChat() {
    const body = $('#chatBody');
    const add = (html, who) => {
      const div = document.createElement('div');
      div.className = 'msg ' + who;
      div.innerHTML = html;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    };
    const ask = text => { add(text, 'user'); setTimeout(() => add(answer(text), 'bot'), 300); };

    $('#chatForm').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#chatInput').value.trim();
      if (v) { $('#chatInput').value = ''; ask(v); }
    });
    $('#chatSuggest').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) ask(b.textContent);
    });
  }

  /* ── старт ───────────────────────────────────────────── */
  function init() {
    if (!$('#funnel')) return;

    renderFunnel();
    makeVariants('today');
    makeVariants('tomorrow');
    renderToday();
    initChat();

    $('#pipeOcc').addEventListener('change', e => { state.pipe.occ = e.target.value; renderFunnel(); });
    $('#pipeGender').addEventListener('change', e => {
      state.pipe.gender = e.target.value;
      state.profile.gender = e.target.value;
      renderFunnel();
      state.variants = { today: [], tomorrow: [] };
      renderToday();
    });
    $('#pipeTemp').addEventListener('input', e => {
      state.pipe.temp = +e.target.value;
      $('#pipeTempOut').textContent = (state.pipe.temp > 0 ? '+' : '') + state.pipe.temp + '°';
      renderFunnel();
    });
    $('#pipeBuild').addEventListener('click', () => {
      const f = S.funnel(pipeCtx());
      if (!f.pool.length) return;
      const mood = S.MOODS.find(m => m.occ === state.pipe.occ) || S.MOODS[0];
      const set = S.buildSet(f.pool, { ...pipeCtx(), occ: state.pipe.occ }, mood, Date.now() % 9973);
      const box = $('#pipeResult');
      box.hidden = false;
      box.innerHTML = `<p class="builder-label">Комплект из шорт-листа</p>
        <div class="variant-look">${set.items.map(thumb).join('')}</div>
        <p class="variant-why">${set.reason}</p>
        <div class="variant-actions"><button class="btn btn-ink btn-sm" type="button" id="pipeTry">Примерить</button></div>`;
      $('#pipeTry').addEventListener('click', () => {
        try { sessionStorage.setItem('obraz-look', JSON.stringify(set.items.map(i => i.id))); } catch (e) { /* noop */ }
        window.location.href = 'fitting.html';
      });
    });

    $('#dayTabs').addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      $$('.tab').forEach(t => t.classList.toggle('is-on', t === tab));
      state.day = tab.dataset.day;
      renderToday();
    });

    $('#todayGrid').addEventListener('click', e => {
      const t = e.target.closest('[data-try]');
      if (t) return tryOn(+t.dataset.try);
      const w = e.target.closest('[data-wear]');
      if (w) {
        wearOutfit(state.variants[state.day][+w.dataset.wear]);
        w.textContent = 'Надето ✓';
        setTimeout(() => { w.textContent = 'Надеть'; }, 1500);
      }
    });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
