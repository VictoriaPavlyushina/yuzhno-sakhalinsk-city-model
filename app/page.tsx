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
  { id: "next", label: "Следующие шаги" },
];

const strengths = [
  { value: "317,6", unit: "млрд ₽", label: "объём экономики в 2025 году", note: "+78% к 2017 году" },
  { value: "×5,4", unit: "", label: "рост инвестиций на человека", note: "2016–2024" },
  { value: "5,2%", unit: "", label: "уровень бедности", note: "почти вдвое ниже 2016 года" },
  { value: "282,9", unit: "тыс.", label: "размещённых туристов", note: "почти вдвое больше, чем в 2016" },
  { value: "339→148", unit: "", label: "снижение числа ДТП", note: "2016–2025" },
  { value: "99,8%", unit: "", label: "питьевой воды соответствует нормам", note: "защитный фактор здоровья" },
  { value: "+918", unit: "га", label: "озеленённых территорий", note: "2019–2024" },
  { value: "89,7%", unit: "", label: "занимаются спортом", note: "2025 год" },
];

const tensions = [
  { value: "22,7%", unit: "", label: "жителей старше трудоспособного возраста", note: "+2,8 п.п. за период" },
  { value: "1 263→192", unit: "чел.", label: "сокращение естественного прироста", note: "2016–2024" },
  { value: "+2,8°C", unit: "", label: "рост среднегодовой температуры", note: "2016–2025" },
  { value: "104", unit: "мм/сутки", label: "экстремум осадков", note: "2023 год, режим ЧС" },
  { value: "55%", unit: "", label: "территории покрыто ливневой сетью", note: "износ сети — 45,5%" },
  { value: "+72%", unit: "", label: "болезни системы кровообращения", note: "заболеваемость взрослых" },
  { value: "265,4", unit: "на 1 000", label: "детский травматизм", note: "2025 год" },
  { value: "29–30", unit: "детей", label: "средняя наполняемость классов", note: "риск перегрузки школ" },
];

