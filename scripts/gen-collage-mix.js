// Generate 100 additional collage PNGs (1:1, transparent, kid sticker style).
// Outputs: img/collage-mix-001.png ... collage-mix-100.png
// Style matches earlier collages: rounded chips, navy outlines, candy palette, sparkles.
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
  ['#FF7AA2', '#FFC15E', '#80D39B', '#7BD3F7', '#C9A8FF'],
  ['#F7B2BD', '#FFE066', '#A0E8AF', '#6FD2C7', '#B388EB'],
  ['#FCA17D', '#FFD972', '#9AE19D', '#7DCFB6', '#9C89B8'],
];

// Symbol pool — kept entity-safe; XML escaping handled by xmlEscape().
const HERO = ['π', '∞', '√', 'Σ', '∫', 'e', 'φ', 'τ', '∇', '∂'];
const CONSTANTS = ['π', '∞', 'e', 'φ', 'τ', 'γ', 'ℵ'];
const GREEK = ['α', 'β', 'γ', 'δ', 'ε', 'θ', 'λ', 'μ', 'ξ', 'ρ', 'σ', 'φ', 'ψ', 'ω', 'Δ', 'Ω'];
const OPS = ['+', '−', '×', '÷', '±', '=', '≠', '≈', '≡', '<', '>', '≤', '≥', '∝', '·'];
const SET = ['∈', '∉', '⊂', '⊃', '∪', '∩', '∅', '∀', '∃'];
const CALC = ['∫', '∮', '∂', '∇', 'Σ', '∏', '√', '∛', 'lim', 'dx'];
const LOGIC = ['∧', '∨', '¬', '⇒', '⇔'];
const MISC = ['°', '%', '!', '∠', '⊥', '∥', '△', '□', '○'];
const DIGITS = ['0','1','2','3','4','5','6','7','8','9'];

const FORMULAS = [
  'e^(iπ)+1=0',
  'a²+b²=c²',
  'E=mc²',
  'F=ma',
  'V=IR',
  'S=πr²',
  'C=2πr',
  'sin²θ+cos²θ=1',
  'φ=(1+√5)/2',
  'n!=n(n−1)!',
  'logₐb=c',
  'V=⁴⁄₃πr³',
  'i²=−1',
  'd/dx(xⁿ)=nxⁿ⁻¹',
  '∫eˣdx=eˣ',
  'a/b=c/d',
  '1+2+...+n=n(n+1)/2',
  'eⁱˣ=cosx+isinx',
];

const TITLES = [
  '数学魔法', '符号乐园', '奇妙数学', '小小公式', '数字星球',
  '数学派对', '彩虹数学', '神奇符号', '思维体操', '一起算数',
  '欧拉小屋', '无穷世界', 'π 的舞会', '√ 之旅', '指数王国',
];

function hash(s) { let h = 0x811c9dc5; for (const c of s) { h ^= c.charCodeAt(0); h = (h * 0x01000193) >>> 0; } return h; }
function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }
function paletteFor(seed) { return PALETTES[hash(seed + ':pal') % PALETTES.length]; }
function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

