/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · интерфейс демо
   Работает в двух режимах: images (фото) и icons (линейные иконки).
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const S = window.OBRAZ_SETS;
  const M = window.OBRAZ_MODEL;
  const MODE = document.body.dataset.mode === 'icons' ? 'icons' : 'images';

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

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

  const state = {
    profile: { ...D.DEFAULT_PROFILE, baseHex: '#2C4A6E' },
    day: 'today',
    variants: { today: [], tomorrow: [] },
    current: null,
    modelId: 'mila',
    worn: new Set(),
    recent: new Set(),
    cat: 'all',
    q: '',
    pipe: { occ: 'office', temp: 6, gender: 'w' },
    photo: null
  };

  /* ── утилиты рендера ─────────────────────────────────── */
  function itemVisual(item, cls = '') {
    if (MODE === 'images') {
      return `<img class="${cls}" src="${item.src}" alt="${item.name}" loading="lazy">`;
    }
    const lum = D.hslOf(item.hex)[2];
    const stroke = D.shade(item.hex, lum > 0.78 ? -0.5 : lum < 0.16 ? 0.45 : -0.12);
    return `<svg class="ico ${cls}" viewBox="0 0 24 24" style="stroke:${stroke}"><use href="#i-${iconId(item)}"/></svg>`;
  }

  function thumb(item) {
    return `<figure class="thumb" title="${item.name}" data-item="${item.id}">
      <div class="thumb-img">${itemVisual(item)}</div>
      <figcaption>${item.short}</figcaption>
    </figure>`;
  }

  const ctxBase = (over = {}) => ({
    gender: state.profile.gender,
    size: state.profile.size,
    temp: D.WEATHER.find(w => w.day === (over.day || state.day)).temp,
    baseHex: state.profile.baseHex,
    recentIds: state.worn,
    ...over
  });

  /* ── каталог ─────────────────────────────────────────── */
  function renderCatalog() {
    const grid = $('#wbGrid');
    const q = state.q.trim().toLowerCase();
    const list = S.items.filter(i => {
      const slotOk = state.cat === 'all' || i.slot === state.cat;
      const qOk = !q || i.name.toLowerCase().includes(q) || i.color.includes(q) || i.short.toLowerCase().includes(q);
      return slotOk && qOk;
    });

    grid.dataset.mode = MODE;
    grid.innerHTML = list.map(i => `
      <article class="wb-card" data-id="${i.id}">
        <div class="wb-img">${itemVisual(i)}</div>
        <b>${i.short}</b>
        <small>${i.color}</small>
        <span class="dot-color" style="background:${i.hex}"></span>
      </article>`).join('');

    $('#wbEmpty').hidden = list.length > 0;
  }

  /* ── воронка ─────────────────────────────────────────── */
  function pipeCtx() {
    return {
      gender: state.pipe.gender,
      size: state.profile.size,
      temp: state.pipe.temp,
      occ: state.pipe.occ,
      baseHex: state.profile.baseHex,
      recentIds: state.worn
    };
  }

  function renderFunnel() {
    const f = S.funnel(pipeCtx());
    const max = f.stages[0].count;
    const el = $('#funnel');

    el.innerHTML = f.stages.map((st, i) => {
      const pct = Math.max(1.6, (st.count / max) * 100);
      return `<div class="fstep" style="--i:${i}">
        <div class="fstep-head">
          <span class="fstep-n">${i + 1}</span>
          <span class="fstep-label">${st.label}</span>
          <span class="fstep-count" data-count="${st.count}">${fmt(st.count)}</span>
        </div>
        <div class="fbar"><span style="width:${pct}%"></span></div>
        <p class="fstep-note">${st.note}</p>
      </div>`;
    }).join('');

    animateCounters(el);

    const pool = f.pool.slice(0, 12);
    $('#funnelPool').innerHTML = pool.length
      ? pool.map(thumb).join('')
      : '<p class="tiny">Под эти условия ничего не подошло — ослабьте фильтры.</p>';
  }

  function fmt(n) {
    return n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ');
  }

  function animateCounters(root) {
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    $$('[data-count]', root).forEach(el => {
      const target = +el.dataset.count;
      if (reduce) { el.textContent = fmt(target); return; }
      const dur = 520;
      const t0 = performance.now();
      const step = t => {
        const k = Math.min(1, (t - t0) / dur);
        const eased = 1 - Math.pow(1 - k, 3);
        el.textContent = fmt(Math.round(target * eased));
        if (k < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  /* ── комплекты дня ───────────────────────────────────── */
  function makeVariants(day) {
    const ctx = ctxBase({ day });
    const { variants } = S.dayVariants(day, ctx, 3);
    state.variants[day] = variants;
    return variants;
  }

  function renderToday() {
    const day = state.day;
    const variants = state.variants[day] && state.variants[day].length
      ? state.variants[day] : makeVariants(day);

    const w = D.WEATHER.find(x => x.day === day);
    const grid = $('#todayGrid');
    grid.innerHTML = variants.map((v, i) => `
      <article class="variant" data-i="${i}">
        <div class="variant-head">
          <div>
            <p class="variant-mood">${v.mood.title}</p>
            <p class="variant-tag">${v.mood.tag}</p>
          </div>
          <span class="variant-fit">совпадение ${v.fit}%</span>
        </div>
        <div class="variant-look">${v.items.map(thumb).join('')}</div>
        <p class="variant-why">${v.reason}</p>
        <div class="variant-actions">
          <button class="btn btn-ink btn-sm" type="button" data-try="${i}">Примерить</button>
          <button class="btn btn-ghost btn-sm" type="button" data-wear="${i}">Надеть</button>
        </div>
      </article>`).join('');

    const first = variants[0];
    if (first) renderHero(first, w);
  }

  function renderHero(outfit, weather) {
    const w = weather || D.WEATHER.find(x => x.day === state.day);
    $('#hcDay').textContent = w.label + ' · ' + w.date;
    $('#hcTitle').textContent = outfit.mood.title;
    $('#hcTemp').textContent = (w.temp > 0 ? '+' : '') + w.temp + '°';
    $('#hcSky').textContent = w.sky;
    $('#hcLook').innerHTML = outfit.items.map(i => `
      <figure class="hc-item">${itemVisual(i)}<figcaption>${i.short}</figcaption></figure>`).join('');
    $('#hcWhy').innerHTML = 'Почему так: ' + outfit.reason + '.';
    state.current = outfit;
  }

  /* ── модели и примерка ───────────────────────────────── */
  function currentModel() {
    return D.MODELS.find(m => m.id === state.modelId) || D.MODELS[0];
  }

  function renderModels() {
    const outfit = state.current;
    $('#modelList').innerHTML = D.MODELS.map(m => `
      <button class="model-card${m.id === state.modelId ? ' is-on' : ''}" data-model="${m.id}" type="button">
        <span class="model-mini">${M.scene(m, outfit)}</span>
        <span class="model-meta"><b>${m.name}</b><small>${m.gender === 'w' ? 'девочка' : 'мальчик'} · ${m.note}</small></span>
      </button>`).join('');
  }

  function renderStage() {
    const model = currentModel();
    const outfit = state.current;
    $('#stageArt').innerHTML = M.scene(model, outfit);
    $('#stageBadge').textContent = model.name + ' · ' + model.note;
    $('#stageItems').innerHTML = outfit && outfit.items
      ? outfit.items.map(i => `<span class="stage-item"><i style="background:${i.hex}"></i>${i.short}, ${i.color}</span>`).join('')
      : '';
    if (state.photo) renderUserLayers();
  }

  function tryOn(idx, day) {
    const v = (state.variants[day || state.day] || [])[idx];
    if (!v) return;
    state.current = v;
    const needsDress = v.items.some(i => i.slot === 'dress');
    if (needsDress && currentModel().gender !== 'w') state.modelId = 'mila';
    renderModels();
    renderStage();
    $('#stage').classList.add('pulse');
    setTimeout(() => $('#stage').classList.remove('pulse'), 700);
    document.getElementById('fitting').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function wearOutfit(outfit) {
    if (!outfit) return;
    outfit.items.forEach(i => { state.worn.add(i.id); state.recent.add(i.id); });
    state.variants = { today: [], tomorrow: [] };
    renderToday();
    if (state.current) renderStage();
    renderModels();
  }

  /* ── своё фото ───────────────────────────────────────── */
  function renderUserLayers() {
    const box = $('#userLayers');
    if (!state.photo || !state.current) { box.innerHTML = ''; return; }
    const scale = +$('#layerScale').value / 100;
    const shift = +$('#layerShift').value;
    box.innerHTML = `<svg viewBox="0 0 300 600" preserveAspectRatio="xMidYMid meet"
        style="transform:scale(${scale}) translateY(${shift}%)">
        ${state.current.items.map(i => M.garment(i)).join('')}
      </svg>`;
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
      renderUserLayers();
    };
    reader.readAsDataURL(file);
  }

  /* ── чат ─────────────────────────────────────────────── */
  function outfitText(v) {
    return '<b>' + v.mood.title + '</b> (' + D.OCC_LABEL[v.occ] + ', ' + (v.temp > 0 ? '+' : '') + v.temp + '°):<br>' +
      v.items.map(i => '· ' + i.short.toLowerCase() + ', ' + i.color).join('<br>') +
      '<br><span class="chat-why">' + v.reason + '</span>';
  }

  function answer(text) {
    const t = text.toLowerCase();
    const day = /завтра|томор|tomorrow/.test(t) ? 'tomorrow' : 'today';
    const variants = state.variants[day] && state.variants[day].length ? state.variants[day] : makeVariants(day);

    if (/привет|здравств|хай/.test(t)) {
      return 'Привет. Я вижу каталог на 100 500 позиций и историю носки. Скажите повод — соберу три комплекта и покажу на модели.';
    }
    if (/почему|как ты|объясн/.test(t)) {
      const f = S.funnel(ctxBase({ day }));
      return 'Пайплайн такой: ' + f.stages.map(s => '<b>' + s.label.toLowerCase() + '</b> — ' + fmt(s.count)).join(' → ') +
        '. Дальше я оцениваю теплоту, свежесть и сочетаемость цвета и собираю три комплекта.';
    }
    if (/модел|примерь|примерк/.test(t)) {
      return 'Откройте блок «Примерка»: там Мила, Ника, Марк и Тимур. Любой комплект можно надеть на каждую из них, а в поле справа — загрузить своё фото и подогнать одежду ползунками.';
    }
    if (/сколько|цена|тариф|стоит/.test(t)) {
      return 'Старт — бесплатно: три комплекта в день и примерка на четырёх моделях. Pro — 490 ₽/мес: безлимит комплектов, свои вещи и примерка на своём фото.';
    }
    if (/свидан|вечер|ужин/.test(t)) {
      const v = variants.find(x => x.occ === 'date') || variants[0];
      return 'На вечер:' + outfitText(v);
    }
    if (/встреч|работ|офис|собеседован/.test(t)) {
      const v = variants.find(x => x.occ === 'office') || variants[0];
      return 'На встречу:' + outfitText(v);
    }
    if (/каталог|вещ|что есть/.test(t)) {
      return 'В демо 92 реальные вещи из каталога и 100 500 позиций с размерами и брендами. Откройте блок «Каталог» — там можно фильтровать по типу и цвету.';
    }
    if (/надеть|что надеть|завтра|сегодня|собер/.test(t)) {
      return 'Вот что я собрал на ' + (day === 'tomorrow' ? 'завтра' : 'сегодня') + ':' + outfitText(variants[0]);
    }
    return 'Скажите повод и день — соберу комплект. Например: «что надеть завтра на встречу», «собери на свидание», «почему эти вещи». Или откройте блок «Что надеть» — там три готовых варианта.';
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
    const ask = text => {
      add(text, 'user');
      setTimeout(() => add(answer(text), 'bot'), 320);
    };
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

  /* ── события ─────────────────────────────────────────── */
  function initEvents() {
    $('#wbChips').addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip').forEach(c => c.classList.toggle('is-on', c === chip));
      state.cat = chip.dataset.slot;
      renderCatalog();
    });

    let timer;
    $('#wbSearch').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => { state.q = e.target.value; renderCatalog(); }, 140);
    });

    $('#shuffleCatalog').addEventListener('click', () => {
      const arr = S.items.slice();
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      S.items.splice(0, S.items.length, ...arr);
      renderCatalog();
    });

    // воронка
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
        <div class="variant-actions">
          <button class="btn btn-ink btn-sm" type="button" id="pipeTry">Примерить</button>
        </div>`;
      $('#pipeTry').addEventListener('click', () => {
        state.current = set;
        if (set.items.some(i => i.slot === 'dress') && currentModel().gender !== 'w') state.modelId = 'mila';
        renderModels(); renderStage();
        document.getElementById('fitting').scrollIntoView({ behavior: 'smooth' });
      });
    });

    // дни
    $('#dayTabs').addEventListener('click', e => {
      const tab = e.target.closest('.tab');
      if (!tab) return;
      $$('.tab').forEach(t => t.classList.toggle('is-on', t === tab));
      state.day = tab.dataset.day;
      renderToday();
    });

    // варианты
    $('#todayGrid').addEventListener('click', e => {
      const tryBtn = e.target.closest('[data-try]');
      if (tryBtn) return tryOn(+tryBtn.dataset.try);
      const wearBtn = e.target.closest('[data-wear]');
      if (wearBtn) {
        const v = state.variants[state.day][+wearBtn.dataset.wear];
        wearOutfit(v);
        wearBtn.textContent = 'Надето ✓';
        setTimeout(() => { wearBtn.textContent = 'Надеть'; }, 1500);
      }
    });

    // hero
    $('#heroWear').addEventListener('click', () => {
      wearOutfit(state.current);
      $('#heroWear').textContent = 'Записано ✓';
      setTimeout(() => { $('#heroWear').textContent = 'Надеть сегодня'; }, 1500);
    });
    $('#heroNext').addEventListener('click', () => {
      const list = state.variants[state.day] || [];
      if (!list.length) return;
      const i = (list.indexOf(state.current) + 1) % list.length;
      state.current = list[i];
      renderHero(list[i]);
      renderStage();
      renderModels();
    });

    // модели
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
      const temp = D.WEATHER.find(w => w.day === state.day).temp;
      const ctx = ctxBase({ occ, temp });
      const f = S.funnel(ctx);
      if (!f.pool.length) return;
      state.current = S.buildSet(f.pool, ctx, mood, Date.now() % 7919);
      renderStage();
      renderModels();
    });

    // загрузка фото
    $('#uploadBtn').addEventListener('click', () => $('#photoInput').click());
    $('#photoInput').addEventListener('change', e => handlePhoto(e.target.files[0]));
    ['#layerScale', '#layerShift'].forEach(sel =>
      $(sel).addEventListener('input', renderUserLayers));
    $('#clearPhoto').addEventListener('click', () => {
      state.photo = null;
      $('#uploadStage').hidden = true;
      $('#uploadControls').hidden = true;
      $('#uploadEmpty').hidden = false;
      $('#photoInput').value = '';
    });

    // drag&drop фото
    const box = $('#uploadBox');
    ['dragover', 'drop'].forEach(ev => box.addEventListener(ev, e => {
      e.preventDefault();
      if (ev === 'drop') handlePhoto(e.dataTransfer.files[0]);
      box.classList.toggle('is-drag', ev === 'dragover');
    }));

    // переключение варианта страницы
    const sw = $('#modeSwitch');
    if (sw) {
      sw.href = MODE === 'images' ? 'icons.html' : 'index.html';
      sw.querySelector('.mode-label').textContent = MODE === 'images' ? 'Иконки' : 'Фото';
      sw.title = MODE === 'images' ? 'Вариант с линейными иконками' : 'Вариант с фотографиями';
    }
  }

  /* ── старт ───────────────────────────────────────────── */
  function init() {
    renderCatalog();
    renderFunnel();
    makeVariants('today');
    makeVariants('tomorrow');
    renderToday();
    renderModels();
    renderStage();
    initChat();
    initEvents();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
