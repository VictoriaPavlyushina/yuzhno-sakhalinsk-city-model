"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

type RidgeTab = "route" | "engineering" | "economy";
type Axis = "all" | "a" | "c";

const scenes = [
  { id: "cover", label: "Начало" },
  { id: "signals", label: "Что увидели" },
  { id: "child", label: "Детский травматизм" },
  { id: "child-project", label: "Безопасный город" },
  { id: "water", label: "Климат и вода" },
  { id: "portfolio", label: "Портфель проектов" },
  { id: "ridge", label: "Зелёный хребет" },
  { id: "decision", label: "Решение" },
];

const projects = [
  { id: "safe", no: "01", name: "Безопасный город для детей", short: "Безопасный город", x: 35, y: 60, problem: "Город знает масштаб травматизма, но не знает конкретные места.", output: "Карта травм → аудит hotspots → адресные микропроекты.", next: "Получить обезличенные адресные данные и запустить пилот." },
  { id: "framework", no: "02", name: "Градоэкологический каркас", short: "Градоэкокаркас", x: 57, y: 45, problem: "Парки, реки, леса и новые районы существуют разрозненно.", output: "Единая рельефно-гидрологическая схема природных связей.", next: "Собрать цифровую модель рельефа, водосборов и разрывов." },
  { id: "rivers", no: "03", name: "16 рек — одна система", short: "16 рек", x: 48, y: 31, problem: "Из 16 водотоков мастер-планом явно охвачены только четыре.", output: "Паспорта водосборов и 5–7 проектов первой очереди.", next: "Рогатка, Еланька, Сусуя, Красносельская, Уюновка, Придорожный." },
  { id: "boulevards", no: "04", name: "Экобульвары и зелёные улицы", short: "Экобульвары", x: 41, y: 72, problem: "Улицы быстро передают воду в ливневую систему и реки.", output: "Биоканавы, дождевые сады, тень и связные маршруты.", next: "Проверить пр. Мира, Сахалинскую, Горького, Украинскую и Ленина." },
  { id: "renovation", no: "05", name: "Экореновация промтерриторий", short: "Экореновация", x: 27, y: 39, problem: "Твёрдые покрытия усиливают пиковый и загрязнённый сток.", output: "Водный баланс площадок, зелёные буферы и биоретенция.", next: "Пилот в узле пр. Мира — ул. Украинская." },
  { id: "north", no: "06", name: "Северная долина", short: "Северная долина", x: 42, y: 19, problem: "Новая застройка может усилить сток и разорвать природные коридоры.", output: "Районные правила воды, зелени и пешеходной связности.", next: "Закрепить требования в проектах девелоперов и КРТ." },
  { id: "ridge", no: "07", name: "Зелёный хребет", short: "Зелёный хребет", x: 70, y: 50, problem: "Рекреационные объекты и склоновые риски требуют общего решения.", output: "12,55 км маршрутов + локальная работа со стоком + связность.", next: "DEM и изыскания → пилот оси A → проверка эффекта." },
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
      canvas.width = Math.round(rect.width * dpr);
      canvas.height = Math.round(rect.height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const w = rect.width, h = rect.height;
      const t = (now - started) / 1000;
      const point = (x:number,y:number) => [x*w,y*h] as const;
      const poly = (pts:number[][], close=false) => { ctx.beginPath(); pts.forEach(([x,y],i)=>{const [px,py]=point(x,y); if(i)ctx.lineTo(px,py);else ctx.moveTo(px,py);}); if(close)ctx.closePath(); };
      const routePoint = ([lon,lat]:number[]) => [.56+((lon-142.744)/.123)*.39,.10+((46.999-lat)/.09)*.78];

      const bg = ctx.createRadialGradient(w*.72,h*.45,0,w*.72,h*.45,w*.8);
      bg.addColorStop(0,"#174748"); bg.addColorStop(.55,"#0e3435"); bg.addColorStop(1,"#082425");
      ctx.fillStyle=bg; ctx.fillRect(0,0,w,h);

      ctx.strokeStyle="rgba(171,218,188,.11)"; ctx.lineWidth=.9;
      for(let i=0;i<23;i++){
        ctx.beginPath();
        for(let p=0;p<=1;p+=.025){
          const x=.57+p*.55;
          const y=.02+i*.045+Math.sin(p*9+i*.7)*(.012+i*.0008);
          const [px,py]=point(x,y); if(p)ctx.lineTo(px,py);else ctx.moveTo(px,py);
        }
        ctx.stroke();
      }

      const city=[[.10,.11],[.53,.08],[.62,.18],[.61,.89],[.47,.96],[.08,.88],[.045,.55],[.07,.22]];
      poly(city,true); ctx.fillStyle="rgba(236,240,225,.035)";ctx.fill();ctx.strokeStyle="rgba(218,232,215,.15)";ctx.stroke();
      ctx.strokeStyle="rgba(222,235,222,.09)";ctx.lineWidth=.65;
      for(let i=0;i<21;i++){const x=.09+i*.024;poly([[x,.12+(i%3)*.01],[x+.018,.9-(i%4)*.016]]);ctx.stroke();}
      for(let i=0;i<25;i++){const y=.15+i*.029;poly([[.06,y],[.61,y+Math.sin(i*.8)*.009]]);ctx.stroke();}
      ctx.strokeStyle="rgba(230,238,226,.2)";ctx.lineWidth=1.35;poly([[.20,.08],[.22,.94]]);ctx.stroke();poly([[.06,.52],[.62,.49]]);ctx.stroke();poly([[.34,.08],[.35,.93]]);ctx.stroke();

      const rivers=[[[.07,.22],[.23,.23],[.39,.28],[.61,.23],[.91,.17]],[[.04,.37],[.22,.41],[.42,.38],[.67,.39],[.96,.34]],[[.04,.52],[.19,.55],[.38,.58],[.68,.55],[.97,.49]],[[.07,.68],[.25,.70],[.46,.72],[.72,.68],[.98,.62]],[[.16,.08],[.20,.31],[.18,.58],[.23,.92]],[[.48,.06],[.45,.29],[.50,.52],[.46,.82]]];
      rivers.forEach((r,i)=>{poly(r);ctx.strokeStyle=scene==="water"||project==="rivers"?`rgba(74,211,207,${.72-i*.05})`:"rgba(73,171,177,.23)";ctx.lineWidth=scene==="water"||project==="rivers"?2.2:1; if(scene==="water"||project==="rivers"){ctx.setLineDash([9,8]);ctx.lineDashOffset=-t*18;}ctx.stroke();ctx.setLineDash([]);});

      const greenAssets=[[.29,.39],[.39,.58],[.56,.35],[.66,.55],[.49,.78]];
      greenAssets.forEach(([x,y],i)=>{const [px,py]=point(x,y);ctx.beginPath();ctx.ellipse(px,py,30+i*3,18+i,0,0,Math.PI*2);ctx.fillStyle="rgba(156,207,166,.12)";ctx.fill();});
      if(project==="framework"||scene==="decision"){
        ctx.strokeStyle="rgba(68,205,193,.75)";ctx.lineWidth=2;ctx.setLineDash([5,7]);greenAssets.forEach((a,i)=>{if(i<greenAssets.length-1){poly([a,greenAssets[i+1]]);ctx.stroke();}});ctx.setLineDash([]);
      }

      if(scene==="child"){
        ctx.fillStyle="rgba(240,154,124,.20)";
        for(let x=.09;x<.60;x+=.025)for(let y=.13;y<.89;y+=.026){if((Math.round(x*100)+Math.round(y*100))%3===0){const[px,py]=point(x,y);ctx.beginPath();ctx.arc(px,py,1.1,0,Math.PI*2);ctx.fill();}}
      }
      if(scene==="child-project"){
        const scan=(t*.17)%1;const [sx]=point(.08+scan*.52,0);ctx.fillStyle="rgba(57,194,190,.12)";ctx.fillRect(sx,0,2,h);
        ctx.strokeStyle="rgba(57,194,190,.22)";ctx.lineWidth=1;
        [[.18,.26],[.30,.46],[.44,.32],[.52,.66],[.24,.74]].forEach(([x,y],i)=>{const[px,py]=point(x,y);ctx.beginPath();ctx.arc(px,py,9+Math.sin(t*2+i)*3,0,Math.PI*2);ctx.stroke();});
      }
      if(scene==="portfolio"&&project){
        const p=projects.find(x=>x.id===project);if(p){const[px,py]=point(p.x/100,p.y/100);const halo=18+Math.sin(t*3)*5;ctx.beginPath();ctx.arc(px,py,halo,0,Math.PI*2);ctx.strokeStyle="rgba(57,194,190,.65)";ctx.lineWidth=2;ctx.stroke();}
      }

      if(scene==="ridge"){
        poly(ridgeBoundary.map(routePoint),true);ctx.fillStyle="rgba(68,205,193,.055)";ctx.fill();ctx.strokeStyle="rgba(151,218,171,.48)";ctx.lineWidth=1.3;ctx.setLineDash([6,6]);ctx.stroke();ctx.setLineDash([]);
        const progress=Math.min(1,(now-started)/1200);
        const drawRoute=(coords:number[][],color:string,muted:boolean)=>{const pts=coords.map(routePoint);const n=Math.max(2,Math.ceil(pts.length*progress));poly(pts.slice(0,n));ctx.strokeStyle=muted?color.replace("1)",".18)"):color;ctx.lineWidth=muted?3:5;ctx.lineCap="round";ctx.lineJoin="round";ctx.shadowColor=color;ctx.shadowBlur=muted?0:12;ctx.stroke();ctx.shadowBlur=0;};
        drawRoute(axisA,"rgba(57,194,190,1)",axis==="c");drawRoute(axisC,"rgba(240,164,91,1)",axis==="a");
        if(progress>.8){[[.59,.16],[.61,.23],[.63,.57],[.62,.76]].forEach(([x,y],i)=>{const[px,py]=point(x,y);ctx.beginPath();ctx.arc(px,py,5,0,Math.PI*2);ctx.fillStyle="#f5f4ea";ctx.fill();ctx.strokeStyle=i===0?"#39c2be":"#173536";ctx.lineWidth=2;ctx.stroke();});}
      }

      if(scene==="signals"){
        const center=[.50,.50];[[.24,.24],[.27,.72],[.73,.22],[.77,.72]].forEach(([x,y],i)=>{poly([center,[x,y]]);ctx.strokeStyle=i<2?"rgba(240,154,124,.36)":"rgba(57,194,190,.36)";ctx.lineWidth=1;ctx.stroke();});
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
  const [selectedProject,setSelectedProject]=useState("framework");
  const [ridgeTab,setRidgeTab]=useState<RidgeTab>("route");
  const [axis,setAxis]=useState<Axis>("all");
  const [scenario,setScenario]=useState("base");
  const [sourceOpen,setSourceOpen]=useState(false);
  const [childLayer,setChildLayer]=useState("школы");
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
      const n=Number(e.key);if(n>=1&&n<=8)go(n-1);
    };
    window.addEventListener("keydown",onKey);return()=>window.removeEventListener("keydown",onKey);
  },[go,index,toggleFullscreen]);

  const selected=useMemo(()=>projects.find(x=>x.id===selectedProject)??projects[1],[selectedProject]);
  return <main className={`mayor-show scene-${current.id}`}>
    <CityCanvas scene={current.id} project={selectedProject} axis={axis}/>
    <div className="noise"></div><div className="edge-shade"></div>
    <header className="show-header">
      <button className="brand" onClick={()=>go(0)}><span>А</span><b>АТРЭ</b><i>×</i><em>ЮЖНО-САХАЛИНСК</em></button>
      <div className="show-title">ГОРОДСКОЕ ЗДОРОВЬЕ · ПРОЕКТНЫЕ РЕШЕНИЯ</div>
      <div className="header-actions"><button onClick={()=>setSourceOpen(true)}>ДАННЫЕ</button><button className="full" onClick={toggleFullscreen} aria-label="Полноэкранный режим"><i></i></button></div>
    </header>

    <nav className="chapter-rail" aria-label="Сцены презентации">{scenes.map((s,i)=><button key={s.id} className={i===index?"active":""} onClick={()=>go(i)}><span>{String(i+1).padStart(2,"0")}</span><b>{s.label}</b></button>)}</nav>

    <section className="scene-wrap" key={current.id}>
      {current.id==="cover"&&<Cover go={go}/>} 
      {current.id==="signals"&&<Signals go={go}/>} 
      {current.id==="child"&&<ChildStory go={go}/>} 
      {current.id==="child-project"&&<ChildProject layer={childLayer} setLayer={setChildLayer}/>} 
      {current.id==="water"&&<WaterStory go={go}/>} 
      {current.id==="portfolio"&&<Portfolio selected={selected} setSelected={setSelectedProject} go={go}/>} 
      {current.id==="ridge"&&<Ridge tab={ridgeTab} setTab={setRidgeTab} axis={axis} setAxis={setAxis} scenario={scenario} setScenario={setScenario}/>} 
      {current.id==="decision"&&<Decision go={go}/>} 
    </section>

    <footer className="show-controls"><div className="progress"><span style={{width:`${((index+1)/scenes.length)*100}%`}}></span></div><button disabled={index===0} onClick={()=>go(index-1)}>←</button><div><b>{String(index+1).padStart(2,"0")} / {String(scenes.length).padStart(2,"0")}</b><span>{current.label}</span></div><button disabled={index===scenes.length-1} onClick={()=>go(index+1)}>→</button><small>СТРЕЛКИ · ПРОБЕЛ · F — FULLSCREEN</small></footer>

    {sourceOpen&&<SourceDrawer close={()=>setSourceOpen(false)}/>} 
  </main>;
}

