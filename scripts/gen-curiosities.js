// Generate "math curiosities" image set: Möbius strip, Klein bottle, Penrose
// triangle, Necker cube, Sierpinski triangle, Koch snowflake, Fibonacci
// spiral, tesseract, Borromean rings, trefoil knot, Hilbert curve,
// Königsberg bridges, magic square, pentagram.
//
// Style matches existing collages (kid sticker, navy outlines, candy palette,
// bubble bg, sparkles). 1:1, transparent.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'img');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const SIZE = 512;

const PALETTES = [
  ['#FF6B9D', '#FFD93D', '#6BCB77', '#4D96FF', '#A66CFF'],
  ['#FF9F1C', '#FFBF69', '#2EC4B6', '#E71D36', '#7678ED'],
  ['#F7B2BD', '#FFE066', '#A0E8AF', '#6FD2C7', '#B388EB'],
  ['#FF87B2', '#FFCB77', '#17C3B2', '#227C9D', '#FE6D73'],
  ['#FFADAD', '#FFD6A5', '#CAFFBF', '#9BF6FF', '#BDB2FF'],
  ['#FCA17D', '#FFD972', '#9AE19D', '#7DCFB6', '#9C89B8'],
];

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
function pick(arr, i) { return arr[((i % arr.length) + arr.length) % arr.length]; }
function paletteFor(seed) { return PALETTES[hash(seed + ':pal') % PALETTES.length]; }
function xmlEscape(s) { return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;'); }

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

function titleBar(text, fill) {
  return `<rect x="56" y="36" width="400" height="58" rx="22" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="78" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="34" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${xmlEscape(text)}</text>`;
}
function captionBar(text, fill, y = 442) {
  return `<rect x="56" y="${y - 32}" width="400" height="56" rx="20" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="${y + 6}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="${text.length > 18 ? 22 : 26}" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${xmlEscape(text)}</text>`;
}

// ===================== Topics =====================

// Möbius strip — drawn as an elongated 8-shape band with hatching.
function mobiusStrip() {
  const seed = 'mobius';
  const p = paletteFor(seed);
  // Parametric lemniscate ribbon: outline two offset copies of a lemniscate.
  const a = 170;
  function lem(t) {
    const denom = 1 + Math.sin(t) ** 2;
    return [(a * Math.cos(t)) / denom, (a * Math.sin(t) * Math.cos(t)) / denom];
  }
  // Outer & inner offsets along normal direction.
  const steps = 200, w = 32;
  const outer = [], inner = [];
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const [x, y] = lem(t);
    const dx = Math.cos(t + 0.1) - Math.cos(t - 0.1);
    const dy = Math.sin(t + 0.1) - Math.sin(t - 0.1);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    // Twist width to suggest the band flipping.
    const ww = w * (0.6 + 0.5 * Math.cos(t * 2));
    outer.push(`${(256 + x + nx * ww).toFixed(1)},${(256 + y + ny * ww).toFixed(1)}`);
    inner.push(`${(256 + x - nx * ww).toFixed(1)},${(256 + y - ny * ww).toFixed(1)}`);
  }
  const ribbon = `<path d="M ${outer.join(' L ')} L ${inner.slice().reverse().join(' L ')} Z" fill="${p[0]}" stroke="#3b3b6b" stroke-width="6"/>`;
  // Hatching to suggest curvature.
  const hatch = [];
  for (let i = 0; i < 40; i++) {
    const t = (i / 40) * 2 * Math.PI;
    const [x, y] = lem(t);
    const dx = Math.cos(t + 0.1) - Math.cos(t - 0.1);
    const dy = Math.sin(t + 0.1) - Math.sin(t - 0.1);
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const ww = w * (0.6 + 0.5 * Math.cos(t * 2));
    hatch.push(`<line x1="${(256 + x + nx * ww).toFixed(1)}" y1="${(256 + y + ny * ww).toFixed(1)}" x2="${(256 + x - nx * ww).toFixed(1)}" y2="${(256 + y - ny * ww).toFixed(1)}" stroke="${p[3]}" stroke-width="2" opacity="0.6"/>`);
  }
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('莫比乌斯环', p[3])}
    <g transform="translate(0 30)">${ribbon}
    ${hatch.join('\n  ')}
    </g>
    ${captionBar('只有一个面 · 只有一条边', p[2])}
    ${stars(seed, 8)}`,
    'Möbius Strip'
  );
}

// Klein bottle — stylized 2D projection with handle going through itself.
function kleinBottle() {
  const seed = 'klein';
  const p = paletteFor(seed);
  // Use Sierra-like silhouette: bulb + neck + curved handle.
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('克莱因瓶', p[4] || p[0])}
    <g transform="translate(256 280)">
      <!-- main bulb -->
      <ellipse cx="0" cy="40" rx="115" ry="110" fill="${p[0]}" stroke="#3b3b6b" stroke-width="6"/>
      <!-- neck going up -->
      <path d="M -45 -50 Q -55 -130 50 -160 Q 150 -180 150 -90 Q 150 -10 90 30" fill="none" stroke="#3b3b6b" stroke-width="40" stroke-linecap="round"/>
      <path d="M -45 -50 Q -55 -130 50 -160 Q 150 -180 150 -90 Q 150 -10 90 30" fill="none" stroke="${p[2]}" stroke-width="30" stroke-linecap="round"/>
      <!-- intersection circle (where neck enters bulb) -->
      <ellipse cx="62" cy="-2" rx="22" ry="8" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <!-- bottom opening hint -->
      <ellipse cx="0" cy="148" rx="80" ry="14" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4" opacity="0.85"/>
      <!-- top opening of neck -->
      <ellipse cx="-45" cy="-50" rx="22" ry="8" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
    </g>
    ${captionBar('没有内外之分的瓶子', p[1])}
    ${stars(seed, 8)}`,
    'Klein Bottle'
  );
}

