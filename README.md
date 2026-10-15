# yjsgames.github.io

YJS Games 공식 홈페이지. GitHub Pages 가 `main` 브랜치 루트를 그대로 배포한다(빌드 단계 없음).

## 구성

| 경로 | 내용 |
|---|---|
| `index.html` | 홈페이지 전체(HTML·CSS·JS 한 파일). 한/영 문구는 스크립트의 `i18n`, 게임 상세 창 내용은 `games` 객체 |
| `assets/` | 게임 아이콘, 대표 배너 |
| `assets/screens/` | 상세 창 스크린샷. `<게임>-<ko\|en>-<번호>.jpg`, 언어 구분이 없으면 `<게임>-<번호>.jpg` |
| `data/ratings-config.json` | 평점 수집 대상 게임과 추천 기준 |
| `data/ratings.json` | 수집된 평점(자동 생성 — 직접 수정하지 않음) |
| `tools/update-ratings.mjs` | 평점 수집 스크립트 |
| `support/`, `claw/`, `reborn-starship-idle/` | 지원 페이지·개인정보처리방침 등 스토어 심사용 페이지 |

## 게임 추가하기

1. `assets/` 에 아이콘, `assets/screens/` 에 세로 스크린샷(긴 변 720px 안팎 JPG)을 넣는다.
2. `index.html` 의 게임 카드(`<article class="card" data-game="키">`)를 하나 복사해 고친다. `data-platform` 은 `mobile`, `web` 중 해당하는 것을 공백으로 나열한다(필터에 쓰인다).
3. 스크립트의 `games` 에 같은 키로 한/영 상세(제목·태그·스크린샷·소개·특징)를, `i18n` 에 카드 문구를 추가한다.
4. 스토어에 출시된 게임이면 `data/ratings-config.json` 의 `games` 에 스토어 ID 를 추가한다.

## NEW 배지

NEW 표시가 필요한 요소에 출시일만 적는다. 30일(`NEW_DAYS`)이 지나면 스크립트가 알아서 지우므로 나중에 손댈 필요가 없다.

```html
<span class="badge new" data-new-since="2026-10-07">NEW</span>
```

## 추천 배지 (스토어 평점 자동 갱신)

`.github/workflows/update-ratings.yml` 이 매주 월요일 09:00 KST 에 `tools/update-ratings.mjs` 를 실행한다.

- App Store 는 iTunes Lookup API, Google Play 는 스토어 페이지에 들어 있는 평점 정보(JSON-LD)를 읽는다. Google Play 쪽은 공식 API 가 아니라서 페이지 구조가 바뀌면 그 주에는 조회에 실패한다.
- 조회에 실패한 스토어는 직전 값을 유지한다.
- 두 스토어 평점을 평가 수로 가중 평균해, `recommend.minRating`(4.0) 이상이고 평가 수가 `recommend.minCount`(20) 이상이면 `recommended: true` 가 된다. 평가 1건짜리 5점이 추천되는 것을 막기 위한 최소 건수다.
- 값이 바뀐 주에만 `data/ratings.json` 을 커밋하고 Pages 를 다시 빌드한다. 홈페이지는 이 파일의 `recommended` 만 읽어 카드와 상세 창에 "추천 ★4.7" 배지를 붙인다.
- 바로 갱신하려면 GitHub Actions 탭에서 **Update store ratings** 를 수동 실행한다.

로컬에서 확인:

```bash
node --test tools/update-ratings.test.mjs
node tools/update-ratings.mjs
```
