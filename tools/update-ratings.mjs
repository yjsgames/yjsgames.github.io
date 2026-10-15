#!/usr/bin/env node
/**
 * 스토어 평점을 모아 data/ratings.json 을 갱신한다.
 *
 * - App Store: iTunes Lookup API (공식·공개) 의 averageUserRating / userRatingCount
 * - Google Play: 스토어 페이지에 박힌 schema.org JSON-LD 의 aggregateRating (공식 API 아님)
 *
 * 한 스토어 조회가 실패하면 직전 값을 그대로 둔다 — 일시 장애로 추천 배지가 깜빡이지 않게.
 * 추천 판정(recommended)은 여기서만 계산하고 홈페이지는 결과만 읽는다.
 *
 * 실행: node tools/update-ratings.mjs   (GitHub Actions 가 매주 실행)
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const CONFIG_PATH = path.join(ROOT, "data", "ratings-config.json");
const OUTPUT_PATH = path.join(ROOT, "data", "ratings.json");
const FETCH_TIMEOUT_MS = 20_000;

/** iTunes Lookup 응답 → {rating, count}. 평가가 없으면 null. */
export function parseAppStore(json) {
  const r = json?.results?.[0];
  if (!r || !Number.isFinite(r.averageUserRating) || !(r.userRatingCount > 0)) return null;
  return { rating: round2(r.averageUserRating), count: r.userRatingCount };
}

/** Google Play 상세 페이지 HTML → {rating, count}. JSON-LD aggregateRating 을 읽는다. */
export function parseGooglePlay(html) {
  const rating = Number(html.match(/"ratingValue"\s*:\s*"?([0-9.]+)/)?.[1]);
  const count = Number(html.match(/"ratingCount"\s*:\s*"?([0-9]+)/)?.[1]);
  if (!Number.isFinite(rating) || !(count > 0)) return null;
  return { rating: round2(rating), count };
}

/** 스토어별 평점을 평가 수로 가중 평균한다. */
export function combine(stores) {
  const list = Object.values(stores).filter(Boolean);
  const count = list.reduce((sum, s) => sum + s.count, 0);
  if (count === 0) return { rating: null, count: 0 };
  const rating = list.reduce((sum, s) => sum + s.rating * s.count, 0) / count;
  return { rating: round2(rating), count };
}

/** 평점이 기준 이상이고 평가 수도 충분할 때만 추천. 평가 1건짜리 5점은 제외된다. */
export function isRecommended(combined, { minRating, minCount }) {
  return combined.rating !== null && combined.rating >= minRating && combined.count >= minCount;
}

/** 새로 받은 값이 없으면(null) 직전 값을 유지한다. */
export function keepPrevious(fresh, previous) {
  return fresh ?? previous ?? null;
}

function round2(n) {
  return Math.round(n * 100) / 100;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: { "User-Agent": "Mozilla/5.0 (yjsgames ratings bot)" },
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

async function fetchAppStore(id, country) {
  const text = await fetchText(`https://itunes.apple.com/lookup?id=${id}&country=${country}`);
  return parseAppStore(JSON.parse(text));
}

async function fetchGooglePlay(id, country) {
  const html = await fetchText(`https://play.google.com/store/apps/details?id=${id}&hl=ko&gl=${country.toUpperCase()}`);
  return parseGooglePlay(html);
}

async function tryFetch(label, fn) {
  try {
    return await fn();
  } catch (err) {
    console.warn(`[update-ratings] ${label} 조회 실패 — 직전 값 유지: ${err.message}`);
    return null;
  }
}

async function main() {
  const config = JSON.parse(await readFile(CONFIG_PATH, "utf8"));
  const previous = JSON.parse(await readFile(OUTPUT_PATH, "utf8").catch(() => "{}"));
  const games = {};

  for (const [key, ids] of Object.entries(config.games)) {
    const prev = previous.games?.[key]?.stores ?? {};
    const stores = {
      appStore: ids.appStoreId
        ? keepPrevious(await tryFetch(`${key} App Store`, () => fetchAppStore(ids.appStoreId, config.country)), prev.appStore)
        : null,
      googlePlay: ids.googlePlayId
        ? keepPrevious(await tryFetch(`${key} Google Play`, () => fetchGooglePlay(ids.googlePlayId, config.country)), prev.googlePlay)
        : null,
    };
    const combined = combine(stores);
    games[key] = { ...combined, recommended: isRecommended(combined, config.recommend), stores };
    console.log(`[update-ratings] ${key}: ★${combined.rating ?? "-"} (${combined.count}건) 추천=${games[key].recommended}`);
  }

  // 값이 바뀌지 않았으면 파일을 건드리지 않는다 — 매주 의미 없는 커밋 방지.
  if (JSON.stringify(previous.games) === JSON.stringify(games)) {
    console.log("[update-ratings] 변경 없음");
    return;
  }
  const output = { updatedAt: new Date().toISOString().slice(0, 10), recommend: config.recommend, games };
  await writeFile(OUTPUT_PATH, JSON.stringify(output, null, 2) + "\n");
  console.log(`[update-ratings] ${path.relative(ROOT, OUTPUT_PATH)} 갱신`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
