// Chibi character + math symbol stickers (1:1 transparent PNG).
// 角色：孙悟空、哪吒、玉兔、龙、葫芦娃、猪八戒
// 配合：∞ π √ φ Σ 七等符号 / 数字
// 风格沿用之前的贴纸风：navy 描边、糖果配色、气泡背景、星星。
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const OUT = path.resolve(__dirname, '..', 'img');
if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
const SIZE = 512;

const PALETTES = {
  wukong:    ['#FFD93D', '#F94144', '#FF9F1C', '#7A4E2D', '#FFFBEC'],
  nezha:     ['#FF6B9D', '#FFE066', '#4D96FF', '#C71F37', '#FFFBEC'],
  rabbit:    ['#FFE5F1', '#FFC6FF', '#A0C4FF', '#BDB2FF', '#FFFBEC'],
  dragon:    ['#2EC4B6', '#17C3B2', '#7BD3F7', '#A66CFF', '#FFD93D'],
  gourd:     ['#6BCB77', '#FFD93D', '#FF6B9D', '#A66CFF', '#FFFBEC'],
  pig:       ['#FFC6E0', '#FF9DC4', '#FFD6A5', '#9BF6FF', '#FFFBEC'],
};

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

function svgWrap(inner, title) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${SIZE} ${SIZE}" width="${SIZE}" height="${SIZE}">
  <title>${xmlEscape(title)}</title>
  ${inner}