function Cover({go}:{go:(n:number)=>void}){return <div className="cover-layout"><div className="cover-copy"><div className="eyebrow">ИНТЕРАКТИВНАЯ РАБОЧАЯ ВЕРСИЯ · 2026</div><h1>От данных<br/>о здоровье —<br/><em>к проектам города</em></h1><p>Мы посмотрели на статистику, среду и мастер‑план Южно‑Сахалинска. Результат — не ещё один отчёт, а первый портфель конкретных решений.</p><div className="cover-actions"><button className="primary" onClick={()=>go(1)}>Начать показ <span>→</span></button><button onClick={()=>go(6)}>Сразу к флагману</button></div></div><div className="cover-orbit"><div className="orbit one"><span>ЗДОРОВЬЕ</span></div><div className="orbit two"><span>СРЕДА</span></div><div className="orbit three"><span>ПРОЕКТЫ</span></div><div className="orbit-core"><b>7</b><span>проектных<br/>решений</span></div></div></div>}

function Signals({go}:{go:(n:number)=>void}){const cards=[{n:"255,2",u:"на 1 000 детей",t:"первичная заболеваемость по травмам · 2025",tone:"warm"},{n:"104 мм",u:"за сутки",t:"максимум осадков · 2023",tone:"teal"},{n:"+2,8 °C",u:"за 2016–2025",t:"изменение средней температуры",tone:"teal"},{n:"16",u:"городских водотоков",t:"но общая система пока не собрана",tone:"green"}];return <div className="signals-layout"><div className="scene-heading"><div className="eyebrow">01 · ДИАГНОЗ</div><h2>Мы нашли не только болезни.<br/><em>Мы нашли городские задачи.</em></h2><p>Часть рисков формируется там, где человек встречается с улицей, водой, рельефом и качеством общественных пространств.</p></div><div className="signal-cluster">{cards.map((c,i)=><button key={c.n} className={`signal-card ${c.tone}`} onClick={()=>go(i===0?2:4)}><span>0{i+1}</span><b>{c.n}</b><small>{c.u}</small><p>{c.t}</p><i>ПОКАЗАТЬ СВЯЗАННУЮ ЗАДАЧУ →</i></button>)}</div><div className="integrity-note"><b>ПРОВЕРКА ДАННЫХ</b><span>Старый вывод о росте смертности взрослых от травм исключён: расширенный ответ Минздрава содержит обновлённый ряд.</span></div></div>}

