(() => {
  // Ambient soundtrack: autoplay attempt with a 35-second fade to 20%.
  const audio = document.getElementById("ambientAudioTrack");
  if (audio) {
    const TARGET_VOLUME = 0.20;
    const FADE_DURATION_MS = 35000;
    let fadeFrame = 0;
    audio.loop = true;
    audio.volume = 0;
    audio.muted = true;
    const startAutoplay = async () => {
      if (!audio.paused) return;
      try {
        audio.muted = true;
        audio.volume = 0;
        await audio.play();
        audio.muted = false;
        const startedAt = performance.now();
        const tick = (now) => {
          const progress = Math.min(1, (now - startedAt) / FADE_DURATION_MS);
          audio.volume = TARGET_VOLUME * progress * progress;
          if (progress < 1 && !audio.paused) fadeFrame = requestAnimationFrame(tick);
          else fadeFrame = 0;
        };
        if (fadeFrame) cancelAnimationFrame(fadeFrame);
        fadeFrame = requestAnimationFrame(tick);
      } catch (_) {
        const retry = () => startAutoplay();
        window.addEventListener("pointerdown", retry, { once: true });
        window.addEventListener("keydown", retry, { once: true });
        window.addEventListener("touchstart", retry, { once: true, passive: true });
      }
    };
    startAutoplay();
  }

  // Interactive core technology map.
  const explorer = document.getElementById("technology-explorer");
  const graph = document.getElementById("technology-graph");
  const mapTitle = document.getElementById("tech-map-title");
  const mapType = document.getElementById("tech-map-type");
  const mapDescription = document.getElementById("tech-map-description");
  const mapTags = document.getElementById("tech-map-tags");
  const techData = {
    overview: ["Data Engineering Stack", "STACK OVERVIEW", "A connected stack spanning distributed processing, lakehouse storage, cloud services, data movement and analytics.", ["Apache Spark","Databricks","PySpark / Scala","AWS","SQL","ETL / ELT","Delta Lake"]],
    spark: ["Apache Spark", "PROCESSING ENGINE", "Distributed processing for large-scale batch and streaming workloads.", ["PySpark","Spark SQL","Structured Streaming","Hadoop"]],
    databricks: ["Databricks & Lakehouse", "LAKEHOUSE PLATFORM", "Managed data engineering workflows, Delta Lake storage and governed analytics.", ["Databricks","Delta Lake","Unity Catalog","Workflows"]],
    languages: ["PySpark / Scala", "LANGUAGES", "Programming and query languages used to build transformations and data applications.", ["Python","PySpark","Scala","SQL","Shell"]],
    aws: ["AWS Cloud", "CLOUD & STORAGE", "Cloud storage, compute and analytics services for scalable data platforms.", ["S3","EMR","EC2","Glue","Athena","Redshift"]],
    sql: ["SQL & Analytics", "QUERY & ANALYTICS", "Querying, transforming and validating structured data across analytical engines.", ["Spark SQL","Hive","Impala","Athena","Redshift"]],
    etl: ["ETL / ELT", "DATA MOVEMENT", "Reliable ingestion, transformation and delivery patterns for batch and incremental pipelines.", ["Batch","Incremental loads","CDC","Data validation"]],
    delta: ["Delta Lake", "TABLE FORMAT", "Reliable lakehouse tables with transactional writes, schema controls and versioned data.", ["ACID transactions","Time travel","Schema evolution","Unity Catalog"]]
  };
  const svgNS = "http://www.w3.org/2000/svg";
  function svgEl(name, attrs, text) {
    const el = document.createElementNS(svgNS, name);
    Object.entries(attrs || {}).forEach(([k,v]) => el.setAttribute(k, v));
    if (text) el.textContent = text;
    return el;
  }
  function renderTech(key) {
    if (!graph || !techData[key]) return;
    const item = techData[key];
    mapType.textContent = item[1];
    mapTitle.textContent = item[0];
    mapDescription.textContent = item[2];
    mapTags.replaceChildren(...item[3].map(label => {
      const span = document.createElement("span");
      span.className = "tech-map-tag";
      span.textContent = label;
      return span;
    }));
    graph.replaceChildren();
    const rootX = 470, rootY = 155;
    const nodes = item[3].slice(0, 7);
    const positions = nodes.map((_,i) => {
      const angle = (-Math.PI/2) + (Math.PI*2*i/nodes.length);
      return {x:470+330*Math.cos(angle), y:155+112*Math.sin(angle)};
    });
    positions.forEach(p => graph.appendChild(svgEl("line",{x1:rootX,y1:rootY,x2:p.x,y2:p.y,class:"tech-graph-edge"})));
    nodes.forEach((label,i) => {
      const p=positions[i], g=svgEl("g",{class:"tech-graph-node",role:"button",tabindex:"0","aria-label":"Explore "+label});
      g.appendChild(svgEl("rect",{x:p.x-65,y:p.y-19,width:130,height:38,rx:8}));
      g.appendChild(svgEl("text",{x:p.x,y:p.y+1},label));
      const activate=()=>{mapType.textContent="STACK COMPONENT";mapTitle.textContent=label;mapDescription.textContent=label+" is part of the "+item[0]+" workflow shown in this technology map.";};
      g.addEventListener("click",activate);
      g.addEventListener("keydown",e=>{if(e.key==="Enter"||e.key===" "){e.preventDefault();activate();}});
      graph.appendChild(g);
    });
    const root=svgEl("g",{class:"tech-graph-node tech-graph-root"});
    root.appendChild(svgEl("rect",{x:355,y:124,width:230,height:62,rx:12}));
    root.appendChild(svgEl("text",{x:470,y:155},key==="overview"?"DATA PLATFORM":item[0]));
    graph.appendChild(root);
  }
  function openExplorer(key) {
    if (!explorer) return;
    explorer.hidden = false;
    document.querySelectorAll("[data-tech-select]").forEach(btn => {
      const active=btn.dataset.techSelect===key;
      btn.setAttribute("aria-expanded",String(active));
    });
    renderTech(key);
    explorer.scrollIntoView({behavior:"smooth",block:"nearest"});
  }
  document.querySelectorAll("[data-tech-select]").forEach(btn => btn.addEventListener("click",()=>openExplorer(btn.dataset.techSelect)));
  const closeMap=document.getElementById("techMapClose");
  if(closeMap) closeMap.addEventListener("click",()=>{
    explorer.hidden=true;
    document.querySelectorAll("[data-tech-select]").forEach(btn=>btn.setAttribute("aria-expanded","false"));
  });

  // Click-to-expand technical toolkit cards (works on touch and desktop).
  const skillButtons=[...document.querySelectorAll(".skill-card-trigger")];
  function closeSkills(except) {
    skillButtons.forEach(button=>{
      if(button===except)return;
      button.setAttribute("aria-expanded","false");
      const panel=document.getElementById(button.getAttribute("aria-controls"));
      if(panel) panel.hidden=true;
      const card=button.closest(".skill-card");
      if(card)card.classList.remove("is-open");
    });
  }
  skillButtons.forEach(button=>{
    button.addEventListener("click",()=>{
      const panel=document.getElementById(button.getAttribute("aria-controls"));
      if(!panel)return;
      const willOpen=panel.hidden;
      closeSkills(button);
      panel.hidden=!willOpen;
      button.setAttribute("aria-expanded",String(willOpen));
      button.closest(".skill-card").classList.toggle("is-open",willOpen);
    });
  });
  document.addEventListener("click",event=>{
    if(!event.target.closest("#skills .skill-grid"))closeSkills(null);
  });
  document.addEventListener("keydown",event=>{
    if(event.key==="Escape"){
      closeSkills(null);
      if(explorer&&!explorer.hidden&&closeMap)closeMap.click();
    }
  });
})();
