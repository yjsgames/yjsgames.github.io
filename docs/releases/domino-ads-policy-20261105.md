# Domino 광고·구매 정책 변경 검토

상태(2026-11-06): Draft PR. 사용자 요청에 따라 만 13세 미만을 포함하고 전체이용가에 맞추는 새 보호 모드를 대조 중이다. **새 모드의 최종 바이너리·서명된 iOS 빌드·실제 동작 검증과 정식 리뷰 전에는 main에 머지하거나 게시하지 않는다.** GitHub Pages는 main을 배포하므로 이 브랜치를 배포 대상으로 바꾸지 않는다.

## 새 보호 모드의 대조 기준

- 정책 초안의 코드 대조 후보는 PR58 `42e6e38a0f5977b64a8b88227433758c27b97d01`이다. 최종 소스나 새 native PASS로 확정한 값이 아니다. 이후 iOS 측정 지연 설정 등 변경이 생기면 다시 대조한다.
- `DominoAudiencePolicy`와 `DominoGame.Family/Startup`에서 만 18세 미만·미선택을 보호 모드로 처리하고, 성인 선택만 온라인 기능으로 진입하는 경로를 읽었다. 시작 시 연령 구간만 로컬 저장하며, 생년월일·정확한 나이를 입력받지 않는다. 차가운 시작에서는 다시 묻고 같은 프로세스의 선택은 유지한다.
- 보호 진행은 별도 로컬 슬롯을 사용한다. 기존 온라인 계정·클라우드 진행·구매 기록을 복제하거나 삭제하지 않는다. 계정/Firebase·소셜 로그인·광고·ATT/UMP·IAP 초기화 차단은 코드 대조이며 최종 바이너리/provider/실제 네트워크 검증이 남았다.
- 보호자 확인은 정책 웹사이트 이동의 일회성 확인이다. 법정대리인 신원 검증·법적 보호자 동의·온라인 SDK 허용으로 사용하지 않는다.
- 성인 설정의 광고 신고는 앱 버전과 빈 신고 항목을 넣은 메일 초안을 열며 자동 전송·플레이어 ID·첨부 추가가 없다. 실제 기기의 메일 앱 진입·취소는 미검증이다.
- 이전 65685a0 Android 실행의 CS0234 실패는 보존했다. 해당 컴파일 문제와 리뷰 P2(저장 실패 후 취소한 재시도)는 새 후보에서 수정했으며, 수정 후 일부 검사 통과를 최종 native PASS로 합산하지 않는다.

## 어린이 포함 요청 이전의 보존 산출물

- 어린이 포함 요청 이전 게임 병합 소스는 `38e9d75c183320239e3851a1935b0aec65962e8b`이며 PR48 후보 `8966710eb7e77ac060b5b20f41424643e3302d30`와 `Assets/Packages/server` 트리 차이는 0이다. 아래 보존 산출물과 a6894·92ca488·833 근거는 새 보호 모드의 최종 검증이 아니다.
- Jenkins `Domino-AOS-AAB #10`은 1.0.0(5), development=false, appBundle=true로 성공했다. 50,006,990바이트 AAB의 원본·회수·Aside 업로드 준비본 SHA256은 `034affe9eac940b1bd9b3396c23490ce1ce363621ec5fceedcc908f2ee357a85`로 같고, 추출 manifest에서 package `com.yjsgames.domino`, 결제 권한, targetSDK36을 확인했다. Google Play에서도 업로드된 App Bundle 5(1.0.0)를 확인했으며 심사·테스트 시작은 하지 않았다.
- iOS는 896 소스의 1.0.0(3) unsigned archive다. 전체 원문 근거 JSON SHA256 `f37c8c53dcba99e87e7b32454f5f66a843e0ec243382f6fcec06a55d5976c7e7`를 부모가 확인했다. PrivacyInfo 13개의 hash는 이전 c39와 모두 같고, SKAdNetwork93개에 공식 참조76개 누락0·추가17을 직접 재계산했다. 서명 IPA·실제 iPhone 동작을 증명하지는 않는다.
- Android 기본 native UI·Back 회귀 통과는 기기 담당자의 896 검증이며, 실제 결제·복원·계정 삭제·보상형 광고와 iPhone ATT/UMP는 별도 미완료 항목이다. 이전 Back P2는 c523에서 두 번 동일PID 복귀로 해결됐고 열린 결함으로 승계하지 않는다.
- 사용자 최신 범위는 Apple·Play 및 IAP 한국만이다. Apple 앱·IAP 모두 대한민국 1개/미래 국가 자동 추가 꺼짐을 저장·재조회했다. Play Alpha 대한민국 1개국 저장 화면도 확인했다. Play IAP는 대한민국 사용 가능/KRW10,000과 관측한 타국 사용 불가를 확인했고 전 국가 최종 감사는 남았다. 테스트 참가자는 모집 전이다.