const projects = [
  {
    id: "ridge",
    no: "01",
    name: "Зелёный хребет",
    type: "ФЛАГМАН · РЕКРЕАЦИЯ + ЗАЩИТА",
    essence: "Маршрут, который одновременно связывает город со склонами, управляет водой и усиливает туристический продукт.",
    problem: "Связать город с восточными склонами и совместить маршрут с управлением стоком и природными рисками.",
    output: "12,51 км двух осей, входные узлы, водоотвод, переходы, лесовосстановление и туристический продукт.",
    next: "DEM и изыскания → уточнение трассы → пилот городской оси A.",
    scene: 4,
  },
  {
    id: "safe",
    no: "02",
    name: "Безопасный город для детей",
    type: "ФЛАГМАН · ЗДОРОВЬЕ + СРЕДА",
    essence: "От статистики травм — к конкретным изменениям дворов, школ, дорог и мест отдыха.",
    problem: "Почти каждый третий ребёнок получает травму, но город пока не видит адреса и обстоятельства случаев.",
    output: "Единый реестр, карта рисков, аудит среды и адресные изменения дворов, школ, дорог и зон спорта.",
    next: "Обезличенные данные → пилотные территории → стандарт безопасной среды.",
    scene: 3,
  },
  { id: "framework", no: "03", name: "Развитие градоэкологического каркаса", type: "ОБЩЕГОРОДСКАЯ СИСТЕМА", essence: "Связать природные ядра, 16 водотоков, парки, улицы и жилые районы в единую управляемую систему.", problem: "Решения мастер-плана разрознены: природные территории, водные коридоры и рекреационные маршруты не собраны в общегородскую схему и не учитывают рельеф как единую систему движения воды и природных рисков.", output: "Концепция ГЭК, общегородская схема, карта проблем и разрывов, перечень приоритетных проектов и рельефно-гидрологический атлас уклонов, водосборов, пойм, селевых бассейнов и зон подтопления.", next: "" },
  { id: "rivers", no: "04", name: "Программа ревитализации малых рек", type: "ВОДНО-ЗЕЛЁНЫЕ КОРИДОРЫ", essence: "Превратить 16 городских водотоков в систему рекреации, инженерной защиты и управления природными рисками.", problem: "Малые реки рассматриваются как отдельные объекты благоустройства, хотя они принимают сток со склонов и связывают жилые районы с природным каркасом. Для разных участков нужны разные решения — от противоселевой защиты до мягких берегов.", output: "Реестр 16 водотоков, паспорта водосборов, типология русел и набережных, 5–7 проектов первой очереди и единая схема инженерной защиты для Рогатки, Еланьки, Сусуи, Красносельской, Уюновки и ручья Придорожного.", next: "" },
  { id: "boulevards", no: "05", name: "Сеть экобульваров и зелёных улиц", type: "УЛИЦЫ + ВОДА + СВЯЗНОСТЬ", essence: "Создать улицы, которые дают тень, связывают районы и одновременно принимают, очищают и замедляют поверхностный сток.", problem: "Ключевые улицы пока не работают как элементы сине-зелёной инфраструктуры: не учитывают уклоны, снеготаяние, водосборную роль и связь с малыми реками, парками и пешеходными маршрутами.", output: "Схема сети экобульваров, типологический альбом сечений и паспорта 7–10 приоритетных улиц: проспекта Мира, улиц Сахалинской, Горького, Украинской, Ленина и других.", next: "" },
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
      <button className="brand brand-lockup" onClick={()=>go(0)} aria-label="Южно-Сахалинск, АСИ и АТРЭ — перейти в начало">
        <img className="city-crest" src="https://commons.wikimedia.org/wiki/Special:Redirect/file/Coat%20of%20Arms%20of%20Yuzhno-Sakhalinsk.svg" alt="Герб Южно-Сахалинска" />
        <strong className="city-brand">ЮЖНО-САХАЛИНСК</strong>
        <i className="partner-sep">×</i>
        <span className="asi-lockup" aria-label="Агентство стратегических инициатив">
          <span className="asi-mark" aria-hidden="true"><i></i><i></i><i></i></span><b>АСИ</b>
        </span>
        <i className="partner-sep">×</i>
        <span className="atre-lockup" aria-label="Агентство трансформации и развития экономики">
          <img className="atre-logo" src="https://agencytde.ru/assets/images/svg/logo-full.svg" alt="АТРЭ" />
        </span>
      </button>
      <nav className="chapter-rail" aria-label="Сцены презентации">
        {scenes.map((s,i)=><div className="chapter-step" key={s.id}>
          <button className={i===index?"active":""} onClick={()=>go(i)} aria-current={i===index?"step":undefined}>
            <span>{String(i+1).padStart(2,"0")}</span><b>{s.label}</b>
          </button>
          {i<scenes.length-1&&<i aria-hidden="true">→</i>}
        </div>)}
      </nav>
    </header>

    <section className="scene-wrap" key={current.id}>
      {current.id==="cover"&&<Cover go={go}/>} 
      {current.id==="balance"&&<Balance mode={balanceMode} setMode={setBalanceMode}/>} 
      {current.id==="projects"&&<ProjectPortfolio selected={selected} setSelected={setSelectedProject} go={go}/>} 
      {current.id==="child"&&<ChildDetail tab={childTab} setTab={setChildTab}/>} 
      {current.id==="ridge"&&<RidgeDetail tab={ridgeTab} setTab={setRidgeTab} axis={axis} setAxis={setAxis}/>} 
      {current.id==="next"&&<NextSteps go={go}/>} 
    </section>

    {sourceOpen&&<SourceDrawer close={()=>setSourceOpen(false)}/>} 
  </main>;
}

function Cover({go}:{go:(n:number)=>void}){return <div className="cover-layout"><div className="cover-copy"><h1>От данных<br/>о здоровье —<br/><em>к проектам города</em></h1><p>Результаты апробации Стандарта здоровьеформирующей среды</p><div className="cover-actions"><button className="primary" onClick={()=>go(1)}>Начать показ <span>→</span></button><button onClick={()=>go(4)}>Сразу к флагману</button></div></div><div className="cover-orbit"><div className="orbit one"><span className="orbit-label">СРЕДА</span></div><div className="orbit two"><span className="orbit-label">ЗДОРОВЬЕ</span></div><div className="orbit three"><span className="orbit-label">ПРОЕКТЫ</span>{["Зелёный хребет","Детская безопасность","Градоэкологический каркас","Малые реки","Экобульвары"].map((name,i)=><i className={`project-node p${i+1}`} data-project={name} key={name}><small>{i+1}</small></i>)}</div><div className="orbit-core"><b>5</b><span>проектных решений</span><small>для Южно-Сахалинска</small></div></div></div>}