// Seeded PRNG (mulberry32-style) for deterministic per-image variation.
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
function shuffle(arr, rand) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function svgWrap(inner, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>${xmlEscape(title)}</title>
  ${inner}
</svg>`;
}

function bubbles(seed, n = 9, opacity = 0.14) {
  const p = paletteFor(seed + ':bg');
  const r = rng(seed + ':bub');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 16 + r() * 480;
    const cy = 16 + r() * 480;
    const rr = 22 + r() * 78;
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pick(p, i)}" opacity="${opacity}"/>`);
  }
  return out.join('\n  ');
}
function stars(seed, n = 7) {
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

function chip(cx, cy, size, fill, glyph, fontSize, rot = 0) {
  const half = size / 2;
  return `<g transform="translate(${cx} ${cy}) rotate(${rot})">
    <rect x="${-half}" y="${-half}" width="${size}" height="${size}" rx="${(size * 0.22).toFixed(1)}" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}
function bubbleChip(cx, cy, r, fill, glyph, fontSize) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}
function ticket(cx, cy, w, h, fill, text, fontSize) {
  return `<g transform="translate(${cx} ${cy})">
    <rect x="${-w/2}" y="${-h/2}" width="${w}" height="${h}" rx="${(h/2).toFixed(0)}" fill="${fill}" stroke="#3b3b6b" stroke-width="6"/>
    <circle cx="${-w/2}" cy="0" r="12" fill="#ffffff" stroke="#3b3b6b" stroke-width="3"/>
    <circle cx="${w/2}" cy="0" r="12" fill="#ffffff" stroke="#3b3b6b" stroke-width="3"/>
    <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(text)}</text>
  </g>`;
}

// ---------------- Layouts ----------------

function layoutOrbit(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':orbit');
  const hero = pick(HERO, Math.floor(rand() * HERO.length));
  const pool = shuffle([...CONSTANTS, ...OPS, ...GREEK.slice(0, 10), ...CALC.slice(0, 6), ...DIGITS], rand);
  const n = 10 + Math.floor(rand() * 3);
  const items = pool.slice(0, n);
  const orbits = items.map((g, i) => {
    const ang = (i / n) * 2 * Math.PI + rand() * 0.2;
    const radius = 165 + (i % 2 === 0 ? 0 : 18);
    const cx = 256 + Math.cos(ang) * radius;
    const cy = 256 + Math.sin(ang) * radius;
    const r = 32 + (g.length > 1 ? 4 : 0) + (rand() * 6);
    const fs = g.length > 1 ? 32 : 48 + (rand() * 6);
    return bubbleChip(cx.toFixed(1), cy.toFixed(1), r.toFixed(1), pick(p, i), g, Math.round(fs));
  }).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <circle cx="256" cy="256" r="100" fill="${p[Math.floor(rand() * p.length)]}" stroke="#3b3b6b" stroke-width="7"/>
    <text x="256" y="290" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="120" fill="#ffffff" stroke="#3b3b6b" stroke-width="6" paint-order="stroke fill">${xmlEscape(hero)}</text>
    ${orbits}
    ${stars(seed, 8)}`,
    'Orbit'
  );
}

function layoutGrid(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':grid');
  const cols = 4, rows = 4;
  const pool = shuffle([...CONSTANTS, ...OPS, ...GREEK.slice(0, 10), ...CALC.slice(0, 5), ...SET.slice(0, 4), ...DIGITS], rand);
  const items = pool.slice(0, cols * rows);
  const out = [];
  const cellW = 96, cellH = 96, startX = 64 + cellW / 2, startY = 90 + cellH / 2;
  for (let i = 0; i < items.length; i++) {
    const r = Math.floor(i / cols), c = i % cols;
    const cx = startX + c * cellW;
    const cy = startY + r * cellH;
    const rot = (rand() * 16) - 8;
    const g = items[i];
    const fs = g.length > 1 ? 32 : 56;
    out.push(chip(cx, cy, 80, pick(p, i + r), g, fs, rot));
  }
  return svgWrap(
    `${bubbles(seed)}
    <text x="256" y="42" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="34" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${pick(TITLES, hash(seed))}</text>
    ${out.join('\n  ')}
    ${stars(seed, 6)}`,
    'Grid'
  );
}

function layoutDiagonal(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':diag');
  const pool = shuffle([...CONSTANTS, ...HERO, ...OPS, ...CALC, ...GREEK.slice(0, 8)], rand);
  const items = pool.slice(0, 11);
  const out = [];
  for (let i = 0; i < items.length; i++) {
    const cx = 80 + i * 36;
    const cy = 100 + i * 30;
    const size = 60 + (rand() * 18);
    const rot = (rand() * 30) - 15;
    out.push(chip(cx, cy, size, pick(p, i), items[i], Math.round(size * 0.7), rot));
  }
  return svgWrap(
    `${bubbles(seed)}
    ${out.join('\n  ')}
    ${stars(seed, 7)}`,
    'Diagonal Cascade'
  );
}

