// One-shot generator: writes >=100 kid-styled 1:1 transparent SVG images to ../img.
// Run with: node scripts/gen-images.js
const fs = require('fs');
const path = require('path');

const OUT = path.resolve(__dirname, '..', 'img');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });

const SIZE = 512;
const PALETTES = [
  ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF'],
  ['#FF9F1C', '#FFBF69', '#2EC4B6', '#E71D36'],
  ['#A0E7E5', '#B4F8C8', '#FBE7C6', '#FFAEBC'],
  ['#F38BA0', '#F9C74F', '#90BE6D', '#577590'],
  ['#FF87B2', '#FFCB77', '#17C3B2', '#227C9D'],
  ['#FFADAD', '#FFD6A5', '#CAFFBF', '#9BF6FF'],
  ['#BDB2FF', '#FFC6FF', '#A0C4FF', '#FDFFB6'],
];

function pick(arr, i) { return arr[i % arr.length]; }
function hash(s) { let h = 0; for (const c of s) h = (h * 31 + c.charCodeAt(0)) >>> 0; return h; }
function paletteFor(seed) { return PALETTES[hash(seed) % PALETTES.length]; }

function svgWrap(inner, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>${title}</title>
  ${inner}
</svg>`;
}

// ---------- Building blocks ----------

function bubbleBg(seed, opacity = 0.18) {
  const p = paletteFor(seed + ':bg');
  const h = hash(seed);
  const circles = [];
  for (let i = 0; i < 6; i++) {
    const cx = ((h >> (i * 3)) % 480) + 16;
    const cy = ((h >> (i * 3 + 1)) % 480) + 16;
    const r = 28 + ((h >> (i * 2)) % 60);
    circles.push(`<circle cx="${cx}" cy="${cy}" r="${r}" fill="${pick(p, i)}" opacity="${opacity}"/>`);
  }
  return circles.join('\n  ');
}

function sparkles(seed, n = 5) {
  const h = hash(seed + ':spk');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 30 + ((h >> (i * 4)) % 452);
    const cy = 30 + ((h >> (i * 4 + 2)) % 452);
    const s = 6 + ((h >> i) % 10);
    out.push(`<g transform="translate(${cx} ${cy})">
      <path d="M0 -${s} L${s * 0.3} -${s * 0.3} L${s} 0 L${s * 0.3} ${s * 0.3} L0 ${s} L-${s * 0.3} ${s * 0.3} L-${s} 0 L-${s * 0.3} -${s * 0.3} Z"
        fill="#FFD93D" opacity="0.85"/>
    </g>`);
  }
  return out.join('\n  ');
}

// Big rounded "sticker" rectangle behind a central glyph.
function stickerBack(color1, color2) {
  return `<defs>
    <linearGradient id="g1" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="${color1}"/>
      <stop offset="100%" stop-color="${color2}"/>
    </linearGradient>
  </defs>
  <rect x="56" y="56" width="400" height="400" rx="80" ry="80" fill="url(#g1)" opacity="0.95"/>
  <rect x="56" y="56" width="400" height="400" rx="80" ry="80" fill="none" stroke="#ffffff" stroke-width="10" opacity="0.85"/>`;
}

function xmlEscape(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function bigText(text, color = '#ffffff', size = 280, dy = 100) {
  const len = [...text].length;
  const fontSize = len >= 4 ? Math.round(size * 0.55) : len === 3 ? Math.round(size * 0.75) : size;
  return `<text x="256" y="${256 + dy * (fontSize / size)}" text-anchor="middle"
    font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
    font-size="${fontSize}" fill="${color}" stroke="#3b3b6b" stroke-width="6" paint-order="stroke fill">${xmlEscape(text)}</text>`;
}

// ---------- Generators ----------

function digitSticker(d) {
  const seed = `digit-${d}`;
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[1])}
    ${bigText(String(d))}
    ${sparkles(seed, 6)}`,
    `Number ${d}`
  );
}

