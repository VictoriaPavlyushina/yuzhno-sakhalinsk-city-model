"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type Mode = "problems" | "projects";
type RidgeTab = "project" | "infrastructure" | "economy";
type Axis = "all" | "a" | "c";

type Story = {
  id: string;
  no: string;
  short: string;
  title: string;
  lead: string;
  answer?: string;
};

const problems: Story[] = [
  { id: "child", no: "01", short: "Детский травматизм", title: "Детский травматизм", lead: "Город видит масштаб проблемы, но пока не видит её географию.", answer: "child-safe" },
  { id: "rain", no: "02", short: "Экстремальные осадки", title: "Экстремальные осадки", lead: "Режим осадков и рельеф создают дополнительную нагрузку на городскую водную инфраструктуру.", answer: "green-ridge" },
  { id: "fragmentation", no: "03", short: "Фрагментация природы", title: "Природная инфраструктура фрагментирована", lead: "В городе уже есть природные активы. Но они пока не работают как единая система.", answer: "eco-framework" },
  { id: "growth", no: "04", short: "Новая застройка", title: "Новые районы — новая нагрузка", lead: "Без водно-зелёных правил новая застройка увеличит пиковый сток и разорвёт природные связи.", answer: "northern-valley" },
];

const projects: Story[] = [
  { id: "child-safe", no: "01", short: "Безопасный город", title: "Безопасный город для детей", lead: "От статистики травм — к адресным изменениям городской среды" },
  { id: "eco-framework", no: "02", short: "Градоэкокаркас", title: "Градоэкологический каркас", lead: "Единая система природных, водных и рекреационных связей города" },
  { id: "rivers", no: "03", short: "16 рек", title: "16 рек — одна городская система", lead: "От благоустройства отдельных набережных — к управлению водосборами" },
  { id: "boulevards", no: "04", short: "Экобульвары", title: "Экобульвары и зелёные улицы", lead: "Улица становится частью водной, климатической и пешеходной инфраструктуры" },
  { id: "renovation", no: "05", short: "Экореновация", title: "Экореновация промтерриторий", lead: "Водонепроницаемые площадки превращаются в территории с управляемым стоком" },
  { id: "northern-valley", no: "06", short: "Северная долина", title: "Северная долина", lead: "Водно-зелёную инфраструктуру можно заложить до возникновения проблем" },
  { id: "green-ridge", no: "07", short: "Зелёный хребет", title: "Зелёный хребет", lead: "Рекреационный маршрут + работа с водой + связность территории" },
];

const answerMap: Record<string, string> = {
  child: "child-safe",
  rain: "green-ridge",
  fragmentation: "eco-framework",
  growth: "northern-valley",
};

const reverseAnswerMap: Record<string, string> = Object.fromEntries(Object.entries(answerMap).map(([a, b]) => [b, a]));

const axisA = [
  [142.7602,46.9250],[142.7630,46.9241],[142.7657,46.9225],[142.7687,46.9246],[142.7728,46.9287],[142.7725,46.9310],[142.7721,46.9359],[142.7737,46.9400],[142.7728,46.9434],[142.7711,46.9457],[142.7710,46.9504],[142.7705,46.9534],[142.7763,46.9589],[142.7715,46.9615],[142.7703,46.9660],[142.7686,46.9707],[142.7648,46.9745],[142.7634,46.9786],[142.7610,46.9816],[142.7602,46.9868],[142.7572,46.9880]
];

const axisC = [
  [142.7607,46.9839],[142.7672,46.9828],[142.7726,46.9789],[142.7777,46.9774],[142.7869,46.9736],[142.7888,46.9703],[142.7947,46.9659],[142.7973,46.9626]
];

const ridgeBoundary = [
  [142.7470,46.9839],[142.7441,46.9819],[142.7471,46.9740],[142.7538,46.9674],[142.7513,46.9606],[142.7578,46.9527],[142.7567,46.9439],[142.7605,46.9255],[142.7569,46.9170],[142.7631,46.9104],[142.8662,46.9216],[142.8407,46.9671],[142.7998,46.9906],[142.7654,46.9976],[142.7591,46.9924],[142.7638,46.9855],[142.7470,46.9839]
];