// Penrose triangle — classic impossible figure built from three "L-bars"
// arranged 120° apart, each appearing to pass over the next.
function penroseTriangle() {
  const seed = 'penrose';
  const p = paletteFor(seed);
  // Build three identical bars in local coords pointing along +X, then rotate
  // each by 0/120/240 around the centroid. Each bar is a parallelogram with
  // a notch cut out where the next bar visually passes over.
  // Coordinates form a "thick L" that hugs one side of an equilateral triangle.
  const colors = [p[0], p[2], p[3]];
  const arms = [];
  for (let i = 0; i < 3; i++) {
    const ang = i * 120;
    // Bar: from left-tip (outer) along base to right-tip (outer), then the
    // upper edge running inward and back. The right end has a small notch
    // to expose the *next* bar coming from the side, creating the illusion.
    arms.push(`<g transform="translate(256 285) rotate(${ang})">
      <!-- main bar shape -->
      <polygon points="-150,90 150,90 110,40 -110,40" fill="${colors[i]}" stroke="#3b3b6b" stroke-width="6"/>
      <!-- short stub that ramps up at the right end (the "over" cue) -->
      <polygon points="150,90 110,40 158,8 188,52" fill="${colors[i]}" stroke="#3b3b6b" stroke-width="6"/>
    </g>`);
  }
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('彭罗斯三角', p[1])}
    ${arms.join('\n  ')}
    ${captionBar('看起来真实却无法存在', p[3])}
    ${stars(seed, 7)}`,
    'Penrose Triangle'
  );
}

// Necker cube — wireframe cube with the two interpretations highlighted.
function neckerCube() {
  const seed = 'necker';
  const p = paletteFor(seed);
  // Front square + back square + connecting edges.
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('内克尔立方体', p[3])}
    <g transform="translate(256 260)" fill="none" stroke="#3b3b6b" stroke-width="7" stroke-linejoin="round">
      <!-- back face -->
      <rect x="-50" y="-110" width="140" height="140" fill="${p[2]}" opacity="0.6"/>
      <!-- front face -->
      <rect x="-110" y="-50" width="140" height="140" fill="${p[0]}" opacity="0.85"/>
      <!-- connecting edges -->
      <line x1="-110" y1="-50" x2="-50" y2="-110"/>
      <line x1="30" y1="-50" x2="90" y2="-110"/>
      <line x1="-110" y1="90" x2="-50" y2="30"/>
      <line x1="30" y1="90" x2="90" y2="30"/>
    </g>
    ${captionBar('正面在前？还是在后？', p[4] || p[1])}
    ${stars(seed, 8)}`,
    'Necker Cube'
  );
}

