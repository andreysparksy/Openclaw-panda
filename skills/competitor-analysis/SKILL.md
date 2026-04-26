---
name: competitor-analysis
description: Prepare competitor analysis for a client project using the repository structure under Projects/ and the workflow under Target/Competitor Analysis. Use when the user asks for competitor analysis, niche case analysis, target analysis, case collection, creative messaging recommendations, or landing page recommendations and provides at least a client name. Trigger on requests like "Нужна аналитика конкурентов", "Сделай competitor analysis", or "Подготовь анализ конкурентов".
---

# Competitor Analysis

Use the project-specific workflow already stored in this repository.

## Required repository paths

Read and use these paths:

- client data: `/root/openclaw/Openclaw-panda/Projects/<client>/`
- workflow reglamet: `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/reglament.md`
- output template: `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/template.md`

## Minimum input handling

Expect at least:

- `Клиент: <client-folder-name>`

If the user also provides these fields, use them directly:

- `Ниша: <niche-name>`
- `Документ: <google-sheet-or-doc-link>`

If niche or document link is missing, read `Projects/<client>/client-info.md` first and recover them from there when possible.

If required data is still missing after reading the client folder, ask only for the missing fields.

## Mandatory execution order

Do not answer as a general chat assistant first.
Do not jump straight to asking for generic access or restating the task.
Before any substantive reply, do this in order:

1. Open `Projects/<client>/`.
2. Read `client-info.md` first.
3. Read any other relevant client files if present.
4. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/reglament.md`.
5. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/template.md`.
6. Only then decide whether any clarification is still required.

## Workflow

1. Parse the user request.
2. Open `Projects/<client>/`.
3. Read `client-info.md` first.
4. Read any other relevant client files if present.
5. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/reglament.md`.
6. Follow that reglamet strictly.
7. Use `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/template.md` as the output shape.
8. Save local artifacts into `Projects/<client>/target/competitor-analysis/`.

## Google integration

A local Google Sheets integration already exists on this machine.
Use the canonical wrapper:

```bash
/root/openclaw/scripts/sheets <command> ...
```

Available commands:

- `meta <spreadsheet_id>`
- `read <spreadsheet_id> <range>`
- `write <spreadsheet_id> <range> <json_rows>`
- `clear <spreadsheet_id> <range>`
- `add-sheet <spreadsheet_id> <title>`

Before writes, verify access with `meta`.
Do not create a new OAuth flow.
Do not re-implement auth.

## Document link handling

When the user provides `Документ:`:

1. Do not assume it is a Google Doc text document.
2. First determine whether it is a Google Sheet.
3. For the current MVP, prefer Google Sheets because the local integration already supports Sheets writes.
4. If the link is a Google Doc instead of a Google Sheet, do not fall into a generic access-request loop. First return a short clarification that the current automated write path is built around Google Sheets and ask whether to:
   - switch to Google Sheets for the run, or
   - proceed with local-only analysis output.
5. If it is a Google Sheet, use the local wrapper and verify access first.

## Output expectations

Produce:

1. A collected source list of relevant niche cases.
2. Recommendations for creative text:
   - `Вот что должно быть по тексту в креативах:`
3. Recommendations for landing pages:
   - `На какую посадочную страницу я рекомендовал бы вести:`
4. A local saved copy inside the client project folder.

## Response style

Be concise in chat.
Do the work in files and the target document.
Return a short status summary plus where the saved local artifact lives.
Do not respond with a generic assistant-style plan before reading the required repository files.
