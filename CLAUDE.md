# CLAUDE.md

이 파일은 Claude Code(claude.ai/code)가 이 저장소에서 작업할 때 참고하는 안내 문서입니다.

## 실행 명령어

터미널에서 아래 명령어를 입력해 실행합니다.

```bash
npm run dev        # 개발용 서버 실행 (브라우저에서 localhost:8080으로 접속)
npm run build      # 실제 배포용 파일 생성
npm run lint       # 코드 문법 오류 검사
npm run test       # 자동화 테스트 1회 실행
npm run test:watch # 코드 수정 시 자동으로 테스트 재실행
npm run preview    # 배포용 파일을 로컬에서 미리 확인
```

E2E(전체 흐름) 테스트는 Playwright를 사용하며, `playwright.config.ts`에 설정이 있습니다.

## 사용 기술

| 역할 | 기술 |
|------|------|
| 화면 구성 | React 18 + TypeScript (Vite로 빌드) |
| 데이터베이스 | Supabase (PostgreSQL 기반 클라우드 DB) |
| 로그인 | Google OAuth (Supabase Auth 연동) |
| 데이터 불러오기 | TanStack React Query |
| UI 컴포넌트 | shadcn/ui + Radix UI + Tailwind CSS |
| 배포 플랫폼 | Lovable Cloud (`src/integrations/lovable/`) |

## 구조 설명

### 로그인 흐름

앱이 실행되면 `App.tsx`가 가장 먼저 로그인 상태를 확인합니다 (`src/contexts/AuthContext.tsx`).
- 로그인이 안 된 사용자 → Google 로그인 화면 표시 (`LoginPage`)
- 로그인된 사용자 → 메인 체크리스트 화면 표시 (`Index`)

### 메인 화면 (`src/pages/Index.tsx`)

체크리스트의 핵심 기능이 모두 이 파일 하나에 있습니다 (약 330줄).

- 현재 로그인한 사용자의 항목만 불러옴
- 항목 추가 / 삭제 / 완료 체크 기능
- 메모 입력 시 0.5초 후 자동 저장
- 항목은 카테고리별(월간 점검, 분기 점검)로 묶여 접고 펼칠 수 있음
- 전체 / 완료 / 미완료 필터링 및 완료율 진행 바 표시

### 데이터베이스

Supabase의 `checklist_items` 테이블에 데이터를 저장합니다.

| 컬럼 | 설명 |
|------|------|
| id | 항목 고유 번호 |
| user_id | 어느 사용자의 항목인지 |
| title | 항목 제목 |
| category | 카테고리 (월간/분기) |
| checked | 완료 여부 |
| memo | 메모 내용 |
| created_at / updated_at | 생성/수정 일시 |

보안 정책(RLS)으로 각 사용자는 자신의 항목만 조회·수정·삭제할 수 있습니다.
신규 가입 사용자에게는 기본 항목 6개가 자동으로 생성됩니다 (`supabase/migrations/` 참고).

### 경로 별칭

코드 내에서 `@/`는 `src/` 폴더를 가리킵니다. `tsconfig.json`과 `vite.config.ts` 양쪽에 설정되어 있습니다.

## 환경 설정

Supabase 접속 정보는 `.env` 파일에 저장됩니다.

```
VITE_SUPABASE_PROJECT_ID      # 프로젝트 ID
VITE_SUPABASE_PUBLISHABLE_KEY # 공개 API 키
VITE_SUPABASE_URL             # Supabase 서버 주소
```

클라이언트 초기화는 `src/integrations/supabase/client.ts`에서 한 번만 이루어집니다.
