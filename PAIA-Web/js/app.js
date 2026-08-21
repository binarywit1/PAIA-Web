(() => {
  const KEY = "paia-machine-v1";
  const $ = (s, el=document) => el.querySelector(s);
  const app = $("#app");
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)||"{}"); } catch { return {}; } };
  const save = (d) => localStorage.setItem(KEY, JSON.stringify(d));
  let D = load();
  const bag = (k) => D[k] || (D[k] = {});
  const persist = () => { save(D); const s=$("#saved"); if(s){ s.textContent="Enregistré"; setTimeout(()=>s.textContent="",1200);} };

  function bind(root) {
    root.querySelectorAll("[data-k]").forEach((el) => {
      const [a,b] = el.dataset.k.split(":");
      const B = bag(a);
      if (el.type==="checkbox") {
        el.checked = !!B[b];
        el.addEventListener("change", () => { B[b]=el.checked; persist(); });
      } else {
        el.value = B[b]||"";
        el.addEventListener("input", () => { B[b]=el.value; persist(); });
      }
    });
  }
  function nav(id) {
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav===id));
  }
  function toast(msg) {
    let t = $(".toast");
    if (!t) { t = document.createElement("div"); t.id="toast"; t.className="toast"; document.body.appendChild(t); }
    t.textContent = msg; t.style.display="block";
    setTimeout(()=> t.style.display="none", 1600);
  }
  function copy(text) {
    navigator.clipboard.writeText(text).then(()=>toast("Prompt copié")).catch(()=>{
      const ta=document.createElement("textarea"); ta.value=text; document.body.appendChild(ta); ta.select();
      document.execCommand("copy"); ta.remove(); toast("Prompt copié");
    });
  }
  function weekNow() {
    const n = Number(bag("onboard").semaine||1);
    return Math.min(13, Math.max(1, n));
  }

  function home() {
    nav("home");
    const w = weekNow();
    const p = PAIA_PARCOURS[w-1];
    const done = PAIA_PARCOURS.filter((_,i)=>bag("parc")["w"+(i+1)]).length;
    app.innerHTML = `
      <div class="hero">
        <div class="pad" style="padding-top:28px">
          <div class="k">LA MACHINE PAIA</div>
          <h1>Reconverti &amp; Augmenté</h1>
          <p>Le livre décide. Le cahier structure. L’arsenal accélère. Le radar tient le rythme.</p>
          <div class="row">
            <a class="btn" href="#/parcours/${w}">Continuer · Semaine ${w}</a>
            <a class="btn ghost" href="#/start">Où j’en suis</a>
          </div>
        </div>
      </div>
      <p class="hint">${done} / 13 semaines du parcours 90&nbsp;jours</p>
      <div class="progress"><span style="width:${Math.round(done/13*100)}%"></span></div>
      <p class="mini">Cette semaine : <strong>${p.titre}</strong> — ${p.action}</p>
      <div class="grid g2" style="margin-top:18px">
        <a class="card-link" href="#/livre"><div class="num">VISION</div><h3>Le livre</h3><p>10 stations. Un déclic. Une arme de 15&nbsp;min.</p></a>
        <a class="card-link" href="#/cahier"><div class="num">ARCHITECTURE</div><h3>Le simulateur</h3><p>21 mouvements. Une page = une action.</p></a>
        <a class="card-link" href="#/arsenal"><div class="num">VITESSE</div><h3>100 prompts</h3><p>Chercher, copier, habiller, vérifier.</p></a>
        <a class="card-link" href="#/radar"><div class="num">RYTHME</div><h3>Radar 365</h3><p>52 autopsies. Preuve chaque semaine.</p></a>
      </div>
      <div class="foot">
        <img src="assets/logo.png" alt="BinaryWit">
        <p>Collection PAIA · Compagnon numérique de Reconverti &amp; Augmenté<br>B. Ly Abdourahamane · Une publication BinaryWit<br>Vos notes restent sur cet appareil.</p>
      </div>`;
  }

  function start() {
    nav("home");
    app.innerHTML = `
      <p class="kicker">DÉMARRAGE</p>
      <h2>Où en êtes-vous&nbsp;?</h2>
      <p class="hint">Trois réponses. Un cap. Vous pourrez changer.</p>
      <label class="q">Mon statut</label>
      <div class="habits">
        ${["Salarié(e)","En recherche","Entrepreneur(e)","En transition","Étudiant(e)"].map((s)=>
          `<label><input type="radio" name="st" value="${s}"> ${s}</label>`).join("")}
      </div>
      <label class="q">Ce qui compte le plus maintenant</label>
      <textarea data-k="onboard:compte" placeholder="Un emploi, une offre, du temps, une compétence…"></textarea>
      <label class="q">Temps disponible par semaine</label>
      <input type="text" data-k="onboard:temps" placeholder="Ex. : 3 × 45 minutes">
      <label class="q">Je commence le parcours à la semaine</label>
      <input type="text" data-k="onboard:semaine" placeholder="1">
      <p class="saved" id="saved"></p>
      <p><a class="btn" href="#/parcours/1">Entrer dans le parcours</a></p>`;
    bind(app);
    app.querySelectorAll('input[name="st"]').forEach((r) => {
      r.checked = bag("onboard").statut === r.value;
      r.addEventListener("change", () => { bag("onboard").statut = r.value; persist(); });
    });
  }

  function parcoursList() {
    nav("parcours");
    const w = weekNow();
    app.innerHTML = `
      <p class="kicker">90 JOURS</p>
      <h2>Le parcours guidé</h2>
      <p class="hint">Chaque semaine : lire · écrire · copier un prompt · noter une preuve. Pas tout. Une chose.</p>
      <div class="grid">${PAIA_PARCOURS.map((p)=>`
        <a class="card-link" href="#/parcours/${p.w}">
          <div class="num">${p.phase} · S${String(p.w).padStart(2,"0")}</div>
          <h3>${p.titre}</h3>
          <p><span class="dot ${bag("parc")["w"+p.w]?"on":""}"></span>${p.action}</p>
        </a>`).join("")}</div>`;
  }

  function parcoursW(n) {
    nav("parcours");
    const p = PAIA_PARCOURS[n-1];
    const ch = PAIA_LIVRE.find((x)=>x.id===p.lire);
    const mv = PAIA_CAHIER.find((x)=>x.n===p.cahier);
    const pr = PAIA_PROMPTS.find((x)=>x.n===p.prompt);
    const prev = n>1?`#/parcours/${n-1}`:"#/parcours";
    const next = n<13?`#/parcours/${n+1}`:"#/parcours";
    app.innerHTML = `
      <div class="banner"><div class="lab">${p.phase} · SEMAINE ${n}/13</div><h2>${p.titre}</h2><p>${p.action}</p></div>
      <p class="kicker">AUJOURD’HUI · 15 MINUTES</p>
      <textarea data-k="parc:note${n}" placeholder="Ce que je fais réellement aujourd’hui…"></textarea>
      <label class="habits" style="margin:12px 0"><input type="checkbox" data-k="parc:w${n}"> Semaine tenue — une preuve existe</label>
      <div class="grid g2">
        <a class="card-link" href="#/livre/${p.lire}"><div class="num">LIRE</div><h3>${ch.title}</h3><p>${ch.declic}</p></a>
        <a class="card-link" href="#/cahier/${p.cahier}"><div class="num">ÉCRIRE</div><h3>${mv.n<10?"0":""}${mv.n} · ${mv.title}</h3><p>${mv.hint}</p></a>
        <a class="card-link" href="#/arsenal/${p.prompt}"><div class="num">PROMPT ${String(p.prompt).padStart(3,"0")}</div><h3>${pr.title}</h3><p>${pr.obj}</p></a>
        <a class="card-link" href="#/radar/semaine/${p.radar}"><div class="num">RADAR S${p.radar}</div><h3>Autopsie de la semaine</h3><p>Noter la preuve. Score /5.</p></a>
      </div>
      <div class="navp"><a href="${prev}">←</a><a href="${next}">→</a></div>
      <p class="saved" id="saved"></p>`;
    bind(app);
  }

  function livreList() {
    nav("livre");
    const vol = (v) => PAIA_BOOK.filter((c) => c.vol === v);
    const toc = (v) => vol(v).map((c) =>
      `<a class="${c.kind==="part"?"part":""}" href="#/livre/${c.id}">${c.sub ? c.title.replace(/^CHAPITRE /,"Ch. ") + " — " + c.sub : c.title}</a>`
    ).join("");
    app.innerHTML = `
      <p class="kicker">VISION</p>
      <h2>Reconverti &amp; Augmenté</h2>
      <p class="hint">Les deux volumes, intégralement. Lisez, annotez en bas de chapitre, passez au cahier.</p>
      <p class="mini">Les deux volumes se lisent ici. Le papier reste sur Drive.</p>
      <div class="vols">
        <div>
          <h3>Volume 1</h3>
          <p class="mini">Comprendre et se positionner</p>
          <div class="toc">${toc(1)}</div>
        </div>
        <div>
          <h3>Volume 2</h3>
          <p class="mini">Créer de la valeur et transformer</p>
          <div class="toc">${toc(2)}</div>
        </div>
      </div>`;
  }

  function livreOne(id) {
    nav("livre");
    const i = Math.max(0, PAIA_BOOK.findIndex((x) => x.id === id));
    const c = PAIA_BOOK[i];
    const st = (typeof PAIA_LIVRE !== "undefined") ? PAIA_LIVRE.find((x) => x.id === c.id) : null;
    const extra = st ? `
      <div class="arme"><div class="lab">ARME IA — 15 MINUTES</div><p>${st.arme}</p>
        <textarea data-k="livre:${c.id}" placeholder="Votre réponse, ici."></textarea></div>
      <div class="chips">
        <a class="btn ink" href="#/cahier/${st.wb}">Mouvement ${st.wb}</a>
        ${st.prompts.map((n)=>`<a class="btn ghost" href="#/arsenal/${n}">Prompt ${String(n).padStart(3,"0")}</a>`).join("")}
        <a class="btn ghost" href="#/radar">Radar</a>
      </div>` : "";
    app.innerHTML = `
      <p class="kicker">VOLUME ${c.vol}${c.sub ? " · " + c.title : ""}</p>
      <h2>${c.sub || c.title}</h2>
      <article class="reader">${c.html}</article>
      ${extra}
      <p class="saved" id="saved"></p>
      <div class="navp">
        ${i>0?`<a href="#/livre/${PAIA_BOOK[i-1].id}">← ${PAIA_BOOK[i-1].sub || PAIA_BOOK[i-1].title}</a>`:`<a href="#/livre">Sommaire</a>`}
        ${i<PAIA_BOOK.length-1?`<a href="#/livre/${PAIA_BOOK[i+1].id}">${PAIA_BOOK[i+1].sub || PAIA_BOOK[i+1].title} →</a>`:`<a href="#/livre">Sommaire</a>`}
      </div>`;
    bind(app);
    window.scrollTo(0,0);
  }

  function cahierList() {
    nav("cahier");
    app.innerHTML = `
      <p class="kicker">SIMULATEUR</p>
      <h2>21 mouvements</h2>
      <p class="hint">Une page remplie ne vaut rien sans action dans les 24&nbsp;heures.</p>
      <div class="grid">${PAIA_CAHIER.map((m)=>`
        <a class="card-link" href="#/cahier/${m.n}">
          <div class="num">PHASE ${m.phase} · ${String(m.n).padStart(2,"0")}</div>
          <h3>${m.title}</h3>
          <p><span class="dot ${Object.keys(bag("c"+m.n)).length?"on":""}"></span>${m.hint}</p>
        </a>`).join("")}</div>`;
  }

  function cahierOne(n) {
    nav("cahier");
    const m = PAIA_CAHIER.find((x)=>x.n===n) || PAIA_CAHIER[0];
    const fields = m.fields.map((f,i)=>`<label class="q">${f}</label><textarea class="sm" data-k="c${m.n}:f${i}"></textarea>`).join("");
    app.innerHTML = `
      <p class="kicker">MOUVEMENT ${String(m.n).padStart(2,"0")} · PHASE ${m.phase}</p>
      <h2>${m.title}</h2>
      <p class="hint">${m.hint}</p>
      ${fields}
      <p class="saved" id="saved"></p>
      <div class="navp">
        ${m.n>1?`<a href="#/cahier/${m.n-1}">← ${String(m.n-1).padStart(2,"0")}</a>`:"<span></span>"}
        ${m.n<21?`<a href="#/cahier/${m.n+1}">${String(m.n+1).padStart(2,"0")} →</a>`:"<span></span>"}
      </div>`;
    bind(app);
  }

  function arsenal(filter) {
    nav("arsenal");
    const q = (filter||"").toLowerCase();
    let list = PAIA_PROMPTS;
    const lvl = bag("ui").lvl || "all";
    if (lvl!=="all") list = list.filter((x)=>x.lvl===lvl);
    if (q) list = list.filter((x)=> (x.title+" "+x.obj+" "+x.prompt+" "+x.catName).toLowerCase().includes(q));
    app.innerHTML = `
      <p class="kicker">ARSENAL</p>
      <h2>100 prompts</h2>
      <p class="hint">Copiez, puis habillez. Jamais de données sensibles dans un outil public.</p>
      <input class="search" id="q" placeholder="Rechercher un métier, un livrable, un n°…" value="${filter||""}">
      <div class="filters">
        <button data-l="all" class="${lvl==="all"?"on":""}">Tous</button>
        <button data-l="tac" class="${lvl==="tac"?"on":""}">Tactique</button>
        <button data-l="str" class="${lvl==="str"?"on":""}">Stratégique</button>
        <button data-l="arc" class="${lvl==="arc"?"on":""}">Architecte</button>
      </div>
      <div class="grid" id="list">${list.map((x)=>`
        <a class="card-link" href="#/arsenal/${x.n}">
          <div class="num"><span class="badge ${x.lvl}">${x.lvl==="tac"?"TACTIQUE":x.lvl==="str"?"STRATÉGIQUE":"ARCHITECTE"}</span> ${String(x.n).padStart(3,"0")}</div>
          <h3>${x.title}</h3>
          <p>${x.catName} · ${x.obj}</p>
        </a>`).join("")}</div>`;
    $("#q").addEventListener("input", (e)=> arsenal(e.target.value));
    app.querySelectorAll(".filters button").forEach((b)=>{
      b.onclick = () => { bag("ui").lvl = b.dataset.l; persist(); arsenal($("#q").value); };
    });
  }

  function arsenalOne(n) {
    nav("arsenal");
    const x = PAIA_PROMPTS.find((p)=>p.n===n) || PAIA_PROMPTS[0];
    app.innerHTML = `
      <p class="kicker">${x.catName}</p>
      <p><span class="badge ${x.lvl}">${x.lvl==="tac"?"TACTIQUE":x.lvl==="str"?"STRATÉGIQUE":"ARCHITECTE"}</span></p>
      <h2>${String(x.n).padStart(3,"0")} · ${x.title}</h2>
      <p><strong>Objectif.</strong> ${x.obj}</p>
      <div class="codebox" id="code">${x.prompt}</div>
      <p style="margin:12px 0"><button class="btn" id="cp">Copier le code source</button></p>
      <p class="mini"><strong>Personnalisation.</strong> ${x.perso}</p>
      <p class="mini"><strong>Contrôle qualité.</strong> ${x.cq}</p>
      <label class="q">Ma version habillée</label>
      <textarea data-k="pr:h${x.n}" placeholder="Collez votre métier, votre pays, vos contraintes…"></textarea>
      <p class="saved" id="saved"></p>
      <div class="navp">
        ${x.n>1?`<a href="#/arsenal/${x.n-1}">← ${String(x.n-1).padStart(3,"0")}</a>`:`<a href="#/arsenal">Liste</a>`}
        ${x.n<100?`<a href="#/arsenal/${x.n+1}">${String(x.n+1).padStart(3,"0")} →</a>`:`<a href="#/arsenal">Liste</a>`}
      </div>`;
    $("#cp").onclick = () => copy(x.prompt);
    bind(app);
  }

  function route() {
    const h = (location.hash||"#/").replace(/^#/,"");
    const p = h.split("/").filter(Boolean);
    if (p[0]==="start") return start();
    if (p[0]==="parcours" && p[1]) return parcoursW(+p[1]);
    if (p[0]==="parcours") return parcoursList();
    if (p[0]==="livre" && p[1]) return livreOne(p[1]);
    if (p[0]==="livre") return livreList();
    if (p[0]==="cahier" && p[1]) return cahierOne(+p[1]);
    if (p[0]==="cahier") return cahierList();
    if (p[0]==="arsenal" && p[1]) return arsenalOne(+p[1]);
    if (p[0]==="arsenal") return arsenal();
    if (p[0]==="radar") return window.PAIA_RADAR.route(p.slice(1));
    home();
  }
  window.addEventListener("hashchange", route);
  route();
})();
