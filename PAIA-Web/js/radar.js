(() => {
  const MOIS = ["Janvier","Février","Mars","Avril","Mai","Juin","Juillet","Août","Septembre","Octobre","Novembre","Décembre"];
  const WEEKS = [4,4,5,4,5,4,4,5,4,4,5,4];
  const KEY = "paia-planner-365-v1";

  const $ = (s, el=document) => el.querySelector(s);
  const app = $("#app");

  function daysFor(w) {
    if (w === 52) return [358,359,360,361,362,363,364];
    const start = (w - 1) * 7 + 1;
    return Array.from({length: 7}, (_, i) => start + i);
  }
  function monthOfWeek(w) {
    let n = 0;
    for (let i = 0; i < 12; i++) {
      n += WEEKS[i];
      if (w <= n) return i + 1;
    }
    return 12;
  }
  function weeksOfMonth(m) {
    let start = 1;
    for (let i = 0; i < m - 1; i++) start += WEEKS[i];
    return Array.from({length: WEEKS[m-1]}, (_, i) => start + i);
  }

  function load() {
    try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
    catch { return {}; }
  }
  function save(data) {
    localStorage.setItem(KEY, JSON.stringify(data));
  }
  let DATA = load();
  const path = (p) => DATA[p] || (DATA[p] = {});

  function bind(root) {
    root.querySelectorAll("[data-k]").forEach((el) => {
      const k = el.dataset.k;
      const [a, b] = k.split(":");
      const bag = path(a);
      if (el.type === "checkbox") {
        el.checked = !!bag[b];
        el.addEventListener("change", () => { bag[b] = el.checked; persist(); });
      } else {
        el.value = bag[b] || "";
        el.addEventListener("input", () => { bag[b] = el.value; persist(); });
      }
    });
    root.querySelectorAll("[data-score]").forEach((wrap) => {
      const k = wrap.dataset.score;
      const [a, b] = k.split(":");
      const bag = path(a);
      const cur = Number(bag[b] || 0);
      wrap.querySelectorAll("button").forEach((btn) => {
        const n = Number(btn.dataset.n);
        if (n === cur) btn.classList.add("on");
        btn.addEventListener("click", () => {
          bag[b] = n;
          wrap.querySelectorAll("button").forEach((x) => x.classList.toggle("on", Number(x.dataset.n) === n));
          persist();
        });
      });
    });
    root.querySelectorAll("[data-ok]").forEach((btn) => {
      const k = btn.dataset.ok;
      const [a, b] = k.split(":");
      const bag = path(a);
      if (bag[b]) btn.classList.add("on");
      btn.addEventListener("click", () => {
        bag[b] = !bag[b];
        btn.classList.toggle("on", !!bag[b]);
        persist();
      });
    });
  }

  let tSave = 0;
  function persist() {
    save(DATA);
    const el = $(".saved") || $(".saved");
    if (el) {
      el.textContent = "Enregistré sur cet appareil";
      clearTimeout(tSave);
      tSave = setTimeout(() => { el.textContent = ""; }, 1600);
    }
  }

  function weekFilled(w) {
    const bag = DATA["s"+w] || {};
    return !!(bag.score || bag.resultat || bag.victoire);
  }
  function monthFilled(m) {
    const bag = DATA["m"+m] || {};
    return !!(bag.intention || bag.preuve || bag.score);
  }
  function progress() {
    let n = 0;
    for (let w = 1; w <= 52; w++) if (weekFilled(w)) n++;
    return n;
  }

  function nav(sub) {
    document.querySelectorAll("[data-nav]").forEach((a) =>
      a.classList.toggle("active", a.dataset.nav === "radar")
    );
    document.querySelectorAll("[data-rnav]").forEach((a) =>
      a.classList.toggle("active", a.dataset.rnav === sub)
    );
  }

  function subnav(active, mois, semaine) {
    const m = mois || 1;
    const s = semaine || 1;
    return `<nav class="rsub">
      <a href="#/radar" data-rnav="home">Radar</a>
      <a href="#/radar/contrat" data-rnav="contrat">Contrat</a>
      <a href="#/radar/annee" data-rnav="annee">Année</a>
      <a href="#/radar/mois/${m}" data-rnav="mois">Mois</a>
      <a href="#/radar/semaine/${s}" data-rnav="semaine">Semaine</a>
      <a href="#/radar/j365" data-rnav="j365">J365</a>
    </nav>`;
  }

  function pager(prev, next) {
    return `<div class="navp">
      ${prev ? `<a href="${prev[0]}">← ${prev[1]}</a>` : "<span></span>"}
      ${next ? `<a href="${next[0]}">${next[1]} →</a>` : "<span></span>"}
    </div><p class="saved" id="saved"></p>`;
  }

  function score(key) {
    return `<div class="score" data-score="${key}">
      ${[1,2,3,4,5].map((n) => `<button type="button" data-n="${n}">${n}</button>`).join("")}
    </div><p class="hint">5 = j’ai tenu mon plan. Si moins de 3, identifiez le système, pas la chance.</p>`;
  }

  function home() {
    nav("home");
    const p = progress();
    const pct = Math.round((p / 52) * 100);
    let nextW = 1;
    for (let w = 1; w <= 52; w++) if (!weekFilled(w)) { nextW = w; break; }
    const moisCards = MOIS.map((name, i) => {
      const m = i + 1;
      const ws = weeksOfMonth(m);
      const done = ws.filter(weekFilled).length;
      return `<a class="card-link" href="#/radar/mois/${m}">
        <div class="num">MOIS ${String(m).padStart(2,"0")}</div>
        <h3>${name}</h3>
        <p><span class="dot ${monthFilled(m)?"on":""}"></span>${done}/${ws.length} semaines</p>
      </a>`;
    }).join("");
    app.innerHTML = `
      <div class="hero">
        <img src="assets/cover-planner.jpeg" alt="Planner 365 — Radar d’intégrité">
        <div class="pad">
          <div class="k">COLLECTION PAIA · RADAR 365</div>
          <h1>Le Radar d’intégrité</h1>
          <p>Ce carnet n’est pas un agenda. C’est un radar. Une journée sans action notée est une journée perdue.</p>
          <div class="row">
            <a class="btn" href="#/radar/semaine/${nextW}">Continuer · S${String(nextW).padStart(2,"0")}</a>
            <a class="btn ghost" href="#/radar/contrat">Signer le contrat</a>
          </div>
        </div>
      </div>
      ${subnav("home")}
      <p class="hint">${p} / 52 semaines ouvertes · ${pct}&nbsp;%</p>
      <div class="progress"><span style="width:${pct}%"></span></div>
      <div class="grid g2">
        <a class="card-link" href="#/radar/contrat"><div class="num">JOUR 1</div><h3>Contrat moral</h3><p>Un objectif non planifié n’est qu’un vœu.</p></a>
        <a class="card-link" href="#/radar/annee"><div class="num">CARTE</div><h3>Radar stratégique</h3><p>L’année en une phrase, trois priorités.</p></a>
      </div>
      <h2 style="margin-top:28px">Les 12 mois</h2>
      <div class="grid g2">${moisCards}</div>
      <p style="margin-top:18px"><a class="btn ink" href="#/radar/j365">Tribunal J365</a></p>
      <div class="tools">
        <button class="btn ghost" id="exp">Exporter une copie</button>
        <button class="btn ghost" id="imp">Importer</button>
        <input type="file" id="file" accept="application/json" hidden>
      </div>
      <div class="foot">
        <img src="assets/logo.png" alt="BinaryWit">
        <p>Compagnon numérique de Reconverti &amp; Augmenté · Collection PAIA<br>B. Ly Abdourahamane · Une publication BinaryWit<br>Vos notes restent sur cet appareil. Aucun envoi réseau.</p>
      </div>`;
    $("#exp").onclick = () => {
      const blob = new Blob([JSON.stringify(DATA, null, 2)], {type:"application/json"});
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "paia-planner-365.json";
      a.click();
    };
    $("#imp").onclick = () => $("#file").click();
    $("#file").onchange = (e) => {
      const f = e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => {
        try {
          DATA = JSON.parse(r.result);
          save(DATA);
          home();
        } catch { alert("Fichier illisible."); }
      };
      r.readAsText(f);
    };
  }

  function contrat() {
    nav("contrat");
    app.innerHTML = `
      ${subnav("contrat")}
      <div class="banner"><div class="lab">JOUR 1</div><h2>Le contrat moral</h2><p>Un objectif non planifié n’est qu’un vœu.</p></div>
      <p class="kicker">CONTRAT</p>
      <h2>À signer avant d’avancer</h2>
      <p>Je m’engage à utiliser ce radar non pas pour de belles listes, mais pour créer une <strong>preuve de progression</strong>. Je choisis l’action quotidienne plutôt que la perfection mensuelle.</p>
      <label class="q">Je soussigné(e)</label>
      <input type="text" data-k="contrat:nom" placeholder="Votre nom">
      <label class="q">Ma règle absolue pour cette année</label>
      <textarea data-k="contrat:regle" placeholder="Ex. : Je ne finis pas une journée sans une preuve d’action."></textarea>
      <label class="q">Indicateur de survie (J365)</label>
      <textarea data-k="contrat:survie" placeholder="Le 31 décembre, qu’est-ce qui me prouvera que je n’ai pas perdu cette année&nbsp;?"></textarea>
      <div class="grid g2">
        <div><label class="q">Signature</label><input type="text" data-k="contrat:sign"></div>
        <div><label class="q">Date</label><input type="date" data-k="contrat:date"></div>
      </div>
      ${pager(["#/radar","Radar"], ["#/radar/annee","Carte annuelle"])}`;
    bind(app);
  }

  function annee() {
    nav("annee");
    app.innerHTML = `
      ${subnav("annee")}
      <p class="kicker">CARTE ANNUELLE</p>
      <h2>Le radar stratégique</h2>
      <label class="q">Mon année en une phrase</label><textarea data-k="annee:phrase"></textarea>
      <label class="q">Objectif principal</label><textarea class="sm" data-k="annee:objectif"></textarea>
      <label class="q">Preuve que je veux obtenir</label><textarea class="sm" data-k="annee:preuve"></textarea>
      <label class="q">Priorité 1</label><textarea class="sm" data-k="annee:p1"></textarea>
      <label class="q">Priorité 2</label><textarea class="sm" data-k="annee:p2"></textarea>
      <label class="q">Priorité 3</label><textarea class="sm" data-k="annee:p3"></textarea>
      <label class="q">Personnes et ressources qui peuvent m’aider</label><textarea data-k="annee:aide"></textarea>
      ${pager(["#/radar/contrat","Contrat"], ["#/radar/mois/1","Janvier"])}`;
    bind(app);
  }

  function mois(m) {
    nav("mois");
    const name = MOIS[m-1];
    const ws = weeksOfMonth(m);
    const k = "m"+m;
    const weekLinks = ws.map((w) =>
      `<a class="card-link" href="#/radar/semaine/${w}"><div class="num">S${String(w).padStart(2,"0")} / 52</div>
       <h3>Autopsie</h3><p><span class="dot ${weekFilled(w)?"on":""}"></span>J${String(daysFor(w)[0]).padStart(3,"0")}–${String(daysFor(w).at(-1)).padStart(3,"0")}</p></a>`
    ).join("");
    const prev = m > 1 ? [`#/radar/mois/${m-1}`, MOIS[m-2]] : ["#/radar/annee","Carte"];
    const next = m < 12 ? [`#/radar/mois/${m+1}`, MOIS[m]] : ["#/radar/j365","J365"];
    app.innerHTML = `
      ${subnav("mois", m, ws[0])}
      <div class="banner"><div class="lab">MOIS ${String(m).padStart(2,"0")}</div><h2>${name}</h2><p>Une intention. Une preuve. Trois saboteurs à neutraliser.</p></div>
      <p class="kicker">POINT DE BASCULE</p>
      <p class="hint">Si je ne peux réussir qu’UNE seule chose ce mois-ci, quelle est-elle&nbsp;?</p>
      <label class="q">Intention-fer-de-lance</label><textarea data-k="${k}:intention"></textarea>
      <label class="q">Preuve terminale — un fait, pas une impression</label><textarea data-k="${k}:preuve"></textarea>
      <label class="q">Saboteur 1</label><textarea class="sm" data-k="${k}:sab1"></textarea>
      <label class="q">Saboteur 2</label><textarea class="sm" data-k="${k}:sab2"></textarea>
      <label class="q">Saboteur 3</label><textarea class="sm" data-k="${k}:sab3"></textarea>
      <label class="q">Résultat prioritaire 1</label><textarea class="sm" data-k="${k}:r1"></textarea>
      <label class="q">Résultat prioritaire 2</label><textarea class="sm" data-k="${k}:r2"></textarea>
      <label class="q">Résultat prioritaire 3</label><textarea class="sm" data-k="${k}:r3"></textarea>
      <label class="q">Habitudes</label>
      <div class="habits">
        <label><input type="checkbox" data-k="${k}:h_apprendre"> Apprendre</label>
        <label><input type="checkbox" data-k="${k}:h_produire"> Produire</label>
        <label><input type="checkbox" data-k="${k}:h_contacter"> Contacter</label>
        <label><input type="checkbox" data-k="${k}:h_mesurer"> Mesurer</label>
      </div>
      <h2 style="margin-top:28px">Semaines de ${name}</h2>
      <div class="grid g2">${weekLinks}</div>
      <p class="kicker" style="margin-top:28px">TRIBUNAL MENSUEL</p>
      <h2>${name} · ${String(m).padStart(2,"0")} / 12</h2>
      <label class="q">Ce que ${name} m’a appris</label><textarea data-k="${k}:appris_mois"></textarea>
      <label class="q">Appris — compétence, outil, IA</label><textarea class="sm" data-k="${k}:appris"></textarea>
      <label class="q">Produit — livrable, projet, vente</label><textarea class="sm" data-k="${k}:produit"></textarea>
      <label class="q">Décision de bascule — la seule pour le mois prochain</label><textarea data-k="${k}:bascule"></textarea>
      <label class="q">Score du mois</label>
      ${score(k+":score")}
      <label class="q">Pourquoi cette note&nbsp;?</label><textarea class="sm" data-k="${k}:pourquoi"></textarea>
      ${pager(prev, next)}`;
    bind(app);
  }

  function semaine(w) {
    nav("semaine");
    const jours = daysFor(w);
    const m = monthOfWeek(w);
    const k = "s"+w;
    const rows = jours.map((j) => `
      <div class="day">
        <div class="j">J${String(j).padStart(3,"0")}</div>
        <textarea class="sm" data-k="${k}:j${j}" placeholder="Action / preuve"></textarea>
        <button type="button" class="ok" data-ok="${k}:ok${j}" aria-label="Fait"></button>
      </div>`).join("");
    const prev = w > 1 ? [`#/radar/semaine/${w-1}`, "S"+String(w-1).padStart(2,"0")] : [`#/radar/mois/${m}`, MOIS[m-1]];
    const next = w < 52 ? [`#/radar/semaine/${w+1}`, "S"+String(w+1).padStart(2,"0")] : ["#/radar/j365","J365"];
    app.innerHTML = `
      ${subnav("semaine", m, w)}
      <p class="kicker">RADAR D’INTÉGRITÉ</p>
      <h2>Autopsie · Semaine ${String(w).padStart(2,"0")} / 52</h2>
      <p class="hint">Jours ${String(jours[0]).padStart(3,"0")} à ${String(jours.at(-1)).padStart(3,"0")} · <a href="#/radar/mois/${m}">${MOIS[m-1]}</a></p>
      <div class="grid g2">
        <div><label class="q">Résultat essentiel</label><textarea data-k="${k}:resultat"></textarea></div>
        <div><label class="q">Priorité d’apprentissage</label><textarea data-k="${k}:apprend"></textarea></div>
      </div>
      <label class="q">Du</label><input type="date" data-k="${k}:du">
      <label class="q">Au</label><input type="date" data-k="${k}:au">
      <p class="kicker" style="margin-top:18px">SEPT JOURS</p>
      ${rows}
      <p class="kicker" style="margin-top:18px">TRIBUNAL DE LA SEMAINE</p>
      <label class="q">1. Micro-victoire</label><textarea class="sm" data-k="${k}:victoire"></textarea>
      <label class="q">2. Témoin de l’IA</label><textarea class="sm" data-k="${k}:ia"></textarea>
      <label class="q">3. Contrôle des dégâts</label><textarea class="sm" data-k="${k}:degats"></textarea>
      <label class="q">Score d’intégrité</label>
      ${score(k+":score")}
      ${pager(prev, next)}`;
    bind(app);
  }

  function j365() {
    nav("j365");
    app.innerHTML = `
      ${subnav("j365", 12, 52)}
      <div class="banner"><div class="lab">J365</div><h2>Le tribunal du jour 365</h2><p>La transformation se mesure au muscle de l’action.</p></div>
      <label class="q">La preuve à exhiber — la réalisation dont je suis le plus fier / la plus fière</label>
      <textarea data-k="j365:preuve"></textarea>
      <label class="q">Il y a un an, j’étais</label><textarea class="sm" data-k="j365:avant"></textarea>
      <label class="q">Aujourd’hui, je suis quelqu’un qui sait</label><textarea class="sm" data-k="j365:apres"></textarea>
      <label class="q">Pass de relais — première action de l’année 2 (demain matin, pas janvier)</label>
      <textarea data-k="j365:relais"></textarea>
      <label class="q">Compétences développées</label><textarea class="sm" data-k="j365:comp"></textarea>
      <label class="q">Opportunités créées</label><textarea class="sm" data-k="j365:opp"></textarea>
      <p>Je choisis de continuer à apprendre, expérimenter, créer de la valeur et mesurer mes progrès sans compromis.</p>
      <div class="grid g2">
        <div><label class="q">Signature</label><input type="text" data-k="j365:sign"></div>
        <div><label class="q">Date</label><input type="date" data-k="j365:date"></div>
      </div>
      ${pager(["#/radar/mois/12","Décembre"], ["#/radar","Radar"])}
      <div class="foot">
        <img src="assets/logo.png" alt="BinaryWit">
        <p>Vous avez tenu 365 jours. Vous n’êtes plus le même professionnel.<br>Une publication BinaryWit</p>
      </div>`;
    bind(app);
  }

  window.PAIA_RADAR = {
    route(parts) {
      const a = parts[0];
      if (a === "contrat") return contrat();
      if (a === "annee") return annee();
      if (a === "mois") return mois(Math.min(12, Math.max(1, Number(parts[1]) || 1)));
      if (a === "semaine") return semaine(Math.min(52, Math.max(1, Number(parts[1]) || 1)));
      if (a === "j365") return j365();
      home();
    }
  };
})();
