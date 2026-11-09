/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · маркетплейс: витрина селлеров, кабинет, доставка
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const S = window.OBRAZ_SETS;
  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));

  /* ── селлеры ──────────────────────────────────────────── */
  const SELLERS = [
    { id:'norda',   name:'NORDA',          city:'Москва',       rating:4.9, since:2021, delivery:['cdek','yandex','ozon'] },
    { id:'vesna',   name:'Vesna Studio',   city:'Санкт-Петербург', rating:4.8, since:2022, delivery:['cdek','post'] },
    { id:'len',     name:'Лён и лотос',    city:'Кострома',     rating:4.7, since:2020, delivery:['cdek','pek','post'] },
    { id:'sib',     name:'Siberia Wool',   city:'Новосибирск',  rating:4.9, since:2019, delivery:['cdek','pek','yandex'] },
    { id:'mint',    name:'Мята',           city:'Казань',       rating:4.6, since:2023, delivery:['cdek','ozon','post'] },
    { id:'arte',    name:'ARTE',           city:'Екатеринбург', rating:4.8, since:2021, delivery:['cdek','yandex','pek'] },
    { id:'forma',   name:'FORMA',          city:'Москва',       rating:4.7, since:2022, delivery:['ozon','yandex'] },
    { id:'ostrov',  name:'Остров',         city:'Владивосток',  rating:4.5, since:2023, delivery:['cdek','post'] },
    { id:'terra',   name:'Terra',          city:'Краснодар',    rating:4.7, since:2020, delivery:['cdek','pek','ozon'] },
    { id:'lumen',   name:'Lumen Wear',     city:'Москва',       rating:4.9, since:2018, delivery:['cdek','yandex','pek','post'] }
  ];

  const DELIVERY = {
    cdek:   { name:'СДЭК',           base:290, kg:40, days:'2–4 дня',  point:'ПВЗ или курьер' },
    pek:    { name:'ПЭК',            base:260, kg:35, days:'3–6 дней', point:'терминал / курьер' },
    yandex: { name:'Яндекс Доставка',base:320, kg:45, days:'1–3 дня',  point:'ПВЗ или курьер' },
    ozon:   { name:'Ozon Доставка',  base:250, kg:38, days:'2–4 дня',  point:'постамат / ПВЗ' },
    post:   { name:'Почта России',   base:220, kg:50, days:'4–9 дней', point:'отделение' }
  };

  const CITIES = {
    'Москва':1, 'Санкт-Петербург':1.05, 'Казань':1.15,
    'Екатеринбург':1.2, 'Новосибирск':1.3, 'Краснодар':1.12, 'Владивосток':1.55
  };

  const PRICE_BASE = {
    outer: [6900, 11900], top: [1900, 3900], bottom: [2900, 5400],
    dress: [3900, 6900], shoes: [4500, 7900], hat: [1200, 2500]
  };

  function hash(str) {
    let h = 0;
    for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 1000003;
    const x = Math.sin(h * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  }

  const SIZE_SET = [42, 44, 46, 48, 50];

  function buildListing(item, idx) {
    const seller = SELLERS[idx % SELLERS.length];
    const range = PRICE_BASE[item.slot] || [1900, 3900];
    const r = hash(item.id);
    const price = Math.round((range[0] + (range[1] - range[0]) * r) / 100) * 100;
    const sizes = SIZE_SET.filter((s, i) => hash(item.id + i) > 0.35);
    return {
      id: item.id,
      item,
      seller,
      price,
      wbPrice: Math.round(price * 1.19 / 100) * 100,
      sizes: sizes.length ? sizes : [46],
      delivery: seller.delivery,
      rating: +(seller.rating - hash(item.id + 'r') * 0.2).toFixed(1),
      reviews: 4 + Math.floor(hash(item.id + 'c') * 90)
    };
  }

  const listings = S.items.map(buildListing);
  const custom = [];

  function allListings() { return custom.concat(listings); }

  /* ── состояние ────────────────────────────────────────── */
  const state = {
    bucket: 'all',
    service: 'all',
    sort: 'popular',
    shown: 12,
    cart: [],
    city: 'Москва',
    weight: 1
  };

  const fmt = n => n.toLocaleString('ru-RU').replace(/\u00A0/g, ' ') + ' ₽';

  /* ── витрина ──────────────────────────────────────────── */
  function visible() {
    let list = allListings();
    if (state.bucket === 'low') list = list.filter(l => l.price < 3000);
    if (state.bucket === 'mid') list = list.filter(l => l.price >= 3000 && l.price <= 6000);
    if (state.bucket === 'high') list = list.filter(l => l.price > 6000);
    if (state.service !== 'all') list = list.filter(l => l.delivery.includes(state.service));
    if (state.sort === 'cheap') list = list.slice().sort((a, b) => a.price - b.price);
    if (state.sort === 'expensive') list = list.slice().sort((a, b) => b.price - a.price);
    return list;
  }

  function cardHTML(l) {
    const inCart = state.cart.includes(l.id);
    const services = l.delivery.map(d => `<span class="svc">${DELIVERY[d].name}</span>`).join('');
    return `<article class="mcard${l.custom ? ' is-new' : ''}" data-id="${l.id}">
      <div class="mcard-img">${UI.itemVisual(l.item)}</div>
      <div class="mcard-body">
        <p class="mcard-brand">${l.seller.name}${l.custom ? ' <span class="badge-new">новое</span>' : ''}</p>
        <p class="mcard-name">${l.item.short}, ${l.item.color}</p>
        <p class="mcard-sizes">${l.sizes.map(s => `<span>${s}</span>`).join('')}</p>
        <div class="mcard-price">
          <b>${fmt(l.price)}</b>
          <s title="цена на маркетплейсе с комиссией">${fmt(l.wbPrice)}</s>
        </div>
        <div class="mcard-svc">${services}</div>
        <div class="mcard-actions">
          <button class="btn btn-ghost btn-sm" type="button" data-cart="${l.id}">${inCart ? 'В образе ✓' : 'В образ'}</button>
          <button class="btn btn-ink btn-sm" type="button" data-buy="${l.id}">Купить</button>
        </div>
      </div>
    </article>`;
  }

  function renderMarket() {
    const list = visible();
    const shown = list.slice(0, state.shown);
    $('#marketGrid').innerHTML = shown.map(cardHTML).join('');
    $('#marketCount').textContent = shown.length + ' из ' + allListings().length;
    const rest = list.length - shown.length;
    $('#marketMore').innerHTML = rest > 0
      ? `<button class="btn btn-ghost btn-sm" type="button" id="moreBtn">Показать ещё ${Math.min(12, rest)} из ${rest}</button>`
      : '';
  }

  /* ── корзина образа ───────────────────────────────────── */
  function cartItems() {
    return allListings().filter(l => state.cart.includes(l.id));
  }

  function renderCart() {
    const items = cartItems();
    const box = $('#cartBox');
    if (!items.length) {
      box.innerHTML = '<p class="tiny">Соберите образ из вещей на витрине — здесь появится сумма и доставка.</p>';
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
        </div>`).join('')}
      </div>
      <div class="cart-total"><span>Вещи</span><b>${fmt(sum)}</b></div>
      <div class="cart-total"><span>Доставка (${state.city})</span><b>${fmt(ship)}</b></div>
      <div class="cart-total is-sum"><span>Итого</span><b>${fmt(sum + ship)}</b></div>
      <div class="cart-actions">
        <button class="btn btn-accent btn-sm" type="button" id="cartTry">Примерить образ</button>
        <button class="btn btn-ghost btn-sm" type="button" id="cartClear">Очистить</button>
      </div>`;
  }

  function deliveryCost(items) {
    const w = Math.max(0.5, items.length * 0.4);
    let best = Infinity;
    items.forEach(l => l.delivery.forEach(d => {
      const cost = (DELIVERY[d].base + DELIVERY[d].kg * w) * (CITIES[state.city] || 1);
      if (cost < best) best = cost;
    }));
    return Math.round((best === Infinity ? 350 : best) / 10) * 10;
  }

  /* ── калькулятор доставки ─────────────────────────────── */
  function renderDelivery() {
    const w = state.weight;
    const k = CITIES[state.city] || 1;
    const rows = Object.entries(DELIVERY).map(([id, d]) => {
      const cost = Math.round((d.base + d.kg * w) * k / 10) * 10;
      return `<tr>
        <td><b>${d.name}</b><small>${d.point}</small></td>
        <td>${d.days}</td>
        <td class="num">${fmt(cost)}</td>
      </tr>`;
    }).join('');

    $('#deliveryTable').innerHTML = `<table class="dtable">
      <thead><tr><th>Служба</th><th>Срок</th><th class="num">Стоимость</th></tr></thead>
      <tbody>${rows}</tbody></table>
      <p class="tiny">Расчёт для веса ${w.toFixed(1)} кг, ${state.city}. Селлер относит посылку в ПВЗ сам — это и есть экономия на складе и персонале.</p>`;
  }

  /* ── кабинет селлера ──────────────────────────────────── */
  function initSellerForm() {
    const price = $('#spPrice');
    const calc = () => {
      const p = +price.value || 0;
      const fee = Math.round(p * 0.06);
      const wb = Math.round(p * 1.19);
      $('#spCalc').innerHTML = p
        ? `<div class="calc-row"><span>Цена на витрине</span><b>${fmt(p)}</b></div>
           <div class="calc-row"><span>Комиссия 6%</span><b>−${fmt(fee)}</b></div>
           <div class="calc-row"><span>Вам останется</span><b>${fmt(p - fee)}</b></div>
           <div class="calc-row muted"><span>На WB та же вещь</span><b>≈ ${fmt(wb)}</b></div>`
        : '';
    };
    price.addEventListener('input', calc);
    setTimeout(calc, 0);

    $('#sellerForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#spName').value.trim();
      const brand = $('#spBrand').value.trim() || 'Ваш бренд';
      const city = $('#spCity').value;
      const p = +price.value || 0;
      const slot = $('#spSlot').value;
      const file = $('#spPhoto').files[0];
      const services = $$('.sp-service:checked').map(c => c.value);
      if (!name || !p) return;

      const seller = { id:'you', name: brand, city, rating: 5, since: 2026, delivery: services.length ? services : ['cdek'] };
      const base = S.items.find(i => i.slot === slot) || S.items[0];

      const push = photo => {
        const item = { ...base, id: 'my-' + Date.now(), short: base.short, name, color: base.color, hex: base.hex, photo };
        const listing = {
          id: item.id, item, seller,
          price: p,
          wbPrice: Math.round(p * 1.19 / 100) * 100,
          sizes: [42,44,46,48,50],
          delivery: seller.delivery,
          rating: 5, reviews: 0, custom: true
        };
        custom.unshift(listing);
        state.cart.push(listing.id);
        renderMarket(); renderCart();
        $('#sellerResult').hidden = false;
        $('#sellerResult').innerHTML = `<b>Карточка опубликована</b>
          <p>${name} · ${fmt(p)} · ${seller.delivery.map(d => DELIVERY[d].name).join(', ')}</p>
          <p class="tiny">Она уже на витрине (бейдж «новое») и добавлена в образ. Фото и данные остаются в браузере.</p>`;
        e.target.reset();
        calc();
        document.getElementById('market').scrollIntoView({ behavior:'smooth' });
      };

      if (file) {
        const fr = new FileReader();
        fr.onload = ev => push(ev.target.result);
        fr.readAsDataURL(file);
      } else {
        push(null);
      }
    });
  }

  /* ── события витрины ──────────────────────────────────── */
  function initEvents() {
    $('#marketFilters').addEventListener('click', e => {
      const chip = e.target.closest('[data-bucket]');
      if (!chip) return;
      $$('[data-bucket]').forEach(c => c.classList.toggle('is-on', c === chip));
      state.bucket = chip.dataset.bucket;
      state.shown = 12;
      renderMarket();
    });

    $('#marketService').addEventListener('change', e => { state.service = e.target.value; state.shown = 12; renderMarket(); });
    $('#marketSort').addEventListener('change', e => { state.sort = e.target.value; state.shown = 12; renderMarket(); });
    $('#marketMore').addEventListener('click', e => {
      if (e.target.closest('#moreBtn')) { state.shown += 12; renderMarket(); }
    });

    $('#marketGrid').addEventListener('click', e => {
      const cartBtn = e.target.closest('[data-cart]');
      if (cartBtn) {
        const id = cartBtn.dataset.cart;
        state.cart = state.cart.includes(id) ? state.cart.filter(x => x !== id) : state.cart.concat(id);
        renderMarket(); renderCart();
        return;
      }
      const buy = e.target.closest('[data-buy]');
      if (buy) {
        const l = allListings().find(x => x.id === buy.dataset.buy);
        if (l) openCheckout(l);
      }
    });

    $('#cartBox').addEventListener('click', e => {
      const un = e.target.closest('[data-uncart]');
      if (un) {
        state.cart = state.cart.filter(x => x !== un.dataset.uncart);
        renderMarket(); renderCart();
        return;
      }
      if (e.target.id === 'cartTry') {
        const items = cartItems().map(l => l.item);
        if (items.length) UI.setOutfit(items, 'Образ с витрины');
        return;
      }
      if (e.target.id === 'cartClear') {
        state.cart = [];
        renderMarket(); renderCart();
      }
    });

    $('#deliveryCity').addEventListener('change', e => { state.city = e.target.value; renderDelivery(); renderCart(); });
    $('#deliveryWeight').addEventListener('input', e => {
      state.weight = +e.target.value / 10;
      $('#deliveryWeightOut').textContent = state.weight.toFixed(1) + ' кг';
      renderDelivery();
    });

    // модалка оформления
    const modal = $('#checkoutModal');
    $$('[data-close-checkout]').forEach(b => b.addEventListener('click', () => { modal.hidden = true; }));
    document.addEventListener('keydown', e => { if (e.key === 'Escape') modal.hidden = true; });
    $('#checkoutForm').addEventListener('submit', e => {
      e.preventDefault();
      const service = $('#checkoutService').value;
      const city = $('#checkoutCity').value;
      const name = $('#checkoutName').value;
      const phone = $('#checkoutPhone').value;
      modal.hidden = true;
      $('#checkoutResult').hidden = false;
      $('#checkoutResult').innerHTML = `<b>Заказ ${Math.floor(Math.random()*900000+100000)} создан</b>
        <p>${name}, ${city}. Доставка: ${DELIVERY[service].name}, ${DELIVERY[service].days}. Телефон ${phone}.</p>
        <p class="tiny">Демо: заказ никуда не уходит. В реальности селлер получает уведомление, печатает накладную и относит посылку в ПВЗ ${DELIVERY[service].name}.</p>`;
      setTimeout(() => document.getElementById('checkoutResult').scrollIntoView({ behavior:'smooth', block:'center' }), 80);
    });
  }

  function openCheckout(listing) {
    $('#checkoutTitle').textContent = listing.item.short + ', ' + listing.item.color;
    $('#checkoutMeta').textContent = listing.seller.name + ' · ' + fmt(listing.price);
    $('#checkoutService').innerHTML = listing.delivery
      .map(d => `<option value="${d}">${DELIVERY[d].name} · ${DELIVERY[d].days}</option>`).join('');
    const modal = $('#checkoutModal');
    modal.hidden = false;
  }

  function init() {
    if (!$('#marketGrid')) return;
    renderMarket();
    renderCart();
    renderDelivery();
    initSellerForm();
    initEvents();

    $('#deliveryCity').innerHTML = Object.keys(CITIES)
      .map(c => `<option${c === state.city ? ' selected' : ''}>${c}</option>`).join('');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
