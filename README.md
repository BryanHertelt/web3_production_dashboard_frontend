# Web Frontend — Production Dashboard

## Pre-Notes 
I haven't done this project alone. I've worked with other former and active students from Berlin Universities. The repo and infrastructure was designed for a large project involving 10+ dashboards and analytics pages. We've decided to interrupt the project since the TAM was to small and competitive for a team of our size, connections and experience. 
I've extracted these branches from the larger project containing the projects code (of course with approval of the other participants). 
Furthermore we've decided to interrupt this project while developing, therefore the test coverage is not 100% and you may encounter some linting warnings or logging errors, which aren't worth to solve now.

## 1. Repository Architecture

```
web/
├── .github/
│   └── workflows/
│       ├── ci.yml           # CI pipeline (lint, type-check, tests, security scans)
│       ├── deployment.yml   # Manual deployment to dev server
│       └── rollback.yml     # Manual rollback to a previous image tag
└── web-frontend/
    ├── mock_api/            # Mockoon API mock (Dockerfile + data file)
    ├── src/
    │   ├── app/             # Next.js App Router — pages and root layout
    │   ├── entities/        # Business data models and API calls (asset, coins, portfolio)
    │   ├── features/        # User-facing features (data-table, select-time-range)
    │   ├── page-components/ # Page-level assembled components (dashboard)
    │   ├── shared/          # Cross-cutting concerns:
    │   │   ├── api-layer/   # Client (axios) and server (fetch) HTTP abstractions
    │   │   ├── core-table/  # Generic table primitive (TanStack Table wrapper)
    │   │   ├── info-box/    # Reusable info card component
    │   │   ├── logger/      # Pino-based client and server loggers
    │   │   ├── ui/          # Feedback components (skeleton, spinner, toast icons)
    │   │   └── utils/       # Value formatting utilities
    │   ├── widgets/         # Composed UI blocks (charts, navbar, searchbar, table)
    │   └── __test__/        # All test files, mirroring src structure
    └── package.json
```

The frontend follows **Feature-Sliced Design (FSD)** — layers are strictly ordered (`shared → entities → features → widgets → page-components → app`) with no upward imports allowed.

---

## 2. Running the Project Locally

### Prerequisites
- Docker
- Node.js 20+

### Step 1 — Build and start the mock API

The project uses a [Mockoon](https://mockoon.com/) Docker image to simulate the backend API locally.

```bash
cd web-frontend/mock_api
docker build -t mockoon-api .
docker run -p 3002:3002 mockoon-api
```

The mock API will be available at `http://localhost:3002`.

### Step 2 — Install dependencies and start the dev server

```bash
cd web-frontend
npm install
npm run dev
```

The app will be available at `http://localhost:3000`.

---

## 3. GitHub Actions — CI/CD Flow

### CI (`ci.yml`) — triggered on push and PR to `dev`

All jobs run in parallel after a shared dependency install and cache step:

| Job | What it does |
|---|---|
| `typescript-check` | Runs `tsc --noEmit` to catch type errors |
| `eslint` | Lints source code with ESLint |
| `prettier-format` | Auto-formats code and commits changes back to the branch |
| `test-jest` | Runs Jest with coverage; uploads report artifacts |
| `security-secrets` | Scans git history for leaked secrets with Gitleaks |
| `semgrep-scan` | Static security analysis (OWASP Top 10, security-audit ruleset) |
| `security-audit` | `npm audit` for vulnerable dependencies |
| `generate-docs` | Generates TypeDoc documentation (runs only after all other jobs pass) |

### Deployment (`deployment.yml`) — manual `workflow_dispatch`

1. **version** — generates a version/image tag via a shared infra action
2. **docker-build** — builds the Docker image and uploads it as an artifact
3. **image-scan-job** — scans the image with Trivy (HIGH/CRITICAL CVEs fail the pipeline)
4. **push-image** — loads and pushes the verified image to GHCR
5. **deploy** — SSH-deploys the new image to the dev server via a shared infra action

Accepts a `database-backup` boolean input to optionally create a DB backup before deploying.

### Rollback (`rollback.yml`) — manual `workflow_dispatch`

Takes a `tag` (image version to roll back to) and triggers a rollback on the dev server via a shared infra action.

---

## 4. Test Suites and Strategy

Tests live in `web-frontend/src/__test__/` and mirror the source directory structure.

### Test runner and tooling

- **Jest** with `jest-environment-jsdom` for component tests
- **@testing-library/react** for rendering and asserting UI components
- Coverage enforced via thresholds: **80% branches/functions/lines, 70% statements**
- JUnit XML output for CI artifact collection

### Test suites

| Suite | Files | What is covered |
|---|---|---|
| **Component tests** | `charts`, `dashboard-page`, `info-box`, `layout`, `navbar`, `page`, `searchbar`, `select-time-range`, `table` | Rendering and basic behaviour of all major UI components |
| **API layer — client** | `axios-config`, `cancel-registry`, `errors`, `helpers`, `request`, `coins-api`, `portfolio-api` | Axios instance config, request/error handling, cancel token registry, and entity-level API calls |
| **API layer — server** | `fetch-config`, `errors`, `helpers`, `request` | Server-side fetch wrapper config, error normalisation, and request utilities |
| **Utils** | `formatValues` | Value formatting functions |
| **UI feedback** | `skeleton`, `use-loading` | Skeleton component and the `useLoading` hook |

### Strategy

- **Unit-first**: each FSD layer is tested in isolation; shared utilities and the API layer have dedicated unit test files.
- **Component smoke tests**: UI components are rendered with Testing Library to verify they mount without errors and produce expected output.
- **No E2E tests currently**: the mock API is used for local development only and is not wired into the Jest suite — API calls are mocked at the axios/fetch level in tests.
- **Security is a first-class CI concern**: Gitleaks (secrets), Semgrep (SAST), and `npm audit` run on every push alongside functional tests.
