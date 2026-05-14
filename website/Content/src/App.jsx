import React, { useEffect, useMemo, useState } from "react";

const platforms = ["Telegram", "VK"];
const workflowStatuses = ["Идея", "Черновик", "Чистовик"];
const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];
const CONTENT_STORAGE_PREFIX = "content-studio-v3";
const LEGACY_CONTENT_STORAGE_PREFIX = "content-studio-v2";
const ACTIVE_LOGIN_KEY = "content-studio-active-login";
const allowedProjects = ["PANDAVKADS", "Шаха"];

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

function getMonthEnd(start) {
  const end = new Date(start);
  end.setMonth(end.getMonth() + 1);
  end.setDate(0);
  return end;
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
  now.setDate(1);
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
    notesHistory: [],
    telegram: `🔥 ${item.idea}\n\n${item.angle}.\n\nГлавная мысль: контент должен не просто выходить, а вести к нужному действию.\n\nТон-источник: ${toneSource || "не загружен"}.\n\nЕсли хочешь такую же систему под проект — напиши в личку.`,
    vk: `Пост для VK: ${item.idea}\n\n${item.angle}\n\nЗдесь можно сделать более развёрнутую версию поста с кейсом, выводом и призывом.`,
    bannerReady: false,
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

function getLegacyStorageKey(login) {
  return `${LEGACY_CONTENT_STORAGE_PREFIX}-${login}`;
}

function createChannelState() {
  return {
    items: [],
    monthStart: getDefaultMonthStart().toISOString(),
    selectedId: null,
    isEditingItem: false,
    toneFileName: "",
    tonePreview: "",
  };
}

function getInitialProjectState(login) {
  return {
    projectLogin: login,
    channels: [],
    activeChannelId: null,
  };
}

function readProjectState(login) {
  if (typeof window === "undefined" || !login) return getInitialProjectState(login);
  try {
    const raw = window.localStorage.getItem(getStorageKey(login));
    if (!raw) {
      const legacyRaw = window.localStorage.getItem(getLegacyStorageKey(login));
      if (!legacyRaw) return getInitialProjectState(login);
      const legacy = JSON.parse(legacyRaw);
      const defaultChannelId = Date.now();
      return {
        projectLogin: login,
        activeChannelId: defaultChannelId,
        channels: [
          {
            id: defaultChannelId,
            name: "Основной канал",
            subscribers: "",
            invested: "",
            reach: "",
            content: {
              monthStart: legacy.monthStart || getDefaultMonthStart().toISOString(),
              selectedId: legacy.selectedId || null,
              items: deserializeItems(legacy.items || []),
              toneFileName: legacy.toneFileName || "",
              tonePreview: legacy.tonePreview || "",
            },
          },
        ],
      };
    }
    const parsed = JSON.parse(raw);
    return {
      ...getInitialProjectState(login),
      ...parsed,
      channels: (parsed.channels || []).map((channel) => ({
        ...channel,
        content: {
          ...createChannelState(),
          ...(channel.content || {}),
          items: deserializeItems(channel.content?.items || []),
        },
      })),
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
  const [channels, setChannels] = useState([]);
  const [activeChannelId, setActiveChannelId] = useState(null);
  const [newChannel, setNewChannel] = useState({ name: "", subscribers: "", invested: "", reach: "" });
  const [editingChannelId, setEditingChannelId] = useState(null);
  const [editingChannel, setEditingChannel] = useState({ subscribers: "", invested: "", reach: "" });
  const [projectLoaded, setProjectLoaded] = useState(false);

  useEffect(() => {
    if (!projectLogin || typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_LOGIN_KEY, projectLogin);
    const saved = readProjectState(projectLogin);
    setChannels(saved.channels || []);
    setActiveChannelId(saved.activeChannelId || saved.channels?.[0]?.id || null);
    setProjectLoaded(true);
  }, [projectLogin]);

  useEffect(() => {
    if (!projectLogin || typeof window === "undefined" || !projectLoaded) return;
    window.localStorage.setItem(
      getStorageKey(projectLogin),
      JSON.stringify({
        projectLogin,
        activeChannelId,
        channels: channels.map((channel) => ({
          ...channel,
          content: {
            ...channel.content,
            items: serializeItems(channel.content?.items || []),
          },
        })),
      })
    );
  }, [projectLogin, activeChannelId, channels, projectLoaded]);

  const activeChannel = useMemo(() => channels.find((channel) => channel.id === activeChannelId) || null, [channels, activeChannelId]);
  const contentState = activeChannel?.content || createChannelState();
  const monthStart = useMemo(() => new Date(contentState.monthStart || getDefaultMonthStart().toISOString()), [contentState.monthStart]);
  const monthEnd = useMemo(() => getMonthEnd(monthStart), [monthStart]);
  const items = contentState.items || [];
  const selectedId = contentState.selectedId || null;
  const isEditingItem = contentState.isEditingItem || false;
  const toneFileName = contentState.toneFileName || "";
  const tonePreview = contentState.tonePreview || "";
  const calendarDays = useMemo(() => getThirtyDays(monthStart), [monthStart]);
  const scheduledItems = useMemo(() => items.filter((item) => item.hasDeadline), [items]);
  const backlogItems = useMemo(() => items.filter((item) => !item.hasDeadline), [items]);
  const selected = items.find((x) => x.id === selectedId) || items[0] || null;
  const postsIn30Days = useMemo(
    () => scheduledItems.filter((item) => calendarDays.some((date) => date.toDateString() === item.date.toDateString())),
    [scheduledItems, calendarDays]
  );
  const monthlyGap = Math.max(0, 10 - postsIn30Days.length);

  useEffect(() => {
    if (!activeChannel) return;
    if (!selectedId && items.length > 0) {
      updateActiveChannelContent({ selectedId: items[0].id });
    }
  }, [activeChannelId, items.length]);

  function updateActiveChannelContent(patch) {
    if (!activeChannel) return;
    setChannels((prev) =>
      prev.map((channel) =>
        channel.id === activeChannel.id
          ? { ...channel, content: { ...channel.content, ...patch } }
          : channel
      )
    );
  }

  function patchSelected(patch) {
    if (!selected || !activeChannel) return;
    const nextItems = items.map((item) => (item.id === selected.id ? { ...item, ...patch } : item));
    updateActiveChannelContent({ items: nextItems, selectedId: selected.id });
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
    setProjectLoaded(false);
  }

  function addChannel() {
    const name = newChannel.name.trim();
    if (!name) return;
    const channelId = Date.now();
    const channel = {
      id: channelId,
      name,
      subscribers: newChannel.subscribers.trim(),
      invested: newChannel.invested.trim(),
      reach: newChannel.reach.trim(),
      content: createChannelState(),
    };
    setChannels((prev) => [...prev, channel]);
    setActiveChannelId(channelId);
    setNewChannel({ name: "", subscribers: "", invested: "", reach: "" });
    setActivity(`Канал ${name} добавлен`);
  }

  function removeChannel(channelId) {
    setChannels((prev) => prev.filter((channel) => channel.id !== channelId));
    if (activeChannelId === channelId) {
      const rest = channels.filter((channel) => channel.id !== channelId);
      setActiveChannelId(rest[0]?.id || null);
    }
  }

  function updateChannel(channelId, patch) {
    setChannels((prev) => prev.map((channel) => (channel.id === channelId ? { ...channel, ...patch } : channel)));
  }

  function startEditChannel(channel) {
    setEditingChannelId(channel.id);
    setEditingChannel({
      subscribers: channel.subscribers || "",
      invested: channel.invested || "",
      reach: channel.reach || "",
    });
  }

  function saveChannelEdit() {
    if (!editingChannelId) return;
    updateChannel(editingChannelId, editingChannel);
    setEditingChannelId(null);
    setEditingChannel({ subscribers: "", invested: "", reach: "" });
  }

  function showChannelPlan(channelId) {
    setActiveChannelId(channelId);
    const channel = channels.find((item) => item.id === channelId);
    if (channel) setActivity(`Открыт контент-план канала ${channel.name}`);
  }

  function shiftMonth(delta) {
    const next = new Date(monthStart);
    next.setMonth(next.getMonth() + delta);
    next.setDate(1);
    updateActiveChannelContent({ monthStart: next.toISOString(), selectedId: null });
  }

  function addContent() {
    if (!activeChannel) return;
    setWorking(true);
    setActivity("Добавляю новую единицу контента…");
    setTimeout(() => {
      const freeSlot = calendarDays.find((date) => !scheduledItems.some((item) => item.date.toDateString() === date.toDateString())) || calendarDays[0];
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
      updateActiveChannelContent({ items: [nextItem, ...items], selectedId: nextItem.id });
      setWorking(false);
      setActivity(`Контент добавлен в ${activeChannel.name}`);
    }, 300);
  }

  function createDraft() {
    if (!selected) return;
    const existingDraft = selected.draft || makeDraft(selected, toneFileName || tonePreview);
    const nextDraft = {
      ...makeDraft(selected, toneFileName || tonePreview),
      notes: existingDraft.notes || "",
      notesHistory: existingDraft.notesHistory || [],
    };
    patchSelected({ status: "Черновик", draft: nextDraft });
    setActivity("Черновик готов");
  }

  function togglePlatform(p) {
    if (!selected) return;
    const nextPlatforms = selected.platforms.includes(p) ? selected.platforms.filter((x) => x !== p) : [...selected.platforms, p];
    patchSelected({ platforms: nextPlatforms });
  }

  function updateNotes(value) {
    if (!selected || !selected.draft) return;
    patchSelected({ draft: { ...selected.draft, notes: value } });
  }

  function addNote() {
    if (!selected || !selected.draft) return;
    const note = selected.draft.notes?.trim();
    if (!note) return;
    const previousNotes = selected.draft.notesHistory || [];
    const notesHistory = [...previousNotes, note];
    patchSelected({
      draft: {
        ...selected.draft,
        notes: "",
        notesHistory,
      },
      status: "Черновик",
    });
  }

  function removeNote(indexToRemove) {
    if (!selected || !selected.draft) return;
    const nextHistory = (selected.draft.notesHistory || []).filter((_, index) => index !== indexToRemove);
    patchSelected({ draft: { ...selected.draft, notesHistory: nextHistory } });
  }

  function editNote(indexToEdit) {
    if (!selected || !selected.draft) return;
    const note = selected.draft.notesHistory?.[indexToEdit];
    if (!note) return;
    const nextHistory = (selected.draft.notesHistory || []).filter((_, index) => index !== indexToEdit);
    patchSelected({ draft: { ...selected.draft, notes: note, notesHistory: nextHistory } });
  }

  function uploadToneFile(event) {
    const file = event.target.files?.[0];
    if (!file || !activeChannel) return;
    const reader = new FileReader();
    reader.onload = () => {
      const raw = String(reader.result || "");
      const cleaned = raw.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
      updateActiveChannelContent({ toneFileName: file.name, tonePreview: cleaned.slice(0, 400) });
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
      const freeSlot = calendarDays.find((date) => !scheduledItems.some((item) => item.id !== selected.id && item.date.toDateString() === date.toDateString())) || calendarDays[0];
      patch.hasDeadline = true;
      patch.date = freeSlot;
      patch.dayName = dayNames[(freeSlot.getDay() + 6) % 7];
    }
    patchSelected(patch);
  }

  function setPostDate(value) {
    if (!selected) return;
    const nextDate = new Date(value);
    if (Number.isNaN(nextDate.getTime())) return;
    patchSelected({ date: nextDate, dayName: dayNames[(nextDate.getDay() + 6) % 7], hasDeadline: true });
  }

  function publish(platform) {
    if (!selected) return;
    patchSelected({ published: { ...selected.published, [platform]: true } });
  }

  function removeItem(itemId) {
    updateActiveChannelContent({ items: items.filter((item) => item.id !== itemId), selectedId: selectedId === itemId ? null : selectedId });
  }

  function startEditingItem() {
    if (!selected) return;
    updateActiveChannelContent({ isEditingItem: true, selectedId: selected.id });
  }

  function stopEditingItem() {
    updateActiveChannelContent({ isEditingItem: false });
  }

  if (!projectLogin) {
    return (
      <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">✨ PANDAPOST</div>
            <h1 className="text-3xl font-bold tracking-tight">Вход в проект</h1>
            <p className="mt-3 text-sm text-slate-500">Сейчас доступны логины проекта: PANDAVKADS и Шаха</p>
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
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">✨ PANDAPOST</div>
            <h1 className="text-4xl font-bold tracking-tight">Контент-план проекта</h1>
            <p className="mt-3 max-w-2xl text-slate-600">Проект: <span className="font-semibold text-slate-900">{projectLogin}</span>. У каждого канала свой отдельный контент-план и своё сохранение.</p>
          </div>
          <div className="flex flex-col gap-3 md:items-end">
            <div className="rounded-2xl bg-slate-100 p-4 text-sm">
              <div className="font-semibold">Статус</div>
              <div className="mt-1 text-slate-600">{working ? "⏳ " : "✅ "}{activity}</div>
            </div>
            <Button className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={logoutProject}>Сменить проект</Button>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.4fr]">
          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4">
              <div className="text-lg font-semibold">Каналы проекта</div>
              <div className="text-sm text-slate-500">Список каналов наверху. У каждого — свой контент-план.</div>
            </div>
            <div className="space-y-3">
              <input value={newChannel.name} onChange={(e) => setNewChannel((prev) => ({ ...prev, name: e.target.value }))} placeholder="Название канала" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              <input value={newChannel.subscribers} onChange={(e) => setNewChannel((prev) => ({ ...prev, subscribers: e.target.value }))} placeholder="Кол-во подписчиков" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              <input value={newChannel.invested} onChange={(e) => setNewChannel((prev) => ({ ...prev, invested: e.target.value }))} placeholder="Сколько вложено в канал" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              <input value={newChannel.reach} onChange={(e) => setNewChannel((prev) => ({ ...prev, reach: e.target.value }))} placeholder="Средние охваты" className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
              <Button active onClick={addChannel}>＋ Добавить канал</Button>
            </div>
          </div>

          <div className="rounded-3xl bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div>
                <div className="text-lg font-semibold">Список каналов</div>
                <div className="text-sm text-slate-500">Выбери канал и открой его контент-план.</div>
              </div>
              <div className="rounded-2xl bg-slate-100 px-4 py-2 text-sm text-slate-600">Каналов: {channels.length}</div>
            </div>

            <div className="space-y-3">
              {channels.length === 0 && <div className="rounded-2xl border border-dashed border-slate-300 p-6 text-center text-sm text-slate-500">Пока пусто. Добавь первый канал.</div>}
              {channels.map((channel) => (
                <div key={channel.id} className={`rounded-2xl border p-4 ${activeChannelId === channel.id ? "border-slate-900 bg-slate-50" : "border-slate-200"}`}>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="text-lg font-semibold">{channel.name}</div>
                      <div className="mt-3 grid gap-2 text-sm text-slate-600 md:grid-cols-3">
                        <div><span className="text-slate-400">Подписчики:</span> {channel.subscribers || "—"}</div>
                        <div><span className="text-slate-400">Вложено:</span> {channel.invested || "—"}</div>
                        <div><span className="text-slate-400">Охваты:</span> {channel.reach || "—"}</div>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => startEditChannel(channel)} className="text-sm text-slate-500 hover:text-slate-900">Редактировать</button>
                      <button onClick={() => removeChannel(channel.id)} className="text-sm text-red-500 hover:text-red-700">Удалить</button>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button active={activeChannelId === channel.id} onClick={() => showChannelPlan(channel.id)}>Показать контент-план</Button>
                  </div>
                  {editingChannelId === channel.id && (
                    <div className="mt-4 grid gap-3 md:grid-cols-3">
                      <input value={editingChannel.subscribers} onChange={(e) => setEditingChannel((prev) => ({ ...prev, subscribers: e.target.value }))} placeholder="Кол-во подписчиков" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      <input value={editingChannel.invested} onChange={(e) => setEditingChannel((prev) => ({ ...prev, invested: e.target.value }))} placeholder="Сколько вложено" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      <input value={editingChannel.reach} onChange={(e) => setEditingChannel((prev) => ({ ...prev, reach: e.target.value }))} placeholder="Средние охваты" className="rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      <div className="md:col-span-3 flex gap-2">
                        <Button active onClick={saveChannelEdit}>Сохранить</Button>
                        <Button onClick={() => setEditingChannelId(null)}>Отмена</Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {activeChannel ? (
          <>
            <section className="grid gap-4 md:grid-cols-3">
              <div className="rounded-3xl bg-white p-5 shadow-sm">
                <div className="text-sm text-slate-500">Активный канал</div>
                <div className="mt-2 text-3xl font-bold">{activeChannel.name}</div>
                <div className="mt-2 text-sm text-slate-500">У этого канала свой отдельный контент-план</div>
              </div>
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
            </section>

            <section className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center">
              <div>
                <div className="text-sm text-slate-500">Календарь канала</div>
                <div className="text-lg font-semibold">{formatDate(monthStart)} — {formatDate(monthEnd)}</div>
                {monthlyGap > 0 && <div className="mt-2 text-sm text-amber-600">⚠️ В 30-дневном окне не хватает {monthlyGap} постов до базового ритма.</div>}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => shiftMonth(-1)}>← Предыдущие 30 дней</Button>
                <Button onClick={() => shiftMonth(1)}>Следующие 30 дней →</Button>
                <Button active onClick={addContent} disabled={working}>＋ Добавить контент</Button>
              </div>
            </section>

            <section className="rounded-3xl bg-white p-5 shadow-sm">
              <div className="text-lg font-semibold">Календарь на 30 дней</div>
              <div className="mt-1 text-sm text-slate-500">Здесь видно, какой пост выходит в какой день для канала {activeChannel.name}.</div>
              <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
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
                            <button key={item.id} onClick={() => updateActiveChannelContent({ selectedId: item.id })} className="w-full rounded-xl bg-white px-3 py-2 text-left text-sm shadow-sm">
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
                {scheduledItems.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Пока нет постов с датой. Переведи идею в черновик или чистовик — и она встанет в календарь.</div>}
                {scheduledItems.map((item) => (
                  <button key={item.id} onClick={() => updateActiveChannelContent({ selectedId: item.id })} className={`w-full rounded-3xl border p-4 text-left shadow-sm ${selected && selected.id === item.id ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white"}`}>
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
                        <textarea value={selected.idea} onChange={(e) => patchSelected({ idea: e.target.value })} readOnly={!isEditingItem} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-xl font-semibold" rows={2} />
                        <textarea value={selected.angle} onChange={(e) => patchSelected({ angle: e.target.value })} readOnly={!isEditingItem} className="mt-2 w-full rounded-2xl border border-slate-300 p-3 text-sm text-slate-600" rows={2} />
                      </div>
                      <div className="flex flex-col gap-2">
                        {isEditingItem ? (
                          <Button active onClick={stopEditingItem}>Сохранить правки</Button>
                        ) : (
                          <Button onClick={startEditingItem}>Редактировать единицу</Button>
                        )}
                        <Button active onClick={createDraft}>📝 Создать драфт</Button>
                        <Button onClick={() => removeItem(selected.id)}>Удалить</Button>
                      </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <div className="mb-2 font-semibold">Статус</div>
                        <div className="flex flex-wrap gap-2">
                          {workflowStatuses.map((status) => <Button key={status} active={selected.status === status} onClick={() => setStatus(status)}>{status}</Button>)}
                        </div>
                      </div>
                      <div>
                        <div className="mb-2 font-semibold">Дата публикации</div>
                        <input type="date" value={selected.date.toISOString().slice(0, 10)} onChange={(e) => setPostDate(e.target.value)} className="w-full rounded-2xl border border-slate-300 px-4 py-3 text-sm" />
                      </div>
                    </div>

                    {selected.status === "Идея" && (
                      <>
                        <div className="grid gap-4 md:grid-cols-2">
                          <div>
                            <div className="mb-2 font-semibold">Площадки</div>
                            <div className="flex flex-wrap gap-2">
                              {platforms.map((p) => <Button key={p} active={selected.platforms.includes(p)} onClick={() => togglePlatform(p)}>{selected.platforms.includes(p) ? "✓ " : "+ "}{p}</Button>)}
                            </div>
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
                      </>
                    )}

                    {selected.draft && selected.status !== "Идея" && (
                      <div className="space-y-5">
                        {selected.platforms.includes("Telegram") && (
                          <div className="rounded-3xl border border-slate-200 p-4">
                            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                              <h2 className="text-xl font-bold">Материал канала</h2>
                              <div className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">{selected.status === "Чистовик" ? "Готово" : "В работе"}</div>
                            </div>
                            <div className="mb-4 space-y-3 rounded-2xl bg-slate-50 p-4">
                              <div className="font-semibold text-slate-800">Заметки и доработка</div>
                              <textarea value={selected.draft.notes || ""} onChange={(e) => updateNotes(e.target.value)} placeholder="Сюда вноси тезисы, факты, мысли, куски исходников." className="min-h-[160px] w-full rounded-2xl border border-slate-300 bg-white p-4 text-sm outline-none" />
                              <Button active onClick={addNote}>✨ Внести заметку</Button>
                            </div>
                            {selected.draft.notesHistory?.length > 0 && (
                              <div className="rounded-2xl bg-white p-4 text-sm text-slate-700">
                                <div className="mb-2 font-semibold text-slate-800">Внесённые заметки</div>
                                <div className="space-y-2">
                                  {selected.draft.notesHistory.map((note, index) => (
                                    <div key={`${index}-${note}`} className="rounded-xl bg-slate-50 px-3 py-2">
                                      <div className="flex items-start justify-between gap-3">
                                        <div>{index + 1}. {note}</div>
                                        <div className="flex gap-2">
                                          <button onClick={() => editNote(index)} className="text-xs text-slate-500 hover:text-slate-900">Редактировать</button>
                                          <button onClick={() => removeNote(index)} className="text-xs text-red-500 hover:text-red-700">Удалить</button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
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
                {backlogItems.length === 0 && <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">Пока пусто. Новые идеи без даты появятся здесь.</div>}
                {backlogItems.map((item) => (
                  <button key={item.id} onClick={() => updateActiveChannelContent({ selectedId: item.id })} className={`w-full rounded-3xl border p-4 text-left shadow-sm ${selected && selected.id === item.id ? "border-slate-900 bg-slate-100" : "border-slate-200 bg-white"}`}>
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
          </>
        ) : (
          <section className="rounded-3xl bg-white p-10 text-center shadow-sm">
            <div className="text-2xl font-semibold">Сначала выбери канал</div>
            <div className="mt-2 text-sm text-slate-500">Добавь канал выше и нажми «Показать контент-план».</div>
          </section>
        )}
      </div>
    </div>
  );
}
