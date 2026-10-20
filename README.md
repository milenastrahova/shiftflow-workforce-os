# ShiftFlow — Workforce Operations & Smart Scheduling

**[🚀 Live demo](https://shiftflow-workforce-os.vercel.app/) · [GitHub source](https://github.com/milenastrahova/shiftflow-workforce-os)**

> A polished, local-first workforce operations dashboard built to demonstrate **AI-assisted software development, workflow automation, business logic and critical validation**.

**React 19 · TypeScript · Tailwind CSS 4 · Vite · Recharts · Node native test runner**

ShiftFlow is a working portfolio prototype designed around a real operations problem: production teams need to know **who is working, which shifts are uncovered, and whether a proposed assignment is compliant and fair**. Instead of building just a visual mockup, this project connects a full management UI to a tested scheduling engine.

## Features

| Area | What you can do |
| --- | --- |
| Overview | See shift coverage, open positions, labor cost, hours, upcoming work, and action items. |
| Weekly schedule | Navigate weeks, filter by department, add/edit/delete shifts, publish drafts, export Excel-ready semicolon CSV or standards-friendly comma CSV. |
| Staff directory | Add/edit staff, roles, departments, hourly cost, weekly limits and workdays; archive members and reopen their future shifts. |
| Smart assistant | Recommend eligible teammates with transparent ranking and apply individual/batch suggestions. |
| Guardrails | Detect overlapping shifts, blocked weekdays, approved leave, weekly hour caps, invalid times and less than 11 hours of rest. |
| Time off | Request leave, approve/reject requests, prevent approval while assigned shifts overlap. |
| Reports | Labor cost, utilization, daily scheduled hours, department allocation and Excel-ready/standard CSV export. |
| Data | Automatic browser persistence, JSON backup and restore, sample-data reset. |

### What "smart" means here

**No misleading AI claims.** Scheduling suggestions come from a deterministic, explainable rules-and-scoring engine. Recommendations first reject ineligible candidates based on compliance, then score available staff by utilization and exact role match. Batch recommendations are generated sequentially so earlier assignments consume capacity. The app **does not** invoke a remote AI model, and it does not require an API key.

This design is intentionally verifiable and suitable for review in an AI-assisted coding role. Extending it to use an LLM for *natural-language planning* would require a separate server-side integration with validated inputs and strict guardrails; the LLM must never bypass the scheduling engine.

## Quick start

**Requirements:** Node.js 22.12+ and npm. Internet connection is required on the first install to download dependencies.

```bash
npm install
npm run dev
```

Open **http://localhost:5173**. The app loads with 10 demo employees, several scheduled shifts, open positions, and sample leave requests. Changes save automatically in the same browser.

### Build / validate

```bash
npm test          # Pure scheduling/validation unit tests, Node 22 native test runner
npm run typecheck # TypeScript static checking
npm run build     # TypeScript + optimized production bundle (dist/)
npm run preview   # Preview built bundle
```

CI is configured in `.github/workflows/ci.yml` to install, test and build on every push or pull request.

## Try this 3-minute walkthrough

1. On **Overview**, note open shifts and estimated labor cost.
2. Open **Schedule**. Select an open shift to edit, or use the **Smart assistant** recommendation.
3. Click **Auto-fill shifts** and review the exact proposed assignments before confirming.
4. Attempt to book an employee into overlapping hours: ShiftFlow refuses and explains why.
5. Open **Time off**, submit a request and approve or reject it. Approval is blocked if that person is scheduled during the leave.
6. Open **Reports** and **Settings** to export CSV or a JSON backup.

## Architecture

```text
src/
  App.tsx                React state, navigation, mutations, forms and feedback
  components/            Reusable UI and application shell
  pages/                 Overview, Schedule, Team, Time off, Reports, Settings
  lib/
    types.ts             Typed domain model
    dates.ts             Pure date/time functions
    engine.ts            Validation, scheduling suggestions and metrics
    seed.ts              Realistic reproducible demo dataset
    storage.ts           Validated localStorage persistence and JSON import
    export.ts            RFC-style CSV cell escaping and downloads
  styles.css             Tailwind design system / visual polish
tests/
  engine.test.ts         Dependency-light tests for core business rules
.github/workflows/ci.yml
```

### Data and safety

- All workspaces are stored in **browser localStorage** (key `shiftflow.workspace.v1`); there is **no backend, user login, cross-device sync or real authorization**. This is **not production-ready HR software**.
- **Do not use real employee information** in this demo. The application seeds fictional people only.
- Imported backups are structurally checked before replacement; the app does not execute imported content.
- Scheduling is for **same-day shifts only**, with an illustrative 11-hour rest rule and weekly hours cap. Work law rules vary by jurisdiction: the demo policy is not legal advice.
- Automatic scheduling suggestions are explainable, not generative AI output.
- Hourly rates / costs are illustrative and not payroll calculations (no taxes, breaks, overtime, leave pay).

## Engineering decisions & tradeoffs

| Decision | Why |
| --- | --- |
| Local-first prototype | Easy for a reviewer to demo instantly; no sign-in, hosting bill or credentials. |
| Pure TypeScript engine | Business logic can be unit-tested independently of React components. |
| Deterministic matching | Reproducible decisions are easier to review and debug than opaque recommendations. |
| Keep assignment validation server-portable | Enables migration of the same rules into an API later. |
| Recharts analytics | Clear operational insights without implementing custom chart infrastructure. |
| No fabricated AI integration | Transparent separation between AI-assisted *development* and actual runtime AI features. |

### Next steps toward production

1. PostgreSQL database, migrations and audited APIs.
2. Real authentication and role-based permissions for administrators/managers/staff.
3. Multi-tenant security, timezone-aware scheduling, shift breaks, overnight shifts, local labor-rule policies.
4. Integration tests and browser E2E tests (Playwright).
5. Server-side AI natural-language assistant *with* rule validation and human approval.
6. Server-side transactional scheduling updates to prevent simultaneous double bookings.

## Live demo & deployment

**Try the deployed app:** https://shiftflow-workforce-os.vercel.app/

The frontend is deployed with Vercel from this GitHub repository (branch `main`). Vercel detects Vite, runs `npm run build`, and serves the generated `dist/` directory. Changes merged into `main` can trigger a new deployment.

**Demo limitations:** This is a client-side portfolio prototype, not a shared production service. Every visitor begins with fictional demo data, and changes are stored only in that visitor's browser localStorage. There is no backend, authentication, or connected LLM.

## Portfolio description

> **ShiftFlow | Workforce scheduling dashboard** — Designed and implemented a React/TypeScript internal operations tool with shift management, leave approvals, workload reporting and explainable staff recommendations. Built a testable business-rule engine covering availability, overlapping shifts, weekly limits and rest periods; added CSV/JSON import-export, local persistence, TypeScript and automated unit tests. Used an AI-assisted development workflow with manual validation, testing and code review.

### Author

Portfolio project by **Milena Strakhova**.

## License

MIT — see [LICENSE](./LICENSE).

## CSV export formats

Choose **Export for Excel** in the Schedule, Team, or Reports views for a UTF-8 BOM, `sep=;` directive, and semicolon-separated columns. This is intended to open in Excel with separate columns on Latvian/European Windows regional settings. Choose **CSV** for standard comma-delimited CSV without an Excel-specific header (better for programmatic imports). **Excel may still show `#######` for dates until you auto-fit the Date column width.** Costs are exported as numeric values without a currency symbol.
