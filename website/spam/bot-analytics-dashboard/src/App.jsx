import React, { useEffect, useMemo, useState } from "react";

const API_BASE = "https://api.pandavkads.ru/api";


const projectSections = [
  { id: "accounts", title: "Аккаунты", icon: "👤", description: "Аккаунты этого проекта." },
  { id: "messages", title: "Сообщения", icon: "💬", description: "Первое, второе и третье сообщение." },
  { id: "add-chat", title: "Добавить чат", icon: "➕", description: "Добавление новых чатов в проект." },
  { id: "chat-list", title: "Список чатов", icon: "📋", description: "Все чаты внутри проекта." },
];

const createProject = (id, name, chats, accounts, messages) => ({ id, name, chats, accounts, messages });

const initialProjects = [
  createProject(
    "cleaning",
    "Клининг",
    [
      "https://t.me/foodsafety_ru",
      "https://t.me/normtu",
      "https://t.me/Food_IndustryPRO",
      "https://t.me/INTEKPROM",
      "https://t.me/sanerity",
      "https://t.me/marafonhassp",
      "https://t.me/bezopasnosty",
      "https://t.me/ONlineOhranaTrudaEcoBIOT",
      "t.me/haccpmore",
    ],
    [
      { name: "session1", label: "Аккаунт 1", status: "Активен", reason: "Работает стабильно", lastCheck: "27.04.2026 16:20" },
      { name: "session2", label: "Аккаунт 2", status: "Активен", reason: "Работает стабильно", lastCheck: "27.04.2026 16:18" },
      { name: "admin_bot", label: "admin_bot", status: "Активен", reason: "Сессия учтена как отдельный аккаунт", lastCheck: "27.04.2026 16:17" },
    ],
    {
      first: "Привет, есть нормальные подрядчики по клинингу? А то попадаются одни распиздяи\nМне главное, чтобы на совесть делали и стандарты соблюдали",
      second: "Если в Питере или Казани, то могу рекомендовать этих ребят - http://avito.ru/brands/89d521a4fe29873dfd9f1f42c7e90b31/all/predlozheniya_uslug?src=search_seller_info&iid=7805656263&sellerId=19f4fba8e5fa09e037bed1c9bb1516d8",
      third: "Кстати, тоже к ним обращались, только через вк - https://vk.com/prommclean",
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

function SummaryBars({ items }) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="mt-6 space-y-4">
      {items.map((item) => {
        const width = Math.max((item.value / max) * 100, item.value > 0 ? 8 : 0);
        return (
          <div key={item.name} className="rounded-2xl bg-slate-50 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div>
                <p className="font-semibold text-slate-700">{item.name}</p>
                {item.hint ? <p className="text-sm text-slate-500">{item.hint}</p> : null}
              </div>
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

function getStatusClasses(status) {
  if (status === "Активен") return "bg-emerald-50 text-emerald-700";
  if (status === "Прогрев" || status === "Лимит") return "bg-amber-50 text-amber-700";
  if (status === "Заблокирован") return "bg-rose-50 text-rose-700";
  return "bg-slate-100 text-slate-600";
}

function AccountsManager({ project, onAddAccount, onDeleteAccount, onReloadProject }) {
  const [step, setStep] = useState(1);
  const [draft, setDraft] = useState({
    sessionName: "",
    phone: "",
    code: "",
    password: "",
    status: "Активен",
  });
  const [needPassword, setNeedPassword] = useState(false);
  const [resultText, setResultText] = useState("");
  const [isBusy, setIsBusy] = useState(false);

  const sendCode = async () => {
    if (!draft.sessionName.trim() || !draft.phone.trim()) return;
    setIsBusy(true);
    try {
      const response = await fetch(`${API_BASE}/send-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionName: draft.sessionName.trim(), phone: draft.phone.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Не удалось отправить код");
      setResultText(`${data.message}. Проверь Telegram.`);
      setStep(2);
    } catch (error) {
      setResultText(error.message || "Ошибка отправки кода");
    } finally {
      setIsBusy(false);
    }
  };

  const confirmCode = async () => {
    if (!draft.code.trim()) return;
    setIsBusy(true);
    try {
      const response = await fetch(`${API_BASE}/verify-code`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionName: draft.sessionName.trim(), code: draft.code.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Не удалось подтвердить код");
      if (data.needPassword) {
        setNeedPassword(true);
        setResultText(data.message || "Нужен пароль 2FA");
        setStep(3);
        return;
      }
      setResultText(data.message || "Аккаунт подключён");
      setDraft({ sessionName: "", phone: "", code: "", password: "", status: "Активен" });
      setNeedPassword(false);
      setStep(1);
      await onReloadProject();
    } catch (error) {
      setResultText(error.message || "Ошибка подтверждения кода");
    } finally {
      setIsBusy(false);
    }
  };

  const confirmPassword = async () => {
    if (!draft.password.trim()) return;
    setIsBusy(true);
    try {
      const response = await fetch(`${API_BASE}/verify-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionName: draft.sessionName.trim(), password: draft.password.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Не удалось подтвердить пароль");
      setResultText(data.message || "Аккаунт подключён через 2FA");
      setDraft({ sessionName: "", phone: "", code: "", password: "", status: "Активен" });
      setNeedPassword(false);
      setStep(1);
      await onReloadProject();
    } catch (error) {
      setResultText(error.message || "Ошибка 2FA");
    } finally {
      setIsBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
        <h3 className="text-xl font-bold">Аккаунты проекта «{project.name}»</h3>
        <p className="mt-1 text-sm text-slate-500">Пошаговый мастер добавления аккаунта: имя сессии → телефон → код → 2FA при необходимости.</p>
        <div className="mt-3 rounded-2xl bg-slate-100 px-4 py-3 text-sm font-medium text-slate-700">
          Лимит на проект: максимум 3 аккаунта. Сейчас: {project.accounts.length} / 3.
        </div>

        <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-slate-500">
          <span className={step === 1 ? "rounded-full bg-slate-950 px-3 py-2 text-white" : "rounded-full bg-white px-3 py-2"}>1. Данные</span>
          <span className={step === 2 ? "rounded-full bg-slate-950 px-3 py-2 text-white" : "rounded-full bg-white px-3 py-2"}>2. Код</span>
          <span className={step === 3 ? "rounded-full bg-slate-950 px-3 py-2 text-white" : "rounded-full bg-white px-3 py-2"}>3. 2FA</span>
        </div>

        {step === 1 && (
          <div className="mt-5 space-y-3">
            <div className="grid gap-3 md:grid-cols-1">
              <input value={draft.sessionName} onChange={(e) => setDraft((p) => ({ ...p, sessionName: e.target.value }))} placeholder="Имя сессии" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
            </div>
            <div className="rounded-2xl bg-white px-4 py-3 text-sm text-slate-500 ring-1 ring-slate-200">
              Имя аккаунта подтянется автоматически из Telegram после успешного входа.
            </div>
            <div className="grid gap-3 md:grid-cols-[1fr_220px]">
              <input value={draft.phone} onChange={(e) => setDraft((p) => ({ ...p, phone: e.target.value }))} placeholder="Номер телефона, например +79991234567" className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
              <select value={draft.status} onChange={(e) => setDraft((p) => ({ ...p, status: e.target.value }))} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400">
                <option>Активен</option>
                <option>Прогрев</option>
                <option>Лимит</option>
                <option>Заблокирован</option>
                <option>Требует вход</option>
                <option>Ошибка</option>
              </select>
            </div>
            <label className="inline-flex items-center gap-2 text-sm text-slate-600">
              <input type="checkbox" checked={needPassword} onChange={(e) => setNeedPassword(e.target.checked)} />
              На аккаунте включена двухфакторная аутентификация
            </label>
            <button disabled={project.accounts.length >= 3 || isBusy} onClick={sendCode} className={project.accounts.length >= 3 || isBusy ? "inline-flex items-center justify-center rounded-2xl bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed" : "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"}>{isBusy ? "Отправляем..." : "Отправить код"}</button>
            {project.accounts.length >= 3 && <p className="text-sm text-rose-600">Нельзя добавить больше 3 аккаунтов в этот проект.</p>}
          </div>
        )}

        {step === 2 && (
          <div className="mt-5 space-y-3">
            <input value={draft.code} onChange={(e) => setDraft((p) => ({ ...p, code: e.target.value }))} placeholder="Код из Telegram" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
            <div className="flex flex-wrap gap-3">
              <button disabled={isBusy} onClick={confirmCode} className={isBusy ? "inline-flex items-center justify-center rounded-2xl bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed" : "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"}>{isBusy ? "Проверяем..." : "Подтвердить код"}</button>
              <button onClick={() => setStep(1)} className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">Назад</button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-5 space-y-3">
            <input value={draft.password} onChange={(e) => setDraft((p) => ({ ...p, password: e.target.value }))} placeholder="Пароль двухфакторной аутентификации" className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-slate-400" />
            <div className="flex flex-wrap gap-3">
              <button disabled={isBusy} onClick={confirmPassword} className={isBusy ? "inline-flex items-center justify-center rounded-2xl bg-slate-300 px-5 py-3 text-sm font-semibold text-slate-500 cursor-not-allowed" : "inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800"}>{isBusy ? "Проверяем..." : "Подтвердить пароль"}</button>
              <button onClick={() => setStep(2)} className="inline-flex items-center justify-center rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-sm ring-1 ring-slate-200 hover:bg-slate-50">Назад</button>
            </div>
          </div>
        )}

        {resultText && <div className="mt-4 rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{resultText}</div>}
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="overflow-hidden rounded-2xl border border-slate-200">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
              <tr><th className="px-4 py-4">Сессия</th><th className="px-4 py-4">Название</th><th className="px-4 py-4">Статус</th><th className="px-4 py-4">Причина</th><th className="px-4 py-4">Последняя проверка</th><th className="px-4 py-4 text-right">Действие</th></tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {project.accounts.map((account) => (
                <tr key={account.name}>
                  <td className="px-4 py-4 font-semibold text-slate-950">{account.name}</td>
                  <td className="px-4 py-4 text-slate-600">{account.label}</td>
                  <td className="px-4 py-4 text-slate-600">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusClasses(account.status)}`}>
                      {account.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-slate-600">{account.reason || "—"}</td>
                  <td className="px-4 py-4 text-slate-600">{account.lastCheck || "—"}</td>
                  <td className="px-4 py-4 text-right">
                    <button className="mr-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200">Проверить</button>
                    <button onClick={() => onDeleteAccount(project.id, account.name)} className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100">Удалить</button>
                  </td>
                </tr>
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

function ChatListManager({ project, onDeleteChat }) {
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
          <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400"><tr><th className="px-4 py-4">#</th><th className="px-4 py-4">Чат</th><th className="px-4 py-4 text-right">Действие</th></tr></thead>
          <tbody className="divide-y divide-slate-200 bg-white">
            {filteredChats.map((chat, index) => (
              <tr key={`${chat}-${index}`}>
                <td className="px-4 py-4 font-semibold text-slate-500">{index + 1}</td>
                <td className="px-4 py-4 text-slate-700">{chat}</td>
                <td className="px-4 py-4 text-right">
                  <button
                    onClick={() => onDeleteChat(project.id, chat)}
                    className="rounded-xl bg-rose-50 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    Удалить
                  </button>
                </td>
              </tr>
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
  const [backendStatus, setBackendStatus] = useState("Загружаем состояние бота...");

  const activeProject = useMemo(() => projects.find((project) => project.id === activeProjectId) || projects[0], [projects, activeProjectId]);

  const allAccounts = useMemo(() => projects.flatMap((project) => project.accounts), [projects]);
  const totalChats = useMemo(() => projects.reduce((sum, project) => sum + project.chats.length, 0), [projects]);
  const activeAccounts = useMemo(() => allAccounts.filter((account) => account.status === "Активен").length, [allAccounts]);
  const accountsNeedingAttention = useMemo(() => allAccounts.filter((account) => ["Лимит", "Заблокирован", "Требует вход", "Ошибка"].includes(account.status)).length, [allAccounts]);

  const stats = useMemo(() => [
    { label: "Проектов", value: formatNumber(projects.length), delta: `${projects.length} шт.`, hint: "папки внутри одного бота", icon: "📁" },
    { label: "Аккаунтов всего", value: formatNumber(allAccounts.length), delta: `${activeAccounts} активных`, hint: "во всех проектах", icon: "👤" },
    { label: "Активных аккаунтов", value: formatNumber(activeAccounts), delta: `${accountsNeedingAttention} требуют внимания`, hint: "готовы к работе", icon: "🛡️" },
    { label: "Чатов всего", value: formatNumber(totalChats), delta: `${projects.length ? Math.round(totalChats / projects.length) : 0} в среднем`, hint: "во всех проектах", icon: "💬" },
  ], [projects, allAccounts.length, activeAccounts, accountsNeedingAttention, totalChats]);

  const accountGroups = useMemo(() => {
    const statuses = [
      { key: "Активен", label: "Активные", icon: "✅", hint: "можно использовать в рассылке" },
      { key: "Прогрев", label: "На прогреве", icon: "⏱️", hint: "ещё не в полном рабочем режиме" },
      { key: "Лимит", label: "Лимит", icon: "⚡", hint: "есть ограничения / flood" },
      { key: "Заблокирован", label: "Заблокированы", icon: "⛔", hint: "выпали из работы" },
      { key: "Требует вход", label: "Требуют вход", icon: "🔐", hint: "нужен новый вход" },
      { key: "Ошибка", label: "Ошибка", icon: "⚙️", hint: "неясная техническая проблема" },
    ];
    const total = Math.max(allAccounts.length, 1);
    return statuses.map((status) => {
      const value = allAccounts.filter((account) => account.status === status.key).length;
      return { ...status, value, percent: Math.round((value / total) * 100) };
    }).filter((item) => item.value > 0);
  }, [allAccounts]);

  const projectStatusItems = useMemo(() => {
    const counts = { active: 0, warmup: 0, setup: 0, problem: 0 };
    projects.forEach((project) => {
      const statuses = project.accounts.map((account) => account.status);
      const hasActive = statuses.includes("Активен");
      const hasOnlyWarmup = statuses.length > 0 && statuses.every((status) => status === "Прогрев");
      const allProblem = statuses.length > 0 && statuses.every((status) => ["Лимит", "Заблокирован", "Требует вход", "Ошибка"].includes(status));
      if (!project.chats.length || !project.accounts.length) counts.setup += 1;
      else if (allProblem) counts.problem += 1;
      else if (hasActive && project.chats.length > 0) counts.active += 1;
      else if (hasOnlyWarmup) counts.warmup += 1;
      else counts.problem += 1;
    });
    return [
      { name: "Активные проекты", value: counts.active, hint: "есть активный аккаунт и чаты" },
      { name: "На прогреве", value: counts.warmup, hint: "аккаунты ещё не выведены в работу" },
      { name: "Не настроены", value: counts.setup, hint: "не хватает аккаунтов или чатов" },
      { name: "Проблемные", value: counts.problem, hint: "нужна ручная проверка" },
    ];
  }, [projects]);

  const projectSummaryItems = useMemo(() => [
    { name: "Чатов всего", value: totalChats, hint: "суммарно по всем проектам" },
    { name: "Чатов в среднем на проект", value: projects.length ? Math.round(totalChats / projects.length) : 0, hint: "средняя нагрузка на проект" },
    { name: "Аккаунтов всего", value: allAccounts.length, hint: "все статусы вместе" },
    { name: "Активных аккаунтов", value: activeAccounts, hint: "готовы к работе прямо сейчас" },
  ], [projects.length, totalChats, allAccounts.length, activeAccounts]);

  const activeProjectStats = useMemo(() => {
    if (!activeProject) return null;
    const projectAccounts = activeProject.accounts;
    const activeCount = projectAccounts.filter((account) => account.status === "Активен").length;
    const problemCount = projectAccounts.filter((account) => ["Лимит", "Заблокирован", "Требует вход", "Ошибка"].includes(account.status)).length;
    return {
      chats: activeProject.chats.length,
      accounts: projectAccounts.length,
      activeCount,
      problemCount,
      messagesCount: [activeProject.messages.first, activeProject.messages.second, activeProject.messages.third].filter(Boolean).length,
    };
  }, [activeProject]);

  const loadBackendState = async () => {
    try {
      const response = await fetch(`${API_BASE}/state`);
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Не удалось загрузить состояние бота");
      if (data?.project) {
        setProjects([
          createProject(data.project.id, data.project.name, data.project.chats || [], data.project.accounts || [], data.project.messages || { first: "", second: "", third: "" }),
        ]);
        setActiveProjectId(data.project.id);
        setBackendStatus(`Связка активна. Аккаунтов в учёте: ${(data.project.accounts || []).length}.`);
      }
    } catch (error) {
      setBackendStatus(`Backend недоступен: ${error.message}`);
    }
  };

  useEffect(() => {
    loadBackendState();
  }, []);

  const addProject = () => {
    return;
  };

  const updateProject = (projectId, updater) => {
    setProjects((prev) => prev.map((project) => (project.id === projectId ? updater(project) : project)));
  };

  const addAccount = (projectId, account) => updateProject(projectId, (project) => {
    if (project.accounts.length >= 3) return project;
    return { ...project, accounts: [account, ...project.accounts] };
  });
  const deleteAccount = (projectId, accountName) => updateProject(projectId, (project) => ({ ...project, accounts: project.accounts.filter((account) => account.name !== accountName) }));
  const updateMessages = (projectId, messages) => updateProject(projectId, (project) => ({ ...project, messages }));
  const addChat = (projectId, chat) => updateProject(projectId, (project) => ({ ...project, chats: [chat, ...project.chats] }));
  const deleteChat = (projectId, chatValue) => updateProject(projectId, (project) => ({ ...project, chats: project.chats.filter((chat) => chat !== chatValue) }));
  const deleteProject = (projectId) => {
    setProjects((prev) => {
      const next = prev.filter((project) => project.id !== projectId);
      if (!next.length) return prev;
      if (activeProjectId === projectId) {
        setActiveProjectId(next[0].id);
        setActiveSection("accounts");
      }
      return next;
    });
  };

  const renderSectionContent = () => {
    if (!activeProject) return null;
    if (activeSection === "accounts") return <AccountsManager project={activeProject} onAddAccount={addAccount} onDeleteAccount={deleteAccount} onReloadProject={loadBackendState} />;
    if (activeSection === "messages") return <MessagesManager project={activeProject} onUpdateMessages={updateMessages} />;
    if (activeSection === "add-chat") return <AddChatManager project={activeProject} onAddChat={addChat} />;
    return <ChatListManager project={activeProject} onDeleteChat={deleteChat} />;
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
              <p className="mt-2 max-w-2xl text-slate-500">Один бот, внутри которого сейчас оставляем одну рабочую папку. Состояние теперь можно подтягивать прямо из telegram-bot.</p>
            <p className="mt-2 text-sm font-medium text-slate-600">{backendStatus}</p>
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

          <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500"><span>📊</span><p className="text-sm font-semibold uppercase tracking-widest">Основа</p></div>
                  <h2 className="mt-2 text-2xl font-bold">Сводка по структуре бота</h2>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">Период: {period}</p>
              </div>
              <SummaryBars items={projectSummaryItems} />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Проекты</p>
                  <h2 className="mt-2 text-2xl font-bold">Статусы проектов</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">📁</div>
              </div>
              <SummaryBars items={projectStatusItems} />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">Аккаунты</p>
                  <h2 className="mt-2 text-2xl font-bold">Состояние аккаунтов</h2>
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
                          <p className="text-sm text-slate-500">{group.value} аккаунтов · {group.hint}</p>
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
                  <p className="mt-2 text-sm text-slate-500">Сейчас оставляем только одну рабочую папку — «Клининг». Когда одна папка работает, запуск другой блокируется.</p>
                </div>
                <div className="mt-5 rounded-2xl bg-amber-50 px-4 py-4 text-sm font-medium text-amber-800">
                  Пока в интерфейсе активна одна рабочая папка. Масштабирование на несколько проектов добавим позже.
                </div>
                <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {projects.map((project) => (
                    <div key={project.id} className="space-y-2">
                      <ProjectFolder project={project} isActive={activeProjectId === project.id} onClick={setActiveProjectId} />
                      <button
                        disabled
                        className="w-full rounded-2xl bg-slate-100 px-4 py-3 text-sm font-semibold text-slate-400 cursor-not-allowed"
                      >
                        Папка зафиксирована
                      </button>
                    </div>
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

                    {activeProjectStats && (
                      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
                        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Аккаунтов</div><div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(activeProjectStats.accounts)}</div></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Активных</div><div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(activeProjectStats.activeCount)}</div></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Проблемных</div><div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(activeProjectStats.problemCount)}</div></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Чатов</div><div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(activeProjectStats.chats)}</div></div>
                        <div className="rounded-2xl bg-slate-50 p-4"><div className="text-sm text-slate-500">Сообщений</div><div className="mt-2 text-2xl font-bold text-slate-950">{formatNumber(activeProjectStats.messagesCount)}</div></div>
                      </div>
                    )}

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