function Balance({mode,setMode}:{mode:BalanceMode;setMode:(x:BalanceMode)=>void}){
  const cards=mode==="strengths"?strengths:tensions;
  return <div className={`balance-layout ${mode}`}>
    <div className="balance-head"><div className="eyebrow">01 · ПОРТРЕТ ГОРОДА · 2016–2025</div><h2>Южно‑Сахалинск растёт.<br/><em>Теперь рост должен работать<br/>на здоровье людей.</em></h2><p>У города есть экономический и природный ресурс. Главные ограничения — травматизм, хронические риски для здоровья и уязвимость природного каркаса.</p></div>
    <div className="balance-toggle" role="tablist"><button className={mode==="strengths"?"active":""} onClick={()=>setMode("strengths")}><span>01</span>Положительные характеристики</button><button className={mode==="tensions"?"active warm":""} onClick={()=>setMode("tensions")}><span>02</span>Отрицательные характеристики</button></div>
    <div className={`balance-grid ${mode}`}>{cards.map((c,i)=><article key={c.label}><span>{String(i+1).padStart(2,"0")}</span><b>{c.value} <small>{c.unit}</small></b><h3>{c.label}</h3><p>{c.note}</p></article>)}</div>
    <div className={`balance-conclusion ${mode}`}><b>{mode==="strengths"?"МОЖНО НАЧИНАТЬ":"ПЕРВЫЕ ДЕЙСТВИЯ"}</b><span>{mode==="strengths"?"Город может уже сейчас запустить два первых проекта: программу снижения детского травматизма и «Зелёный хребет».":"Сначала — снизить детский травматизм и проверить трассу «Зелёного хребта» инженерными изысканиями."}</span></div>
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
        <div className="tile-top"><span>{p.no}</span><small>{p.type}</small>{i<2&&<em>ФЛАГМАН</em>}</div>
        <div className="tile-base"><h3>{p.name}</h3><p>{p.essence}</p></div>
        <div className="tile-more">
          <div><small>ЗАДАЧА</small><p>{p.problem}</p></div>
          <div><small>РЕЗУЛЬТАТ</small><p>{p.output}</p></div>
          <span>{p.scene!==undefined?"ОТКРЫТЬ ПРОЕКТ →":"СИСТЕМНЫЙ ПРОЕКТ"}</span>
        </div>
      </button>)}
    </div>
  </div>;
}

