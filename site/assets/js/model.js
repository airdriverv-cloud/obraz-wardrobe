/* ─────────────────────────────────────────────────────────────
   ОБРАЗ · модель и одежда на ней
   Манекен рисуется вектором, вещи — силуэтами в цвете конкретной
   вещи из каталога. Координаты: viewBox 0 0 300 600.
   ───────────────────────────────────────────────────────────── */
(() => {
  'use strict';

  const D = window.OBRAZ_DATA;
  const shade = D.shade;

  let uid = 0;

  function paint(hex, id) {
    return {
      def: `<linearGradient id="${id}" x1="0.1" y1="0" x2="0.55" y2="1">
              <stop offset="0" stop-color="${shade(hex, 0.34)}"/>
              <stop offset="0.45" stop-color="${hex}"/>
              <stop offset="1" stop-color="${shade(hex, -0.22)}"/>
            </linearGradient>`,
      fill: `url(#${id})`,
      line: shade(hex, -0.45)
    };
  }

  /* ── силуэты (300×600) ────────────────────────────────── */
  const G = {

    tshirt(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M118 134 Q150 124 182 134 L192 168 L182 178 L180 300 Q150 310 120 300 L118 178 L108 168 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M118 134 Q132 148 150 149 Q168 148 182 134" fill="none" stroke="${p.line}" stroke-width="1.1" opacity=".6"/>
      <path d="M126 230 Q150 238 174 230" fill="none" stroke="${p.line}" stroke-width=".9" opacity=".28"/>`;
    },

    longsleeve(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M118 134 Q150 124 182 134 L194 166 L186 176 L186 300 Q150 312 114 300 L114 176 L106 166 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M116 150 Q102 210 100 300 L120 304 Q122 214 128 168 Z" fill="${p.fill}" stroke="${p.line}" stroke-width="1.3"/>
      <path d="M184 150 Q198 210 200 300 L180 304 Q178 214 172 168 Z" fill="${p.fill}" stroke="${p.line}" stroke-width="1.3"/>
      <path d="M118 134 Q150 146 182 134" fill="none" stroke="${p.line}" stroke-width="1.1" opacity=".55"/>`;
    },

    shirt(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M118 134 Q150 124 182 134 L192 166 L182 176 L182 310 Q150 320 118 310 L118 176 L108 166 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M116 150 Q104 208 102 300 L120 302 Q122 212 128 166 Z" fill="${p.fill}" stroke="${p.line}" stroke-width="1.2"/>
      <path d="M184 150 Q196 208 198 300 L180 302 Q178 212 172 166 Z" fill="${p.fill}" stroke="${p.line}" stroke-width="1.2"/>
      <path d="M150 150 L150 316" stroke="${p.line}" stroke-width="1" opacity=".5"/>
      <path d="M140 132 L150 152 L160 132 L156 127 L150 136 L144 127 Z" fill="${shade(hex, 0.3)}" stroke="${p.line}" stroke-width=".9"/>
      <circle cx="150" cy="186" r="1.7" fill="${p.line}" opacity=".55"/>
      <circle cx="150" cy="222" r="1.7" fill="${p.line}" opacity=".55"/>
      <circle cx="150" cy="258" r="1.7" fill="${p.line}" opacity=".55"/>`;
    },

    coat(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M118 132 Q150 120 182 132 L192 170 L188 384 Q150 396 112 384 L108 170 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.5"/>
      <path d="M116 150 Q102 210 100 296 Q100 318 106 330 L124 326 Q118 300 118 268 Q120 206 126 168 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.3"/>
      <path d="M184 150 Q198 210 200 296 Q200 318 194 330 L176 326 Q182 300 182 268 Q180 206 174 168 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.3"/>
      <path d="M132 130 Q150 150 168 130 L176 140 Q150 166 124 140 Z"
            fill="${shade(hex, 0.26)}" stroke="${p.line}" stroke-width="1"/>
      <path d="M150 158 L150 390" stroke="${p.line}" stroke-width="1.1" opacity=".4"/>
      <circle cx="158" cy="212" r="2.2" fill="${p.line}" opacity=".45"/>
      <circle cx="158" cy="256" r="2.2" fill="${p.line}" opacity=".45"/>
      <path d="M112 300 L138 300" stroke="${p.line}" stroke-width="1" opacity=".3"/>`;
    },

    pants(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M120 296 Q150 306 180 296 L186 360 L178 548 L152 548 L150 372 L148 548 L122 548 L114 360 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M150 304 L150 360" stroke="${p.line}" stroke-width="1" opacity=".45"/>
      <path d="M122 302 L140 310 M178 302 L160 310" stroke="${p.line}" stroke-width=".9" opacity=".4" fill="none"/>`;
    },

    shorts(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M120 296 Q150 306 180 296 L184 356 L178 404 L152 404 L150 370 L148 404 L122 404 L116 356 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M150 306 L150 370" stroke="${p.line}" stroke-width="1" opacity=".45"/>`;
    },

    skirt(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M126 296 Q150 305 174 296 L204 448 Q150 464 96 448 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.4"/>
      <path d="M150 304 L150 458 M134 300 L120 452 M166 300 L180 452"
            stroke="${p.line}" stroke-width=".9" opacity=".28" fill="none"/>`;
    },

    dress(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M122 132 Q150 122 178 132 L186 176 L196 250 L214 452 Q150 470 86 452 L104 250 L114 176 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.5"/>
      <path d="M122 132 Q136 146 150 147 Q164 146 178 132" fill="none" stroke="${p.line}" stroke-width="1.1" opacity=".55"/>
      <path d="M150 200 L150 260" stroke="${p.line}" stroke-width="1" opacity=".4"/>
      <path d="M112 286 Q150 300 188 286" fill="none" stroke="${p.line}" stroke-width="1" opacity=".3"/>`;
    },

    sneakers(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M122 528 L146 528 L146 552 Q146 560 136 560 L114 560 Q108 560 110 553 L116 534 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.2"/>
      <path d="M154 528 L178 528 L184 534 L188 553 Q189 560 182 560 L162 560 Q154 560 154 552 Z"
            fill="${p.fill}" stroke="${p.line}" stroke-width="1.2"/>
      <path d="M112 554 L146 554 M155 554 L187 554" stroke="${shade(hex, 0.6)}" stroke-width="2.6" opacity=".95"/>`;
    },

    hat(hex) {
      const p = paint(hex, 'g' + uid++);
      return `${p.def}
      <path d="M126 52 Q150 20 174 52 L176 64 Q150 72 124 64 Z" fill="${p.fill}" stroke="${p.line}" stroke-width="1.2"/>
      <path d="M122 62 Q150 72 178 62 L180 72 Q150 82 120 72 Z" fill="${shade(hex, 0.16)}" stroke="${p.line}" stroke-width="1"/>`;
    }
  };

  function garment(item) {
    return (G[item.type] || G.tshirt)(item.hex);
  }

  /* ── манекен ──────────────────────────────────────────── */
  function avatar(model) {
    const female = model.gender === 'w';
    const skin = model.skin;
    const skinD = shade(skin, -0.14);
    const skinL = shade(skin, 0.1);
    const hair = model.hair;

    const sh = female
      ? { l: 112, r: 188, wL: 132, wR: 168, hL: 122, hR: 178 }
      : { l: 106, r: 194, wL: 128, wR: 172, hL: 120, hR: 180 };

    const id = 'sk-' + model.id;

    // волосы: сзади (длинные) и шапка сверху
    const backHair = (model.style === 'long')
      ? `<path d="M118 74 Q114 30 150 30 Q186 30 182 74 L188 190 Q176 196 174 150 L172 96 Q166 84 150 84 Q134 84 128 96 L126 150 Q124 196 112 190 Z" fill="${hair}"/>`
      : (model.style === 'bun')
        ? `<circle cx="150" cy="30" r="14" fill="${hair}"/><path d="M120 76 Q118 34 150 34 Q182 34 180 76 Q176 58 150 58 Q124 58 120 76 Z" fill="${hair}"/>`
        : `<path d="M120 78 Q118 36 150 36 Q182 36 180 78 Q176 58 150 58 Q124 58 120 78 Z" fill="${hair}"/>`;

    const topHair = (model.style === 'crop')
      ? `<path d="M122 74 Q122 42 150 42 Q178 42 178 74 Q174 60 150 60 Q126 60 122 74 Z" fill="${hair}"/>`
      : `<path d="M120 76 Q120 38 150 38 Q180 38 180 76 Q174 60 150 58 Q126 60 120 76 Z" fill="${hair}"/>`;

    return `
    <defs>
      <linearGradient id="${id}" x1="0.15" y1="0" x2="0.7" y2="1">
        <stop offset="0" stop-color="${skinL}"/>
        <stop offset="1" stop-color="${skinD}"/>
      </linearGradient>
    </defs>

    <ellipse cx="150" cy="566" rx="58" ry="9" fill="#16130F" opacity=".09"/>

    <!-- волосы сзади -->
    ${backHair}

    <!-- ноги -->
    <path d="M${sh.hL + 4} 300 Q${133} 420 ${132} 540 L${146} 540 Q${147} 420 ${148} 300 Z" fill="url(#${id})"/>
    <path d="M${sh.hR - 4} 300 Q${167} 420 ${168} 540 L${154} 540 Q${153} 420 ${152} 300 Z" fill="url(#${id})"/>

    <!-- руки -->
    <path d="M${sh.l + 8} 136 Q${sh.l + 2} 230 ${sh.l + 8} 330 L${sh.l + 24} 332 Q${sh.l + 20} 232 ${sh.l + 26} 142 Z" fill="url(#${id})"/>
    <path d="M${sh.r - 8} 136 Q${sh.r - 2} 230 ${sh.r - 8} 330 L${sh.r - 24} 332 Q${sh.r - 20} 232 ${sh.r - 26} 142 Z" fill="url(#${id})"/>
    <ellipse cx="${sh.l + 16}" cy="338" rx="8" ry="11" fill="${skinD}"/>
    <ellipse cx="${sh.r - 16}" cy="338" rx="8" ry="11" fill="${skinD}"/>

    <!-- торс -->
    <path d="M${sh.l + 4} 134 Q150 120 ${sh.r - 4} 134 L${sh.wR} 268 Q${sh.hR} 300 ${sh.hR - 2} 314
             Q150 326 ${sh.hL + 2} 314 Q${sh.hL} 300 ${sh.wL} 268 Z" fill="url(#${id})"/>

    <!-- шея -->
    <rect x="142" y="106" width="16" height="26" rx="7" fill="${skinD}"/>

    <!-- голова -->
    <ellipse cx="150" cy="74" rx="25" ry="29" fill="url(#${id})"/>
    ${topHair}

    <!-- лицо -->
    <ellipse cx="141" cy="76" rx="2.2" ry="2.8" fill="#2B211B" opacity=".8"/>
    <ellipse cx="159" cy="76" rx="2.2" ry="2.8" fill="#2B211B" opacity=".8"/>
    <path d="M136 68 Q141 65 146 67" stroke="#2B211B" stroke-width="1.3" fill="none" opacity=".5" stroke-linecap="round"/>
    <path d="M154 67 Q159 65 164 68" stroke="#2B211B" stroke-width="1.3" fill="none" opacity=".5" stroke-linecap="round"/>
    <path d="M146 92 Q150 94.5 154 92" stroke="${shade(skin, -0.4)}" stroke-width="1.3" fill="none" opacity=".55" stroke-linecap="round"/>
    `;
  }

  function scene(model, outfit) {
    const worn = outfit && outfit.items ? outfit.items : [];
    const at = slot => worn.find(i => i.slot === slot);

    let layers = '';
    if (at('bottom')) layers += garment(at('bottom'));
    if (at('dress')) layers += garment(at('dress'));
    if (at('top')) layers += garment(at('top'));
    if (at('outer')) layers += garment(at('outer'));
    if (at('shoes')) layers += garment(at('shoes'));
    if (at('hat')) layers += garment(at('hat'));

    return `<svg viewBox="0 0 300 600" xmlns="http://www.w3.org/2000/svg" class="model-svg">
      ${avatar(model)}
      <g stroke-linejoin="round" stroke-linecap="round">${layers}</g>
    </svg>`;
  }

  window.OBRAZ_MODEL = { scene, garment, avatar, VB: { w: 300, h: 600 } };
})();
