/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · страница каталога: витрина селлеров, корзина, оформление
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const S = window.OBRAZ_SETS;
  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = UI.fmt;

  const SELLERS = [
    { id:'norda',  name:'NORDA',           city:'Москва',           delivery:['cdek','yandex','ozon'] },
    { id:'vesna',  name:'Vesna Studio',    city:'Санкт-Петербург',  delivery:['cdek','post'] },
    { id:'len',    name:'Лён и лотос',     city:'Кострома',         delivery:['cdek','pek','post'] },
    { id:'sib',    name:'Siberia Wool',    city:'Новосибирск',      delivery:['cdek','pek','yandex'] },
    { id:'mint',   name:'Мята',            city:'Казань',           delivery:['cdek','ozon','post'] },
    { id:'arte',   name:'ARTE',            city:'Екатеринбург',     delivery:['cdek','yandex','pek'] },
    { id:'forma',  name:'FORMA',           city:'Москва',           delivery:['ozon','yandex'] },
    { id:'ostrov', name:'Остров',          city:'Владивосток',      delivery:['cdek','post'] },
    { id:'terra',  name:'Terra',           city:'Краснодар',        delivery:['cdek','pek','ozon'] },
    { id:'lumen',  name:'Lumen Wear',      city:'Москва',           delivery:['cdek','yandex','pek','post'] }
  ];

  const DELIVERY = {
    cdek:   { name:'СДЭК',           base:290, kg:40, days:'2–4 дня' },
    pek:    { name:'ПЭК',            base:260, kg:35, days:'3–6 дней' },
    yandex: { name:'Яндекс Доставка',base:320, kg:45, days:'1–3 дня' },
    ozon:   { name:'Ozon Доставка',  base:250, kg:38, days:'2–4 дня' },
    post:   { name:'Почта России',   base:220, kg:50, days:'4–9 дней' }
  };

  const CITIES = { 'Москва':1, 'Санкт-Петербург':1.05, 'Казань':1.15, 'Екатеринбург':1.2,
                   'Новосибирск':1.3, 'Краснодар':1.12, 'Владивосток':1.55 };

  const PRICE_BASE = { outer:[6900,11900], top:[1900,3900], bottom:[2900,5400],
                       dress:[3900,6900], shoes:[4500,7900], hat:[1200,2500] };

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000003;
    const x = Math.sin(h * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  const SIZE_SET = [42, 44, 46, 48, 50];

  function listing(item, idx) {
    const seller = SELLERS[idx % SELLERS.length];
    const range = PRICE_BASE[item.slot] || [1900, 3900];
    const r = hash(item.id);
    const price = Math.round((range[0] + (range[1] - range[0]) * r) / 100) * 100;
    const sizes = SIZE_SET.filter((s, i) => hash(item.id + i) > 0.35);
    return {
      id: item.id, item, seller, price,
      wbPrice: Math.round(price * 1.19 / 100) * 100,
      sizes: sizes.length ? sizes : [46],
      delivery: seller.delivery
    };
  }

  const listings = S.items.map(listing);

  const state = { bucket:'all', service:'all', sort:'popular', shown:12, cart:[], city:'Москва' };

  function visible() {
    let list = listings.slice();
    if (state.bucket === 'low') list = list.filter(l => l.price < 3000);
    if (state.bucket === 'mid') list = list.filter(l => l.price >= 3000 && l.price <= 6000);
    if (state.bucket === 'high') list = list.filter(l => l.price > 6000);
    if (state.service !== 'all') list = list.filter(l => l.delivery.includes(state.service));
    if (state.sort === 'cheap') list.sort((a, b) => a.price - b.price);
    if (state.sort === 'expensive') list.sort((a, b) => b.price - a.price);
    return list;
  }

  function cardHTML(l) {
    const inCart = state.cart.includes(l.id);
    return `<article class="mcard" data-id="${l.id}">
      <div class="mcard-img">${UI.itemVisual(l.item)}</div>
      <div class="mcard-body">
        <p class="mcard-brand">${l.seller.name}</p>
        <p class="mcard-name">${l.item.short}, ${l.item.color}</p>
        <p class="mcard-sizes">${l.sizes.map(s => `<span>${s}</span>`).join('')}</p>
        <div class="mcard-price"><b>${fmt(l.price)}</b><s>${fmt(l.wbPrice)}</s></div>
        <div class="mcard-svc">${l.delivery.map(d => `<span class="svc">${DELIVERY[d].name}</span>`).join('')}</div>
        <div class="mcard-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-cart="${l.id}">${inCart ? 'В образе ✓' : 'В образ'}</button>
          <button class="btn btn-ink btn-sm" type="button" data-buy="${l.id}">Купить</button>
        </div>
      </div>
    </article>`;
  }

  function renderGrid() {
    const list = visible();
    const shown = list.slice(0, state.shown);
    $('#marketGrid').innerHTML = shown.map(cardHTML).join('');
    $('#marketCount').textContent = shown.length + ' из ' + listings.length;
    const rest = list.length - shown.length;
    $('#marketMore').innerHTML = rest > 0
      ? `<button class="btn btn-ghost btn-sm" type="button" id="moreBtn">Показать ещё ${Math.min(12, rest)}</button>`
      : '';
  }

  function cartItems() { return listings.filter(l => state.cart.includes(l.id)); }

  function deliveryCost(items) {
    const w = Math.max(0.5, items.length * 0.4);
    let best = Infinity;
    items.forEach(l => l.delivery.forEach(d => {
      const c = (DELIVERY[d].base + DELIVERY[d].kg * w) * (CITIES[state.city] || 1);
      if (c < best) best = c;
    }));
    return Math.round((best === Infinity ? 350 : best) / 10) * 10;
  }

  function renderCart() {
    const items = cartItems();
    const box = $('#cartBox');
    if (!items.length) {
      box.innerHTML = '<p class="tiny">Отметьте вещи кнопкой «В образ» — здесь появятся сумма и доставка.</p>';
      return;
    }
    const sum = items.reduce((n, l) => n + l.price, 0);
    const ship = deliveryCost(items);
    box.innerHTML = `
      <div class="cart-list">${items.map(l => `
        <div class="cart-row">
          <span class="cart-dot" style="background:${l.item.hex}"></span>
          <span class="cart-name">${l.item.short}, ${l.item.color}<small>${l.seller.name}</small></span>
          <b>${fmt(l.price)}</b>
          <button class="cart-x" type="button" data-uncart="${l.id}" aria-label="Убрать">×</button>
        </div>`).join('')}</div>
      <div class="cart-total"><span>Вещи</span><b>${fmt(sum)}</b></div>
      <div class="cart-total"><span>Доставка (${state.city})</span><b>${fmt(ship)}</b></div>
      <div class="cart-total is-sum"><span>Итого</span><b>${fmt(sum + ship)}</b></div>
      <div class="cart-actions">
        <button class="btn btn-accent btn-sm" type="button" id="cartTry">Примерить образ</button>
        <button class="btn btn-ghost btn-sm" type="button" id="cartClear">Очистить</button>
      </div>`;
  }

  function openCheckout(l) {
    $('#checkoutTitle').textContent = l.item.short + ', ' + l.item.color;
    $('#checkoutMeta').textContent = l.seller.name + ' · ' + fmt(l.price);
    $('#checkoutService').innerHTML = l.delivery
      .map(d => `<option value="${d}">${DELIVERY[d].name} · ${DELIVERY[d].days}</option>`).join('');
    $('#checkoutModal').hidden = false;
  }

  function init() {
    if (!$('#marketGrid')) return;

    $('#marketFilters').addEventListener('click', e => {
      const chip = e.target.closest('[data-bucket]');
      if (!chip) return;
      $$('[data-bucket]').forEach(c => c.classList.toggle('is-on', c === chip));
      state.bucket = chip.dataset.bucket;
      state.shown = 12;
      renderGrid();
    });

    $('#marketService').addEventListener('change', e => { state.service = e.target.value; state.shown = 12; renderGrid(); });
    $('#marketSort').addEventListener('change', e => { state.sort = e.target.value; state.shown = 12; renderGrid(); });
    $('#marketMore').addEventListener('click', e => {
      if (e.target.closest('#moreBtn')) { state.shown += 12; renderGrid(); }
    });

    $('#marketGrid').addEventListener('click', e => {
      const cartBtn = e.target.closest('[data-cart]');
      if (cartBtn) {
        const id = cartBtn.dataset.cart;
        state.cart = state.cart.includes(id) ? state.cart.filter(x => x !== id) : state.cart.concat(id);
        renderGrid(); renderCart();
        return;
      }
      const buy = e.target.closest('[data-buy]');
      if (buy) {
        const l = listings.find(x => x.id === buy.dataset.buy);
        if (l) openCheckout(l);
      }
    });

    $('#cartBox').addEventListener('click', e => {
      const un = e.target.closest('[data-uncart]');
      if (un) {
        state.cart = state.cart.filter(x => x !== un.dataset.uncart);
        renderGrid(); renderCart();
        return;
      }
      if (e.target.id === 'cartTry') {
        const items = cartItems().map(l => l.item);
        if (!items.length) return;
        try { sessionStorage.setItem('obraz-look', JSON.stringify(items.map(i => i.id))); } catch (err) { /* noop */ }
        window.location.href = 'fitting.html';
      }
      if (e.target.id === 'cartClear') { state.cart = []; renderGrid(); renderCart(); }
    });

    $('#deliveryCity').addEventListener('change', e => { state.city = e.target.value; renderCart(); });

    $$('[data-close-checkout]').forEach(b => b.addEventListener('click', () => { $('#checkoutModal').hidden = true; }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') $('#checkoutModal').hidden = true; });

    $('#checkoutForm').addEventListener('submit', e => {
      e.preventDefault();
      const service = $('#checkoutService').value;
      const city = $('#checkoutCity').value;
      const name = $('#checkoutName').value;
      $('#checkoutModal').hidden = true;
      const box = $('#checkoutResult');
      box.hidden = false;
      box.innerHTML = `<b>Заказ ${Math.floor(Math.random() * 900000 + 100000)} создан</b>
        <p>${name}, ${city}. Доставка: ${DELIVERY[service].name}, ${DELIVERY[service].days}. Селлер получит уведомление и отнесёт посылку в ПВЗ.</p>
        <p class="tiny">Демо: оплата не проводится, заказ никуда не уходит.</p>`;
      box.scrollIntoView({ behavior:'smooth', block:'center' });
    });

    $('#deliveryCity').innerHTML = Object.keys(CITIES)
      .map(c => `<option>${c}</option>`).join('');

    renderGrid();
    renderCart();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
