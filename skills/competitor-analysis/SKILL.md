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
- document formatting reglamet: `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/google-doc-format.md`
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
5. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/google-doc-format.md`.
6. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/template.md`.
7. Only then decide whether any clarification is still required.

## Workflow

1. Parse the user request.
2. Open `Projects/<client>/`.
3. Read `client-info.md` first.
4. Read any other relevant client files if present.
5. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/reglament.md`.
6. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/google-doc-format.md`.
7. Follow those reglamets strictly.
8. Use `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/template.md` as the output shape.
9. Save local artifacts into `Projects/<client>/target/competitor-analysis/`.

## Google integration

A local Google Docs integration already exists on this machine.
Use only the canonical wrapper:

```bash
/root/openclaw/scripts/docs <command> ...
```

Configured local paths:
- wrapper: `/root/openclaw/scripts/docs`
- helper: `/root/.openclaw/workspace/google_docs_tool.py`
- python venv: `/root/openclaw/.venv`
- credentials: `/root/openclaw/secrets/google-service-account.json`
- service account: `openclaw-sheets@openclaw-sheets-492416.iam.gserviceaccount.com`

Supported commands include:
- `meta <document_id>`
- `get-text <document_id>`
- `append-text <document_id> 'text\n'`
- `prepend-text <document_id> 'text\n'`

Before writes, verify access with `meta`.
Do not create a new OAuth flow.
Do not re-implement auth.
Do not look for another credentials path.

## Document link handling

When the user provides `Документ:`:

1. Treat it as a Google Docs workflow by default.
2. Extract the `document_id` from a URL like `https://docs.google.com/document/d/<document_id>/edit`.
3. Verify access first with `/root/openclaw/scripts/docs meta <document_id>`.
4. If access works, continue with the local docs wrapper.
5. If access fails with 403, ask the user to share the document with `openclaw-sheets@openclaw-sheets-492416.iam.gserviceaccount.com`.
6. Do not fall into a generic “Google Docs is not connected” response before checking the local wrapper.
7. Before writing, prefer safe append-style writes unless a different write mode is clearly intended.

## Output expectations

Produce:

1. A collected source list of relevant niche cases.
2. Recommendations for creative text:
   - `Вот что должно быть по тексту в креативах:`
3. Recommendations for landing pages:
   - `На какую посадочную страницу я рекомендовал бы вести:`
   - tie this strictly to the real ad platform
   - for VK Ads, keep recommendations limited to realistic formats such as lead forms, bot flows, or sending a message to the group/community
4. Recommendations for the first audiences to test:
   - `На какую аудиторию запускать рекламу в первую очередь:`
5. A local saved copy inside the client project folder.

## Response style

Be concise in chat.
Do the work in files and the target document.
Return a short status summary plus where the saved local artifact lives.
Do not respond with a generic assistant-style plan before reading the required repository files.
