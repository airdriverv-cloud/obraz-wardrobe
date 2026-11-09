/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · данные: справочники, метаданные вещей, модели
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  /* ── Категории фото → слоты гардероба ──────────────────── */
  const CAT_META = {
    outwear:    { slot:'outer',  label:'Куртка',    type:'coat',       warmth:5, season:['winter','demi'], occ:['office','walk','date'], gender:'u' },
    longsleeve: { slot:'top',    label:'Лонгслив',  type:'longsleeve', warmth:3, season:['demi','summer'],  occ:['office','walk','date'], gender:'u' },
    shirt:      { slot:'top',    label:'Рубашка',   type:'shirt',      warmth:2, season:['summer','demi','winter'], occ:['office','date'], gender:'u' },
    't-shirt':  { slot:'top',    label:'Футболка',  type:'tshirt',     warmth:1, season:['summer'],       occ:['walk','sport','date'], gender:'u' },
    pants:      { slot:'bottom', label:'Брюки',     type:'pants',      warmth:3, season:['summer','demi','winter'], occ:['office','walk','date'], gender:'u' },
    shorts:     { slot:'bottom', label:'Шорты',     type:'shorts',     warmth:1, season:['summer'],       occ:['walk','sport'], gender:'u' },
    skirt:      { slot:'bottom', label:'Юбка',      type:'skirt',      warmth:2, season:['summer','demi'], occ:['office','date'], gender:'w' },
    dress:      { slot:'dress',  label:'Платье',    type:'dress',      warmth:2, season:['summer','demi'], occ:['date','office'], gender:'w' },
    shoes:      { slot:'shoes',  label:'Обувь',     type:'sneakers',   warmth:2, season:['summer','demi','winter'], occ:['office','walk','date','sport'], gender:'u' },
    hat:        { slot:'hat',    label:'Головной убор', type:'hat',    warmth:3, season:['winter','demi'], occ:['walk','sport'], gender:'u' }
  };

  const SLOT_LABEL = {
    outer:'верхняя одежда', top:'верх', bottom:'низ',
    dress:'платье', shoes:'обувь', hat:'головной убор'
  };

  const OCC_LABEL = { office:'офис', walk:'прогулка', date:'свидание', sport:'спорт' };

  /* ── Модели для примерки ───────────────────────────────── */
  const MODELS = [
    { id:'mila', name:'Мила',    gender:'w', skin:'#EFCDB4', hair:'#3B2A21', style:'long',   height:1.00, note:'38–40 размер · 170 см' },
    { id:'nika', name:'Ника',    gender:'w', skin:'#C98F76', hair:'#5A3A2A', style:'bun', height:0.97, note:'42 размер · 166 см' },
    { id:'mark', name:'Марк',    gender:'m', skin:'#E3B995', hair:'#241C17', style:'short',  height:1.03, note:'48 размер · 182 см' },
    { id:'timur',name:'Тимур',   gender:'m', skin:'#B98461', hair:'#1A1512', style:'crop',   height:1.00, note:'50 размер · 178 см' }
  ];

  /* ── Цветовые правила ──────────────────────────────────── */
  function hexToRgb(hex) {
    const h = hex.replace('#', '');
    return [parseInt(h.slice(0,2),16), parseInt(h.slice(2,4),16), parseInt(h.slice(4,6),16)];
  }

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r,g,b), min = Math.min(r,g,b);
    const l = (max + min) / 2;
    let h = 0, s = 0;
    if (max !== min) {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
      else if (max === g) h = ((b - r) / d + 2) / 6;
      else h = ((r - g) / d + 4) / 6;
    }
    return [h * 360, s, l];
  }

  function hslOf(hex) {
    const [r,g,b] = hexToRgb(hex);
    return rgbToHsl(r,g,b);
  }

  function isNeutral(hex) {
    const [h,s,l] = hslOf(hex);
    return s < 0.16 || l > 0.86 || l < 0.13;
  }

  function hueDistance(a, b) {
    const d = Math.abs(hslOf(a)[0] - hslOf(b)[0]);
    return Math.min(d, 360 - d);
  }

  /** Совместимы ли два цвета: нейтраль + любой, либо близкие/парные тона. */
  function colorFit(hexA, hexB) {
    if (isNeutral(hexA) || isNeutral(hexB)) return 1;
    const d = hueDistance(hexA, hexB);
    if (d < 22) return 0.8;                  // монохром
    if (d < 45) return 1;                    // родственные
    if (Math.abs(d - 60) < 20) return 1;     // аналоговая триада
    if (Math.abs(d - 120) < 22) return 0.9;  // триада
    if (Math.abs(d - 180) < 26) return 0.7;  // комплементарные
    return 0.15;
  }

  function shade(hex, k) {
    const [r,g,b] = hexToRgb(hex);
    const f = v => Math.max(0, Math.min(255, Math.round(k >= 0 ? v + (255 - v) * k : v * (1 + k))));
    return '#' + [f(r), f(g), f(b)].map(v => v.toString(16).padStart(2,'0')).join('');
  }

  /* ── Обогащение фотокаталога ───────────────────────────── */
  function buildItems(photos) {
    return photos.map(p => {
      const meta = CAT_META[p.cat] || CAT_META['t-shirt'];
      return {
        id: p.id,
        src: p.src,
        hex: p.hex,
        color: p.color,
        cat: p.cat,
        slot: meta.slot,
        type: meta.type,
        name: meta.label + ', ' + p.color,
        short: meta.label,
        warmth: meta.warmth,
        season: meta.season.slice(),
        occ: meta.occ.slice(),
        gender: meta.gender,
        brand: p.id.split('-')[0].toUpperCase(),
        neutral: isNeutral(p.hex)
      };
    });
  }

  /* ── Состояние пользователя по умолчанию ───────────────── */
  const DEFAULT_PROFILE = {
    gender: 'w',
    size: 44,
    style: 'smart',
    baseColor: '#2C4A6E',
    disliked: []
  };

  const WEATHER = [
    { day:'today',    label:'Сегодня', date:'13 ноября', temp: 6,  sky:'облачно', icon:'cloud' },
    { day:'tomorrow', label:'Завтра',  date:'14 ноября', temp: 9,  sky:'прояснения', icon:'sun-cloud' }
  ];

  window.OBRAZ_DATA = {
    CAT_META, SLOT_LABEL, OCC_LABEL, MODELS, DEFAULT_PROFILE, WEATHER,
    hexToRgb, hslOf, isNeutral, colorFit, hueDistance, shade, buildItems
  };
})();