function ChildStory({go}:{go:(n:number)=>void}){return <div className="child-layout"><div className="child-copy"><div className="eyebrow warm">02 · ПРИОРИТЕТ ЗДОРОВЬЯ</div><h2>Почти каждый третий ребёнок</h2><p className="lead">7 159 уникальных детей с непреднамеренной травмой за расчётный год — около 29% детской популяции 0–14 лет.</p><div className="rate"><b>255,2</b><span>на 1 000 детей<br/>первичная заболеваемость · 2025</span></div><button className="primary warm-button" onClick={()=>go(3)}>Превратить проблему в проект <span>→</span></button></div><div className="child-cost"><div className="cost-total"><span>РАСЧЁТНАЯ ЦЕНА ПРОБЛЕМЫ</span><b>122,1</b><em>млн ₽ / год</em></div><div className="cost-bar"><i style={{width:"24.7%"}}></i><b style={{width:"75.3%"}}></b></div><div className="cost-legend"><div><i></i><b>30,1 млн ₽</b><span>медицинская помощь</span></div><div><i></i><b>92,0 млн ₽</b><span>время родителей и опекунов</span></div></div><div className="geo-gap"><span>КЛЮЧЕВОЙ ПРОБЕЛ</span><b>Географии случаев пока нет.</b><p>Нельзя честно показать hotspots — сначала нужно связать случай, место и элемент городской среды.</p></div></div></div>}

