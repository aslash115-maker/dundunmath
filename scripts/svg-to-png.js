// Convert every .svg in ../img to .png (transparent, 512x512), then delete the .svg.
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');

const DIR = path.resolve(__dirname, '..', 'img');
const files = fs.readdirSync(DIR).filter((f) => f.endsWith('.svg'));

(async () => {
  let ok = 0, fail = 0;
  for (const f of files) {
    const src = path.join(DIR, f);
    const dst = path.join(DIR, f.replace(/\.svg$/i, '.png'));
    try {
      const buf = fs.readFileSync(src);
      await sharp(buf, { density: 192 })
        .resize(512, 512, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9 })
        .toFile(dst);
      fs.unlinkSync(src);
      ok++;
    } catch (e) {
      fail++;
      console.error(`FAIL ${f}: ${e.message}`);
    }
  }
  console.log(`Converted ${ok} files, ${fail} failures.`);
})();