// Sierpinski triangle — recursive subdivision.
function sierpinski() {
  const seed = 'sierp';
  const p = paletteFor(seed);
  function tri(x1, y1, x2, y2, x3, y3, depth) {
    if (depth === 0) {
      return `<polygon points="${x1.toFixed(1)},${y1.toFixed(1)} ${x2.toFixed(1)},${y2.toFixed(1)} ${x3.toFixed(1)},${y3.toFixed(1)}" fill="${pick(p, depth + Math.floor(x1 + y1))}" stroke="#3b3b6b" stroke-width="1.5"/>`;
    }
    const m12 = [(x1 + x2) / 2, (y1 + y2) / 2];
    const m23 = [(x2 + x3) / 2, (y2 + y3) / 2];
    const m31 = [(x3 + x1) / 2, (y3 + y1) / 2];
    return [
      tri(x1, y1, m12[0], m12[1], m31[0], m31[1], depth - 1),
      tri(m12[0], m12[1], x2, y2, m23[0], m23[1], depth - 1),
      tri(m31[0], m31[1], m23[0], m23[1], x3, y3, depth - 1),
    ].join('\n  ');
  }
  const v1 = [256, 130], v2 = [110, 400], v3 = [402, 400];
  const fractal = tri(v1[0], v1[1], v2[0], v2[1], v3[0], v3[1], 5);
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('谢尔宾斯基三角', p[0])}
    <polygon points="${v1[0]},${v1[1]} ${v2[0]},${v2[1]} ${v3[0]},${v3[1]}" fill="${p[1]}" stroke="#3b3b6b" stroke-width="5"/>
    ${fractal}
    ${captionBar('无穷自相似的三角', p[3])}
    ${stars(seed, 7)}`,
    'Sierpinski Triangle'
  );
}

// Koch snowflake — recursive bump on each edge.
function kochSnowflake() {
  const seed = 'koch';
  const p = paletteFor(seed);
  function koch(p1, p2, depth) {
    if (depth === 0) return [p1, p2];
    const [x1, y1] = p1, [x2, y2] = p2;
    const dx = x2 - x1, dy = y2 - y1;
    const a = [x1 + dx / 3, y1 + dy / 3];
    const b = [x1 + 2 * dx / 3, y1 + 2 * dy / 3];
    // Tip rotated -60° around a.
    const ang = -Math.PI / 3;
    const ax = b[0] - a[0], ay = b[1] - a[1];
    const tip = [a[0] + ax * Math.cos(ang) - ay * Math.sin(ang), a[1] + ax * Math.sin(ang) + ay * Math.cos(ang)];
    const s1 = koch(p1, a, depth - 1);
    const s2 = koch(a, tip, depth - 1);
    const s3 = koch(tip, b, depth - 1);
    const s4 = koch(b, p2, depth - 1);
    // Each subcall returns endpoints sequence; concatenate.
    return [...s1, ...s2.slice(1), ...s3.slice(1), ...s4.slice(1)];
  }
  const r = 180, cx = 256, cy = 280;
  const corners = [0, 1, 2].map(i => {
    const a = -Math.PI / 2 + i * (2 * Math.PI / 3);
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  });
  const e1 = koch(corners[0], corners[1], 4);
  const e2 = koch(corners[1], corners[2], 4);
  const e3 = koch(corners[2], corners[0], 4);
  const all = [...e1, ...e2.slice(1), ...e3.slice(1)];
  const pts = all.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('科赫雪花', p[3])}
    <polygon points="${pts}" fill="${p[2]}" stroke="#3b3b6b" stroke-width="4" stroke-linejoin="round"/>
    ${captionBar('面积有限，周长无限', p[0])}
    ${stars(seed, 8)}`,
    'Koch Snowflake'
  );
}