## 변경

- 한·영 정책에 보호 모드와 성인 온라인 모드의 처리 범위, 별도 로컬 진행·기존 온라인 기록 보존, 보호자 확인의 한계, 성인의 광고 신고 메일 초안을 반영한다. 이 문안은 새 후보용 Draft이며 과거 AAB5/ASC build2에 붙여 제출하지 않는다.
- 기존 Firebase 계정·클라우드 저장·삭제 안내를 보존한다.
- 한·영 정책에 LevelPlay/ironSource Ads, Unity Ads, Google AdMob, 광고 식별자·상호작용·진단, ATT/UMP 선택, 광고 제거 구매와 구매 검증 처리를 추가한다.
- 실제 통합 소스 `domino-no-ads`에는 Firebase Analytics/Crashlytics가 없다는 개발 담당자 확인을 반영한다. 별도 `domino-production-ads` WIP의 분석 코드를 이번 정책 근거로 승계하지 않는다.
- 구매 검증은 Firebase UID·스토어·상품·거래 ID와 Google token/Apple signed transaction을 서울 함수에 TLS 전송한다는 구현 담당자 확인을 반영한다. 영수증 본문 비로그·별도 서버 권한 원장 없음도 최종 바이너리로 대조한다.
- source `a6894eb2c9dc7f51d13ddaf5ff7da2f54afe1c6e`와 공유 패키지 `1568ec4` 읽기 전용 대조: 로컬 PlayerPrefs pending journal은 원 UID/TID만 저장하며 Google 영수증 원문/Apple JWS는 게임 진행 세이브에 넣지 않는다. cloud `progress.shop.owned`는 내부 상품 ID `remove_ads`, 광고 제거 출처 `sourceKey`는 스토어 SKU를 저장한다. `grantedTransactions`는 미확정 TID, `confirmedTransactions`는 최근 확정 TID 최대64개다. native acknowledgement 뒤 로컬 journal만 제거하며 cloud TID는 미확정 목록에서 확정 목록으로 이동한다.
- 후속 source `92ca488265ff3786d9e190489272b3ba3b19d637` / shared `1568ec4`에서 삭제 완료 UID와 일치하는 로컬 구매 journal 두 키 정리를 확인했다. 일반 삭제와 시작 시 비동기 재개가 같은 콜백을 사용하고, 로컬 정리 실패·취소 시 RemoteComplete를 유지해 재시도한다. 다른 계정의 journal은 지우지 않는다. `DominoGame.Startup.cs:76`, `DominoFirebaseCloudService.cs:401`, `DominoStorePurchaser.cs:171` 및 `DominoFirebaseServiceTests.cs:20,58`을 exact source로 대조했다. 이전 잔류 문제는 코드상 해결됐으며 실제 PlayerPrefs/계정 삭제 기기 검증은 여전히 제출 게이트다.
- 같은 후속 source의 StoreKit2 JWS는 필수이고 기존 Apple receipt는 선택 사항이다. Firebase UID는 검증 요청의 Bearer 토큰으로 전달되며 영수증/JWS는 게임 세이브에 넣지 않는다. `UnityWebRequestStorePurchaseVerifier.cs:27`, `UnityIapStorePlatform.cs:368`, `purchase_validation.js:15`와 receipt 없는 JWS·위조 거부 테스트 코드를 확인했다. 테스트 코드를 읽은 사실은 이번 점검에서 테스트 실행 또는 네이티브 구매 동작을 검증했다는 뜻이 아니다. 현재 한·영 정책 문구와 코드 간 추가 불일치는 확인되지 않았다.
- 같은 source의 `opening.shopAfter=3`에 따라 상점은 세 번째 판 이후 해금된다. 실제 새 빌드에서 심사 접근 경로를 확인한 뒤 심사 메모에 반영한다.
- 과거 대조 source `833387f3fbee9a24cc38d6481c78ab01cf413c12`는 IAP 5.5.0을 사용한다. 실제 로컬 패키지 cache의 `PurchaseEventEmitter`와 `PlayerData` 경로 및 Unity 공식 5.4+ 고지를 대조해 Unity IAP 구매 이벤트·식별자·기술 정보·매출 보고를 한영 정책에 추가했다. Unity Analytics 패키지가 없어 transaction analytics adapter가 비어도 별도 Insights 경로 부재를 뜻하지 않는다. 광고 식별자 등은 패키지의 consent 조건과 별도로 대조한다. D2C/Webshop/CodaPay를 선택하는 게임 호출은 확인되지 않았으며 네이티브 스토어 구매를 고지한다. 패키지 내부 경로 확인은 최종 바이너리의 실제 전송 증거가 아니다.
- 같은 exact source의 Google 로그인은 새 설정에 WebClientId와 ID token 요청만 지정한다. RequestEmail/Profile 기본false, AdditionalScopes=null이며 구체 호출에서 전화번호 scope/필드 접근을 찾지 못했다. 기존 설정을 재사용할 때 scope 전체를 검사하지 않으므로 최종 native scope 검증을 남긴다. SDK manifest의 PhoneNumber/OtherDataTypes 항목만으로 앱의 실제 수집을 확정하지 않는다.
- 과거 unsigned 833 archive의 전체 PrivacyInfo 13개와 Info.plist 1.0.0(3), SKAdNetwork ID93개를 원문 JSON으로 대조했다. Unity 콘솔 참조76개에 대해 누락0·추가17이다. GoogleMobileAds DeviceID 항목의 tracking=true를 포함하므로 다른 manifest의 top-level tracking=false를 앱 전체 추적 없음으로 사용하지 않는다. 서명·ATT/UMP·구매 실기기 검증은 별도다.
- app-ads.txt에는 Unity 조직의 현재 전체 목록과 공개 파일을 비교해 누락된 `monetrix.ai, 10761, RESELLER` 한 행만 추가한다. 기존 OWNERDOMAIN·Google DIRECT·Unity DIRECT와 다른 판매자를 모두 보존한다.