function ChildProject({layer,setLayer}:{layer:string;setLayer:(x:string)=>void}){const layers=["школы","дворы","дороги","спорт","рекреация"];return <div className="child-project-layout"><div className="scan-label"><span>СХЕМА БУДУЩЕГО СЛОЯ</span><b>НЕ ФАКТИЧЕСКИЕ HOTSPOTS</b></div><article className="project-panel"><div className="eyebrow">ПРОЕКТ 01</div><h2>Безопасный город<br/>для детей</h2><p>От статистики травм — к адресным изменениям городской среды.</p><div className="project-flow">{["СЛУЧАЙ","МЕСТО","ПРИЧИНА","HOTSPOT","МЕРА"].map((x,i)=><span key={x}>{x}{i<4&&<i>→</i>}</span>)}</div><small>КАКОЙ СЛОЙ ПРОВЕРЯЕМ?</small><div className="layer-switch">{layers.map(x=><button key={x} className={layer===x?"active":""} onClick={()=>setLayer(x)}>{x}</button>)}</div><div className="project-result"><div><b>01</b><span>карта травм</span></div><div><b>02</b><span>топ опасных мест</span></div><div><b>03</b><span>аудит среды</span></div><div><b>04</b><span>микропроекты</span></div></div></article><div className="data-request"><span>ЧТО НУЖНО ОТ ГОРОДА</span><b>Обезличенный адрес случая + тип травмы + контекст</b><p>Это следующий продаваемый этап: цифровая карта детской безопасности и проектные паспорта приоритетных участков.</p></div></div>}

