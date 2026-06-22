// Single dense "everything" collage: 0-9 digits, common operators, π, ∞, √, Σ,
// φ, e, Euler's identity banner — kid sticker style, 1:1 transparent PNG.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'img');
const SIZE = 512;

const P = ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#A66CFF', '#FF9F1C', '#17C3B2', '#FE6D73'];

function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }
function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }

function hash(s) { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = (h * 0x01000193) >>> 0; } return h; }
function rng(seed) {
  let a = hash(seed) >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
function bubbles(seed, n = 12, opacity = 0.13) {
  const r = rng(seed + ':bub');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 16 + r() * 480;
    const cy = 16 + r() * 480;
    const rr = 24 + r() * 80;
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pick(P, i)}" opacity="${opacity}"/>`);
  }
  return out.join('\n  ');
}
function stars(seed, n = 8) {
  const r = rng(seed + ':stars');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 20 + r() * 472;
    const cy = 20 + r() * 472;
    const s = 5 + r() * 9;
    const rot = r() * 360;
    out.push(`<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(0)})">
      <path d="M0 -${s.toFixed(1)} L${(s*0.3).toFixed(1)} -${(s*0.3).toFixed(1)} L${s.toFixed(1)} 0 L${(s*0.3).toFixed(1)} ${(s*0.3).toFixed(1)} L0 ${s.toFixed(1)} L-${(s*0.3).toFixed(1)} ${(s*0.3).toFixed(1)} L-${s.toFixed(1)} 0 L-${(s*0.3).toFixed(1)} -${(s*0.3).toFixed(1)} Z"
        fill="#FFD93D" stroke="#3b3b6b" stroke-width="1.5" opacity="0.9"/>
    </g>`);
  }
  return out.join('\n  ');
}
function bubbleChip(cx, cy, r, fill, glyph, fontSize) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}

function build() {
  const seed = 'everything';
  const inner = [];

  inner.push(bubbles(seed));

  // Title banner
  inner.push(`<rect x="56" y="22" width="400" height="54" rx="22" fill="${P[0]}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="61" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="30" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">数学符号大集合</text>`);

  // Row 1: digits 0-9 (10 chips, full width)
  const digits = '0123456789';
  for (let i = 0; i < 10; i++) {
    const cx = 50 + i * 46;
    const cy = 116;
    inner.push(bubbleChip(cx, cy, 22, pick(P, i + 1), digits[i], 30));
  }

  // Row 2: π ∞ √ Σ φ e — six "hero" symbol chips (larger)
  const heroes = [
    ['π', P[0]],
    ['∞', P[1]],
    ['√', P[2]],
    ['Σ', P[3]],
    ['φ', P[4]],
    ['e', P[5]],
  ];
  for (let i = 0; i < heroes.length; i++) {
    const cx = 70 + i * 75;
    const cy = 184;
    inner.push(bubbleChip(cx, cy, 32, heroes[i][1], heroes[i][0], 48));
  }

  // Euler banner
  inner.push(`<rect x="76" y="240" width="360" height="68" rx="28" fill="${P[4]}" stroke="#3b3b6b" stroke-width="6"/>
    <text x="256" y="288" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="42" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">e^(iπ)+1=0</text>
    <rect x="200" y="218" width="112" height="24" rx="10" fill="#ffffff" stroke="#3b3b6b" stroke-width="3"/>
    <text x="256" y="237" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="16" fill="${P[4]}">欧拉公式</text>`);

  // Row 3: operators (10 chips)
  const ops = ['+', '−', '×', '÷', '=', '≠', '<', '>', '≤', '≥'];
  for (let i = 0; i < ops.length; i++) {
    const cx = 50 + i * 46;
    const cy = 348;
    inner.push(bubbleChip(cx, cy, 22, pick(P, i + 3), ops[i], 30));
  }

  // Row 4: more symbols (10 chips)
  const more = ['±', '%', '!', '∂', '∫', '∇', '∝', '≈', '∈', '∀'];
  for (let i = 0; i < more.length; i++) {
    const cx = 50 + i * 46;
    const cy = 400;
    inner.push(bubbleChip(cx, cy, 22, pick(P, i + 5), more[i], 28));
  }

  // Bottom caption with formula list
  inner.push(`<rect x="56" y="442" width="400" height="48" rx="20" fill="${P[3]}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="474" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="21" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">a²+b²=c² · S=πr² · φ=(1+√5)/2</text>`);

  inner.push(stars(seed, 8));

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>Everything Collage</title>
  ${inner.join('\n  ')}
</svg>`;
}

(async () => {
  const svg = build();
  const out = path.join(OUT, 'collage-everything.png');
  await sharp(Buffer.from(svg, 'utf8'), { density: 192 })
    .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`wrote ${out}`);
})();
