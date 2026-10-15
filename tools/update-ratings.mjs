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

/** iTunes Lookup 응답 → {rating, count}. 평가가 없거나 값이 비정상이면 null. */
export function parseAppStore(json) {
  const r = json?.results?.[0];
  if (!r || !Number.isFinite(r.averageUserRating) || !(r.userRatingCount > 0)) return null;
  return { rating: round2(r.averageUserRating), count: r.userRatingCount };
}

/**
 * iTunes Lookup 응답을 조회 결과({ok, value})로 분류한다.
 * - 평가 수가 정확히 0 → 정상 결과, 평가 없음(value:null). 직전 값을 지운다.
 * - 평가 수가 양의 정수이고 평균이 0~5 숫자 → 정상 결과.
 * - 그 밖(앱 없음·필드 누락·비숫자·범위 밖) → 조회 실패(ok:false). 직전 값을 지킨다.
 */
export function appStoreOutcome(json) {
  const r = json?.results?.[0];
  if (!r) return { ok: false };
  if (r.userRatingCount === 0) return { ok: true, value: null };
  const valid =
    Number.isInteger(r.userRatingCount) && r.userRatingCount > 0 &&
    Number.isFinite(r.averageUserRating) && r.averageUserRating >= 0 && r.averageUserRating <= 5;
  return valid ? { ok: true, value: parseAppStore(json) } : { ok: false };
}

/**
 * Google Play 상세 페이지 HTML → {rating, count}.
 * application/ld+json 블록을 JSON 으로 파싱해 **같은 aggregateRating 객체**의 두 값만 쓴다.
 * 페이지 어딘가의 다른 ratingValue(리뷰 별점 등)를 섞어 읽지 않기 위해서다. 못 찾으면 null(=조회 실패).
 */
export function parseGooglePlay(html) {
  for (const [, body] of html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    let data;
    try {
      data = JSON.parse(body);
    } catch {
      continue;
    }
    const found = findAggregateRating(data);
    if (found) return found;
  }
  return null;
}

function findAggregateRating(node) {
  if (!node || typeof node !== "object") return null;
  const agg = node.aggregateRating;
  if (agg && typeof agg === "object") {
    const rating = Number(agg.ratingValue);
    const count = Number(agg.ratingCount ?? agg.reviewCount);
    if (Number.isFinite(rating) && rating >= 0 && rating <= 5 && Number.isInteger(count) && count > 0) {
      return { rating: round2(rating), count };
    }
  }
  for (const child of Object.values(node)) {
    const found = findAggregateRating(child);
    if (found) return found;
  }
  return null;
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

/**
 * 조회 결과({ok, value})로 스토어 값을 정한다.
 * - 조회 실패(ok:false): 직전 값 유지 — 일시 장애로 배지가 깜빡이지 않게.
 * - 정상 조회(ok:true): 그 값으로 교체. 평가 0건(value:null)이면 직전 값도 지운다.
 */
export function pickStore(outcome, previous) {
  return outcome.ok ? outcome.value : previous ?? null;
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
  const outcome = appStoreOutcome(JSON.parse(text));
  if (!outcome.ok) throw new Error("App Store 응답이 비정상(앱 없음 또는 평점 필드 누락)");
  return outcome.value;
}

async function fetchGooglePlay(id, country) {
  const html = await fetchText(`https://play.google.com/store/apps/details?id=${id}&hl=ko&gl=${country.toUpperCase()}`);
  const parsed = parseGooglePlay(html);
  // Play 페이지는 평가 0건과 구조 변경을 구분할 수 없어, 평점을 못 읽으면 실패로 보고 직전 값을 지킨다.
  if (!parsed) throw new Error("JSON-LD aggregateRating 없음");
  return parsed;
}

/** 조회를 {ok, value} 로 감싼다. 예외는 실패(ok:false) — pickStore 가 직전 값을 유지한다. */
async function tryFetch(label, fn) {
  try {
    return { ok: true, value: await fn() };
  } catch (err) {
    console.warn(`[update-ratings] ${label} 조회 실패 — 직전 값 유지: ${err.message}`);
    return { ok: false };
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
        ? pickStore(await tryFetch(`${key} App Store`, () => fetchAppStore(ids.appStoreId, config.country)), prev.appStore)
        : null,
      googlePlay: ids.googlePlayId
        ? pickStore(await tryFetch(`${key} Google Play`, () => fetchGooglePlay(ids.googlePlayId, config.country)), prev.googlePlay)
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