function operatorSticker(op, label) {
  const seed = `op-${label}`;
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[2], p[3])}
    ${bigText(op, '#ffffff', 320, 110)}
    ${sparkles(seed, 5)}`,
    `Operator ${label}`
  );
}

function equationSticker(text, label) {
  const seed = `eq-${label}`;
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[2])}
    ${bigText(text, '#ffffff', 180, 60)}
    ${sparkles(seed, 7)}`,
    `Equation ${label}`
  );
}

function fractionSticker(num, den) {
  const seed = `frac-${num}-${den}`;
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[1], p[3])}
    <text x="256" y="220" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="180" fill="#ffffff" stroke="#3b3b6b" stroke-width="6" paint-order="stroke fill">${num}</text>
    <rect x="140" y="240" width="232" height="16" rx="8" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
    <text x="256" y="420" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="180" fill="#ffffff" stroke="#3b3b6b" stroke-width="6" paint-order="stroke fill">${den}</text>
    ${sparkles(seed, 5)}`,
    `Fraction ${num}/${den}`
  );
}

function shapeSticker(name, drawShape) {
  const seed = `shape-${name}`;
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[2])}
    <g transform="translate(256 256)">${drawShape(p)}</g>
    <text x="256" y="470" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${name}</text>
    ${sparkles(seed, 4)}`,
    `Shape ${name}`
  );
}

function countingSticker(n, emoji, label) {
  const seed = `count-${label}-${n}`;
  const p = paletteFor(seed);
  const items = [];
  const cols = Math.ceil(Math.sqrt(n));
  const rows = Math.ceil(n / cols);
  const cellW = 320 / cols;
  const cellH = 280 / rows;
  for (let i = 0; i < n; i++) {
    const cx = 96 + (i % cols) * cellW + cellW / 2;
    const cy = 130 + Math.floor(i / cols) * cellH + cellH / 2;
    items.push(`<text x="${cx}" y="${cy}" text-anchor="middle" font-size="${Math.min(cellW, cellH) * 0.9}" dominant-baseline="central">${emoji}</text>`);
  }
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[1], p[2])}
    ${items.join('\n  ')}
    <text x="256" y="475" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="46" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${n} ${label}</text>
    ${sparkles(seed, 4)}`,
    `Counting ${n} ${label}`
  );
}

function piSticker() {
  const seed = 'pi';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[3])}
    ${bigText('π', '#ffffff', 360, 130)}
    <text x="256" y="430" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">3.14159…</text>
    ${sparkles(seed, 8)}`,
    'Pi'
  );
}

function infinitySticker() {
  const seed = 'inf';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[1], p[3])}
    ${bigText('∞', '#ffffff', 340, 110)}
    <text x="256" y="430" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">无穷大</text>
    ${sparkles(seed, 7)}`,
    'Infinity'
  );
}

function rulerSticker() {
  const seed = 'ruler';
  const p = paletteFor(seed);
  const ticks = [];
  for (let i = 0; i <= 10; i++) {
    const x = 96 + i * 32;
    const h = i % 5 === 0 ? 60 : 36;
    ticks.push(`<line x1="${x}" y1="320" x2="${x}" y2="${320 - h}" stroke="#3b3b6b" stroke-width="4"/>`);
    if (i % 2 === 0) ticks.push(`<text x="${x}" y="360" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="22" fill="#3b3b6b">${i}</text>`);
  }
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[1])}
    <rect x="80" y="280" width="352" height="60" rx="10" fill="#ffffff" stroke="#3b3b6b" stroke-width="5"/>
    ${ticks.join('\n  ')}
    <text x="256" y="180" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="60" fill="#ffffff" stroke="#3b3b6b" stroke-width="5" paint-order="stroke fill">尺子</text>
    ${sparkles(seed, 4)}`,
    'Ruler'
  );
}

