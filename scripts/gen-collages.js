// Generate "collage" style images: multiple math elements per image, 1:1 transparent PNG.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'img');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SIZE = 512;
const PALETTES = [
  ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#A66CFF'],
  ['#FF9F1C', '#FFBF69', '#2EC4B6', '#E71D36', '#7678ED'],
  ['#F38BA0', '#F9C74F', '#90BE6D', '#577590', '#F94144'],
  ['#FF87B2', '#FFCB77', '#17C3B2', '#227C9D', '#FE6D73'],
  ['#FFADAD', '#FFD6A5', '#CAFFBF', '#9BF6FF', '#BDB2FF'],
  ['#BDB2FF', '#FFC6FF', '#A0C4FF', '#FDFFB6', '#FFB5A7'],
];
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function paletteFor(seed) { return PALETTES[hash(seed) % PALETTES.length]; }
function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }
function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

function svgWrap(inner, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>${xmlEscape(title)}</title>
  ${inner}
</svg>`;
}

// Background bubbles, sparkles
function bubbles(seed, n = 8, opacity = 0.16) {
  const p = paletteFor(seed + ':bg');
  const h = hash(seed + ':bub');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 20 + ((h >> (i * 3)) % 472);
    const cy = 20 + ((h >> (i * 3 + 2)) % 472);
    const r = 22 + ((h >> (i * 2)) % 70);
    out.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${pick(p, i)}" opacity="${opacity}"/>`);
  }
  return out.join('\n  ');
}
function stars(seed, n = 8) {
  const h = hash(seed + ':star');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 20 + ((h >> (i * 4)) % 472);
    const cy = 20 + ((h >> (i * 4 + 2)) % 472);
    const s = 5 + ((h >> i) % 9);
    const rot = (h >> (i * 5)) % 360;
    out.push(`<g transform="translate(${cx} ${cy}) rotate(${rot})">
      <path d="M0 -${s} L${s * 0.3} -${s * 0.3} L${s} 0 L${s * 0.3} ${s * 0.3} L0 ${s} L-${s * 0.3} ${s * 0.3} L-${s} 0 L-${s * 0.3} -${s * 0.3} Z"
        fill="#FFD93D" stroke="#3b3b6b" stroke-width="1.5" opacity="0.9"/>
    </g>`);
  }
  return out.join('\n  ');
}

// A single floating "chip": rounded square with a glyph centered.
function chip(cx, cy, size, fill, glyph, fontSize, rot = 0) {
  const half = size / 2;
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <rect x="${-half}" y="${-half}" width="${size}" height="${size}" rx="${size * 0.22}" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="0" y="${fontSize * 0.36}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}
// A circular floating "bubble" chip.
function bubbleChip(cx, cy, r, fill, glyph, fontSize) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="0" y="${fontSize * 0.36}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}

// ---------- Specific collages ----------

// 1) "Math Wonderland" — π, ∞, Σ, √, e, plus operators around them
function mathWonderland() {
  const seed = 'wonderland';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed, 10)}
    ${bubbleChip(140, 130, 70, p[0], 'π', 90)}
    ${bubbleChip(380, 140, 78, p[3], '∞', 100)}
    ${bubbleChip(120, 360, 72, p[2], '√', 90)}
    ${bubbleChip(380, 380, 70, p[4], 'e', 90)}
    ${chip(256, 256, 150, p[1], 'Σ', 130, -6)}
    ${chip(256, 96, 70, p[2], '+', 70, 10)}
    ${chip(96, 256, 70, p[3], '×', 70, -10)}
    ${chip(416, 256, 70, p[0], '÷', 70, 10)}
    ${chip(256, 416, 70, p[4], '−', 70, -10)}
    ${stars(seed, 10)}`,
    'Math Wonderland'
  );
}

// 2) Operator parade — every operator on one canvas, in a tilted grid
function operatorParade() {
  const seed = 'op-parade';
  const p = paletteFor(seed);
  const ops = ['+', '−', '×', '÷', '=', '≠', '&lt;', '&gt;', '≤', '≥', '±', '%'];
  const out = [];
  for (let i = 0; i < ops.length; i++) {
    const r = Math.floor(i / 4), c = i % 4;
    const cx = 100 + c * 104;
    const cy = 140 + r * 120;
    const rot = ((i * 7) % 16) - 8;
    // ops already contains escaped entity — use raw text node
    const glyph = ops[i];
    out.push(`<g transform="translate(${cx} ${cy}) rotate(${rot})">
      <rect x="-46" y="-46" width="92" height="92" rx="22" fill="${pick(p, i)}" stroke="#3b3b6b" stroke-width="5"/>
      <text x="0" y="28" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="78" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${glyph}</text>
    </g>`);
  }
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="46" fill="${p[0]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">运算符号大集合</text>
    ${out.join('\n  ')}
    ${stars(seed, 8)}`,
    'Operator Parade'
  );
}

