# Competitor Analysis Reglament

## Purpose

This workflow is for preparing niche-based competitor/case analysis for a client project.
The agent must use the client context from `Projects/<client>/`, search for relevant public cases by niche, collect sources, and write practical recommendations into a Google document.

## Data sources priority

The agent must use sources in this order:

1. `Projects/<client>/client-info.md`
2. Other files inside `Projects/<client>/`
3. The user message in chat
4. The competitor analysis reglamet and template

If the client folder already contains the niche and the Google document link, the agent should use them first and only ask follow-up questions when data is missing or inconsistent.

## Mandatory minimum from user

The minimum required input from the user is:

- Клиент: <client-folder-name>

Preferred full format:

- Клиент: <client-folder-name>
- Ниша: <niche-name>
- Документ: <google-doc-url>

Example:

- Клиент: damir-remont
- Ниша: ремонт квартир
- Документ: https://docs.google.com/...

If the full format is not provided, the agent must try to recover the missing fields from `Projects/<client>/client-info.md`. If required fields are still missing, the agent must ask the user to provide them.

## Google Docs integration available in this environment

A local Google Docs integration already exists on this machine.
Use only the canonical wrapper:

```bash
/root/openclaw/scripts/docs <command> ...
```

Local integration paths already configured:
- wrapper: `/root/openclaw/scripts/docs`
- helper: `/root/.openclaw/workspace/google_docs_tool.py`
- python venv: `/root/openclaw/.venv`
- credentials: `/root/openclaw/secrets/google-service-account.json`
- service account: `openclaw-sheets@openclaw-sheets-492416.iam.gserviceaccount.com`

Supported commands:
- `meta <document_id>`
- `get-text <document_id>`
- `append-text <document_id> 'text\n'`
- `prepend-text <document_id> 'text\n'`
- `style-range ...`
- `bold-range ...`

Important rules:
- use the local wrapper instead of re-implementing auth
- do not start a new OAuth flow
- do not look for another credentials path
- do not say Google Docs is unavailable before checking the local wrapper
- first verify access with `meta`

Document ID rule:
- from a link like `https://docs.google.com/document/d/<document_id>/edit`, extract `<document_id>` and use it with the wrapper

Before writing:
- determine whether the write is a safe append
- avoid damaging the existing document structure
- if the intended write mode is unclear, ask a minimal clarifying question or use the safest append-only path

If access fails with 403:
- verify the document is shared with `openclaw-sheets@openclaw-sheets-492416.iam.gserviceaccount.com`

## Agent workflow

1. Read the user request and extract the client name.
2. Open the client folder:
   - `Projects/<client>/`
3. Read `client-info.md` first.
4. Resolve or confirm:
   - niche
   - target document link
5. Open this reglamet and follow it strictly.
6. Read `/root/openclaw/Openclaw-panda/Target/Competitor Analysis/google-doc-format.md` before writing the final document content.
7. Only after reading the client folder and these formatting rules may the agent ask clarifying questions.
7. Search the web for relevant niche cases using queries like:
   - `Кейсы "<ниша>"`
   - `кейсы таргет <ниша>`
   - `кейсы рекламы <ниша>`
   - `лидогенерация <ниша> кейс`
8. Collect up to 20 relevant sources.
9. Extract the Google document id from the provided link.
10. Verify access first with:
   - `/root/openclaw/scripts/docs meta <document_id>`
11. Add the found case links and short notes into the target Google document.
12. Analyze the collected materials.
13. Structure the final document according to `google-doc-format.md`.
14. Write recommendations into the same target document.
15. Save a local copy of the result or notes into:
   - `Projects/<client>/target/competitor-analysis/`

## Source selection rules

Use only materials that:
- are relevant to the niche
- contain real case or tactical information
- help understand offers, creatives, funnels, or landing approaches

Avoid:
- duplicated links
- generic SEO articles with no practical value
- irrelevant materials from other niches unless they are clearly transferable
- weak sources added only to hit the number

## Platform-specific landing rule

Landing page recommendations must be tied to the actual ad platform.
The agent must not recommend abstract landing formats detached from the launch environment.

Rule:
- recommend only the landing mechanics that are realistic for the actual traffic source/platform

For VK Ads specifically, landing recommendations should be limited to formats such as:
- lead forms
- bot flows
- message to the community/group

If the launch platform is not yet known, the agent must state that the landing recommendation depends on the platform and either:
- ask a short clarifying question, or
- provide conditional recommendations separated by platform

## Target document output structure

### Найденные кейсы по нише
1. Название — ссылка — короткая пометка
2. Название — ссылка — короткая пометка
3. ...

### Вот что должно быть по тексту в креативах:
1. ...
2. ...
3. ...

### На какую посадочную страницу я рекомендовал бы вести:
1. ...
2. ...
3. ...

In this section, the agent must explicitly reflect the ad platform constraints. Example:
- for VK Ads: lead forms, bot, or message to the group/community

### На какую аудиторию запускать рекламу в первую очередь:
1. ...
2. ...
3. ...

The audience recommendations must be practical and tied to the actual niche, offer, and likely first-test segments.

## Analysis principles

- Do not invent conclusions without source support.
- If there are fewer than 10 strong sources, state that the niche sample is limited.
- Prefer quality over quantity.
- Recommendations must be practical, not abstract.
- Recommendations must reflect recurring patterns found across the collected cases.

## Local project notes

The agent should preserve reusable artifacts in the client folder when appropriate, for example:
- `Projects/<client>/target/competitor-analysis/sources-YYYY-MM-DD.md`
- `Projects/<client>/target/competitor-analysis/analysis-YYYY-MM-DD.md`