function clockSticker(hour) {
  const seed = `clock-${hour}`;
  const p = paletteFor(seed);
  const angle = (hour % 12) * 30 - 90;
  const rad = angle * Math.PI / 180;
  const hx = Math.cos(rad) * 90;
  const hy = Math.sin(rad) * 90;
  const ticks = [];
  for (let i = 0; i < 12; i++) {
    const a = i * 30 - 90;
    const r = a * Math.PI / 180;
    const x1 = Math.cos(r) * 140;
    const y1 = Math.sin(r) * 140;
    const x2 = Math.cos(r) * 160;
    const y2 = Math.sin(r) * 160;
    ticks.push(`<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="#3b3b6b" stroke-width="6" stroke-linecap="round"/>`);
  }
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[2])}
    <g transform="translate(256 256)">
      <circle r="170" fill="#ffffff" stroke="#3b3b6b" stroke-width="8"/>
      ${ticks.join('\n  ')}
      <line x1="0" y1="0" x2="${hx}" y2="${hy}" stroke="#e74c3c" stroke-width="10" stroke-linecap="round"/>
      <line x1="0" y1="0" x2="0" y2="-130" stroke="#3b3b6b" stroke-width="6" stroke-linecap="round"/>
      <circle r="10" fill="#3b3b6b"/>
    </g>
    <text x="256" y="480" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="40" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${hour}:00</text>
    ${sparkles(seed, 4)}`,
    `Clock ${hour}`
  );
}

function diceSticker(n) {
  const seed = `dice-${n}`;
  const p = paletteFor(seed);
  const dots = {
    1: [[0, 0]],
    2: [[-1, -1], [1, 1]],
    3: [[-1, -1], [0, 0], [1, 1]],
    4: [[-1, -1], [1, -1], [-1, 1], [1, 1]],
    5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]],
    6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]],
  }[n];
  const pips = dots.map(([dx, dy]) => `<circle cx="${dx * 60}" cy="${dy * 60}" r="22" fill="#3b3b6b"/>`).join('\n  ');
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[2], p[3])}
    <g transform="translate(256 256)">
      <rect x="-140" y="-140" width="280" height="280" rx="40" fill="#ffffff" stroke="#3b3b6b" stroke-width="8"/>
      ${pips}
    </g>
    ${sparkles(seed, 4)}`,
    `Dice ${n}`
  );
}

function abacusSticker() {
  const seed = 'abacus';
  const p = paletteFor(seed);
  const rows = [];
  for (let r = 0; r < 4; r++) {
    const y = 170 + r * 50;
    rows.push(`<line x1="100" y1="${y}" x2="412" y2="${y}" stroke="#3b3b6b" stroke-width="4"/>`);
    for (let b = 0; b < 5; b++) {
      const cx = 130 + b * 50 + (r % 2) * 20;
      rows.push(`<circle cx="${cx}" cy="${y}" r="18" fill="${pick(p, r + b)}" stroke="#3b3b6b" stroke-width="3"/>`);
    }
  }
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[1])}
    <rect x="80" y="140" width="352" height="220" rx="20" fill="#ffffff" stroke="#3b3b6b" stroke-width="6"/>
    ${rows.join('\n  ')}
    <text x="256" y="430" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="48" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">算盘</text>
    ${sparkles(seed, 4)}`,
    'Abacus'
  );
}

function pencilSticker() {
  const seed = 'pencil';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[1], p[2])}
    <g transform="translate(256 256) rotate(-30)">
      <rect x="-160" y="-30" width="260" height="60" fill="#FFD93D" stroke="#3b3b6b" stroke-width="6"/>
      <rect x="100" y="-30" width="60" height="60" fill="#FF6B9D" stroke="#3b3b6b" stroke-width="6"/>
      <polygon points="-160,-30 -210,0 -160,30" fill="#F4E1B5" stroke="#3b3b6b" stroke-width="6"/>
      <polygon points="-210,0 -200,-12 -200,12" fill="#3b3b6b"/>
    </g>
    <text x="256" y="470" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">铅笔</text>
    ${sparkles(seed, 4)}`,
    'Pencil'
  );
}

