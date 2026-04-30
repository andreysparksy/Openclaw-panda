import React, { useMemo, useState } from "react";

const platforms = ["Telegram", "Threads", "Instagram"];
const dayNames = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота", "Воскресенье"];

const seedIdeas = [
  ["Как я превращаю хаос идей в контент-систему", "Показать закулисье: от заметки до публикации", ["Telegram", "Threads"]],
  ["Почему бизнесу нужен не контент-план, а контент-машина", "Объяснить пользу автоматизации для лидогенерации", ["Telegram", "Instagram"]],
  ["3 ошибки при делегировании контента ИИ", "Практичный пост с примерами плохих и хороших промптов", ["Threads", "Instagram"]],
  ["Моя неделя контента за 20 минут", "Демонстрация процесса: план, драфты, визуалы, публикация", ["Telegram", "Threads", "Instagram"]],
  ["Как заставить ИИ писать в вашем стиле", "Разобрать память, примеры постов и тональность", ["Telegram", "Threads"]],
  ["Контент-воронка через кодовое слово", "Как посты ведут людей в Telegram и прогревают аудиторию", ["Instagram", "Telegram"]],
  ["Что я автоматизирую следующим: Reels и новые площадки", "Показать roadmap и собрать обратную связь", ["Threads", "Telegram"]],
];

function formatDate(date) {
  return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "long" });
}

function getWeek(start) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

function Button({ children, onClick, active, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={
        "rounded-xl px-4 py-2 text-sm font-medium transition " +
        (active ? "bg-slate-900 text-white " : "border border-slate-300 bg-white text-slate-900 hover:bg-slate-50 ") +
        (disabled ? "opacity-50" : "")
      }
    >
      {children}
    </button>
  );
}

function makeDraft(item) {
  return {
    telegram: `🔥 ${item.idea}

Сегодня разбираю: ${item.angle.toLowerCase()}.

Главная мысль: контент перестает быть ручной рутиной, когда у него есть система.

Формула: память → план → драфт → визуал → публикация → воронка.

Напишите «ВИКИ», если хотите такую же механику под свой бизнес.`,
    threads: [
      `1/3 ${item.idea}. Большинство думает, что проблема в нехватке идей. На самом деле проблема в отсутствии процесса.`,
      "2/3 Когда ИИ знает ваши проекты, стиль и цели, он собирает контент под задачу, а не просто пишет текст.",
      "3/3 Правильная система экономит часы: план, драфты, визуалы и публикация собираются в одном месте.",
    ],
    instagramCaption: `${item.idea}

Сохраняйте карусель. Кодовое слово: ВИКИ.`,
    bannerReady: false,
    carousel: Array.from({ length: 6 }, (_, i) => ({
      title:
        i === 0
          ? item.idea
          : ["Память о проектах", "Идеи на каждый день", "Драфты под площадки", "Баннеры и карусели", "Публикация и воронка"][i - 1],
      ready: false,
      prompt: `Слайд ${i + 1}: карусель Instagram на тему «${item.idea}», чистый экспертный стиль`,
    })),
  };
}

