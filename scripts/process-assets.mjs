// Xử lý art AI-generate (nền trắng) thành PNG trong suốt cho game.
// Chạy: node scripts/process-assets.mjs [thư-mục-nguồn]
// Quy ước ảnh nguồn: xem .cursor/rules/art-style.mdc
import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const SRC = process.argv[2] ?? "art-src";
const STAGES = ["seed", "sprout", "grow", "ripe"];
const CROPS = [
  "rice", "wheat", "carrot", "tomato", "corn", "potato", "cabbage", "chili",
  "onion", "bean", "strawberry", "melon", "grape", "pumpkin", "sunflower", "lotus",
];
const FISH_STRIPS = {
  "fish-a": ["perch", "carp", "grasscarp", "pangasius", "snakehead"],
  "fish-b": ["tilapia", "catfish", "pacu", "koi", "arowana"],
};
const PROPS = ["house", "pond"];
const TEXTURES = ["soil-dry", "soil-wet", "grass", "soil-side"];

const smooth = (a, b, x) => {
  const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

async function removeWhite(file) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: W, height: H } = info;
  const N = W * H;
  const dist = new Uint8Array(N);
  const sat = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    const mn = Math.min(data[o], data[o + 1], data[o + 2]);
    const mx = Math.max(data[o], data[o + 1], data[o + 2]);
    dist[i] = 255 - mn;
    sat[i] = mx - mn;
  }
  // Loang từ viền ảnh qua nền trắng + bóng đổ xám/ngả màu nhạt; chi tiết trắng
  // bên trong vật thể được bao bởi phần có màu nên không bị thủng.
  // Quầng kem dính nền trắng (cá rồng): R≈G cao, B thấp hơn một chút.
  // Hồng sen (G≈B) và vàng lúa (R≫G hoặc B thấp) không lọt.
  const warmGlow = (i) => {
    const o = i * 4;
    const r = data[o], g = data[o + 1], b = data[o + 2];
    return r >= 220 && g >= 150 && b >= 125 && r - g <= 45 && g - b >= 12 && g - b <= 100 && r - b >= 30;
  };
  const passable = (i) =>
    dist[i] < 30 || (sat[i] < 20 && dist[i] < 150) || (sat[i] < 40 && dist[i] < 80) || warmGlow(i);
  const bg = new Uint8Array(N);
  const stack = [];
  const push = (i) => {
    if (!bg[i] && passable(i)) { bg[i] = 1; stack.push(i); }
  };
  for (let x = 0; x < W; x++) { push(x); push((H - 1) * W + x); }
  for (let y = 0; y < H; y++) { push(y * W); push(y * W + W - 1); }
  while (stack.length) {
    const i = stack.pop();
    const x = i % W, y = (i / W) | 0;
    if (x > 0) push(i - 1);
    if (x < W - 1) push(i + 1);
    if (y > 0) push(i - W);
    if (y < H - 1) push(i + W);
  }
  // Khe nền trắng thuần bị bao kín (vd. giữa bụi lúa) — vùng đủ lớn thì coi là nền.
  const seen = new Uint8Array(N);
  for (let s = 0; s < N; s++) {
    if (bg[s] || seen[s] || dist[s] >= 12 || sat[s] >= 16) continue;
    const comp = [s];
    seen[s] = 1;
    for (let k = 0; k < comp.length; k++) {
      const i = comp[k];
      const x = i % W, y = (i / W) | 0;
      for (const j of [x > 0 ? i - 1 : -1, x < W - 1 ? i + 1 : -1, y > 0 ? i - W : -1, y < H - 1 ? i + W : -1]) {
        if (j >= 0 && !seen[j] && !bg[j] && dist[j] < 12 && sat[j] < 16) { seen[j] = 1; comp.push(j); }
      }
    }
    if (comp.length >= 40) for (const i of comp) bg[i] = 1;
  }
  // Viền răng cưa sáng màu giữa vật thể và nền cũng xử lý như nền (alpha mềm).
  const edge = new Uint8Array(N);
  for (let i = 0; i < N; i++) {
    if (bg[i] || dist[i] > 90) continue;
    const x = i % W, y = (i / W) | 0;
    if ((x > 0 && bg[i - 1]) || (x < W - 1 && bg[i + 1]) || (y > 0 && bg[i - W]) || (y < H - 1 && bg[i + W]))
      edge[i] = 1;
  }
  const unmix = (o, a) => {
    // màu gốc = (P - 255(1-a)) / a
    for (let c = 0; c < 3; c++)
      data[o + c] = Math.max(0, Math.min(255, Math.round((data[o + c] - 255 * (1 - a)) / a)));
    data[o + 3] = Math.round(a * 255);
  };
  for (let i = 0; i < N; i++) {
    const o = i * 4;
    if (bg[i]) {
      // Quầng kem xóa hẳn; bóng xám tiếp xúc đất vẫn giữ alpha mềm.
      if (warmGlow(i) || Math.min(data[o], data[o + 1], data[o + 2]) >= 176) { data[o + 3] = 0; continue; }
      const a = Math.min(0.55, smooth(5, 160, dist[i]) * 0.9);
      if (a <= 0.015) { data[o + 3] = 0; continue; }
      unmix(o, a);
    } else if (edge[i]) {
      unmix(o, Math.max(0.15, smooth(10, 90, dist[i])));
    }
  }
  return { data, W, H };
}

