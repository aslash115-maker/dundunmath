// Two π-themed orbit images: digits of π on 1 ring and 2 rings.
// Style matches collage-mix-078 (orbit layout, kid sticker, transparent 1:1).
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'img');
const SIZE = 512;

// Same palette family as collage-mix-078 (soft purple/pink/teal/yellow).
const P = ['#F7B2BD', '#FFE066', '#A0E8AF', '#6FD2C7', '#B388EB'];

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

function bubbles(seed, n = 9, opacity = 0.14) {
  const r = rng(seed + ':bub');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 16 + r() * 480;
    const cy = 16 + r() * 480;
    const rr = 22 + r() * 78;
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pick(P, i)}" opacity="${opacity}"/>`);
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
function bubbleChip(cx, cy, r, fill, glyph, fontSize) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${r}" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="0" y="${(fontSize * 0.36).toFixed(1)}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${fontSize}" fill="#ffffff" stroke="#3b3b6b" stroke-width="4" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}

// π digits — first 70 should be plenty for two rings
const PI_DIGITS = '3.1415926535897932384626433832795028841971693993751058209749445923078164';

function buildRing(digits, radius, chipR, fontSize, seedTag) {
  const n = digits.length;
  const out = [];
  for (let i = 0; i < n; i++) {
    // Start at top (-90°), go clockwise.
    const ang = (i / n) * 2 * Math.PI - Math.PI / 2;
    const cx = 256 + Math.cos(ang) * radius;
    const cy = 256 + Math.sin(ang) * radius;
    // Color cycles through palette, offset per ring so the two rings look distinct.
    out.push(bubbleChip(cx.toFixed(1), cy.toFixed(1), chipR, pick(P, i + seedTag), digits[i], fontSize));
  }
  return out.join('\n  ');
}

function piCenter() {
  return `<circle cx="256" cy="256" r="100" fill="${P[4]}" stroke="#3b3b6b" stroke-width="7"/>
    <text x="256" y="290" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="120" fill="#ffffff" stroke="#3b3b6b" stroke-width="6" paint-order="stroke fill">π</text>`;
}

function svgWrap(inner, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>${xmlEscape(title)}</title>
  ${inner}
</svg>`;
}

// --- Variant 1: single ring, 16 digits ---
function onePiRing() {
  const seed = 'pi-ring-1';
  const digits = PI_DIGITS.slice(0, 16); // "3.141592653589793"
  return svgWrap(
    `${bubbles(seed, 10)}
    ${piCenter()}
    ${buildRing(digits, 180, 30, 44, 0)}
    ${stars(seed, 8)}`,
    'π Single Ring'
  );
}

// --- Variant 2: two rings, 16 inner + 28 outer ---
function twoPiRings() {
  const seed = 'pi-ring-2';
  const inner = PI_DIGITS.slice(0, 16);
  const outer = PI_DIGITS.slice(16, 16 + 28); // next 28 digits
  return svgWrap(
    `${bubbles(seed, 10)}
    ${piCenter()}
    ${buildRing(inner, 160, 26, 38, 0)}
    ${buildRing(outer, 225, 22, 30, 2)}
    ${stars(seed, 10)}`,
    'π Double Ring'
  );
}

(async () => {
  const items = [
    ['collage-pi-digits-ring1.png', onePiRing()],
    ['collage-pi-digits-ring2.png', twoPiRings()],
  ];
  for (const [name, svg] of items) {
    const dst = path.join(OUT, name);
    await sharp(Buffer.from(svg, 'utf8'), { density: 192 })
      .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9 })
      .toFile(dst);
    console.log(`wrote ${dst}`);
  }
})();
