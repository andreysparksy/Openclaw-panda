import React, { useEffect, useMemo, useState } from "react";

const months = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const SHEET_API_URL = "https://script.google.com/macros/s/AKfycbxV_tBeOiwFCKFSP72HIeMGOnseVucFiWIP5LsX9ZV0PFk5ejHHZPCt7hKjtYEplaSVEQ/exec";

const initialIncome = [35000, 73800, 94000, 22850, 0, 0, 0, 0, 0, 0, 0, 0];

const initialWishes = [
  { id: 1, text: "Поездка на море", done: false },
  { id: 2, text: "Новый ноутбук", done: false },
];

const initialProjects = [
  {
    id: 1,
    name: "Основной бизнес",
    yearly: "Выйти на стабильный доход 300 000 ₽/мес",
    yearlyPeriod: "2026",
    quarterly: "Запустить 2 новых оффера",
    quarterlyPeriod: "2 квартал",
    monthly: "Довести выручку до 120 000 ₽",
    monthlyPeriod: "Май",
    weekly: "Закрыть 5 ключевых задач",
    weeklyPeriod: "до 10.05",
    tasks: [
      { id: 1, title: "Обновить лендинг", done: true },
      { id: 2, title: "Созвониться с 3 клиентами", done: false },
      { id: 3, title: "Посчитать рекламу", done: false },
    ],
  },
];

function formatMoney(value) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 0,
  }).format(value || 0);
}

function Button({ children, className = "", disabled = false, ...props }) {
  return (
    <button
      disabled={disabled}
      className={
        "rounded-2xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-300 " +
        className
      }
      {...props}
    >
      {children}
    </button>
  );
}

function Card({ children }) {
  return <div className="rounded-2xl bg-white p-6 shadow-sm">{children}</div>;
}

function Icon({ children }) {
  return <span className="inline-flex h-5 w-5 items-center justify-center text-base">{children}</span>;
}

function MiniLineChart({ values }) {
  const max = Math.max(...values, 100000);
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * 100;
      const y = 100 - (value / max) * 90;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <div className="h-full rounded-2xl border bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-700">Динамика дохода 2026</h3>
          <p className="text-sm text-slate-500">Доход по месяцам</p>
        </div>
        <Icon>📈</Icon>
      </div>

      <svg viewBox="0 0 100 110" className="h-56 w-full overflow-visible">
        {[0, 25, 50, 75, 100].map((y) => (
          <line key={y} x1="0" x2="100" y1={y} y2={y} stroke="#e2e8f0" strokeWidth="0.4" />
        ))}
        <polyline points={points} fill="none" stroke="#3b82f6" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        {values.map((value, index) => {
          const x = (index / (values.length - 1)) * 100;
          const y = 100 - (value / max) * 90;
          return <circle key={index} cx={x} cy={y} r="1.2" fill="#3b82f6" />;
        })}
      </svg>

      <div className="grid grid-cols-12 gap-1 text-[10px] text-slate-500">
        {months.map((month) => (
          <span key={month} className="truncate">{month.slice(0, 3)}</span>
        ))}
      </div>
    </div>
  );
}

function GoalInput({ label, period, value, onChange }) {
  return (
    <label className="block rounded-2xl border bg-white p-4 shadow-sm">
      <span className="mb-2 block text-sm font-medium text-slate-500">🎯 {label}</span>
      <div className="mb-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-medium text-slate-600">{period}</div>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 w-full resize-none rounded-xl border bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
      />
    </label>
  );
}

const STORAGE_KEY = "myhome-dashboard-v1";
const ALLOWED_LOGINS = ["andrey", "Volhova"];

function getStorageKey(login) {
  return `${STORAGE_KEY}-${login || "guest"}`;
}

