/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · страница селлера: карточка товара и расчёт комиссии
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const S = window.OBRAZ_SETS;
  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const fmt = UI.fmt;

  const DELIVERY_NAME = {
    cdek:'СДЭК', pek:'ПЭК', yandex:'Яндекс Доставка', ozon:'Ozon Доставка', post:'Почта России'
  };

  const published = [];

  function calc() {
    const p = +$('#spPrice').value || 0;
    $('#spCalc').innerHTML = p ? `
      <div class="calc-row"><span>Цена на витрине</span><b>${fmt(p)}</b></div>
      <div class="calc-row"><span>Комиссия 6%</span><b>−${fmt(Math.round(p * 0.06))}</b></div>
      <div class="calc-row"><span>Вам останется</span><b>${fmt(Math.round(p * 0.94))}</b></div>
      <div class="calc-row muted"><span>На WB та же вещь</span><b>≈ ${fmt(Math.round(p * 1.19))}</b></div>` : '';
  }

  function renderPreview() {
    const box = $('#sellerPreview');
    if (!published.length) { box.innerHTML = '<p class="tiny">Здесь появятся ваши карточки.</p>'; return; }
    box.innerHTML = published.map((l, i) => `
      <div class="preview-row">
        <span class="cart-dot" style="background:${l.item.hex}"></span>
        <span class="cart-name">${l.item.short}<small>${l.seller.name}</small></span>
        <b>${fmt(l.price)}</b>
        <span class="preview-svc">${l.delivery.map(d => DELIVERY_NAME[d]).join(', ')}</span>
        <button class="cart-x" type="button" data-remove="${i}" aria-label="Удалить">×</button>
      </div>`).join('');
  }

  function init() {
    if (!$('#sellerForm')) return;

    const price = $('#spPrice');
    price.addEventListener('input', calc);
    calc();

    $('#sellerPreview').addEventListener('click', e => {
      const b = e.target.closest('[data-remove]');
      if (!b) return;
      published.splice(+b.dataset.remove, 1);
      renderPreview();
    });

    $('#sellerForm').addEventListener('submit', e => {
      e.preventDefault();
      const name = $('#spName').value.trim();
      const brand = $('#spBrand').value.trim() || 'Ваш бренд';
      const city = $('#spCity').value;
      const slot = $('#spSlot').value;
      const p = +price.value || 0;
      const services = $$('.sp-service:checked').map(c => c.value);
      const file = $('#spPhoto').files[0];
      if (!name || !p) return;

      const base = S.items.find(i => i.slot === slot) || S.items[0];
      const item = { ...base, id: 'my-' + Date.now(), short: name, name, color: base.color, hex: base.hex };

      const push = photo => {
        if (photo) item.src = photo;
        published.unshift({
          item,
          seller: { name: brand, city },
          price: p,
          delivery: services.length ? services : ['cdek']
        });
        renderPreview();
        const box = $('#sellerResult');
        box.hidden = false;
        box.innerHTML = `<b>Карточка опубликована</b>
          <p>${name} · ${fmt(p)} · ${(services.length ? services : ['cdek']).map(d => DELIVERY_NAME[d]).join(', ')}</p>
          <p class="tiny">В демо карточка живёт в этой вкладке. В продукте она уходит на модерацию и в каталог.</p>`;
        e.target.reset();
        price.value = 4900;
        calc();
      };

      if (file) {
        const fr = new FileReader();
        fr.onload = ev => push(ev.target.result);
        fr.readAsDataURL(file);
      } else {
        push(null);
      }
    });

    renderPreview();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
