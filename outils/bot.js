/* Un joueur automatique pour régler la difficulté sur 30 vagues.
   Il regarde les 3 vagues à venir, achète les contres qu'elles demandent
   (anti-vol, perce-armure, brise-bouclier, détecteur, zone, anti-géant),
   garde un peu d'économie, puis renforce et améliore. Il n'utilise ni
   les pouvoirs ni les cadeaux : un vrai joueur fait mieux que lui.
   À charger dans la page ouverte avec ?banc, puis :
   joue(indiceMonde, mode, prudence) → { gagne, vies, vague, parVague } */
window.joue = function(im, mode, prudence = 1, limite = 99, carte = 0){
  const g = window.__gdc;
  window.__gdcEnTest = true;   /* le robot ne laisse ni étoiles ni records */
  g.lanceMonde(g.MONDES[im], mode, false, carte);
  const J = g.J, M = g.M, CASE = 48;
  const libres = () => Object.keys(M.tours).filter(k => (M.tours[k].debloque || 0) <= J.vague);
  const contre = (k) => M.tours[k].contre || [];
  const traits = (d) => {
    const t = [];
    if (d.vole) t.push("vole"); if (d.armure) t.push("armure"); if (d.bouclier) t.push("bouclier");
    if (d.furtif || d.sousTerre) t.push("invisible"); if (d.nuee) t.push("nuee"); if (d.boss) t.push("boss");
    if (d.vit >= 60 || d.inarretable) t.push("rapide");
    return t;
  };
  const besoins = () => {
    const n = {};
    for (let k = J.vague; k < Math.min(J.vagues.length, J.vague + 3); k++)
      for (const gr of J.vagues[k]){ for (const t of traits(M.ennemis[gr[0]])) n[t] = 1; if (gr[5]) n.boss = 1; }
    for (const e of J.ennemis) for (const t of traits(e.d)) n[t] = 1;
    return n;
  };
  const compte = (tag) => J.tours.filter(t => (t.d.contre || []).includes(tag)).length;
  const prixAmel = (t) => Math.round(t.d.prix * [.8, 1.15][t.niv - 1]);
  /* comme un vrai joueur : pouvoirs quand ça presse, cadeaux ramassés */
  const avecPouvoirs = window.botPouvoirs !== false;
  function joueur(){
    if (!avecPouvoirs) return;
    for (const k of [...J.cadeaux]) if (k.t > .6) g.ouvreCadeau(k);
    for (const p of (M.pouvoirs || [])){
      if (J.pouvoirs[p.id] > J.t) continue;
      const vis = J.ennemis.filter(e => !e.cache && !e.mort);
      const urgence = vis.some(e => e.d.boss || e.geant) || vis.length >= 8;
      if (!urgence) continue;
      let pt = null;
      if (p.cible){
        let best = -1;
        for (const e of vis){
          const n = vis.filter(x => Math.hypot(x.x - e.x, x.y - e.y) < (p.rayon || 90)).length + (e.d.boss || e.geant ? 4 : 0);
          if (n > best){ best = n; pt = { x:e.x, y:e.y }; }
        }
      }
      g.lancePouvoir(p, pt);
    }
  }

  /* ── où poser, monde par monde ── */
  const MURS = new Set();
  if (M.id === "gouter") for (const [x, y] of M.mursBot()) MURS.add(x + "," + y);
  const PLACE = {
    potager(type){
      const d = M.tours[type];
      const chemin = [];
      for (let gx = 0; gx < 20; gx++) for (let gy = 0; gy < 12; gy++){
        const e = M.emplacement(J, gx * CASE + 24, gy * CASE + 24, type);
        if (e && e.raison === "Pas sur le chemin !") chemin.push([gx * CASE + 24, gy * CASE + 24]);
      }
      let best = null, bs = -1e9;
      for (let gx = 0; gx < 20; gx++) for (let gy = 0; gy < 12; gy++){
        const e = M.emplacement(J, gx * CASE + 24, gy * CASE + 24, type); if (!e || !e.ok) continue;
        const r = d.portee || 80;
        const s = d.genre === "prod" ? -chemin.filter(([a, b]) => Math.hypot(a - e.x, b - e.y) < 150).length
                                    : chemin.filter(([a, b]) => Math.hypot(a - e.x, b - e.y) <= r).length;
        if (s > bs){ bs = s; best = e; }
      }
      return best;
    },
    gouter(type){
      const d = M.tours[type];
      const chemin = [];
      for (let gx = 0; gx < 20; gx++) for (let gy = 0; gy < 12; gy++){ const v = J.dist[gy * 20 + gx]; if (v !== Infinity && v > 0 && v < 60) chemin.push([gx * CASE + 24, gy * CASE + 24]); }
      let best = null, bs = -1;
      for (let gx = 0; gx < 20; gx++) for (let gy = 0; gy < 12; gy++){
        if (MURS.has(gx + "," + gy)) continue;
        const e = M.emplacement(J, gx * CASE + 24, gy * CASE + 24, type); if (!e || !e.ok) continue;
        const s = chemin.filter(([a, b]) => Math.hypot(a - e.x, b - e.y) <= (d.portee || 70)).length;
        if (s > bs){ bs = s; best = e; }
      }
      return best;
    },
    plage(type){
      const d = M.tours[type], { X0, CW, NL, yLigne:yl } = M.geo();
      const cols = d.flotte ? [1, 2, 0] : d.genre === "mur" ? [3, 2] : contre(type).includes("eco") || contre(type).includes("invisible") || contre(type).includes("soutien") ? [7, 6] : type === "epuisette" ? [4, 3] : [7, 6, 5, 4];
      let best = null, bs = 1e9;
      for (const col of cols) for (let l = 0; l < NL; l++){
        const e = M.emplacement(J, X0 + col * CW + 40, yl(l), type); if (!e || !e.ok) continue;
        const menace = J.ennemis.filter(e => e.ligne === l).length + (J.file || []).filter(f => f.entree === l).length * .3;
        const s = J.tours.filter(t => t.ligne === l && t.d === d).length * 10 + J.tours.filter(t => t.ligne === l).length - menace * 4 + cols.indexOf(col) * .1;
        if (s < bs){ bs = s; best = e; }
      }
      return best;
    },
    espace(type){
      const { anneaux } = M.geo(), ordre = [];
      /* les emplacements dans un ordre qui couvre vite toutes les directions */
      anneaux.forEach((A, k) => { const pas = Math.max(1, Math.floor(A.n / 2) - (A.n % 2 ? 0 : 1)); const vus = new Set(); for (let j = 0, i = 0; j < A.n; j++){ while (vus.has(i)) i = (i + 1) % A.n; vus.add(i); ordre.push([k, i]); i = (i + pas) % A.n; } });
      const d = M.tours[type];
      const liste = d.portee && !d.detecte && !d.libre ? ordre : ordre.slice().reverse();
      for (const [k, i] of liste){
        const A = anneaux[k], a = A.a0 + i * Math.PI * 2 / A.n + J.rot[k];
        const e = M.emplacement(J, 480 + Math.cos(a) * A.r, 292 + Math.sin(a) * A.r, type);
        if (e && e.ok) return e;
      }
      return null;
    }
  };
  const achete = (type, urgent) => {
    if (J.argent < M.tours[type].prix) return false;
    let e = PLACE[M.id](type);
    if (!e || !e.ok){
      /* plus de place : on remplace le défenseur le plus faible par mieux */
      const d = M.tours[type];
      const faible = J.tours.filter(t => t.d.prix < d.prix * (urgent ? 1.6 : .6) && !contre(t.type).includes("mur") && !contre(t.type).includes("eco") && t.type !== type && !t.d.detecte)
                            .sort((a, b) => a.d.prix * a.niv - b.d.prix * b.niv)[0];
      if (!faible || J.argent + Math.round(faible.investi * .6) < d.prix) return false;
      g.vendTour(faible);
      e = PLACE[M.id](type);
    }
    if (e && e.ok && J.argent >= M.tours[type].prix){ g.poseTour(type, e); return true; }
    return false;
  };

  function strategie(){
    if (M.id === "plage") for (const s of [...J.coqs]) if (s.t > 2 / prudence) M.clic(J, { x:s.x, y:s.y - 4 });
    if (M.id === "gouter" && J.tours.filter(t => t.type !== "sac").length >= 2){
      for (const k of MURS){ if (J.argent < 50) break; const [x, y] = k.split(",").map(Number); const e = M.emplacement(J, x * CASE + 24, y * CASE + 24, "sac"); if (e && e.ok) g.poseTour("sac", e); }
    }
    const L = libres();
    if (M.id === "espace" && M.FUSIONS && window.botFusion !== false && M.geo().anneaux.reduce((n, A) => n + A.n, 0) - Object.keys(J.occ).length <= 2){
      /* plus de place : on fusionne avant de revendre */
      for (const res of ["annihilateur", "missileSolaire", "laserSolaire", "droneMitrailleur", "laserRadar", "fuseeAimantee", "laserGlacant", "centrale"]){
        const f = M.FUSIONS.find(x => x.res === res);
        const t = J.tours.find(x => x.type === f.a), p = J.tours.find(x => x.type === f.b);
        if (!t || !p || J.argent < Math.round((M.tours[f.a].prix + M.tours[f.b].prix) * .3) + 10) continue;
        /* ne jamais fusionner le dernier contre dont on a besoin, sauf si l hybride le garde */
        const nb = besoins(), garde = M.tours[f.res].contre || [];
        const perd = Object.keys(nb).some(tag => !garde.includes(tag) && compte(tag) - [t, p].filter(x => (x.d.contre || []).includes(tag)).length < 1 && compte(tag) >= 1);
        if (perd) continue;
        M.fusionne(J, t, f); break;
      }
    }
    if (M.id === "plage"){
      /* un muret devant chaque couloir défendu */
      const G = M.geo();
      for (let l = 0; l < G.NL; l++){
        const tireurs = J.tours.filter(t => t.ligne === l && t.d.genre === "tir").length;
        const murs = J.tours.filter(t => t.ligne === l && t.d.genre === "mur").length;
        if (tireurs && !murs && J.argent >= 30){ const e = M.emplacement(J, G.X0 + 3 * G.CW + 40, G.yLigne(l), "muret"); if (e && e.ok) g.poseTour("muret", e); }
      }
    }
    const eco = L.filter(k => contre(k).includes("eco"));
    const defense = J.tours.filter(t => !contre(t.type).includes("eco") && !contre(t.type).includes("mur")).length;
    if (defense < 2){ const base = L.filter(k => M.tours[k].genre === "tir").sort((a, b) => M.tours[a].prix - M.tours[b].prix)[0]; if (base) achete(base); return; }
    for (const k of eco) if (J.tours.filter(t => t.type === k).length < Math.min(2, 1 + Math.floor(J.vague / 6)) && J.vague < 18) achete(k);
    const nb = besoins(), voulu = 1 + Math.floor(J.vague / 6);
    for (const tag of window.botSansContres ? [] : ["invisible", "vole", "armure", "bouclier", "nuee", "boss", "rapide"]){
      if (!nb[tag] || compte(tag) >= voulu) continue;
      const cands = L.filter(k => contre(k).includes(tag) && !contre(k).includes("eco")).sort((a, b) => M.tours[b].prix - M.tours[a].prix);
      if (!cands.length) continue;
      const k = cands.find(k => M.tours[k].prix <= J.argent);
      if (k) achete(k, compte(tag) === 0); else if (M.tours[cands[cands.length - 1]].prix < J.argent * 2.5) return;
    }
    const amel = J.tours.filter(t => t.niv < 3 && !t.d.sansNiveau && !contre(t.type).includes("eco") && !contre(t.type).includes("mur"))
                        .sort((a, b) => a.niv - b.niv || b.d.prix - a.d.prix)[0];
    if (amel && (M.peutAmeliorer ? M.peutAmeliorer(J, amel) : J.argent >= prixAmel(amel)) && J.argent >= prixAmel(amel) + 20) g.amelioreTour(amel, amel.g % 2);
    const forts = L.filter(k => !contre(k).includes("eco") && !contre(k).includes("mur") && (M.tours[k].genre === "tir" || M.tours[k].genre === "zone" || M.tours[k].agit) && (!window.botSansContres || !(contre(k).some(c => ["invisible","vole","armure","bouclier","boss"].includes(c)))))
                   .sort((a, b) => M.tours[b].prix - M.tours[a].prix);
    const k = forts.find(k => M.tours[k].prix <= J.argent);
    if (k && J.argent > M.tours[k].prix * 1.1) achete(k);
  }

  let garde = 0; const parVague = [], argents = [];
  while (!J.fini && garde++ < 60 * 60 * 60 && J.vague <= limite){
    if (garde % 30 === 0){ strategie(); joueur(); }
    if (M.id === "espace" && garde % 30 === 0 && J.ennemis.length && prudence > 0){
      let sx = 0, sy = 0; for (const e of J.ennemis){ if (e.cache) continue; sx += Math.cos(e.a) / e.r; sy += Math.sin(e.a) / e.r; }
      const cible = Math.atan2(sy, sx);
      for (let k = 0; k < M.geo().anneaux.length; k++){
        let best = null;
        for (const t of J.tours) if (t.anneau === k && t.d.portee && !t.d.detecte && t.d.genre === "tir" && t.angPose !== undefined){ const d = Math.atan2(Math.sin(cible - t.angPose), Math.cos(cible - t.angPose)); if (best === null || Math.abs(d) < Math.abs(best)) best = d; }
        if (best !== null) J.rot[k] += Math.max(-.6, Math.min(.6, best)) * prudence;
      }
    }
    if (!J.file.length && J.vague < J.vagues.length && (J.vague === 0 || (J.entre && J.compte < (J.grand ? 3 : 8)))){ parVague.push(J.vies); argents.push(Math.round(J.argent)); g.lanceVague(); }
    g.pas(1 / 60);
  }
  return { monde:M.id, mode, gagne:J.vies > 0 && J.vague >= J.vagues.length, vies:J.vies, viesMax:J.viesMax, vague:J.vague, argent:Math.round(J.argent),
           tours:J.tours.length, temps:Math.round(J.t), parVague:parVague.join(","), argents:argents.join(","), mix:[...new Set(J.tours.map(t => t.type))].join(" ") };
};