function loadSavedState(login) {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(getStorageKey(login));
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function getCurrentQuarter(monthIndex) {
  return Math.floor(monthIndex / 3) + 1;
}

function getCurrentPeriods() {
  const now = new Date();
  const weekEnd = new Date(now);
  weekEnd.setDate(now.getDate() + (7 - now.getDay() || 7));
  return {
    yearlyPeriod: String(now.getFullYear()),
    quarterlyPeriod: `${getCurrentQuarter(now.getMonth())} квартал`,
    monthlyPeriod: months[now.getMonth()],
    weeklyPeriod: `до ${String(weekEnd.getDate()).padStart(2, "0")}.${String(weekEnd.getMonth() + 1).padStart(2, "0")}`,
  };
}

function withCurrentPeriods(project) {
  const periods = getCurrentPeriods();
  return {
    ...project,
    yearlyPeriod: periods.yearlyPeriod,
    quarterlyPeriod: periods.quarterlyPeriod,
    monthlyPeriod: periods.monthlyPeriod,
    weeklyPeriod: periods.weeklyPeriod,
  };
}

function clearExpiredGoals(project) {
  const periods = getCurrentPeriods();
  return {
    ...withCurrentPeriods(project),
    yearly: project.yearlyPeriod === periods.yearlyPeriod ? project.yearly : "",
    quarterly: project.quarterlyPeriod === periods.quarterlyPeriod ? project.quarterly : "",
    monthly: project.monthlyPeriod === periods.monthlyPeriod ? project.monthly : "",
    weekly: project.weeklyPeriod === periods.weeklyPeriod ? project.weekly : "",
  };
}

export default function LifeAnalyticsDashboard() {
  const [loginInput, setLoginInput] = useState("");
  const [activeLogin, setActiveLogin] = useState(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem("myhome-active-login") || "";
  });
  const saved = loadSavedState(activeLogin);
  const [tab, setTab] = useState(saved?.tab || "projects");
  const [income, setIncome] = useState(saved?.income || initialIncome);
  const [projects, setProjects] = useState((saved?.projects || initialProjects).map(clearExpiredGoals));
  const [newTasks, setNewTasks] = useState(saved?.newTasks || {});
  const [sheetStatus, setSheetStatus] = useState("Финансы пока берутся локально");
  const [wishes, setWishes] = useState(saved?.wishes || initialWishes);
  const [newWish, setNewWish] = useState(saved?.newWish || "");

  useEffect(() => {
    if (!activeLogin || typeof window === "undefined") return;
    window.localStorage.setItem("myhome-active-login", activeLogin);
    const nextSaved = loadSavedState(activeLogin);
    setTab(nextSaved?.tab || "projects");
    setIncome(nextSaved?.income || initialIncome);
    setProjects((nextSaved?.projects || initialProjects).map(clearExpiredGoals));
    setNewTasks(nextSaved?.newTasks || {});
    setWishes(nextSaved?.wishes || initialWishes);
    setNewWish(nextSaved?.newWish || "");
  }, [activeLogin]);

  useEffect(() => {
    if (typeof window === "undefined" || !activeLogin) return;
    window.localStorage.setItem(
      getStorageKey(activeLogin),
      JSON.stringify({ tab, income, projects, newTasks, wishes, newWish })
    );
  }, [activeLogin, tab, income, projects, newTasks, wishes, newWish]);

  useEffect(() => {
    if (!activeLogin) return;
    let cancelled = false;
    fetch(SHEET_API_URL)
      .then((res) => res.json())
      .then((data) => {
        if (cancelled || !Array.isArray(data)) return;
        const nextIncome = months.map((month) => {
          const row = data.find((item) => String(item.month || "").trim().toLowerCase().startsWith(month.toLowerCase().slice(0, 3)));
          return row ? Number(row.income) || 0 : 0;
        });
        setIncome(nextIncome);
        setSheetStatus("Финансы синхронизированы из Google Sheets");
      })
      .catch(() => {
        if (!cancelled) setSheetStatus("Не удалось загрузить данные из Google Sheets");
      });
    return () => {
      cancelled = true;
    };
  }, [activeLogin]);

  const currentMonthIndex = 4;
  const previousIncome = income[Math.max(0, currentMonthIndex - 1)] || 0;

  const completedTasks = useMemo(() => {
    return projects.reduce((sum, project) => sum + project.tasks.filter((task) => task.done).length, 0);
  }, [projects]);

  const totalTasks = useMemo(() => {
    return projects.reduce((sum, project) => sum + project.tasks.length, 0);
  }, [projects]);

  function updateProject(projectId, patch) {
    setProjects((items) =>
      items.map((project) => (project.id === projectId ? { ...project, ...patch } : project))
    );
  }

  function addWish() {
    const text = newWish.trim();
    if (!text) return;
    setWishes((items) => [...items, { id: Date.now(), text, done: false }]);
    setNewWish("");
  }

  function toggleWish(wishId) {
    setWishes((items) => items.map((wish) => (wish.id === wishId ? { ...wish, done: !wish.done } : wish)));
  }

  function deleteWish(wishId) {
    setWishes((items) => items.filter((wish) => wish.id !== wishId));
  }

  function handleLogin() {
    const candidate = loginInput.trim();
    if (!ALLOWED_LOGINS.includes(candidate)) return;
    setActiveLogin(candidate);
  }

  function logout() {
    setActiveLogin("");
    setLoginInput("");
  }

  function addProject() {
    const id = Date.now();
    const project = withCurrentPeriods({
      id,
      name: `Проект ${projects.length + 1}`,
      yearly: "",
      quarterly: "",
      monthly: "",
      weekly: "",
      tasks: [],
    });
    setProjects((items) => [...items, project]);
    setTab("projects");
  }

  function addTask(projectId) {
    const project = projects.find((item) => item.id === projectId);
    const title = (newTasks[projectId] || "").trim();
    if (!project || !title || project.tasks.length >= 7) return;

    updateProject(projectId, {
      tasks: [...project.tasks, { id: Date.now(), title, done: false }],
    });
    setNewTasks((items) => ({ ...items, [projectId]: "" }));
  }

  function toggleTask(projectId, taskId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    updateProject(projectId, {
      tasks: project.tasks.map((task) =>
        task.id === taskId ? { ...task, done: !task.done } : task
      ),
    });
  }

  function deleteTask(projectId, taskId) {
    const project = projects.find((item) => item.id === projectId);
    if (!project) return;

    updateProject(projectId, { tasks: project.tasks.filter((task) => task.id !== taskId) });
  }

  if (!activeLogin) {
    return (
      <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
        <div className="mx-auto flex min-h-[80vh] max-w-xl items-center justify-center">
          <div className="w-full rounded-3xl bg-white p-8 shadow-sm">
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">🔐 Myhome</div>
            <h1 className="text-3xl font-bold tracking-tight">Вход по логину</h1>
            <p className="mt-3 text-sm text-slate-500">Доступные логины: andrey и Volhova</p>
            <div className="mt-5 flex gap-2">
              <input
                value={loginInput}
                onChange={(event) => setLoginInput(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") handleLogin();
                }}
                placeholder="Введите логин"
                className="flex-1 rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400"
              />
              <Button onClick={handleLogin} disabled={!ALLOWED_LOGINS.includes(loginInput.trim())}>Войти</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Life Analytics</p>
            <h1 className="text-3xl font-bold tracking-tight">Аналитика жизни</h1>
            <p className="mt-2 text-sm text-slate-500">Профиль: {activeLogin}</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={addProject}>＋ Добавить проект</Button>
            <Button className="bg-slate-200 text-slate-900 hover:bg-slate-300" onClick={logout}>Сменить логин</Button>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-3">
          <Card>
            <p className="text-sm text-slate-500">Заработано в предыдущем месяце</p>
            <p className="mt-3 text-4xl font-bold">{formatMoney(previousIncome)}</p>
            <p className="mt-2 text-sm text-slate-500">Апрель 2026</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Проекты</p>
            <p className="mt-3 text-4xl font-bold">{projects.length}</p>
            <p className="mt-2 text-sm text-slate-500">Всего проектов в списке</p>
          </Card>
          <Card>
            <p className="text-sm text-slate-500">Задачи</p>
            <p className="mt-3 text-4xl font-bold">{completedTasks}/{totalTasks}</p>
            <p className="mt-2 text-sm text-slate-500">Выполнено из всех задач</p>
          </Card>
        </section>

        <div className="rounded-3xl bg-white p-2 shadow-sm">
          <div className="flex flex-wrap gap-2 border-b pb-2">
            <button
              onClick={() => setTab("projects")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${tab === "projects" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Проекты
            </button>
            <button
              onClick={() => setTab("finance")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${tab === "finance" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Личные финансы
            </button>
            <button
              onClick={() => setTab("wishes")}
              className={`rounded-2xl px-4 py-2 text-sm font-medium ${tab === "wishes" ? "bg-slate-900 text-white" : "text-slate-600 hover:bg-slate-100"}`}
            >
              Желания
            </button>
          </div>

          <main className="p-4">
            {tab === "projects" && (
              <div className="space-y-5">
                {projects.map((project, index) => (
                  <section key={project.id} className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
                    <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-900 font-bold text-white">
                          {index + 1}
                        </div>
                        <input
                          value={project.name}
                          onChange={(event) => updateProject(project.id, { name: event.target.value })}
                          className="w-full rounded-2xl border bg-white p-3 text-xl font-semibold outline-none focus:border-blue-400 md:w-96"
                        />
                      </div>
                      <p className="rounded-2xl bg-white px-4 py-2 text-sm text-slate-500">
                        Задачи: {project.tasks.length}/7
                      </p>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                      <GoalInput label="Год" period={project.yearlyPeriod} value={project.yearly} onChange={(value) => updateProject(project.id, { yearly: value })} />
                      <GoalInput label="Квартал" period={project.quarterlyPeriod} value={project.quarterly} onChange={(value) => updateProject(project.id, { quarterly: value })} />
                      <GoalInput label="Месяц" period={project.monthlyPeriod} value={project.monthly} onChange={(value) => updateProject(project.id, { monthly: value })} />
                      <GoalInput label="Неделя" period={project.weeklyPeriod} value={project.weekly} onChange={(value) => updateProject(project.id, { weekly: value })} />
                    </div>

                    <div className="mt-5 rounded-2xl border bg-white p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="font-semibold">Задачи на неделю</h3>
                        <span className="text-sm text-slate-500">Максимум 7</span>
                      </div>

                      <div className="flex gap-2">
                        <input
                          value={newTasks[project.id] || ""}
                          onChange={(event) => setNewTasks((items) => ({ ...items, [project.id]: event.target.value }))}
                          onKeyDown={(event) => {
                            if (event.key === "Enter") addTask(project.id);
                          }}
                          placeholder="Новая задача"
                          disabled={project.tasks.length >= 7}
                          className="flex-1 rounded-2xl border bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-400 disabled:bg-slate-100"
                        />
                        <Button onClick={() => addTask(project.id)} disabled={project.tasks.length >= 7}>Добавить</Button>
                      </div>

                      <div className="mt-4 grid gap-2 md:grid-cols-2">
                        {project.tasks.map((task) => (
                          <div key={task.id} className="flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                            <button onClick={() => toggleTask(project.id, task.id)} className="text-lg">
                              {task.done ? "✅" : "○"}
                            </button>
                            <span className={`flex-1 text-sm ${task.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                              {task.title}
                            </span>
                            <button onClick={() => deleteTask(project.id, task.id)} className="text-slate-400 hover:text-red-500">✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                ))}
              </div>
            )}

            {tab === "finance" && (
              <div className="grid gap-6 xl:grid-cols-[0.9fr_1.4fr]">
                <section className="rounded-2xl border bg-white shadow-sm">
                  <div className="flex items-center gap-2 border-b p-4">
                    <Icon>💰</Icon>
                    <h2 className="text-xl font-semibold">Личные финансы</h2>
                  </div>

                  <div className="px-4 pt-4 text-sm text-slate-500">{sheetStatus}</div>
                  <div className="overflow-x-auto p-4">
                    <table className="w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left">
                          <th className="border p-2">Месяц</th>
                          <th className="border p-2">Доход</th>
                        </tr>
                      </thead>
                      <tbody>
                        {months.map((month, index) => (
                          <tr key={month}>
                            <td className="border p-2 font-medium">{month}</td>
                            <td className="border p-1">
                              <input
                                type="number"
                                value={income[index]}
                                onChange={(event) => {
                                  const next = income.map((item, itemIndex) =>
                                    itemIndex === index ? Number(event.target.value) : item
                                  );
                                  setIncome(next);
                                }}
                                className="w-full rounded-lg bg-transparent p-1 text-right outline-none focus:bg-blue-50"
                              />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </section>

                <MiniLineChart values={income} />
              </div>
            )}

            {tab === "wishes" && (
              <div className="space-y-5">
                <section className="rounded-3xl border bg-slate-50 p-5 shadow-sm">
                  <div className="mb-4">
                    <h2 className="text-2xl font-bold">Желания</h2>
                    <p className="text-sm text-slate-500">Пиши сюда свои желания, хотелки и личные цели.</p>
                  </div>

                  <div className="flex gap-2">
                    <input
                      value={newWish}
                      onChange={(event) => setNewWish(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") addWish();
                      }}
                      placeholder="Напиши своё желание"
                      className="flex-1 rounded-2xl border bg-white px-4 py-3 text-sm outline-none focus:border-blue-400"
                    />
                    <Button onClick={addWish}>Добавить</Button>
                  </div>

                  <div className="mt-4 grid gap-2 md:grid-cols-2">
                    {wishes.map((wish) => (
                      <div key={wish.id} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
                        <button onClick={() => toggleWish(wish.id)} className="text-lg">
                          {wish.done ? "💙" : "○"}
                        </button>
                        <span className={`flex-1 text-sm ${wish.done ? "text-slate-400 line-through" : "text-slate-800"}`}>
                          {wish.text}
                        </span>
                        <button onClick={() => deleteWish(wish.id)} className="text-slate-400 hover:text-red-500">✕</button>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