function ChildDetail({tab,setTab}:{tab:ChildTab;setTab:(x:ChildTab)=>void}){
  return <div className="detail-layout child-detail">
    <div className="detail-title"><div className="eyebrow warm">03 · ФЛАГМАН 01</div><h2>Безопасный<br/>город <em>для детей</em></h2><p>Не медицинская кампания, а городская программа снижения числа первых травм.</p></div>
    <div className="detail-panel">
      <div className="detail-tabs"><button className={tab==="scale"?"active":""} onClick={()=>setTab("scale")}>МАСШТАБ</button><button className={tab==="cost"?"active":""} onClick={()=>setTab("cost")}>ЦЕНА</button><button className={tab==="program"?"active":""} onClick={()=>setTab("program")}>ПРОГРАММА</button></div>
      {tab==="scale"&&<div className="child-scale"><div className="mega"><b>8 391</b><span>случай травм у детей 0–14 лет · 2025</span></div><div className="metric-row"><div><b>265,4</b><span>на 1 000 детей</span></div><div><b>×8</b><span>к уровню 2016 года</span></div><div><b>3 810</b><span>падений · 45% случаев</span></div><div><b>101</b><span>транспортная травма</span></div></div><div className="benchmark"><span>2023 · НА 1 000 ДЕТЕЙ</span><div><b style={{width:"100%"}}>Южно‑Сахалинск · 192,7</b><i style={{width:"57%"}}>Россия · 109,9</i></div></div><p className="data-note">Ступенчатый рост может частично отражать изменение учёта. Но после скачка показатель продолжил расти — проблему нельзя списать только на методику.</p></div>}
      {tab==="cost"&&<div className="child-economy"><div className="mega warm-number"><b>122,1</b><span>млн ₽ совокупных потерь за год</span></div><div className="loss-bar"><i style={{width:"24.7%"}}><b>30,1</b><span>медицина</span></i><em style={{width:"75.3%"}}><b>92,0</b><span>время родителей</span></em></div><div className="impact-grid"><div><b>7 159</b><span>уникальных детей · 29% популяции</span></div><div><b>12,2 тыс.</b><span>человеко-дней медицинских контактов</span></div><div><b>49 лет</b><span>жизни с инвалидностью · YLD</span></div><div><b>3 : 1</b><span>косвенные потери к прямым</span></div></div><p className="data-note">Это ежегодный «налог небезопасности» на семьи, работодателей и здравоохранение — при нулевой смертности в расчётной модели.</p></div>}
      {tab==="program"&&<div className="child-program"><div className="program-chain">{[{n:"01",t:"Данные",p:"Обезличенный случай + место + обстоятельство"},{n:"02",t:"Карта риска",p:"Школы, дворы, дороги, спорт и рекреация"},{n:"03",t:"Аудит",p:"Причина в конкретном элементе среды"},{n:"04",t:"Микропроект",p:"Быстрое физическое изменение территории"},{n:"05",t:"Стандарт",p:"Правила для всего города и мониторинг"}].map((x,i)=><div key={x.n}><span>{x.n}</span><b>{x.t}</b><p>{x.p}</p>{i<4&&<i>→</i>}</div>)}</div><div className="program-output"><b>ПЕРВЫЙ ПРОДУКТ</b><span>Паспорт пилотных территорий: где травмируются дети, почему это происходит, какая мера нужна, кто отвечает и как измеряется эффект.</span></div><div className="truth-note"><b>ВАЖНО</b><span>Географии случаев в исходных данных нет. Любая карта hotspots до получения адресной привязки была бы выдумкой.</span></div></div>}
    </div>
  </div>;
}

