import React, { useEffect, useMemo, useState } from "react";

const platforms = ["Telegram", "VK"];
const workflowStatuses = ["Идея", "Черновик", "Чистовик"];
const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const CONTENT_STORAGE_PREFIX = "content-studio-v2";
const ACTIVE_LOGIN_KEY = "content-studio-active-login";
const allowedProjects = ["PANDAVKADS"];

const seedIdeas = [
  ["Как не сливать идеи в заметки, а доводить до публикации", "Показать, как проекту нужен не хаос идей, а понятный контент-план", ["Telegram", "VK"]],
  ["Почему контент без системы не даёт продажи", "Разобрать, где именно ломается путь от идеи до заявки", ["Telegram", "VK"]],
  ["3 темы, которые можно вытащить из одного клиентского кейса", "Показать, как один материал превращается в серию постов", ["Telegram", "VK"]],
  ["Как быстро собрать пост, когда времени нет", "Дать короткую рабочую схему: заметки → драфт → публикация", ["Telegram", "VK"]],
  ["Что писать, если кажется, что всё уже сказано", "Показать угол подачи через боль, кейс и вывод", ["Telegram", "VK"]],
];

function formatDate(date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

function formatShortDate(date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" });
}

function getThirtyDays(start) {
  return Array.from({ length: 30 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function getDefaultMonthStart() {
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return now;
}

function Button({ children, onClick, active, disabled, className = "" }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-xl px-4 py-2 text-sm font-medium transition " +
        (active ? "bg-slate-900 text-white " : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 ") +
        (disabled ? "opacity-50 " : "") +
        className
      }
    >
      {children}
    </button>
  );
}

function makeDraft(item, toneSource) {
  return {
    notes: "",
    telegram: `🔥 ${item.idea}\n\n${item.angle}.\n\nГлавная мысль: контент должен не просто выходить, а вести к нужному действию.\n\nТон-источник: ${toneSource || "не загружен"}.\n\nЕсли хочешь такую же систему под проект — напиши в личку.`,
    vk: `Пост для VK: ${item.idea}\n\n${item.angle}\n\nЗдесь можно сделать более развёрнутую версию поста с кейсом, выводом и призывом.`,
    bannerReady: false,
    carousel: Array.from({ length: 4 }, (_, i) => ({
      title: i === 0 ? item.idea : ["Контекст", "Разбор", "Пример", "Вывод"][i - 1],
      ready: false,
      prompt: `Слайд ${i + 1}: визуал для темы «${item.idea}»`,
    })),
  };
}

function serializeItems(items) {
  return items.map((item) => ({ ...item, date: item.date instanceof Date ? item.date.toISOString() : item.date }));
}

function deserializeItems(items = []) {
  return items.map((item) => ({ ...item, date: item.date ? new Date(item.date) : new Date() }));
}

function getStorageKey(login) {
  return `${CONTENT_STORAGE_PREFIX}-${login}`;
}

function getInitialProjectState(login) {
  return {
    projectLogin: login,
    monthStart: getDefaultMonthStart().toISOString(),
    selectedId: null,
    items: [],
    toneFileName: "",
    tonePreview: "",
  };
}

function readProjectState(login) {
  if (typeof window === "undefined" || !login) return getInitialProjectState(login);
  try {
    const raw = window.localStorage.getItem(getStorageKey(login));
    if (!raw) return getInitialProjectState(login);
    const parsed = JSON.parse(raw);
    return {
      ...getInitialProjectState(login),
      ...parsed,
      items: deserializeItems(parsed.items || []),
    };
  } catch {
    return getInitialProjectState(login);
  }
}

export default function App() {
  const [projectLoginInput, setProjectLoginInput] = useState("");
  const [projectLogin, setProjectLogin] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(ACTIVE_LOGIN_KEY) || "";
  });
  const [activity, setActivity] = useState("Готова к работе");
  const [working, setWorking] = useState(false);

  const [monthStart, setMonthStart] = useState(getDefaultMonthStart());
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [toneFileName, setToneFileName] = useState("");
  const [tonePreview, setTonePreview] = useState("");

  useEffect(() => {
    if (!projectLogin || typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_LOGIN_KEY, projectLogin);
    const saved = readProjectState(projectLogin);
    setMonthStart(new Date(saved.monthStart || getDefaultMonthStart().toISOString()));
    setItems(saved.items || []);
    setSelectedId(saved.selectedId || null);
    setToneFileName(saved.toneFileName || "");
    setTonePreview(saved.tonePreview || "");
  }, [projectLogin]);

  useEffect(() => {
    if (!projectLogin || typeof window === "undefined") return;
    window.localStorage.setItem(
      getStorageKey(projectLogin),
      JSON.stringify({
        projectLogin,
        monthStart: monthStart.toISOString(),
        selectedId,
        items: serializeItems(items),
        toneFileName,
        tonePreview,
      })
    );
  }, [projectLogin, monthStart, selectedId, items, toneFileName, tonePreview]);

  const calendarDays = useMemo(() => getThirtyDays(monthStart), [monthStart]);
  const scheduledItems = useMemo(() => items.filter((item) => item.hasDeadline), [items]);
  const backlogItems = useMemo(() => items.filter((item) => !item.hasDeadline), [items]);
  const selected = items.find((x) => x.id === selectedId) || items[0] || null;

  const postsIn30Days = useMemo(
    () => scheduledItems.filter((item) => calendarDays.some((date) => date.toDateString() === item.date.toDateString())),
    [scheduledItems, calendarDays]
  );

  const monthlyGap = Math.max(0, 10 - postsIn30Days.length);

  function patchSelected(patch) {
    if (!selected) return;
    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ...patch } : x)));
  }

  function handleProjectLogin() {
    const candidate = projectLoginInput.trim();
    if (!allowedProjects.includes(candidate)) return;
    setProjectLogin(candidate);
    setActivity(`Открыт проект ${candidate}`);
  }

  function logoutProject() {
    setProjectLogin("");
    setProjectLoginInput("");
  }

  function shiftMonth(delta) {
    const next = new Date(monthStart);
    next.setDate(next.getDate() + delta * 30);
    setMonthStart(next);
    setSelectedId(null);
  }

  function addContent() {
    setWorking(true);
    setActivity("Добавляю новую единицу контента…");
    setTimeout(() => {
      const freeSlot = calendarDays.find(
        (date) => !scheduledItems.some((item) => item.date.toDateString() === date.toDateString())
      ) || calendarDays[0];
      const seed = seedIdeas[items.length % seedIdeas.length];
      const baseItem = {
        id: `${Date.now()}-${items.length}`,
        date: freeSlot,
        dayName: dayNames[(freeSlot.getDay() + 6) % 7],
        idea: seed[0],
        angle: seed[1],
        platforms: seed[2],
        status: "Идея",
        hasDeadline: false,
        published: {},
      };
      const nextItem = { ...baseItem, draft: makeDraft(baseItem, toneFileName || tonePreview) };
      setItems((prev) => [nextItem, ...prev]);
      setSelectedId(nextItem.id);
      setWorking(false);
      setActivity("Контент добавлен в наброски");
    }, 400);
  }

  function createDraft() {
    if (!selected) return;
    setActivity("Собираю черновик…");
    const existingNotes = selected.draft?.notes || "";
    setTimeout(() => {
      const nextDraft = makeDraft(selected, toneFileName || tonePreview);
      nextDraft.notes = existingNotes;
      patchSelected({ status: "Черновик", draft: nextDraft });
      setActivity("Черновик готов");
    }, 400);
  }

  function togglePlatform(p) {
    if (!selected) return;
    const nextPlatforms = selected.platforms.includes(p)
      ? selected.platforms.filter((x) => x !== p)
      : [...selected.platforms, p];
    patchSelected({ platforms: nextPlatforms });
  }

  function updateNotes(value) {
    if (!selected || !selected.draft) return;
    patchSelected({ draft: { ...selected.draft, notes: value } });
  }

  function generateFromNotes() {
    if (!selected || !selected.draft) return;
    const notes = selected.draft.notes?.trim();
    if (!notes) {
      setActivity("Сначала добавь заметки");
      return;
    }
    const draft = { ...selected.draft };
    draft.telegram = `🔥 ${selected.idea}\n\n${notes}\n\nВывод: ${selected.angle}.\n\nЕсли нужен такой же разбор под проект — напиши.`;
    draft.vk = `Пост для VK: ${selected.idea}\n\n${notes}\n\nВывод: ${selected.angle}.`;
    patchSelected({ draft, status: "Черновик" });
    setActivity("Пост сгенерирован из заметок");
  }

  function uploadToneFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    setToneFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      setTonePreview(cleaned.slice(0, 400));
      setActivity(`Тон оф войс считан из ${file.name}`);
    };
    reader.readAsText(file, "utf-8");
  }

  function setStatus(status) {
    if (!selected) return;
    const patch = { status };
    if (status === "Идея") {
      patch.hasDeadline = false;
      patch.dayName = "Без даты";
    }
    if ((status === "Черновик" || status === "Чистовик") && !selected.hasDeadline) {
      const freeSlot = calendarDays.find(
        (date) => !scheduledItems.some((item) => item.id !== selected.id && item.date.toDateString() === date.toDateString())
      ) || calendarDays[0];
      patch.hasDeadline = true;
      patch.date = freeSlot;
      patch.dayName = dayNames[(freeSlot.getDay() + 6) % 7];
    }
    patchSelected(patch);
    setActivity(`Статус обновлён: ${status}`);
  }

  function setPostDate(value) {
    if (!selected) return;
    const nextDate = new Date(value);
    if (Number.isNaN(nextDate.getTime())) return;
    patchSelected({
      date: nextDate,
      dayName: dayNames[(nextDate.getDay() + 6) % 7],
      hasDeadline: true,
    });
    setActivity("Дата публикации обновлена");
  }

  function publish(platform) {
    if (!selected) return;
    patchSelected({ published: { ...selected.published, [platform]: true } });
    setActivity(`${platform}: опубликовано`);
  }

  function removeItem(itemId) {
    setItems((prev) => prev.filter((item) => item.id !== itemId));
    if (selectedId === itemId) setSelectedId(null);
  }

  if (!projectLogin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">✨ Content</div>
            <h1 className="text-3xl font-bold tracking-tight">Вход в проект</h1>
            <p className="mt-3 text-sm text-slate-500">Сейчас доступен один логин проекта: PANDAVKADS</p>
            <div className="mt-5 flex gap-2">
              <input
                value={projectLoginInput}
                onChange={(event) => setProjectLoginInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleProjectLogin();
                }}
                placeholder="Введите логин проекта"
                className="flex-1 rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
              />
              <Button onClick={handleProjectLogin} disabled={!allowedProjects.includes(projectLoginInput.trim())}>Войти</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">✨ Content Studio</div>
            <h1 className="text-4xl font-bold tracking-tight">Контент-план проекта</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Проект: <span className="font-semibold text-slate-900">{projectLogin}</span>. Здесь отдельно сохраняются идеи, черновики, календарь и заметки по проекту.
            </p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-2xl bg-slate-100 p-4 text-sm">
              <div className="font-semibold">Статус</div>
              <div className="mt-1 text-slate-600">{working ? "⏳ " : "✅ "}{activity}</div>
            </div>
            <Button className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={logoutProject}>Сменить проект</Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Контент на 30 дней</div>
            <div className="mt-2 text-3xl font-bold">{postsIn30Days.length}</div>
            <div className="mt-2 text-sm text-slate-500">Запланировано постов в календаре</div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">Наброски</div>
            <div className="mt-2 text-3xl font-bold">{backlogItems.length}</div>
            <div className="mt-2 text-sm text-slate-500">Идеи без даты публикации</div>
          </div>
          <div className="rounded-3xl bg-white p-5 shadow-sm">
            <div className="text-sm text-slate-500">План на месяц</div>
            <div className="mt-2 text-3xl font-bold">{monthlyGap > 0 ? `- ${monthlyGap}` : "OK"}</div>
            <div className="mt-2 text-sm text-slate-500">Если ориентир — 10 постов за 30 дней</div>
          </div>
        </section>

        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="text-sm text-slate-500">Календарь проекта</div>
            <div className="text-lg font-semibold">{formatDate(calendarDays[0])} — {formatDate(calendarDays[29])}</div>
            {monthlyGap > 0 && <div className="mt-2 text-sm text-amber-600">⚠️ В 30-дневном окне не хватает {monthlyGap} постов до базового ритма.</div>}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => shiftMonth(-1)}>← Предыдущие 30 дней</Button>
            <Button onClick={() => shiftMonth(1)}>Следующие 30 дней →</Button>
            <Button active onClick={addContent} disabled={working}>＋ Добавить контент</Button>
          </div>
        </section>

        <section className="rounded-3xl bg-white p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-lg font-semibold">Календарь на 30 дней</div>
              <div className="text-sm text-slate-500">Здесь видно, какой пост выходит в какой день.</div>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {calendarDays.map((day) => {
              const dayItems = scheduledItems.filter((item) => item.date.toDateString() === day.toDateString());
              return (
                <div key={day.toISOString()} className="rounded-2xl border border-slate-200 bg-slate-50 p-4">
                  <div className="text-sm text-slate-500">{dayNames[(day.getDay() + 6) % 7]}</div>
                  <div className="font-semibold">{formatShortDate(day)}</div>
                  <div className="mt-3 space-y-2">
                    {dayItems.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-slate-300 bg-white px-3 py-2 text-sm text-slate-400">Пост не назначен</div>
                    ) : (
                      dayItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => setSelectedId(item.id)}
                          className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm shadow-sm"
                        >
                          <div className="font-medium text-slate-900">{item.idea}</div>
                          <div className="mt-1 text-xs text-slate-500">{item.status} · {item.platforms.join(", ")}</div>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        <main className="grid gap-6 lg:grid-cols-[0.95fr_1.5fr_0.9fr]">
          <aside className="space-y-3">
            {scheduledItems.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                Пока нет постов с датой. Переведи идею в черновик или чистовик — и она встанет в календарь.
              </div>
            )}
            {scheduledItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-3xl border p-4 text-left shadow-sm ${selected && selected.id === item.id ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white"}`}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">{item.dayName}, {formatDate(item.date)}</div>
                    <div className="mt-1 font-semibold">{item.idea}</div>
                  </div>
                  <span className="h-fit rounded-full bg-white px-3 py-1 text-xs">{item.status}</span>
                </div>
              </button>
            ))}
          </aside>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="py-20 text-center text-slate-500">Выбери идею или добавь новую.</div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="text-sm text-slate-500">{selected.hasDeadline ? `${selected.dayName}, ${formatDate(selected.date)}` : "Без даты публикации"}</div>
                    <textarea
                      value={selected.idea}
                      onChange={(e) => patchSelected({ idea: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-xl font-semibold"
                      rows={2}
                    />
                    <textarea
                      value={selected.angle}
                      onChange={(e) => patchSelected({ angle: e.target.value })}
                      className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-600"
                      rows={2}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button active onClick={createDraft}>📝 Создать драфт</Button>
                    <Button onClick={() => removeItem(selected.id)}>Удалить</Button>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <div className="mb-2 font-semibold">Площадки</div>
                    <div className="flex flex-wrap gap-2">
                      {platforms.map((p) => (
                        <Button key={p} active={selected.platforms.includes(p)} onClick={() => togglePlatform(p)}>
                          {selected.platforms.includes(p) ? "✓ " : "+ "}{p}
                        </Button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 font-semibold">Дата публикации</div>
                    <input
                      type="date"
                      value={selected.date.toISOString().slice(0, 10)}
                      onChange={(e) => setPostDate(e.target.value)}
                      className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm"
                    />
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-semibold">Статус</div>
                  <div className="flex flex-wrap gap-2">
                    {workflowStatuses.map((status) => (
                      <Button key={status} active={selected.status === status} onClick={() => setStatus(status)}>{status}</Button>
                    ))}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600 space-y-3">
                  <div>
                    <div className="mb-2 font-semibold text-slate-800">HTML-файл для tone of voice</div>
                    <input type="file" accept=".html,.htm,text/html" onChange={uploadToneFile} className="block w-full text-sm" />
                    {toneFileName && <div className="mt-2 text-xs text-slate-500">Загружен файл: {toneFileName}</div>}
                    {tonePreview && <div className="mt-2 rounded-xl bg-white p-3 text-xs text-slate-600">Превью: {tonePreview}</div>}
                  </div>
                </div>

                {selected.draft && (
                  <div className="space-y-5">
                    {selected.platforms.includes("Telegram") && (
                      <div className="rounded-3xl border border-slate-200 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h2 className="text-xl font-bold">Telegram</h2>
                          <Button active onClick={() => publish("Telegram")}>{selected.published.Telegram ? "✅ Опубликовано" : "🚀 Опубликовать"}</Button>
                        </div>
                        <div className="mb-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                          <div className="font-semibold text-slate-800">Рабочие заметки</div>
                          <textarea
                            value={selected.draft.notes || ""}
                            onChange={(e) => updateNotes(e.target.value)}
                            placeholder="Сюда вноси тезисы, факты, мысли, куски исходников."
                            className="min-h-[160px] w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none"
                          />
                          <Button active onClick={generateFromNotes}>✨ Сгенерировать</Button>
                        </div>
                        <div>
                          <div className="mb-2 font-semibold text-slate-800">Готовый пост</div>
                          <textarea
                            value={selected.draft.telegram}
                            onChange={(e) => patchSelected({ draft: { ...selected.draft, telegram: e.target.value } })}
                            className="min-h-[240px] w-full rounded-2xl bg-slate-100 p-4 font-sans text-sm outline-none"
                          />
                        </div>
                      </div>
                    )}

                    {selected.platforms.includes("VK") && (
                      <div className="rounded-3xl border border-slate-200 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h2 className="text-xl font-bold">VK</h2>
                          <Button active onClick={() => publish("VK")}>{selected.published.VK ? "✅ Опубликовано" : "🚀 Опубликовать"}</Button>
                        </div>
                        <textarea
                          value={selected.draft.vk}
                          onChange={(e) => patchSelected({ draft: { ...selected.draft, vk: e.target.value } })}
                          className="min-h-[220px] w-full rounded-2xl bg-slate-100 p-4 text-sm outline-none"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </section>

          <aside className="space-y-3">
            <div className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-sm text-slate-500">Справа</div>
              <div className="mt-1 text-xl font-bold">Наброски контента</div>
              <div className="mt-2 text-sm text-slate-500">Идеи без даты лежат здесь. Когда переводишь в черновик или чистовик — они попадают в календарь.</div>
            </div>
            {backlogItems.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                Пока пусто. Новые идеи без даты появятся здесь.
              </div>
            )}
            {backlogItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSelectedId(item.id)}
                className={`w-full rounded-3xl border p-4 text-left shadow-sm ${selected && selected.id === item.id ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white"}`}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="text-sm text-slate-500">Без даты</div>
                    <div className="mt-1 font-semibold">{item.idea}</div>
                  </div>
                  <span className="h-fit rounded-full bg-white px-3 py-1 text-xs">{item.status}</span>
                </div>
              </button>
            ))}
          </aside>
        </main>
      </div>
    </div>
  );
}
