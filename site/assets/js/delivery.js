/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · страница доставки: калькулятор и условия
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const UI = window.OBRAZ_UI;
  const $ = (s, r = document) => r.querySelector(s);
  const fmt = UI.fmt;

  const SERVICES = {
    cdek:   { name:'СДЭК',            base:290, kg:40, days:'2–4 дня',  point:'ПВЗ или курьер' },
    pek:    { name:'ПЭК',             base:260, kg:35, days:'3–6 дней', point:'терминал / курьер' },
    yandex: { name:'Яндекс Доставка', base:320, kg:45, days:'1–3 дня',  point:'ПВЗ или курьер' },
    ozon:   { name:'Ozon Доставка',   base:250, kg:38, days:'2–4 дня',  point:'постамат / ПВЗ' },
    post:   { name:'Почта России',    base:220, kg:50, days:'4–9 дней', point:'отделение' }
  };

  const CITIES = { 'Москва':1, 'Санкт-Петербург':1.05, 'Казань':1.15, 'Екатеринбург':1.2,
                   'Новосибирск':1.3, 'Краснодар':1.12, 'Владивосток':1.55 };

  let city = 'Москва';
  let weight = 1;

  function render() {
    const k = CITIES[city] || 1;
    $('#deliveryTable').innerHTML = `<table class="dtable">
      <thead><tr><th>Служба</th><th>Срок</th><th class="num">Стоимость</th></tr></thead>
      <tbody>${Object.values(SERVICES).map(d => `
        <tr>
          <td><b>${d.name}</b><small>${d.point}</small></td>
          <td>${d.days}</td>
          <td class="num">${fmt(Math.round((d.base + d.kg * weight) * k / 10) * 10)}</td>
        </tr>`).join('')}</tbody>
    </table>
    <p class="tiny">Расчёт для веса ${weight.toFixed(1)} кг, ${city}. Селлер относит посылку в ПВЗ сам — это и есть экономия на складе и персонале.</p>`;
  }

  function init() {
    if (!$('#deliveryTable')) return;

    $('#deliveryCity').innerHTML = Object.keys(CITIES)
      .map(c => `<option>${c}</option>`).join('');

    $('#deliveryCity').addEventListener('change', e => { city = e.target.value; render(); });
    $('#deliveryWeight').addEventListener('input', e => {
      weight = +e.target.value / 10;
      $('#deliveryWeightOut').textContent = weight.toFixed(1) + ' кг';
      render();
    });

    render();
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
