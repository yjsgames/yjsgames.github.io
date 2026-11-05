# Domino 광고·구매 정책 변경 검토

상태: Draft PR. **새 네이티브 바이너리 대조 전에는 main에 머지하거나 게시하지 않는다.** GitHub Pages는 main을 배포하므로 이 브랜치를 배포 대상으로 바꾸지 않는다.

## 변경

- 기존 Firebase 계정·클라우드 저장·삭제 안내를 보존한다.
- 한·영 정책에 LevelPlay/ironSource Ads, Unity Ads, Google AdMob, 광고 식별자·상호작용·진단, ATT/UMP 선택, 광고 제거 구매와 구매 검증 처리를 추가한다.
- 실제 통합 소스 `domino-no-ads`에는 Firebase Analytics/Crashlytics가 없다는 개발 담당자 확인을 반영한다. 별도 `domino-production-ads` WIP의 분석 코드를 이번 정책 근거로 승계하지 않는다.
- 구매 검증은 Firebase UID·스토어·상품·거래 ID와 Google token/Apple signed transaction을 서울 함수에 TLS 전송한다는 구현 담당자 확인을 반영한다. 영수증 본문 비로그·별도 서버 권한 원장 없음도 최종 바이너리로 대조한다.
- source `a6894eb2c9dc7f51d13ddaf5ff7da2f54afe1c6e`와 공유 패키지 `1568ec4` 읽기 전용 대조: 로컬 PlayerPrefs pending journal은 원 UID/TID만 저장하며 Google 영수증 원문/Apple JWS는 게임 진행 세이브에 넣지 않는다. cloud `progress.shop.owned`는 내부 상품 ID `remove_ads`, 광고 제거 출처 `sourceKey`는 스토어 SKU를 저장한다. `grantedTransactions`는 미확정 TID, `confirmedTransactions`는 최근 확정 TID 최대64개다. native acknowledgement 뒤 로컬 journal만 제거하며 cloud TID는 미확정 목록에서 확정 목록으로 이동한다.
- 후속 source `92ca488265ff3786d9e190489272b3ba3b19d637` / shared `1568ec4`에서 삭제 완료 UID와 일치하는 로컬 구매 journal 두 키 정리를 확인했다. 일반 삭제와 시작 시 비동기 재개가 같은 콜백을 사용하고, 로컬 정리 실패·취소 시 RemoteComplete를 유지해 재시도한다. 다른 계정의 journal은 지우지 않는다. `DominoGame.Startup.cs:76`, `DominoFirebaseCloudService.cs:401`, `DominoStorePurchaser.cs:171` 및 `DominoFirebaseServiceTests.cs:20,58`을 exact source로 대조했다. 이전 잔류 문제는 코드상 해결됐으며 실제 PlayerPrefs/계정 삭제 기기 검증은 여전히 제출 게이트다.
- 같은 후속 source의 StoreKit2 JWS는 필수이고 기존 Apple receipt는 선택 사항이다. Firebase UID는 검증 요청의 Bearer 토큰으로 전달되며 영수증/JWS는 게임 세이브에 넣지 않는다. `UnityWebRequestStorePurchaseVerifier.cs:27`, `UnityIapStorePlatform.cs:368`, `purchase_validation.js:15`와 receipt 없는 JWS·위조 거부 테스트 코드를 확인했다. 테스트 코드를 읽은 사실은 이번 점검에서 테스트 실행 또는 네이티브 구매 동작을 검증했다는 뜻이 아니다. 현재 한·영 정책 문구와 코드 간 추가 불일치는 확인되지 않았다.
- 같은 source의 `opening.shopAfter=3`에 따라 상점은 세 번째 판 이후 해금된다. 실제 새 빌드에서 심사 접근 경로를 확인한 뒤 심사 메모에 반영한다.
- 최신 게임 source `833387f3fbee9a24cc38d6481c78ab01cf413c12`는 IAP 5.5.0을 사용한다. 실제 로컬 패키지 cache의 `PurchaseEventEmitter`와 `PlayerData` 경로 및 Unity 공식 5.4+ 고지를 대조해 Unity IAP 구매 이벤트·식별자·기술 정보·매출 보고를 한영 정책에 추가했다. Unity Analytics 패키지가 없어 transaction analytics adapter가 비어도 별도 Insights 경로 부재를 뜻하지 않는다. 광고 식별자 등은 패키지의 consent 조건과 별도로 대조한다. D2C/Webshop/CodaPay를 선택하는 게임 호출은 확인되지 않았으며 네이티브 스토어 구매를 고지한다. 패키지 내부 경로 확인은 최종 바이너리의 실제 전송 증거가 아니다.
- 같은 exact source의 Google 로그인은 새 설정에 WebClientId와 ID token 요청만 지정한다. RequestEmail/Profile 기본false, AdditionalScopes=null이며 구체 호출에서 전화번호 scope/필드 접근을 찾지 못했다. 기존 설정을 재사용할 때 scope 전체를 검사하지 않으므로 최종 native scope 검증을 남긴다. SDK manifest의 PhoneNumber/OtherDataTypes 항목만으로 앱의 실제 수집을 확정하지 않는다.
- unsigned 833 archive의 전체 PrivacyInfo 13개와 Info.plist 1.0.0(3), SKAdNetwork ID93개를 원문 JSON으로 대조했다. Unity 콘솔 참조76개에 대해 누락0·추가17이다. GoogleMobileAds DeviceID 항목의 tracking=true를 포함하므로 다른 manifest의 top-level tracking=false를 앱 전체 추적 없음으로 사용하지 않는다. 서명·ATT/UMP·구매 실기기 검증은 별도다.
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
- [Unity IAP 5.4+ 개인정보 개요](https://docs.unity.com/en-us/iap/privacy-and-consent/overview)
- [Google 로그인 iOS 데이터 고지](https://developers.google.com/identity/sign-in/ios/app-privacy)

조회일 2026-11-05. 공식 문서의 SDK 기준 버전과 실제 바이너리 버전을 구분하며, SDK 문서의 합집합만으로 지역별 실제 동작이나 앱 전체 고지의 정확성을 확정하지 않는다.