const ridgePoints = [
  { x: 142.7571, y: 46.9893, label: "Уюновка" },
  { x: 142.7612, y: 46.9844, label: "переход через Уюновку" },
  { x: 142.7623, y: 46.9451, label: "Ботанический сад" },
  { x: 142.7740, y: 46.9292, label: "Еланька" },
];

const riverNames = ["Уюновка", "Рогатка", "Еланька", "Сусуя", "Красносельская", "ручей Придорожный"];

function getView(id: string) {
  if (["rain", "green-ridge"].includes(id)) return { cx: .68, cy: .51, zoom: 1.34 };
  if (["growth", "northern-valley"].includes(id)) return { cx: .46, cy: .25, zoom: 1.22 };
  if (["boulevards", "renovation"].includes(id)) return { cx: .40, cy: .58, zoom: 1.18 };
  return { cx: .50, cy: .50, zoom: 1 };
}

function CityMap({ active, mode, axis, ridgeTab, frameworkLayer }: { active: string; mode: Mode; axis: Axis; ridgeTab: RidgeTab; frameworkLayer: string }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previousView = useRef(getView("hero"));

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let frame = 0;
    const start = performance.now();
    const from = previousView.current;
    const to = getView(active);
    previousView.current = to;

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width;
      const h = rect.height;
      const p = Math.min(1, (now - start) / 850);
      const ease = 1 - Math.pow(1 - p, 3);
      const view = {
        cx: from.cx + (to.cx - from.cx) * ease,
        cy: from.cy + (to.cy - from.cy) * ease,
        zoom: from.zoom + (to.zoom - from.zoom) * ease,
      };
      const point = (x: number, y: number) => [
        w / 2 + (x - view.cx) * w * view.zoom,
        h / 2 + (y - view.cy) * h * view.zoom,
      ] as const;
      const poly = (pts: number[][], close = false) => {
        ctx.beginPath();
        pts.forEach(([x, y], i) => { const [px, py] = point(x, y); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
        if (close) ctx.closePath();
      };
      ctx.clearRect(0, 0, w, h);
      ctx.fillStyle = "#e9eeea";
      ctx.fillRect(0, 0, w, h);

      const east = ctx.createLinearGradient(w * .48, 0, w, 0);
      east.addColorStop(0, "rgba(198,214,198,.12)");
      east.addColorStop(1, "rgba(118,158,128,.34)");
      ctx.fillStyle = east;
      ctx.fillRect(0, 0, w, h);

      ctx.save();
      ctx.strokeStyle = "rgba(102,136,115,.22)";
      ctx.lineWidth = 1;
      for (let i = 0; i < 14; i++) {
        ctx.beginPath();
        for (let t = 0; t <= 1; t += .04) {
          const x = .62 + t * .52;
          const y = .06 + i * .065 + Math.sin(t * 8 + i * .7) * .023;
          const [px, py] = point(x, y);
          if (t) ctx.lineTo(px, py); else ctx.moveTo(px, py);
        }
        ctx.stroke();
      }
      ctx.restore();

      const city = [[.08,.14],[.50,.10],[.62,.20],[.64,.83],[.50,.94],[.10,.89],[.04,.68],[.06,.29]];
      poly(city, true);
      ctx.fillStyle = "rgba(247,248,244,.88)";
      ctx.fill();
      ctx.strokeStyle = "rgba(42,80,71,.24)";
      ctx.lineWidth = 1.2;
      ctx.stroke();

      ctx.lineWidth = .8;
      ctx.strokeStyle = "rgba(74,100,92,.19)";
      for (let i = 0; i < 19; i++) {
        const x = .10 + i * .026;
        poly([[x,.13 + (i%3)*.015],[x+.012,.88 - (i%4)*.018]]);
        ctx.stroke();
      }
      for (let i = 0; i < 23; i++) {
        const y = .18 + i * .029;
        poly([[.07,y],[.61,y + Math.sin(i)*.011]]);
        ctx.stroke();
      }
      ctx.strokeStyle = "rgba(47,76,69,.35)";
      ctx.lineWidth = 1.6;
      poly([[.21,.08],[.20,.93]]); ctx.stroke();
      poly([[.07,.48],[.63,.46]]); ctx.stroke();
      poly([[.31,.10],[.33,.91]]); ctx.stroke();

      const rivers = [
        [[.07,.22],[.20,.20],[.34,.25],[.57,.21],[.83,.19]],
        [[.04,.39],[.20,.42],[.36,.38],[.62,.40],[.91,.35]],
        [[.03,.57],[.17,.55],[.34,.60],[.57,.57],[.90,.51]],
        [[.08,.72],[.28,.69],[.43,.74],[.64,.70],[.94,.66]],
        [[.18,.08],[.23,.29],[.19,.53],[.22,.82],[.18,.96]],
        [[.48,.05],[.45,.27],[.51,.49],[.47,.77],[.55,.97]],
      ];
      rivers.forEach((r, i) => {
        ctx.beginPath();
        r.forEach(([x,y], j) => { const [px,py] = point(x,y); if (j) ctx.lineTo(px,py); else ctx.moveTo(px,py); });
        ctx.strokeStyle = active === "rivers" ? `rgba(7,137,141,${.96 - i*.06})` : "rgba(74,139,153,.35)";
        ctx.lineWidth = active === "rivers" ? 2.5 : 1.15;
        if (active === "rivers") { ctx.setLineDash([10,7]); ctx.lineDashOffset = -((now-start)/24); }
        ctx.stroke(); ctx.setLineDash([]);
      });

      const assets = [[.29,.43],[.40,.58],[.57,.34],[.68,.54],[.48,.78]];
      assets.forEach(([x,y], i) => {
        const [px,py] = point(x,y);
        ctx.beginPath(); ctx.ellipse(px,py,34*view.zoom,21*view.zoom, i*.35,0,Math.PI*2);
        ctx.fillStyle = active === "fragmentation" ? "rgba(87,133,91,.35)" : "rgba(102,148,104,.19)";
        ctx.fill();
      });
      if (["eco-framework", "final"].includes(active)) {
        ctx.strokeStyle = frameworkLayer ? "rgba(7,137,141,.96)" : "rgba(7,137,141,.72)";
        ctx.lineWidth = frameworkLayer ? 4 : 2.3;
        ctx.setLineDash([6,7]);
        for (let i = 0; i < assets.length - 1; i++) { poly([assets[i], assets[i+1]]); ctx.stroke(); }
        poly([[.29,.43],[.57,.34],[.68,.54]]); ctx.stroke();
        ctx.setLineDash([]);
      }

      if (["growth", "northern-valley"].includes(active)) {
        poly([[.25,.08],[.58,.07],[.67,.18],[.55,.30],[.28,.27],[.20,.17]], true);
        ctx.fillStyle = active === "northern-valley" ? "rgba(7,137,141,.16)" : "rgba(176,94,73,.14)";
        ctx.fill(); ctx.strokeStyle = active === "northern-valley" ? "#07898d" : "#ad644e"; ctx.lineWidth = 2.2; ctx.setLineDash([8,6]); ctx.stroke(); ctx.setLineDash([]);
      }

      if (active === "child") {
        ctx.fillStyle = "rgba(177,94,72,.045)";
        for (let x=.1; x<.62; x+=.035) for (let y=.14; y<.89; y+=.035) { const [px,py]=point(x,y); ctx.beginPath(); ctx.arc(px,py,1.25,0,Math.PI*2); ctx.fill(); }
      }

      if (["green-ridge","rain","final"].includes(active)) {
        const geo = (coord: number[]) => [
          .34 + ((coord[0] - 142.744) / (142.867 - 142.744)) * .57,
          .10 + ((46.999 - coord[1]) / (46.999 - 46.909)) * .80,
        ];
        poly(ridgeBoundary.map(geo), true);
        ctx.fillStyle = active === "rain" ? "rgba(176,94,73,.055)" : "rgba(7,137,141,.055)";
        ctx.fill(); ctx.strokeStyle = active === "rain" ? "rgba(176,94,73,.55)" : "rgba(7,137,141,.52)"; ctx.lineWidth=1.4; ctx.setLineDash([6,5]); ctx.stroke(); ctx.setLineDash([]);
        const progress = Math.min(1, Math.max(0, (now-start-180)/900));
        const drawRoute = (coords: number[][], color: string, visible: boolean) => {
          if (!visible) return;
          const pts = coords.map(geo);
          const limit = Math.max(2, Math.ceil(pts.length * progress));
          poly(pts.slice(0,limit)); ctx.strokeStyle=color; ctx.lineWidth=axis === "all" ? 4 : 5.5; ctx.lineCap="round"; ctx.lineJoin="round"; ctx.shadowColor=color; ctx.shadowBlur=9; ctx.stroke(); ctx.shadowBlur=0;
        };
        drawRoute(axisA, axis === "c" ? "rgba(7,137,141,.23)" : "#07898d", active !== "rain");
        drawRoute(axisC, axis === "a" ? "rgba(214,130,49,.24)" : "#d68231", active !== "rain");
        if (active === "green-ridge" && progress > .8) ridgePoints.forEach((pt) => { const [gx,gy]=geo([pt.x,pt.y]); const [px,py]=point(gx,gy); ctx.beginPath(); ctx.arc(px,py,5.5,0,Math.PI*2); ctx.fillStyle="#fff"; ctx.fill(); ctx.strokeStyle="#173536"; ctx.lineWidth=2.2; ctx.stroke(); });
      }

      if (active === "boulevards") {
        poly([[.11,.67],[.28,.62],[.48,.61],[.64,.55]]); ctx.strokeStyle="#07898d"; ctx.lineWidth=7; ctx.globalAlpha=.78; ctx.stroke(); ctx.globalAlpha=1;
      }
      if (active === "renovation") {
        [[.17,.68],[.30,.75],[.42,.67]].forEach(([x,y])=>{ const [px,py]=point(x,y); ctx.fillStyle="rgba(7,137,141,.22)"; ctx.fillRect(px-36,py-22,72,44); ctx.strokeStyle="#07898d"; ctx.strokeRect(px-36,py-22,72,44); });
      }

      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(frame);
  }, [active, mode, axis, ridgeTab, frameworkLayer]);

  return <canvas ref={canvasRef} className="city-canvas" aria-label="Стилизованная карта Южно-Сахалинска" />;
}

