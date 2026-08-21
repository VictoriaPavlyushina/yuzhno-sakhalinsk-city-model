"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type BalanceMode = "strengths" | "tensions";
type ChildTab = "scale" | "cost" | "program";
type RidgeTab = "role" | "route" | "economy" | "conditions";
type Axis = "all" | "a" | "c";

const scenes = [
  { id: "cover", label: "Начало" },
  { id: "balance", label: "Портрет города" },
  { id: "projects", label: "Проекты" },
  { id: "child", label: "Детская безопасность" },
  { id: "ridge", label: "Зелёный хребет" },
];

const strengths = [
  { group: "health", value: "5,2%", unit: "", label: "уровень бедности", note: "почти вдвое ниже 2016 года" },
  { group: "health", value: "44%", unit: "", label: "готовы быть волонтёрами", note: "индекс социальной сплочённости" },
  { group: "health", value: "89,7%", unit: "", label: "населения занимаются спортом", note: "2025 год" },
  { group: "urban", value: "317,6", unit: "млрд ₽", label: "объём экономики в 2025 году", note: "+78% к 2017 году" },
  { group: "urban", value: "×5,4", unit: "", label: "рост инвестиций на человека", note: "2016–2024" },
  { group: "urban", value: "282,9", unit: "тыс.", label: "размещённых туристов", note: "почти вдвое больше, чем в 2016" },
  { group: "urban", value: "339→148", unit: "", label: "снижение числа ДТП", note: "2016–2025" },
  { group: "urban", value: "<10", unit: "мин", label: "прибытие экстренных служб", note: "среднее время" },
  { group: "urban", value: "15 лет", unit: "", label: "доля общественного транспорта старше", note: "парк требует обновления" },
  { group: "ecology", value: "99,8%", unit: "", label: "питьевой воды соответствует нормам", note: "защитный фактор здоровья" },
  { group: "ecology", value: "+918", unit: "га", label: "озеленённых территорий", note: "2019–2024" },
  { group: "ecology", value: "×2,7", unit: "", label: "рост протяжённости ливневых сооружений", note: "2021–2025" },
];

const tensions = [
  { group: "health", value: "22,7%", unit: "", label: "жителей старше трудоспособного возраста", note: "+2,8 п.п. за период" },
  { group: "health", value: "+40%", unit: "", label: "общая заболеваемость взрослых", note: "2025 к 2024 году" },
  { group: "health", value: "+15%", unit: "", label: "первичная инвалидность трудоспособных", note: "средний темп прироста · 2023–2025" },
  { group: "health", value: "265,4", unit: "на 1 000", label: "детский травматизм", note: "2025 год" },
  { group: "urban", value: "45,5%", unit: "", label: "износ ливневой сети", note: "территориальное покрытие — 55%" },
  { group: "urban", value: "29–30", unit: "детей", label: "средняя наполняемость классов", note: "риск перегрузки школ" },
  { group: "urban", value: "50%", unit: "", label: "доля личного авто в транспортном балансе", note: "частое использование режима автопрогрева" },
  { group: "urban", value: "×8,9", unit: "", label: "рост туристического потока", note: "2016–2025" },
  { group: "ecology", value: "+2,8°C", unit: "", label: "рост среднегодовой температуры", note: "2016–2025" },
  { group: "ecology", value: "104", unit: "мм/сутки", label: "экстремум осадков", note: "2023 год, режим ЧС" },
  { group: "ecology", value: "+43%", unit: "", label: "рост жилого фонда", note: "+42% дорожной сети · рост площади непроницаемых покрытий" },
  { group: "ecology", value: "19–29", unit: "мкг/м³", label: "зимняя концентрация PM2.5", note: "в 3–5 раз выше рекомендаций ВОЗ" },
];

const balanceGroups = [
  { id: "health", number: "01", label: "Здоровье" },
  { id: "urban", number: "02", label: "Городская среда и экономика" },
  { id: "ecology", number: "03", label: "Экология" },
];

const projects = [
  {
    id: "ridge",
    no: "01",
    name: "Зелёный хребет",
    type: "РЕКРЕАЦИЯ + ЗАЩИТА",
    essence: "Система инженерных сооружений для защиты города от селей, совмещённая с туристической тропой. Компонент градоэкологического каркаса.",
    problem: "Связать город с восточными склонами и совместить маршрут с управлением стоком и природными рисками.",
    output: "Трассировка двух троп с оценкой CAPEX, а также экономического вклада от турпотока и защиты от селей.",
    next: "DEM и изыскания → уточнение трассы → пилот городской оси A.",
    scene: 4,
  },
  {
    id: "safe",
    no: "02",
    name: "Безопасный город для детей",
    type: "ЗДОРОВЬЕ + СРЕДА",
    essence: "От статистики травм — к конкретным решениям по снижению травматизма.",
    problem: "Почти каждый третий ребёнок получает травму, но отсутствуют детализация и картирование причин и мест получения травм. Косвенные данные свидетельствуют о влиянии городской среды.",
    output: "Единый реестр, карта рисков, аудит среды, адресные изменения городской среды и нормативного регулирования.",
    next: "Обезличенные данные → пилотные территории → стандарт безопасной среды.",
    scene: 3,
  },
  { id: "framework", no: "03", name: "Развитие градоэкологического каркаса", type: "ОБЩЕГОРОДСКАЯ СИСТЕМА", essence: "Создание единой управляемой системы из природно‑экологических компонентов и городской инфраструктуры.", problem: "Решения мастер-плана разрознены: природные территории, водные коридоры и рекреационные маршруты не собраны в общегородскую схему и не учитывают рельеф как единую систему движения воды и природных рисков.", output: "Концепция ГЭК, общегородская схема, карта проблем и разрывов, перечень приоритетных проектов и рельефно-гидрологический атлас уклонов, водосборов, пойм, селевых бассейнов и зон подтопления.", next: "" },
  { id: "rivers", no: "04", name: "Программа ревитализации малых рек", type: "ВОДНО-ЗЕЛЁНЫЕ КОРИДОРЫ", essence: "Превратить 16 городских водотоков в систему рекреации, инженерной защиты и управления природными рисками.", problem: "Малые реки рассматриваются как отдельные объекты благоустройства, хотя они принимают сток со склонов и связывают жилые районы с природным каркасом. Для разных участков нужны разные решения — от противоселевой защиты до мягких берегов.", output: "Реестр 16 водотоков, паспорта водосборов, типология русел и набережных, 5–7 проектов первой очереди и единая схема инженерной защиты для Рогатки, Еланьки, Сусуи, Красносельской, Уюновки и ручья Придорожного.", next: "" },
  { id: "boulevards", no: "05", name: "Сеть экобульваров и зелёных улиц", type: "УЛИЦЫ + ВОДА + СВЯЗНОСТЬ", essence: "Система уличного озеленения, увязанного с ливневыми сооружениями для управления островами тепла и водотоком. Компонент градоэкологического каркаса.", problem: "Ключевые улицы пока не работают как элементы сине-зелёной инфраструктуры: не учитывают уклоны, снеготаяние, водосборную роль и связь с малыми реками, парками и пешеходными маршрутами.", output: "Схема сети экобульваров, типологический альбом сечений и паспорта 7–10 приоритетных улиц: проспекта Мира, улиц Сахалинской, Горького, Украинской, Ленина и других.", next: "" },
];