function segments(data, W, H, count) {
  const col = new Array(W).fill(0);
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 90) col[x]++;
  let runs = [];
  let start = -1;
  for (let x = 0; x <= W; x++) {
    const on = x < W && col[x] > 0;
    if (on && start < 0) start = x;
    if (!on && start >= 0) { runs.push([start, x - 1]); start = -1; }
  }
  runs = runs.filter(([a, b]) => b - a >= 3);
  while (runs.length > count) {
    let best = 1, gap = Infinity;
    for (let k = 1; k < runs.length; k++) {
      const g = runs[k][0] - runs[k - 1][1];
      if (g < gap) { gap = g; best = k; }
    }
    runs.splice(best - 1, 2, [runs[best - 1][0], runs[best][1]]);
  }
  if (runs.length !== count) {
    const q = W / count;
    runs = Array.from({ length: count }, (_, k) => [Math.round(k * q), Math.round((k + 1) * q) - 1]);
  }
  // Mở rộng vùng cắt ra giữa các khoảng trống để giữ phần bóng mờ.
  return runs.map(([a, b], k) => {
    const left = k === 0 ? 0 : Math.round((runs[k - 1][1] + a) / 2);
    const right = k === count - 1 ? W - 1 : Math.round((b + runs[k + 1][0]) / 2);
    return [left, right];
  });
}

function bbox(data, W, x0, x1, H) {
  let minX = Infinity, maxX = -1, minY = Infinity, maxY = -1;
  for (let y = 0; y < H; y++)
    for (let x = x0; x <= x1; x++)
      if (data[(y * W + x) * 4 + 3] > 12) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
  return { minX, maxX, minY, maxY };
}

async function saveCrop(data, W, H, x0, x1, out) {
  const b = bbox(data, W, x0, x1, H);
  const pad = 3;
  const left = Math.max(0, b.minX - pad);
  const top = Math.max(0, b.minY - pad);
  const width = Math.min(W - 1, b.maxX + pad) - left + 1;
  const height = Math.min(H - 1, b.maxY + pad) - top + 1;
  await sharp(data, { raw: { width: W, height: H, channels: 4 } })
    .extract({ left, top, width, height })
    .png({ compressionLevel: 9 })
    .toFile(out);
  return { left, top, width, height };
}

// Đa giác mặt nước đo tay trên ảnh nguồn (toạ độ 0..1 của ảnh nguồn). Generate lại ao thì đo lại.
const WATER_POLY = {
  pond: [
    [0.215, 0.347], [0.264, 0.269], [0.361, 0.27], [0.518, 0.27], [0.635, 0.286], [0.762, 0.373],
    [0.803, 0.477], [0.776, 0.573], [0.684, 0.665], [0.547, 0.682], [0.42, 0.639], [0.293, 0.521],
    [0.227, 0.425],
  ],
};

/** Đổi đa giác nước sang toạ độ 0..1 của ảnh đã cắt. */
function waterPoly(key, W, H, box) {
  return WATER_POLY[key]?.map(([x, y]) => [
    +((x * W - box.left) / box.width).toFixed(4),
    +((y * H - box.top) / box.height).toFixed(4),
  ]);
}

const exists = (f) => fs.existsSync(f) || (console.warn("thiếu", f), false);
const dirs = ["public/farm/crops", "public/farm/fish", "public/farm/props", "public/farm/tex"];
for (const d of dirs) fs.mkdirSync(d, { recursive: true });

const cropArt = {};
for (const key of CROPS) {
  const file = path.join(SRC, `plant-${key}.jpg`);
  if (!exists(file)) continue;
  const { data, W, H } = await removeWhite(file);
  const segs = segments(data, W, H, 4);
  cropArt[key] = {};
  for (let s = 0; s < 4; s++) {
    const box = await saveCrop(data, W, H, segs[s][0], segs[s][1], `public/farm/crops/${key}-${STAGES[s]}.png`);
    cropArt[key][STAGES[s].toUpperCase()] = [box.width, box.height];
  }
  console.log("crop", key);
}
fs.writeFileSync("src/lib/cropArt.json", JSON.stringify(cropArt, null, 2) + "\n");

const fishArt = {};
for (const [strip, keys] of Object.entries(FISH_STRIPS)) {
  const file = path.join(SRC, `${strip}.jpg`);
  if (!exists(file)) continue;
  const { data, W, H } = await removeWhite(file);
  const segs = segments(data, W, H, keys.length);
  for (let k = 0; k < keys.length; k++) {
    const box = await saveCrop(data, W, H, segs[k][0], segs[k][1], `public/farm/fish/${keys[k]}.png`);
    fishArt[keys[k]] = [box.width, box.height];
    console.log("fish", keys[k]);
  }
}
fs.writeFileSync("src/lib/fishArt.json", JSON.stringify(fishArt, null, 2) + "\n");

const propArt = {};
for (const key of PROPS) {
  const file = path.join(SRC, `prop-${key}.jpg`);
  if (!exists(file)) continue;
  const { data, W, H } = await removeWhite(file);
  const box = await saveCrop(data, W, H, 0, W - 1, `public/farm/props/${key}.png`);
  propArt[key] = { size: [box.width, box.height] };
  const water = waterPoly(key, W, H, box);
  if (water) propArt[key].water = water;
  console.log("prop", key);
}
fs.writeFileSync("src/lib/propArt.json", JSON.stringify(propArt, null, 2) + "\n");

for (const t of TEXTURES) {
  const file = path.join(SRC, `tex-${t}.jpg`);
  if (!exists(file)) continue;
  await sharp(file).resize(512, 512).jpeg({ quality: 85 }).toFile(`public/farm/tex/${t}.jpg`);
  console.log("tex", t);
}