export default function App() {
  const [weekStart, setWeekStart] = useState(() => {
    const now = new Date();
    const day = now.getDay() || 7;
    const monday = new Date(now);
    monday.setDate(now.getDate() - day + 1);
    return monday;
  });
  const [items, setItems] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [activity, setActivity] = useState("Готова к работе");
  const [working, setWorking] = useState(false);

  const week = useMemo(() => getWeek(weekStart), [weekStart]);
  const selected = items.find((x) => x.id === selectedId) || items[0];

  function patchSelected(patch) {
    if (!selected) return;
    setItems((prev) => prev.map((x) => (x.id === selected.id ? { ...x, ...patch } : x)));
  }

  function shiftWeek(delta) {
    const next = new Date(weekStart);
    next.setDate(next.getDate() + delta * 7);
    setWeekStart(next);
    setSelectedId(null);
    setItems([]);
  }

  function generatePlan() {
    setWorking(true);
    setActivity("Вики анализирует память, проекты и прошлый контент…");
    setTimeout(() => {
      const next = week.map((date, i) => ({
        id: `${date.getTime()}-${i}`,
        date,
        dayName: dayNames[i],
        idea: seedIdeas[i][0],
        angle: seedIdeas[i][1],
        platforms: seedIdeas[i][2],
        status: "Идея",
        draft: null,
        published: {},
      }));
      setItems(next);
      setSelectedId(next[0].id);
      setWorking(false);
      setActivity("План на неделю готов");
    }, 700);
  }

  function createDraft() {
    if (!selected) return;
    setActivity("Генерирую тексты, промпты и структуру карусели…");
    patchSelected({ status: "Генерация" });
    setTimeout(() => {
      patchSelected({ status: "Драфт готов", draft: makeDraft(selected) });
      setActivity("Черновики готовы");
    }, 700);
  }

  function togglePlatform(p) {
    if (!selected) return;
    const platformsNext = selected.platforms.includes(p)
      ? selected.platforms.filter((x) => x !== p)
      : [...selected.platforms, p];
    patchSelected({ platforms: platformsNext });
  }

  function rewriteTelegram() {
    if (!selected || !selected.draft) return;
    const draft = { ...selected.draft };
    draft.telegram += "\n\nP.S. Это не магия, а нормально собранный процесс ✨";
    patchSelected({ draft });
    setActivity("Telegram-пост переписан в более личном стиле");
  }

  function generateBanner() {
    if (!selected || !selected.draft) return;
    const draft = { ...selected.draft, bannerReady: true };
    patchSelected({ draft });
    setActivity("Баннер готов");
  }

  function generateSlide(index) {
    if (!selected || !selected.draft) return;
    const draft = { ...selected.draft };
    draft.carousel = draft.carousel.map((slide, i) => (i === index ? { ...slide, ready: true } : slide));
    patchSelected({ draft });
    setActivity(`Слайд ${index + 1} готов`);
  }

  function publish(platform) {
    if (!selected) return;
    patchSelected({ published: { ...selected.published, [platform]: true } });
    setActivity(`${platform}: опубликовано`);
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6 text-slate-900">
      <div className="mx-auto max-w-7xl space-y-6">
        <header className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-6 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="mb-3 inline-flex rounded-full bg-slate-100 px-3 py-1 text-sm">✨ VIKI Content Studio</div>
            <h1 className="text-4xl font-bold tracking-tight">Контент-машина на неделю</h1>
            <p className="mt-3 max-w-2xl text-slate-600">
              Прототип приложения из вебинара: планирование идей, драфты, визуалы и публикация в Telegram, Threads и Instagram.
            </p>
          </div>
          <div className="rounded-2xl bg-slate-100 p-4 text-sm">
            <div className="font-semibold">Статус агента</div>
            <div className="mt-1 text-slate-600">{working ? "⏳ " : "✅ "}{activity}</div>
          </div>
        </header>

        <section className="flex flex-col justify-between gap-4 rounded-3xl bg-white p-5 shadow-sm md:flex-row md:items-center">
          <div>
            <div className="text-sm text-slate-500">Неделя контента</div>
            <div className="text-lg font-semibold">{formatDate(week[0])} — {formatDate(week[6])}</div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => shiftWeek(-1)}>← Прошлая</Button>
            <Button onClick={() => shiftWeek(1)}>Следующая →</Button>
            <Button active onClick={generatePlan} disabled={working}>✨ Предложить план к Вики</Button>
          </div>
        </section>

        <main className="grid gap-6 lg:grid-cols-[0.9fr_1.5fr]">
          <aside className="space-y-3">
            {items.length === 0 && (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
                Нажмите «Предложить план к Вики».
              </div>
            )}
            {items.map((item) => (
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
                <div className="mt-3 flex flex-wrap gap-2">
                  {item.platforms.map((p) => <span key={p} className="rounded-full bg-slate-200 px-2 py-1 text-xs">{p}</span>)}
                </div>
              </button>
            ))}
          </aside>

          <section className="rounded-3xl bg-white p-6 shadow-sm">
            {!selected ? (
              <div className="py-20 text-center text-slate-500">Выберите день или создайте план.</div>
            ) : (
              <div className="space-y-6">
                <div className="flex flex-col justify-between gap-4 md:flex-row">
                  <div className="flex-1">
                    <div className="text-sm text-slate-500">{selected.dayName}, {formatDate(selected.date)}</div>
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
                  <div>
                    <Button active onClick={createDraft}>📝 Создать драфт</Button>
                  </div>
                </div>

                <div>
                  <div className="mb-2 font-semibold">Площадки</div>
                  <div className="flex flex-wrap gap-2">
                    {platforms.map((p) => <Button key={p} active={selected.platforms.includes(p)} onClick={() => togglePlatform(p)}>{selected.platforms.includes(p) ? "✓ " : "+ "}{p}</Button>)}
                  </div>
                </div>

                <div className="rounded-2xl bg-slate-100 p-4 text-sm text-slate-600">
                  Источники агента: память проекта, предыдущий контент-план, новости рынка, заметки эксперта.
                </div>

                {selected.draft && (
                  <div className="space-y-5">
                    {selected.platforms.includes("Telegram") && (
                      <div className="rounded-3xl border border-slate-200 p-4">
                        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                          <h2 className="text-xl font-bold">Telegram</h2>
                          <div className="flex flex-wrap gap-2">
                            <Button onClick={generateBanner}>🖼 Баннер</Button>
                            <Button onClick={rewriteTelegram}>🔁 Переписать</Button>
                            <Button active onClick={() => publish("Telegram")}>{selected.published.Telegram ? "✅ Опубликовано" : "🚀 Опубликовать"}</Button>
                          </div>
                        </div>
                        {selected.draft.bannerReady && <div className="mb-4 rounded-2xl bg-gradient-to-r from-slate-800 to-slate-500 p-8 text-center text-xl font-bold text-white">Баннер: {selected.idea}</div>}
                        <pre className="whitespace-pre-wrap rounded-2xl bg-slate-100 p-4 font-sans text-sm">{selected.draft.telegram}</pre>
                      </div>
                    )}

                    {selected.platforms.includes("Threads") && (
                      <div className="rounded-3xl border border-slate-200 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h2 className="text-xl font-bold">Threads</h2>
                          <Button active onClick={() => publish("Threads")}>{selected.published.Threads ? "✅ Опубликовано" : "🚀 Опубликовать ветку"}</Button>
                        </div>
                        <div className="space-y-2">
                          {selected.draft.threads.map((post, i) => <div key={i} className="rounded-2xl bg-slate-100 p-3 text-sm">{post}</div>)}
                        </div>
                      </div>
                    )}

                    {selected.platforms.includes("Instagram") && (
                      <div className="rounded-3xl border border-slate-200 p-4">
                        <div className="mb-3 flex items-center justify-between gap-2">
                          <h2 className="text-xl font-bold">Instagram-карусель</h2>
                          <Button active onClick={() => publish("Instagram")}>{selected.published.Instagram ? "✅ Опубликовано" : "🚀 Опубликовать"}</Button>
                        </div>
                        <div className="mb-4 rounded-2xl bg-slate-100 p-3 text-sm">{selected.draft.instagramCaption}</div>
                        <div className="grid gap-3 md:grid-cols-2">
                          {selected.draft.carousel.map((slide, i) => (
                            <div key={i} className="rounded-2xl border border-slate-200 p-3">
                              <div className="mb-2 flex items-center justify-between gap-2">
                                <div className="font-semibold">Слайд {i + 1}</div>
                                <Button onClick={() => generateSlide(i)}>{slide.ready ? "✅ Готов" : "Сгенерировать"}</Button>
                              </div>
                              <div className={`mb-3 flex h-32 items-center justify-center rounded-xl p-4 text-center text-sm ${slide.ready ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-500"}`}>
                                {slide.ready ? slide.title : "Изображение пока не создано"}
                              </div>
                              <div className="text-xs text-slate-500">{slide.prompt}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <div className="rounded-2xl border border-dashed border-slate-300 p-4 text-sm text-slate-600">
                  🔌 Production-подключения: LLM API, генератор изображений, база памяти, Telegram Bot API, Meta/Instagram API, Threads API и хранилище файлов.
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  );
}