</svg>`;
}
function bubbles(seed, palette, n = 9, opacity = 0.16) {
  const r = rng(seed + ':bub');
  const out = [];
  for (let i = 0; i < n; i++) {
    const cx = 16 + r() * 480;
    const cy = 16 + r() * 480;
    const rr = 24 + r() * 76;
    out.push(`<circle cx="${cx.toFixed(1)}" cy="${cy.toFixed(1)}" r="${rr.toFixed(1)}" fill="${pick(palette, i)}" opacity="${opacity}"/>`);
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
  return `<rect x="56" y="32" width="400" height="56" rx="22" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="72" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="32" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${xmlEscape(text)}</text>`;
}
function captionBar(text, fill, y = 462) {
  return `<rect x="56" y="${y - 30}" width="400" height="52" rx="20" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="256" y="${y + 6}" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="${text.length > 16 ? 22 : 26}" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${xmlEscape(text)}</text>`;
}
function bigGlyph(cx, cy, glyph, fill, size = 100) {
  return `<g transform="translate(${cx} ${cy})">
    <circle r="${size * 0.7}" fill="${fill}" stroke="#3b3b6b" stroke-width="6"/>
    <text x="0" y="${(size * 0.36).toFixed(1)}" text-anchor="middle"
      font-family="'Comic Sans MS','Baloo','Nunito',sans-serif" font-weight="900"
      font-size="${size}" fill="#ffffff" stroke="#3b3b6b" stroke-width="6" paint-order="stroke fill">${xmlEscape(glyph)}</text>
  </g>`;
}

// ---------------- 角色 ----------------

// 孙悟空：金箍 + 黄面 + 大眼 + 金箍棒指向 ∞
function wukong() {
  const seed = 'wukong';
  const p = PALETTES.wukong;
  // Head ellipse + ears + crown band
  return svgWrap(
    `${bubbles(seed, p, 10)}
    ${titleBar('齐天大圣 · ∞', p[1])}

    <g transform="translate(180 280)">
      <!-- ears -->
      <ellipse cx="-92" cy="-10" rx="22" ry="34" fill="${p[0]}" stroke="#3b3b6b" stroke-width="5"/>
      <ellipse cx="92" cy="-10" rx="22" ry="34" fill="${p[0]}" stroke="#3b3b6b" stroke-width="5"/>
      <ellipse cx="-92" cy="-10" rx="10" ry="20" fill="#ffd9a8" stroke="#3b3b6b" stroke-width="2"/>
      <ellipse cx="92" cy="-10" rx="10" ry="20" fill="#ffd9a8" stroke="#3b3b6b" stroke-width="2"/>
      <!-- face -->
      <ellipse cx="0" cy="0" rx="88" ry="100" fill="${p[0]}" stroke="#3b3b6b" stroke-width="6"/>
      <!-- inner face -->
      <path d="M -55 -10 Q 0 -38 55 -10 Q 60 60 0 75 Q -60 60 -55 -10 Z" fill="${p[4]}" stroke="#3b3b6b" stroke-width="4"/>
      <!-- golden crown band (golden circlet, gold ring) -->
      <path d="M -88 -54 Q 0 -110 88 -54" fill="none" stroke="${p[2]}" stroke-width="22" stroke-linecap="round"/>
      <path d="M -88 -54 Q 0 -110 88 -54" fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>
      <!-- crown bump in front -->
      <path d="M -12 -76 Q 0 -98 12 -76 Z" fill="${p[2]}" stroke="#3b3b6b" stroke-width="3"/>
      <!-- eyes -->
      <ellipse cx="-26" cy="-2" rx="14" ry="18" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <ellipse cx="26" cy="-2" rx="14" ry="18" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <circle cx="-22" cy="2" r="7" fill="#3b3b6b"/>
      <circle cx="30" cy="2" r="7" fill="#3b3b6b"/>
      <!-- nose & mouth -->
      <path d="M -8 24 Q 0 30 8 24" fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>
      <path d="M -20 42 Q 0 60 20 42" fill="none" stroke="#3b3b6b" stroke-width="4" stroke-linecap="round"/>
      <!-- pink cheeks -->
      <ellipse cx="-50" cy="30" rx="14" ry="8" fill="${p[1]}" opacity="0.5"/>
      <ellipse cx="50" cy="30" rx="14" ry="8" fill="${p[1]}" opacity="0.5"/>
    </g>

    <!-- 金箍棒 -->
    <g transform="translate(340 340) rotate(-30)">
      <rect x="-18" y="-130" width="36" height="260" rx="14" fill="${p[2]}" stroke="#3b3b6b" stroke-width="5"/>
      <rect x="-22" y="-130" width="44" height="22" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4"/>
      <rect x="-22" y="108" width="44" height="22" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4"/>
    </g>

    <!-- ∞ -->
    ${bigGlyph(404, 134, '∞', p[1], 70)}
    ${stars(seed, 7)}
    ${captionBar('一个跟头十万八千里', p[3])}`,
    'Sun Wukong ∞'
  );
}

// 哪吒：双髻 + 红肚兜 + 混天绫 + π
function nezha() {
  const seed = 'nezha';
  const p = PALETTES.nezha;
  return svgWrap(
    `${bubbles(seed, p, 10)}
    ${titleBar('小哪吒 · π', p[3])}

    <g transform="translate(200 270)">
      <!-- 双髻 (two top buns) -->
      <circle cx="-46" cy="-110" r="26" fill="#222" stroke="#3b3b6b" stroke-width="5"/>
      <circle cx="46" cy="-110" r="26" fill="#222" stroke="#3b3b6b" stroke-width="5"/>
      <!-- hair bands -->
      <rect x="-58" y="-90" width="24" height="8" rx="4" fill="${p[0]}" stroke="#3b3b6b" stroke-width="2"/>
      <rect x="34" y="-90" width="24" height="8" rx="4" fill="${p[0]}" stroke="#3b3b6b" stroke-width="2"/>
      <!-- 头 -->
      <ellipse cx="0" cy="0" rx="86" ry="94" fill="#fff1da" stroke="#3b3b6b" stroke-width="6"/>
      <!-- 刘海 -->
      <path d="M -78 -30 Q -40 -78 0 -64 Q 40 -78 78 -30 Q 60 -50 30 -52 Q 0 -40 -30 -52 Q -60 -50 -78 -30 Z" fill="#222" stroke="#3b3b6b" stroke-width="4"/>
      <!-- 红额印 (lotus mark) -->
      <circle cx="0" cy="-12" r="9" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3"/>
      <!-- 眼睛 -->
      <ellipse cx="-26" cy="10" rx="13" ry="17" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <ellipse cx="26" cy="10" rx="13" ry="17" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <circle cx="-22" cy="14" r="7" fill="#3b3b6b"/>
      <circle cx="30" cy="14" r="7" fill="#3b3b6b"/>
      <!-- 嘴 -->
      <path d="M -16 50 Q 0 64 16 50" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3"/>
      <!-- 腮红 -->
      <circle cx="-50" cy="36" r="12" fill="${p[0]}" opacity="0.55"/>
      <circle cx="50" cy="36" r="12" fill="${p[0]}" opacity="0.55"/>
    </g>

    <!-- 混天绫 (red ribbon swirling) -->
    <path d="M 90 220 Q 60 320 150 370 Q 240 410 330 360 Q 420 320 430 240"
      fill="none" stroke="${p[3]}" stroke-width="24" stroke-linecap="round" opacity="0.9"/>
    <path d="M 90 220 Q 60 320 150 370 Q 240 410 330 360 Q 420 320 430 240"
      fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>

    <!-- π -->
    ${bigGlyph(404, 136, 'π', p[2], 80)}
    ${stars(seed, 7)}
    ${captionBar('风火轮 · 转出 π', p[2])}`,
    'Nezha π'
  );
}

// 玉兔捣药 + 月亮（圆周率）
function rabbit() {
  const seed = 'rabbit';
  const p = PALETTES.rabbit;
  return svgWrap(
    `${bubbles(seed, p, 10)}
    ${titleBar('玉兔 · 圆月 π', p[2])}

    <!-- 月亮 -->
    <circle cx="384" cy="170" r="78" fill="${p[0]}" stroke="#3b3b6b" stroke-width="5"/>
    <text x="384" y="200" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
      font-size="90" fill="${p[3]}" stroke="#3b3b6b" stroke-width="5" paint-order="stroke fill">π</text>

    <!-- 兔子 -->
    <g transform="translate(180 290)">
      <!-- ears -->
      <ellipse cx="-30" cy="-100" rx="18" ry="60" fill="#ffffff" stroke="#3b3b6b" stroke-width="5"/>
      <ellipse cx="30" cy="-100" rx="18" ry="60" fill="#ffffff" stroke="#3b3b6b" stroke-width="5"/>
      <ellipse cx="-30" cy="-100" rx="8" ry="44" fill="${p[1]}"/>
      <ellipse cx="30" cy="-100" rx="8" ry="44" fill="${p[1]}"/>
      <!-- head -->
      <ellipse cx="0" cy="0" rx="80" ry="84" fill="#ffffff" stroke="#3b3b6b" stroke-width="6"/>
      <!-- eyes -->
      <circle cx="-26" cy="-4" r="10" fill="#3b3b6b"/>
      <circle cx="26" cy="-4" r="10" fill="#3b3b6b"/>
      <circle cx="-22" cy="-8" r="3" fill="#ffffff"/>
      <circle cx="30" cy="-8" r="3" fill="#ffffff"/>
      <!-- nose -->
      <path d="M -8 22 L 8 22 L 0 32 Z" fill="${p[1]}" stroke="#3b3b6b" stroke-width="3"/>
      <!-- mouth -->
      <path d="M 0 32 Q -10 44 -20 38" fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>
      <path d="M 0 32 Q 10 44 20 38" fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>
      <!-- cheeks -->
      <circle cx="-50" cy="22" r="10" fill="${p[1]}" opacity="0.6"/>
      <circle cx="50" cy="22" r="10" fill="${p[1]}" opacity="0.6"/>
    </g>

    <!-- 捣药杵 -->
    <g transform="translate(90 380) rotate(-20)">
      <rect x="-10" y="-90" width="20" height="120" rx="6" fill="${p[3]}" stroke="#3b3b6b" stroke-width="4"/>
      <ellipse cx="0" cy="-90" rx="22" ry="14" fill="${p[2]}" stroke="#3b3b6b" stroke-width="4"/>
    </g>

    ${stars(seed, 7)}
    ${captionBar('月圆即是 π 的故事', p[3])}`,
    'Jade Rabbit π'
  );
}

// 龙 — 头 + 身子盘成 ∞
function dragon() {
  const seed = 'dragon';
  const p = PALETTES.dragon;
  // 身体走 lemniscate
  const a = 130;
  const pts = [];
  const steps = 100;
  for (let i = 0; i <= steps; i++) {
    const t = (i / steps) * 2 * Math.PI;
    const denom = 1 + Math.sin(t) ** 2;
    const x = (a * Math.cos(t)) / denom;
    const y = (a * Math.sin(t) * Math.cos(t)) / denom;
    pts.push(`${(256 + x).toFixed(1)},${(290 + y).toFixed(1)}`);
  }
  return svgWrap(
    `${bubbles(seed, p, 10)}
    ${titleBar('神龙 · ∞', p[3])}

    <!-- 龙身 -->
    <polyline points="${pts.join(' ')}" fill="none" stroke="${p[0]}" stroke-width="34" stroke-linecap="round"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="${p[1]}" stroke-width="24" stroke-linecap="round" opacity="0.9"/>
    <polyline points="${pts.join(' ')}" fill="none" stroke="#3b3b6b" stroke-width="3" stroke-linecap="round"/>
    <!-- 鳞片 -->
    ${(() => {
      const out = [];
      for (let i = 6; i < pts.length - 6; i += 4) {
        const [x, y] = pts[i].split(',').map(Number);
        out.push(`<circle cx="${x}" cy="${y}" r="6" fill="${p[2]}" stroke="#3b3b6b" stroke-width="2" opacity="0.85"/>`);
      }
      return out.join('\n  ');
    })()}

    <!-- 龙头 (左端) -->
    <g transform="translate(130 290)">
      <ellipse cx="0" cy="0" rx="48" ry="38" fill="${p[0]}" stroke="#3b3b6b" stroke-width="5"/>
      <!-- 角 -->
      <path d="M -16 -36 L -24 -64 L -8 -42 Z" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3"/>
      <path d="M 8 -42 L 16 -68 L 24 -42 Z" fill="${p[3]}" stroke="#3b3b6b" stroke-width="3"/>
      <!-- 眼 -->
      <circle cx="-10" cy="-6" r="7" fill="#ffffff" stroke="#3b3b6b" stroke-width="2"/>
      <circle cx="-8" cy="-6" r="3" fill="#3b3b6b"/>
      <!-- 鼻 -->
      <circle cx="-40" cy="6" r="3" fill="#3b3b6b"/>
      <!-- 嘴 -->
      <path d="M -40 14 Q -28 22 -16 18" fill="none" stroke="#3b3b6b" stroke-width="3"/>
      <!-- 龙须 -->
      <path d="M -42 18 Q -56 28 -50 44" fill="none" stroke="${p[3]}" stroke-width="3"/>
      <path d="M -34 18 Q -48 32 -40 50" fill="none" stroke="${p[3]}" stroke-width="3"/>
    </g>

    <!-- 龙尾 (右端尖) -->
    <g transform="translate(382 290)">
      <path d="M 0 0 L 26 -14 L 22 0 L 30 14 L 0 6 Z" fill="${p[2]}" stroke="#3b3b6b" stroke-width="4"/>
    </g>

    <!-- 大 ∞ 在角色头上方 -->
    ${bigGlyph(404, 130, '∞', p[4], 64)}

    ${stars(seed, 7)}
    ${captionBar('飞天巨龙画出 ∞', p[3])}`,
    'Dragon ∞'
  );
}

// 葫芦娃 + 数字 7
function gourd() {
  const seed = 'gourd';
  const p = PALETTES.gourd;
  // 7 葫芦排成一行
  function pod(cx, cy, fill, num) {
    return `<g transform="translate(${cx} ${cy})">
      <circle cx="0" cy="-22" r="22" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
      <ellipse cx="0" cy="22" rx="32" ry="36" fill="${fill}" stroke="#3b3b6b" stroke-width="5"/>
      <!-- leaf -->
      <path d="M -8 -46 Q -22 -56 -16 -44 Q -10 -38 -8 -46 Z" fill="#388e3c" stroke="#3b3b6b" stroke-width="2"/>
      <text x="0" y="32" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="34" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">${num}</text>
    </g>`;
  }
  const colors = ['#FF6B6B', '#FF9F1C', '#FFD93D', '#6BCB77', '#4D96FF', '#A66CFF', '#E94196'];
  const pods = [];
  for (let i = 0; i < 7; i++) {
    pods.push(pod(60 + i * 64, 270, colors[i], i + 1));
  }
  return svgWrap(
    `${bubbles(seed, p, 10)}
    ${titleBar('葫芦七兄弟 · 1-7', p[2])}
    ${pods.join('\n  ')}
    ${(() => {
      const out = [];
      // place pluses between pods
      for (let i = 0; i < 6; i++) {
        const cx = 92 + i * 64;
        out.push(`<text x="${cx}" y="296" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
          font-size="28" fill="${p[3]}" stroke="#3b3b6b" stroke-width="2" paint-order="stroke fill">+</text>`);
      }
      return out.join('\n  ');
    })()}
    <!-- 中央 + 号 -->
    <g transform="translate(256 388)">
      <rect x="-200" y="-26" width="400" height="52" rx="20" fill="${p[3]}" stroke="#3b3b6b" stroke-width="5"/>
      <text x="0" y="10" text-anchor="middle" font-family="'Comic Sans MS',sans-serif" font-weight="900"
        font-size="36" fill="#ffffff" stroke="#3b3b6b" stroke-width="3" paint-order="stroke fill">1+2+3+4+5+6+7=28</text>
    </g>
    ${captionBar('七个葫芦一家亲', p[0])}
    ${stars(seed, 7)}`,
    'Gourd Brothers'
  );
}

// 猪八戒 + 九齿耙 + 9
function pig() {
  const seed = 'pig';
  const p = PALETTES.pig;
  return svgWrap(
    `${bubbles(seed, p, 10)}
    ${titleBar('猪八戒 · 9', p[1])}

    <g transform="translate(200 290)">
      <!-- big ears flop -->
      <path d="M -110 -30 Q -130 30 -88 50 L -80 -8 Z" fill="${p[0]}" stroke="#3b3b6b" stroke-width="5"/>
      <path d="M 110 -30 Q 130 30 88 50 L 80 -8 Z" fill="${p[0]}" stroke="#3b3b6b" stroke-width="5"/>
      <!-- head -->
      <ellipse cx="0" cy="0" rx="86" ry="80" fill="${p[0]}" stroke="#3b3b6b" stroke-width="6"/>
      <!-- snout -->
      <ellipse cx="0" cy="32" rx="46" ry="30" fill="${p[1]}" stroke="#3b3b6b" stroke-width="5"/>
      <ellipse cx="-14" cy="32" rx="6" ry="9" fill="#3b3b6b"/>
      <ellipse cx="14" cy="32" rx="6" ry="9" fill="#3b3b6b"/>
      <!-- eyes -->
      <ellipse cx="-30" cy="-8" rx="12" ry="14" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <ellipse cx="30" cy="-8" rx="12" ry="14" fill="#ffffff" stroke="#3b3b6b" stroke-width="4"/>
      <circle cx="-26" cy="-4" r="6" fill="#3b3b6b"/>
      <circle cx="34" cy="-4" r="6" fill="#3b3b6b"/>
      <!-- cheeks -->
      <circle cx="-58" cy="20" r="10" fill="${p[1]}" opacity="0.7"/>
      <circle cx="58" cy="20" r="10" fill="${p[1]}" opacity="0.7"/>
    </g>

    <!-- 九齿耙 -->
    <g transform="translate(386 350) rotate(20)">
      <rect x="-6" y="-130" width="12" height="180" fill="${p[2]}" stroke="#3b3b6b" stroke-width="3"/>
      <rect x="-58" y="-150" width="116" height="24" rx="4" fill="${p[2]}" stroke="#3b3b6b" stroke-width="4"/>
      <!-- 9 teeth -->
      ${(() => {
        const out = [];
        for (let i = 0; i < 9; i++) {
          const x = -54 + i * 13;
          out.push(`<polygon points="${x},-126 ${x+8},-126 ${x+4},-100" fill="#ffffff" stroke="#3b3b6b" stroke-width="2"/>`);
        }
        return out.join('\n  ');
      })()}
    </g>

    <!-- 大数字 9 -->
    ${bigGlyph(86, 144, '9', p[3], 80)}

    ${stars(seed, 7)}
    ${captionBar('九齿钉耙 · 九九归一', p[3])}`,
    'Pig 9'
  );
}

// ---------------- Render ----------------
const items = [
  ['character-wukong-infinity.png', wukong()],
  ['character-nezha-pi.png', nezha()],
  ['character-rabbit-pi.png', rabbit()],
  ['character-dragon-infinity.png', dragon()],
  ['character-gourd-brothers.png', gourd()],
  ['character-pigsy-9.png', pig()],
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