// Fibonacci spiral on a tiling of squares.
function fibonacciSpiral() {
  const seed = 'fib';
  const p = paletteFor(seed);
  // Sizes (Fibonacci): 1,1,2,3,5,8,13,21,34,55 (scaled).
  const sizes = [1, 1, 2, 3, 5, 8, 13];
  const unit = 11;
  // Place squares in a spiral pattern (classic Fibonacci layout).
  // Directions cycle: right, up, left, down.
  let x = 256, y = 256;
  const placements = [];
  // Layout: place the small square to the right of previous big edge.
  // To keep it simple, hand-place by computing positions deterministically.
  const dirs = [[1, 0], [0, -1], [-1, 0], [0, 1]];
  const corners = [[1, 1], [1, -1], [-1, -1], [-1, 1]]; // sq aligns to this corner of bbox
  // Build incrementally starting with two unit squares.
  let bbox = { minX: 0, minY: 0, maxX: 0, maxY: 0 };
  let prev = null;
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i] * unit;
    let sx, sy;
    if (i === 0) { sx = 0; sy = 0; }
    else if (i === 1) { sx = sizes[0] * unit; sy = 0; }
    else {
      const dirIdx = (i - 2) % 4;
      // place against side bbox.{right|top|left|bottom}
      if (dirIdx === 0) { sx = bbox.maxX; sy = bbox.minY - s; }
      else if (dirIdx === 1) { sx = bbox.minX - s; sy = bbox.minY - s; sy = bbox.minY; sx = bbox.minX - s; }
      else if (dirIdx === 2) { sx = bbox.minX - s; sy = bbox.maxY; sx = bbox.minX; sy = bbox.maxY; sx -= 0; }
      else { sx = bbox.maxX; sy = bbox.maxY; sx = bbox.maxX - 0; sy = bbox.maxY; }
    }
    // The above is messy; switch to canonical algorithm:
  }
  // Canonical Fibonacci square tiling, in local coords:
  // Square i has side F[i]; placement alternates around the cluster.
  // Algorithm: maintain bbox; place next square on the side dictated by i%4.
  bbox = null;
  const sqs = [];
  for (let i = 0; i < sizes.length; i++) {
    const s = sizes[i] * unit;
    let x0, y0;
    if (!bbox) { x0 = 0; y0 = 0; bbox = { x: 0, y: 0, w: s, h: s }; }
    else {
      const dir = i % 4;
      if (dir === 0) { x0 = bbox.x + bbox.w; y0 = bbox.y; bbox = { x: bbox.x, y: bbox.y, w: bbox.w + s, h: Math.max(bbox.h, s) }; }
      else if (dir === 1) { x0 = bbox.x; y0 = bbox.y - s; bbox = { x: bbox.x, y: bbox.y - s, w: bbox.w, h: bbox.h + s }; }
      else if (dir === 2) { x0 = bbox.x - s; y0 = bbox.y; bbox = { x: bbox.x - s, y: bbox.y, w: bbox.w + s, h: bbox.h }; }
      else { x0 = bbox.x; y0 = bbox.y + bbox.h; bbox = { x: bbox.x, y: bbox.y, w: bbox.w, h: bbox.h + s }; }
    }
    sqs.push({ x: x0, y: y0, s, i });
  }
  // Center the tiling in the canvas.
  const cx = bbox.x + bbox.w / 2;
  const cy = bbox.y + bbox.h / 2;
  const ox = 256 - cx;
  const oy = 280 - cy;
  const rectsSvg = sqs.map(sq => `<rect x="${(sq.x + ox).toFixed(1)}" y="${(sq.y + oy).toFixed(1)}" width="${sq.s}" height="${sq.s}" fill="${pick(p, sq.i)}" stroke="#3b3b6b" stroke-width="3"/>`).join('\n  ');
  // Arcs: a quarter-circle inside each square (radius = side). Direction cycles.
  const arcs = sqs.map((sq, i) => {
    const dir = i % 4;
    let sxp, syp, exp, eyp;
    if (dir === 0) { sxp = sq.x; syp = sq.y + sq.s; exp = sq.x + sq.s; eyp = sq.y; }
    else if (dir === 1) { sxp = sq.x + sq.s; syp = sq.y + sq.s; exp = sq.x; eyp = sq.y; }
    else if (dir === 2) { sxp = sq.x + sq.s; syp = sq.y; exp = sq.x; eyp = sq.y + sq.s; }
    else { sxp = sq.x; syp = sq.y; exp = sq.x + sq.s; eyp = sq.y + sq.s; }
    return `<path d="M ${(sxp + ox).toFixed(1)} ${(syp + oy).toFixed(1)} A ${sq.s} ${sq.s} 0 0 1 ${(exp + ox).toFixed(1)} ${(eyp + oy).toFixed(1)}" fill="none" stroke="#3b3b6b" stroke-width="4"/>`;
  }).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('斐波那契螺旋', p[0])}
    ${rectsSvg}
    ${arcs}
    ${captionBar('1 1 2 3 5 8 13 21 …', p[3])}
    ${stars(seed, 8)}`,
    'Fibonacci Spiral'
  );
}

// Tesseract — square inside a square with connecting diagonals.
function tesseract() {
  const seed = 'tess';
  const p = paletteFor(seed);
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('四维超立方体', p[2])}
    <g transform="translate(256 270)">
      <!-- outer cube outline -->
      <rect x="-160" y="-160" width="320" height="320" fill="${p[0]}" opacity="0.6" stroke="#3b3b6b" stroke-width="6"/>
      <!-- inner cube -->
      <rect x="-80" y="-80" width="160" height="160" fill="${p[3]}" opacity="0.85" stroke="#3b3b6b" stroke-width="6"/>
      <!-- connecting edges -->
      <line x1="-160" y1="-160" x2="-80" y2="-80" stroke="#3b3b6b" stroke-width="5"/>
      <line x1="160" y1="-160" x2="80" y2="-80" stroke="#3b3b6b" stroke-width="5"/>
      <line x1="-160" y1="160" x2="-80" y2="80" stroke="#3b3b6b" stroke-width="5"/>
      <line x1="160" y1="160" x2="80" y2="80" stroke="#3b3b6b" stroke-width="5"/>
    </g>
    ${captionBar('立方体的立方体', p[4] || p[1])}
    ${stars(seed, 8)}`,
    'Tesseract'
  );
}

