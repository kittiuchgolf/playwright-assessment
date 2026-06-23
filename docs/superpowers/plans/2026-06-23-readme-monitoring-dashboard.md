# README and Monitoring Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Improve project reviewability by turning the README into a practical runbook and adding a documentation-based monitoring dashboard.

**Architecture:** Keep monitoring lightweight and GitHub-native. The README explains how to run, understand, and maintain the project; `docs/monitoring-dashboard.md` explains what CI monitors, where reports live, and how to triage failures.

**Tech Stack:** Markdown, GitHub Actions, Playwright, Monocart Reporter, npm scripts.

## Global Constraints

- Do not add runtime dependencies.
- Keep the dashboard documentation-based, not a separate app.
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

### Task 4: Add GitHub Actions Job Summaries

**Files:**
- Modify: `.github/workflows/playwright.yml`
- Modify: `README.md`
- Modify: `docs/monitoring-dashboard.md`

**Interfaces:**
- Consumes: GitHub Actions `$GITHUB_STEP_SUMMARY`
- Produces: Per-job Markdown summaries inside each workflow run

- [x] **Step 1: Add summary steps to CI jobs**

Each job writes a compact Markdown table to `$GITHUB_STEP_SUMMARY` with the command, outcome, and artifact names where relevant.

- [x] **Step 2: Document summaries in README and monitoring dashboard**

The README and dashboard now explain that GitHub Actions provides quick in-run summaries in addition to downloadable reports and artifacts.

- [x] **Step 3: Verify workflow syntax and docs**

Run:

```bash
git diff --check
npm run typecheck
npm run lint
```

Expected: no whitespace errors, typecheck passes, and lint passes.