// 3) Digit garden — 0..9 with cute borders + small operators between
function digitGarden() {
  const seed = 'digits';
  const p = paletteFor(seed);
  const out = [];
  for (let n = 0; n <= 9; n++) {
    const r = Math.floor(n / 4), c = n % 4;
    const cx = 100 + c * 104;
    const cy = 160 + r * 112;
    const rot = ((n * 13) % 16) - 8;
    out.push(chip(cx, cy, 90, pick(p, n), String(n), 76, rot));
  }
  return svgWrap(
    `${bubbles(seed, 12)}
    <text x="256" y="70" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">数字花园 0–9</text>
    ${out.join('\n  ')}
    ${bubbleChip(440, 280, 36, p[0], 'π', 44)}
    ${bubbleChip(440, 360, 36, p[2], '∞', 50)}
    ${bubbleChip(440, 440, 36, p[3], '√', 44)}
    ${stars(seed, 8)}`,
    'Digit Garden'
  );
}

// 4) Equation street — three equations stacked, each in a colored "ticket"
function equationStreet() {
  const seed = 'eq-street';
  const p = paletteFor(seed);
  const tickets = [
    { y: 140, fill: p[0], text: '2 + 3 = 5' },
    { y: 256, fill: p[2], text: '7 × 8 = 56' },
    { y: 372, fill: p[3], text: '12 ÷ 4 = 3' },
  ];
  const out = tickets.map(t => `
    <g transform="translate(256 ${t.y})">
      <rect x="-200" y="-50" width="400" height="100" rx="50" fill="${t.fill}" stroke="#3b3b6b" stroke-width="6"/>
      <circle cx="-200" cy="0" r="14" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <circle cx="200" cy="0" r="14" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <text x="0" y="22" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="64" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(t.text)}</text>
    </g>`).join('\n');
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="70" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="${p[1]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">算式小票</text>
    ${out}
    <text x="256" y="470" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="36" fill="${p[4] || p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">数学真好玩 ✨</text>
    ${stars(seed, 6)}`,
    'Equation Street'
  );
}

// 5) Shape party — many shapes overlapping
function shapeParty() {
  const seed = 'shape-party';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="${p[0]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">图形派对</text>
    <circle cx="140" cy="180" r="80" fill="${p[0]}" stroke="#3b3b6b" stroke-width="6"/>
    <rect x="220" y="120" width="160" height="120" rx="14" fill="${p[1]}" stroke="#3b3b6b" stroke-width="6"/>
    <polygon points="380,240 470,400 290,400" fill="${p[2]}" stroke="#3b3b6b" stroke-width="6"/>
    <polygon points="120,300 210,260 250,360 160,400" fill="${p[3]}" stroke="#3b3b6b" stroke-width="6"/>
    <polygon points="80,440 170,440 200,400 50,400" fill="${p[4] || p[0]}" stroke="#3b3b6b" stroke-width="6"/>
    <polygon points="256,260 290,330 366,340 310,395 326,470 256,432 186,470 202,395 146,340 222,330" fill="${p[1]}" stroke="#3b3b6b" stroke-width="6"/>
    ${stars(seed, 8)}`,
    'Shape Party'
  );
}

