# en-kata TUI App PRD

## 개요

en-kata 웹 타자연습 앱을 pnpm 모노레포로 전환하고, `npm i -g en-kata`로 설치 가능한 TUI(Terminal UI) 앱을 추가한다.

## 목표

- 터미널에서 개발자 영문 타자연습 가능
- 웹 앱과 핵심 로직(타이핑 엔진, 단어 데이터, 타입) 공유
- 글로벌 설치 후 `en-kata` 명령어로 바로 실행

## 초기 버전 범위 (v0.1)

### 포함

- **모노레포 전환**: pnpm workspace로 `packages/core`, `apps/web`, `apps/cli` 분리
- **공유 패키지** (`@en-kata/core`):
  - 타입 정의 (GameMode, Difficulty, GameResult 등)
  - 단어/문장/코드 데이터 (JSON)
  - 단어 생성 로직 (getWords, convertToConvention)
  - 게임 상수 (MODE_IDS, DURATIONS, DIFFICULTIES 등)
  - **TypingGameEngine** — 프레임워크 무관 게임 엔진 클래스
- **TUI 앱** (`en-kata` CLI):
  - Ink v5 (React for CLI) 기반
  - 메뉴 화면: 모드 → 카테고리/언어/컨벤션 → 난이도 → 시간 선택
  - 게임 화면: 실시간 타이핑, 글자별 색상(정답/오답/대기), WPM, 타이머
  - 결과 화면: WPM, CPM, 정확도, 완료 단어 수, 자주 틀린 문자
  - 4가지 모드 지원: word, phrase, code, variableName
- **웹 앱 정상 동작 유지**

### 미포함 (초기)

- 서버 연동 (결과 저장, 통계, 리더보드)
- 사용자 인증
- 로컬 파일 저장
- 사운드 효과

## 모노레포 구조

```
en-kata/
├── pnpm-workspace.yaml
├── package.json              (@en-kata/monorepo, private)
├── tsconfig.base.json
├── packages/
│   └── core/                 (@en-kata/core)
│       ├── src/
│       │   ├── index.ts      (barrel export)
│       │   ├── types.ts
│       │   ├── words.ts
│       │   ├── constants.ts
│       │   └── engine.ts     (TypingGameEngine)
│       └── data/
│           ├── words.json
│           ├── phrases.json
│           ├── short-codes.json
│           ├── naming-phrases.json
│           └── phrase-korean.json
├── apps/
│   ├── web/                  (@en-kata/web, private)
│   │   ├── src/
│   │   ├── prisma/
│   │   └── public/
│   └── cli/                  (en-kata, npm publish)
│       └── src/
│           ├── index.tsx
│           ├── app.tsx
│           └── screens/
│               ├── Menu.tsx
│               ├── Game.tsx
│               └── Result.tsx
```

## 핵심 설계: TypingGameEngine

`useTypingGame.ts` React 훅에서 프레임워크 무관 로직을 추출한 클래스.

```typescript
class TypingGameEngine {
  constructor(settings: GameSettings, callbacks?: EngineCallbacks)
  start(): void           // 게임 시작, 타이머 가동
  handleKey(key: string): void  // 키 입력 처리 (순수 문자열)
  getState(): TypingGameState   // 현재 상태 조회
  getResult(): GameResult | null // 결과 조회 (finished일 때)
  destroy(): void         // 타이머 정리

  // 콜백: onStateChange, onCorrectKey, onIncorrectKey, onWordComplete, onFinish
}
```

- 웹: `useTypingGame` 훅이 엔진을 래핑하여 React 상태로 변환
- CLI: Ink 컴포넌트가 엔진을 직접 사용, `useInput`으로 키 전달

## TUI 화면 흐름

```
$ en-kata

┌─────────────────────────────────────┐
│  en-kata - Developer Typing Practice │
│                                      │
│  Mode:                               │
│  > Word   Phrase   Code   Variable   │
│                                      │
│  Category:                           │
│  > General  Frontend  Backend  ...   │
│                                      │
│  Difficulty:                         │
│    Easy  > Medium   Hard             │
│                                      │
│  Duration:                           │
│    30s  > 60s   120s                 │
│                                      │
│  [Enter] Start    [Q] Quit           │
└─────────────────────────────────────┘

         ↓ Enter

┌─────────────────────────────────────┐
│  word · medium · general    42 WPM  │
│                              0:45   │
│                                      │
│     c o n s t r u c t o r           │
│     ▲▲▲▲▲                           │
│     (green=correct, red=wrong)       │
│                                      │
│  next: interface  prototype  algo..  │
│                                      │
│  Words: 12              [ESC] Quit   │
└─────────────────────────────────────┘

         ↓ 시간 종료

┌─────────────────────────────────────┐
│           Results                     │
│  word · medium · 60s                 │
│                                      │
│  WPM: 42    CPM: 210                │
│  Accuracy: 94%    Words: 15          │
│                                      │
│  Most missed: e(×3) r(×2) t(×1)    │
│                                      │
│  [Enter] Retry  [Q] Quit  [ESC] Menu │
└─────────────────────────────────────┘
```

## 기술 스택

| 영역 | 기술 |
|------|------|
| 모노레포 | pnpm workspace |
| 공유 패키지 | TypeScript (순수) |
| 웹 앱 | Next.js 15 + React 19 |
| TUI 앱 | Ink v5 + React 18 |
| TUI 빌드 | tsup (core 인라인 번들) |

## 향후 발전 방향

### Phase 2: 로컬 저장

- `~/.en-kata/history.json`에 게임 결과 저장
- `en-kata stats` 명령어로 개인 통계 확인 (평균 WPM, 정확도 추이)
- `en-kata history` 명령어로 최근 기록 조회

### Phase 3: 서버 연동

- GitHub OAuth 디바이스 플로우로 터미널 인증
- 기존 웹 서버의 tRPC API 호출하여 결과 동기화
- `en-kata leaderboard` 명령어로 리더보드 확인
- 로그인 상태 관리 (`~/.en-kata/auth.json`)

### Phase 4: 고급 기능

- 커스텀 단어/문장 파일 지원 (`--file custom-words.txt`)
- 멀티플레이어 모드 (WebSocket 기반 실시간 대전)
- 테마 설정 (터미널 색상 커스터마이징)
- 자동 업데이트 알림
- CI/CD 파이프라인에서 타이핑 스킬 벤치마크용 `--json` 출력
