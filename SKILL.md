---
name: azure-devops-reports
description: Read Azure DevOps projects, teams, saved queries, and work items securely; run WIQL-based reporting; and export spreadsheet-ready reports with summaries and charts. Use when the user wants Azure DevOps project lists, team lists, saved query results, sprint/work item reporting, WIQL queries, Excel/CSV exports, charts, assignee/state/type breakdowns, or team/project work item analysis.
---

# Azure DevOps Reports

Use this skill for secure, read-focused Azure DevOps reporting.

## Configuration

Load credentials from a local `.env` file stored in this skill directory. Required variables:

- `AZURE_DEVOPS_ORG`
- `AZURE_DEVOPS_PAT`

Optional defaults:

- `AZURE_DEVOPS_DEFAULT_PROJECT`
- `AZURE_DEVOPS_DEFAULT_TEAM`
- `AZURE_DEVOPS_DEFAULT_QUERY_ID`
- `AZURE_DEVOPS_OUTPUT_DIR`

If required values are missing, ask the user to create or update `.env` in this skill directory.

## Security rules

- Treat this skill as read-only unless the user explicitly asks for mutations and the skill has been extended for them.
- Never print or echo PAT values.
- Never log Authorization headers.
- Validate project, team, work item ids, output file names, and requested fields.
- Write exports only under the configured output directory.

## Workflow

1. Load config from `.env`.
2. Resolve project/team/query id from explicit arguments or configured defaults.
3. Decide whether the request is project-scoped, team-scoped, saved-query, sprint-scoped, or custom-WIQL.
4. Fetch work item ids via WIQL when filtering is needed.
5. Fetch detailed work item fields.
6. Normalize records for reporting.
7. Default to the configured saved query when no explicit command or query id is provided.
8. Export to JSON or CSV data bundles.
9. Build summary tables for state, assignee, and work item type.
10. Build Excel charts from exported JSON when the user asks for workbook generation.
11. Use project listing when the user asks for Azure DevOps projects.
12. Prefer wrapper scripts for the most common workflows.

## Scripts

- `scripts/projects.js` — list projects
- `scripts/list-projects.js` — simple wrapper to list projects
- `scripts/teams.js` — list teams in a project and team members
- `scripts/iterations.js` — list team iterations / current sprint
- `scripts/workitems.js` — run work item queries and normalize results
- `scripts/export-report.js` — export JSON/CSV data bundles
- `scripts/build_excel_report.py` — Python script to generate Excel workbooks with charts from exported JSON
- `scripts/generate-excel-report.js` — wrapper that exports JSON and then builds the Excel workbook

## Exact script usage

Run all commands from the skill directory:

```bash
cd /Users/arvind/.openclaw/workspace/skills/azure-devops-reports
```

Install Python dependency once:

```bash
pip3 install xlsxwriter
```

### 1) List projects

Direct command:

```bash
node scripts/projects.js list
```

Simple wrapper:

```bash
node scripts/list-projects.js
```

### 2) List teams in a project

```bash
node scripts/teams.js list "Project Name"
```

### 3) List members in a team

```bash
node scripts/teams.js members "Project Name" "Team Name"
```

### 4) List current team sprint

```bash
node scripts/iterations.js current "Project Name" "Team Name"
```

### 5) List saved queries in a project

```bash
node scripts/queries.js list --project "Project Name"
```

### 6) Get a saved query definition by id

```bash
node scripts/queries.js get --project "Project Name" --id "QUERY_GUID"
```

### 7) Fetch work items using saved query id

With explicit project + query id:

```bash
node scripts/workitems.js query-id --project "Project Name" --id "QUERY_GUID"
```

With defaults from `.env`:

```bash
node scripts/workitems.js query-id
```

### 8) List work items closed in the last 7 days

Using the default project from `.env`:

```bash
node scripts/workitems.js closed-last-week
```

With an explicit project:

```bash
node scripts/workitems.js closed-last-week --project "Project Name"
```

### 9) Export report data as JSON

Default saved-query export using `.env` defaults:

```bash
node scripts/export-report.js
```

Explicit saved-query export:

```bash
node scripts/export-report.js query-id \
  --project "Project Name" \
  --id "QUERY_GUID" \
  --format json \
  --out query-data.json
```

Export sprint summary explicitly:

```bash
node scripts/export-report.js sprint-summary \
  --project "Project Name" \
  --team "Team Name" \
  --format json \
  --out sprint-summary.json
```

Export custom WIQL explicitly:

```bash
node scripts/export-report.js wiql \
  --project "Project Name" \
  --query "SELECT [System.Id] FROM WorkItems WHERE [System.TeamProject] = 'Project Name'" \
  --format json \
  --out wiql-report.json
```

### 10) Build Excel workbook from exported JSON

```bash
python3 scripts/build_excel_report.py \
  --input output/query-data.json \
  --output output/query-report.xlsx
```

### 11) One-step wrapper: export JSON, then generate Excel

Using `.env` defaults:

```bash
node scripts/generate-excel-report.js
```

### 12) Ask ClawBot in plain English

These requests should map to the skill without manual script execution:

- `show my Azure DevOps projects`
- `list all team members in Web 2.0 team`
- `generate the Azure DevOps report`
- `regenerate the excel`
- `list all work items closed in last week`
- `which team member has most open items?`

With explicit saved query:

```bash
node scripts/generate-excel-report.js \
  --mode query-id \
  --project "Project Name" \
  --id "QUERY_GUID" \
  --json query-data.json \
  --xlsx query-report.xlsx
```

With explicit sprint summary:

```bash
node scripts/generate-excel-report.js \
  --mode sprint-summary \
  --project "Project Name" \
  --team "Team Name" \
  --json sprint-data.json \
  --xlsx sprint-report.xlsx
```

## References

Read these only if needed:

- `references/field-mapping.md` for normalized field choices
- `references/report-types.md` for report presets and chart ideas
- `references/api-notes.md` for endpoint notes and PAT scope guidance
