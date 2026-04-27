import React, { useMemo, useState } from "react";

const stats = [
  {
    label: "Сообщений отправлено",
    value: "128 430",
    delta: "+12.8%",
    hint: "за последние 7 дней",
    icon: "✉️",
  },
  {
    label: "Живых аккаунтов",
    value: "248",
    delta: "+18",
    hint: "активны и доступны",
    icon: "🛡️",
  },
  {
    label: "Чатов в работе",
    value: "1 842",
    delta: "+6.4%",
    hint: "получают рассылку",
    icon: "💬",
  },
  {
    label: "Успешность доставки",
    value: "97.3%",
    delta: "+1.1%",
    hint: "без ошибок отправки",
    icon: "✅",
  },
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

const chatsByStatus = [
  { name: "Активные", value: 1842 },
  { name: "На паузе", value: 126 },
  { name: "С ошибками", value: 38 },
  { name: "Новые", value: 214 },
];

const accountGroups = [
  { label: "Живые", value: 248, percent: 82, icon: "✅" },
  { label: "Прогрев", value: 31, percent: 10, icon: "⏱️" },
  { label: "Лимиты", value: 18, percent: 6, icon: "⚡" },
  { label: "Отвалились", value: 7, percent: 2, icon: "⛔" },
];

const campaigns = [
  {
    name: "Основная рассылка / RU",
    status: "В работе",
    sent: "42 380",
    chats: "612",
    accounts: "74",
    errorRate: "1.8%",
  },
  {
    name: "Тест новых офферов",
    status: "Пауза",
    sent: "8 940",
    chats: "138",
    accounts: "22",
    errorRate: "3.1%",
  },
  {
    name: "Повторная каскадная",
    status: "В работе",
    sent: "31 120",
    chats: "487",
    accounts: "61",
    errorRate: "2.4%",
  },
  {
    name: "Холодные чаты / сегмент B",
    status: "В работе",
    sent: "17 620",
    chats: "296",
    accounts: "43",
    errorRate: "2.0%",
  },
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

  const areaPath = `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${
    height - padding.bottom
  } L ${points[0][0].toFixed(2)} ${height - padding.bottom} Z`;

  return { points, linePath, areaPath, max, min };
}

function StatCard({ item }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
          {item.icon}
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-sm font-semibold text-emerald-700">
          {item.delta}
        </span>
      </div>
      <div className="mt-5">
        <p className="text-sm text-slate-500">{item.label}</p>
        <p className="mt-2 text-3xl font-bold tracking-tight text-slate-950">{item.value}</p>
        <p className="mt-1 text-sm text-slate-400">{item.hint}</p>
      </div>
    </div>
  );
}

function StatusPill({ status }) {
  const isActive = status === "В работе";

  return (
    <span
      className={
        isActive
          ? "rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700"
          : "rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700"
      }
    >
      {status}
    </span>
  );
}