## 콘솔 근거

2026-11-05 실제 UI에서 Google/Unity 계정 `yjs221126@gmail.com`, Unity 조직14569632709105, 개발자6454708, 웹사이트 `https://yjsgames.github.io`를 확인했다. Unity authorized seller 전체162행과 공개 파일164행의 차이는 위 한 행이다. 공개 파일 HTTP200 및 Google/Unity DIRECT 일치를 확인했다.

Domino Android/iOS의 기존 AdMob 앱과 파트너 입찰 단위를 재사용했다. 기존 YJS GDPR 메시지의 다른9개 앱과 동의·언어 설정을 보존하고 Domino2개 앱 및 정책 URL을 추가해 게시했다. 미출시 앱의 스토어 연결은 완료로 입력하지 않았다.

## 머지·게시 게이트

- [ ] 새 보호 모드 최종 게임 source와 Android AAB 버전·CI·회수 hash 대조. 과거 AAB5 대조 완료는 위 보존 이력으로만 유지.
- [ ] 새 보호 모드 iOS 산출물의 PrivacyInfo·SKAD·시작 전 측정 지연 정적 대조. 과거 896 unsigned 대조 완료와 구분.
- [ ] 보호 세션 cold-start에서 provider/광고·계정·IAP 비초기화 및 실제 네트워크·로컬 저장 재진입 확인.
- [ ] 중립 연령 선택·보호자 확인의 취소/백그라운드·외부 웹 이동을 한국어 실기 화면으로 확인.
- [ ] AdMob G/LevelPlay 메타데이터와 각 광고 네트워크 콘솔 필터·부적절 광고 신고 실제 동작 대조.
- [ ] 최종 iOS 서명 IPA와 해당 바이너리의 기기 검증.
- [ ] 실제 Podfile.lock, Android 의존성, 임베디드 SDK·PrivacyInfo.xcprivacy와 정책 데이터 유형 대조.
- [ ] ATT 허용/거부, UMP 선택·필요 시 옵션 재열기, 선택 후 광고 요청 재평가의 기기 증거.
- [ ] 구매·취소·복원·pending 정리·서버 검증·계정 클라우드 저장 동작과 정책 대조.
- [x] 현재 한·영 HTML의 모바일 렌더·링크·계정 삭제 앵커 검증(HTML 변경 시 다시 검증).
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
- [Google Families 정책](https://support.google.com/googleplay/android-developer/answer/9893335?hl=en)
- [Apple 심사 가이드라인](https://developer.apple.com/app-store/review/guidelines/)
- [LevelPlay AdMob 광고 콘텐츠 등급 전달](https://docs.unity.com/en-us/grow/levelplay/sdk/unity/networks/guides/google-admob)

조회일 2026-11-05~06. 공식 문서의 SDK 기준 버전과 실제 바이너리 버전을 구분하며, SDK 문서의 합집합만으로 지역별 실제 동작이나 앱 전체 고지의 정확성을 확정하지 않는다. 전체이용가 목표, Play 대상 연령·콘텐츠 등급, Apple 연령 등급·Kids Category는 별도 항목이며 임의로 같은 것으로 신고하지 않는다.
