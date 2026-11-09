/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · каталог и подбор комплектов
   Виртуальный каталог партнёров: 100 500 SKU, привязанных к 92 фото.
   Воронка отсева считается по всем записям, а не «на глаз».
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const N = 100500;                    // позиций в каталоге партнёров
  const PHOTOS = window.ITEM_PHOTOS || [];

  const items = D.buildItems(PHOTOS);
  const byId = new Map(items.map(i => [i.id, i]));
  const bySlot = slot => items.filter(i => i.slot === slot);

  /* ── каталог: компактные типизированные массивы ─────────── */
  let catalog = null;

  function hash(n) {
    let x = n * 2654435761 % 4294967296;
    x ^= x >>> 13;
    x = (x * 1274126177) % 4294967296;
    return (x >>> 0) / 4294967296;
  }

  function ensureCatalog() {
    if (catalog) return catalog;
    const ph = new Uint8Array(N);
    const size = new Uint8Array(N);
    const season = new Uint8Array(N);
    const occ = new Uint8Array(N);
    const worn = new Uint8Array(N);
    const price = new Uint16Array(N);

    for (let i = 0; i < N; i++) {
      const item = items[i % items.length];
      ph[i] = i % items.length;
      // независимые псевдослучайные атрибуты: без корреляции mod-ов
      size[i] = 42 + Math.floor(hash(i * 13 + 5) * 9);
      const s = item.season;
      const sIdx = Math.floor(hash(i * 3 + 1) * s.length);
      season[i] = s[sIdx] === 'winter' ? 2 : s[sIdx] === 'demi' ? 1 : 0;
      const o = item.occ;
      occ[i] = ['office','walk','date','sport'].indexOf(o[Math.floor(hash(i * 7 + 11) * o.length)]);
      worn[i] = hash(i * 7 + 3) < 0.28 ? 1 : 0;
      price[i] = 1290 + Math.floor(hash(i * 13 + 7) * 110);
    }
    catalog = { ph, size, season, occ, worn, price };
    return catalog;
  }

  function seasonFor(temp) {
    if (temp >= 22) return 0;   // summer
    if (temp >= 6) return 1;    // demi
    return 2;                   // winter
  }

  const SEASON_NAME = ['лето', 'межсезонье', 'зима'];

  /* ── воронка ────────────────────────────────────────────── */
  /**
   * @param {object} ctx {gender, size, temp, occ, baseHex, wornIds, recentIds}
   * @returns {{stages:Array, pool:Array}}
   */
  function funnel(ctx) {
    const c = ensureCatalog();
    const season = seasonFor(ctx.temp);
    const occIdx = ['office','walk','date','sport'].indexOf(ctx.occ);
    const recent = ctx.recentIds || new Set();

    const needOuter = ctx.temp < 17;
    const needHat = ctx.temp < 8;
    const needSlots = new Set(['top','bottom','dress','shoes']);
    if (needOuter) needSlots.add('outer');
    if (needHat) needSlots.add('hat');

    const stages = [];
    let count = N;
    stages.push({ key:'all', label:'Каталог партнёров', count, note:'все позиции: 92 фото × размеры × бренды' });

    const survivors = [];
    const preds = [
      (i) => ctx.gender === 'w' || items[c.ph[i]].gender !== 'w',
      (i) => c.season[i] === season,
      (i) => c.occ[i] === occIdx,
      (i) => Math.abs(c.size[i] - ctx.size) <= 1,
      (i) => D.colorFit(items[c.ph[i]].hex, ctx.baseHex) > 0.6,
      (i) => needSlots.has(items[c.ph[i]].slot)
    ];

    const stageDefs = [
      { key:'gender', label:'Ваш пол и типаж', note: ctx.gender === 'w' ? 'женские и унисекс-вещи' : 'мужские и унисекс-вещи' },
      { key:'season', label:'Сезон и погода', note: SEASON_NAME[season] + ', ' + ctx.temp + '°' },
      { key:'occasion', label:'Повод и дресс-код', note: D.OCC_LABEL[ctx.occ] },
      { key:'size', label:'Размер', note: 'размер ' + ctx.size + ' ± 1' },
      { key:'color', label:'Цветовая совместимость', note:'палитра сочетается с базой' },
      { key:'slots', label:'Слои и силуэт', note:'закрывает нужные слоты образа' }
    ];

    let pass = new Uint8Array(N);
    for (let i = 0; i < N; i++) pass[i] = 1;

    for (let s = 0; s < preds.length; s++) {
      let next = 0;
      for (let i = 0; i < N; i++) {
        if (!pass[i]) continue;
        if (!preds[s](i)) { pass[i] = 0; continue; }
        next++;
      }
      stages.push({ ...stageDefs[s], count: next });
      count = next;
    }

    // уникальные фото + история носки
    const seen = new Set();
    const shortlist = [];
    for (let i = 0; i < N; i++) {
      if (!pass[i]) continue;
      const item = items[c.ph[i]];
      if (seen.has(item.id)) continue;
      seen.add(item.id);
      shortlist.push(item);
    }
    stages.push({ key:'unique', label:'Уникальные модели', count: shortlist.length, note:'осталось разных вещей, а не копий размеров' });

    const fresh = shortlist.filter(it => !recent.has(it.id));
    stages.push({ key:'fresh', label:'Не носили 7 дней', count: fresh.length, note:'история носки из вашего профиля' });

    const pool = (fresh.length ? fresh : shortlist).filter(it =>
      ctx.gender === 'w' || it.gender !== 'w'
    );

    stages.push({ key:'final', label:'Финальный шорт-лист', count: Math.min(3, Math.max(1, Math.round(pool.length / 6))), note:'3 комплекта на выбор' });

    return { stages, pool, total: count };
  }

  /* ── PRNG для воспроизводимых образов ──────────────────── */
  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a |= 0; a = (a + 0x6D2B79F5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function pick(list, rnd) {
    if (!list.length) return null;
    return list[Math.floor(rnd() * list.length)];
  }

  function topBy(list, scorer, rnd, n = 3) {
    if (!list.length) return null;
    const scored = list.map(item => ({ item, s: scorer(item) }))
      .sort((a, b) => b.s - a.s)
      .slice(0, Math.max(1, n));
    const weighted = scored.slice(0, Math.min(2, scored.length));
    return weighted[Math.floor(rnd() * weighted.length)].item;
  }

  const MOODS = [
    { id:'work',    title:'Уверенный день', tag:'офис, встреча, дела', occ:'office', dress:0.08, accent:1 },
    { id:'comfy',   title:'Комфорт',        tag:'прогулка, кофе, дорога', occ:'walk', dress:0.05, accent:0 },
    { id:'evening', title:'Вечер',          tag:'ужин, свидание, гости', occ:'date', dress:0.62, accent:2 }
  ];

  /**
   * Собирает комплект из пула воронки.
   * @returns {{items:Array, moods:object, reason:string, meta:object}}
   */
  function buildSet(pool, ctx, mood, seed, used) {
    const rnd = mulberry32(seed);
    const usedIds = used || new Set();
    const has = (list, slot) => list.filter(i => i.slot === slot && i.gender !== (ctx.gender === 'w' ? 'x' : 'w'));

    const bySlotPool = {
      outer:  pool.filter(i => i.slot === 'outer'),
      top:    pool.filter(i => i.slot === 'top'),
      bottom: pool.filter(i => i.slot === 'bottom'),
      dress:  pool.filter(i => i.slot === 'dress'),
      shoes:  pool.filter(i => i.slot === 'shoes'),
      hat:    pool.filter(i => i.slot === 'hat')
    };

    const look = [];
    const warm = ctx.temp < 14;

    const useDress = ctx.gender === 'w' && bySlotPool.dress.length && rnd() < mood.dress;

    let base = null;
    if (useDress) {
      base = topBy(bySlotPool.dress, it => baseScore(it, ctx, mood), rnd);
      if (base) look.push(base);
    } else {
      base = topBy(bySlotPool.bottom, it => baseScore(it, ctx, mood), rnd);
      if (base) look.push(base);
    }

    if (!useDress) {
      const tops = bySlotPool.top.filter(it => !base || D.colorFit(it.hex, base.hex) > 0.6);
      const top = topBy(tops.length ? tops : bySlotPool.top, it => layerScore(it, ctx, mood, base), rnd);
      if (top) look.unshift(top);
    }

    if (warm) {
      const outers = bySlotPool.outer.filter(it => !base || D.colorFit(it.hex, base.hex) > 0.3);
      const outer = topBy(outers.length ? outers : bySlotPool.outer,
        it => layerScore(it, ctx, mood, base) + (ctx.temp < 5 ? 2 : 0), rnd, 2);
      if (outer) look.unshift(outer);
    }

    const shoes = topBy(bySlotPool.shoes, it => layerScore(it, ctx, mood, base), rnd, 2);
    if (shoes) look.push(shoes);

    if (ctx.temp < 8) {
      const hat = topBy(bySlotPool.hat, it => layerScore(it, ctx, mood, base), rnd, 2);
      if (hat) look.push(hat);
    }

    // дедупликация и порядок слоёв
    const order = ['outer','top','dress','bottom','shoes','hat'];
    const seen = new Set();
    const final = look.filter(i => {
      if (!i || seen.has(i.id)) return false;
      seen.add(i.id); return true;
    }).sort((a, b) => order.indexOf(a.slot) - order.indexOf(b.slot));

    const accents = final.filter(i => !i.neutral);
    const reasons = [];
    reasons.push('погода <b>' + (ctx.temp > 0 ? '+' : '') + ctx.temp + '°</b>, ' + SEASON_NAME[seasonFor(ctx.temp)]);
    reasons.push('повод: <b>' + D.OCC_LABEL[mood.occ] + '</b>');
    if (accents.length === 1) reasons.push('один акцент — <b>' + accents[0].color + '</b>');
    else if (accents.length >= 2) reasons.push('два близких тона: <b>' + accents.slice(0,2).map(a => a.color).join(' + ') + '</b>');
    else reasons.push('нейтральная база без акцентов');

    const score = Math.round(72 + rnd() * 12 + accents.length * 3);

    return {
      id: mood.id + '-' + seed,
      items: final,
      mood,
      occ: mood.occ,
      temp: ctx.temp,
      reason: reasons.join(' · '),
      fit: Math.min(98, score)
    };
  }

  function baseScore(item, ctx, mood) {
    let s = 0;
    if (mood.used && mood.used.has(item.id)) s -= 2.6;
    s += D.colorFit(item.hex, ctx.baseHex) * 2;
    s += item.neutral ? 0.6 : mood.accent > 0 ? 0.8 : 0;
    s += (item.occ.includes(mood.occ) ? 1.4 : -0.6);
    s += Math.random() * 0.4;
    return s;
  }

  function layerScore(item, ctx, mood, base) {
    let s = 0;
    if (mood.used && mood.used.has(item.id)) s -= 2.6;
    if (base) s += D.colorFit(item.hex, base.hex) * 2.2;
    s += (item.occ.includes(mood.occ) ? 1.2 : -0.5);
    s += (3 - Math.abs(item.warmth - idealWarmth(ctx.temp, item.slot))) * 0.9;
    s += Math.random() * 0.3;
    return s;
  }

  function idealWarmth(temp, slot) {
    if (slot === 'outer') return temp < 0 ? 5 : temp < 8 ? 5 : 3;
    if (slot === 'shoes') return temp < 5 ? 4 : 2;
    if (slot === 'hat') return 3;
    return temp < 6 ? 4 : temp < 14 ? 3 : temp < 22 ? 2 : 1;
  }

  /* ── комплекты на день ──────────────────────────────────── */
  let seedCounter = 0;

  function dayVariants(day, ctx, count = 3) {
    const r = funnel({ ...ctx, occ: MOODS[0].occ });
    const results = [];
    const daySeed = day === 'today' ? 17 : 41;
    const used = new Set();

    MOODS.slice(0, count).forEach((mood, idx) => {
      const f = funnel({ ...ctx, occ: mood.occ });
      const pool = f.pool;
      if (!pool.length) return;
      const seed = daySeed * 1000 + idx * 97 + (seedCounter++ % 7);
      const set = buildSet(pool, { ...ctx, occ: mood.occ }, { ...mood, used }, seed);
      set.items.forEach(i => used.add(i.id));
      results.push({ ...set, funnel: f });
    });
    return { variants: results, funnel: r };
  }

  window.OBRAZ_SETS = {
    N, items, byId, bySlot, funnel, dayVariants, buildSet, MOODS,
    seasonFor, SEASON_NAME, ensureCatalog
  };
})();
