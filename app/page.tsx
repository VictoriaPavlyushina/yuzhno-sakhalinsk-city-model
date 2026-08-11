"use client";

import { useEffect, useMemo, useState } from "react";

type Project = {
  id: string;
  no: string;
  title: string;
  kind: string;
  problem: string;
  effect: string;
  capex: string;
  next: string;
};

const problems = [
  { id: "child-safety", value: "122,1 млн ₽", unit: "/ год", label: "потери от детского травматизма", tag: "РАСЧЁТ · 2024", target: "Безопасный город для детей" },
  { id: "child-safety", value: "255,2", unit: "на 1 000", label: "детский травматизм, 0–14 лет", tag: "ФАКТ · 2025", target: "Карта опасных мест" },
  { id: "green-ridge", value: "104 мм", unit: "/ сутки", label: "максимум осадков", tag: "ФАКТ · 2023", target: "Природная инфраструктура" },
  { id: "eco-framework", value: "+2,8 °C", unit: "за 10 лет", label: "изменение температуры", tag: "ФАКТ · 2016–2025", target: "Градоэкологический каркас" },
];

const projects: Project[] = [
  { id: "child-safety", no: "01", title: "Безопасный город для детей", kind: "ЗДОРОВЬЕ", problem: "Массовость детских травм и 122,1 млн ₽ ежегодных потерь", effect: "10–30% потенциально предотвращаемых потерь", capex: "требует расчёта", next: "Геокодировать случаи и определить пилотные зоны" },
  { id: "eco-framework", no: "02", title: "Градоэкологический каркас", kind: "СИСТЕМА", problem: "Разрозненные зелёные и водные решения", effect: "Связная инфраструктура климата, воды и качества жизни", capex: "требует расчёта", next: "Собрать пространственную схему и приоритеты" },
  { id: "small-rivers", no: "03", title: "16 рек — одна система", kind: "ВОДА", problem: "Фрагментация водотоков и набережных", effect: "Непрерывный водно-зелёный каркас", capex: "требует геопривязки", next: "Выбрать первую очередь водотоков" },
  { id: "eco-boulevards", no: "04", title: "Экобульвары и зелёные улицы", kind: "УЛИЦЫ", problem: "Быстрый поверхностный сток", effect: "Замедление и фильтрация воды по пути", capex: "требует расчёта", next: "Проверить профили улиц летом и зимой" },
  { id: "eco-renovation", no: "05", title: "Экореновация промтерриторий", kind: "РЕНОВАЦИЯ", problem: "Крупные водонепроницаемые площадки", effect: "Снижение стока и экологической нагрузки", capex: "требует изысканий", next: "Собрать водные паспорта площадок" },
  { id: "northern-valley", no: "06", title: "Северная долина", kind: "РАЗВИТИЕ", problem: "Рост нагрузки от новой застройки", effect: "Район, не увеличивающий пиковый сток", capex: "требует расчёта", next: "Закрепить три водных правила в мастер-плане" },
  { id: "green-ridge", no: "07", title: "Зелёный хребет", kind: "ФЛАГМАН", problem: "Экстремальные осадки и локальный быстрый сток", effect: "5 386 м³ инженерной ёмкости на дождь", capex: "281,6–698,8 млн ₽", next: "Изыскания → пилот → проверка эффекта → масштабирование" },
  { id: "digital-layer", no: "08", title: "Цифровой слой города", kind: "УПРАВЛЕНИЕ", problem: "Данные, проекты и решения живут отдельно", effect: "Единый паспорт территории и контроль KPI", capex: "требует расчёта", next: "Собрать MVP цифрового контура за 6 месяцев" },
];

const storyIds = ["hero", "signals", "portfolio", "green-ridge", "economy", "map", "future"];