const axisA = [[142.7602,46.9250],[142.7630,46.9241],[142.7657,46.9225],[142.7687,46.9246],[142.7728,46.9287],[142.7725,46.9310],[142.7721,46.9359],[142.7737,46.9400],[142.7728,46.9434],[142.7711,46.9457],[142.7710,46.9504],[142.7705,46.9534],[142.7763,46.9589],[142.7715,46.9615],[142.7703,46.9660],[142.7686,46.9707],[142.7648,46.9745],[142.7634,46.9786],[142.7610,46.9816],[142.7602,46.9868],[142.7572,46.9880]];
const axisC = [[142.7607,46.9839],[142.7672,46.9828],[142.7726,46.9789],[142.7777,46.9774],[142.7869,46.9736],[142.7888,46.9703],[142.7947,46.9659],[142.7973,46.9626]];
const ridgeBoundary = [[142.7470,46.9839],[142.7441,46.9819],[142.7471,46.9740],[142.7538,46.9674],[142.7513,46.9606],[142.7578,46.9527],[142.7567,46.9439],[142.7605,46.9255],[142.7569,46.9170],[142.7631,46.9104],[142.8662,46.9216],[142.8407,46.9671],[142.7998,46.9906],[142.7654,46.9976],[142.7591,46.9924],[142.7638,46.9855],[142.7470,46.9839]];

function CityCanvas({ scene, project, axis }: { scene: string; project: string; axis: Axis }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    let raf = 0;
    const started = performance.now();

    const draw = (now: number) => {
      const rect = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      if (canvas.width !== Math.round(rect.width * dpr) || canvas.height !== Math.round(rect.height * dpr)) {
        canvas.width = Math.round(rect.width * dpr);
        canvas.height = Math.round(rect.height * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height, t = (now - started) / 1000;
      const point = (x: number, y: number) => [x * w, y * h] as const;
      const poly = (pts: number[][], close = false) => { ctx.beginPath(); pts.forEach(([x,y],i) => { const [px,py] = point(x,y); if (i) ctx.lineTo(px,py); else ctx.moveTo(px,py); }); if (close) ctx.closePath(); };
      const routePoint = ([lon,lat]: number[]) => [.56 + ((lon - 142.744) / .123) * .39, .10 + ((46.999 - lat) / .09) * .78];

      ctx.clearRect(0,0,w,h);
      const bg = ctx.createRadialGradient(w*.72,h*.45,0,w*.72,h*.45,w*.8);
      bg.addColorStop(0,"#174748"); bg.addColorStop(.55,"#0e3435"); bg.addColorStop(1,"#082425");
      ctx.fillStyle = bg; ctx.fillRect(0,0,w,h);

      ctx.strokeStyle = "rgba(171,218,188,.10)"; ctx.lineWidth = .9;
      for (let i=0;i<23;i++) { ctx.beginPath(); for (let p=0;p<=1;p+=.025) { const x=.57+p*.55; const y=.02+i*.045+Math.sin(p*9+i*.7)*(.012+i*.0008); const [px,py]=point(x,y); if(p)ctx.lineTo(px,py);else ctx.moveTo(px,py); } ctx.stroke(); }

      const city=[[.10,.11],[.53,.08],[.62,.18],[.61,.89],[.47,.96],[.08,.88],[.045,.55],[.07,.22]];
      poly(city,true); ctx.fillStyle="rgba(236,240,225,.035)"; ctx.fill(); ctx.strokeStyle="rgba(218,232,215,.15)"; ctx.stroke();
      ctx.strokeStyle="rgba(222,235,222,.09)";ctx.lineWidth=.65;
      for(let i=0;i<21;i++){const x=.09+i*.024;poly([[x,.12+(i%3)*.01],[x+.018,.9-(i%4)*.016]]);ctx.stroke();}
      for(let i=0;i<25;i++){const y=.15+i*.029;poly([[.06,y],[.61,y+Math.sin(i*.8)*.009]]);ctx.stroke();}
      ctx.strokeStyle="rgba(230,238,226,.2)";ctx.lineWidth=1.35;poly([[.20,.08],[.22,.94]]);ctx.stroke();poly([[.06,.52],[.62,.49]]);ctx.stroke();

      const rivers=[[[.07,.22],[.23,.23],[.39,.28],[.61,.23],[.91,.17]],[[.04,.37],[.22,.41],[.42,.38],[.67,.39],[.96,.34]],[[.04,.52],[.19,.55],[.38,.58],[.68,.55],[.97,.49]],[[.07,.68],[.25,.70],[.46,.72],[.72,.68],[.98,.62]],[[.16,.08],[.20,.31],[.18,.58],[.23,.92]]];
      rivers.forEach((r,i)=>{poly(r);ctx.strokeStyle=scene==="projects"&&project==="rivers"?`rgba(74,211,207,${.72-i*.05})`:"rgba(73,171,177,.24)";ctx.lineWidth=scene==="projects"&&project==="rivers"?2.2:1;ctx.stroke();});

      if(scene==="balance") {
        [[.17,.23],[.30,.65],[.45,.31],[.53,.72]].forEach(([x,y],i)=>{const [px,py]=point(x,y);ctx.beginPath();ctx.arc(px,py,15+Math.sin(t*2+i)*4,0,Math.PI*2);ctx.strokeStyle=i%2?"rgba(240,154,124,.28)":"rgba(57,194,190,.28)";ctx.stroke();});
      }
      if(scene==="child") {
        ctx.fillStyle="rgba(240,154,124,.18)";
        for(let x=.08;x<.59;x+=.024)for(let y=.12;y<.88;y+=.027){if((Math.round(x*100)+Math.round(y*100))%3===0){const[px,py]=point(x,y);ctx.beginPath();ctx.arc(px,py,1.15,0,Math.PI*2);ctx.fill();}}
        const scan=(t*.15)%1;const [sx]=point(.08+scan*.51,0);ctx.fillStyle="rgba(57,194,190,.18)";ctx.fillRect(sx,0,2,h);
      }
      if(scene==="projects"&&project){
        const p=projects.find(x=>x.id===project); const locs:Record<string,[number,number]>={ridge:[.72,.51],safe:[.34,.61],framework:[.54,.45],rivers:[.46,.31],boulevards:[.40,.73],north:[.39,.19],renewal:[.27,.39]};
        const loc=locs[p?.id??"framework"]; if(loc){const[px,py]=point(...loc);ctx.beginPath();ctx.arc(px,py,19+Math.sin(t*3)*5,0,Math.PI*2);ctx.strokeStyle="rgba(57,194,190,.7)";ctx.lineWidth=2;ctx.stroke();}
      }
      if(scene==="ridge") {
        poly(ridgeBoundary.map(routePoint),true);ctx.fillStyle="rgba(68,205,193,.055)";ctx.fill();ctx.strokeStyle="rgba(151,218,171,.48)";ctx.lineWidth=1.3;ctx.setLineDash([6,6]);ctx.stroke();ctx.setLineDash([]);
        const progress=Math.min(1,(now-started)/1200);
        const drawRoute=(coords:number[][],color:string,muted:boolean)=>{const pts=coords.map(routePoint);const n=Math.max(2,Math.ceil(pts.length*progress));poly(pts.slice(0,n));ctx.strokeStyle=muted?color.replace("1)",".18)"):color;ctx.lineWidth=muted?3:5;ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor=color;ctx.shadowBlur=muted?0:12;ctx.stroke();ctx.shadowBlur=0;};
        drawRoute(axisA,"rgba(57,194,190,1)",axis==="c");drawRoute(axisC,"rgba(240,164,91,1)",axis==="a");
      }
      raf=requestAnimationFrame(draw);
    };
    raf=requestAnimationFrame(draw);
    return()=>cancelAnimationFrame(raf);
  },[scene,project,axis]);
  return <canvas ref={ref} className="city-canvas" aria-label="Схематическая карта Южно-Сахалинска"/>;
}

