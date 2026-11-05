# Domino 광고·구매 정책 변경 검토

상태: Draft PR. **새 네이티브 바이너리 대조 전에는 main에 머지하거나 게시하지 않는다.** GitHub Pages는 main을 배포하므로 이 브랜치를 배포 대상으로 바꾸지 않는다.

## 변경

- 기존 Firebase 계정·클라우드 저장·삭제 안내를 보존한다.
- 한·영 정책에 LevelPlay/ironSource Ads, Unity Ads, Google AdMob, 광고 식별자·상호작용·진단, ATT/UMP 선택, 광고 제거 구매와 구매 검증 처리를 추가한다.
- 실제 통합 소스 `domino-no-ads`에는 Firebase Analytics/Crashlytics가 없다는 개발 담당자 확인을 반영한다. 별도 `domino-production-ads` WIP의 분석 코드를 이번 정책 근거로 승계하지 않는다.
- 구매 검증은 Firebase UID·스토어·상품·거래 ID와 Google token/Apple signed transaction을 서울 함수에 TLS 전송한다는 구현 담당자 확인을 반영한다. 영수증 본문 비로그·별도 서버 권한 원장 없음도 최종 바이너리로 대조한다.
- source `a6894eb2c9dc7f51d13ddaf5ff7da2f54afe1c6e`의 구현 담당자 확인: 게임의 로컬 PlayerPrefs pending journal에는 원 UID/TID만 저장하며, Google 영수증 원문/Apple JWS는 게임 진행 세이브에 넣지 않는다. cloud `progress.shop`은 보유 SKU·광고 제거 출처·지급 TID·확정 TID(최근64개)를 저장한다. native acknowledgement 뒤 제거하는 것은 로컬 pending UID/TID journal이며 클라우드 확정 거래 이력 전체가 아니다.
- 같은 source의 `opening.shopAfter=3`에 따라 상점은 세 번째 판 이후 해금된다. 실제 새 빌드에서 심사 접근 경로를 확인한 뒤 심사 메모에 반영한다.
- app-ads.txt에는 Unity 조직의 현재 전체 목록과 공개 파일을 비교해 누락된 `monetrix.ai, 10761, RESELLER` 한 행만 추가한다. 기존 OWNERDOMAIN·Google DIRECT·Unity DIRECT와 다른 판매자를 모두 보존한다.

## 콘솔 근거

2026-11-05 실제 UI에서 Google/Unity 계정 `yjs221126@gmail.com`, Unity 조직14569632709105, 개발자6454708, 웹사이트 `https://yjsgames.github.io`를 확인했다. Unity authorized seller 전체162행과 공개 파일164행의 차이는 위 한 행이다. 공개 파일 HTTP200 및 Google/Unity DIRECT 일치를 확인했다.

Domino Android/iOS의 기존 AdMob 앱과 파트너 입찰 단위를 재사용했다. 기존 YJS GDPR 메시지의 다른9개 앱과 동의·언어 설정을 보존하고 Domino2개 앱 및 정책 URL을 추가해 게시했다. 미출시 앱의 스토어 연결은 완료로 입력하지 않았다.

## 머지·게시 게이트

- [ ] 최종 source SHA / 버전 / CI 산출물·서명 확인.
- [ ] 실제 Podfile.lock, Android 의존성, 임베디드 SDK·PrivacyInfo.xcprivacy와 정책 데이터 유형 대조.
- [ ] ATT 허용/거부, UMP 선택·필요 시 옵션 재열기, 선택 후 광고 요청 재평가의 기기 증거.
- [ ] 구매·취소·복원·pending 정리·서버 검증·계정 클라우드 저장 동작과 정책 대조.
- [ ] 최종 한·영 페이지의 모바일 렌더·링크·계정 삭제 앵커 검증.
- [ ] 정식 PR 리뷰와 현재 HEAD 검증.
- [ ] 정책 게시 후 공개 HTTP200·한영 내용·app-ads 합집합·Unity 인증 재조회.

현재 App Store build2와 과거 AAB2는 광고·세이프 영역 수정 전 보존본이며 이번 정책과 결합해 제출하지 않는다. 새 source/SDK 구성이 바뀌면 이 초안도 갱신한다.

## 공식 근거

- [Apple App Privacy Details](https://developer.apple.com/app-store/app-privacy-details/)
- [Google Mobile Ads Unity 데이터 고지](https://developers.google.com/admob/unity/privacy/data-disclosure)
- [LevelPlay Apple 개인정보 설문](https://docs.unity.com/en-us/grow/levelplay/platform/legal-resources/apple-privacy-questionnaire)
- [Unity Ads iOS 개인정보 설문](https://docs.unity.com/en-us/ads-ios/4.21.0/privacy/developer-consent/disclosures/apple-privacy-survey)
- [Firebase Apple 데이터 고지](https://firebase.google.com/docs/ios/app-store-data-collection)

조회일 2026-11-05. 공식 문서의 SDK 기준 버전과 실제 바이너리 버전을 구분하며, SDK 문서의 합집합만으로 지역별 실제 동작이나 앱 전체 고지의 정확성을 확정하지 않는다.