function layoutSpiral(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':spiral');
  const pool = shuffle([...CONSTANTS, ...OPS, ...GREEK, ...CALC, ...DIGITS, ...MISC], rand);
  const n = 16;
  const items = pool.slice(0, n);
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const ang = t * Math.PI * 4;
    const radius = 30 + t * 200;
    const cx = 256 + Math.cos(ang) * radius;
    const cy = 256 + Math.sin(ang) * radius;
    const sz = 56 - t * 22;
    out.push(bubbleChip(cx.toFixed(1), cy.toFixed(1), (sz / 2 + 6).toFixed(1), pick(p, i), items[i], Math.round(sz)));
  }
  return svgWrap(
    `${bubbles(seed)}
    ${out.join('\n  ')}
    ${stars(seed, 7)}`,
    'Spiral'
  );
}

function layoutConstellation(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':con');
  const pool = shuffle([...HERO, ...CONSTANTS, ...CALC, ...OPS, ...GREEK.slice(0, 6)], rand);
  const n = 9;
  const nodes = [];
  for (let i = 0; i < n; i++) {
    nodes.push({ cx: 70 + rand() * 372, cy: 90 + rand() * 332, g: pool[i], r: 36 + rand() * 12 });
  }
  // Connect each node to its nearest 2 neighbors with thin dashed lines.
  const lines = [];
  for (let i = 0; i < n; i++) {
    const dists = nodes
      .map((nd, j) => ({ j, d: Math.hypot(nodes[i].cx - nd.cx, nodes[i].cy - nd.cy) }))
      .filter((x) => x.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of dists) {
      if (j > i) {
        lines.push(`<line x1="${nodes[i].cx.toFixed(1)}" y1="${nodes[i].cy.toFixed(1)}" x2="${nodes[j].cx.toFixed(1)}" y2="${nodes[j].cy.toFixed(1)}" stroke="${p[3]}" stroke-width="4" stroke-dasharray="6 8" opacity="0.6"/>`);
      }
    }
  }
  const chips = nodes.map((nd, i) => bubbleChip(nd.cx.toFixed(1), nd.cy.toFixed(1), nd.r.toFixed(1), pick(p, i), nd.g, Math.round(nd.r * 1.2))).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    ${lines.join('\n  ')}
    ${chips}
    ${stars(seed, 9)}`,
    'Constellation'
  );
}

function layoutTriptych(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':tri');
  const cols = 3;
  const colSymbols = [
    shuffle([...CONSTANTS, ...GREEK], rand).slice(0, 4),
    shuffle([...OPS, ...CALC], rand).slice(0, 4),
    shuffle([...HERO, ...DIGITS], rand).slice(0, 4),
  ];
  const out = [];
  for (let c = 0; c < cols; c++) {
    const cx = 110 + c * 146;
    out.push(`<rect x="${cx - 60}" y="80" width="120" height="360" rx="32" fill="${pick(p, c)}" opacity="0.85" stroke="#3b3b6b" stroke-width="5"/>`);
    for (let r = 0; r < 4; r++) {
      const cy = 130 + r * 92;
      out.push(bubbleChip(cx, cy, 36, '#ffffff', colSymbols[c][r], colSymbols[c][r].length > 1 ? 26 : 44));
    }
  }
  return svgWrap(
    `${bubbles(seed)}
    <text x="256" y="60" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="36" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${pick(TITLES, hash(seed))}</text>
    ${out.join('\n  ')}
    <text x="256" y="478" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="28" fill="${p[2]}" stroke="#3b3b6b" stroke-width="2" paint-order="stroke fill">符号 · 运算 · 数字</text>
    ${stars(seed, 6)}`,
    'Triptych'
  );
}

function layoutHeroCard(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':hero');
  const f = pick(FORMULAS, Math.floor(rand() * FORMULAS.length));
  const accentPool = shuffle([...CONSTANTS, ...HERO, ...OPS, ...GREEK.slice(0, 8)], rand);
  const corners = [
    [86, 110], [426, 110], [86, 402], [426, 402],
    [256, 88], [256, 424], [70, 256], [442, 256],
  ];
  const accents = corners.map(([cx, cy], i) => bubbleChip(cx, cy, 36, pick(p, i + 1), accentPool[i], accentPool[i].length > 1 ? 26 : 44)).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <rect x="60" y="186" width="392" height="140" rx="40" fill="${p[0]}" stroke="#3b3b6b" stroke-width="7"/>
    <text x="256" y="276" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="${f.length > 12 ? 36 : 50}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(f)}</text>
    ${accents}
    ${stars(seed, 7)}`,
    'Hero Formula'
  );
}