// 6) Constants & symbols mashup
function constantsMashup() {
  const seed = 'constants';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed, 12)}
    <text x="256" y="64" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">奇妙符号</text>
    ${bubbleChip(150, 180, 80, p[0], 'π', 100)}
    ${bubbleChip(360, 180, 80, p[1], '∞', 110)}
    ${bubbleChip(150, 360, 80, p[2], 'Φ', 100)}
    ${bubbleChip(360, 360, 80, p[3], 'θ', 100)}
    ${chip(256, 270, 90, p[4] || p[0], '√', 86, -6)}
    ${chip(80, 270, 56, p[1], '∑', 56, 10)}
    ${chip(432, 270, 56, p[2], '∫', 56, -10)}
    ${stars(seed, 8)}`,
    'Constants Mashup'
  );
}

// 7) Counting fiesta — different objects + numbers on one canvas
function countingFiesta() {
  const seed = 'fiesta';
  const p = paletteFor(seed);
  const rows = [
    { y: 150, emoji: '🍎', n: 3 },
    { y: 250, emoji: '🐠', n: 5 },
    { y: 350, emoji: '🌟', n: 7 },
    { y: 440, emoji: '🎈', n: 4 },
  ];
  const out = rows.map((r, i) => {
    const items = [];
    for (let k = 0; k < r.n; k++) {
      items.push(`<text x="${130 + k * 60}" y="${r.y + 14}" font-size="56" dominant-baseline="middle" text-anchor="middle">${r.emoji}</text>`);
    }
    return `<g>
      <rect x="40" y="${r.y - 36}" width="60" height="72" rx="14" fill="${pick(p, i)}" stroke="#3b3b6b" stroke-width="5"/>
      <text x="70" y="${r.y + 18}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="48" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${r.n}</text>
      ${items.join('')}
    </g>`;
  }).join('\n');
  return svgWrap(
    `${bubbles(seed, 8)}
    <text x="256" y="70" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">数一数</text>
    ${out}
    ${stars(seed, 6)}`,
    'Counting Fiesta'
  );
}

// 8) Times table sampler — 9 cards in a 3x3 grid showing parts of the times table
function timesTableSampler() {
  const seed = 'times';
  const p = paletteFor(seed);
  const cells = [
    '2×3=6', '3×4=12', '4×5=20',
    '5×6=30', '6×7=42', '7×8=56',
    '8×9=72', '9×9=81', '6×6=36',
  ];
  const out = [];
  for (let i = 0; i < 9; i++) {
    const r = Math.floor(i / 3), c = i % 3;
    const cx = 110 + c * 146;
    const cy = 200 + r * 110;
    out.push(`<g transform="translate(${cx} ${cy})">
      <rect x="-66" y="-46" width="132" height="92" rx="20" fill="${pick(p, i)}" stroke="#3b3b6b" stroke-width="5"/>
      <text x="0" y="14" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="34" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${xmlEscape(cells[i])}</text>
    </g>`);
  }
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="80" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">乘法口诀</text>
    ${out.join('\n  ')}
    ${stars(seed, 8)}`,
    'Times Table Sampler'
  );
}