function ModeSwitch({ mode, onChange }: { mode: Mode; onChange: (mode: Mode) => void }) {
  return <div className="mode-switch" role="group" aria-label="Главный режим">
    <button className={mode === "problems" ? "active" : ""} onClick={() => onChange("problems")}><span>01</span>ВЫЯВЛЕННЫЕ ПРОБЛЕМЫ</button>
    <button className={mode === "projects" ? "active" : ""} onClick={() => onChange("projects")}><span>02</span>ПРЕДЛАГАЕМЫЕ ПРОЕКТЫ</button>
  </div>;
}

export default function Home() {
  const [mode, setMode] = useState<Mode>("problems");
  const [active, setActive] = useState("hero");
  const [transitioning, setTransitioning] = useState(false);
  const [sourceOpen, setSourceOpen] = useState(false);
  const [ridgeTab, setRidgeTab] = useState<RidgeTab>("project");
  const [axis, setAxis] = useState<Axis>("all");
  const [ridgeMetric, setRidgeMetric] = useState(0);
  const [scenario, setScenario] = useState("base");
  const [frameworkLayer, setFrameworkLayer] = useState("");

  const toggleFullscreen = useCallback(() => {
    if (document.fullscreenElement) document.exitFullscreen?.();
    else document.documentElement.requestFullscreen?.();
  }, []);

  const activeStory = useMemo(() => [...problems, ...projects].find((item) => item.id === active), [active]);

  const goTo = useCallback((id: string) => {
    setActive(id);
    document.getElementById(`step-${id}`)?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  const switchMode = useCallback((next: Mode, target?: string) => {
    if (next === mode && target) { goTo(target); return; }
    setTransitioning(true);
    const mapped = target || (next === "projects" ? answerMap[active] : reverseAnswerMap[active]) || (next === "projects" ? "child-safe" : "child");
    setMode(next);
    setTimeout(() => goTo(mapped), 80);
    setTimeout(() => setTransitioning(false), 820);
  }, [active, goTo, mode]);

  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      const visible = entries.filter((entry) => entry.isIntersecting).sort((a,b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (visible) setActive((visible.target as HTMLElement).dataset.story || "hero");
    }, { rootMargin: "-34% 0px -34% 0px", threshold: [0,.2,.6] });
    document.querySelectorAll<HTMLElement>("[data-story]").forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, [mode]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === "1") switchMode("problems", "child");
      if (key === "2") switchMode("projects", "child-safe");
      if (key === "3") switchMode("projects", "green-ridge");
      if (key === "h") { setMode("problems"); setActive("hero"); window.scrollTo({ top: 0, behavior: "smooth" }); }
      if (key === "f") toggleFullscreen();
      if (key === "escape") { setSourceOpen(false); setAxis("all"); setRidgeTab("project"); setActive("hero"); window.scrollTo({ top: 0, behavior: "smooth" }); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [switchMode, toggleFullscreen]);

  const renderProblem = () => {
    if (!activeStory) return null;
    return <article className={`story-card problem-card card-${active}`}>
      <div className="card-kicker"><span>{activeStory.no}</span> ВЫЯВЛЕННАЯ ПРОБЛЕМА</div>
      <h2>{activeStory.title}</h2>
      {active === "child" && <>
        <div className="metric-pair"><div><b>255,2</b><span>на 1 000 детей</span></div><div><b>122,1 млн ₽</b><span>расчётная цена / год</span></div></div>
        <p>{activeStory.lead}</p><small>Чтобы перейти к профилактике, нужно понять, где происходят травмы и какие элементы среды с ними связаны.</small>
      </>}
      {active === "rain" && <><div className="metric-pair"><div><b>104 мм</b><span>максимум / сутки · 2023</span></div><div><b>+2,8 °C</b><span>2016–2025</span></div></div><p>{activeStory.lead}</p></>}
      {active === "fragmentation" && <><p className="statement">В городе уже есть природные активы.<br/>Но они пока не работают как единая система.</p><small>Парки, реки, зелёные улицы, рекреационные территории и новые районы можно связать.</small></>}
      {active === "growth" && <><div className="system-row"><span>ЗАСТРОЙКА</span><i>+</i><span>ПИКОВЫЙ СТОК</span><i>+</i><span>РАЗРЫВ СВЯЗЕЙ</span></div><p>{activeStory.lead}</p></>}
      <button className="primary-action" onClick={() => switchMode("projects", activeStory.answer)}>Показать предлагаемый проект <span>→</span></button>
    </article>;
  };

  const renderProject = () => {
    if (!activeStory) return null;
    if (active === "green-ridge") return <RidgeCard tab={ridgeTab} setTab={setRidgeTab} axis={axis} setAxis={setAxis} metric={ridgeMetric} setMetric={setRidgeMetric} scenario={scenario} setScenario={setScenario} />;
    return <article className={`story-card project-card card-${active}`}>
      <div className="card-kicker"><span>{activeStory.no}</span> ПРЕДЛАГАЕМЫЙ ПРОЕКТ</div>
      <h2>{activeStory.title}</h2><p className="project-lead">{activeStory.lead}</p>
      {active === "child-safe" && <><div className="mini-metrics"><b>122,1 млн ₽ <small>/ год</small></b><b>255,2 <small>на 1 000</small></b></div><div className="flow"><span>СЛУЧАЙ</span><i>→</i><span>МЕСТО</span><i>→</i><span>ПРИЧИНА</span><i>→</i><span>HOTSPOT</span><i>→</i><span>МЕРА</span></div><div className="outputs"><span>карта травм</span><span>опасные участки</span><span>аудит среды</span><span>микропроекты</span></div></>}
      {active === "eco-framework" && <><div className="vertical-system"><span>ЛЕС</span><i>↕</i><span>РЕКИ</span><i>↕</i><span>ПАРКИ</span><i>↕</i><span>ЗЕЛЁНЫЕ УЛИЦЫ</span><i>↕</i><span>НОВЫЕ РАЙОНЫ</span></div><div className="function-buttons">{["ВОДА","КЛИМАТ","РЕКРЕАЦИЯ","СВЯЗНОСТЬ"].map(x=><button key={x} onMouseEnter={()=>setFrameworkLayer(x)} onMouseLeave={()=>setFrameworkLayer("")}>{x}</button>)}</div></>}
      {active === "rivers" && <><div className="river-number"><b>16</b><span>рек вместо<br/>16 отдельных задач</span></div><div className="river-list"><small>ПЕРВАЯ ОЧЕРЕДЬ АНАЛИЗА</small>{riverNames.map(x=><span key={x}>{x}</span>)}</div></>}
      {active === "boulevards" && <><div className="street-section"><div className="tree"><i></i><b></b></div><div className="bioswale">дождевой сад</div><div className="walk">комфортный маршрут</div><div className="rain-dots">•••</div></div><div className="outputs"><span>деревья</span><span>биоканавы</span><span>дождевые сады</span><span>проницаемое покрытие</span></div></>}
      {active === "renovation" && <><div className="before-after"><div><small>СЕЙЧАС</small><b>асфальт → быстрый сток</b></div><i>→</i><div><small>ПРОЕКТ</small><b>зелёные ячейки → удержание воды</b></div></div><p className="card-note">Начать с водных паспортов площадок и пилотной территории.</p></>}
      {active === "northern-valley" && <><div className="system-row six"><span>ЗАСТРОЙКА</span><i>+</i><span>РЕКИ</span><i>+</i><span>ДВОРЫ</span><i>+</i><span>БУЛЬВАРЫ</span><i>+</i><span>ПРУДЫ</span><i>+</i><span>ПРОСТРАНСТВА</span></div><ol className="rules"><li><b>01</b> не увеличивать пиковый сток</li><li><b>02</b> сохранять зелёную поверхность</li><li><b>03</b> соединять проекты в одну систему</li></ol></>}
    </article>;
  };

  const sceneIds = mode === "problems" ? problems.map(x=>x.id) : projects.map(x=>x.id);
  return <main className={`map-experience mode-${mode} active-${active} ${transitioning ? "is-morphing" : ""}`}>
    <header className="topbar">
      <button className="brand" onClick={() => { setMode("problems"); setActive("hero"); window.scrollTo({top:0,behavior:"smooth"}); }}><span className="brand-mark">А</span><span><b>АТРЭ</b><i>×</i>ЮЖНО-САХАЛИНСК</span></button>
      <ModeSwitch mode={mode} onChange={switchMode} />
      <button className="fullscreen" aria-label="Полноэкранный режим" onClick={toggleFullscreen}><i></i><span>FULLSCREEN</span></button>
    </header>

    <section className="experience" aria-label="Интерактивная карта проблем и проектов">
      <div className="map-stage">
        <CityMap active={active} mode={mode} axis={axis} ridgeTab={ridgeTab} frameworkLayer={frameworkLayer} />
        <div className="map-vignette"></div>
        <div className="orientation"><b>С</b><i></i></div>
        <div className="map-caption">46°57′ с.ш. · 142°44′ в.д.<span>СХЕМАТИЧЕСКАЯ ГОРОДСКАЯ МОДЕЛЬ</span></div>

        {active === "hero" && <div className="hero-panel">
          <div className="hero-eyebrow">ЮЖНО-САХАЛИНСК</div>
          <h1>Выявленные проблемы<br/><em>и предлагаемые проекты</em></h1>
          <p>От анализа городских данных — к конкретным проектным решениям</p>
          <ModeSwitch mode={mode} onChange={switchMode} />
          <div className="hero-stories">{(mode === "problems" ? problems : projects).map(item => <button key={item.id} onClick={() => goTo(item.id)}><span>{item.no}</span>{item.short}</button>)}</div>
        </div>}

        {active !== "hero" && active !== "final" && mode === "problems" && renderProblem()}
        {active !== "hero" && active !== "final" && mode === "projects" && renderProject()}

        {active === "child" && <div className="geo-missing"><b>ГЕОГРАФИЯ ПОКА ОТСУТСТВУЕТ</b><span>Следующий уровень анализа: где именно происходят травмы?</span><div>{["школа","двор","дорога","спорт","рекреация"].map(x=><i key={x}>{x}</i>)}</div></div>}
        {active === "rain" && <div className="east-label"><span>ВОСТОЧНАЯ РЕКРЕАЦИОННАЯ ЗОНА</span><b>рельеф × водотоки × город</b></div>}
        {active === "rivers" && <div className="river-labels">{riverNames.slice(0,4).map((x,i)=><span key={x} style={{left:`${31+i*12}%`,top:`${22+i*15}%`}}>{x}</span>)}</div>}
        {active === "green-ridge" && <div className="ridge-legend"><span><i className="legend-a"></i>Ось A · городская</span><span><i className="legend-c"></i>Ось C · гребневая</span><small>Предварительная трассировка · KML</small></div>}

        {mode === "projects" && active !== "hero" && active !== "final" && <nav className="project-rail" aria-label="Предлагаемые проекты">{projects.map(item=><button key={item.id} className={active===item.id?"active":""} onClick={()=>goTo(item.id)}><span>{item.no}</span><b>{item.short}</b></button>)}</nav>}

        {active === "final" && <FinalScene />}
        {transitioning && <div className="morph-bridge"><span>{mode === "projects" ? "ПРОБЛЕМА" : "ПРОЕКТ"}</span><i></i><b>{mode === "projects" ? "ПРОЕКТНОЕ РЕШЕНИЕ" : "ИСХОДНЫЙ СИГНАЛ"}</b></div>}

        <button className="sources-button" onClick={()=>setSourceOpen(true)}>ИСТОЧНИКИ <span>↗</span></button>
        <div className="scroll-cue"><i></i><span>ЛИСТАЙТЕ ДЛЯ ПРОДОЛЖЕНИЯ</span></div>
      </div>

      <div className="scroll-steps" aria-hidden="true">
        {sceneIds.map(id => <section id={`step-${id}`} data-story={id} key={id}></section>)}
        <section id="step-final" data-story="final"></section>
      </div>
    </section>

    {sourceOpen && <div className="drawer-backdrop"><button className="drawer-dismiss" aria-label="Закрыть источники" onClick={()=>setSourceOpen(false)}></button><aside className="sources-drawer"><button className="drawer-close" onClick={()=>setSourceOpen(false)}>ЗАКРЫТЬ ×</button><div className="card-kicker">ДАННЫЕ И ДОПУЩЕНИЯ</div><h2>Источники модели</h2><ul><li>Городские таблицы социально-экономического развития и здравоохранения</li><li>Аналитические справки по градоэкологическому каркасу и «Зелёному хребту»</li><li>Расчётные модели детского травматизма, стоимости и селезащитного эффекта</li><li>Исходная KML-трассировка Восточной рекреационной зоны</li></ul><p>Фактические, расчётные и проектные показатели визуально разделены. География травм не моделируется до получения адресных данных.</p><small>Материалы рабочей группы · 2025–2026</small></aside></div>}
  </main>;
}

function RidgeCard({ tab, setTab, axis, setAxis, metric, setMetric, scenario, setScenario }: { tab: RidgeTab; setTab: (x:RidgeTab)=>void; axis: Axis; setAxis:(x:Axis)=>void; metric:number; setMetric:(x:number)=>void; scenario:string; setScenario:(x:string)=>void }) {
  const metrics = [
    { value:"12,55 км", label:"предварительная длина осей A + C" },
    { value:"281,6–698,8 млн ₽", label:"укрупнённый полный CAPEX" },
    { value:"+232 млн ₽", label:"NPV базового сценария", extra:"5 386 м³ · инженерная ёмкость" },
  ];
  const scenarios: Record<string,{name:string;npv:string;bcr?:string}> = { conservative:{name:"Консервативный",npv:"−270,4 млн ₽"}, base:{name:"Базовый",npv:"+232,0 млн ₽",bcr:"BCR 1,78"}, optimistic:{name:"Оптимистичный",npv:"+834,8 млн ₽"} };
  return <article className="story-card project-card ridge-card">
    <div className="card-kicker"><span>07</span> ФЛАГМАНСКИЙ ПРОЕКТ</div><h2>Зелёный хребет</h2><p className="project-lead">Рекреационный маршрут + работа с водой + связность территории</p>
    <div className="ridge-tabs">{(["project","infrastructure","economy"] as const).map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x==="project"?"ПРОЕКТ":x==="infrastructure"?"ИНФРАСТРУКТУРА":"ЭКОНОМИКА"}</button>)}</div>
    {tab === "project" && <><button className="ridge-main-metric" onClick={()=>setMetric((metric+1)%3)}><span>0{metric+1} / 03</span><b>{metrics[metric].value}</b><p>{metrics[metric].label}</p>{metrics[metric].extra&&<small>{metrics[metric].extra}</small>}<i>НАЖМИТЕ ДЛЯ СЛЕДУЮЩЕГО →</i></button><div className="axis-switch"><button className={axis==="a"?"active":""} onClick={()=>setAxis(axis==="a"?"all":"a")}><b>Ось A</b><span>8,72 км · городская</span></button><button className={axis==="c"?"active c":""} onClick={()=>setAxis(axis==="c"?"all":"c")}><b>Ось C</b><span>3,83 км · гребневая</span></button></div></>}
    {tab === "infrastructure" && <div className="axis-detail">{axis !== "c" ? <><div className="axis-title"><b>Ось A</b><span>ГОРОДСКАЯ · 8,72 КМ</span></div><p>Уюновка → парк Гагарина → площадь Славы → Ботанический сад → Больничная</p><div className="outputs"><span>21,81 тыс. м² покрытия</span><span>291 опора света</span><span>6,11 км террас-свейлов</span><span>10 каскадных запруд</span></div></> : <><div className="axis-title c"><b>Ось C</b><span>ГРЕБНЕВАЯ · 3,83 КМ</span></div><p>Треккинг · трейлраннинг · видовой маршрут · связь с верхней частью «Горного воздуха»</p><div className="outputs"><span>77 водоотводных нарезок</span><span>2 видовые площадки</span></div></>}</div>}
    {tab === "economy" && <div className="economy-panel"><div className="scenario-tabs">{Object.entries(scenarios).map(([key,s])=><button key={key} className={scenario===key?"active":""} onClick={()=>setScenario(key)}><span>{s.name}</span><b>{s.npv}</b></button>)}</div><div className={`scenario-result ${scenario}`}><small>NPV · 25 ЛЕТ · 8%</small><b>{scenarios[scenario].npv}</b>{scenarios[scenario].bcr&&<span>{scenarios[scenario].bcr}</span>}<p>Расчётная сценарная модель</p></div></div>}
  </article>;
}

function FinalScene() {
  return <div className="final-scene"><div className="final-copy"><div className="card-kicker">ЕДИНАЯ КАРТА РЕШЕНИЙ</div><h2>От выявленных проблем<br/>к конкретным проектам</h2><p>Следующий шаг — довести приоритетные решения до проектных паспортов и сформировать единую карту городских проектов.</p><div className="problem-links"><div><b>122,1 млн ₽</b><i></i><span>БЕЗОПАСНЫЙ ГОРОД</span></div><div><b>104 мм</b><i></i><span>ЗЕЛЁНЫЙ ХРЕБЕТ</span></div><div><b>ФРАГМЕНТАЦИЯ</b><i></i><span>ГРАДОЭКОЛОГИЧЕСКИЙ КАРКАС</span></div></div></div><aside className="final-card"><div><small>ЧТО УЖЕ СДЕЛАНО</small><p>Выявлены ключевые проблемы.<br/>Сформированы проектные решения.<br/>Проведены первые расчёты эффектов.</p></div><div><small>СЛЕДУЮЩИЙ ШАГ</small><p>Приоритизация.<br/>Проектные паспорта.<br/>CAPEX и эффекты.<br/>Единая карта проектов.</p></div></aside></div>;
}