function layoutCluster(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':cluster');
  const pool = shuffle([...CONSTANTS, ...HERO, ...CALC, ...GREEK.slice(0, 10), ...OPS, ...SET.slice(0, 5)], rand);
  const n = 12;
  // Poisson-ish placement: rejection-sample for min spacing.
  const placed = [];
  let attempts = 0;
  while (placed.length < n && attempts < 400) {
    attempts++;
    const r = 36 + rand() * 26;
    const cx = 56 + r + rand() * (400 - 2 * r);
    const cy = 56 + r + rand() * (400 - 2 * r);
    let ok = true;
    for (const q of placed) {
      const minD = r + q.r + 8;
      if (Math.hypot(cx - q.cx, cy - q.cy) < minD) { ok = false; break; }
    }
    if (ok) placed.push({ cx, cy, r });
  }
  const out = placed.map((q, i) => bubbleChip(q.cx.toFixed(1), q.cy.toFixed(1), q.r.toFixed(1), pick(p, i), pool[i % pool.length], Math.round(q.r * 1.2))).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    ${out}
    ${stars(seed, 8)}`,
    'Cluster'
  );
}

function layoutEulerSpotlight(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':euler');
  // Euler's identity center, plus orbiting symbols
  const ring = shuffle(['π', 'e', 'i', '1', '+', '=', '0', '∞', '√', 'Σ', '∫', '∂'], rand).slice(0, 10);
  const out = ring.map((g, i) => {
    const ang = (i / ring.length) * 2 * Math.PI;
    const cx = 256 + Math.cos(ang) * 200;
    const cy = 256 + Math.sin(ang) * 200;
    return bubbleChip(cx.toFixed(1), cy.toFixed(1), 34, pick(p, i), g, g.length > 1 ? 26 : 44);
  }).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <rect x="56" y="216" width="400" height="100" rx="40" fill="${p[1]}" stroke="#3b3b6b" stroke-width="7"/>
    <text x="256" y="284" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="52" fill="#ffffff" stroke="#3b3b6b" stroke-width="5" paint-order="stroke fill">e^(iπ)+1=0</text>
    <text x="256" y="180" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="34" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">欧拉公式</text>
    ${out}
    ${stars(seed, 8)}`,
    'Euler Spotlight'
  );
}

function layoutSqrtTower(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':sqrt');
  const tower = ['√2', '√3', '√5', '√7', '√10', '√π'];
  const out = tower.map((g, i) => {
    const cy = 100 + i * 60;
    return ticket(256, cy, 240 - i * 12, 50, pick(p, i), g, 36);
  }).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <text x="256" y="50" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="38" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">开方塔</text>
    ${out}
    ${bubbleChip(70, 256, 36, p[0], '√', 50)}
    ${bubbleChip(442, 256, 36, p[2], '∛', 44)}
    ${stars(seed, 6)}`,
    'Sqrt Tower'
  );
}

function layoutInfinityLoop(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':inf');
  // Big ∞ in middle + symbols traveling on the loop
  const symbols = shuffle([...CONSTANTS, ...OPS, ...GREEK.slice(0, 6)], rand).slice(0, 10);
  // Parametric lemniscate of Bernoulli: x = a cos t /(1+sin²t), y = a sin t cos t /(1+sin²t)
  const a = 200;
  const out = symbols.map((g, i) => {
    const t = (i / symbols.length) * 2 * Math.PI;
    const denom = 1 + Math.sin(t) ** 2;
    const x = (a * Math.cos(t)) / denom;
    const y = (a * Math.sin(t) * Math.cos(t)) / denom;
    return bubbleChip((256 + x).toFixed(1), (256 + y).toFixed(1), 26, pick(p, i), g, g.length > 1 ? 24 : 36);
  }).join('\n  ');
  // Draw the lemniscate as path for context
  const pts = [];
  const steps = 64;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const denom = 1 + Math.sin(t) ** 2;
    const x = (a * Math.cos(t)) / denom;
    const y = (a * Math.sin(t) * Math.cos(t)) / denom;
    pts.push(`${(256 + x).toFixed(1)},${(256 + y).toFixed(1)}`);
  }
  return svgWrap(
    `${bubbles(seed)}
    <polyline points="${pts.join(' ')}" fill="none" stroke="${p[3]}" stroke-width="14" opacity="0.85"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#ffffff" stroke-width="4" opacity="0.85"/>
    <text x="256" y="50" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="36" fill="${p[0]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">无穷环</text>
    ${out}
    ${stars(seed, 7)}`,
    'Infinity Loop'
  );
}

function layoutBigFormulaTrio(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':trio');
  const chosen = shuffle(FORMULAS, rand).slice(0, 3);
  const out = chosen.map((f, i) => ticket(256, 130 + i * 130, 400, 88, pick(p, i), f, f.length > 12 ? 28 : 36)).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <text x="256" y="56" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="38" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">公式三连</text>
    ${out}
    ${stars(seed, 6)}`,
    'Formula Trio'
  );
}

