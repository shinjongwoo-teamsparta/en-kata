# CLI GitHub 연동 구현 계획

## Context

현재 `apps/cli`는 로컬에서만 동작하며, `apps/web`의 서브셋이다. 웹에는 GitHub OAuth 인증, 결과 저장, 리더보드, 통계 기능이 있지만 CLI에는 없다. CLI에서도 GitHub 로그인을 통해 동일한 백엔드에 데이터를 저장하고 조회할 수 있게 한다.

## 핵심 설계 결정

### 인증 방식: GitHub Device Flow

- CLI 표준 방식 (`gh auth login`과 동일)
- 유저코드 표시 → 브라우저에서 입력 → CLI에서 폴링으로 토큰 수신
- `client_id`만 필요 (시크릿 불필요, 하드코딩 가능)
- 기존 GitHub OAuth App에서 Device Flow 활성화

### API 인증: Bearer 토큰 (GitHub access token 직접 사용)

- CLI가 tRPC 요청 시 `Authorization: Bearer <github_token>` 헤더 전송
- 서버에서 GitHub API로 토큰 검증 → `Account` 테이블에서 유저 매칭
- 기존 NextAuth 세션 기반 인증은 그대로 유지 (웹은 쿠키, CLI는 Bearer)
- DB 스키마 변경 없음

### API 통신: 기존 tRPC 엔드포인트 재사용

- `gameResult.save`, `getLeaderboard`, `getStats` 등 기존 프로시저 그대로 사용
- CLI에서 `@trpc/client` + `httpBatchLink`으로 호출
- `AppRouter` 타입을 웹앱에서 export하여 타입 안전성 확보

## 변경 파일 목록

### Web App (apps/web)

| # | 파일 | 설명 |
|---|------|------|
| 1 | `apps/web/src/server/api/trpc.ts` | `createTRPCContext`에 Bearer 토큰 인증 경로 추가. `Authorization` 헤더 → GitHub API 검증 → Account 테이블 유저 조회 → 세션 구성 |
| 2 | `apps/web/src/lib/github.ts` (신규) | GitHub 토큰 검증 유틸리티. `verifyGitHubToken(token)` → GitHub user 정보 반환 |
| 3 | `apps/web/src/app/api/cli/auth/route.ts` (신규) | CLI 유저 등록 엔드포인트. GitHub 토큰 인증 후 User/Account 레코드 없으면 생성 |

### CLI App (apps/cli)

| # | 파일 | 설명 |
|---|------|------|
| 4 | `apps/cli/src/lib/auth.ts` (신규) | GitHub Device Flow 구현. device_code/user_code 획득 → 폴링 → 토큰 수신 |
| 5 | `apps/cli/src/lib/config.ts` (신규) | 토큰 로컬 저장소 (`~/.config/en-kata/auth.json`). `loadAuth()`, `saveAuth()`, `clearAuth()` |
| 6 | `apps/cli/src/lib/api.ts` (신규) | tRPC 클라이언트. `@trpc/client` + `httpBatchLink`, Bearer 토큰 자동 첨부 |
| 7 | `apps/cli/src/app.tsx` | Screen 타입 확장: `login`, `leaderboard`, `stats` 추가 |
| 8 | `apps/cli/src/screens/Menu.tsx` | 인증 상태 표시, `[g] 로그인`, `[b] 리더보드`, `[s] 통계` 키바인딩 |
| 9 | `apps/cli/src/screens/Result.tsx` | 로그인 시 결과 자동 저장, 비로그인 시 안내 메시지 |
| 10 | `apps/cli/src/screens/Login.tsx` (신규) | Device Flow UI: 유저코드 표시, 브라우저 오픈, 폴링 스피너 |
| 11 | `apps/cli/src/screens/Leaderboard.tsx` (신규) | 리더보드 테이블: 모드/기간 필터, 순위표 |
| 12 | `apps/cli/src/screens/Stats.tsx` (신규) | 개인 통계: 모드별 최고 WPM, 최근 추세 |

### 의존성 & 빌드

| # | 파일 | 설명 |
|---|------|------|
| 13 | `apps/cli/package.json` | `@trpc/client`, `superjson` 추가 |
| 14 | `apps/cli/tsup.config.ts` | `__API_URL__`, `__GITHUB_CLIENT_ID__` 빌드 상수 |

## 구현 순서

```
Phase 1 (병렬): Web Bearer 인증 + CLI auth/config 모듈
Phase 2:        Web 유저 등록 API + CLI tRPC 클라이언트
Phase 3:        CLI Login 스크린 + Menu/App 확장
Phase 4 (병렬): Leaderboard 스크린 + Stats 스크린 + Result 자동 저장
Phase 5:        E2E 테스트
```

## 사전 조건

- GitHub OAuth App에서 Device Flow 활성화 필요
- Client ID 확보 필요

## 검증 방법

1. CLI에서 `g` 키로 로그인 → 브라우저에서 GitHub 인증 → CLI에서 "Logged in as ..." 확인
2. 게임 완료 후 결과가 서버에 저장되는지 확인 (웹 리더보드에서 조회)
3. CLI 리더보드에서 웹과 동일한 데이터 표시 확인
4. CLI 통계에서 저장된 게임 결과 집계 확인
5. 로그아웃 후 토큰 파일 삭제 확인

## 주의사항

- GitHub API rate limit: 인증된 요청 5000/시간. CLI 사용 빈도로는 충분
- 웹에 가입하지 않은 유저가 CLI로 먼저 로그인하는 케이스 → `/api/cli/auth`에서 처리
- 토큰 만료/취소 시 401 처리 → 재로그인 안내