function RidgeDetail({tab,setTab,axis,setAxis}:{tab:RidgeTab;setTab:(x:RidgeTab)=>void;axis:Axis;setAxis:(x:Axis)=>void}){
  const yandexMap="https://yandex.ru/maps/80/yuzhno-sakhalinsk/?ll=142.784473%2C46.949535&mode=usermaps&source=constructorLink&um=constructor%3A64a6cacd374c5fc141358cf1d3def01f29173d8b31de32155eb089743299ad47&z=12";
  const yandexEmbed="https://yandex.ru/map-widget/v1/?um=constructor%3A64a6cacd374c5fc141358cf1d3def01f29173d8b31de32155eb089743299ad47&source=constructor";
  return <div className="detail-layout ridge-detail ridge-map-layout">
    <section className="ridge-map-shell" aria-label="Интерактивная карта Зелёного хребта">
      <div className="ridge-map-head"><div><span>ИНТЕРАКТИВНАЯ КАРТА</span><b>Предварительная трассировка</b></div><a href={yandexMap} target="_blank" rel="noreferrer">ОТКРЫТЬ В ЯНДЕКС КАРТАХ ↗</a></div>
      <div className="ridge-map-frame"><iframe src={yandexEmbed} title="Зелёный хребет — интерактивная карта трассировки" loading="eager" allowFullScreen></iframe></div>
      <div className="ridge-map-footer"><div><b>12,51 км</b><span>общая длина двух осей</span></div><div><b>2 оси</b><span>городская A и гребневая C</span></div><div><b>Масштабируйте карту</b><span>перетаскивайте и открывайте объекты</span></div><a href="/ridge-routes.png" target="_blank" rel="noreferrer">ИСХОДНАЯ СХЕМА ↗</a></div>
    </section>
    <div className="detail-panel ridge-info">
      <div className="ridge-panel-title"><div className="eyebrow">04 · ФЛАГМАН 02</div><h2>Зелёный <em>хребет</em></h2><p>Природно‑рекреационный каркас, который связывает маршрут, воду, лес и экономику.</p><div className="axis-legend"><button className={axis==="all"?"active":""} onClick={()=>setAxis("all")}>ВСЯ СИСТЕМА</button><button className={axis==="a"?"active":""} onClick={()=>setAxis("a")}><i></i>ОСЬ A</button><button className={axis==="c"?"active orange":""} onClick={()=>setAxis("c")}><i></i>ОСЬ C</button></div></div>
      <div className="detail-tabs four"><button className={tab==="role"?"active":""} onClick={()=>setTab("role")}>РОЛЬ</button><button className={tab==="route"?"active":""} onClick={()=>setTab("route")}>ТРАССА</button><button className={tab==="economy"?"active":""} onClick={()=>setTab("economy")}>ЭКОНОМИКА</button><button className={tab==="conditions"?"active":""} onClick={()=>setTab("conditions")}>УСЛОВИЯ</button></div>
      {tab==="role"&&<div className="ridge-role"><div className="mega"><b>4 функции</b><span>одного городского проекта</span></div><div className="role-grid"><article><span>01</span><b>Связность</b><p>Уюновка, парк Гагарина, Ботанический сад, площади Победы и Славы, улица Больничная.</p></article><article><span>02</span><b>Рекреация</b><p>Круглогодичная городская ось, треккинг, спорт, видовые и событийные сценарии.</p></article><article><span>03</span><b>Вода и склон</b><p>Локальный перехват стока, водоотвод, укреплённые переходы и противоэрозионные меры.</p></article><article><span>04</span><b>Экономика</b><p>Связный туристический продукт увеличивает время пребывания и спрос на городские услуги.</p></article></div></div>}
      {tab==="route"&&<div className="ridge-route"><div className="mega"><b>12,51 км</b><span>две оси по обновлённой трассировке</span></div><div className="axis-cards"><article><span>ОСЬ A · ГОРОДСКАЯ</span><b>8,68 км</b><p>21,69 тыс. м² покрытия · 289 опор света · 6,07 км свейлов · 10 запруд · 10 выявленных пересечений.</p></article><article className="orange"><span>ОСЬ C · ГРЕБНЕВАЯ</span><b>3,83 км</b><p>Грунтовая тропа · 77 водоотводов · 2 видовые площадки · спортивный и мониторинговый маршрут.</p></article></div><div className="capacity"><b>5 358 м³</b><span>эффективная инженерная ёмкость за дождь</span><em>Это локальная стабилизация, а не защита города от всего тайфунного стока.</em></div></div>}
      {tab==="economy"&&<div className="ridge-economy"><div className="capex"><span>ПОЛНЫЙ CAPEX · ЦЕНЫ 2026</span><b>314,2–782,7 млн ₽</b><small>эксплуатация: 18,0–40,2 млн ₽ в год</small></div><div className="econ-grid"><article><span>СЕЛЕЗАЩИТА · БАЗОВЫЙ СЦЕНАРИЙ</span><b>+232,0 млн ₽</b><p>NPV · BCR 1,78 · чистый эффект 49,44 млн ₽/год</p></article><article><span>ВКЛАД ТРОПЫ · 2030</span><b>133,0 млн ₽</b><p>полная ВДС в год · прямые расходы 86,9 млн ₽</p></article><article><span>БЮДЖЕТ ГОРОДА · 2030</span><b>6,2 млн ₽</b><p>собственный расчётный вклад тропы в год</p></article></div><div className="truth-note"><b>ГРАНИЦА МОДЕЛИ</b><span>9,58 млрд ₽ прямых расходов относятся ко всей системе «Горный воздух» + «Долина Айна», а не к одной тропе. Вклад самой тропы рассчитан отдельно и требует проверки турпотоком.</span></div></div>}
      {tab==="conditions"&&<div className="ridge-conditions"><div className="mega"><b>7 проверок</b><span>до инвестиционного решения</span></div><ol><li>Цифровая модель рельефа, уклоны, водосборы и линии стока.</li><li>Инженерно‑геологические, гидрологические и лесопатологические изыскания.</li><li>Корректировка оси C по водоразделу — исключить верховья Рогатки.</li><li>Полевая проверка всех мостов, логов и водопропусков оси A.</li><li>Расчёт пиковых расходов и переноса риска вниз по склону.</li><li>Отдельный бюджет лесовосстановления и круглогодичного содержания.</li><li>Мониторинг осадков, наносов, деформаций и посещаемости.</li></ol><div className="warning-line"><b>0,32%</b><span>инженерной ёмкости от расчётного стока при 120 мм. Основную работу должны выполнять лес, почвы и вся система водосбора.</span></div></div>}
    </div>
  </div>;
}