// Borromean rings — three interlocked circles.
function borromeanRings() {
  const seed = 'borr';
  const p = paletteFor(seed);
  const r = 110;
  const cx = 256, cy = 280;
  const offset = 70;
  const angles = [-Math.PI / 2, Math.PI / 6, 5 * Math.PI / 6];
  const centers = angles.map(a => [cx + Math.cos(a) * offset, cy + Math.sin(a) * offset]);
  const colors = [p[0], p[2], p[3]];
  // Draw each ring as two stroked circles to simulate over/under via clipping isn't simple; use thick rings and dashing.
  const rings = centers.map((c, i) =>
    `<circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r}" fill="none" stroke="${colors[i]}" stroke-width="18"/>
     <circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r}" fill="none" stroke="#3b3b6b" stroke-width="3"/>
     <circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r - 9}" fill="none" stroke="#3b3b6b" stroke-width="3"/>
     <circle cx="${c[0].toFixed(1)}" cy="${c[1].toFixed(1)}" r="${r + 9}" fill="none" stroke="#3b3b6b" stroke-width="3"/>`).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('博罗梅奥环', p[1])}
    ${rings}
    ${captionBar('三个互锁，去一即散', p[4] || p[0])}
    ${stars(seed, 7)}`,
    'Borromean Rings'
  );
}

// Trefoil knot — simple parametric (p=2, q=3) curve.
function trefoilKnot() {
  const seed = 'trefoil';
  const p = paletteFor(seed);
  const pts = [];
  const steps = 320;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const x = Math.sin(t) + 2 * Math.sin(2 * t);
    const y = Math.cos(t) - 2 * Math.cos(2 * t);
    pts.push(`${(256 + x * 60).toFixed(1)},${(280 + y * 60).toFixed(1)}`);
  }
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('三叶结', p[3])}
    <polyline points="${pts.join(' ')}" fill="none" stroke="${p[0]}" stroke-width="22" stroke-linecap="round"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#3b3b6b" stroke-width="4" stroke-linecap="round"/>
    ${captionBar('最简单的真结', p[2])}
    ${stars(seed, 7)}`,
    'Trefoil Knot'
  );
}

