# README and Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve project reviewability by turning the README into a practical runbook and adding a GitHub Pages monitoring dashboard with historical reports.

**Architecture:** Keep monitoring GitHub-native. The README explains how to run, understand, and maintain the project; `docs/monitoring-dashboard.md` explains what CI monitors, where reports live, and how to triage failures; `scripts/build-pages-dashboard.mjs` publishes historical report pages to `gh-pages`.

**Tech Stack:** Markdown, GitHub Actions, Playwright, Monocart Reporter, npm scripts.

## Global Constraints

- Do not add runtime dependencies.
- Keep the dashboard static and dependency-free.
- Keep secrets out of documentation examples except for variable names.
- Match the existing CI workflow and npm scripts.

---

### Task 1: Rewrite README Runbook

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `package.json` scripts, `.github/workflows/playwright.yml`, `playwright.config.ts`
- Produces: Reviewable project overview and setup/run instructions

- [x] **Step 1: Replace the README with a structured runbook**

Sections:
- Project overview
- Quick start
- Environment variables
- Test commands
- Project structure
- CI pipeline
- Reports and artifacts
- Test coverage
- Design decisions
- Troubleshooting
- Roadmap

- [x] **Step 2: Verify links and commands are accurate**

Run:

```bash
rg -n "docs/monitoring-dashboard.md|npm run test:api|GOREST_API_TOKEN|Playwright Tests" README.md
```

Expected: README references the monitoring dashboard, API command, token, and workflow badge.

### Task 2: Add Monitoring Dashboard

**Files:**
- Create: `docs/monitoring-dashboard.md`

**Interfaces:**
- Consumes: GitHub Actions job names, artifact names, npm scripts
- Produces: Human-readable monitoring dashboard for CI health and failure triage

- [x] **Step 1: Create the dashboard document**

Include:
- Health overview
- Quality gate table
- Test layer table
- Report/artifact table
- Failure triage table
- Local monitoring commands
- Current limitations and future improvements

- [x] **Step 2: Link dashboard from README**

Add a direct link in README's reports/monitoring section.

### Task 3: Verify Documentation Change

**Files:**
- Verify: `README.md`
- Verify: `docs/monitoring-dashboard.md`

**Interfaces:**
- Consumes: edited docs
- Produces: committed docs branch

- [x] **Step 1: Run static checks**

Run:

```bash
npm run typecheck
npm run lint
```

Expected: both commands pass.

- [x] **Step 2: Inspect git diff**

Run:

```bash
git diff --stat
git diff --check
```

Expected: only documentation files changed and no whitespace errors.

### Task 4: Add GitHub Pages Historical Dashboard

**Files:**
- Modify: `.github/workflows/playwright.yml`
- Create: `scripts/build-pages-dashboard.mjs`
- Modify: `README.md`
- Modify: `docs/monitoring-dashboard.md`

**Interfaces:**
- Consumes: Playwright and Monocart report artifacts
- Produces: Static dashboard under the `gh-pages` branch

- [x] **Step 1: Add dashboard generator**

The generator copies UI/API Monocart and Playwright reports into `runs/<github-run-id>/`, updates `runs.json`, and rebuilds `index.html`.

- [x] **Step 2: Add Pages deploy job**

The deploy job runs only on pushes to `main` after UI and API jobs pass. It preserves report history by committing updates to the `gh-pages` branch.

- [x] **Step 3: Document Pages setup**

The README and monitoring dashboard explain the two main dashboard buttons, run history, and the GitHub Pages branch-source requirement.

- [x] **Step 4: Verify workflow syntax and docs**

Run:

```bash
git diff --check
npm run typecheck
npm run lint
```

Expected: no whitespace errors, typecheck passes, and lint passes.
