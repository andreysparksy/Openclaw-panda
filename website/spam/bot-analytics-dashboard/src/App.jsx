import React, { useMemo, useState } from "react";

const stats = [
  { label: "Сообщений отправлено", value: "128 430", delta: "+12.8%", hint: "за последние 7 дней", icon: "✉️" },
  { label: "Живых аккаунтов", value: "248", delta: "+18", hint: "активны и доступны", icon: "🛡️" },
  { label: "Проектов в работе", value: "8", delta: "+2", hint: "можно держать 5–20 проектов", icon: "📁" },
  { label: "Успешность доставки", value: "97.3%", delta: "+1.1%", hint: "без ошибок отправки", icon: "✅" },
];

const deliveryData = [
  { day: "Пн", messages: 14200, delivered: 13840 },
  { day: "Вт", messages: 16800, delivered: 16210 },
  { day: "Ср", messages: 15450, delivered: 14920 },
  { day: "Чт", messages: 18730, delivered: 18250 },
  { day: "Пт", messages: 21900, delivered: 21360 },
  { day: "Сб", messages: 17650, delivered: 17110 },
  { day: "Вс", messages: 23700, delivered: 23090 },
];

const projectStatuses = [
  { name: "Активные проекты", value: 8 },
  { name: "На паузе", value: 3 },
  { name: "Новые", value: 2 },
  { name: "Архив", value: 1 },
];

const accountGroups = [
  { label: "Живые", value: 248, percent: 82, icon: "✅" },
  { label: "Прогрев", value: 31, percent: 10, icon: "⏱️" },
  { label: "Лимиты", value: 18, percent: 6, icon: "⚡" },
  { label: "Отвалились", value: 7, percent: 2, icon: "⛔" },
];

const projectSections = [
  { id: "accounts", title: "Аккаунты", icon: "👤", description: "Аккаунты этого проекта." },
  { id: "messages", title: "Сообщения", icon: "💬", description: "Первое, второе и третье сообщение." },
  { id: "add-chat", title: "Добавить чат", icon: "➕", description: "Добавление новых чатов в проект." },
  { id: "chat-list", title: "Список чатов", icon: "📋", description: "Все чаты внутри проекта." },
];

const createProject = (id, name, chats, accounts, messages) => ({ id, name, chats, accounts, messages });

const initialProjects = [
  createProject(
    "agency",
    "Агентство",
    [
      "https://t.me/foodsafety_ru",
      "https://t.me/normtu",
      "https://t.me/Food_IndustryPRO",
      "https://t.me/INTEKPROM",
    ],
    [
      { name: "session1", label: "Аккаунт 1", status: "Активен" },
      { name: "session2", label: "Аккаунт 2", status: "Активен" },
      { name: "session3", label: "Аккаунт 3", status: "Прогрев" },
    ],
    {
      first: "Привет, есть нормальные подрядчики по клинингу? А то попадаются одни распиздяи. Мне главное, чтобы на совесть делали и стандарты соблюдали.",
      second:
        "Если в Питере или Казани, то могу рекомендовать этих ребят — http://avito.ru/brands/89d521a4fe29873dfd9f1f42c7e90b31/all/predlozheniya_uslug?src=search_seller_info&iid=7805656263&sellerId=19f4fba8e5fa09e037bed1c9bb1516d8",
      third: "Кстати, тоже к ним обращались, только через вк — https://vk.com/prommclean",
    }
  ),
  createProject(
    "cleaning",
    "Клининг",
    ["https://t.me/sanerity", "https://t.me/marafonhassp", "https://t.me/bezopasnosty"],
    [
      { name: "clean_1", label: "Клининг 1", status: "Активен" },
      { name: "clean_2", label: "Клининг 2", status: "Активен" },
    ],
    {
      first: "Подскажите, кто реально нормально закрывает клининг для производств?",
      second: "Могу скинуть подрядчика, у которого норм по стандартам и срокам.",
      third: "Да, подтверждаю, с ними уже работали — всё ок.",
    }
  ),
  createProject(
    "realty",
    "Недвижка",
    ["https://t.me/ONlineOhranaTrudaEcoBIOT", "https://t.me/haccpmore"],
    [
      { name: "realty_1", label: "Недвижка 1", status: "Прогрев" },
      { name: "realty_2", label: "Недвижка 2", status: "Активен" },
    ],
    {
      first: "Кто сейчас реально ведёт клиентов по недвижимости без слива бюджета?",
      second: "Есть вариант, могу скинуть ребят, с которыми работали.",
      third: "Тоже слышал про них нормальные отзывы.",
    }
  ),
];

