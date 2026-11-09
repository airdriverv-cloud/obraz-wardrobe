/* ─────────────────────────────────────────────────────────────
   ОБРАЗ — демо-логика: гардероб, алгоритм образов, стилист-чат.
   Всё работает в браузере, без бэкенда и внешних API.
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  /* ── Палитра ────────────────────────────────────────────── */
  const COLORS = {
    'чёрный':      { hex:'#1B1B1B', neutral:true  },
    'белый':       { hex:'#F2EEE6', neutral:true  },
    'кремовый':    { hex:'#E6D8C1', neutral:true  },
    'серый':       { hex:'#9C9C97', neutral:true  },
    'деним':       { hex:'#5B7A99', neutral:true  },
    'бежевый':     { hex:'#D2BD9E', neutral:true  },
    'шоколадный':  { hex:'#57402F', neutral:true  },
    'синий':       { hex:'#2C4A6E', neutral:false },
    'бордовый':    { hex:'#6E2334', neutral:false },
    'оливковый':   { hex:'#6F7D5A', neutral:false },
    'терракотовый':{ hex:'#C8553D', neutral:false },
    'горчичный':   { hex:'#C99A34', neutral:false },
    'зелёный':     { hex:'#3E6B5A', neutral:false },
    'розовый':     { hex:'#D9A6A6', neutral:false }
  };

  /* сочетаемые акценты (если в образе два цвета) */
  const HARMONY = [
    ['синий','горчичный'],['синий','розовый'],['оливковый','терракотовый'],
    ['бордовый','розовый'],['зелёный','бежевый'],['терракотовый','деним'],
    ['синий','бордовый'],['горчичный','шоколадный'],['оливковый','кремовый']
  ];

  const CAT_LABEL = {
    outer:'верхняя', top:'верх', bottom:'низ',
    dress:'платье', shoes:'обувь', bag:'сумка'
  };

  /* ── Демо-гардероб ──────────────────────────────────────── */
  const SEED = [
    { id:'o1', name:'Пальто бежевое',    cat:'outer',  color:'бежевый',     icon:'coat',    warmth:5, season:['winter','demi'], occ:['office','walk','date'] },
    { id:'o2', name:'Плащ оливковый',    cat:'outer',  color:'оливковый',   icon:'coat',    warmth:3, season:['demi','summer'], occ:['walk','office'] },
    { id:'o3', name:'Бомбер чёрный',     cat:'outer',  color:'чёрный',      icon:'jacket',  warmth:3, season:['demi','summer'], occ:['walk','sport'] },
    { id:'t1', name:'Свитер серый',      cat:'top',    color:'серый',       icon:'sweater', warmth:4, season:['winter','demi'], occ:['office','walk'] },
    { id:'t2', name:'Рубашка белая',     cat:'top',    color:'белый',       icon:'shirt',   warmth:2, season:['summer','demi','winter'], occ:['office','date'] },
    { id:'t3', name:'Топ чёрный',        cat:'top',    color:'чёрный',      icon:'tee',     warmth:1, season:['summer','demi'], occ:['date','walk'] },
    { id:'t4', name:'Худи кремовое',     cat:'top',    color:'кремовый',    icon:'sweater', warmth:3, season:['demi','summer'], occ:['walk','sport'] },
    { id:'t5', name:'Свитер горчичный',  cat:'top',    color:'горчичный',   icon:'sweater', warmth:4, season:['winter','demi'], occ:['walk','date'] },
    { id:'b1', name:'Джинсы',            cat:'bottom', color:'деним',       icon:'jeans',   warmth:3, season:['summer','demi','winter'], occ:['walk','office','date'] },
    { id:'b2', name:'Брюки чёрные',      cat:'bottom', color:'чёрный',      icon:'trousers',warmth:2, season:['summer','demi','winter'], occ:['office','date'] },
    { id:'b3', name:'Брюки бежевые',     cat:'bottom', color:'бежевый',     icon:'trousers',warmth:2, season:['summer','demi'], occ:['office','walk'] },
    { id:'b4', name:'Юбка бордовая',     cat:'bottom', color:'бордовый',    icon:'skirt',   warmth:2, season:['demi','winter'], occ:['date','office'] },
    { id:'d1', name:'Платье чёрное',     cat:'dress',  color:'чёрный',      icon:'dress',   warmth:2, season:['summer','demi','winter'], occ:['date','office'] },
    { id:'d2', name:'Платье синее',      cat:'dress',  color:'синий',       icon:'dress',   warmth:2, season:['summer','demi'], occ:['date','walk'] },
    { id:'s1', name:'Ботинки чёрные',    cat:'shoes',  color:'чёрный',      icon:'boots',   warmth:4, season:['winter','demi'], occ:['walk','office','date'] },
    { id:'s2', name:'Кроссовки белые',   cat:'shoes',  color:'белый',       icon:'sneakers',warmth:1, season:['summer','demi'], occ:['sport','walk'] },
    { id:'s3', name:'Лоферы шоколадные', cat:'shoes',  color:'шоколадный',  icon:'loafers', warmth:2, season:['summer','demi','winter'], occ:['office','date'] },
    { id:'g1', name:'Сумка бордовая',    cat:'bag',    color:'бордовый',    icon:'bag',     warmth:0, season:['summer','demi','winter'], occ:['office','date'] },
    { id:'g2', name:'Сумка чёрная',      cat:'bag',    color:'чёрный',      icon:'bag',     warmth:0, season:['summer','demi','winter'], occ:['walk','sport','office'] }
  ];

  const OCC_LABEL = { office:'офис', walk:'прогулка', date:'свидание', sport:'спорт' };

  /* ── Состояние ──────────────────────────────────────────── */
  const LS_ITEMS = 'obraz.items.v1';
  const LS_LOG   = 'obraz.wearlog.v1';

  const state = {
    items: [],
    log: [],
    cat: 'all',
    q: '',
    temp: 8,
    occ: 'office',
    lastOutfit: null,
    lastWearIds: null
  };

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  function load() {
    let items = null, log = null;
    try {
      items = JSON.parse(localStorage.getItem(LS_ITEMS) || 'null');
      log   = JSON.parse(localStorage.getItem(LS_LOG)   || 'null');
    } catch (e) { /* приватный режим */ }
    state.items = Array.isArray(items) && items.length ? items : SEED.map(x => ({ ...x }));
    state.log   = Array.isArray(log) ? log : [];
  }

  function save() {
    try {
      localStorage.setItem(LS_ITEMS, JSON.stringify(state.items));
      localStorage.setItem(LS_LOG, JSON.stringify(state.log));
    } catch (e) { /* переполнение квоты — не критично для демо */ }
  }

  /* ── Утилиты ────────────────────────────────────────────── */
  const byId = id => state.items.find(i => i.id === id);
  const today = () => new Date().toISOString().slice(0, 10);

  function seasonFor(t) {
    if (t >= 24) return 'summer';
    if (t >= 16) return 'summer';
    if (t >= 6)  return 'demi';
    return 'winter';
  }

  function daysAgo(dateStr) {
    const d = (Date.now() - new Date(dateStr + 'T12:00:00').getTime()) / 86400000;
    return Math.max(0, Math.round(d));
  }

  function lastWorn(id) {
    const entries = state.log.filter(e => e.ids.includes(id)).sort((a, b) => a.d < b.d);
    return entries.length ? entries[entries.length - 1].d : null;
  }

  function wearsCount(id) {
    return state.log.filter(e => e.ids.includes(id)).length;
  }

  function isFresh(id) {
    const d = lastWorn(id);
    return !d || daysAgo(d) > 6;
  }

  const rand = n => Math.floor(Math.random() * n);

  /* ── Ядро: сборка образа ────────────────────────────────── */
  function idealWarmth(t) {
    if (t < 0)  return { top: 5, outer: 5, shoes: 4 };
    if (t < 8)  return { top: 4, outer: 5, shoes: 4 };
    if (t < 16) return { top: 3, outer: 3, shoes: 2 };
    if (t < 22) return { top: 2, outer: 0, shoes: 2 };
    if (t < 27) return { top: 1, outer: 0, shoes: 1 };
    return { top: 1, outer: 0, shoes: 1 };
  }

  function colorScore(item, base) {
    const c = COLORS[item.color] || { neutral:true };
    if (c.neutral) return 1.4;
    if (!base) return 1.2;
    const b = COLORS[base.color] || { neutral:true };
    if (b.neutral) return 1.6;                       // акцент на нейтральной базе — хорошо
    if (item.color === base.color) return 0.4;       // total look — на любителя
    const ok = HARMONY.some(p => p.includes(item.color) && p.includes(base.color));
    return ok ? 1.5 : -0.6;                          // два акцента без гармонии — плохо
  }

  function score(item, occ, season, ideal, base) {
    let s = 0;
    if (item.occ.includes(occ)) s += 3;
    else s -= 1.2;
    if (item.season.includes(season)) s += 2;
    else s -= 1.6;
    s += colorScore(item, base);
    s += (3 - Math.abs(item.warmth - ideal)) * 1.1;
    if (isFresh(item.id)) s += 1.5;
    if (lastWorn(item.id) === today()) s -= 4;       // сегодня уже надевали
    s += Math.random() * 0.9;
    return s;
  }

  function bestOf(pool, opts) {
    if (!pool.length) return null;
    const ranked = pool
      .map(item => ({ item, s: score(item, opts.occ, opts.season, opts.ideal, opts.base) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, 3);
    return ranked[rand(ranked.length)].item;
  }

  function buildOutfit(occ, temp) {
    const season = seasonFor(temp);
    const ideal = idealWarmth(temp);
    const pool = cat => state.items.filter(i => i.cat === cat);
    const look = [];

    // 1. база: платье или низ
    const dressChance = occ === 'date' ? 0.65 : occ === 'office' ? 0.15 : 0.1;
    let base = null;
    if (pool('dress').length && Math.random() < dressChance) {
      base = bestOf(pool('dress'), { occ, season, ideal: ideal.top, base: null });
      look.push(base);
    } else {
      base = bestOf(pool('bottom'), { occ, season, ideal: ideal.top, base: null });
      if (base) look.push(base);
      const top = bestOf(pool('top').filter(i => i.id !== base.id), { occ, season, ideal: ideal.top, base });
      if (top) look.unshift(top);   // верх первым в коллаже
    }

    // 2. верхняя одежда
    if (ideal.outer > 0) {
      const outer = bestOf(pool('outer'), { occ, season, ideal: ideal.outer, base });
      if (outer) look.unshift(outer);
    }

    // 3. обувь
    const shoes = bestOf(pool('shoes'), { occ, season, ideal: ideal.shoes, base });
    if (shoes) look.push(shoes);

    // 4. сумка — не всегда
    if (occ !== 'sport' && Math.random() < 0.9) {
      const bag = bestOf(pool('bag'), { occ, season, ideal: 1, base });
      if (bag) look.push(bag);
    }

    const accents = look.filter(i => !(COLORS[i.color] || {}).neutral);
    const reasons = [];
    reasons.push(`на улице <b>${temp > 0 ? '+' : ''}${temp}°</b> — ${temp < 0 ? 'зимний' : temp < 8 ? 'тёплый' : temp < 16 ? 'межсезонный' : temp < 24 ? 'лёгкий' : 'летний'} слой`);
    reasons.push(`повод: <b>${OCC_LABEL[occ]}</b>`);
    if (accents.length === 1) reasons.push(`один акцент — <b>${accents[0].color}</b>, остальное нейтральное`);
    else if (accents.length > 1) reasons.push(`два акцента в одной гамме`);
    else reasons.push(`полностью нейтральная гамма`);
    const fresh = look.filter(i => isFresh(i.id)).length;
    reasons.push(`<b>${fresh}</b> из ${look.length} вещей не надевались неделю`);

    return {
      items: look,
      reason: reasons.join(' · '),
      occ, temp
    };
  }

  /* ── Рендер: карточка вещи ──────────────────────────────── */
  function itemThumb(item) {
    if (item.photo) return `<img src="${item.photo}" alt="">`;
    return `<svg aria-hidden="true"><use href="#i-${item.icon}"/></svg>`;
  }

  function renderWardrobe() {
    const grid = $('#wbGrid');
    const q = state.q.trim().toLowerCase();
    const list = state.items.filter(i => {
      const catOk = state.cat === 'all' || i.cat === state.cat;
      const qOk = !q || i.name.toLowerCase().includes(q) || i.color.includes(q);
      return catOk && qOk;
    });

    grid.innerHTML = list.map(i => `
      <article class="wb-card${i.user ? ' is-user' : ''}" style="--c:${(COLORS[i.color]||{}).hex || '#ccc'}">
        ${i.user ? '<span class="tag-new">моё</span>' : ''}
        <button class="del" type="button" data-del="${i.id}" aria-label="Удалить ${i.name}">×</button>
        <div class="thumb">${itemThumb(i)}</div>
        <b>${i.name}</b>
        <small>${CAT_LABEL[i.cat]} · ${i.color}</small>
      </article>
    `).join('');

    $('#wbEmpty').hidden = list.length > 0;
    renderWearStats();
  }

  function renderWearStats() {
    const total = state.log.reduce((n, e) => n + e.ids.length, 0);
    const unique = new Set(state.log.flatMap(e => e.ids)).size;
    $('#wearStats').innerHTML = `
      <div><b>${total}</b><span>вещей надето</span></div>
      <div><b>${unique}</b><span>задействовано из ${state.items.length}</span></div>
    `;

    const never = state.items.filter(i => wearsCount(i.id) === 0);
    const list = $('#unwornList');
    if (!never.length) {
      list.innerHTML = '<li>Все вещи хотя бы раз попали в образ. Хороший знак.</li>';
    } else {
      list.innerHTML = never.slice(0, 5)
        .map(i => `<li><span>${i.name}</span><span class="n">0 носок</span></li>`).join('');
    }
  }

  /* ── Рендер: коллаж образа ──────────────────────────────── */
  function stripHTML(items) {
    return items.map(i => `
      <div class="look-item" title="${i.name}">
        <div class="box">${itemThumb(i)}</div>
        <span>${i.name}</span>
      </div>`).join('');
  }

  function showOutfit(outfit, targetOut, targetReason) {
    state.lastOutfit = outfit;
    const out = $(targetOut), reason = $(targetReason);
    if (!outfit) {
      reason.innerHTML = 'Не хватает вещей для этого повода. Добавьте что-нибудь в гардероб.';
      out.hidden = false;
      $('#lookStrip').innerHTML = '';
      return;
    }
    $('#lookStrip').innerHTML = stripHTML(outfit.items);
    reason.innerHTML = 'Почему так: ' + outfit.reason + '.';
    out.hidden = false;
  }

  function build() {
    const fit = buildOutfit(state.occ, state.temp);
    showOutfit(fit, '#builderOut', '#lookReason');
  }

  function wear() {
    if (!state.lastOutfit) return;
    const ids = state.lastOutfit.items.map(i => i.id);
    state.log.push({ d: today(), ids, occ: state.occ });
    state.lastWearIds = ids;
    save();
    renderWearStats();
    renderWardrobe();
    const btn = $('#wearBtn');
    if (btn) {
      btn.textContent = 'Записано ✓';
      setTimeout(() => { btn.textContent = 'Надеть сегодня'; }, 1600);
    }
  }

  /* ── Чипы категорий, поиск ──────────────────────────────── */
  function initFilters() {
    $('#wbChips').addEventListener('click', e => {
      const chip = e.target.closest('.chip');
      if (!chip) return;
      $$('.chip').forEach(c => c.classList.toggle('is-on', c === chip));
      state.cat = chip.dataset.cat;
      renderWardrobe();
    });

    let timer;
    $('#wbSearch').addEventListener('input', e => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        state.q = e.target.value;
        renderWardrobe();
      }, 140);
    });

    $('#wbGrid').addEventListener('click', e => {
      const del = e.target.closest('[data-del]');
      if (!del) return;
      state.items = state.items.filter(i => i.id !== del.dataset.del);
      save();
      renderWardrobe();
    });

    $('[data-reset]').addEventListener('click', () => {
      try { localStorage.removeItem(LS_ITEMS); localStorage.removeItem(LS_LOG); } catch (e) {}
      state.items = SEED.map(x => ({ ...x }));
      state.log = [];
      save();
      renderWardrobe();
      $('#builderOut').hidden = true;
    });
  }

  /* ── Модалка добавления ─────────────────────────────────── */
  function resizeImage(file, cb) {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        const max = 320;
        const k = Math.min(1, max / Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width * k);
        c.height = Math.round(img.height * k);
        c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
        cb(c.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => cb(null);
      img.src = reader.result;
    };
    reader.onerror = () => cb(null);
    reader.readAsDataURL(file);
  }

  function initModal() {
    const modal = $('#addModal');
    const open = () => { modal.hidden = false; document.body.style.overflow = 'hidden'; $('#addName').focus(); };
    const close = () => { modal.hidden = true; document.body.style.overflow = ''; $('#addForm').reset(); };

    $$('[data-open-add]').forEach(b => b.addEventListener('click', open));
    $$('[data-close-add]').forEach(b => b.addEventListener('click', close));
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && !modal.hidden) close(); });

    const catToIcon = { outer:'coat', top:'sweater', bottom:'trousers', dress:'dress', shoes:'sneakers', bag:'bag' };

    $('#addForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#addName').value.trim();
      if (!name) return;
      const cat = $('#addCat').value;
      const color = $('#addColor').value;
      const file = $('#addFile').files[0];

      const push = photo => {
        state.items.unshift({
          id: 'u' + Date.now(),
          name, cat, color,
          icon: catToIcon[cat],
          warmth: cat === 'outer' ? 4 : cat === 'shoes' ? 2 : cat === 'bag' ? 0 : 2,
          season: ['summer','demi','winter'],
          occ: ['office','walk','date','sport'],
          user: true,
          photo
        });
        save();
        renderWardrobe();
        close();
      };

      if (file) resizeImage(file, push);
      else push(null);
    });
  }

  /* ── Стилист-чат (правила) ──────────────────────────────── */
  function miniStrip(items) {
    return `<div class="mini">${items.map(i => `<span>${i.name}</span>`).join('')}</div>`;
  }

  function answer(text) {
    const t = text.toLowerCase();

    if (/привет|здравств|хай|доброе утро/.test(t)) {
      return 'Привет! Я вижу ваш гардероб и историю носки. Скажите повод и погоду — соберу образ. Или спросите про конкретную вещь: «с чем носить пальто?»';
    }

    if (/погод|градус|температур|холодно|тепло/.test(t)) {
      const fit = buildOutfit(state.occ, state.temp);
      return `Сейчас в демо <b>${state.temp > 0 ? '+' : ''}${state.temp}°</b>. Под такую погоду я бы взял ${
        fit.items.filter(i => i.cat === 'outer').length ? 'верхнюю одежду' : 'без верхней одежды'
      }. Вот вариант:${miniStrip(fit.items)}`;
    }

    if (/собеседован|работ|офис|встреч|презентац/.test(t)) {
      const fit = buildOutfit('office', Math.min(state.temp, 18));
      return `На собеседование — спокойная база и один акцент. Мой выбор:${miniStrip(fit.items)}Если сомневаетесь, замените акцентную вещь на нейтральную: строгий повод не любит двух ярких пятен.`;
    }

    if (/свидан|вечер|ресторан|свидание|показ/.test(t)) {
      const fit = buildOutfit('date', state.temp);
      return `На вечер можно смелее:${miniStrip(fit.items)}Главное — не больше одного акцента, иначе образ начинает спорить сам с собой.`;
    }

    if (/спорт|прогулк|гулят|дорог|аэропорт/.test(t)) {
      const fit = buildOutfit('sport', state.temp);
      return `Для движения — удобство в приоритете:${miniStrip(fit.items)}`;
    }

    // «с чем носить X»
    const m = t.match(/с чем носить\s+([а-яё\s]+)/);
    if (m) {
      const q = m[1].trim();
      const item = state.items.find(i => i.name.toLowerCase().includes(q.split(' ')[0]));
      if (!item) return `Не нашёл «${q}» в гардеробе. Проверьте название — или добавьте вещь, и я сразу учту её в образах.`;
      const partners = state.items.filter(i =>
        i.id !== item.id &&
        i.cat !== item.cat &&
        (i.occ.some(o => item.occ.includes(o)))
      ).sort((a, b) => colorScore(b, item) - colorScore(a, item)).slice(0, 4);
      return `«${item.name}» (<b>${item.color}</b>) хорошо работает с:` + miniStrip(partners) +
             `Совет: если вещь яркая, оставьте остальное нейтральным — так она становится акцентом, а не спором.`;
    }

    if (/докуп|купить|не хватает|пробел|зим|капсул/.test(t)) {
      const need = [];
      const hasWarmShoes = state.items.some(i => i.cat === 'shoes' && i.warmth >= 4);
      const hasWarmOuter = state.items.some(i => i.cat === 'outer' && i.warmth >= 5);
      const darkTops = state.items.filter(i => i.cat === 'top' && (COLORS[i.color] || {}).neutral).length;
      if (!hasWarmShoes) need.push('тёплая обувь (ботинки или сапоги) — сейчас в гардеробе только лёгкая пара');
      if (!hasWarmOuter) need.push('тёплое пальто или пуховик на минус');
      if (darkTops < 2) need.push('ещё один нейтральный верх — база для слоёв');
      if (!state.items.some(i => i.cat === 'bag' && (COLORS[i.color] || {}).neutral)) need.push('нейтральная сумка под всё');
      if (!need.length) need.push('ничего критичного: гардероб закрывает поводы, дальше — только точные акценты');
      return `Смотрю на ваш гардероб: <b>${state.items.length}</b> вещей.<br>Что действительно просится:<br>— ${need.join('<br>— ')}<br><br>Это дешевле, чем ещё одна «красивая» вещь, которая ни с чем не сойдётся.`;
    }

    if (/что надеть|собер|образ|подбер/.test(t)) {
      const fit = buildOutfit(state.occ, state.temp);
      return `Собрал под «${OCC_LABEL[state.occ]}» и ${state.temp > 0 ? '+' : ''}${state.temp}°:${miniStrip(fit.items)}${fit.reason}.`;
    }

    if (/сколько|цена|тариф|подписк|стоит/.test(t)) {
      return 'Старт — бесплатно: 30 вещей и 30 подборов в месяц, без карты. Pro — 490 ₽/мес: безлимит вещей, планировщик недели и 25 примерок. Год — 3 900 ₽.';
    }

    if (/фото|данн|приват|безопас|удал/.test(t)) {
      return 'В этом прототипе гардероб хранится только в вашем браузере (localStorage) и никуда не отправляется. Кнопка «Сбросить демо» удаляет всё сразу.';
    }

    return 'Пока я отвечаю по правилам демо. Попробуйте: «что надеть на собеседование?», «с чем носить пальто?», «что докупить на зиму?», «сколько стоит?» — или нажмите «Собрать образ» справа.';
  }

  function initChat() {
    const body = $('#chatBody');

    const add = (text, who) => {
      const div = document.createElement('div');
      div.className = 'msg ' + who;
      div.innerHTML = text;
      body.appendChild(div);
      body.scrollTop = body.scrollHeight;
    };

    const ask = text => {
      add(text, 'user');
      $('#chatInput').value = '';
      setTimeout(() => add(answer(text), 'bot'), 380);
    };

    $('#chatForm').addEventListener('submit', e => {
      e.preventDefault();
      const v = $('#chatInput').value.trim();
      if (v) ask(v);
    });

    $('#chatSuggest').addEventListener('click', e => {
      const b = e.target.closest('button');
      if (b) ask(b.textContent);
    });
  }

  /* ── Слайдер примерки ───────────────────────────────────── */
  function initCompare() {
    const box = $('#compare');
    const wrap = $('#cmpAfterWrap');
    const handle = $('#cmpHandle');
    let dragging = false;

    const setPct = pct => {
      const p = Math.min(100, Math.max(0, pct));
      wrap.style.clipPath = `inset(0 0 0 ${p}%)`;
      handle.style.left = p + '%';
      handle.setAttribute('aria-valuenow', Math.round(p));
    };

    const fromEvent = e => {
      const r = box.getBoundingClientRect();
      const x = (e.touches ? e.touches[0].clientX : e.clientX) - r.left;
      setPct(x / r.width * 100);
    };

    const start = e => { dragging = true; fromEvent(e); };
    const move  = e => { if (dragging) { e.preventDefault(); fromEvent(e); } };
    const end   = () => { dragging = false; };

    box.addEventListener('pointerdown', start);
    window.addEventListener('pointermove', move, { passive: false });
    window.addEventListener('pointerup', end);
    window.addEventListener('pointercancel', end);

    handle.addEventListener('keydown', e => {
      const cur = +handle.getAttribute('aria-valuenow');
      if (e.key === 'ArrowLeft')  { setPct(cur - 5); e.preventDefault(); }
      if (e.key === 'ArrowRight') { setPct(cur + 5); e.preventDefault(); }
    });

    setPct(50);
  }

  /* ── Проверка покупки ───────────────────────────────────── */
  function initPurchase() {
    const colorSel = $('#purColor');
    colorSel.innerHTML = Object.keys(COLORS)
      .map(c => `<option value="${c}">${c}</option>`).join('');

    $('#purForm').addEventListener('submit', e => {
      e.preventDefault();
      const cat = $('#purCat').value;
      const color = $('#purColor').value;
      const fake = { cat, color, occ: ['office','walk','date','sport'] };

      const partners = state.items.filter(i => i.cat !== cat).filter(i => {
        const c = COLORS[i.color] || { neutral:true };
        const cc = COLORS[color];
        if (cc.neutral || c.neutral) return true;
        return HARMONY.some(p => p.includes(i.color) && p.includes(color));
      });

      // сколько «слотов» закрыто
      const need = cat === 'dress' ? ['shoes'] : cat === 'bottom' ? ['top','shoes'] : ['bottom','shoes'];
      const missing = need.filter(slot => !state.items.some(i => i.cat === slot));
      const combos = Math.min(partners.length * 3, 99);
      const dupes = state.items.filter(i => i.cat === cat && i.color === color).length;

      const verdict = $('#purVerdict');
      const text = $('#purText');
      const strip = $('#purStrip');

      if (dupes > 0) {
        verdict.className = 'pur-verdict mid';
        verdict.textContent = 'Похоже, это дубль';
        text.innerHTML = `У вас уже есть <b>${dupes}</b> вещь(и) этой категории в цвете «${color}». Прежде чем покупать, проверьте, не заменит ли новая старая. Вещь, которая дублирует, не носится вдвое чаще — она просто занимает место.`;
        strip.innerHTML = '';
      } else if (combos >= 9 && !missing.length) {
        verdict.className = 'pur-verdict good';
        verdict.textContent = 'Есть с чем носить';
        text.innerHTML = `Цвет «${color}» в этой категории даёт <b>${combos}+</b> сочетаний с вашими вещами, и все нужные слоты закрыты. Покупка логична — она расширяет гардероб, а не висит отдельно.`;
        strip.innerHTML = stripHTML(partners.slice(0, 5));
      } else {
        verdict.className = 'pur-verdict mid';
        verdict.textContent = 'Стоит подумать';
        text.innerHTML = `Сочетаний немного: <b>${combos}</b>. ${missing.length ? 'Не хватает: <b>' + missing.map(s => CAT_LABEL[s]).join(', ') + '</b>. ' : ''}Такая вещь будет носиться редко, пока не появится пара.`;
        strip.innerHTML = partners.length ? stripHTML(partners.slice(0, 4)) : '';
      }

      $('#purResult').hidden = false;
    });
  }

  /* ── Hero: перемешать образ ─────────────────────────────── */
  function initHero() {
    const look = $('#heroLook');
    if (!look) return;

    const shuffle = () => {
      const fit = buildOutfit('office', 6);
      look.innerHTML = fit.items.map(i => `
        <figure class="hc-item" data-cat="${i.cat}">
          <svg aria-hidden="true"><use href="#i-${i.icon}"/></svg>
          <figcaption>${i.name.split(' ')[0]}</figcaption>
        </figure>`).join('');
    };

    const btn = $('[data-demo-shuffle]');
    if (btn) btn.addEventListener('click', shuffle);

    const wearBtn = $('[data-demo-wear]');
    if (wearBtn) {
      wearBtn.addEventListener('click', () => {
        const fit = buildOutfit('office', 6);
        state.log.push({ d: today(), ids: fit.items.map(i => i.id), occ: 'office' });
        save();
        renderWearStats();
        renderWardrobe();
        wearBtn.textContent = 'Записано ✓';
        setTimeout(() => { wearBtn.textContent = 'Надеть сегодня'; }, 1600);
      });
    }
  }

  /* ── Появление секций ───────────────────────────────────── */
  function initReveal() {
    if (!('IntersectionObserver' in window)) return;
    const targets = $$('.sec-head, .step, .wb-layout, .chat, .chat-copy, .compare, .fit-copy, .pur-form, .plan, .faq');
    targets.forEach(el => el.classList.add('reveal'));
    const io = new IntersectionObserver(entries => {
      entries.forEach(en => {
        if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -40px' });
    targets.forEach(el => io.observe(el));
  }

  /* ── Липкая шапка ───────────────────────────────────────── */
  function initHead() {
    const head = $('.site-head');
    const onScroll = () => head.classList.toggle('is-stuck', window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
  }

  /* ── Старт ──────────────────────────────────────────────── */
  function init() {
    load();

    // цвет-селект в модалке
    $('#addColor').innerHTML = Object.keys(COLORS)
      .map(c => `<option value="${c}">${c}</option>`).join('');

    initFilters();
    initModal();
    initChat();
    initCompare();
    initPurchase();
    initHero();
    initReveal();
    initHead();

    renderWardrobe();

    // сборщик
    $('#occ').addEventListener('change', e => { state.occ = e.target.value; });
    $('#temp').addEventListener('input', e => {
      state.temp = +e.target.value;
      $('#tempOut').textContent = (state.temp > 0 ? '+' : '') + state.temp + '°C';
    });
    $('#buildBtn').addEventListener('click', build);
    $('#againBtn').addEventListener('click', build);
    $('#wearBtn').addEventListener('click', wear);

    // первый образ сразу — чтобы блок не был пустым
    setTimeout(build, 120);
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
