import React, { useMemo, useState } from "react";

const months = [
  "Январь", "Февраль", "Март", "Апрель", "Май", "Июнь",
  "Июль", "Август", "Сентябрь", "Октябрь", "Ноябрь", "Декабрь",
];

const initialIncome = [35000, 73800, 94000, 22850, 0, 0, 0, 0, 0, 0, 0, 0];

const initialProjects = [
  {
    id: 1,
    name: "Основной бизнес",
    yearly: "Выйти на стабильный доход 300 000 ₽/мес",
    quarterly: "Запустить 2 новых оффера",
    monthly: "Довести выручку до 120 000 ₽",
    weekly: "Закрыть 5 ключевых задач",
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

function GoalInput({ label, value, onChange }) {
  return (
    <label className="block rounded-2xl border bg-white p-4 shadow-sm">
      <span className="mb-2 block text-sm font-medium text-slate-500">🎯 {label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-20 w-full resize-none rounded-xl border bg-slate-50 p-3 text-sm outline-none transition focus:border-blue-400 focus:bg-white"
      />
    </label>
  );
}

export default function LifeAnalyticsDashboard() {
  const [tab, setTab] = useState("projects");
  const [income, setIncome] = useState(initialIncome);
  const [projects, setProjects] = useState(initialProjects);
  const [newTasks, setNewTasks] = useState({});

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

  function addProject() {
    const id = Date.now();
    const project = {
      id,
      name: `Проект ${projects.length + 1}`,
      yearly: "",
      quarterly: "",
      monthly: "",
      weekly: "",
      tasks: [],
    };
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

  return (
    <div className="min-h-screen bg-slate-100 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-[0.25em] text-slate-500">Life Analytics</p>
            <h1 className="text-3xl font-bold tracking-tight">Аналитика жизни</h1>
          </div>
          <Button onClick={addProject}>＋ Добавить проект</Button>
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
                      <GoalInput label="Цель на год" value={project.yearly} onChange={(value) => updateProject(project.id, { yearly: value })} />
                      <GoalInput label="Цель на квартал" value={project.quarterly} onChange={(value) => updateProject(project.id, { quarterly: value })} />
                      <GoalInput label="Цель на месяц" value={project.monthly} onChange={(value) => updateProject(project.id, { monthly: value })} />
                      <GoalInput label="Цель на неделю" value={project.weekly} onChange={(value) => updateProject(project.id, { weekly: value })} />
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
          </main>
        </div>
      </div>
    </div>
  );
}