function formatNumber(value) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

function buildAreaPath(data, key, width, height, padding) {
  const values = data.map((item) => item[key]);
  const max = Math.max(...values);
  const min = Math.min(...values) * 0.9;
  const innerWidth = width - padding.left - padding.right;
  const innerHeight = height - padding.top - padding.bottom;

  const points = data.map((item, index) => {
    const x = padding.left + (index / (data.length - 1)) * innerWidth;
    const y = padding.top + innerHeight - ((item[key] - min) / (max - min)) * innerHeight;
    return [x, y];
  });

  const linePath = points
    .map(([x, y], index) => `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${height - padding.bottom} L ${
    points[0][0].toFixed(2)
  } ${height - padding.bottom} Z`;

  return { points, linePath, areaPath, max };
}

function StatCard({ item }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">{item.icon}</div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">{item.delta}</span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-slate-500">{item.label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
        <p className="mt-1 text-sm text-slate-400">{item.hint}</p>
      </div>
    </div>
  );
}

function DeliveryChart() {
  const width = 720;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 42, left: 54 };
  const messages = buildAreaPath(deliveryData, "messages", width, height, padding);
  const delivered = buildAreaPath(deliveryData, "delivered", width, height, padding);

  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-slate-50 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-80 w-full">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {[0, 1, 2, 3, 4].map((line) => {
          const y = padding.top + (line / 4) * (height - padding.top - padding.bottom);
          return <line key={line} x1={padding.left} x2={width - padding.right} y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="5 7" />;
        })}

        <path d={messages.areaPath} fill="url(#areaFill)" />
        <path d={messages.linePath} fill="none" stroke="#0f172a" strokeWidth="4" strokeLinecap="round" />
        <path d={delivered.linePath} fill="none" stroke="#64748b" strokeWidth="3" strokeLinecap="round" />

        {messages.points.map(([x, y], index) => (
          <g key={deliveryData[index].day}>
            <circle cx={x} cy={y} r="5" fill="#0f172a" />
            <text x={x} y={height - 14} textAnchor="middle" className="fill-slate-500 text-xs font-semibold">
              {deliveryData[index].day}
            </text>
          </g>
        ))}

        <text x={padding.left} y="18" className="fill-slate-500 text-xs font-semibold">
          до {formatNumber(messages.max)} сообщений
        </text>
      </svg>
    </div>
  );
}