function DeliveryChart() {
  const width = 720;
  const height = 300;
  const padding = { top: 24, right: 24, bottom: 42, left: 54 };
  const messages = buildAreaPath(deliveryData, "messages", width, height, padding);
  const delivered = buildAreaPath(deliveryData, "delivered", width, height, padding);
  const gridLines = [0, 1, 2, 3, 4];

  return (
    <div className="mt-6 overflow-hidden rounded-3xl bg-slate-50 p-3">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-80 w-full">
        <defs>
          <linearGradient id="areaFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#0f172a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#0f172a" stopOpacity="0.02" />
          </linearGradient>
        </defs>

        {gridLines.map((line) => {
          const y = padding.top + (line / 4) * (height - padding.top - padding.bottom);
          return (
            <line
              key={line}
              x1={padding.left}
              x2={width - padding.right}
              y1={y}
              y2={y}
              stroke="#e2e8f0"
              strokeDasharray="5 7"
            />
          );
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

      <div className="flex flex-wrap gap-3 px-3 pb-2 text-sm text-slate-500">
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-950" /> Отправлено
        </span>
        <span className="inline-flex items-center gap-2">
          <span className="h-3 w-3 rounded-full bg-slate-500" /> Доставлено
        </span>
      </div>
    </div>
  );
}

function ChatsChart() {
  const max = Math.max(...chatsByStatus.map((item) => item.value));

  return (
    <div className="mt-6 space-y-4">
      {chatsByStatus.map((item) => {
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

export default function BotAnalyticsDashboard() {
  const [period, setPeriod] = useState("7 дней");
  const [query, setQuery] = useState("");

  const filteredCampaigns = useMemo(() => {
    return campaigns.filter((campaign) =>
      campaign.name.toLowerCase().includes(query.toLowerCase())
    );
  }, [query]);

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-slate-950 text-3xl text-white shadow-sm">
              🤖
            </div>
            <div>
              <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                Bot analytics
              </p>
              <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                Аналитика рассылочного бота
              </h1>
              <p className="mt-2 max-w-2xl text-slate-500">
                Контроль отправок, живых аккаунтов, рабочих чатов и ошибок доставки в одном интерфейсе.
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <select
              value={period}
              onChange={(event) => setPeriod(event.target.value)}
              className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none transition focus:border-slate-400"
            >
              <option>24 часа</option>
              <option>7 дней</option>
              <option>30 дней</option>
              <option>90 дней</option>
            </select>
            <button className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800">
              ↻ Обновить
            </button>
          </div>
        </header>

        <main className="mt-6 space-y-6">
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {stats.map((item) => (
              <StatCard key={item.label} item={item} />
            ))}
          </section>

          <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span>📈</span>
                    <p className="text-sm font-semibold uppercase tracking-widest">Динамика</p>
                  </div>
                  <h2 className="mt-2 text-2xl font-bold">Отправки и доставки</h2>
                </div>
                <p className="rounded-full bg-slate-100 px-4 py-2 text-sm font-semibold text-slate-600">
                  Период: {period}
                </p>
              </div>

              <DeliveryChart />
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                    Чаты
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Статусы чатов</h2>
                </div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-2xl">
                  💬
                </div>
              </div>

              <ChatsChart />
            </div>
          </section>

          <section className="grid gap-6 xl:grid-cols-[1fr_1.4fr]">
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                    Аккаунты
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Состояние базы</h2>
                </div>
                <span className="text-3xl">👥</span>
              </div>

              <div className="mt-6 space-y-4">
                {accountGroups.map((group) => (
                  <div key={group.label} className="rounded-2xl bg-slate-50 p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm">
                          {group.icon}
                        </div>
                        <div>
                          <p className="font-semibold">{group.label}</p>
                          <p className="text-sm text-slate-500">{group.value} аккаунтов</p>
                        </div>
                      </div>
                      <p className="text-sm font-bold text-slate-700">{group.percent}%</p>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                      <div
                        className="h-full rounded-full bg-slate-950"
                        style={{ width: `${group.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-widest text-slate-400">
                    Рассылки
                  </p>
                  <h2 className="mt-2 text-2xl font-bold">Кампании в работе</h2>
                </div>
                <label className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3">
                  <span className="text-slate-400">⌕</span>
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Найти кампанию"
                    className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
                  />
                </label>
              </div>

              <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-slate-50 text-xs uppercase tracking-widest text-slate-400">
                      <tr>
                        <th className="px-4 py-4">Кампания</th>
                        <th className="px-4 py-4">Статус</th>
                        <th className="px-4 py-4">Отправлено</th>
                        <th className="px-4 py-4">Чаты</th>
                        <th className="px-4 py-4">Аккаунты</th>
                        <th className="px-4 py-4">Ошибки</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white">
                      {filteredCampaigns.map((campaign) => (
                        <tr key={campaign.name} className="transition hover:bg-slate-50">
                          <td className="px-4 py-4 font-semibold text-slate-950">{campaign.name}</td>
                          <td className="px-4 py-4">
                            <StatusPill status={campaign.status} />
                          </td>
                          <td className="px-4 py-4 text-slate-600">{campaign.sent}</td>
                          <td className="px-4 py-4 text-slate-600">{campaign.chats}</td>
                          <td className="px-4 py-4 text-slate-600">{campaign.accounts}</td>
                          <td className="px-4 py-4 text-slate-600">{campaign.errorRate}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