// Hilbert curve — space-filling at depth 3.
function hilbertCurve() {
  const seed = 'hilbert';
  const p = paletteFor(seed);
  // Hilbert curve generator using L-system style recursion.
  const depth = 4;
  const N = 1 << depth; // 16
  function rot(n, x, y, rx, ry) {
    if (ry === 0) {
      if (rx === 1) {
        x = n - 1 - x;
        y = n - 1 - y;
      }
      return [y, x];
    }
    return [x, y];
  }
  function d2xy(n, d) {
    let rx, ry, t = d;
    let x = 0, y = 0;
    for (let s = 1; s < n; s *= 2) {
      rx = 1 & (t / 2);
      ry = 1 & (t ^ rx);
      [x, y] = rot(s, x, y, rx, ry);
      x += s * rx; y += s * ry;
      t = Math.floor(t / 4);
    }
    return [x, y];
  }
  const cell = 22;
  const offset = 256 - (N * cell) / 2;
  const offsetY = 280 - (N * cell) / 2;
  const pts = [];
  for (let i = 0; i < N * N; i++) {
    const [x, y] = d2xy(N, i);
    pts.push(`${(offset + x * cell + cell / 2).toFixed(1)},${(offsetY + y * cell + cell / 2).toFixed(1)}`);
  }
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('希尔伯特曲线', p[2])}
    <polyline points="${pts.join(' ')}" fill="none" stroke="${p[0]}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#3b3b6b" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${captionBar('填满整个平面', p[3])}
    ${stars(seed, 7)}`,
    'Hilbert Curve'
  );
}

// Königsberg bridges — schematic with 4 land masses and 7 bridges.
function konigsberg() {
  const seed = 'konig';
  const p = paletteFor(seed);
  // Two riverbanks, two islands.
  const nodes = [
    { cx: 256, cy: 150, r: 44, name: 'A' }, // north bank
    { cx: 256, cy: 380, r: 44, name: 'B' }, // south bank
    { cx: 140, cy: 265, r: 38, name: 'C' }, // left island
    { cx: 372, cy: 265, r: 38, name: 'D' }, // right island
  ];
  // 7 bridges as curved lines between specific pairs (multi-edges allowed).
  const bridges = [
    [0, 2, -30], [0, 2, 30],   // A-C ×2
    [0, 3, -30], [0, 3, 30],   // A-D ×2
    [1, 2, -30],               // B-C
    [1, 3, -30],               // B-D
    [2, 3, 0],                 // C-D
  ];
  const bridgeSvg = bridges.map(([i, j, bend]) => {
    const a = nodes[i], b = nodes[j];
    const mx = (a.cx + b.cx) / 2, my = (a.cy + b.cy) / 2;
    // Perpendicular offset for bend.
    const dx = b.cx - a.cx, dy = b.cy - a.cy;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const ctrl = [mx + nx * bend, my + ny * bend];
    return `<path d="M ${a.cx} ${a.cy} Q ${ctrl[0].toFixed(1)} ${ctrl[1].toFixed(1)} ${b.cx} ${b.cy}" fill="none" stroke="${p[1]}" stroke-width="10" stroke-linecap="round"/>
            <path d="M ${a.cx} ${a.cy} Q ${ctrl[0].toFixed(1)} ${ctrl[1].toFixed(1)} ${b.cx} ${b.cy}" fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>`;
  }).join('\n  ');
  const nodeSvg = nodes.map((n, i) => `<circle cx="${n.cx}" cy="${n.cy}" r="${n.r}" fill="${pick(p, i + 2)}" stroke="#3b3b6b" stroke-width="6"/>
    <text x="${n.cx}" y="${n.cy + 10}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="34" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${n.name}</text>`).join('\n  ');
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('柯尼斯堡七桥', p[3])}
    ${bridgeSvg}
    ${nodeSvg}
    ${captionBar('一笔画？欧拉说不行', p[4] || p[0])}
    ${stars(seed, 7)}`,
    'Königsberg Bridges'
  );
}

// 3×3 magic square (Lo Shu).
function magicSquare() {
  const seed = 'magic';
  const p = paletteFor(seed);
  const grid = [[2, 7, 6], [9, 5, 1], [4, 3, 8]];
  const size = 100, startX = 256 - 1.5 * size, startY = 180;
  const cells = [];
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = startX + c * size;
      const y = startY + r * size;
      cells.push(`<rect x="${x}" y="${y}" width="${size}" height="${size}" rx="14" fill="${pick(p, r * 3 + c)}" stroke="#3b3b6b" stroke-width="5"/>
        <text x="${x + size / 2}" y="${y + size / 2 + 22}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900" font-size="56" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${grid[r][c]}</text>`);
    }
  }
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('幻方 · 洛书', p[3])}
    ${cells.join('\n  ')}
    ${captionBar('横竖斜都等于 15', p[0])}
    ${stars(seed, 7)}`,
    'Magic Square'
  );
}

