import { test } from "node:test";
import assert from "node:assert/strict";
import { parseAppStore, parseGooglePlay, combine, isRecommended, pickStore } from "./update-ratings.mjs";

const RULE = { minRating: 4.0, minCount: 20 };

test("App Store 응답에서 평점과 평가 수를 읽는다", () => {
  assert.deepEqual(parseAppStore({ results: [{ averageUserRating: 4.47619, userRatingCount: 42 }] }), { rating: 4.48, count: 42 });
});

test("App Store 평가가 0건이면 null", () => {
  assert.equal(parseAppStore({ results: [{ averageUserRating: 0, userRatingCount: 0 }] }), null);
  assert.equal(parseAppStore({ results: [] }), null);
});

test("Google Play JSON-LD 에서 평점과 평가 수를 읽는다", () => {
  const html = '<script type="application/ld+json">{"aggregateRating":{"@type":"AggregateRating","ratingValue":"4.732673168182373","ratingCount":"378"}}</script>';
  assert.deepEqual(parseGooglePlay(html), { rating: 4.73, count: 378 });
});

test("Google Play 페이지에 평점이 없으면 null", () => {
  assert.equal(parseGooglePlay("<html>no rating</html>"), null);
});

test("두 스토어 평점을 평가 수로 가중 평균한다", () => {
  const c = combine({ appStore: { rating: 4.48, count: 42 }, googlePlay: { rating: 4.73, count: 378 } });
  assert.equal(c.count, 420);
  assert.equal(c.rating, 4.71);
});

test("평점이 하나도 없으면 rating null", () => {
  assert.deepEqual(combine({ appStore: null, googlePlay: null }), { rating: null, count: 0 });
});

test("4점 이상 + 평가 20건 이상이면 추천", () => {
  assert.equal(isRecommended({ rating: 4.71, count: 420 }, RULE), true);
  assert.equal(isRecommended({ rating: 4.0, count: 20 }, RULE), true);
});

test("평가 1건짜리 5점은 추천하지 않는다", () => {
  assert.equal(isRecommended({ rating: 5, count: 1 }, RULE), false);
});

test("4점 미만이면 추천하지 않는다", () => {
  assert.equal(isRecommended({ rating: 3.99, count: 500 }, RULE), false);
  assert.equal(isRecommended({ rating: null, count: 0 }, RULE), false);
});

test("조회 실패면 직전 값을 유지한다", () => {
  const prev = { rating: 4.5, count: 40 };
  assert.deepEqual(pickStore({ ok: false }, prev), prev);
  assert.equal(pickStore({ ok: false }, undefined), null);
});

test("정상 조회 결과로 값을 바꾼다", () => {
  const prev = { rating: 4.5, count: 40 };
  assert.deepEqual(pickStore({ ok: true, value: { rating: 4.6, count: 41 } }, prev), { rating: 4.6, count: 41 });
});

test("정상 조회인데 평가가 0건이면 직전 값을 지운다 (실패와 구분)", () => {
  const prev = { rating: 4.5, count: 40 };
  assert.equal(pickStore({ ok: true, value: null }, prev), null);
});

test("Google Play: aggregateRating 앞에 무관한 ratingValue 가 있어도 aggregateRating 값을 고른다", () => {
  const html =
    '<script type="application/ld+json">{"@type":"Review","reviewRating":{"ratingValue":"1"}}</script>' +
    '<script type="application/ld+json">{"@type":"SoftwareApplication","aggregateRating":{"@type":"AggregateRating","ratingValue":"4.5","ratingCount":"200"}}</script>';
  assert.deepEqual(parseGooglePlay(html), { rating: 4.5, count: 200 });
});

test("Google Play: ratingValue 와 ratingCount 가 서로 다른 객체에 있으면 평점으로 인정하지 않는다", () => {
  const html =
    '<script type="application/ld+json">{"a":{"ratingValue":"4.9"},"b":{"ratingCount":"999"}}</script>';
  assert.equal(parseGooglePlay(html), null);
});

test("Google Play: JSON-LD 밖의 숫자는 쓰지 않는다", () => {
  assert.equal(parseGooglePlay('<div data-x=\'"ratingValue":"4.9","ratingCount":"10"\'></div>'), null);
});

test("Google Play: 평점 범위(0~5)를 벗어나면 인정하지 않는다", () => {
  const html = '<script type="application/ld+json">{"aggregateRating":{"ratingValue":"47","ratingCount":"10"}}</script>';
  assert.equal(parseGooglePlay(html), null);
});
