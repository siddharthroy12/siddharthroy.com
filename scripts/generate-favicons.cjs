// Regenerates all favicon assets from public/favicon.svg (the "SR" mark).
// Run with: node scripts/generate-favicons.cjs
const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const pub = path.join(__dirname, "..", "public");
const svg = fs.readFileSync(path.join(pub, "favicon.svg"));

async function renderPng(size, name) {
  // High density so librsvg rasterizes large, then downscale for crisp edges.
  await sharp(svg, { density: 1200 })
    .resize(size, size)
    .png()
    .toFile(path.join(pub, name));
}

function buildIco(entries) {
  // entries: [{ size, data }] — PNG-compressed entries inside an ICO container.
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // type: icon
  header.writeUInt16LE(entries.length, 4);

  let offset = 6 + entries.length * 16;
  const dirs = entries.map(({ size, data }) => {
    const dir = Buffer.alloc(16);
    dir.writeUInt8(size === 256 ? 0 : size, 0); // width
    dir.writeUInt8(size === 256 ? 0 : size, 1); // height
    dir.writeUInt8(0, 2); // palette
    dir.writeUInt8(0, 3); // reserved
    dir.writeUInt16LE(1, 4); // color planes
    dir.writeUInt16LE(32, 6); // bits per pixel
    dir.writeUInt32LE(data.length, 8);
    dir.writeUInt32LE(offset, 12);
    offset += data.length;
    return dir;
  });

  return Buffer.concat([header, ...dirs, ...entries.map((e) => e.data)]);
}

(async () => {
  await renderPng(16, "favicon-16x16.png");
  await renderPng(32, "favicon-32x32.png");
  await renderPng(180, "apple-touch-icon.png");
  await renderPng(144, "android-chrome-144x144.png");
  await renderPng(150, "mstile-150x150.png");

  const png16 = fs.readFileSync(path.join(pub, "favicon-16x16.png"));
  const png32 = fs.readFileSync(path.join(pub, "favicon-32x32.png"));
  fs.writeFileSync(
    path.join(pub, "favicon.ico"),
    buildIco([
      { size: 16, data: png16 },
      { size: 32, data: png32 },
    ]),
  );

  console.log("favicons regenerated from favicon.svg");
})();