function WaterStory({go}:{go:(n:number)=>void}){return <div className="water-layout"><div className="scene-heading"><div className="eyebrow">03 · КЛИМАТ И ВОДА</div><h2>Город стоит<br/><em>между склоном и низменностью</em></h2><p>Вода идёт с восточных склонов через малые реки, улицы и новые районы. Сейчас решения существуют отдельно — значит, риск передаётся дальше по рельефу.</p></div><div className="water-metrics"><div><b>104 мм</b><span>суточный максимум · 2023</span></div><div><b>800 мм</b><span>осадков в год · мастер‑план</span></div><div><b>5 месяцев</b><span>устойчивого снежного покрова</span></div></div><div className="slope-chain"><span>СУСУНАЙСКИЙ ХРЕБЕТ</span><i>→</i><span>16 ВОДОТОКОВ</span><i>→</i><span>УЛИЦЫ И РАЙОНЫ</span><i>→</i><span>СУСУЯ</span></div><button className="portfolio-call" onClick={()=>go(5)}><span>ОТ ОТДЕЛЬНЫХ ОБЪЕКТОВ</span><b>к единой системе проектов</b><i>→</i></button></div>}

function Portfolio({selected,setSelected,go}:{selected:typeof projects[number];setSelected:(x:string)=>void;go:(n:number)=>void}){return <div className="portfolio-layout"><div className="portfolio-title"><div className="eyebrow">04 · ПОРТФЕЛЬ</div><h2>Семь проектов.<br/><em>Одна логика города.</em></h2></div><div className="project-map-labels">{projects.map(p=><button key={p.id} className={selected.id===p.id?"active":""} style={{left:`${p.x}%`,top:`${p.y}%`}} onClick={()=>setSelected(p.id)}><span>{p.no}</span><b>{p.short}</b></button>)}</div><nav className="portfolio-list">{projects.map(p=><button key={p.id} className={selected.id===p.id?"active":""} onClick={()=>setSelected(p.id)}><span>{p.no}</span>{p.short}</button>)}</nav><article className="portfolio-card" key={selected.id}><div className="card-number">ПРОЕКТ {selected.no}</div><h3>{selected.name}</h3><div><small>КАКУЮ ПРОБЛЕМУ РЕШАЕТ</small><p>{selected.problem}</p></div><div><small>ЧТО ПОЛУЧАЕТ ГОРОД</small><p>{selected.output}</p></div><div><small>СЛЕДУЮЩИЙ ШАГ</small><p>{selected.next}</p></div>{selected.id==="ridge"&&<button className="primary" onClick={()=>go(6)}>Открыть флагман <span>→</span></button>}</article></div>}