export default function Home(){
  const [index,setIndex]=useState(0);
  const [balanceMode,setBalanceMode]=useState<BalanceMode>("strengths");
  const [selectedProject,setSelectedProject]=useState("ridge");
  const [childTab,setChildTab]=useState<ChildTab>("scale");
  const [ridgeTab,setRidgeTab]=useState<RidgeTab>("role");
  const [axis,setAxis]=useState<Axis>("all");
  const [sourceOpen,setSourceOpen]=useState(false);
  const current=scenes[index];

  const go=useCallback((next:number)=>setIndex(Math.max(0,Math.min(scenes.length-1,next))),[]);
  const toggleFullscreen=useCallback(()=>{if(document.fullscreenElement)document.exitFullscreen?.();else document.documentElement.requestFullscreen?.();},[]);

  useEffect(()=>{
    const onKey=(e:KeyboardEvent)=>{
      if(["ArrowRight","ArrowDown"," ","PageDown"].includes(e.key)){e.preventDefault();go(index+1);}
      if(["ArrowLeft","ArrowUp","PageUp"].includes(e.key)){e.preventDefault();go(index-1);}
      if(e.key==="Home"||e.key.toLowerCase()==="h")go(0);
      if(e.key==="End")go(scenes.length-1);
      if(e.key.toLowerCase()==="f")toggleFullscreen();
      if(e.key==="Escape"){setSourceOpen(false);setAxis("all");}
      const n=Number(e.key);if(n>=1&&n<=6)go(n-1);
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[go,index,toggleFullscreen]);

  const selected=useMemo(()=>projects.find(x=>x.id===selectedProject)??projects[0],[selectedProject]);
  return <main className={`mayor-show scene-${current.id}`}>
    <CityCanvas scene={current.id} project={selectedProject} axis={axis}/>
    <div className="noise"></div><div className="edge-shade"></div>
    <header className="show-header">
      <div className="brand brand-lockup" aria-label="Южно-Сахалинск, АСИ и АТРЭ">
        <img className="city-crest" src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Coat%20of%20Arms%20of%20Yuzhno-Sakhalinsk.svg" alt="Герб Южно-Сахалинска" draggable={false} />
        <strong className="city-brand">ЮЖНО-САХАЛИНСК</strong>
        <i className="partner-sep">×</i>
        <span className="asi-lockup" aria-label="Агентство стратегических инициатив">
          <span className="asi-mark" aria-hidden="true"><i></i><i></i><i></i></span><b>АСИ</b>
        </span>
        <i className="partner-sep">×</i>
        <span className="atre-lockup" aria-label="Агентство трансформации и развития экономики">
          <img className="atre-logo" src="https://agencytde.ru/assets/images/svg/logo-full.svg" alt="АТРЭ" draggable={false} />
        </span>
      </div>
      <nav className="chapter-rail" aria-label="Сцены презентации">
        {scenes.map((s,i)=><div className="chapter-step" key={s.id}>
          <button className={i===index?"active":""} onClick={()=>go(i)} aria-current={i===index?"step":undefined}>
            <span>{String(i+1).padStart(2,"0")}</span><b>{s.label}</b>
          </button>
          {i<scenes.length-1&&<i aria-hidden="true">→</i>}
        </div>)}
      </nav>
      <div className="header-downloads">
        <a className="report-download" href="/Сводная_справка_Южно-Сахалинск_2016-2025.pdf" download><span>Скачать отчёт</span><i aria-hidden="true">↓</i></a>
        <a className="report-download data-download" href="/Данные_и_KML_Зеленый_хребет.zip" download><span>Скачать данные и KML</span><i aria-hidden="true">↓</i></a>
      </div>
    </header>

    <section className="scene-wrap" key={current.id}>
      {current.id==="cover"&&<Cover go={go}/>} 
      {current.id==="balance"&&<Balance mode={balanceMode} setMode={setBalanceMode}/>} 
      {current.id==="projects"&&<ProjectPortfolio selected={selected} setSelected={setSelectedProject} go={go}/>} 
      {current.id==="child"&&<ChildDetail tab={childTab} setTab={setChildTab}/>} 
      {current.id==="ridge"&&<RidgeDetail tab={ridgeTab} setTab={setRidgeTab} axis={axis} setAxis={setAxis}/>} 
    </section>

    {sourceOpen&&<SourceDrawer close={()=>setSourceOpen(false)}/>} 
  </main>;
}

function Cover({go}:{go:(n:number)=>void}){return <div className="cover-layout"><div className="cover-copy"><h1>От данных<br/>о здоровье —<br/><em>к проектам города</em></h1><p>Результаты апробации Стандарта здоровьеформирующей среды в Южно‑Сахалинске</p><div className="cover-actions"><button className="primary" onClick={()=>go(1)}>Начать показ <span>→</span></button><button onClick={()=>go(4)}>Сразу к флагману</button></div></div><div className="cover-orbit"><div className="orbit one"><span className="orbit-label">СРЕДА</span></div><div className="orbit two"><span className="orbit-label">ЗДОРОВЬЕ</span></div><div className="orbit three"><span className="orbit-label">ПРОЕКТЫ</span>{[1,2,3,4,5].map((number,i)=><i className={`project-node p${i+1}`} key={number}><small>{number}</small></i>)}</div><div className="orbit-core"><b>5</b><span>проектных решений</span><small>для Южно-Сахалинска</small></div></div></div>}

function Balance({mode,setMode}:{mode:BalanceMode;setMode:(x:BalanceMode)=>void}){
  const cards=mode==="strengths"?strengths:tensions;
  return <div className={`balance-layout ${mode}`}>
    <div className="balance-head"><div className="eyebrow">01 · ПОРТРЕТ ГОРОДА · 2016–2025</div><h2>Южно‑Сахалинск сегодня.<br/><em>Что поддерживает здоровье —<br/>и что требует изменений.</em></h2></div>
    <div className="balance-toggle" role="tablist"><button className={mode==="strengths"?"active":""} onClick={()=>setMode("strengths")}><span>01</span>Факторы поддержки здоровья</button><button className={mode==="tensions"?"active warm":""} onClick={()=>setMode("tensions")}><span>02</span>Направления для роста</button></div>
    <div className={`balance-groups ${mode}`}>{balanceGroups.map(group=><section className={`balance-group group-${group.id}`} key={group.id}><header><span>{group.number}</span><b>{group.label}</b></header><div>{cards.filter(c=>c.group===group.id).map((c,i)=><article key={c.label}><span>{group.number}.{i+1}</span><b>{c.value} <small>{c.unit}</small></b><h3>{c.label}</h3><p>{c.note}</p></article>)}</div></section>)}</div>
    <div className={`balance-conclusion ${mode}`}><b>ВЫВОД ПО ДАННЫМ</b><span>{mode==="strengths"?"У города сформирован набор защитных факторов здоровья: бедность снизилась почти вдвое, 89,7% жителей занимаются спортом, 99,8% питьевой воды соответствует нормативам, а площадь озеленённых территорий выросла на 918 га. Вовлечённость населения в занятия спортом, качественная система медпомощи и родовспоможения, полностью закрытая очередь семей на расселение из аварийного фонда, рост площади озеленения и высокое качество питьевой воды поддерживают здоровье горожан. Экономический рост создаёт ресурс для закрепления этих преимуществ.":"Главные точки напряжения — климатические риски при недостаточной инженерной защите, зимнее качество воздуха и детский травматизм. Они усиливаются старением населения, ростом общей заболеваемости взрослых, инвалидности трудоспособного населения и площади непроницаемых покрытий."}</span></div>
  </div>;
}

function ProjectPortfolio({selected,setSelected,go}:{selected:typeof projects[number];setSelected:(x:string)=>void;go:(n:number)=>void}){
  return <div className="projects-layout">
    <div className="projects-head"><div><div className="eyebrow">02 · ПРЕДЛАГАЕМЫЕ ПРОЕКТЫ</div><h2>Пять проектов.<br/><em>Одна система изменений.</em></h2></div><p>Наведите на проект, чтобы увидеть задачу и ожидаемый результат.</p></div>
    <div className="project-mosaic">
      {projects.map((p,i)=><button
        key={p.id}
        className={`project-tile ${selected.id===p.id?"selected":""} ${i<2?"flagship":"system"}`}
        onMouseEnter={()=>setSelected(p.id)}
        onFocus={()=>setSelected(p.id)}
        onClick={()=>p.scene!==undefined?go(p.scene):setSelected(p.id)}
      >
        <div className="tile-top"><span>{p.no}</span><small>{p.type}</small></div>
        <div className="tile-base"><h3>{p.name}</h3><p>{p.essence}</p></div>
        <div className="tile-more">
          <div><small>ЗАДАЧА</small><p>{p.problem}</p></div>
          <div><small>РЕЗУЛЬТАТ</small><p>{p.output}</p></div>
          <span>{p.scene!==undefined?"ДЕТАЛИ ПРОЕКТА →":"СИСТЕМНЫЙ ПРОЕКТ"}</span>
        </div>
      </button>)}
    </div>
  </div>;
}

function ChildDetail({tab,setTab}:{tab:ChildTab;setTab:(x:ChildTab)=>void}){
  return <div className={`detail-layout child-detail child-${tab === "cost" ? "loss" : tab}`}>
    <div className="detail-title"><div className="eyebrow warm">03 · ФЛАГМАН 01</div><h2>Безопасный город <em>для детей</em></h2><p>Не медицинская кампания, а городская программа снижения числа травм.</p></div>
    <div className="detail-panel">
      <div className="detail-tabs child-tabs"><button className={tab==="scale"?"active":""} onClick={()=>setTab("scale")}>ТЕКУЩАЯ СИТУАЦИЯ</button><button className={tab==="cost"?"active":""} onClick={()=>setTab("cost")}>ТЕКУЩИЕ ПОТЕРИ</button><button className={tab==="program"?"active":""} onClick={()=>setTab("program")}>ПРОЕКТНЫЕ ПРЕДЛОЖЕНИЯ</button></div>
      {tab==="scale"&&<div className="child-situation child-scroll">
        <div className="section-lead"><b>Здоровье детей ухудшается, а травматизм стал самым тревожным трендом</b><span>Дети 0–14 лет · динамика 2016–2025</span></div>
        <div className="situation-metrics"><article><b>2 617</b><span>общая заболеваемость на 1 000</span><em>Рост на 24,2% с 2016 года</em></article><article><b>2 409</b><span>первичная заболеваемость на 1 000</span><em>Рост на 22,6% с 2016 года</em></article><article><b>≈75%</b><span>болезни органов дыхания · основной вклад в первичную заболеваемость</span><em>С 1 445 до 1 801 на 1 000 детей · 2016–2025</em></article><article className="critical"><b>265,4</b><span>травмы на 1 000 детей</span><em>В 8 раз выше уровня 2016 года</em></article></div>
        <div className="trend-strip"><div><b>+133%</b><span>эндокринные болезни</span><small>2025 к 2024 году · 8,3 на 1 000</small></div><div><b>+178%</b><span>ожирение</span><small>2025 к 2024 году · 2,5 на 1 000</small></div><div><b>+133%</b><span>бронхиальная астма</span><small>2025 к 2024 году · 0,7 на 1 000</small></div><div><b>+40%</b><span>дети с инвалидностью</span><small>с 1 843 до 2 512 · 2016–2025</small></div></div>
        <div className="injury-story"><div className="injury-main"><b>1 300 → 8 391</b><span>случаев детского травматизма</span><p>Ускорение началось с 2021 года; наиболее резкий скачок пришёлся на 2022–2023 годы.</p></div><div><b>192,7 / 109,9</b><span>случаев травм на 1 000 детей · Южно‑Сахалинск / Россия</span><p>Сравнение за 2023 год: городской уровень почти вдвое выше среднероссийского. В 2025 году уровень детского травматизма в городе достиг 265,4 случая на 1 000 детей.</p></div><div><b>3 810</b><span>случаев падений среди детей в 2025 году</span><p>Это около 45% всего детского травматизма. Транспортные травмы выросли с 7 случаев в 2020 году до 101 в 2025 году. Также растёт число ожогов: с 79 случаев в 2016 году до 145 в 2025 году, однако их вклад остаётся небольшим.</p></div></div>
      </div>}
      {tab==="cost"&&<div className="child-losses child-scroll">
        <div className="loss-head"><div><span>СОВОКУПНЫЕ ДЕНЕЖНЫЕ ПОТЕРИ ЗА ГОД · РАСЧЁТНЫЙ 2024 ГОД</span><b>122,1 млн ₽</b></div><p>Это не только расходы системы здравоохранения, а ежегодная цена травм для семей, работодателей и городской экономики.</p></div>
        <div className="loss-bar"><i style={{width:"24.7%"}}><b>30,1</b><span>млн ₽ · прямые медицинские затраты</span></i><em style={{width:"75.3%"}}><b>92,0</b><span>млн ₽ · снижение оплаты труда из‑за больничных по уходу за ребёнком и отгулов для посещения медучреждений</span></em></div>
        <div className="loss-metrics"><article><b>24,6 тыс.</b><span>детей возрастной группы 0–14 лет в расчётной городской когорте</span></article><article><b>7 159</b><span>уникальных травмированных детей — около 29%, почти каждый третий</span></article><article><b>12,2 тыс.</b><span>человеко-дней медицинских контактов: визиты и дни госпитализации</span></article><article><b>49 лет</b><span>суммарное количество лет здоровой жизни, утраченных из‑за нарушений здоровья, не приводящих к смертельному исходу</span></article></div>
        <div className="loss-detail"><section><b>МОДЕЛЬНЫЕ ПАРАМЕТРЫ РАСЧЁТА ПОТЕРЬ</b><p><strong>≈3,6 тыс.</strong> амбулаторных и травмпунктовых визитов · <strong>≈1,4 тыс.</strong> госпитализаций · <strong>≈215</strong> вызовов скорой.</p><p><strong>Структура повреждений и травм:</strong> 45% — ушибы и раны, 3% — ожоги, 20% — переломы, 12% — прочие виды травм.</p></section><section><b>ОБЪЁМ РАСХОДОВ СИСТЕМЫ ЗДРАВООХРАНЕНИЯ</b><p><strong>26,3 млн ₽</strong> — стационар · <strong>3,4 млн ₽</strong> — амбулаторная помощь · <strong>0,5 млн ₽</strong> — скорая.</p><p>В среднем совокупный денежный ущерб составляет около <strong>17,1 тыс. ₽</strong> на одного травмированного ребёнка.</p></section></div>
        <div className="loss-conclusions"><article><span>МАСШТАБ</span><b>Не отдельные инциденты</b><p>Почти каждый третий ребёнок получает хотя бы одну непреднамеренную травму. При такой частоте ущерб воспроизводится ежегодно.</p></article><article><span>ГЛАВНАЯ СКРЫТАЯ ЦЕНА</span><b>Три четверти потерь — вне медицины</b><p>Основная сумма возникает из-за отгулов, ухода, срывов рабочих графиков и недополученного трудового вклада родителей.</p></article><article className="accent"><span>УПРАВЛЕНЧЕСКИЙ ВЫВОД</span><b>Снижать число травм</b><p>Наибольший эффект дадут профилактика, безопасный дизайн дворов и маршрутов, зимнее содержание и снижение транспортных и бытовых рисков.</p></article></div>
        <p className="data-note">Нулевая смертность в расчётной модели не означает лёгкого ущерба. 49 YLD показывают накопленное снижение качества жизни: множество коротких ограничений складываются в измеримое бремя для здоровья и будущего человеческого капитала.</p>
      </div>}
      {tab==="program"&&<div className="child-proposals child-scroll"><div className="proposal-hero"><span>ЦЕЛЬ ПРОГРАММЫ</span><b>Снизить число травм, меняя правила и конкретные элементы городской среды</b></div><div className="proposal-grid"><article className="pitbike"><span>01 · НЕМЕДЛЕННАЯ МЕРА</span><b>Ограничить питбайки</b><p>Инициировать перевод питбайков в разряд регистрируемых транспортных средств с обязательной постановкой на учёт, получением водительского удостоверения и запретом управления несовершеннолетними. До изменения регулирования — запретить эксплуатацию детьми на дорогах, во дворах, парках и иных территориях общего пользования, определить легальные специализированные площадки и усилить контроль.</p></article><article><span>02 · ДАННЫЕ О ТРАВМАТИЗМЕ</span><b>Единый реестр травм</b><p>Регистрировать в обезличенном виде случай, место, время, обстоятельства и тип повреждения. Выявить основные места скопления детей и основные маршруты передвижения по городу в часы пик; регулярно обновлять карту рисков.</p></article><article><span>03 · БЕЗОПАСНЫЕ МАРШРУТЫ</span><b>Школа — двор — секция</b><p>Аудит переходов, скоростей, освещения, обзора, остановок и зимнего содержания. Создать объекты инфраструктуры для замедления скорости, островки безопасности, освещение и устранить слепые зоны.</p></article><article><span>04 · ПАДЕНИЯ</span><b>Среда без скрытых рисков</b><p>Проверка покрытий, лестниц, горок, спортивных площадок, наледи и перепадов высот. Приоритет — территориям, где концентрируются падения.</p></article><article><span>05 · УПРАВЛЕНИЕ</span><b>Пилоты и городской стандарт</b><p>Выбрать 3–5 пилотных территорий по травматизму детей, назначить владельцев решений, реализовать микропроекты и закрепить требования в стандарте благоустройства и эксплуатации.</p></article><article><span>06 · РЕЗУЛЬТАТ</span><b>Измерять не только работы, но и травматизм</b><p>Оценивать не только работы по благоустройству, но и показатели травматизма: первые обращения, падения, транспортные травмы, повторные точки риска, сроки устранения дефектов и динамику по пилотным территориям.</p></article></div><div className="truth-note"><b>ПЕРВЫЙ ПРОДУКТ</b><span>Паспорт пилотных территорий: где и почему травмируются дети, какая мера нужна, кто отвечает, сколько она стоит и как измеряется эффект.</span></div></div>}
    </div>
  </div>;
}

function ModelRidgeMap(){
  const ref=useRef<HTMLCanvasElement>(null);
  const stops=[
    {x:"40%",y:"87.4%",img:"/ridge-stops/stop-1.jpg",name:"Южный вход",note:"Обзор города у горы Плоской"},
    {x:"49%",y:"62%",img:"/ridge-stops/stop-2.jpg",name:"Ботанический сад",note:"Лесной участок городской оси"},
    {x:"50.5%",y:"53%",img:"/ridge-stops/stop-3.jpg",name:"Переход через ручей",note:"Настил и защищённый водопропуск"},
    {x:"48.7%",y:"35%",img:"/ridge-stops/stop-4.jpg",name:"Парк Гагарина",note:"Водный узел и выход к городу"},
    {x:"28%",y:"15.5%",img:"/ridge-stops/stop-5.jpg",name:"Уюновка",note:"Северный вход и выход на хребет"},
  ];
  useEffect(()=>{
    const canvas=ref.current,ctx=canvas?.getContext("2d");if(!canvas||!ctx)return;
    let raf=0;
    const path=(coords:number[][])=>{ctx.beginPath();coords.forEach(([x,y],i)=>{const px=x*canvas.clientWidth,py=y*canvas.clientHeight;if(i){ctx.lineTo(px,py)}else{ctx.moveTo(px,py)}});};
    // Геометрия повторяет предварительную трассировку KML: ось A идёт вдоль
    // восточной границы города и в северной части загибается обратно на запад.
    const routeA=[[.400,.874],[.483,.784],[.522,.739],[.528,.708],[.519,.665],[.499,.660],[.501,.645],[.489,.619],[.509,.573],[.505,.530],[.520,.498],[.519,.465],[.508,.428],[.487,.350],[.489,.331],[.475,.302],[.447,.271],[.356,.217],[.280,.155],[.269,.135]];
    const routeC=[[.269,.135],[.407,.139],[.472,.152],[.526,.202],[.554,.208],[.577,.220],[.669,.267],[.688,.308],[.716,.333],[.747,.364],[.761,.386],[.766,.396],[.773,.405]];
    const draw=(now:number)=>{const rect=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,2);if(canvas.width!==Math.round(rect.width*dpr)||canvas.height!==Math.round(rect.height*dpr)){canvas.width=Math.round(rect.width*dpr);canvas.height=Math.round(rect.height*dpr)}ctx.setTransform(dpr,0,0,dpr,0,0);const w=rect.width,h=rect.height;ctx.clearRect(0,0,w,h);
      const bg=ctx.createLinearGradient(0,0,w,0);bg.addColorStop(0,"#092b2f");bg.addColorStop(.37,"#123536");bg.addColorStop(.38,"#193e38");bg.addColorStop(1,"#315440");ctx.fillStyle=bg;ctx.fillRect(0,0,w,h);
      // Реальная планировочная логика: городская сетка к западу, граница застройки
      // вдоль восточного склона, затем предгорье и Сусунайский хребет.
      ctx.fillStyle="rgba(226,236,232,.055)";ctx.fillRect(0,0,w*.37,h);
      const road=(pts:number[][],major=false)=>{path(pts);ctx.strokeStyle=major?"rgba(231,240,236,.28)":"rgba(211,232,226,.14)";ctx.lineWidth=major?1.8:1;ctx.stroke()};
      [.075,.145,.215,.285,.345].forEach((x,i)=>road([[x,.08],[x+(i%2?.008:-.004),.95]],i===2));
      [.19,.31,.43,.56,.69,.82,.92].forEach((y,i)=>road([[.02,y],[.37,y+(i%2?.008:-.004)]],i===3));
      road([[.035,.72],[.12,.68],[.21,.67],[.29,.61],[.37,.6]],true);
      ctx.fillStyle="rgba(228,238,229,.105)";for(let row=0;row<6;row++)for(let col=0;col<5;col++){const x=.045+col*.065+(row%2)*.007,y=.22+row*.115,bw=.025+(col%2)*.008,bh=.038+(row%3)*.012;ctx.fillRect(w*x,h*y,w*bw,h*bh)}
      // Реки Уюновка, Рогатка и Еланька помогают узнавать положение маршрута.
      const river=(y:number,bend:number)=>{ctx.beginPath();ctx.moveTo(w*.02,h*y);ctx.bezierCurveTo(w*.18,h*(y-bend),w*.31,h*(y+bend),w*.48,h*(y-.02));ctx.strokeStyle="rgba(97,184,196,.42)";ctx.lineWidth=1.5;ctx.stroke()};river(.18,.025);river(.43,.035);river(.79,.03);
      ctx.beginPath();ctx.moveTo(w*.365,0);ctx.bezierCurveTo(w*.34,h*.28,w*.405,h*.56,w*.375,h);ctx.strokeStyle="rgba(126,207,190,.5)";ctx.lineWidth=2.3;ctx.stroke();
      const mountain=(base:number,peak:number,color:string)=>{ctx.fillStyle=color;ctx.beginPath();ctx.moveTo(w*.38,h);ctx.lineTo(w*.48,h*base);ctx.lineTo(w*.57,h*peak);ctx.lineTo(w*.66,h*(base-.1));ctx.lineTo(w*.75,h*(peak+.02));ctx.lineTo(w*.86,h*(base-.08));ctx.lineTo(w,h*(peak+.08));ctx.lineTo(w,h);ctx.closePath();ctx.fill()};mountain(.7,.24,"rgba(61,108,78,.34)");mountain(.86,.43,"rgba(34,77,59,.66)");
      ctx.strokeStyle="rgba(218,235,219,.16)";ctx.lineWidth=.9;for(let i=0;i<14;i++){ctx.beginPath();for(let p=0;p<=1;p+=.025){const x=w*(.4+p*.65),y=h*(.1+i*.057+Math.sin(p*9+i*.6)*.015);if(p){ctx.lineTo(x,y)}else{ctx.moveTo(x,y)}}ctx.stroke()}
      const park=(x:number,y:number,r:number)=>{ctx.fillStyle="rgba(105,163,108,.2)";ctx.beginPath();ctx.arc(w*x,h*y,Math.min(w,h)*r,0,Math.PI*2);ctx.fill()};park(.31,.36,.06);park(.30,.58,.045);park(.28,.14,.04);
      path(routeA);ctx.strokeStyle="rgba(57,194,190,.2)";ctx.lineWidth=13;ctx.stroke();path(routeA);ctx.strokeStyle="#62d8d0";ctx.lineWidth=4.5;ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor="#39c2be";ctx.shadowBlur=12;ctx.stroke();ctx.shadowBlur=0;
      path(routeC);ctx.strokeStyle="rgba(240,164,91,.22)";ctx.lineWidth=11;ctx.stroke();path(routeC);ctx.strokeStyle="#f0a45b";ctx.lineWidth=3.5;ctx.setLineDash([8,6]);ctx.lineDashOffset=-(now/70)%14;ctx.stroke();ctx.setLineDash([]);
      ctx.font="700 13px Manrope, sans-serif";ctx.fillStyle="rgba(243,241,231,.9)";ctx.fillText("ЮЖНО-САХАЛИНСК",w*.045,h*.105);ctx.fillStyle="rgba(170,216,179,.94)";ctx.fillText("СУСУНАЙСКИЙ ХРЕБЕТ",w*.67,h*.105);
      ctx.font="600 10px Manrope, sans-serif";ctx.fillStyle="rgba(205,220,215,.8)";ctx.fillText("просп. Мира",w*.19,h*.955);ctx.fillText("ул. Горького",w*.285,h*.955);ctx.fillText("просп. Победы",w*.05,h*.55);ctx.fillStyle="rgba(133,202,211,.88)";ctx.fillText("р. Уюновка",w*.08,h*.17);ctx.fillText("р. Рогатка",w*.16,h*.42);ctx.fillText("р. Еланька",w*.18,h*.78);
      ctx.fillStyle="rgba(181,222,188,.9)";ctx.fillText("ПАРК ГАГАРИНА",w*.19,h*.34);ctx.fillText("БОТАНИЧЕСКИЙ САД",w*.18,h*.61);ctx.font="700 11px Manrope, sans-serif";ctx.fillStyle="rgba(188,217,199,.86)";ctx.fillText("ГОРОД",w*.08,h*.985);ctx.fillText("ПРЕДГОРЬЕ",w*.4,h*.985);ctx.fillText("ГОРЫ",w*.79,h*.985);ctx.fillStyle="#6ce3db";ctx.fillText("ОСЬ A · 8,68 КМ",w*.27,h*.91);ctx.fillStyle="#f5ad68";ctx.fillText("ОСЬ C · 3,83 КМ",w*.68,h*.46);ctx.font="600 9px Manrope, sans-serif";ctx.fillText("предлагается дополнительный нижний вход",w*.68,h*.49);
      raf=requestAnimationFrame(draw);
    };raf=requestAnimationFrame(draw);return()=>cancelAnimationFrame(raf);
  },[]);
  return <div className="model-ridge-map"><canvas ref={ref} className="model-map-canvas" aria-label="Модельная карта трассы Зелёного хребта"/><div className="model-map-key"><b>ЗЕЛЁНЫЙ ХРЕБЕТ</b><span>12,51 км · две связанные оси</span></div>{stops.map((s,i)=><button className={`model-stop stop-${i+1}`} style={{left:s.x,top:s.y}} key={s.name} aria-label={`${s.name}: ${s.note}`}><img src={s.img} alt=""/><span>{String(i+1).padStart(2,"0")}</span><div><img src={s.img} alt={s.name}/><b>{s.name}</b><small>{s.note}</small></div></button>)}</div>;
}

function RidgeDetail({tab,setTab}:{tab:RidgeTab;setTab:(x:RidgeTab)=>void;axis:Axis;setAxis:(x:Axis)=>void}){
  const [mapMode,setMapMode]=useState<"model"|"yandex">("model");
  const [showScenarios,setShowScenarios]=useState(false);
  useEffect(()=>{if(!showScenarios)return;const close=(event:KeyboardEvent)=>{if(event.key==="Escape")setShowScenarios(false)};window.addEventListener("keydown",close);return()=>window.removeEventListener("keydown",close)},[showScenarios]);
  const yandexEmbed="https://yandex.ru/map-widget/v1/?um=constructor%3A64a6cacd374c5fc141358cf1d3def01f29173d8b31de32155eb089743299ad47&source=constructor";
  return <div className="detail-layout ridge-detail ridge-map-layout">
    <section className="ridge-map-shell" aria-label="Интерактивная карта Зелёного хребта">
      <div className="ridge-map-frame">{mapMode==="model"?<ModelRidgeMap/>:<iframe src={yandexEmbed} title="Зелёный хребет — интерактивная карта трассировки" loading="eager" allowFullScreen></iframe>}</div>
      <div className="map-mode-switch" role="tablist" aria-label="Вид карты"><button className={mapMode==="model"?"active":""} onClick={()=>setMapMode("model")}>МОДЕЛЬНАЯ КАРТА</button><button className={mapMode==="yandex"?"active":""} onClick={()=>setMapMode("yandex")}>ЯНДЕКС КАРТА</button></div>
    </section>
    <div className="detail-panel ridge-info">
      <div className="ridge-panel-title"><div className="eyebrow">04 · ФЛАГМАН 02</div><button className="scenario-open" onClick={()=>setShowScenarios(true)}>СЦЕНАРИИ ИСПОЛЬЗОВАНИЯ ТРОПЫ <span>↗</span></button><h2>Зелёный <em>хребет</em></h2><p>Природно‑рекреационный каркас, который связывает маршрут, воду, лес и экономику.</p></div>
      <div className="detail-tabs four"><button className={tab==="role"?"active":""} onClick={()=>setTab("role")}>РОЛЬ</button><button className={tab==="route"?"active":""} onClick={()=>setTab("route")}>ТРАССА</button><button className={tab==="economy"?"active":""} onClick={()=>setTab("economy")}>ЭКОНОМИКА</button><button className={tab==="conditions"?"active":""} onClick={()=>setTab("conditions")}>УСЛОВИЯ</button></div>
      {tab==="role"&&<div className="ridge-role"><div className="mega"><b>4 функции</b><span>одного городского проекта</span></div><div className="role-grid"><article><span>01</span><b>Связность</b><p>Уюновка, парк Гагарина, Ботанический сад, площади Победы и Славы, улица Больничная.</p></article><article><span>02</span><b>Рекреация</b><p>Круглогодичный городской туристический маршрут.</p></article><article><span>03</span><b>Селезащита</b><p>Локальный перехват стока, водоотвод, укреплённые переходы и противоэрозионные меры.</p></article><article><span>04</span><b>Экономика</b><p>Связный туристический продукт увеличивает время пребывания и спрос на городские услуги.</p></article></div></div>}
      {tab==="route"&&<div className="ridge-route"><div className="mega"><b>12,51 км</b><span>две оси по обновлённой трассировке</span></div><div className="axis-cards"><article><span>ОСЬ A · ГОРОДСКАЯ</span><b>8,68 км</b><p>21,69 тыс. м² покрытия · 289 опор света · 6,07 км свейлов · 10 запруд · 10 выявленных пересечений.</p></article><article className="orange"><span>ОСЬ C · ГРЕБНЕВАЯ</span><b>3,83 км</b><p>Грунтовая тропа · 77 водоотводов · 2 видовые площадки · спортивный и мониторинговый маршрут.</p></article></div><div className="capacity"><b>5 358 м³</b><span>эффективная инженерная ёмкость за дождь</span><em>Это локальная стабилизация, а не защита города от всего тайфунного стока.</em></div></div>}
      {tab==="economy"&&<div className="ridge-economy"><div className="capex"><span>ПОЛНЫЙ CAPEX · ЦЕНЫ 2026</span><b>314,2–782,7 млн ₽</b><small>Разница определяется стоимостью материалов и работ · эксплуатация: 18,0–40,2 млн ₽ в год</small></div><div className="econ-grid"><article><span>СЕЛЕЗАЩИТА · БАЗОВЫЙ СЦЕНАРИЙ</span><b>+232,0 млн ₽</b><p>NPV · BCR 1,78 · чистый эффект 49,44 млн ₽/год</p></article><article><span>ВКЛАД ТРОПЫ · 2030</span><b>133,0 млн ₽</b><p>вклад тропы в ВДС за год · прямые расходы 86,9 млн ₽</p></article><article><span>БЮДЖЕТ ГОРОДА · 2030</span><b>6,2 млн ₽/год</b><p>расчётный вклад тропы в бюджет города</p></article></div><aside className="ridge-estimate-note"><b>ГРАНИЦА ПРИМЕНИМОСТИ ОЦЕНКИ</b><p>Текущие результаты являются оценкой порядка величины. Они не заменяют проектно-сметную документацию, гидрологическое моделирование и официальную оценку ущерба. Смета, эксплуатация и геометрия трасс, экономика селезащиты (ущерб, NPV, BCR) рассчитаны по состоянию на 13.08.2026.</p></aside></div>}
      {tab==="conditions"&&<div className="ridge-conditions"><div className="conditions-heading"><span>ДО ПРИНЯТИЯ ИНВЕСТИЦИОННОГО РЕШЕНИЯ НЕОБХОДИМО</span><b>Условия перехода<br/>к проектированию</b></div><ol className="conditions-list"><li>Построить цифровую модель рельефа, карту уклонов, водоразделов и линий концентрации стока.</li><li>Провести инженерно‑геологические, гидрологические и лесопатологические изыскания.</li><li>Скорректировать ось C по фактическому водоразделу и исключить пересечение верховьев Рогатки.</li><li>Проверить все переходы оси A и определить фактическое число мостов и водопропусков.</li><li>Рассчитать пиковые расходы, пропускную способность сооружений, время опорожнения свейлов и перенос риска вниз по склону.</li><li>Сформировать отдельный бюджет лесовосстановления и последующего содержания.</li><li>Пересчитать ущерб по взаимоисключающим классам событий, исключив пересечения групп.</li><li>Уточнить нормативы налоговых отчислений и региональные туристические мультипликаторы.</li><li>Провести обследование туристических потоков и подтвердить модельные параметры вклада тропы: доли пользователей, дополнительные расходы и эффект продления пребывания.</li><li>Предусмотреть мониторинг осадков, уровня воды, наносов, деформаций и посещаемости после реализации пилотного участка.</li></ol></div>}
    </div>
    <section className="ridge-conclusions" aria-label="Выводы по проекту Зелёный хребет"><div className="ridge-conclusions-title"><span>ИТОГОВАЯ ОЦЕНКА</span><b>Выводы</b></div><div className="ridge-conclusion-grid"><article><span>01 · СЕЛЕЗАЩИТА</span><p>Экономически оправдана в базовом сценарии. До проектирования необходимо откалибровать ущерб, частоты событий и эффективность по гидрологической модели. Расчётный ущерб — <strong>от 42 до 585 млн ₽</strong> в зависимости от события: сильный дождь, крупный ливень или тайфун.</p></article><article><span>02 · РЕКРЕАЦИЯ</span><p>Оптимальное сочетание рекреационной и туристической функций обеспечивает расчётный вклад тропы в бюджет города — <strong>6,2 млн ₽ в год</strong>. Оценка требует верификации обследованиями турпотока.</p></article><article><span>03 · СОВМЕСТНАЯ РЕАЛИЗАЦИЯ</span><p>Рациональнее разрозненных объектов: мосты, водоотвод, укрепление склонов, тропы и навигация одновременно работают на безопасность, доступность и туристический продукт.</p></article><article><span>04 · ЭКСПЛУАТАЦИЯ</span><p><strong>18,0–40,2 млн ₽ в год.</strong> Снегоуборку, последствия тайфунов и обязательную очистку селезащиты нужно заложить в бюджет содержания с момента запуска.</p></article><article><span>05 · ЛЕСОВОССТАНОВЛЕНИЕ</span><p>Должно стать самостоятельным финансируемым блоком. Без леса инженерные сооружения не обеспечат значимое сокращение тайфунного стока.</p></article></div></section>
    {showScenarios&&<div className="trail-scenarios-backdrop" role="presentation" onMouseDown={(event)=>{if(event.target===event.currentTarget)setShowScenarios(false)}}><section className="trail-scenarios-modal" role="dialog" aria-modal="true" aria-labelledby="trail-scenarios-title"><header><div><span>ЗЕЛЁНЫЙ ХРЕБЕТ · СЦЕНАРНАЯ МОДЕЛЬ</span><h2 id="trail-scenarios-title">Одна система.<br/><em>Два режима использования.</em></h2></div><button onClick={()=>setShowScenarios(false)} aria-label="Закрыть сценарии использования">×</button></header><div className="scenario-system"><div className="scenario-axis axis-a"><div className="axis-heading"><span>ОСЬ A · 8,68 КМ</span><b>Городской маршрут</b><small>доступный и круглогодичный</small></div><div className="season-grid"><article><span>МАЙ — ОКТЯБРЬ</span><b>Тёплый сезон</b><p>Прогулки · бег · велосипед · экскурсии · доступ к парку, Ботаническому саду и горным объектам.</p></article><article><span>НОЯБРЬ — АПРЕЛЬ</span><b>Холодный сезон</b><p>Очищаемый городской маршрут · прогулки · бег · лыжные участки вне конфликтов с пешеходами.</p></article></div><div className="axis-rule"><b>РЕЖИМ</b><span>Ось поддерживает связь города с зимним турпродуктом «Горного воздуха».</span></div></div><div className="scenario-spine"><span>ГОРОД</span><i></i><b>ЕДИНАЯ<br/>СИСТЕМА</b><i></i><span>ХРЕБЕТ</span></div><div className="scenario-axis axis-c"><div className="axis-heading"><span>ОСЬ C · 3,83 КМ</span><b>Природный маршрут</b><small>повышенная сложность</small></div><div className="season-grid"><article><span>ТЁПЛЫЙ СЕЗОН</span><b>Хребет открыт</b><p>Треккинг · трейлраннинг · организованные экскурсии · видовые маршруты. Велосипед — только на устойчивых участках.</p></article><article><span>ХОЛОДНЫЙ СЕЗОН</span><b>Управляемый доступ</b><p>Снегоступы · лыжные и спортивные маршруты — только после лавинной и метеорологической оценки.</p></article></div><div className="axis-rule warm"><b>СТОП-СЦЕНАРИЙ</b><span>Закрытие при сильных осадках, ветре, низкой видимости и угрозе склоновых процессов.</span></div></div></div><div className="scenario-metrics"><article><span>ТЁПЛЫЙ СЕЗОН</span><b>35%</b><p>иногородних туристов кластера — потенциальные пользователи тропы</p><i>эффективная доступность · 91,8%</i></article><article><span>ХОЛОДНЫЙ СЕЗОН</span><b>20%</b><p>иногородних туристов — зимние прогулки, ски-тур и снегоступинг</p><i>эффективная доступность · 96,2%</i></article><article className="effect"><span>ЭФФЕКТ ТРОПЫ · 2030</span><div><b>86,9</b><small>млн ₽<br/>прямых расходов</small></div><div><b>133,0</b><small>млн ₽<br/>полной ВДС</small></div><div><b>6,2</b><small>млн ₽<br/>в бюджет города</small></div></article></div><footer><b>УПРАВЛЕНЧЕСКИЙ ПРИНЦИП</b><span>Разделить пешеходные, велосипедные и зимние потоки; ось A содержать круглогодично, ось C переводить в сезонный режим и оперативно закрывать по погоде.</span><small>Доли пользователей и дополнительные расходы — экспертные параметры; требуется проверка обследованием турпотока.</small></footer></section></div>}
  </div>;
}

function SourceDrawer({close}:{close:()=>void}){
  return <div className="drawer"><button className="drawer-bg" onClick={close} aria-label="Закрыть"></button><aside><button className="drawer-close" onClick={close}>ЗАКРЫТЬ ×</button><div className="eyebrow">ИСТОЧНИКИ И ГРАНИЦЫ</div><h2>На чём построен показ</h2><div className="source-groups"><section><b>ОСНОВНОЙ ИСТОЧНИК · 13.08.2026</b><p>«Социально‑экономическое развитие и состояние здоровья населения г. Южно‑Сахалинска, 2016–2025 гг.»: городская статистика, смертность, заболеваемость, рекомендации и приложения по проектам.</p></section><section><b>ДЕТСКИЙ ТРАВМАТИЗМ</b><p>Уточнённые данные Минздрава Сахалинской области и расчёт потерь за базовый 2024 год: медицина, время родителей и YLD.</p></section><section><b>ЗЕЛЁНЫЙ ХРЕБЕТ</b><p>KML от 12.08.2026, расчёт стоимости и эксплуатации от 13.08.2026, модели селезащитных и туристических эффектов.</p></section><section><b>ПРОЕКТНАЯ РАМКА</b><p>Анализ мастер‑плана и концепция градоэкологического каркаса: 16 водотоков, экобульвары, Северная долина и экореновация.</p></section></div><div className="source-warning"><b>ЧЕСТНОСТЬ ИНТЕРПРЕТАЦИИ</b><p>Уточнённый ряд показывает снижение смертности взрослых от внешних причин. Карты фактических hotspots детских травм нет. Экономика тропы и селезащиты — модель порядка величины, которая требует изысканий и полевой верификации.</p></div></aside></div>;
}