// 9) Fraction pie wheel — three fractions side by side
function fractionPies() {
  const seed = 'fracpie';
  const p = paletteFor(seed);
  function pie(cx, cy, num, den, color, label) {
    const r = 80;
    const slices = [];
    for (let i = 0; i < den; i++) {
      const a1 = (i / den) * 2 * Math.PI - Math.PI / 2;
      const a2 = ((i + 1) / den) * 2 * Math.PI - Math.PI / 2;
      const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
      const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
      const large = (a2 - a1) > Math.PI ? 1 : 0;
      const fill = i < num ? color : '#ffffff';
      slices.push(`<path d="M${cx} ${cy} L${x1} ${y1} A${r} ${r} 0 ${large} 1 ${x2} ${y2} Z" fill="${fill}" stroke="#3b3b6b" stroke-width="4"/>`);
    }
    return `${slices.join('')}
    <text x="${cx}" y="${cy + r + 50}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="40" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${label}</text>`;
  }
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="80" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="${p[2]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">分数小派</text>
    ${pie(120, 250, 1, 2, p[0], '1/2')}
    ${pie(260, 250, 1, 3, p[1], '1/3')}
    ${pie(400, 250, 3, 4, p[3], '3/4')}
    ${stars(seed, 8)}`,
    'Fraction Pies'
  );
}

// 10) Pythagoras stage — a 3-4-5 right triangle with squares on each side and the formula
function pythagorasScene() {
  const seed = 'pyth';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed, 8)}
    <text x="256" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="40" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">勾股定理</text>
    <g transform="translate(170 360)">
      <!-- right triangle: legs 120 (down-up) and 160 (left-right) -->
      <polygon points="0,0 160,0 0,-120" fill="${p[2]}" stroke="#3b3b6b" stroke-width="5"/>
      <!-- square on horizontal leg (below) -->
      <rect x="0" y="0" width="160" height="80" fill="${p[0]}" opacity="0.85" stroke="#3b3b6b" stroke-width="5"/>
      <text x="80" y="46" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#3b3b6b" stroke-width="2" paint-order="stroke fill">b²</text>
      <!-- square on vertical leg (left) -->
      <rect x="-90" y="-120" width="90" height="120" fill="${p[1]}" opacity="0.85" stroke="#3b3b6b" stroke-width="5"/>
      <text x="-45" y="-50" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#3b3b6b" stroke-width="2" paint-order="stroke fill">a²</text>
      <!-- square on hypotenuse (rotated) -->
      <g transform="rotate(-36.87 0 0) translate(0 -200)">
        <rect x="0" y="0" width="200" height="200" fill="${p[3]}" opacity="0.85" stroke="#3b3b6b" stroke-width="5"/>
        <text x="100" y="115" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="40" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">c²</text>
      </g>
    </g>
    <rect x="80" y="430" width="352" height="60" rx="20" fill="${p[4] || p[1]}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="473" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="40" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">a² + b² = c²</text>
    ${stars(seed, 6)}`,
    'Pythagoras Scene'
  );
}