function Ridge({tab,setTab,axis,setAxis,scenario,setScenario}:{tab:RidgeTab;setTab:(x:RidgeTab)=>void;axis:Axis;setAxis:(x:Axis)=>void;scenario:string;setScenario:(x:string)=>void}){const scenarios:Record<string,{name:string;npv:string;bcr:string;note:string}>={conservative:{name:"Консервативный",npv:"−270,4 млн ₽",bcr:"BCR 0,37",note:"Максимальный CAPEX и сниженный эффект"},base:{name:"Базовый",npv:"+232,0 млн ₽",bcr:"BCR 1,78",note:"Расчётный базовый сценарий"},optimistic:{name:"Оптимистичный",npv:"+834,8 млн ₽",bcr:"BCR 6,09",note:"Минимальный CAPEX и усиленный эффект"}};return <div className="ridge-layout"><div className="ridge-title"><div className="eyebrow">05 · ФЛАГМАН</div><h2>Зелёный<br/>хребет</h2><p>Не отдельная тропа, а природно‑рекреационный каркас: маршрут, локальная работа с водой и связность территории.</p><div className="kml-badge"><span>KML</span><b>предварительная трассировка<br/>28.07.2026</b></div></div><article className="ridge-panel"><div className="ridge-tabs">{(["route","engineering","economy"] as const).map(x=><button key={x} className={tab===x?"active":""} onClick={()=>setTab(x)}>{x==="route"?"МАРШРУТ":x==="engineering"?"ИНЖЕНЕРИЯ":"ЭКОНОМИКА"}</button>)}</div>{tab==="route"&&<div className="route-tab"><div className="hero-number"><b>12,55 км</b><span>оси A + C</span></div><div className="axis-buttons"><button className={axis==="a"?"active":""} onClick={()=>setAxis(axis==="a"?"all":"a")}><b>A</b><span>8,72 км · городская</span><small>Уюновка → Гагарина → Ботсад → Больничная</small></button><button className={axis==="c"?"active orange":""} onClick={()=>setAxis(axis==="c"?"all":"c")}><b>C</b><span>3,83 км · гребневая</span><small>треккинг → виды → верх «Горного воздуха»</small></button></div></div>}{tab==="engineering"&&<div className="engineering-tab"><div className="hero-number"><b>5 386 м³</b><span>эффективная ёмкость за дождь</span></div><div className="engineering-grid"><div><b>11</b><span>выявленных пересечений</span></div><div><b>6,11 км</b><span>террас‑свейлов</span></div><div><b>10</b><span>каскадных запруд</span></div><div><b>77</b><span>водоотводных нарезок</span></div></div><div className="honest-note"><b>ВАЖНО</b><span>При сценарии 120 мм сооружения удерживают около 0,32% стока. Основной объём должны держать лес и почвы — лесовосстановление критично.</span></div></div>}{tab==="economy"&&<div className="economy-tab"><div className="capex-line"><span>ПОЛНЫЙ CAPEX</span><b>281,6–698,8 млн ₽</b></div><div className="scenario-switch">{Object.entries(scenarios).map(([key,s])=><button key={key} className={scenario===key?"active":""} onClick={()=>setScenario(key)}><span>{s.name}</span><b>{s.npv}</b></button>)}</div><div className={`scenario-result ${scenario}`}><span>{scenarios[scenario].note}</span><b>{scenarios[scenario].npv}</b><em>{scenarios[scenario].bcr}</em><small>Селезащитный компонент · 25 лет · ставка 8%</small></div><p className="tourism-caveat">9,58 млрд ₽ туристических расходов — контекст всей системы «Горный воздух» + «Долина Айна», а не эффект одного хребта.</p></div>}</article><a className="source-map-link" href="/ridge-routes.png" target="_blank">ОТКРЫТЬ ИСХОДНУЮ СХЕМУ ↗</a></div>}

