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

## Google document / sheet integration available in this environment

A local Google integration already exists on this machine via the canonical wrapper:

```bash
/root/openclaw/scripts/sheets <command> ...
```

Available commands:
- `meta <spreadsheet_id>`
- `read <spreadsheet_id> <range>`
- `write <spreadsheet_id> <range> <json_rows>`
- `clear <spreadsheet_id> <range>`
- `add-sheet <spreadsheet_id> <title>`

Important:
- use the local wrapper instead of re-implementing auth
- do not start a new OAuth flow
- first verify access with `meta`

Note: the current local integration is for Google Sheets via the existing wrapper. If the owner provides a Google Docs link instead of a Sheet, the agent must not drift into a generic assistant response. It should first state briefly that the automated write path currently targets Google Sheets and then ask whether to switch the run to a Google Sheet or proceed with local-only output.

## Agent workflow

1. Read the user request and extract the client name.
2. Open the client folder:
   - `Projects/<client>/`
3. Read `client-info.md` first.
4. Resolve or confirm:
   - niche
   - target document link
5. Open this reglamet and follow it strictly.
6. Only after reading the client folder and this reglamet may the agent ask clarifying questions.
7. Search the web for relevant niche cases using queries like:
   - `Кейсы "<ниша>"`
   - `кейсы таргет <ниша>`
   - `кейсы рекламы <ниша>`
   - `лидогенерация <ниша> кейс`
8. Collect up to 20 relevant sources.
9. Add the found case links and short notes into the target Google sheet/document.
10. Analyze the collected materials.
11. Write recommendations into the same target document.
12. Save a local copy of the result or notes into:
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
