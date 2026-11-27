// Fetches freely licensed photos of each Kerala place from Wikipedia / Wikimedia Commons.
// Runs in GitHub Actions (internet access). Two phases:
//   1. No selection.json → download small candidate thumbnails for review into assets/photos/candidates.
//   2. selection.json present → download chosen files at full width into assets/photos/<key>.jpg,
//      write credits.json, remove candidates.
import fs from 'node:fs/promises';
import path from 'node:path';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '../..');
const OUT = path.join(ROOT, 'assets/photos');
const UA = 'TravoPhotoFetcher/1.0 (https://github.com/Amaljith75/Travo; build script)';
const API = 'https://en.wikipedia.org/w/api.php';
const COMMONS = 'https://commons.wikimedia.org/w/api.php';
const BAD = /(map|logo|flag|locator|emblem|seal|icon|svg|diagram|chart|coat_of_arms|signature|commons-logo|edit-clear|question_book|wiki|ambox|portal|symbol|graph)/i;

async function api(base, params) {
  const url = `${base}?${new URLSearchParams({ format: 'json', formatversion: '2', origin: '*', ...params })}`;
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) return r.json();
    await new Promise((res) => setTimeout(res, 1000 * (i + 1)));
  }
  throw new Error(`API failed: ${url}`);
}

async function pageImages(title) {
  const lead = await api(API, { action: 'query', titles: title, prop: 'pageimages', piprop: 'name', redirects: '1' });
  const leadName = lead.query?.pages?.[0]?.pageimage;
  const imgs = await api(API, { action: 'query', titles: title, prop: 'images', imlimit: '60', redirects: '1' });
  const names = (imgs.query?.pages?.[0]?.images ?? []).map((i) => i.title.replace(/^File:/, ''));
  const all = [leadName, ...names].filter(Boolean).filter((n) => /\.jpe?g$/i.test(n) && !BAD.test(n));
  return [...new Set(all)];
}

async function info(file, width) {
  const j = await api(COMMONS, { action: 'query', titles: `File:${file}`, prop: 'imageinfo', iiprop: 'url|extmetadata|size', iiurlwidth: String(width) });
  const ii = j.query?.pages?.[0]?.imageinfo?.[0];
  if (!ii) return null;
  const m = ii.extmetadata ?? {};
  const strip = (s) => (s ?? '').replace(/<[^>]+>/g, '').trim();
  return {
    file,
    thumb: ii.thumburl ?? ii.url,
    page: ii.descriptionurl,
    width: ii.width,
    height: ii.height,
    artist: strip(m.Artist?.value),
    license: strip(m.LicenseShortName?.value),
    licenseUrl: m.LicenseUrl?.value ?? null,
  };
}

async function download(url, dest) {
  for (let i = 0; i < 4; i++) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } });
    if (r.ok) {
      await fs.writeFile(dest, Buffer.from(await r.arrayBuffer()));
      return;
    }
    await new Promise((res) => setTimeout(res, 1500 * (i + 1)));
  }
  throw new Error(`download failed ${url}`);
}

const places = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts/photos/places.json'), 'utf8'));
let selection = null;
try {
  selection = JSON.parse(await fs.readFile(path.join(ROOT, 'scripts/photos/selection.json'), 'utf8'));
} catch {}

await fs.mkdir(OUT, { recursive: true });

if (!selection) {
  const dir = path.join(OUT, 'candidates');
  await fs.mkdir(dir, { recursive: true });
  const index = {};
  for (const [key, titles] of Object.entries(places)) {
    const files = [];
    for (const t of titles) {
      try {
        files.push(...(await pageImages(t)).slice(0, key.startsWith('v-') ? 4 : 6));
      } catch (e) {
        console.warn(`skip ${t}: ${e.message}`);
      }
    }
    index[key] = [];
    let n = 0;
    for (const f of [...new Set(files)].slice(0, key === 'hero' ? 8 : 10)) {
      const meta = await info(f, 360).catch(() => null);
      if (!meta || meta.width < 900) continue;
      n++;
      const name = `${key}--${n}.jpg`;
      await download(meta.thumb, path.join(dir, name)).catch((e) => console.warn(e.message));
      index[key].push({ name, ...meta });
    }
    console.log(key, index[key].length);
  }
  await fs.writeFile(path.join(dir, 'index.json'), JSON.stringify(index, null, 2));
} else {
  const credits = {};
  for (const [name, file] of Object.entries(selection)) {
    const meta = await info(file, 1600);
    if (!meta) throw new Error(`missing ${file}`);
    await download(meta.thumb, path.join(OUT, `${name}.jpg`));
    credits[name] = { file, page: meta.page, artist: meta.artist, license: meta.license, licenseUrl: meta.licenseUrl };
    console.log('saved', name);
  }
  await fs.writeFile(path.join(OUT, 'credits.json'), JSON.stringify(credits, null, 2));
  await fs.rm(path.join(OUT, 'candidates'), { recursive: true, force: true });
}