function ProjectStatusChart() {
  const max = Math.max(...projectStatuses.map((item) => item.value));

  return (
    <div className="mt-6 space-y-4">
      {projectStatuses.map((item) => {
        const width = Math.max((item.value / max) * 100, 8);
        return (
          <div key={item.name} className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="font-semibold text-slate-700">{item.name}</p>
              <p className="text-lg font-bold text-slate-950">{formatNumber(item.value)}</p>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full rounded-full bg-slate-950" style={{ width: `${width}%` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
}

function ProjectFolder({ project, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(project.id)}
      className={
        isActive
          ? "rounded-3xl border border-slate-950 bg-slate-950 p-5 text-left text-white shadow-sm transition"
          : "rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"
      }
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-3xl">📁</div>
        <span className={isActive ? "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"}>
          Проект
        </span>
      </div>
      <h3 className="mt-5 text-xl font-bold">{project.name}</h3>
      <p className={isActive ? "mt-2 text-sm text-slate-200" : "mt-2 text-sm text-slate-500"}>
        {project.accounts.length} аккаунтов · {project.chats.length} чатов
      </p>
    </button>
  );
}

function SectionCard({ section, isActive, onClick }) {
  return (
    <button
      onClick={() => onClick(section.id)}
      className={isActive ? "rounded-3xl border border-slate-950 bg-slate-950 p-5 text-left text-white shadow-sm transition" : "rounded-3xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-slate-300 hover:shadow-md"}
    >
      <div className="flex items-center justify-between gap-4">
        <div className="text-3xl">{section.icon}</div>
        <span className={isActive ? "rounded-full bg-white/15 px-3 py-1 text-xs font-semibold text-white" : "rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600"}>Раздел</span>
      </div>
      <h3 className="mt-5 text-xl font-bold">{section.title}</h3>
      <p className={isActive ? "mt-2 text-sm text-slate-200" : "mt-2 text-sm text-slate-500"}>{section.description}</p>
    </button>
  );
}

function AccountsManager({ project, onAddAccount }) {
  const [draft, setDraft] = useState({ sessionName: "", displayName: "", status: "Активен" });

  const submit = () => {
    if (!draft.sessionName.trim() || !draft.displayName.trim()) return;
    onAddAccount(project.id, {
      name: draft.sessionName.trim(),
      label: draft.displayName.trim(),
      status: draft.status,
    });
    setDraft({ sessionName: "", displayName: "", status: "Активен" });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-bold">Аккаунты проекта «{project.name}»</h3>
        <p className="mt-1 text-sm text-slate-500">Добавляй отдельные аккаунты именно в эту папку проекта.</p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <input value={draft.sessionName} onChange={(e) => setDraft((p) => ({ ...p, sessionName: e.target.value }))} placeholder="Имя сессии" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
          <input value={draft.displayName} onChange={(e) => setDraft((p) => ({ ...p, displayName: e.target.value }))} placeholder="Отображаемое имя" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
          <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400">
            <option>Активен</option>
            <option>Прогрев</option>
            <option>Лимит</option>
          </select>
        </div>
        <button onClick={submit} className="mt-4 inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Добавить аккаунт</button>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
              <tr><th className="px-4 py-4">Сессия</th><th className="px-4 py-4">Название</th><th className="px-4 py-4">Статус</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {project.accounts.map((account) => (
                <tr key={account.name}><td className="px-4 py-4 font-semibold text-slate-950">{account.name}</td><td className="px-4 py-4 text-slate-600">{account.label}</td><td className="px-4 py-4 text-slate-600">{account.status}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MessagesManager({ project, onUpdateMessages }) {
  const updateField = (key, value) => {
    onUpdateMessages(project.id, { ...project.messages, [key]: value });
  };

  return (
    <div className="space-y-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div>
        <h3 className="text-xl font-bold">Сообщения проекта «{project.name}»</h3>
        <p className="mt-1 text-sm text-slate-500">У каждого проекта свой набор из трёх сообщений.</p>
      </div>
      {[
        ["first", "Первое сообщение"],
        ["second", "Второе сообщение"],
        ["third", "Третье сообщение"],
      ].map(([key, title]) => (
        <div key={key} className="rounded-2xl bg-slate-50 p-4">
          <label className="mb-3 block text-sm font-semibold text-slate-700">{title}</label>
          <textarea value={project.messages[key]} onChange={(e) => updateField(key, e.target.value)} rows={key === "second" ? 4 : 3} className="min-h-[110px] w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
        </div>
      ))}
    </div>
  );
}

function AddChatManager({ project, onAddChat }) {
  const [value, setValue] = useState("");
  const submit = () => {
    if (!value.trim()) return;
    onAddChat(project.id, value.trim());
    setValue("");
  };

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <h3 className="text-xl font-bold">Добавить чат в проект «{project.name}»</h3>
      <p className="mt-1 text-sm text-slate-500">Чаты добавляются не в общую кучу, а внутрь конкретной папки проекта.</p>
      <div className="mt-5 space-y-3">
        <input value={value} onChange={(e) => setValue(e.target.value)} placeholder="https://t.me/example или @example" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
        <button onClick={submit} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Добавить чат</button>
      </div>
    </div>
  );
}

function ChatListManager({ project }) {
  const [query, setQuery] = useState("");
  const filteredChats = useMemo(() => project.chats.filter((chat) => chat.toLowerCase().includes(query.toLowerCase())), [project.chats, query]);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold">Список чатов проекта «{project.name}»</h3>
          <p className="mt-1 text-sm text-slate-500">Только чаты этой папки, без смешивания с другими проектами.</p>
        </div>
        <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
          <span className="text-slate-400">⌕</span>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Найти чат" className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400" />
        </label>
      </div>

      <div className="mt-5 overflow-hidden rounded-2xl border border-slate-200">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-4">#</th><th className="px-4 py-4">Чат</th></tr></thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredChats.map((chat, index) => (
              <tr key={`${chat}-${index}`}><td className="px-4 py-4 font-semibold text-slate-500">{index + 1}</td><td className="px-4 py-4 text-slate-700">{chat}</td></tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function BotAnalyticsDashboard() {
  const [period, setPeriod] = useState("7 дней");
  const [projects, setProjects] = useState(initialProjects);
  const [activeProjectId, setActiveProjectId] = useState(initialProjects[0].id);
  const [activeSection, setActiveSection] = useState("accounts");
  const [newProjectName, setNewProjectName] = useState("");

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) || projects[0], [projects, activeProjectId]);

  const addProject = () => {
    const name = newProjectName.trim();
    if (!name) return;
    const id = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-zA-Zа-яА-Я0-9-_]/g, "");
    const project = createProject(id || `project-${Date.now()}`, name, [], [], { first: "", second: "", third: "" });
    setProjects((prev) => [...prev, project]);
    setActiveProjectId(project.id);
    setActiveSection("accounts");
    setNewProjectName("");
  };

  const updateProject = (projectId, updater) => {
    setProjects((prev) => prev.map((project) => (project.id === projectId ? updater(project) : project)));
  };

  const addAccount = (projectId, account) => updateProject(projectId, (project) => ({ ...project, accounts: [account, ...project.accounts] }));
  const updateMessages = (projectId, messages) => updateProject(projectId, (project) => ({ ...project, messages }));
  const addChat = (projectId, chat) => updateProject(projectId, (project) => ({ ...project, chats: [chat, ...project.chats] }));

  const renderSectionContent = () => {
    if (!activeProject) return null;
    if (activeSection === "accounts") return <AccountsManager project={activeProject} onAddAccount={addAccount} />;
    if (activeSection === "messages") return <MessagesManager project={activeProject} onUpdateMessages={updateMessages} />;
    if (activeSection === "add-chat") return <AddChatManager project={activeProject} onAddChat={addChat} />;
    return <ChatListManager project={activeProject} />;
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-3xl text-white shadow-sm">🤖</div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Bot analytics</p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">Мультипроектная панель Telegram-бота</h1>
              <p className="mt-2 max-w-2xl text-slate-500">Один бот, внутри которого можно держать 5–20 проектов с отдельными аккаунтами, сообщениями и чатами.</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select value={period} onChange={(event) => setPeriod(event.target.value)} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-400">
              <option>24 часа</option>
              <option>7 дней</option>
              <option>30 дней</option>
              <option>90 дней</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">↻ Обновить</button>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{stats.map((item) => <StatCard key={item.label} item={item} />)}</section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500"><span>📈</span><p className="text-sm font-semibold uppercase tracking-widest">Динамика</p></div>
                  <h2 className="mt-2 text-2xl font-bold">Отправки и доставки</h2>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">Период: {period}</p>
              </div>
              <DeliveryChart />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Проекты</p>
                  <h2 className="mt-2 text-2xl font-bold">Статусы проектов</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📁</div>
              </div>
              <ProjectStatusChart />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Аккаунты</p>
                  <h2 className="mt-2 text-2xl font-bold">Состояние базы</h2>
                </div>
                <span className="text-3xl">👥</span>
              </div>

              <div className="mt-6 space-y-4">
                {accountGroups.map((group) => (
                  <div key={group.label} className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">{group.icon}</div>
                        <div>
                          <p className="font-semibold">{group.label}</p>
                          <p className="text-sm text-slate-500">{group.value} аккаунтов</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{group.percent}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-slate-950" style={{ width: `${group.percent}%` }} /></div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Проекты / папки</p>
                  <h2 className="mt-2 text-2xl font-bold">Выбор проекта</h2>
                  <p className="mt-2 text-sm text-slate-500">Сначала заходишь в папку проекта, а уже внутри неё управляешь аккаунтами, сообщениями и чатами.</p>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
                  <input value={newProjectName} onChange={(e) => setNewProjectName(e.target.value)} placeholder="Название новой папки, например Агентство" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
                  <button onClick={addProject} className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800">Создать папку</button>
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <ProjectFolder key={project.id} project={project} isActive={activeProjectId === project.id} onClick={setActiveProjectId} />
                  ))}
                </div>
              </div>

              {activeProject && (
                <>
                  <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div>
                      <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Внутри проекта</p>
                      <h2 className="mt-2 text-2xl font-bold">{activeProject.name}</h2>
                      <p className="mt-2 text-sm text-slate-500">Внутри каждой папки свой набор аккаунтов, сообщений и чатов.</p>
                    </div>
                    <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      {projectSections.map((section) => (
                        <SectionCard key={section.id} section={section} isActive={activeSection === section.id} onClick={setActiveSection} />
                      ))}
                    </div>
                  </div>

                  {renderSectionContent()}
                </>
              )}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