// Pentagram inside a circle (golden ratio cameo).
function pentagram() {
  const seed = 'pent';
  const p = paletteFor(seed);
  const r = 180, cx = 256, cy = 280;
  const verts = [];
  for (let i = 0; i < 5; i++) {
    const a = -Math.PI / 2 + i * (2 * Math.PI / 5);
    verts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  // Connect every other vertex (0->2->4->1->3->0).
  const order = [0, 2, 4, 1, 3, 0];
  const path = order.map(i => `${verts[i][0].toFixed(1)},${verts[i][1].toFixed(1)}`).join(' ');
  return svgWrap(
    `${bubbles(seed)}
    ${titleBar('五角星 · 黄金比', p[2])}
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${p[1]}" opacity="0.5" stroke="#3b3b6b" stroke-width="5"/>
    <polyline points="${path}" fill="${p[0]}" fill-rule="evenodd" stroke="#3b3b6b" stroke-width="6" stroke-linejoin="round"/>
    <text x="${cx}" y="${cy + 18}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="56" fill="#ffffff" stroke="#3b3b6b" stroke-width="5" paint-order="stroke fill">φ</text>
    ${captionBar('φ = (1+√5)/2 ≈ 1.618', p[3])}
    ${stars(seed, 8)}`,
    'Pentagram & Golden Ratio'
  );
}

// ===== Render =====
const items = [
  ['curiosity-mobius-strip.png', mobiusStrip()],
  ['curiosity-klein-bottle.png', kleinBottle()],
  ['curiosity-penrose-triangle.png', penroseTriangle()],
  ['curiosity-necker-cube.png', neckerCube()],
  ['curiosity-sierpinski.png', sierpinski()],
  ['curiosity-koch-snowflake.png', kochSnowflake()],
  ['curiosity-fibonacci-spiral.png', fibonacciSpiral()],
  ['curiosity-tesseract.png', tesseract()],
  ['curiosity-borromean-rings.png', borromeanRings()],
  ['curiosity-trefoil-knot.png', trefoilKnot()],
  ['curiosity-hilbert-curve.png', hilbertCurve()],
  ['curiosity-konigsberg.png', konigsberg()],
  ['curiosity-magic-square.png', magicSquare()],
  ['curiosity-pentagram.png', pentagram()],
];

(async () => {
  let ok = 0, fail = 0;
  for (const [name, svg] of items) {
    try {
      await sharp(Buffer.from(svg, 'utf8'), { density: 192 })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(path.join(OUT, name));
      ok++;
    } catch (e) {
      fail++;
      console.error(`FAIL ${name}: ${e.message}`);
    }
  }
  console.log(`Wrote ${ok} files, ${fail} failures.`);
})();