export default function Home() {
  const [mode, setMode] = useState<"problems" | "solutions">("problems");
  const [selected, setSelected] = useState<Project | null>(null);
  const [scenario, setScenario] = useState<"conservative" | "base" | "optimistic">("base");
  const [story, setStory] = useState(false);
  const [step, setStep] = useState(0);

  const scenarioData = useMemo(() => ({
    conservative: { label: "Консервативный", npv: "−270,4 млн ₽", bcr: "0,37", damage: "23,25 млн ₽", tone: "risk" },
    base: { label: "Базовый", npv: "+232,0 млн ₽", bcr: "1,78", damage: "55,35 млн ₽", tone: "positive" },
    optimistic: { label: "Оптимистичный", npv: "+834,8 млн ₽", bcr: "6,09", damage: "96,86 млн ₽", tone: "positive" },
  })[scenario], [scenario]);

  const go = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    const p = projects.find((x) => x.id === id);
    if (p && id === "child-safety") setSelected(p);
  };

  useEffect(() => {
    const demo = new URLSearchParams(window.location.search).get("demo") === "1";
    if (demo) setStory(true);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setSelected(null);
      if (e.key.toLowerCase() === "h") { setStep(0); go("hero"); }
      if (e.key.toLowerCase() === "f") document.documentElement.requestFullscreen?.();
      const numeric = Number(e.key);
      if (numeric >= 1 && numeric <= 7) { const i = numeric - 1; setStep(i); go(storyIds[i]); }
      if (story && ["ArrowRight", "ArrowDown", " "].includes(e.key)) { e.preventDefault(); const n = Math.min(6, step + 1); setStep(n); go(storyIds[n]); }
      if (story && ["ArrowLeft", "ArrowUp"].includes(e.key)) { e.preventDefault(); const n = Math.max(0, step - 1); setStep(n); go(storyIds[n]); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [story, step]);

  return <main>
    <header className="topbar">
      <a className="brand" href="#hero"><span className="brandmark">А</span><span>АТРЭ × Южно-Сахалинск<small>аналитическая модель</small></span></a>
      <nav aria-label="Основная навигация"><a href="#signals">Диагноз</a><a href="#portfolio">Проекты</a><a href="#economy">Эффекты</a><a href="#map">Карта</a></nav>
      <div className="header-actions"><button className={story ? "chip active" : "chip"} onClick={() => { setStory(!story); setStep(0); go("hero"); }}>{story ? "История включена" : "Показать историю"}</button><a className="chip" href="#portfolio">Исследовать</a></div>
    </header>

    {story && <div className="storyrail" aria-label="Прогресс истории">{storyIds.map((x, i) => <button key={x} className={i === step ? "active" : ""} onClick={() => { setStep(i); go(x); }}><span>{i + 1}</span></button>)}</div>}

    <section id="hero" className="hero section">
      <div className="eyebrow">ЮЖНО-САХАЛИНСК · 2026</div>
      <div className="hero-head">
        <div><h1>От данных —<br/>к городским решениям</h1><p>Интерактивная модель здоровья, устойчивости и городской среды</p></div>
        <div className="hero-note"><b>Не перечень проблем.</b><br/>Набор решений, привязанных к территории, стоимости бездействия и измеримому эффекту.</div>
      </div>
      <div className="switch" role="group" aria-label="Режим главного экрана"><button className={mode === "problems" ? "active" : ""} onClick={() => setMode("problems")}>ПРОБЛЕМЫ</button><button className={mode === "solutions" ? "active" : ""} onClick={() => setMode("solutions")}>РЕШЕНИЯ</button></div>
      <div className="metric-grid">
        {problems.map((p, i) => <button key={i} className="metric" onClick={() => go(p.id)}><span className="metric-index">0{i + 1}</span><strong>{mode === "problems" ? p.value : p.target}</strong><em>{mode === "problems" ? p.unit : ""}</em><span>{mode === "problems" ? p.label : `Ответ на сигнал: ${p.label}`}</span><small>{mode === "problems" ? p.tag : "ПОКАЗАТЬ ПРОЕКТ →"}</small></button>)}
      </div>
      <div className="logicbar"><span>ПОКАЗАТЕЛЬ</span><i>→</i><span>ПРОБЛЕМА</span><i>→</i><span>ТЕРРИТОРИЯ</span><i>→</i><span>ПРОЕКТ</span><i>→</i><span>ЭФФЕКТ</span><i>→</i><span>KPI</span></div>
    </section>

    <section id="signals" className="section dark">
      <div className="section-no">01 / ДИАГНОЗ</div><h2>Город сильный.<br/>Риски меняются.</h2>
      <div className="context-row"><div><b>317,6</b><span>млрд ₽ · объём отгрузки</span></div><div><b>174</b><span>тыс. ₽ · среднемесячная зарплата</span></div><div><b>78,2</b><span>тыс. работников · 2025</span></div></div>
      <div className="signal-grid">
        <article><span className="signal-tag">ЗДОРОВЬЕ</span><h3>Травм становится больше.</h3><p>Но это не история про аналогичный рост смертности. Главный сигнал — массовость травм и обращаемости.</p><div className="trend"><b>29,3</b><i></i><b>255,2</b></div><small>дети 0–14 · на 1 000 · 2016 → 2025</small></article>
        <article><span className="signal-tag">ХРОНИЧЕСКИЕ РИСКИ</span><h3>Нагрузка становится системной.</h3><p>Кровообращение 176,5 → 302,8; гипертензия 82,3 → 160,6; новообразования 19,2 → 41,6.</p><div className="bars"><i style={{width:"58%"}}></i><i style={{width:"78%"}}></i><i style={{width:"42%"}}></i></div><small>на 1 000 · городской ряд</small></article>
        <article><span className="signal-tag">КЛИМАТ И ВОДА</span><h3>Теплее. Осадки интенсивнее.</h3><p>Температура выросла с 2,6 до 5,4 °C. Суточный максимум осадков — 104 мм.</p><div className="temperature"><b>+2,8 °C</b><span>за 10 лет</span></div><small>ФАКТ · 2016–2025</small></article>
      </div>
    </section>

    <section id="portfolio" className="section portfolio">
      <div className="section-no">02 / ОТВЕТ</div><h2>Не список проблем —<br/>портфель городских проектов</h2><p className="lead">Восемь проектов разного масштаба. Одинаковая логика: проблема → действие → эффект → следующий шаг.</p>
      <div className="project-grid">{projects.map((p) => <button key={p.id} className={p.id === "green-ridge" ? "project featured" : "project"} onClick={() => setSelected(p)}><div><span>{p.no}</span><small>{p.kind}</small></div><h3>{p.title}</h3><p>{p.problem}</p><footer><span>Открыть историю</span><b>↗</b></footer></button>)}</div>
    </section>

    <section id="green-ridge" className="section ridge">
      <div className="ridge-copy"><div className="section-no">03 / ФЛАГМАНСКИЙ ПРОЕКТ</div><h2>«Зелёный хребет»</h2><p className="subtitle">Прогулочный маршрут или защитная инфраструктура?</p><p>Проект соединяет рекреационный маршрут, управление поверхностным стоком и сеть инженерных точек на пересечениях с водотоками.</p><div className="ridge-stats"><div><b>≈13,8 км</b><span>предварительная трассировка</span></div><div><b>11</b><span>пересечений с водотоками</span></div><div><b>5 386 м³</b><span>ёмкость на дождь</span></div></div><div className="axis-note"><b>Ось A</b> — городская · <b>Ось C</b> — гребневая<br/><span>Ось B в исходном KML отсутствует и не показана.</span></div></div>
      <div className="map-card"><img src="/ridge-routes.png" alt="Предварительная трассировка Зелёного хребта"/><div className="map-legend"><span><i className="line blue"></i>Ось A</span><span><i className="line orange"></i>Ось C</span><span><i className="dot"></i>Инженерные точки</span></div></div>
    </section>

    <section id="economy" className="section economy">
      <div className="section-no">04 / ЭКОНОМИКА РЕШЕНИЯ</div><h2>Проверять поэтапно,<br/>а не принимать одним CAPEX</h2>
      <div className="capex"><div><span>Полный укрупнённый CAPEX</span><b>281,6–698,8 млн ₽</b><small>РАСЧЁТ · цены 2026</small></div><div><span>Селезащитная функция</span><b>164,1–427,3 млн ₽</b><small>средняя оценка 295,7 млн ₽</small></div></div>
      <div className="scenario-wrap"><div className="scenario-tabs">{(["conservative","base","optimistic"] as const).map(s => <button key={s} className={scenario === s ? "active" : ""} onClick={() => setScenario(s)}>{s === "conservative" ? "Консервативный" : s === "base" ? "Базовый" : "Оптимистичный"}</button>)}</div><div className={`scenario ${scenarioData.tone}`}><div><span>NPV · 25 лет · 8%</span><b>{scenarioData.npv}</b></div><div><span>BCR</span><b>{scenarioData.bcr}</b></div><div><span>Предотвращённый ущерб / год</span><b>{scenarioData.damage}</b></div><small>{scenarioData.label} сценарий · расчётная модель</small></div></div>
      <div className="water"><div><span>Инженерная ёмкость</span><b>5 386 м³</b><p>Физическая ёмкость сооружений, а не «15% защиты».</p></div><div className="rain"><span>Доля удержания стока</span><p><b>1,29%</b> · дождь 30 мм</p><p><b>0,59%</b> · дождь 65 мм</p><p><b>0,32%</b> · дождь 120 мм</p></div><div><span>Туристический контекст</span><b>9,58 млрд ₽</b><p>Прямые расходы системы «Горный воздух» + «Долина Айна», не самого хребта.</p></div></div>
    </section>

    <section id="map" className="section city-map"><div className="map-copy"><div className="section-no">05 / КАРТА РЕШЕНИЙ</div><h2>Каждая проблема<br/>имеет адрес.</h2><p>Карта связывает сигнал, территорию, проект, бюджет и KPI. Где географии пока нет — это отмечено честно.</p><div className="layer-list"><button className="active">Проблемы <span>4</span></button><button>Решения <span>8</span></button><button>Экономика <span>3</span></button><button>Управление <span>6 мес.</span></button></div></div><div className="schematic-map"><div className="mountains"></div><div className="street-grid"></div>{projects.slice(0,7).map((p,i)=><button key={p.id} className={`pin pin-${i+1}`} onClick={()=>setSelected(p)}><span>{p.no}</span><b>{p.title}</b></button>)}<div className="map-status">Часть проектов требует геопривязки</div></div></section>

    <section id="future" className="section future"><div className="section-no">06 / СЛЕДУЮЩИЙ ЭТАП</div><h2>Как это может выглядеть<br/>через полгода</h2><p className="lead">Не сотни показателей. Четыре ответа по каждой территории.</p><div className="answers"><div><span>01</span><h3>Где проблема?</h3><p>Сигнал на карте, данные и динамика.</p></div><div><span>02</span><h3>Сколько стоит бездействие?</h3><p>Потери и сценарии риска.</p></div><div><span>03</span><h3>Что делать?</h3><p>Проект, CAPEX и этап реализации.</p></div><div><span>04</span><h3>Что контролировать?</h3><p>KPI, milestone и ответственный.</p></div></div><div className="timeline">{["Данные","География","Приоритеты","Паспорта","MVP","Контур управления"].map((x,i)=><div key={x}><b>Месяц {i+1}</b><span>{x}</span></div>)}</div><div className="final-call"><div><span>СЕГОДНЯ</span><b>Исследование и первые решения</b></div><i>→</i><div><span>ЧЕРЕЗ 6 МЕСЯЦЕВ</span><b>Рабочая модель города</b></div></div></section>

    <footer className="footer"><span>АТРЭ × Южно-Сахалинск · 2026</span><span>Источники: городские таблицы, расчётные модели, аналитические справки, KML-трассировка</span><a href="#hero">Наверх ↑</a></footer>

    {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><article className="modal" onClick={(e)=>e.stopPropagation()}><button className="close" aria-label="Закрыть" onClick={()=>setSelected(null)}>×</button><div className="modal-no">ПРОЕКТ {selected.no} · {selected.kind}</div><h2>{selected.title}</h2><div className="modal-flow"><div><span>Какую проблему решает?</span><b>{selected.problem}</b></div><div><span>Измеримый эффект</span><b>{selected.effect}</b></div><div><span>CAPEX</span><b>{selected.capex}</b></div><div><span>Следующее решение</span><b>{selected.next}</b></div></div>{selected.id === "green-ridge" && <button className="primary" onClick={()=>{setSelected(null);go("green-ridge")}}>Перейти к полной истории</button>}<small className="modal-hint">Esc — закрыть</small></article></div>}
  </main>;
}
