# Rubble 모바일 개인정보처리방침 검토

2026-11-11 · 초안/로컬 검토 단계. 아직 main에 병합하거나 공개 URL·AdMob 개인정보 메시지에 등록하지 않았다.

사용자는 Rubble 광고 대상이 아동과 일반 이용자의 혼합 대상이라고 정했고, 정책 URL이 비어 있는 것을 알린 뒤 다른 프로젝트를 참고하라고 요청했다. 기존 `domino/privacy/index.html`의 한영 구성, 운영자 연락처, 선택형 계정과 광고·제공업체·삭제 안내 구조를 참고했다. Rubble의 실제 기능을 기준으로 새 문안을 작성했다.

## 문안의 원본

- 게임: [Rubble PR #9](https://github.com/YJS-Games/rubble/pull/9), [광고 PR #11](https://github.com/YJS-Games/rubble/pull/11). 현재 광고 후보 소스 `c37b49be6d281c7e80fa013d908706dd05f26d00`.
- `RubbleMobileAccountView`, `RubbleMobileServices`, `RubbleAdAudience`, `RubbleMobileAdsBootstrap`의 계정/클라우드 선택, 개인정보 안내, 광고 연령·ATT/UMP 경계를 대조한다.
- Rubble의 광고 연령대는 12세 이하, 13~15세, 16세 이상이다. 16세 미만은 광고 보호 신호와 Google 콘텐츠 제한을 적용한다. 미선택에서는 광고 요청을 시작하지 않는다. 연령 선택은 계정/클라우드 선택과 별개다.
- 도미노의 18세 성인 경계, 별도 보호 저장 슬롯, 아동의 전체 온라인 차단, 보상형 광고·IAP·계정 광고 제거 혜택을 Rubble 정책에 복사하지 않았다.
- 삭제 차단 기록은 계정 식별자와 삭제 시각이며, 게임 진행·이메일·토큰을 포함하지 않는 현재 구현을 설명한다. 외부 제공업체의 모든 기록이 즉시 삭제된다는 표현은 사용하지 않는다.

## 확인과 한계

- 기존 광고 후보 ff5fdf8b에서 자동 초기화 제거 마커의 적용 실패를 발견했다. 수정한 2a6e0d1의 Android APK 빌드·서명·CRC·SHA256 및 최종 매니페스트에서 GMA provider·Unity Ads initializer·AD_ID/AdServices 권한 제거와 측정 지연 true를 확인했다. 이후 배너 이벤트와 안전 영역 동기화를 보완한 c37b49b의 재빌드는 진행 중이다.
- ff5fdf8b iOS Xcode 내보내기는 성공했지만 SPM/CocoaPods 혼합을 발견해, 2a6e0d1에서 광고 SDK를 CocoaPods로 통일했다. 최종 내보내기/Pod 해석 대조가 남았다. 서명 IPA·실제 iPhone 검증을 뜻하지 않는다.
- A24는 `deviceLocked=1`, secure keyguard showing 상태라 게임·광고의 실제 표시를 확인하지 못했다. 앱은 force-stop, 화면 sleep을 확인했고 기기 lease를 반환했다. 광고 fill, 동의 창, 실제 네트워크 전송 0을 확인한 것으로 쓰지 않는다.
- AdMob 두 신규 앱은 스토어 미연결/광고 게재 제한 상태다. 정책 URL과 기존 유럽 메시지의 대상 앱 추가는 공개 정책 게시 뒤 저장·재조회해야 한다.
- Unity 조직 잠금의 구체적 원인은 미확인이다. 별도 사용자 대화에서 승인된 지원 문의를 보냈으며 복구 답변을 기다린다. 정책 페이지 작성으로 조직 복구나 Unity Ads 송출을 완료 처리하지 않는다.

## 공개 전과 게시 후

- [x] 한국어 우선 페이지의 모바일 렌더·가로 넘침·삭제 앵커·제공업체 링크를 부모가 확인했다. 375px viewport에서 clientWidth/scrollWidth는 모두360px이며 한국어 첫 화면과 삭제 안내 화면을 열어 판독했다. 임시 viewport는 원복했다.
- [ ] 검토 원문과 게임의 최종 광고 후보 범위를 운영자가 확인하고 공개를 승인한다.
- [ ] 게시한 실제 HTTPS URL과 배포 본문을 대조하고, AdMob의 두 Rubble 앱에 동일한 정책 URL을 등록한다. 다른 11개 앱의 동의 메시지 설정은 보존한다.
- [ ] 공개 스토어 연결·광고 인증·실제 광고 송출은 각각 따로 확인한다.

공식 참고: [Google UMP](https://developers.google.com/admob/unity/privacy), [Google 광고 데이터 고지](https://developers.google.com/admob/unity/privacy/data-disclosure), [Firebase 개인정보 안내](https://firebase.google.com/support/privacy), [Unity 개인정보처리방침](https://unity.com/legal/privacy-policy).