function Decision({go}:{go:(n:number)=>void}){return <div className="decision-layout"><div className="eyebrow">06 · СЛЕДУЮЩЕЕ РЕШЕНИЕ</div><h2>От аналитики —<br/><em>к двум пилотам</em></h2><p className="decision-lead">Чтобы работа не осталась концепцией, сейчас достаточно принять три управленческих решения.</p><div className="decision-cards"><article><span>01</span><h3>Выбрать пилоты</h3><p>«Безопасный город для детей» и «Зелёный хребет» — один социальный и один пространственный проект.</p></article><article><span>02</span><h3>Открыть данные</h3><p>Обезличенная география травм, DEM, водосборы, инженерные ограничения и владельцы проектов.</p></article><article><span>03</span><h3>Упаковать реализацию</h3><p>Проектные паспорта, точная карта, CAPEX, эффекты, приоритеты и дорожная карта.</p></article></div><div className="closing"><b>Результат</b><span>не перечень аналитических выводов, а первый портфель конкретных городских решений.</span><button onClick={()=>go(5)}>Вернуться к портфелю ↗</button></div></div>}

function SourceDrawer({close}:{close:()=>void}){return <div className="drawer"><button className="drawer-bg" onClick={close} aria-label="Закрыть"></button><aside><button className="drawer-close" onClick={close}>ЗАКРЫТЬ ×</button><div className="eyebrow">ИСТОЧНИКИ И ДОСТОВЕРНОСТЬ</div><h2>Что лежит<br/>под моделью</h2><div className="source-groups"><section><b>ИСХОДНЫЕ ДАННЫЕ</b><p>Свод показателей Стандарта. Расширенный запрос Минздрава по травматизму и смертности.</p></section><section><b>АНАЛИТИКА</b><p>Пять справок: экономика, здоровье, градоэкологический каркас, «Зелёный хребет», потери от детского травматизма.</p></section><section><b>РАСЧЁТНЫЕ МОДЕЛИ</b><p>Потери от травм, стоимость и сток, селезащитный эффект, туристическая экономика.</p></section><section><b>ПРОСТРАНСТВО</b><p>KML Восточной рекреационной зоны и схема трассировки осей A и C.</p></section></div><div className="status-key"><span><i className="fact"></i>ФАКТ</span><span><i className="calc"></i>РАСЧЁТ</span><span><i className="concept"></i>КОНЦЕПЦИЯ</span></div><div className="source-warning"><b>УЧТЕНО В ВЕРСИИ</b><p>Обновлённый ряд Минздрава имеет приоритет над старым текстом по смертности взрослых от травм. География детских случаев не моделируется. Туристический эффект не приписывается целиком «Зелёному хребту».</p></div></aside></div>}
