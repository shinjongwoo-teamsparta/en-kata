# en-kata

소프트웨어 엔지니어를 위한 영어 타이핑 연습 게임.
단순 타자 속도뿐 아니라 코드에서 자주 쓰이는 어휘·숏 코드·네이밍 컨벤션을 빠르고 정확하게 입력하는 훈련이 목적.

---

## Tech Stack

| Layer | Stack |
|-------|-------|
| Framework | Next.js 15 (App Router) + React 19 + TypeScript |
| Styling | Tailwind CSS 4 + CSS Variables (Catppuccin Latte/Mocha) |
| Animation | Framer Motion |
| i18n | next-intl (en, ko) |
| Font | Geist Mono |
| DB | PostgreSQL + Prisma (준비됨, 아직 미사용) |
| API | tRPC 11 (인프라 구축 완료, 게임에서는 미사용) |
| Package Manager | pnpm |

---

## 게임 모드

### Word Mode (단어)
- SW 엔지니어링 관련 단어를 하나씩 타이핑
- 카테고리: `general` | `frontend` | `backend` | `devops` | `database`
- 난이도: easy / medium / hard
- 어휘 힌트 토글 (단어 정의 & 사용 예시)

### Phrase Mode (문장)
- 개발 관련 문장 & 표현 타이핑
- 난이도: easy / medium / hard

### Short Code Mode (숏 코드)
- 코드에서 자주 쓰이는 짧은 코드 조각 & 연산자 (5~25자)
- 언어 선택: `JS/TS` | `Python`
- 예 (JS/TS): `() => {}`, `Record<K, V>`, `a ?? b`, `JSON.parse()`
- 예 (Python): `lambda x: x`, `__init__`, `[x for x in xs]`, `@property`
- 난이도 없음 (medium 고정)

### Variable Name Mode (변수명)
- 화면에 설명 문구가 표시되면 선택한 네이밍 컨벤션으로 변환하여 입력
- 컨벤션: `camelCase` | `snake_case` | `kebab-case` | `PascalCase`
- 예: "get user profile" → `getUserProfile`
- 난이도 없음 (medium 고정)

---

## 게임 설정

| 항목 | 옵션 | 비고 |
|------|------|------|
| 시간 제한 | 30s / 60s / 120s | |
| 난이도 | easy / medium / hard | shortCode, variableName 모드는 스킵 |
| 카테고리 | general / frontend / backend / devops / database | word 모드 전용 |
| 언어 | JS/TS / Python | shortCode 모드 전용 |
| 네이밍 컨벤션 | camelCase / snake_case / kebab-case / PascalCase | variableName 모드 전용, localStorage 저장 |
| 어휘 힌트 | on / off | word 모드 전용, localStorage 저장 |
| 테마 | Light / Dark / System | |
| 언어 | English / 한국어 | |

---

## 페이지 구조

```
/[locale]/          → 게임 설정 (OPOA 스텝 위자드)
/[locale]/play      → 타이핑 게임
/[locale]/result    → 결과 화면
```

### 홈 (게임 설정)
- 스텝별 위자드: Mode → 세부분류(카테고리/언어/컨벤션) → 난이도 → 시간
- 모드에 따라 불필요한 스텝 자동 스킵
- 슬라이드 애니메이션, 스텝 인디케이터, 선택 요약 표시

### 게임 플레이
- 글자 단위 실시간 정확/오류 피드백 (초록/빨강)
- 애니메이션 커서
- 실시간 WPM 계산
- 카운트다운 타이머 (10초 이하 경고)
- 다음 7개 단어 미리보기
- 단어 소진 시 자동 추가 로드
- ESC로 나가기

### 결과 화면
- WPM, CPM, 정확도(%), 완료 단어 수
- 시간별 WPM 바 차트
- 가장 많이 틀린 글자 Top 5
- 같은 설정으로 재시도 / 설정 변경 버튼

---

## 데이터

`src/data/` 에 JSON 파일로 관리 (빌드 타임 로드):

| 파일 | 내용 |
|------|------|
| `words.json` | 카테고리별 × 난이도별 SW 단어 |
| `phrases.json` | 난이도별 개발 문장 |
| `symbols.json` | 언어별(JS/TS, Python) 숏 코드 조각 |
| `naming-phrases.json` | 네이밍 컨벤션 변환용 구문 |
| `word-hints.json` | 단어 정의 & 사용 예시 (700+ 항목) |

---

## 아키텍처

- **클라이언트 중심**: 게임 로직 전체가 브라우저에서 실행
- **URL 파라미터 기반**: 게임 설정은 query params로 전달, 결과도 인코딩하여 URL로 전달
- **Stateless**: 서버 사이드 데이터 저장 없음 (DB 인프라는 준비됨)
- **완전한 i18n**: UI 전체 영어/한국어 지원
- **테마 시스템**: Catppuccin 팔레트 기반 Light/Dark 모드

---

## 로컬 개발

```bash
pnpm install
pnpm dev
```

http://localhost:3000 에서 실행.

---

## Roadmap

### Phase 2
- [ ] GitHub OAuth 로그인 (NextAuth)
  - 비 로그인 유저도 플레이 가능해야 됨
- [ ] 게임 결과 DB 저장 (Prisma + PostgreSQL)
- [ ] 통계 대시보드 (일별/주별 WPM 추이, 모드별 최고 기록)
- [ ] 키보드 사운드 옵션

### Phase 3
- [ ] 리더보드
- [ ] 커스텀 단어장
- [ ] 멀티플레이어 (실시간 대전)