// 11) Number line with arrows and operators
function numberLine() {
  const seed = 'numline';
  const p = paletteFor(seed);
  const ticks = [];
  for (let i = -5; i <= 5; i++) {
    const x = 256 + i * 40;
    ticks.push(`<line x1="${x}" y1="280" x2="${x}" y2="304" stroke="#3b3b6b" stroke-width="4"/>`);
    ticks.push(`<text x="${x}" y="340" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="22" fill="${p[3]}">${i}</text>`);
  }
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="80" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="${p[1]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">数轴小冒险</text>
    <line x1="40" y1="290" x2="472" y2="290" stroke="#3b3b6b" stroke-width="6"/>
    <polygon points="472,290 452,278 452,302" fill="#3b3b6b"/>
    <polygon points="40,290 60,278 60,302" fill="#3b3b6b"/>
    ${ticks.join('\n  ')}
    ${bubbleChip(170, 200, 36, p[0], '−2', 32)}
    ${bubbleChip(256, 180, 40, p[2], '0', 44)}
    ${bubbleChip(360, 200, 36, p[3], '+3', 32)}
    ${chip(140, 420, 70, p[1], '+', 64, -6)}
    ${chip(256, 420, 70, p[3], '−', 64, 6)}
    ${chip(372, 420, 70, p[2], '=', 64, -6)}
    ${stars(seed, 6)}`,
    'Number Line'
  );
}

// 12) Geometry rainbow — angles, parallel lines, right angle, plus formulas
function geometryRainbow() {
  const seed = 'geo';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed, 10)}
    <text x="256" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="${p[2]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">几何彩虹</text>
    <!-- right angle -->
    <g transform="translate(110 200)">
      <line x1="0" y1="0" x2="100" y2="0" stroke="#3b3b6b" stroke-width="6"/>
      <line x1="0" y1="0" x2="0" y2="-100" stroke="#3b3b6b" stroke-width="6"/>
      <rect x="0" y="-22" width="22" height="22" fill="none" stroke="#3b3b6b" stroke-width="4"/>
      <text x="50" y="40" text-anchor="middle" font-size="26" font-family="'Comic Sans MS',sans-serif" font-weight="900" fill="${p[0]}">90°</text>
    </g>
    <!-- acute angle -->
    <g transform="translate(290 200)">
      <line x1="0" y1="0" x2="110" y2="0" stroke="#3b3b6b" stroke-width="6"/>
      <line x1="0" y1="0" x2="100" y2="-60" stroke="#3b3b6b" stroke-width="6"/>
      <path d="M40 0 A40 40 0 0 0 34 -22" fill="none" stroke="${p[3]}" stroke-width="4"/>
      <text x="60" y="40" text-anchor="middle" font-size="26" font-family="'Comic Sans MS',sans-serif" font-weight="900" fill="${p[3]}">30°</text>
    </g>
    <!-- parallel lines -->
    <g transform="translate(80 340)">
      <line x1="0" y1="0" x2="160" y2="0" stroke="${p[1]}" stroke-width="8"/>
      <line x1="0" y1="40" x2="160" y2="40" stroke="${p[1]}" stroke-width="8"/>
      <text x="80" y="78" text-anchor="middle" font-size="26" font-family="'Comic Sans MS',sans-serif" font-weight="900" fill="${p[1]}">平行</text>
    </g>
    <!-- perpendicular lines -->
    <g transform="translate(310 360)">
      <line x1="-60" y1="0" x2="60" y2="0" stroke="${p[4] || p[2]}" stroke-width="8"/>
      <line x1="0" y1="-50" x2="0" y2="50" stroke="${p[4] || p[2]}" stroke-width="8"/>
      <rect x="0" y="0" width="16" height="16" fill="none" stroke="#3b3b6b" stroke-width="3"/>
      <text x="0" y="80" text-anchor="middle" font-size="26" font-family="'Comic Sans MS',sans-serif" font-weight="900" fill="${p[4] || p[2]}">垂直</text>
    </g>
    <rect x="60" y="450" width="392" height="46" rx="14" fill="${p[3]}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="484" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="30" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">∠ ∥ ⊥ △ □ ○</text>
    ${stars(seed, 6)}`,
    'Geometry Rainbow'
  );
}

// 13) Mega medley — digits, operators, π, ∞, shapes, all together in a swirl
function megaMedley() {
  const seed = 'medley';
  const p = paletteFor(seed);
  // Place 14 chips in a loose circular arrangement around the center
  const items = [
    { g: '1', s: 60 }, { g: '+', s: 60 }, { g: '2', s: 60 }, { g: '=', s: 60 }, { g: '3', s: 60 },
    { g: 'π', s: 70 }, { g: '∞', s: 70 }, { g: '√', s: 70 }, { g: '×', s: 60 }, { g: '÷', s: 60 },
    { g: '−', s: 60 }, { g: 'Σ', s: 70 }, { g: '%', s: 60 }, { g: 'e', s: 60 },
  ];
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const ang = (i / items.length) * 2 * Math.PI - Math.PI / 2;
    const radius = 175;
    const cx = 256 + Math.cos(ang) * radius;
    const cy = 256 + Math.sin(ang) * radius;
    out.push(bubbleChip(cx, cy, items[i].s * 0.6, pick(p, i), items[i].g, items[i].s));
  }
  return svgWrap(
    `${bubbles(seed, 12)}
    <circle cx="256" cy="256" r="96" fill="${p[3]}" stroke="#3b3b6b" stroke-width="6"/>
    <text x="256" y="240" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="32" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">数学</text>
    <text x="256" y="284" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="32" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">大集合</text>
    ${out.join('\n  ')}
    ${stars(seed, 10)}`,
    'Mega Medley'
  );
}