function bookSticker() {
  const seed = 'book';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[3], p[0])}
    <g transform="translate(256 256)">
      <path d="M-150 -120 Q0 -150 150 -120 L150 120 Q0 90 -150 120 Z" fill="#ffffff" stroke="#3b3b6b" stroke-width="6"/>
      <line x1="0" y1="-130" x2="0" y2="115" stroke="#3b3b6b" stroke-width="4"/>
      <text x="-75" y="-30" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="60" fill="#3b3b6b">1+1</text>
      <text x="75" y="-30" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="60" fill="#3b3b6b">=2</text>
      <text x="-75" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="50" fill="#3b3b6b">π</text>
      <text x="75" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="50" fill="#3b3b6b">∞</text>
    </g>
    <text x="256" y="470" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">数学书</text>
    ${sparkles(seed, 4)}`,
    'Math Book'
  );
}

function calcSticker() {
  const seed = 'calc';
  const p = paletteFor(seed);
  const keys = ['7','8','9','÷','4','5','6','×','1','2','3','-','0','.','=','+'];
  const cells = keys.map((k, i) => {
    const r = Math.floor(i / 4), c = i % 4;
    const x = 110 + c * 80, y = 250 + r * 60;
    return `<rect x="${x}" y="${y}" width="60" height="44" rx="10" fill="${pick(p, i)}" stroke="#3b3b6b" stroke-width="3"/>
      <text x="${x + 30}" y="${y + 32}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="28" fill="#ffffff" stroke="#3b3b6b" stroke-width="2" paint-order="stroke fill">${k}</text>`;
  }).join('\n  ');
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[0], p[2])}
    <rect x="90" y="120" width="332" height="380" rx="24" fill="#ffffff" stroke="#3b3b6b" stroke-width="6"/>
    <rect x="110" y="150" width="292" height="80" rx="10" fill="#d8f3dc" stroke="#3b3b6b" stroke-width="4"/>
    <text x="390" y="208" text-anchor="end" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="44" fill="#3b3b6b">123</text>
    ${cells}`,
    'Calculator'
  );
}

function formulaSticker(label, lines) {
  const seed = `formula-${label}`;
  const p = paletteFor(seed);
  const texts = lines.map((line, i) =>
    `<text x="256" y="${230 + i * 70}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="56" fill="#ffffff" stroke="#3b3b6b" stroke-width="5" paint-order="stroke fill">${line}</text>`
  ).join('\n  ');
  return svgWrap(
    `${bubbleBg(seed)}
    ${stickerBack(p[1], p[3])}
    <text x="256" y="160" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="44" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${label}</text>
    ${texts}
    ${sparkles(seed, 4)}`,
    `Formula ${label}`
  );
}

// ---------- Compose the catalogue ----------

const files = [];

// 1) Digits 0–20  (21)
for (let d = 0; d <= 20; d++) {
  files.push([`digit-${String(d).padStart(2, '0')}.svg`, digitSticker(d)]);
}

// 2) Operators  (10)
const ops = [
  ['+', 'plus'], ['−', 'minus'], ['×', 'times'], ['÷', 'divide'],
  ['=', 'equal'], ['≠', 'noteq'], ['<', 'lt'], ['>', 'gt'],
  ['≤', 'le'], ['≥', 'ge'],
];
for (const [op, label] of ops) files.push([`op-${label}.svg`, operatorSticker(op, label)]);

// 3) Equations / fun facts  (15)
const eqs = [
  ['1+1=2', 'one-plus-one'],
  ['2+3=5', 'two-plus-three'],
  ['5+5=10', 'five-plus-five'],
  ['9+1=10', 'nine-plus-one'],
  ['7−3=4', 'seven-minus-three'],
  ['10−4=6', 'ten-minus-four'],
  ['2×3=6', 'two-times-three'],
  ['4×5=20', 'four-times-five'],
  ['6×7=42', 'six-times-seven'],
  ['9×9=81', 'nine-times-nine'],
  ['8÷2=4', 'eight-div-two'],
  ['12÷3=4', 'twelve-div-three'],
  ['10+10=20', 'ten-plus-ten'],
  ['25−5=20', 'twentyfive-minus-five'],
  ['100=10²', 'hundred-eq-tensq'],
];
for (const [t, l] of eqs) files.push([`eq-${l}.svg`, equationSticker(t, l)]);

// 4) Fractions  (10)
const fracs = [[1,2],[1,3],[2,3],[1,4],[3,4],[1,5],[2,5],[3,5],[1,8],[5,8]];
for (const [n, d] of fracs) files.push([`frac-${n}-${d}.svg`, fractionSticker(n, d)]);