function NextSteps({go}:{go:(n:number)=>void}){
  return <div className="next-layout next-v2">
    <div className="next-summary"><div className="eyebrow">05 · ИТОГИ И ДАЛЬНЕЙШИЕ ШАГИ</div><h2>Три решения,<br/><em>чтобы начать.</em></h2><p>Сейчас не требуется утверждать строительство. Нужно дать старт предпроектной работе по двум пилотам и системе измерения результатов.</p></div>
    <section className="mayor-decisions" aria-label="Решения для старта"><div className="next-section-label">РЕШЕНИЯ ДЛЯ СТАРТА</div><div className="decision-grid">
      <article><span>01</span><small>ПРИОРИТЕТЫ</small><b>Утвердить два пилота</b><p>«Безопасный город для детей» и «Зелёный хребет» — проекты первой очереди.</p></article>
      <article><span>02</span><small>ОТВЕТСТВЕННОСТЬ</small><b>Назначить владельцев</b><p>Один координатор от города и рабочие группы по каждому пилоту.</p></article>
      <article><span>03</span><small>ИСХОДНЫЕ ДАННЫЕ</small><b>Открыть данные для проектирования</b><p>Обезличенные данные о травмах, DEM, сети, участки и планы благоустройства.</p></article>
    </div></section>
    <section className="launch-plan" aria-label="План запуска"><div className="launch-plan-head"><span>ПЛАН ЗАПУСКА</span><b>От решения — к проверяемому результату</b></div><div className="launch-timeline">
      <article><span>ПЕРВЫЕ 30 ДНЕЙ</span><b>Закрепить рамку</b><p>Протокол решения, владельцы проектов, перечень данных и границы пилотов.</p></article>
      <article><span>ДО 3 МЕСЯЦЕВ</span><b>Подготовить паспорта</b><p>Карты рисков, уточнённая трасса, сценарии, стоимость и показатели эффекта.</p></article>
      <article><span>6–12 МЕСЯЦЕВ</span><b>Запустить и измерить</b><p>Первые меры детской безопасности, пилот маршрута и мониторинг результатов.</p></article>
    </div></section>
    <div className="next-action"><div><small>СЛЕДУЮЩИЙ ШАГ</small><b>Установочная рабочая сессия на 2 часа</b><p>Утвердить состав команды, периметр двух пилотов и календарный план.</p></div><button onClick={()=>go(0)}>ВЕРНУТЬСЯ В НАЧАЛО <span>↺</span></button></div>
  </div>;
}

function SourceDrawer({close}:{close:()=>void}){
  return <div className="drawer"><button className="drawer-bg" onClick={close} aria-label="Закрыть"></button><aside><button className="drawer-close" onClick={close}>ЗАКРЫТЬ ×</button><div className="eyebrow">ИСТОЧНИКИ И ГРАНИЦЫ</div><h2>На чём построен показ</h2><div className="source-groups"><section><b>ОСНОВНОЙ ИСТОЧНИК · 13.08.2026</b><p>«Социально‑экономическое развитие и состояние здоровья населения г. Южно‑Сахалинска, 2016–2025 гг.»: городская статистика, смертность, заболеваемость, рекомендации и приложения по проектам.</p></section><section><b>ДЕТСКИЙ ТРАВМАТИЗМ</b><p>Уточнённые данные Минздрава Сахалинской области и расчёт потерь за базовый 2024 год: медицина, время родителей и YLD.</p></section><section><b>ЗЕЛЁНЫЙ ХРЕБЕТ</b><p>KML от 12.08.2026, расчёт стоимости и эксплуатации от 13.08.2026, модели селезащитных и туристических эффектов.</p></section><section><b>ПРОЕКТНАЯ РАМКА</b><p>Анализ мастер‑плана и концепция градоэкологического каркаса: 16 водотоков, экобульвары, Северная долина и экореновация.</p></section></div><div className="source-warning"><b>ЧЕСТНОСТЬ ИНТЕРПРЕТАЦИИ</b><p>Уточнённый ряд показывает снижение смертности взрослых от внешних причин. Карты фактических hotspots детских травм нет. Экономика тропы и селезащиты — модель порядка величины, которая требует изысканий и полевой верификации.</p></div></aside></div>;
}
