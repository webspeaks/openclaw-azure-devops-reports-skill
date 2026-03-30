# Azure DevOps Reports

A read-focused OpenClaw skill for Azure DevOps.

It can:

- list Azure DevOps projects
- list teams in a project
- list members in a team
- list sprints / iterations
- fetch work items from a saved query
- export report data to JSON
- generate Excel workbooks with charts using Python
- summarize sprint progress and recent closed work

This skill is designed around a secure, low-risk workflow:

- **Node.js** handles Azure DevOps API access and data normalization
- **Python** handles Excel workbook generation with native charts
- credentials are loaded from a local `.env`
- reports are read-only by default

---

## Features

- Secure Azure DevOps REST API access using PAT
- Default saved-query workflow using `.env` values
- Project, team, member, and sprint listing
- Work item fetching with WIQL or saved query id
- Weekly reporting support
- Excel workbook generation with:
  - `RawData` sheet
  - `Summary` sheet
  - `WeeklyTrendData` sheet
  - `Charts` sheet

---

## Folder structure

```text
azure-devops-reports/
├── SKILL.md
├── README.md
├── .env.example
├── .gitignore
├── scripts/
│   ├── ado-client.js
│   ├── build_excel_report.py
│   ├── config.js
│   ├── export-report.js
│   ├── generate-excel-report.js
│   ├── iterations.js
│   ├── list-projects.js
│   ├── projects.js
│   ├── queries.js
│   ├── teams.js
│   ├── utils.js
│   ├── validators.js
│   └── workitems.js
├── references/
└── output/
```

---

## Requirements

- OpenClaw
- Node.js
- Python 3
- `xlsxwriter` for Excel workbook generation

Install Python dependency:

```bash
pip3 install xlsxwriter
```

---

## Configuration

Create a local `.env` file in the skill directory.

Example:

```env
AZURE_DEVOPS_ORG=your-org-name
AZURE_DEVOPS_PAT=your-personal-access-token

AZURE_DEVOPS_DEFAULT_PROJECT=Your Project Name
AZURE_DEVOPS_DEFAULT_TEAM=Web 2.0
AZURE_DEVOPS_DEFAULT_QUERY_ID=your-query-guid
AZURE_DEVOPS_OUTPUT_DIR=
```

### Required variables

- `AZURE_DEVOPS_ORG`
- `AZURE_DEVOPS_PAT`

### Useful defaults

- `AZURE_DEVOPS_DEFAULT_PROJECT`
- `AZURE_DEVOPS_DEFAULT_TEAM`
- `AZURE_DEVOPS_DEFAULT_QUERY_ID`
- `AZURE_DEVOPS_OUTPUT_DIR`

---

## Security notes

- This skill is intended to be **read-only** by default.
- Keep `.env` local and never commit it.
- Use least-privilege Azure DevOps PAT scopes.
- Recommended PAT scopes:
  - `vso.project`
  - `vso.work`
- Report output is written only to the configured output directory.

---

## How it works

### Data flow

1. Node.js loads config from `.env`
2. Node.js fetches Azure DevOps data
3. Node.js normalizes work items into a clean JSON bundle
4. Python reads the JSON bundle
5. Python generates an `.xlsx` report with charts

### Default report flow

The default report flow uses:

- `AZURE_DEVOPS_DEFAULT_PROJECT`
- `AZURE_DEVOPS_DEFAULT_QUERY_ID`

That means you can generate the default report without manually passing project/query values every time.

---

## Script usage

Run from the skill directory:

```bash
cd /path/to/azure-devops-reports
```

### List projects

```bash
node scripts/projects.js list
```

or

```bash
node scripts/list-projects.js
```

### List teams in a project

```bash
node scripts/teams.js list "Project Name"
```

### List team members

```bash
node scripts/teams.js members "Project Name" "Team Name"
```

### List current sprint

```bash
node scripts/iterations.js current "Project Name" "Team Name"
```

### List all iterations / sprints

```bash
node scripts/iterations.js list "Project Name" "Team Name"
```

### List saved queries

```bash
node scripts/queries.js list --project "Project Name"
```

### Fetch work items from saved query id

Explicit:

```bash
node scripts/workitems.js query-id --project "Project Name" --id "QUERY_GUID"
```

Using defaults from `.env`:

```bash
node scripts/workitems.js query-id
```

### List work items closed in the last 7 days

```bash
node scripts/workitems.js closed-last-week
```

### Export default report data as JSON

```bash
node scripts/export-report.js
```

### Generate Excel report in one step

```bash
node scripts/generate-excel-report.js
```

This will typically create:

- `output/query-data.json`
- `output/query-report.xlsx`

---

## Natural language commands for ClawBot

Once the skill is installed and configured, you can ask ClawBot in plain English.

### Project and team queries

- `show my Azure DevOps projects`
- `list my Azure DevOps projects`
- `how many teams do we have?`
- `list all team members in Web 2.0 team`
- `can you list the sprints?`

### Reporting queries

- `generate the Azure DevOps report`
- `please create the azure devops report`
- `regenerate the excel`
- `show current progress of sprint 07`
- `list all work items closed in last week`
- `summarize closed items from last week`

### Workload / progress questions

- `can you please show the count of open items?`
- `which team member has most open items?`
- `please compute the exact top assignee by open items only`
- `show sprint progress`

---

## Example conversations

### Example 1

**You:**

```text
Generate the Azure DevOps report
```

**ClawBot should:**

- use the default project and saved query from `.env`
- export report data to JSON
- generate the Excel workbook
- return the final file path

### Example 2

**You:**

```text
show my Azure DevOps projects
```

**ClawBot should:**

- list projects from the configured org
- return them in a readable summary

### Example 3

**You:**

```text
list all team members in Web 2.0 team
```

**ClawBot should:**

- resolve the project/team
- fetch team members
- return the team member list

### Example 4

**You:**

```text
summarize closed items from last week
```

**ClawBot should:**

- fetch work items closed in the last 7 days
- summarize by type, assignee, and date
- return a short readable summary

---

## Publishing notes

Before publishing to GitHub or ClawHub:

- keep `.env` out of version control
- keep `.env.example` in the repo
- keep `output/` ignored
- test from a clean clone
- verify docs do not contain machine-specific secrets

---

## License

Add your preferred license here.