function layoutPiBig(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':pibig');
  const hero = '3.14159';
  const accents = shuffle([...HERO, ...CONSTANTS, ...OPS], rand).slice(0, 6);
  const corners = [[90, 110], [422, 110], [90, 396], [422, 396], [256, 88], [256, 424]];
  const acc = corners.map(([cx, cy], i) => bubbleChip(cx, cy, 36, pick(p, i + 1), accents[i], 44)).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <circle cx="256" cy="256" r="130" fill="${p[0]}" stroke="#3b3b6b" stroke-width="8"/>
    <text x="256" y="290" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="170" fill="#ffffff" stroke="#3b3b6b" stroke-width="7" paint-order="stroke fill">π</text>
    <rect x="106" y="408" width="300" height="58" rx="22" fill="${p[2]}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="450" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="36" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${xmlEscape(hero)}</text>
    ${acc}
    ${stars(seed, 9)}`,
    'Pi Big'
  );
}

function layoutInfinityBig(seed) {
  const p = paletteFor(seed);
  const rand = rng(seed + ':infbig');
  const accents = shuffle([...HERO, ...CONSTANTS, ...OPS, ...DIGITS], rand).slice(0, 6);
  const corners = [[90, 110], [422, 110], [90, 396], [422, 396], [256, 88], [256, 424]];
  const acc = corners.map(([cx, cy], i) => bubbleChip(cx, cy, 36, pick(p, i + 2), accents[i], accents[i].length > 1 ? 28 : 44)).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    <rect x="76" y="190" width="360" height="160" rx="80" fill="${p[1]}" stroke="#3b3b6b" stroke-width="8"/>
    <text x="256" y="306" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="160" fill="#ffffff" stroke="#3b3b6b" stroke-width="7" paint-order="stroke fill">∞</text>
    ${acc}
    ${stars(seed, 9)}`,
    'Infinity Big'
  );
}

// ---------------- Render 100 ----------------

const LAYOUTS = [
  layoutOrbit, layoutGrid, layoutDiagonal, layoutSpiral, layoutConstellation,
  layoutTriptych, layoutHeroCard, layoutCluster, layoutEulerSpotlight, layoutSqrtTower,
  layoutInfinityLoop, layoutBigFormulaTrio, layoutPiBig, layoutInfinityBig,
];

const TOTAL = 100;

(async () => {
  let ok = 0, fail = 0;
  for (let i = 1; i <= TOTAL; i++) {
    const seed = `mix-${i.toString().padStart(3, '0')}`;
    const layout = LAYOUTS[(hash(seed) + i) % LAYOUTS.length];
    const svg = layout(seed);
    const out = path.join(OUT, `collage-mix-${i.toString().padStart(3, '0')}.png`);
    try {
      await sharp(Buffer.from(svg, 'utf8'), { density: 192 })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(out);
      ok++;
    } catch (e) {
      fail++;
      console.error(`FAIL ${seed}: ${e.message}`);
    }
  }
  console.log(`Wrote ${ok} PNGs, ${fail} failures.`);
})();