// 14) Pi day card — π big, surrounded by digits 3 1 4 1 5 9 2 6 5
function piDay() {
  const seed = 'pi-day';
  const p = paletteFor(seed);
  const digits = ['3', '.', '1', '4', '1', '5', '9', '2', '6'];
  const out = [];
  for (let i = 0; i < digits.length; i++) {
    const x = 60 + i * 44;
    out.push(`<g transform="translate(${x} 420)">
      <rect x="-20" y="-30" width="40" height="60" rx="10" fill="${pick(p, i)}" stroke="#3b3b6b" stroke-width="4"/>
      <text x="0" y="14" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="36" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${digits[i]}</text>
    </g>`);
  }
  return svgWrap(
    `${bubbles(seed, 12)}
    <circle cx="256" cy="220" r="150" fill="${p[0]}" stroke="#3b3b6b" stroke-width="8"/>
    <text x="256" y="270" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="220" fill="#ffffff" stroke="#3b3b6b" stroke-width="8" paint-order="stroke fill">π</text>
    <text x="256" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="40" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">圆周率 π</text>
    ${out.join('\n  ')}
    ${stars(seed, 8)}`,
    'Pi Day'
  );
}

// 15) Infinity playground — big ∞ with two friends digits going around it
function infinityPlayground() {
  const seed = 'inf-play';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed, 12)}
    <text x="256" y="64" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">无穷大乐园</text>
    <g transform="translate(256 270)">
      <path d="M-150 0 C-150 -90 -50 -90 0 0 C50 90 150 90 150 0 C150 -90 50 -90 0 0 C-50 90 -150 90 -150 0 Z"
        fill="${p[1]}" stroke="#3b3b6b" stroke-width="10"/>
    </g>
    ${bubbleChip(110, 180, 34, p[0], '1', 40)}
    ${bubbleChip(402, 180, 34, p[2], '2', 40)}
    ${bubbleChip(110, 380, 34, p[3], '∞', 44)}
    ${bubbleChip(402, 380, 34, p[4] || p[0], 'π', 40)}
    ${chip(256, 430, 80, p[2], 'never ends', 24)}
    ${stars(seed, 8)}`,
    'Infinity Playground'
  );
}

// ---------- Render ----------
const items = [
  ['collage-math-wonderland', mathWonderland()],
  ['collage-operator-parade', operatorParade()],
  ['collage-digit-garden', digitGarden()],
  ['collage-equation-street', equationStreet()],
  ['collage-shape-party', shapeParty()],
  ['collage-constants-mashup', constantsMashup()],
  ['collage-counting-fiesta', countingFiesta()],
  ['collage-times-table', timesTableSampler()],
  ['collage-fraction-pies', fractionPies()],
  ['collage-pythagoras', pythagorasScene()],
  ['collage-number-line', numberLine()],
  ['collage-geometry-rainbow', geometryRainbow()],
  ['collage-mega-medley', megaMedley()],
  ['collage-pi-day', piDay()],
  ['collage-infinity-playground', infinityPlayground()],
];

(async () => {
  let ok = 0, fail = 0;
  for (const [name, svg] of items) {
    try {
      const buf = Buffer.from(svg, 'utf8');
      const out = path.join(OUT, name + '.png');
      await sharp(buf, { density: 192 })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(out);
      ok++;
    } catch (e) {
      fail++;
      console.error(`FAIL ${name}: ${e.message}`);
    }
  }
  console.log(`Wrote ${ok} collage PNGs to ${OUT}, ${fail} failures.`);
})();
