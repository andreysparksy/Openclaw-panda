# Competitor Analysis Reglament

## Purpose

This workflow is for preparing niche-based competitor/case analysis for a client project.
The agent must use the client context from `Projects/<client>/`, search for relevant public cases by niche, collect sources, and write practical recommendations into a Google Doc.

## Mandatory input format from user

The user must send the request in this exact structure:

- Клиент: <client-folder-name>
- Ниша: <niche-name>
- Документ: <google-doc-url>

Example:

- Клиент: damir-remont
- Ниша: ремонт квартир
- Документ: https://docs.google.com/...

If the request is not in this format, the agent must ask the user to resend it in the required structure before starting the analysis.

## Agent workflow

1. Read the user request and extract:
   - client
   - niche
   - Google Doc URL
2. Open the client folder:
   - `Projects/<client>/`
3. Review available client materials there.
4. Open this reglamet and follow it strictly.
5. Search the web for relevant niche cases using queries like:
   - `Кейсы "<ниша>"`
   - `кейсы таргет <ниша>`
   - `кейсы рекламы <ниша>`
   - `лидогенерация <ниша> кейс`
6. Collect up to 20 relevant sources.
7. Add the found case links and short notes into the provided Google Doc.
8. Analyze the collected materials.
9. Write recommendations into the same Google Doc.

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

## Google Doc output structure

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

If useful, the agent may also save a local summary into the client project folder for future reuse.