// 5) Shapes  (10)
const shapes = [
  ['圆形', (p) => `<circle r="150" fill="${p[0]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['正方形', (p) => `<rect x="-150" y="-150" width="300" height="300" rx="14" fill="${p[1]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['长方形', (p) => `<rect x="-170" y="-110" width="340" height="220" rx="14" fill="${p[2]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['三角形', (p) => `<polygon points="0,-160 150,120 -150,120" fill="${p[3]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['梯形', (p) => `<polygon points="-180,120 180,120 110,-120 -110,-120" fill="${p[0]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['平行四边形', (p) => `<polygon points="-200,100 100,100 200,-100 -100,-100" fill="${p[1]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['菱形', (p) => `<polygon points="0,-160 150,0 0,160 -150,0" fill="${p[2]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['五边形', (p) => `<polygon points="0,-160 152,-50 94,130 -94,130 -152,-50" fill="${p[3]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['六边形', (p) => `<polygon points="0,-160 138,-80 138,80 0,160 -138,80 -138,-80" fill="${p[0]}" stroke="#3b3b6b" stroke-width="8"/>`],
  ['五角星', (p) => `<polygon points="0,-160 47,-49 165,-49 70,22 105,140 0,68 -105,140 -70,22 -165,-49 -47,-49" fill="${p[1]}" stroke="#3b3b6b" stroke-width="8"/>`],
];
for (const [name, fn] of shapes) files.push([`shape-${name}.svg`, shapeSticker(name, fn)]);

// 6) Counting groups (15)
const counts = [
  [1, '🍎', '苹果'], [2, '🍎', '苹果'], [3, '🍎', '苹果'], [5, '🍎', '苹果'],
  [4, '🐠', '小鱼'], [6, '🐠', '小鱼'],
  [3, '🌟', '星星'], [7, '🌟', '星星'], [9, '🌟', '星星'],
  [4, '🐝', '蜜蜂'], [6, '🐝', '蜜蜂'],
  [5, '🍓', '草莓'], [8, '🍓', '草莓'],
  [10, '🎈', '气球'], [12, '🎈', '气球'],
];
for (const [n, e, l] of counts) files.push([`count-${l}-${n}.svg`, countingSticker(n, e, l)]);

// 7) Special / fun  (6)
files.push(['pi.svg', piSticker()]);
files.push(['infinity.svg', infinitySticker()]);
files.push(['ruler.svg', rulerSticker()]);
files.push(['pencil.svg', pencilSticker()]);
files.push(['book.svg', bookSticker()]);
files.push(['calculator.svg', calcSticker()]);
files.push(['abacus.svg', abacusSticker()]);

// 8) Clock faces (6)
for (const h of [1, 3, 6, 9, 10, 12]) files.push([`clock-${h}.svg`, clockSticker(h)]);

// 9) Dice (6)
for (let n = 1; n <= 6; n++) files.push([`dice-${n}.svg`, diceSticker(n)]);

// 10) Famous formulas (8)
files.push(['formula-circle.svg', formulaSticker('圆的周长', ['C = 2πr'])]);
files.push(['formula-circle-area.svg', formulaSticker('圆的面积', ['S = πr²'])]);
files.push(['formula-rect-area.svg', formulaSticker('长方形面积', ['S = a × b'])]);
files.push(['formula-tri-area.svg', formulaSticker('三角形面积', ['S = ½ × a × h'])]);
files.push(['formula-square-perimeter.svg', formulaSticker('正方形周长', ['C = 4a'])]);
files.push(['formula-cube-volume.svg', formulaSticker('正方体体积', ['V = a³'])]);
files.push(['formula-pythagoras.svg', formulaSticker('勾股定理', ['a² + b² = c²'])]);
files.push(['formula-speed.svg', formulaSticker('速度公式', ['s = v × t'])]);

// Write all files
for (const [name, content] of files) {
  fs.writeFileSync(path.join(OUT, name), content, 'utf8');
}
console.log(`Wrote ${files.length} files to ${OUT}`);
