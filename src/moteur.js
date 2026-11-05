/* ═════════════════════════════════════════════════════════════
   LES GARDIENS DU CENTRE — le moteur commun aux quatre mondes
   Chaque monde (potager, goûter, plage, espace) s'inscrit avec
   ajouteMonde() et n'écrit que ce qui le rend différent : son sol,
   ses défenseurs, ses bestioles, ses vagues, ses pouvoirs et sa
   règle propre. Tout le reste vit ici : spécialisations, visée,
   combos, cadeaux, défis de vague, élites, mode infini, scores.
   ═════════════════════════════════════════════════════════════ */
const W = 960, H = 576, CASE = 48;
const MONDES = [];
const ajouteMonde = (m) => { m.tours.aimant = Object.assign({}, TOUR_AIMANT); MONDES.push(m); };
/* un objet commun aux quatre mondes : il attire et ouvre les cadeaux de loin */
const TOUR_AIMANT = {
  nom:"Aimant à cadeaux", prix:90, debloque:3, contre:["bonus"], aimant:true, rayon:230, pv:80,
  desc:"Attire tout seul les cadeaux qui tombent sur une large zone autour de lui, et les ouvre pour toi.",
  branches:[
    { nom:"Super aimant", desc:"Attire les cadeaux de beaucoup plus loin.", mods:{ rayon:1.6 } },
    { nom:"Aimant chanceux", desc:"Fait tomber plus de cadeaux, et chacun rapporte un petit bonus en plus.", effets:{ chance:1 } }
  ],
  dessine(t, tm){
    ov(0, 12, 15, 5, "rgba(0,0,0,.15)", 0, 0);
    c.save(); c.translate(0, -14 + Math.sin(tm * 3 + (t.g || 0)) * 2);
    c.beginPath(); c.arc(0, 0, 12, Math.PI, TAU); c.lineWidth = 9; c.strokeStyle = "#E0533D"; c.stroke();
    bx(-16.5, -1, 9, 10, "#E0533D", 1, .5); bx(7.5, -1, 9, 10, "#E0533D", 2, .5);
    bx(-16.5, 6, 9, 5, "#DCE6EE", 3, 0); bx(7.5, 6, 9, 5, "#DCE6EE", 4, 0);
    c.restore();
    if (!t.icone) for (let i = 0; i < 3; i++){ const a = tm * 2 + i * 2.1; etoile5(Math.cos(a) * 20, -18 + Math.sin(a) * 9, 3, 1.3, "#F2B33B", i, 0); }
    else paquet(14, -30, 6, 1, "#3E9FC9");
  }
};

/* ── petits outils ── */
const hache = (n) => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
const alea = (a, b) => a + Math.random() * (b - a);
const choix = (t) => t[Math.floor(Math.random() * t.length)];
const borne = (v, a, b) => v < a ? a : v > b ? b : v;
const dist = (ax, ay, bx, by) => Math.hypot(bx - ax, by - ay);
const TAU = Math.PI * 2;
const ecartAngle = (a, b) => { let d = (b - a) % TAU; if (d > Math.PI) d -= TAU; if (d < -Math.PI) d += TAU; return d; };
const memoire = {
  lis(k, d){ try { const v = localStorage.getItem("gdc:" + k); return v === null ? d : JSON.parse(v); } catch(e){ return d; } },
  ecris(k, v){ if (window.__gdcEnTest && /^(etoiles|record|infini):/.test(k)) return; try { localStorage.setItem("gdc:" + k, JSON.stringify(v)); } catch(e){} }
};
const nombre = (n) => Math.round(n).toLocaleString("fr-FR");

/* ═════════════════════════════════════════════════════════════
   LE PAPIER DÉCOUPÉ
   Toute forme est un polygone aux bords un peu irréguliers (coup de
   ciseaux), posé sur sa propre ombre décalée, avec un grain de fibre.
   Le hasard des bords est tiré d'une graine : il ne frémit pas d'une
   image à l'autre.
   ═════════════════════════════════════════════════════════════ */
let c = null;                                   // le contexte où l'on dessine
let OMBRE = "rgba(70,40,15,.30)";
let GRAIN = null;
function avec(ctx, f){ const a = c; c = ctx; try { f(); } finally { c = a; } }
function fabriqueGrain(){
  const g = document.createElement("canvas"); g.width = g.height = 128;
  const x = g.getContext("2d"), d = x.createImageData(128, 128);
  for (let i = 0; i < 128 * 128; i++){
    const v = Math.random() < .5 ? 0 : 255;
    d.data[i*4] = d.data[i*4+1] = d.data[i*4+2] = v;
    d.data[i*4+3] = Math.random() < .5 ? Math.random() * 46 : 0;
  }
  x.putImageData(d, 0, 0);
  x.globalAlpha = .10; x.strokeStyle = "#fff"; x.lineWidth = .7;
  for (let i = 0; i < 26; i++){
    const a = Math.random() * TAU, px = Math.random() * 128, py = Math.random() * 128, l = alea(4, 12);
    x.beginPath(); x.moveTo(px, py); x.quadraticCurveTo(px + Math.cos(a+1)*l*.5, py + Math.sin(a+1)*l*.5, px + Math.cos(a)*l, py + Math.sin(a)*l); x.stroke();
  }
  return g;
}
const grain = () => c.__grain || (c.__grain = c.createPattern(GRAIN, "repeat"));

function trace(p){
  c.beginPath(); c.moveTo(p[0], p[1]);
  for (let i = 2; i < p.length; i += 2) c.lineTo(p[i], p[i+1]);
  c.closePath();
}
function papier(p, coul, prof = 1){
  if (prof){
    const dx = 1.5 * prof, dy = 2.3 * prof;
    c.translate(dx, dy); trace(p); c.fillStyle = OMBRE; c.fill(); c.translate(-dx, -dy);
  }
  trace(p); c.fillStyle = coul; c.fill();
  const a = c.globalAlpha; c.globalAlpha = a * .9; c.fillStyle = grain(); c.fill(); c.globalAlpha = a;
}
function ovale(x, y, rx, ry, g = 0, n = 0, rugo = .045){
  n = n || borne(Math.round((rx + ry) * .42), 9, 30);
  const p = new Array(n * 2);
  for (let i = 0; i < n; i++){
    const a = i / n * TAU, j = 1 + (hache(g * 13.7 + i * 1.31) - .5) * rugo * 2;
    p[i*2] = x + Math.cos(a) * rx * j; p[i*2+1] = y + Math.sin(a) * ry * j;
  }
  return p;
}
function boite(x, y, w, h, g = 0, r = 1.3){
  const j = (k) => (hache(g * 7.3 + k * 2.1) - .5) * 2 * r;
  return [x + j(0), y + j(1), x + w + j(2), y + j(3), x + w + j(4), y + h + j(5), x + j(6), y + h + j(7)];
}
function forme(pts, g = 0, r = 1.1){ return pts.map((v, i) => v + (hache(g * 5.1 + i * 3.7) - .5) * 2 * r); }
const ov = (x, y, rx, ry, coul, g = 0, prof = 1) => papier(ovale(x, y, rx, ry, g), coul, prof);
const bx = (x, y, w, h, coul, g = 0, prof = 1) => papier(boite(x, y, w, h, g), coul, prof);
const fo = (pts, coul, g = 0, prof = 1) => papier(forme(pts, g), coul, prof);
function bande(x1, y1, x2, y2, ep, coul, g = 0, prof = 1){
  const a = Math.atan2(y2 - y1, x2 - x1) + Math.PI / 2, dx = Math.cos(a) * ep / 2, dy = Math.sin(a) * ep / 2;
  fo([x1+dx, y1+dy, x2+dx, y2+dy, x2-dx, y2-dy, x1-dx, y1-dy], coul, g, prof);
}
function feuille(x, y, lg, larg, ang, coul, g = 0, prof = 1){
  const p = [], n = 8, ca = Math.cos(ang), sa = Math.sin(ang);
  for (let i = 0; i <= n; i++){ const t = i / n, l = t * lg, w = Math.sin(t * Math.PI) * larg / 2; p.push(x + ca*l - sa*w, y + sa*l + ca*w); }
  for (let i = n - 1; i > 0; i--){ const t = i / n, l = t * lg, w = -Math.sin(t * Math.PI) * larg / 2; p.push(x + ca*l - sa*w, y + sa*l + ca*w); }
  fo(p, coul, g, prof);
}
function etoile5(x, y, r1, r2, coul, g = 0, prof = 1, rot = -Math.PI / 2){
  const p = [];
  for (let i = 0; i < 10; i++){ const r = i % 2 ? r2 : r1, a = rot + i * Math.PI / 5; p.push(x + Math.cos(a) * r, y + Math.sin(a) * r); }
  fo(p, coul, g, prof);
}
/* pour les chapeaux de fête : on retient où la bestiole a sa tête (le bord du chapeau, sa taille) */
let guetteTete = false, teteVue = null;
function marqueTete(x, y, k){ if (guetteTete && !teteVue) teteVue = { m:c.getTransform(), x, y, k }; }
function yeux(x, y, ec, r, rx = 0, ry = 0, g = 0, cligne = false){
  marqueTete(x, y - r * 1.5, (ec + r) / 5.2);
  for (const s of [-1, 1]){
    if (cligne){ bande(x + s*ec - r*.8, y, x + s*ec + r*.8, y, r * .35, "#2B211B", g, 0); continue; }
    ov(x + s*ec, y, r, r * 1.12, "#FFFDF6", g + s, .35);
    ov(x + s*ec + rx*r*.38, y + ry*r*.38, r * .56, r * .6, "#2B211B", g + s + 3, 0);
    ov(x + s*ec + rx*r*.38 - r*.18, y + ry*r*.38 - r*.24, r * .18, r * .18, "#FFFFFF", 0, 0);
  }
}
function sourire(x, y, l, coul = "#2B211B", ep = 1.8){
  c.beginPath(); c.arc(x, y - l * .4, l, .25 * Math.PI, .75 * Math.PI);
  c.strokeStyle = coul; c.lineWidth = ep; c.lineCap = "round"; c.stroke();
}
function joues(x, y, ec, r){ ov(x - ec, y, r, r * .7, "rgba(240,110,110,.55)", 0, 0); ov(x + ec, y, r, r * .7, "rgba(240,110,110,.55)", 0, 0); }
function texteP(t, x, y, taille, coul = "#33261D", align = "center", contour = null){
  c.font = `400 ${taille}px Sniglet, "Trebuchet MS", sans-serif`;
  c.textAlign = align; c.textBaseline = "middle";
  if (contour){ c.lineWidth = taille / 4; c.strokeStyle = contour; c.lineJoin = "round"; c.strokeText(t, x, y); }
  else { c.fillStyle = "rgba(51,38,29,.25)"; c.fillText(t, x + 1.2, y + 1.8); }
  c.fillStyle = coul; c.fillText(t, x, y);
}
function icone(dessin, px = 26, unite = 40){
  const k = document.createElement("canvas"), r = 2;
  k.width = k.height = px * r;
  const x = k.getContext("2d"); x.scale(px * r / unite, px * r / unite);
  avec(x, () => dessin(unite));
  return k;
}
/* le paquet cadeau (aussi l'icône du trophée de score) */
function paquet(x, y, s, g = 0, coul = "#E0533D"){
  bx(x - s, y - s * .7, s * 2, s * 1.6, coul, g, 1);
  bx(x - s * 1.12, y - s * .95, s * 2.24, s * .5, coul, g + 1, .6);
  bande(x, y - s * .95, x, y + s * .9, s * .38, "#F2B33B", g, 0);
  bande(x - s, y - s * .2, x + s, y - s * .2, s * .3, "#F2B33B", g + 2, 0);
  feuille(x, y - s * .95, s * .9, s * .55, -2.5, "#F2B33B", g + 3, .3);
  feuille(x, y - s * .95, s * .9, s * .55, -.64, "#F2B33B", g + 4, .3);
}
function trophee(u){
  fo([u*.22, u*.12, u*.78, u*.12, u*.72, u*.46, u*.5, u*.6, u*.28, u*.46], "#F2B33B", 1, 1);
  bande(u*.5, u*.58, u*.5, u*.78, u*.1, "#D99A1E", 0, 0);
  bx(u*.3, u*.76, u*.4, u*.12, "#8E6440", 2, .6);
  ov(u*.42, u*.26, u*.06, u*.1, "rgba(255,255,255,.5)", 0, 0);
}

/* ═════════════════════════════════════════════════════════════
   LE SON — quelques bips synthétisés, rien à charger
   ═════════════════════════════════════════════════════════════ */
let audio = null, muet = memoire.lis("muet", false), dernierTir = 0;
function son(nom){
  if (muet) return;
  try {
    audio = audio || new (window.AudioContext || window.webkitAudioContext)();
    if (audio.state === "suspended") audio.resume();
    const t = audio.currentTime;
    const note = (f1, f2, dur, type = "sine", vol = .12, debut = 0) => {
      const o = audio.createOscillator(), g = audio.createGain();
      o.type = type; o.frequency.setValueAtTime(f1, t + debut);
      if (f2) o.frequency.exponentialRampToValueAtTime(f2, t + debut + dur);
      g.gain.setValueAtTime(vol, t + debut); g.gain.exponentialRampToValueAtTime(.0008, t + debut + dur);
      o.connect(g); g.connect(audio.destination); o.start(t + debut); o.stop(t + debut + dur + .02);
    };
    switch (nom){
      case "tir": if (t - dernierTir < .07) return; dernierTir = t; note(720, 380, .07, "triangle", .035); break;
      case "pop": note(520, 980, .09, "sine", .08); break;
      case "pose": note(260, 520, .12, "square", .05); note(520, 0, .08, "triangle", .05, .09); break;
      case "piece": note(988, 0, .07, "square", .04); note(1318, 0, .12, "square", .04, .07); break;
      case "perte": note(240, 90, .35, "sawtooth", .07); break;
      case "vague": note(392, 0, .12, "triangle", .1); note(523, 0, .12, "triangle", .1, .13); note(659, 0, .2, "triangle", .1, .26); break;
      case "non": note(180, 140, .14, "square", .05); break;
      case "eau": note(900, 300, .18, "sine", .07); break;
      case "victoire": [523, 659, 784, 1046].forEach((f, i) => note(f, 0, .22, "triangle", .1, i * .13)); break;
      case "defaite": [392, 330, 262].forEach((f, i) => note(f, 0, .3, "triangle", .09, i * .2)); break;
      case "alerte": note(660, 0, .15, "square", .05); note(660, 0, .15, "square", .05, .25); break;
      case "pouvoir": note(300, 1200, .35, "sawtooth", .05); note(600, 1600, .3, "triangle", .06, .08); break;
      case "cadeau": [784, 988, 1175, 1568].forEach((f, i) => note(f, 0, .1, "square", .035, i * .06)); break;
      case "combo": note(880, 1320, .12, "triangle", .07); break;
      case "crit": note(1400, 700, .08, "square", .03); break;
    }
  } catch(e){}
}

/* ═════════════════════════════════════════════════════════════
   LES RÈGLES COMMUNES
   ═════════════════════════════════════════════════════════════ */
let J = null;          // l'état de la partie en cours
let M = null;          // le monde en cours
const MULT = {
  deg:[1, 1.7, 2.6], portee:[1, 1.12, 1.25], cadence:[1, .85, .7],
  prod:[1, 1.7, 2.5], lent:[1, 1.15, 1.3], pv:[1, 1.7, 2.6], splash:[1, 1.15, 1.3]
};
/* une tour de niveau 3 a choisi une « voie » : ses modificateurs et ses effets s'ajoutent */
const branche = (t) => t && t.branche !== undefined && t.d.branches ? t.d.branches[t.branche] : null;
const effet = (t, k) => { const b = branche(t); return (b && b.effets && b.effets[k]) || (t.d.effets && t.d.effets[k]) || 0; };
const effetsDe = (t) => Object.assign({}, t.d.effets, branche(t) && branche(t).effets);
const dispo = (d) => !J || (d.debloque || 0) <= J.vague;

/* ── les traits des bestioles, et les rôles qui les contrent ── */
const TRAITS = {
  vole:{ nom:"volant", role:"anti-vol", couleur:"#3E9FC9" },
  armure:{ nom:"blindé", role:"perce-armure", couleur:"#7A6A5C" },
  bouclier:{ nom:"bouclier", role:"brise-bouclier", couleur:"#5FB8E8" },
  invisible:{ nom:"invisible", role:"détecteur", couleur:"#7A4E9E" },
  nuee:{ nom:"nuée", role:"zone", couleur:"#E0703D" },
  rapide:{ nom:"rapide", role:"ralentit", couleur:"#2F8F6B" },
  soigne:{ nom:"soigneur", role:"", couleur:"#7BBF6A" },
  boss:{ nom:"géant", role:"anti-géant", couleur:"#E0533D" },
  eco:{ nom:"", role:"économie", couleur:"#C9A03A" },
  soutien:{ nom:"", role:"soutien", couleur:"#B98AD0" },
  mur:{ nom:"", role:"obstacle", couleur:"#8E6440" },
  bonus:{ nom:"", role:"cadeaux", couleur:"#E0533D" }
};
function traitsDe(d){
  const t = [];
  if (d.boss) t.push("boss");
  if (d.vole) t.push("vole");
  if (d.armure) t.push("armure");
  if (d.bouclier) t.push("bouclier");
  if (d.furtif || d.sousTerre) t.push("invisible");
  if (d.soigne) t.push("soigne");
  if (d.nuee) t.push("nuee");
  if (d.vit >= 60 || d.inarretable) t.push("rapide");
  return t;
}
/* une bestiole invisible est révélée par un détecteur proche */
function revele(e){
  for (const t of J.tours){
    if (!t.d.detecte && !effet(t, "detecte")) continue;
    if (M.actif && t.pousse !== undefined && t.pousse < 1) continue;
    if (dist(t.x, t.y, e.x, e.y) <= stat(t, "portee") + 10) return true;
  }
  return false;
}

/* ── les 30 vagues d'un monde, tirées de son programme (toujours les mêmes) ── */
function vaguesDe(M, carte = 0){
  M._vagues = M._vagues || {};
  if (M._vagues[carte]) return M._vagues[carte];
  /* chaque terrain peut changer le programme du monde */
  const extra = M.cartes && M.cartes[carte] && M.cartes[carte].programme || {};
  const P = Object.assign({}, M.programme, extra, { ennemis:Object.assign({}, M.programme.ennemis, extra.ennemis) });
  const res = [], N = P.nombre || 30;
  const types = Object.keys(P.ennemis);
  for (let v = 1; v <= N; v++){
    const r = (k) => hache(v * 17.3 + k * 5.7 + M.id.length * 31.1 + carte * 53.9);
    const dispos = types.filter(k => P.ennemis[k].des <= v);
    const neufs = dispos.filter(k => P.ennemis[k].des === v);
    const nbTypes = v <= 2 ? 1 : v < 8 ? 2 : v < 18 ? 3 : 4;
    const choisis = [...neufs];
    for (let k = 0; choisis.length < Math.min(nbTypes, dispos.length) && k < 60; k++){
      /* les plus récentes reviennent plus souvent */
      const i = Math.floor(Math.pow(r(k), .6) * dispos.length);
      const cand = dispos[Math.min(dispos.length - 1, i)];
      if (!choisis.includes(cand)) choisis.push(cand);
    }
    const budget = P.budget * (1 + .1 * (v - 1)) * (v <= 3 ? .75 : 1);
    const duree = 13 + v * .45;
    const groupes = [];
    choisis.forEach((type, i) => {
      const part = budget / choisis.length * (neufs.includes(type) && v > 1 ? 1.15 : 1);
      const n = Math.max(2, Math.round(part / P.ennemis[type].menace));
      groupes.push([type, n, +Math.max(.16, duree / n).toFixed(2), +(i * duree * .22).toFixed(1), M.entreeGroupe ? M.entreeGroupe(v, r(50 + i)) : null]);
    });
    /* des géants aux vagues 5, 15, 25 ; le boss aux vagues 10, 20, 30 */
    if (v % 10 === 5){ const t = choisis[choisis.length - 1]; groupes.push([t, v < 10 ? 1 : 2, 3, +(duree * .5).toFixed(1), null, { pv:4, taille:1.45, prime:5, geant:true }]); }
    if (v % 10 === 0) groupes.push([P.boss, 1, 0, 3, M.entreeGroupe ? M.entreeGroupe(v, r(99)) : null, { pv:(v === 10 ? .55 : v === 20 ? .65 : .85) * (P.bossPv || 1), taille:v === 30 ? 1.3 : 1 }]);
    res.push(groupes);
  }
  return (M._vagues[carte] = res);
}
function mult(t, k){
  let m = (MULT[k] && MULT[k][t.niv - 1]) || 1;
  const b = branche(t);
  if (b && b.mods && b.mods[k] !== undefined) m *= b.mods[k];
  if (J && !t.fantome){
    if (k === "cadence" && J.frenesie > J.t) m *= .6;
    if (k === "cadence" && J.surcharge > J.t) m *= .5;
    if (k === "portee" && J.mut && J.mut.portee) m *= J.mut.portee;
    if (M && M.buff) m *= M.buff(J, t, k) || 1;
  }
  return m;
}
function stat(t, k){
  const v = t.d[k]; if (v === undefined) return 0;
  return v * mult(t, k);
}
const lenteur = (t) => Math.min(.85, stat(t, "lent"));
const prixAmelio = (t) => Math.round(t.d.prix * [.8, 1.15][t.niv - 1]);
const prixVente = (t) => Math.round(t.investi * .6);
/* ── les réglages des deux modes : tout l'équilibre tient ici ──
   pv : vie des bestioles · nombre : effectifs · gain : argent gagné
   pente, puissance : durcissement après la vague 10 (×(1 + pente·(v−10)^puissance))
   attente : temps entre deux vagues · appel : bonus d'appel anticipé */
const REGLAGE = {
  petit:{ pv:.68, nombre:1, gain:1.05, pente:0, attente:1, appel:1, mutDes:8, mutChance:.3, elitePrime:3, eco:.4 },
  grand:{ pv:1, nombre:1.1, gain:.72, pente:.035, puissance:1.5, attente:1.35, appel:.35, mutDes:11, mutChance:.65, elitePrime:2, eco:.6 }
};
const R = () => REGLAGE[J ? J.mode : "petit"];
const VISEES = { premier:"le premier", fort:"le plus costaud", proche:"le plus proche", dernier:"le dernier" };
const ORDRE_VISEE = Object.keys(VISEES);

/* les défis de vague : en Grand gardien, presque chaque vague en a un */
const MUTATEURS = [
  { id:"ruee", nom:"Ruée !", desc:"Les bestioles vont 30 % plus vite", vit:1.3 },
  { id:"carapace", nom:"Carapaces", desc:"Les bestioles sont blindées", armure:3 },
  { id:"nuee", nom:"Nuée", desc:"Bien plus nombreuses, mais plus fragiles", nombre:1.7, pv:.6 },
  { id:"brouillard", nom:"Brouillard", desc:"Tes défenseurs voient moins loin", portee:.82 },
  { id:"geants", nom:"Géants", desc:"Moins nombreuses, mais énormes", nombre:.6, pv:1.9, taille:1.25, prime:1.5 },
  { id:"regen", nom:"Bobos guéris", desc:"Les bestioles se soignent toutes seules", regen:.03 },
  { id:"fete", nom:"Pluie de cadeaux", desc:"Primes ×1,5 et des cadeaux partout", prime:1.5, cadeaux:3 }
];

const idCarte = () => M.id + (J && J.carte ? "-" + (J.carte + 1) : "");
const nomCarte = (monde, k) => monde.cartes && monde.cartes[k] ? monde.cartes[k].nom : "";
function nouvellePartie(monde, mode, carte = 0){
  M = monde;
  if (M.charge) M.charge(carte);
  J = {
    t:0, vitesse:1, pause:false, mode, grand:mode === "grand", pvMul: REGLAGE[mode].pv * (mode === "grand" ? (monde.durGrand || 1) : 1),
    vies:monde.vies, viesMax:monde.vies, argent:(monde.cartes && monde.cartes[carte] && monde.cartes[carte].argent) || monde.argent,
    carte, vague:0, vagues:(monde.vagues || vaguesDe(monde, carte)).slice(), neufs:new Set(), charges:0, file:[], compte:0, entre:false, fini:false, infini:false,
    ennemis:[], tours:[], tirs:[], effets:[], textes:[], cadeaux:[], retires:[],
    idSuiv:1, aPoser:null, fantome:null, choisie:null, souris:null, ciblage:null,
    repousses:0, recu:0, score:0, combo:0, comboT:-9, comboMax:0, cadeauT:14,
    mut:null, frenesie:0, surcharge:0, pouvoirs:{}
  };
  for (const p of (M.pouvoirs || [])) J.pouvoirs[p.id] = 0;
  OMBRE = monde.ombre || "rgba(70,40,15,.30)";
  M.init(J);
  fondCache = null;
}

/* une vague générée pour le mode infini : de plus en plus serrée */
function vagueInfinie(n){
  const types = Object.keys(M.ennemis).filter(k => !M.ennemis[k].boss && !M.ennemis[k].invoque);
  const g = [], nb = 2 + (n % 3 === 0 ? 1 : 0);
  for (let i = 0; i < nb; i++){
    const type = choix(types), d = M.ennemis[type];
    const k = d.pv < 30 ? 1.6 : d.pv > 100 ? .45 : 1;
    g.push([type, Math.round((6 + n * 1.2) * k), Math.max(.22, 1.1 - n * .03), i * 3]);
  }
  if (n % 5 === 0){ const boss = Object.keys(M.ennemis).find(k => M.ennemis[k].boss); if (boss) g.push([boss, 1, 0, 2]); }
  return g;
}

function lanceVague(){
  if (!J || J.fini || J.file.length) return;
  if (J.vague >= J.vagues.length){ if (J.infini) J.vagues.push(vagueInfinie(J.vague + 1)); else return; }
  if (J.entre && J.compte > 0 && J.vague > 0){
    const bonus = Math.round(J.compte * (M.bonusAppel || 1) * R().appel);
    if (bonus > 0){ gagne(bonus); texte("+" + bonus + " en avance !", W / 2, 60, M.couleurMonnaie, 22); }
  } else if (J.ennemis.length && J.vague > 0){
    /* appeler la suivante alors que la vague n'est pas finie : ça rapporte */
    const bonus = Math.round(Math.min(45, 6 + J.ennemis.length * 2) * R().appel);
    gagne(bonus); J.score += bonus * 10;
    texte("Enchaînement ! +" + bonus, W / 2, 60, M.couleurMonnaie, 22);
  }
  const def = J.vagues[J.vague]; J.vague++;
  J.entre = false; J.compte = 0;
  const derniere = J.vague === J.vagues.length && !J.infini;
  const aBoss = def.some(g => M.ennemis[g[0]].boss);
  /* le défi de la vague */
  J.mut = null;
  if (!aBoss && J.vague >= R().mutDes && Math.random() < R().mutChance) J.mut = choix(MUTATEURS);
  const nbMul = R().nombre * (J.mut && J.mut.nombre || 1);
  for (const g of def){
    const [type, n0, ecart, delai = 0, entree = null, opts = null] = g;
    const boss = M.ennemis[type].boss;
    const n = boss ? n0 : Math.max(1, Math.round(n0 * nbMul));
    const e2 = boss ? ecart : ecart * n0 / n;
    for (let i = 0; i < n; i++) J.file.push({ t:J.t + delai + i * e2, type, entree, i, opts });
  }
  J.file.sort((a, b) => a.t - b.t);
  const nom = J.infini ? "Infini — vague " + J.vague : derniere ? "Dernière vague !" : "Vague " + J.vague;
  banniere(J.mut ? nom + " · " + J.mut.nom : nom, derniere || !!J.mut, J.mut ? 2600 : 1800);
  if (J.mut) texte(J.mut.desc, W / 2, 110, "#FFFFFF", 18);
  son("vague");
  if (M.debutVague) M.debutVague(J);
  /* un nouveau défenseur se débloque */
  const neufs = Object.entries(M.tours).filter(([, d]) => (d.debloque || 0) === J.vague && J.vague > 0);
  neufs.forEach(([type, d], i) => {
    J.neufs.add(type);
    setTimeout(() => { if (J && !J.fini){ banniere("Nouveau : " + d.nom + " !", false, 2600); son("cadeau"); } }, 1400 + i * 2800);
  });
  majHUD(true);
}

function courbe(v){
  const [a, b] = M.courbe || [.08, .012];
  return (1 + a * (v - 1) + b * (v - 1) * (v - 1)) * (v > J.vagues.length ? Math.pow(1.07, v - J.vagues.length) : 1);
}
function creeEnnemi(type, entree, x, y, opts){
  const d = M.ennemis[type];
  const v = Math.max(1, J.vague);
  const croissance = courbe(v) * (v > 10 ? 1 + R().pente * Math.pow(v - 10, R().puissance || 2) : 1);
  let pv = d.pv * J.pvMul * croissance * (opts && opts.pv || 1);
  const e = {
    id:J.idSuiv++, type, d, pv:0, pvMax:0, vit:d.vit * (1 + .006 * (v - 1)), x:x || 0, y:y || 0,
    prog:0, lentF:1, lentT:0, anim:Math.random() * 10, flash:0, dir:1, vagueNee:v,
    mort:false, vole:!!d.vole, g:(Math.random() * 1000) | 0, age:0, primeMul:(opts && opts.prime || 1) * (1 + .02 * (v - 1)), taille:opts && opts.taille || 1, armureBonus:0,
    geant:!!(opts && opts.geant)
  };
  if (d.bouclier) e.bouclier = e.bouclierMax = d.bouclier + Math.floor(v / 8);
  const mu = J.mut;
  if (mu && !d.boss){ pv *= mu.pv || 1; e.vit *= mu.vit || 1; e.armureBonus = mu.armure || 0; e.taille *= mu.taille || 1; e.primeMul *= mu.prime || 1; }
  const chanceElite = J.grand ? .05 + J.vague * .008 : .02;
  if (!d.boss && !d.invoque && !e.geant && J.vague > 0 && Math.random() < chanceElite){ e.elite = true; pv *= 2.2; e.primeMul *= R().elitePrime; }
  e.pv = e.pvMax = Math.round(pv);
  if (d.coquille){ e.coquille = e.coquilleMax = Math.round(d.coquille * J.pvMul * croissance); }
  M.apparait(J, e, entree, x, y);
  J.ennemis.push(e);
  return e;
}

function ralentit(e, facteur, duree){
  if (e.d.inarretable) return;
  if (J.t + duree >= e.lentT || facteur < e.lentF){
    e.lentF = Math.min(e.lentT > J.t ? e.lentF : 1, facteur);
    e.lentT = Math.max(e.lentT, J.t + duree);
  }
}
const vitesse = (e) => e.vit * (e.lentT > J.t ? e.lentF : 1);
const etourdi = (e) => e.lentT > J.t && e.lentF < .1;

function blesse(e, deg, src, mode){
  if (e.mort || deg <= 0 || e.invuln) return;
  const pur = mode === true || mode === "pur";
  if (!pur){
    if (e.bouclier > 0){
      if (mode === "continu") deg *= .3;
      else {
        e.bouclier--; deg *= .12; e.flashB = .25;
        if (e.bouclier === 0){ confettis(e.x, e.y - 10, ["#BFE6FF", "#FFFFFF"], 8); texte("Bouclier brisé !", e.x, e.y - 34, "#fff", 13); }
      }
    }
    const armure = mode === "perce" ? 0 : (e.d.armure || 0) * (1 + (e.vagueNee - 1) / 12) + (e.armureBonus || 0);
    if (armure) deg = Math.max(deg * .15, deg - armure);
  }
  if (e.d.blesse){ deg = e.d.blesse(J, e, deg, src); if (deg <= 0) return; }
  if (M.blesse){ deg = M.blesse(J, e, deg, src); if (deg <= 0) return; }
  if (e.coquille > 0){
    const a = Math.min(e.coquille, deg); e.coquille -= a; deg -= a;
    if (src && src.degats !== undefined) src.degats += a;
    if (e.coquille <= 0){ confettis(e.x, e.y - 8, e.d.couleurCoquille || "#E9C48C", 10); texte("Plus de coquille !", e.x, e.y - 34, "#fff", 14); }
  }
  if (src && src.degats !== undefined) src.degats += Math.min(deg, Math.max(0, e.pv));
  e.pv -= deg; e.flash = .12;
  if (e.d.boss && !e.enerve && e.pv > 0 && e.pv < e.pvMax * .5){
    e.enerve = true; e.vit *= 1.45;
    banniere(e.d.nom + " s'énerve !", true, 2000); son("alerte"); secousse = .5;
    if (e.d.enerve) e.d.enerve(J, e);
  }
  if (e.pv <= 0) repousse(e);
}
function repousse(e){
  if (e.mort) return;
  e.mort = true; J.repousses++;
  /* le combo : des bestioles repoussées coup sur coup */
  J.combo = J.t - J.comboT < 1.6 ? J.combo + 1 : 1; J.comboT = J.t;
  J.comboMax = Math.max(J.comboMax, J.combo);
  const prime = Math.round(e.d.prime * e.primeMul * (M.gain || 1) * R().gain);
  if (prime){ gagne(prime); texte("+" + prime, e.x, e.y - 20, M.couleurMonnaie, 15); }
  J.score += prime * 10 + Math.min(J.combo, 30) * 4 + (e.elite ? 150 : 0) + (e.d.boss ? 2000 : 0);
  if (J.combo >= 5 && J.combo % 5 === 0){
    const b = Math.min(20, Math.floor(J.combo / 2)); gagne(b); J.score += J.combo * 20;
    texte(`Combo ×${J.combo} ! +${b}`, e.x, e.y - 46, "#FFE27A", 19); son("combo");
  }
  confettis(e.x, e.y - 6, e.elite ? ["#F2B33B", "#FFE27A", "#FFFFFF"] : (e.d.couleur || "#fff"), e.d.boss ? 40 : e.elite ? 22 : 12);
  J.effets.push({ genre:"fuite", x:e.x, y:e.y, type:e.type, d:e.d, g:e.g, dir:e.dir, t:0, dur:.55, vole:e.vole, taille:e.taille * (e.elite ? 1.18 : 1) });
  if (e.elite) semeCadeau(e.x, e.y);
  if (e.d.meurt) e.d.meurt(J, e);
  son("pop");
}
function gagne(n){ J.argent += n; J.recu += n; }
function zoneDegats(x, y, r, deg, src, filtre){
  for (const e of J.ennemis) if (!e.mort && dist(x, y, e.x, e.y) <= r + (e.d.r || 10) && (!filtre || filtre(e))) blesse(e, deg, src);
}
/* un coup porté par une tour : critique possible, puis les effets de sa voie */
function frappe(src, e, base, eff, zone = false){
  if (!e || e.mort) return;
  let d = base;
  const pct = (src.d && src.d.pourcent || 0) + (eff && eff.pourcentPlus || 0);
  if (pct) d += e.pvMax * pct * (1 + .25 * ((src.niv || 1) - 1)) * (e.d.boss ? .45 : 1);
  const chance = (zone ? 0 : .05) + (eff && eff.crit || 0);
  if (chance && Math.random() < chance){ d *= 2.2; texte("Critique !", e.x, e.y - 36, "#FFE27A", 13); son("crit"); }
  blesse(e, d, src, (src.d && src.d.percant) || (eff && eff.percant) ? "perce" : undefined);
  if (!eff || e.mort) return;
  if (eff.brule) e.brule = { dps:eff.brule * (src.niv || 1) * .5 + eff.brule * .5, fin:J.t + 3, src };
  if (eff.etourdit && !e.d.boss && Math.random() < eff.etourdit) ralentit(e, .02, .8);
  if (eff.lent) ralentit(e, 1 - eff.lent, 1.6);
}
function plusProche(x, y, r, exclure, filtre){
  let best = null, bd = r;
  for (const e of J.ennemis){
    if (e.mort || e.cache || (exclure && exclure.has(e)) || (filtre && !filtre(e))) continue;
    const d = dist(x, y, e.x, e.y); if (d < bd){ bd = d; best = e; }
  }
  return best;
}

function arrive(e){
  if (e.mort) return;
  e.mort = true;
  if (M.protege && M.protege(J, e)) return;
  const n = e.d.degats || 1;
  J.vies = Math.max(0, J.vies - n);
  J.combo = 0;
  son("perte");
  if (M.perdVie) M.perdVie(J, e, n);
  secousse = .3;
  if (J.vies <= 0) fin(false);
  majHUD(true);
}

/* ── les tours ── */
function poseTour(type, emp){
  const d = M.tours[type];
  J.argent -= d.prix;
  const t = {
    id:J.idSuiv++, type, d, x:emp.x, y:emp.y, cle:emp.cle, niv:1, cd:.25, recul:0,
    ang:-Math.PI / 2, investi:d.prix, pv:d.pv || 0, pvMax:d.pv || 0, nais:J.t, g:(Math.random() * 1000) | 0,
    visee:"premier", degats:0
  };
  if (M.pose) M.pose(J, t, emp);
  J.tours.push(t);
  confettis(t.x, t.y, "#FFF6DA", 8);
  son("pose");
  majHUD(true);
  return t;
}
function retireTour(t, raison){
  const i = J.tours.indexOf(t); if (i < 0) return;
  J.tours.splice(i, 1);
  J.retires.push(t);
  if (M.retire) M.retire(J, t, raison);
  if (J.choisie === t) choisisTour(null);
}
function vendTour(t){
  const r = prixVente(t); gagne(r); J.recu -= r;
  texte("+" + r, t.x, t.y - 26, M.couleurMonnaie, 16);
  confettis(t.x, t.y, "#E9D6B0", 12);
  retireTour(t, "vente"); son("piece"); majHUD(true);
}
function amelioreTour(t, voie){
  if (t.niv >= 3 || t.d.sansNiveau) return;
  if (t.niv === 2 && t.d.branches && voie === undefined) voie = 0;
  if (M.ameliore){ if (M.ameliore(J, t)) apresAmelio(t, voie); return; }
  const p = prixAmelio(t);
  if (J.argent < p){ refuse("argent"); return; }
  J.argent -= p; t.investi += p; apresAmelio(t, voie);
}
function apresAmelio(t, voie){
  t.niv++;
  if (t.niv === 3 && voie !== undefined && t.d.branches){
    t.branche = voie;
    banniere(t.d.branches[voie].nom + " !", false, 1500);
  }
  if (t.pvMax){ t.pvMax = Math.round(t.d.pv * mult(t, "pv")); t.pv = t.pvMax; }
  etoilesAutour(t.x, t.y);
  if (M.apresAmelio) M.apresAmelio(J, t);
  son("pose"); majHUD(true); majFiche(true);
}

function dansPortee(t, filtre){
  const r = stat(t, "portee"), res = [];
  for (const e of J.ennemis){
    if (e.mort || e.cache) continue;
    if (t.d.cibles === "sol" && e.vole) continue;
    if (t.d.cibles === "air" && !e.vole) continue;
    if (filtre && !filtre(e)) continue;
    if (dist(t.x, t.y, e.x, e.y) > r + (e.d.r || 10) * .6) continue;
    if (M.vise && !M.vise(J, t, e)) continue;
    res.push(e);
  }
  return res;
}
function cherche(t, exclure){
  let best = null, bv = -Infinity;
  for (const e of dansPortee(t)){
    if (exclure && exclure.has(e)) continue;
    const v = t.visee === "fort" ? e.pv + (e.coquille || 0) : t.visee === "proche" ? -dist(t.x, t.y, e.x, e.y) : t.visee === "dernier" ? -e.prog : e.prog;
    if (v > bv){ bv = v; best = e; }
  }
  return best;
}
function tire(t, e){
  lanceProjectile(t, e);
  const n = effet(t, "multi");
  if (n){
    const deja = new Set([e]);
    for (let i = 0; i < n; i++){ const x = cherche(t, deja); if (!x) break; deja.add(x); lanceProjectile(t, x); }
  }
  son("tir");
}
function lanceProjectile(t, e){
  const d = t.d, ang = Math.atan2(e.y - t.y, e.x - t.x);
  t.ang = ang; t.recul = 1;
  const b = branche(t), eff = effetsDe(t);
  const bouche = d.bouche || 14;
  const p = {
    x:t.x + Math.cos(ang) * bouche, y:t.y + Math.sin(ang) * bouche - (d.hauteurTir || 0),
    cible:e, tx:e.x, ty:e.y, v:d.vitesseTir || 430, deg:stat(t, "deg"),
    splash:(d.splash ? stat(t, "splash") : 0), lent:d.lent ? lenteur(t) : 0, lentDuree:d.lentDuree || 1.2,
    genre:d.tir || "droit", dessin:d.dessineTir, t0:J.t, age:0, src:t, ang, g:J.idSuiv++, coul:d.couleurTir,
    eff, rebonds:eff.rebond || 0, perce:eff.perce || 0, touches:new Set()
  };
  if (p.genre === "lob"){
    p.sx = p.x; p.sy = p.y;
    p.tx = e.x; p.ty = e.y;
    p.duree = Math.max(.35, dist(p.x, p.y, p.tx, p.ty) / p.v);
  }
  if (p.genre === "rayon"){
    frappe(t, e, p.deg, eff);
    if (p.lent) ralentit(e, 1 - p.lent, p.lentDuree);
    J.effets.push({ genre:"rayon", x:p.x, y:p.y, x2:e.x, y2:e.y - 6, t:0, dur:.09, coul:d.couleurTir || "#fff" });
    /* le rayon prisme rebondit d'une cible à l'autre */
    let prec = e, n = p.rebonds;
    while (n-- > 0){
      p.touches.add(prec);
      const x = plusProche(prec.x, prec.y, 130, p.touches);
      if (!x) break;
      frappe(t, x, p.deg * .75, eff);
      J.effets.push({ genre:"rayon", x:prec.x, y:prec.y - 6, x2:x.x, y2:x.y - 6, t:0, dur:.12, coul:d.couleurTir || "#fff" });
      prec = x;
    }
    return;
  }
  if (M.prepareTir) M.prepareTir(J, t, e, p);
  J.tirs.push(p);
}
function impact(p, e){
  const sol = p.src.d.cibles === "sol";
  if (p.splash){
    for (const x of J.ennemis) if (!x.mort && !(sol && x.vole) && dist(p.x, p.y, x.x, x.y) <= p.splash + (x.d.r || 10)) frappe(p.src, x, p.deg, p.eff, x !== e);
    J.effets.push({ genre:"onde", x:p.x, y:p.y, r:p.splash, t:0, dur:.3, coul:p.coul || "rgba(255,255,255,.8)" });
    confettis(p.x, p.y, p.coul || "#fff", 7);
  } else if (e){ frappe(p.src, e, p.deg, p.eff); }
  if (p.lent){
    if (p.splash){ for (const x of J.ennemis) if (!x.mort && dist(p.x, p.y, x.x, x.y) <= p.splash) ralentit(x, 1 - p.lent, p.lentDuree); }
    else if (e) ralentit(e, 1 - p.lent, p.lentDuree);
  }
  if (e && !e.mort && p.src.d.surImpact) p.src.d.surImpact(J, p.src, e, p);
}

/* ── les effets ── */
function confettis(x, y, coul, n = 10){
  for (let i = 0; i < n; i++){
    const a = Math.random() * TAU, v = alea(40, 140);
    J.effets.push({ genre:"bout", x, y, vx:Math.cos(a) * v, vy:Math.sin(a) * v - 60, rot:Math.random() * TAU, vr:alea(-9, 9),
                    coul:Array.isArray(coul) ? choix(coul) : coul, t:0, dur:alea(.5, .9), s:alea(3, 6), g:(Math.random() * 999) | 0 });
  }
}
function etoilesAutour(x, y){
  for (let i = 0; i < 7; i++){
    const a = i / 7 * TAU;
    J.effets.push({ genre:"etoile", x, y, vx:Math.cos(a) * 70, vy:Math.sin(a) * 70 - 30, t:0, dur:.7, g:i });
  }
}
function onde(x, y, r, coul, dur = .35){ J.effets.push({ genre:"onde", x, y, r, t:0, dur, coul }); }
function texte(txt, x, y, coul = "#fff", taille = 16){ J.textes.push({ txt, x, y, coul, taille, t:0, dur:1.1 }); }

/* ── les cadeaux à attraper ── */
function semeCadeau(x, y){
  if (x === undefined){
    const p = M.posCadeau ? M.posCadeau(J) : { x:alea(140, W - 140), y:alea(90, H - 70) };
    x = p.x; y = p.y;
  }
  J.cadeaux.push({ x, y, t:0, dur:9, g:(Math.random() * 99) | 0 });
}
function ouvreCadeau(k, aimant){
  J.cadeaux.splice(J.cadeaux.indexOf(k), 1);
  if (aimant && effet(aimant, "chance")){ const n = Math.round((8 + J.vague * 2) * R().gain); gagne(n); texte("+" + n, aimant.x, aimant.y - 46, M.couleurMonnaie, 15); }
  confettis(k.x, k.y, ["#E0533D", "#F2B33B", "#FFFFFF", "#3E9FC9"], 18);
  son("cadeau");
  const r = Math.random();
  if (r < .42){
    const n = Math.round((15 + J.vague * 4) * R().gain); gagne(n); J.score += 200;
    texte("Cadeau : +" + n, k.x, k.y - 30, M.couleurMonnaie, 20);
  } else if (r < .68){
    J.frenesie = J.t + 8;
    banniere("Frénésie ! Tes défenseurs s'emballent", false, 1800);
  } else if (r < .88 && (M.pouvoirs || []).length){
    for (const p of M.pouvoirs) J.pouvoirs[p.id] = 0;
    banniere("Pouvoirs rechargés !", false, 1600);
  } else if (J.vies < J.viesMax){
    J.vies++; texte("+1 " + M.nomVies.toLowerCase().replace(/s$/, ""), k.x, k.y - 30, "#FFFFFF", 20);
  } else { const n = Math.round((40 + J.vague * 6) * R().gain); gagne(n); texte("Gros cadeau : +" + n, k.x, k.y - 30, M.couleurMonnaie, 20); }
  majHUD(true); majPouvoirs();
}

/* ── les pouvoirs ── */
function activePouvoir(p){
  if (!J || J.fini || J.pause) return;
  if (J.pouvoirs[p.id] > J.t){ son("non"); return; }
  if (p.cible){
    J.ciblage = J.ciblage === p ? null : p;
    if (J.ciblage){ J.aPoser = null; choisisTour(null); banniere("Touche le plateau : " + p.nom, false, 1300); }
    majAideBoutique(); majHUD(true); majPouvoirs();
    return;
  }
  lancePouvoir(p, null);
}
function lancePouvoir(p, pt){
  p.lance(J, pt);
  J.pouvoirs[p.id] = J.t + p.recharge;
  J.ciblage = null; J.score += 50;
  son("pouvoir"); majPouvoirs(); majAideBoutique();
}

/* ═════════════════════════════════════════════════════════════
   UN PAS DE SIMULATION (1/60 s)
   ═════════════════════════════════════════════════════════════ */
function pas(dt){
  if (!J || J.fini) return;
  J.t += dt;

  while (J.file.length && J.file[0].t <= J.t){ const f = J.file.shift(); creeEnnemi(f.type, f.entree, undefined, undefined, f.opts); }

  if (M.maj) M.maj(J, dt);

  /* les cadeaux tombent pendant les vagues */
  if (J.file.length || J.ennemis.length){
    const chanceux = J.tours.filter(t => t.d.aimant && effet(t, "chance")).length;
    J.cadeauT -= dt * (J.mut && J.mut.cadeaux || 1) * (1 + .35 * chanceux);
    if (J.cadeauT <= 0){ J.cadeauT = alea(16, 26); semeCadeau(); }
  }
  for (const k of J.cadeaux) k.t += dt;
  for (const t of J.tours){
    if (!t.d.aimant || t.pousse < 1) continue;
    for (const k of J.cadeaux) if (!k.aspire && k.t > .45 && dist(k.x, k.y, t.x, t.y) <= stat(t, "rayon")) k.aspire = t;
  }
  for (const k of [...J.cadeaux]){
    if (!k.aspire) continue;
    const t = k.aspire;
    if (!J.tours.includes(t)){ k.aspire = null; continue; }
    const d = dist(k.x, k.y, t.x, t.y - 14), v = Math.min(d, 380 * dt);
    if (d < 16){ ouvreCadeau(k, t); continue; }
    k.x += (t.x - k.x) / d * v; k.y += (t.y - 14 - k.y) / d * v; k.t = Math.min(k.t, k.dur - 3);
  }
  J.cadeaux = J.cadeaux.filter(k => k.t < k.dur);

  for (const e of J.ennemis) if (e.d.furtif) e.cache = !revele(e) && !(M.visible && M.visible(J, e));

  /* elles avancent */
  for (const e of J.ennemis){
    if (e.mort) continue;
    e.age += dt; e.anim += dt * (e.lentT > J.t ? e.lentF : 1);
    if (e.flash > 0) e.flash -= dt;
    if (e.brule){ if (e.brule.fin > J.t) blesse(e, e.brule.dps * dt, e.brule.src, true); else e.brule = null; if (e.mort) continue; }
    if (J.mut && J.mut.regen && e.pv < e.pvMax) e.pv = Math.min(e.pvMax, e.pv + e.pvMax * J.mut.regen * dt);
    if (e.d.agit) e.d.agit(J, e, dt);
    const ox = e.x, oy = e.y;
    if (M.deplace(J, e, dt)) arrive(e);
    const dx = e.x - ox; if (Math.abs(dx) > .01) e.dir = dx > 0 ? 1 : -1;
    e.vx = (e.x - ox) / dt; e.vy = (e.y - oy) / dt;
  }

  /* les défenseurs agissent */
  for (const t of J.tours){
    t.recul = Math.max(0, t.recul - dt * 4);
    if (M.actif && !M.actif(J, t, dt)) continue;
    if (t.d.agit){ t.d.agit(J, t, dt); continue; }
    t.cd -= dt;
    if (t.cd > 0) continue;
    switch (t.d.genre){
      case "tir": {
        const e = cherche(t);
        if (!e){ t.cd = .06; break; }
        if (M.cout && !M.cout(J, t)){ t.cd = .15; break; }
        tire(t, e); t.cd = stat(t, "cadence"); break;
      }
      case "zone": {
        const liste = dansPortee(t);
        if (!liste.length){ t.cd = .1; break; }
        if (M.cout && !M.cout(J, t)){ t.cd = .15; break; }
        const eff = effetsDe(t);
        for (const e of liste){ frappe(t, e, stat(t, "deg"), eff, true); if (t.d.lent) ralentit(e, 1 - lenteur(t), t.d.lentDuree || 1.2); }
        onde(t.x, t.y, stat(t, "portee"), t.d.couleurZone || "rgba(255,255,255,.7)", .45);
        t.recul = 1; t.cd = stat(t, "cadence"); break;
      }
      case "aura": {
        const pique = effet(t, "pique");
        for (const e of dansPortee(t)){ ralentit(e, 1 - lenteur(t), .2); if (pique) blesse(e, pique * mult(t, "deg") * .1, t, "continu"); }
        t.cd = .1; break;
      }
      case "prod": {
        const freres = J.tours.filter(x => x.type === t.type).length;
        const n = Math.round(stat(t, "prod") * (M.facteurProd ? M.facteurProd(J, t) : 1) * R().gain / (1 + R().eco * (freres - 1)));
        if (n > 0){ gagne(n); texte("+" + n, t.x, t.y - 34, M.couleurMonnaie, 16); son("piece"); }
        if (M.apresProd) M.apresProd(J, t);
        t.recul = 1; t.cd = stat(t, "cadence"); break;
      }
      default: t.cd = 1;
    }
  }

  /* les projectiles */
  for (const p of J.tirs){
    p.age += dt;
    if (p.genre === "lob"){
      const k = p.age / p.duree;
      p.x = p.sx + (p.tx - p.sx) * k; p.y = p.sy + (p.ty - p.sy) * k;
      p.h = Math.sin(Math.min(1, k) * Math.PI) * Math.min(90, 30 + p.duree * 60);
      if (k >= 1){ p.fini = true; impact(p, null); if (!p.splash) zoneDegats(p.tx, p.ty, 16, p.deg, p.src); }
    } else if (p.genre === "couloir"){
      p.x += p.vx * dt;
      for (const e of J.ennemis){
        if (e.mort || e.vole || e.ligne !== p.ligne || p.touches.has(e)) continue;
        if (Math.abs(e.x - p.x) < (e.d.r || 14) + 4){
          impact(p, e); p.touches.add(e);
          if (p.perce > 0){ p.perce--; p.deg *= .85; } else { p.fini = true; break; }
        }
      }
      if (p.x < -20 || p.x > W + 20) p.fini = true;
    } else {
      const e = p.cible;
      if (e && !e.mort){ p.tx = e.x; p.ty = e.y - (e.d.hautCible || 6); }
      const dx = p.tx - p.x, dy = p.ty - p.y, l = Math.hypot(dx, dy), s = p.v * dt;
      p.ang = Math.atan2(dy, dx);
      if (l <= s + 2){
        p.x = p.tx; p.y = p.ty; p.fini = true;
        const vise = e && !e.mort ? e : null;
        impact(p, vise);
        /* les graines qui rebondissent repartent vers une autre bestiole */
        if (vise && p.rebonds > 0){
          p.touches.add(vise);
          const x = plusProche(p.x, p.y, 140, p.touches);
          if (x){ p.cible = x; p.rebonds--; p.deg *= .8; p.fini = false; p.age = 0; }
        }
      } else { p.x += dx / l * s; p.y += dy / l * s; }
      if (p.age > 4) p.fini = true;
    }
    if (p.fini && M.apresImpact) M.apresImpact(J, p);
  }
  J.tirs = J.tirs.filter(p => !p.fini);

  /* les effets */
  for (const f of J.effets){
    f.t += dt;
    if (f.genre === "bout" || f.genre === "etoile"){ f.x += f.vx * dt; f.y += f.vy * dt; f.vy += 260 * dt; if (f.rot !== undefined) f.rot += f.vr * dt; }
  }
  J.effets = J.effets.filter(f => f.t < f.dur);
  for (const x of J.textes){ x.t += dt; x.y -= 26 * dt; }
  J.textes = J.textes.filter(x => x.t < x.dur);
  J.ennemis = J.ennemis.filter(e => !e.mort);
  if (J.t - J.comboT > 1.6) J.combo = 0;

  /* entre deux vagues */
  if (J.vague > 0 && !J.file.length && !J.ennemis.length){
    if (J.vague >= J.vagues.length && !J.infini){ fin(true); return; }
    if (!J.entre){
      J.entre = true; J.mut = null;
      J.compte = (M.attente || 18) * R().attente;
      const prime = M.primeVague ? Math.round(M.primeVague(J) * R().gain) : 0;
      J.score += 100 * J.vague;
      if (prime){ gagne(prime); texte("Vague repoussée ! +" + prime, W / 2, 70, M.couleurMonnaie, 22); }
      if (M.finVague) M.finVague(J);
    }
    J.compte -= dt;
    if (J.compte <= 0) lanceVague();
  }
}

function meilleurDefenseur(){
  let best = null;
  for (const t of [...J.tours, ...J.retires]) if (t.degats > 0 && (!best || t.degats > best.degats)) best = t;
  return best;
}
function fin(victoire){
  if (J.fini) return;
  J.fini = true;
  choisisTour(null); choisisAPoser(null); J.ciblage = null;
  const ratio = J.vies / J.viesMax;
  const etoiles = victoire ? (ratio >= .99 ? 3 : ratio >= .5 ? 2 : 1) : 0;
  if (victoire){
    J.score += J.vies * 300 * (J.grand ? 2 : 1);
    const cle = "etoiles:" + idCarte() + ":" + J.mode;
    if (etoiles > memoire.lis(cle, 0)) memoire.ecris(cle, etoiles);
  }
  const cleR = "record:" + idCarte() + ":" + J.mode;
  J.ancienRecord = memoire.lis(cleR, 0);
  if (J.score > J.ancienRecord) memoire.ecris(cleR, Math.round(J.score));
  if (J.infini){ const cleI = "infini:" + idCarte() + ":" + J.mode; if (J.vague - 1 > memoire.lis(cleI, 0)) memoire.ecris(cleI, J.vague - 1); }
  son(victoire ? "victoire" : "defaite");
  setTimeout(() => montreFin(victoire, etoiles), 700);
}
function continueInfini(){
  J.fini = false; J.infini = true; J.entre = true; J.compte = 12;
  fermeVoile(); banniere("Mode infini : jusqu'où tiendras-tu ?", true, 2400);
  majHUD(true);
}

/* ═════════════════════════════════════════════════════════════
   LE DESSIN
   ═════════════════════════════════════════════════════════════ */
let fondCache = null, secousse = 0;
function fond(){
  if (fondCache) return fondCache;
  const k = document.createElement("canvas");
  k.width = W * dpr; k.height = H * dpr;
  const x = k.getContext("2d"); x.scale(dpr, dpr);
  avec(x, () => M.fond(J));
  habilleSol(x, k, M);
  return (fondCache = k);
}

function dessineScene(){
  if (!M || !J) return;
  c.save();
  if (secousse > 0){ c.translate(alea(-3, 3) * secousse * 3, alea(-3, 3) * secousse * 3); }
  c.drawImage(fond(), 0, 0, W, H);
  if (M.dessineSol) M.dessineSol(J);

  const ch = J.choisie;
  if (ch){ (M.dessinePortee || porteeRonde)(ch.x, ch.y, ch, true); if (ch.d.aimant) zoneAimant(ch.x, ch.y, ch); }
  const emp = fantome();
  if (emp && emp.x !== undefined){
    const faux = { d:M.tours[J.aPoser], niv:1, x:emp.x, y:emp.y, ang:emp.ang ?? -Math.PI / 2, angPose:emp.ang, recul:0, pousse:1, g:7, fantome:true, cle:emp.cle, ligne:emp.ligne };
    if (M.tours[J.aPoser].portee) (M.dessinePortee || porteeRonde)(emp.x, emp.y, faux, emp.ok);
    if (M.tours[J.aPoser].aimant) zoneAimant(emp.x, emp.y, faux);
    if (M.dessineCase) M.dessineCase(J, emp);
  }

  for (const t of J.tours) if (t.d.detecte || effet(t, "detecte")){
    c.beginPath(); c.arc(t.x, t.y, stat(t, "portee"), 0, TAU);
    c.setLineDash([3, 7]); c.lineWidth = 2; c.strokeStyle = "rgba(122,78,158,.45)"; c.stroke(); c.setLineDash([]);
  }
  const tout = [];
  for (const t of J.tours) tout.push([t.y + (t.d.decalY || 0), 0, t]);
  for (const e of J.ennemis) tout.push([e.y + (e.vole ? 2000 : 0), 1, e]);
  tout.sort((a, b) => a[0] - b[0]);
  for (const [, genre, o] of tout){
    if (genre === 0) dessineTour(o); else dessineEnnemi(o);
  }

  for (const p of J.tirs){
    c.save();
    c.translate(p.x, p.y - (p.h || 0));
    if (p.h){ c.save(); c.translate(0, p.h); c.globalAlpha = .25; ov(0, 0, 6, 3, "#000", 0, 0); c.restore(); }
    if (p.dessin) p.dessin(p); else ov(0, 0, 5, 5, p.coul || "#fff", p.g, .6);
    c.restore();
  }
  for (const f of J.effets) dessineEffet(f);
  if (M.dessineDessus) M.dessineDessus(J);

  dessineFete();
  /* les cadeaux */
  for (const k of J.cadeaux){
    const reste = k.dur - k.t;
    if (reste < 2.5 && Math.floor(reste * 7) % 2) continue;
    const arrivee = Math.min(1, k.t / .4), saut = Math.abs(Math.sin(J.t * 4 + k.g)) * 5;
    c.save(); c.translate(k.x, k.y - (1 - arrivee) * 60 - saut);
    c.globalAlpha = .35; ov(0, 18 + saut, 16, 5, "#000", 0, 0); c.globalAlpha = 1;
    c.rotate(Math.sin(J.t * 3 + k.g) * .12);
    cadeauFete(13, k.g);
    c.restore();
  }

  /* le défenseur à poser */
  if (emp && emp.x !== undefined){
    c.save(); c.globalAlpha = emp.ok ? .72 : .4;
    c.translate(emp.x, emp.y);
    if (emp.ang !== undefined && M.orienteTour) M.orienteTour(emp.ang);
    M.tours[J.aPoser].dessine({ d:M.tours[J.aPoser], niv:1, ang:emp.ang ?? -Math.PI / 2, recul:0, pousse:1, g:7, fantome:true }, J.t);
    c.restore();
    if (!emp.ok && emp.raison && (enTactile || J.souris)){
      texteP(emp.raison, borne(emp.x, 110, W - 110), emp.y - 46, 15, "#fff", "center", "rgba(51,38,29,.8)");
    }
  }
  /* le pouvoir que l'on vise */
  if (J.ciblage){
    const p = J.souris || J.fantome;
    if (p){
      if (J.ciblage.apercu) J.ciblage.apercu(J, p);
      else {
        c.beginPath(); c.arc(p.x, p.y, J.ciblage.rayon || 80, 0, TAU);
        c.fillStyle = "rgba(242,179,59,.22)"; c.fill();
        c.setLineDash([8, 6]); c.lineWidth = 3; c.strokeStyle = "#F2B33B"; c.stroke(); c.setLineDash([]);
      }
    }
  }
  for (const x of J.textes){
    c.globalAlpha = borne(1.6 - x.t / x.dur * 1.6, 0, 1);
    texteP(x.txt, x.x, x.y, x.taille, x.coul, "center", "rgba(51,38,29,.75)");
    c.globalAlpha = 1;
  }
  c.restore();
  dessineBandeaux();
}
/* les étiquettes en haut du plateau : défi de vague, frénésie, combo */
function dessineBandeaux(){
  let y = 16;
  const etiquette = (txt, fondC, coul = "#fff") => {
    c.font = "400 15px Sniglet, sans-serif";
    const l = c.measureText(txt).width + 24;
    c.save(); c.translate(W - 12 - l, y); c.rotate(-.015);
    bx(0, 0, l, 26, fondC, y, .8);
    texteP(txt, l / 2, 14, 15, coul, "center", null);
    c.restore(); y += 32;
  };
  if (J.mut && !J.entre) etiquette("Défi : " + J.mut.nom, "#7A4E9E");
  if (J.frenesie > J.t) etiquette("Frénésie ! " + Math.ceil(J.frenesie - J.t) + " s", "#E0533D");
  if (J.surcharge > J.t) etiquette("Surcharge ! " + Math.ceil(J.surcharge - J.t) + " s", "#E0533D");
  if (J.combo >= 3) etiquette("Combo ×" + J.combo, "#F2B33B", "#33261D");
}
function dessineApercu(){
  const def = J.vagues[J.vague];
  if (!def || J.fini || !(J.vague === 0 || J.entre || !J.file.length)) return;
  const n = {}, opts = {};
  for (const g of def){
    const [type, nb] = g, d = M.ennemis[type];
    n[type] = (n[type] || 0) + (d.boss || (g[5] && g[5].geant) ? nb : Math.round(nb * R().nombre));
    if (g[5] && g[5].geant) opts[type] = "géant";
  }
  const liste = Object.entries(n), l = 66 + liste.length * 64;
  c.save(); c.translate(10, H - 82);
  bx(0, 0, l, 72, "rgba(255,248,234,.93)", 77, .8);
  c.save(); c.translate(26, 36); c.rotate(-Math.PI / 2); texteP("ENSUITE", 0, 0, 12, "#6F5B4B"); c.restore();
  liste.forEach(([type, nb], i) => {
    const d = M.ennemis[type], x = 72 + i * 64;
    c.save(); c.translate(x, 46); const k = Math.min(.85, 20 / (d.r || 12)); c.scale(k, k); if (d.vole) c.translate(0, (d.hautCible || 26) - 4);
    try { d.dessine({ d, anim:J.t * 2, g:7, pv:1, pvMax:1, dir:1, age:9, a:0, r:999, z:0 }, J.t); } catch(e){}
    c.restore();
    texteP("×" + nb, x + 20, 52, 13, "#33261D", "center", "#FFF8EA");
    const tr = d.boss ? ["boss"] : traitsDe(d);
    const lab = opts[type] || (tr[0] && TRAITS[tr[0]].nom);
    if (lab){ c.font = "800 10px Nunito, sans-serif"; const w = c.measureText(lab).width + 8;
      bx(x - w / 2, 4, w, 13, TRAITS[tr[0] || "boss"].couleur, i, 0);
      c.fillStyle = "#fff"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(lab, x, 11); }
  });
  c.restore();
}
function zoneAimant(x, y, t){
  c.beginPath(); c.arc(x, y, stat(t, "rayon"), 0, TAU);
  c.fillStyle = "rgba(242,179,59,.10)"; c.fill();
  c.setLineDash([4, 8]); c.lineWidth = 2.5; c.strokeStyle = "rgba(242,179,59,.85)"; c.stroke(); c.setLineDash([]);
}
function porteeRonde(x, y, t, ok){
  const r = stat(t, "portee"); if (!r) return;
  c.beginPath(); c.arc(x, y, r, 0, TAU);
  c.fillStyle = ok ? "rgba(255,255,255,.18)" : "rgba(224,83,61,.18)"; c.fill();
  c.setLineDash([7, 6]); c.lineWidth = 2; c.strokeStyle = ok ? "rgba(255,255,255,.85)" : "rgba(224,83,61,.9)"; c.stroke(); c.setLineDash([]);
}
function dessineTour(t){
  c.save(); c.translate(t.x, t.y);
  if (M.orienteTour) M.orienteTour(t.angPose);
  t.d.dessine(t, J.t);
  c.restore();
  if (!t.d.sansNiveau && (t.niv > 1 || J.choisie === t)){
    const coul = t.branche === 0 ? "#5FB8E8" : t.branche === 1 ? "#F28DB2" : "#F2B33B";
    for (let i = 0; i < t.niv; i++) etoile5(t.x - (t.niv - 1) * 6 + i * 12, t.y + (t.d.yEtoiles || 22), 5.5, 2.5, coul, t.g + i, .5);
  }
  if (J.frenesie > J.t && t.d.genre !== "mur"){ c.globalAlpha = .5 + Math.sin(J.t * 12) * .2; ov(t.x, t.y - 30, 3, 3, "#E0533D", 0, 0); c.globalAlpha = 1; }
  if (t.pvMax && t.pv < t.pvMax) barre(t.x, t.y - (t.d.hautBarre || 34), 34, t.pv / t.pvMax, "#6DBE5B");
  if (J.choisie === t){
    c.beginPath(); c.ellipse(t.x, t.y + 14, 26, 9, 0, 0, TAU);
    c.setLineDash([5, 4]); c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); c.setLineDash([]);
  }
}
function dessineEnnemi(e){
  const hb = (e.d.hautBarre || 30) * e.taille * (e.elite ? 1.18 : 1);
  if (e.elite){
    c.globalAlpha = .45 + Math.sin(J.t * 6 + e.g) * .15;
    const halo = c.createRadialGradient(e.x, e.y - hb * .35, 2, e.x, e.y - hb * .35, (e.d.r || 12) * 2.2);
    halo.addColorStop(0, "rgba(255,222,110,.9)"); halo.addColorStop(1, "rgba(255,222,110,0)");
    c.fillStyle = halo; c.beginPath(); c.arc(e.x, e.y - hb * .35, (e.d.r || 12) * 2.2, 0, TAU); c.fill();
    c.globalAlpha = 1;
  }
  c.save(); c.translate(e.x, e.y);
  const s = e.taille * (e.elite ? 1.18 : 1);
  if (s !== 1) c.scale(s, s);
  if (e.flash > 0){ const k = 1 + e.flash * 1.4; c.scale(k, 2 - k); }
  if (e.dir < 0 && !e.d.sansMiroir) c.scale(-1, 1);
  if (FETE.chapeau && !e.d.boss){
    guetteTete = true; teteVue = null;
    c.save(); e.d.dessine(e, J.t); c.restore();
    guetteTete = false; chapeauFete(e);
  } else e.d.dessine(e, J.t);
  c.restore();
  if (e.cache && !e.d.montreCache) return;
  if (e.bulleT > J.t){
    c.globalAlpha = .55; c.beginPath(); c.arc(e.x, e.y - hb * .4, (e.d.r || 12) + 12, 0, TAU);
    c.fillStyle = "rgba(190,235,255,.35)"; c.fill(); c.lineWidth = 2.5; c.strokeStyle = "#E9F8FF"; c.stroke();
    ov(e.x - 8, e.y - hb * .4 - 10, 4, 3, "#FFFFFF", 0, 0); c.globalAlpha = 1;
  } else if (etourdi(e)){
    for (let i = 0; i < 3; i++){ const a = J.t * 5 + i * TAU / 3; etoile5(e.x + Math.cos(a) * 12, e.y - hb - 4 + Math.sin(a) * 4, 4, 1.8, "#F2B33B", i, 0); }
  }
  if (e.bouclier > 0){
    c.globalAlpha = .55 + (e.flashB > 0 ? .4 : 0); if (e.flashB > 0) e.flashB -= .02;
    c.beginPath(); c.arc(e.x, e.y - hb * .4, (e.d.r || 12) * e.taille + 9, 0, TAU);
    c.lineWidth = 2 + Math.min(4, e.bouclier * .5); c.strokeStyle = "#9FD8F2"; c.stroke(); c.globalAlpha = 1;
  }
  if (e.brule && Math.floor(J.t * 10 + e.g) % 3 === 0) fo([e.x - 4, e.y - hb * .5, e.x, e.y - hb * .5 - 12, e.x + 4, e.y - hb * .5], "#F28B2C", e.g, 0);
  if (e.pv < e.pvMax || e.coquille < e.coquilleMax){
    barre(e.x, e.y - hb, e.d.boss ? 60 : 30, e.pv / e.pvMax, e.d.boss ? "#E0533D" : e.elite ? "#FFD45E" : "#F2B33B");
    if (e.coquilleMax) barre(e.x, e.y - hb - 6, 30, Math.max(0, e.coquille) / e.coquilleMax, "#9FD1E8");
  }
  if (e.elite) etoile5(e.x, e.y - hb - 10, 6, 2.6, "#F2B33B", e.g, .4);
  if (e.lentT > J.t && !e.d.boss && !etourdi(e)){
    c.globalAlpha = .7; ov(e.x, e.y - hb + 10, 4, 4, "#9FD1E8", 0, 0); c.globalAlpha = 1;
  }
}
function barre(x, y, l, k, coul){
  bx(x - l / 2 - 1.5, y - 1.5, l + 3, 7, "rgba(51,38,29,.75)", 0, 0);
  if (k > 0) bx(x - l / 2, y, l * borne(k, 0, 1), 4, coul, 0, 0);
}
function dessineEffet(f){
  if (f.t < 0) return;
  const k = f.t / f.dur;
  switch (f.genre){
    case "bout":
      c.save(); c.translate(f.x, f.y); c.rotate(f.rot); c.globalAlpha = 1 - k * k;
      fo([-f.s, -f.s * .6, f.s, -f.s * .4, f.s * .7, f.s * .6, -f.s * .8, f.s * .5], f.coul, f.g, .4);
      c.restore(); break;
    case "etoile":
      c.globalAlpha = 1 - k; etoile5(f.x, f.y, 7, 3, "#F2B33B", f.g, .5); c.globalAlpha = 1; break;
    case "onde":
      c.beginPath(); c.arc(f.x, f.y, f.r * (.35 + .65 * k), 0, TAU);
      c.globalAlpha = 1 - k; c.lineWidth = 5 * (1 - k) + 1; c.strokeStyle = f.coul; c.stroke(); c.globalAlpha = 1; break;
    case "rayon":
      c.globalAlpha = 1 - k; c.lineCap = "round";
      c.beginPath(); c.moveTo(f.x, f.y); c.lineTo(f.x2, f.y2); c.strokeStyle = f.coul; c.lineWidth = 6; c.stroke();
      c.strokeStyle = "#fff"; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; break;
    case "fuite": {
      c.save(); c.translate(f.x - f.dir * k * 40, f.y - k * 30 - (f.vole ? k * 30 : 0));
      c.rotate(k * 3 * -f.dir); const s = (1 - k * .8) * (f.taille || 1); c.scale(s * (f.dir < 0 && !f.d.sansMiroir ? -1 : 1), s);
      c.globalAlpha = 1 - k;
      f.d.dessine({ anim:f.t * 3, g:f.g, d:f.d, pv:1, pvMax:1, x:f.x, y:f.y, dir:f.dir, content:true, age:9, a:0, r:999 }, f.t);
      c.restore(); break;
    }
    default: if (M.dessineEffet) M.dessineEffet(f, k);
  }
}

/* ═════════════════════════════════════════════════════════════
   L'INTERFACE (DOM)
   ═════════════════════════════════════════════════════════════ */
const RACINE = document.getElementById("gdc");
RACINE.innerHTML = `
  <div class="gdc-cadre">
    <div class="gdc-guirlande" hidden></div>
    <div class="gdc-menu"></div>
    <div class="gdc-jeu" hidden>
      <div class="gdc-haut"></div>
      <div class="gdc-astuce-ecran" hidden>
        <span>Tourne ton téléphone pour un plus grand plateau.</span>
        <button class="gdc-bouton sapin" data-a="plein">⛶ Plein écran</button>
        <button class="gdc-x" data-a="fermer" title="Fermer">×</button>
      </div>
      <div class="gdc-scene">
        <canvas class="gdc-toile" aria-label="Plateau de jeu"></canvas>
        <div class="gdc-banniere"></div>
        <div class="gdc-fiche" hidden></div>
      </div>
      <div class="gdc-bas"></div>
    </div>
    <div class="gdc-voile" hidden></div>
  </div>`;
const $ = (s) => RACINE.querySelector(s);
const cv = $(".gdc-toile"), ctx = cv.getContext("2d");
let dpr = 1;
function redim(){
  const larg = cv.clientWidth || W;
  dpr = borne(larg * (window.devicePixelRatio || 1) / W, .6, 2.4);
  cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
  fondCache = null;
}
/* ── la taille : le plateau prend toute la place possible, sans faire défiler ── */
const enPaysageBas = () => matchMedia("(max-height: 520px) and (orientation: landscape)").matches;
let tailleFixee = "";
function ajusteTaille(){
  const jeu = $(".gdc-jeu"); if (jeu.hidden) return;
  const scene = $(".gdc-scene"), bas = $(".gdc-bas"), haut = $(".gdc-haut"), astuce = $(".gdc-astuce-ecran");
  const cote = enPaysageBas();
  const vh = window.innerHeight;
  const marge = estPlein() ? 26 : cote ? 22 : 64;
  const dispoH = vh - haut.offsetHeight - (cote ? 0 : bas.offsetHeight) - (astuce.hidden ? 0 : astuce.offsetHeight + 8) - marge;
  const dispoL = jeu.clientWidth - (cote ? bas.offsetWidth + 8 : 0);
  const larg = Math.round(Math.max(250, Math.min(dispoL, dispoH * W / H)));
  const cle = larg + ":" + cote;
  if (cle !== tailleFixee){ tailleFixee = cle; scene.style.width = larg + "px"; redim(); }
}
let attenteTaille = 0;
const plusTard = () => { clearTimeout(attenteTaille); attenteTaille = setTimeout(() => { tailleFixee = ""; ajusteTaille(); if (J && J.choisie) majFiche(true); }, 60); };
window.addEventListener("resize", plusTard);
window.addEventListener("orientationchange", plusTard);

/* ── le plein écran (le vrai quand le navigateur le permet, sinon le jeu couvre la page) ── */
const estPlein = () => RACINE.classList.contains("gdc-plein");
function basculePlein(){
  const actif = estPlein();
  const doc = document, el = RACINE;
  if (!actif){
    RACINE.classList.add("gdc-plein");
    const demande = el.requestFullscreen || el.webkitRequestFullscreen;
    if (demande){
      try {
        const p = demande.call(el);
        if (p && p.then) p.then(() => { try { screen.orientation && screen.orientation.lock && screen.orientation.lock("landscape").catch(() => {}); } catch(e){} }).catch(() => {});
      } catch(e){}
    }
  } else {
    RACINE.classList.remove("gdc-plein");
    const sort = doc.exitFullscreen || doc.webkitExitFullscreen;
    if ((doc.fullscreenElement || doc.webkitFullscreenElement) && sort) try { sort.call(doc); } catch(e){}
  }
  majBoutonsPlein(); plusTard();
}
function majBoutonsPlein(){
  for (const b of RACINE.querySelectorAll('[data-a="plein"]')) b.innerHTML = estPlein() ? "⤡ Quitter le plein écran" : "⛶ Plein écran";
  if (hud.plein) hud.plein.textContent = estPlein() ? "⤡" : "⛶";
  majAstuceEcran();
}
const surSortiePlein = () => { if (!(document.fullscreenElement || document.webkitFullscreenElement) && estPlein() && !RACINE.dataset.pseudo) { RACINE.classList.remove("gdc-plein"); majBoutonsPlein(); plusTard(); } };
document.addEventListener("fullscreenchange", surSortiePlein);
document.addEventListener("webkitfullscreenchange", surSortiePlein);
/* le petit bandeau « tourne ton téléphone », seulement en portrait sur un petit écran */
function majAstuceEcran(){
  const a = $(".gdc-astuce-ecran");
  const portrait = window.innerWidth < 600 && window.innerHeight > window.innerWidth;
  a.hidden = !portrait || estPlein() || memoire.lis("astuceEcran", false);
}
RACINE.addEventListener("click", (ev) => {
  const b = ev.target.closest('[data-a="plein"]');
  if (b){ basculePlein(); return; }
  if (ev.target.closest('.gdc-astuce-ecran [data-a="fermer"]')){ memoire.ecris("astuceEcran", true); majAstuceEcran(); plusTard(); }
});

/* ── barre du haut ── */
let hud = {};
function construitHUD(){
  const h = $(".gdc-haut");
  h.innerHTML = "";
  const nom = document.createElement("div"); nom.className = "gdc-nom-monde"; nom.textContent = M.nom + (nomCarte(M, J.carte) ? " · " + nomCarte(M, J.carte) : ""); h.append(nom);
  const pastille = (cle, dessin, titre) => {
    const p = document.createElement("div"); p.className = "gdc-pastille"; p.title = titre;
    p.append(icone(dessin, 26)); const v = document.createElement("span"); p.append(v); h.append(p);
    hud[cle] = { p, v, ancien:null };
  };
  hud = {};
  pastille("vies", M.iconeVie, M.nomVies);
  pastille("argent", M.iconeMonnaie, M.nomMonnaie);
  for (const x of (M.compteurs || [])) pastille(x.cle, x.icone, x.nom);
  pastille("vague", (u) => { etoile5(u/2, u/2, u*.42, u*.2, "#E0533D", 3, 1); }, "Vague");
  pastille("score", trophee, "Score");
  const ens = document.createElement("div"); ens.className = "gdc-ensuite"; ens.title = "La vague suivante"; h.append(ens);
  hud.ensuite = { el:ens, cle:null };
  for (const [i, p] of (M.pouvoirs || []).entries()){
    const x = document.createElement("button"); x.className = "gdc-pouvoir"; x.dataset.id = p.id;
    x.title = p.nom + " (touche " + "AZ"[i] + ") — " + p.desc;
    x.append(icone(p.icone, 28));
    const k = document.createElement("kbd"); k.textContent = "AZ"[i]; x.append(k);
    x.addEventListener("click", () => activePouvoir(p));
    h.append(x);
  }
  const b = (txt, titre, f, classe = "creme rond") => {
    const x = document.createElement("button"); x.className = "gdc-bouton " + classe; x.innerHTML = txt; x.title = titre;
    x.addEventListener("click", f); h.append(x); return x;
  };
  hud.lance = b("Lancer la vague", "Envoyer la vague suivante (Entrée)", lanceVague, "vague");
  hud.vitesse = b("▶▶", "Vitesse", () => { J.vitesse = J.vitesse >= 3 ? 1 : J.vitesse + 1; majHUD(true); });
  hud.aide = b("?", "Comment jouer", () => montreIntro(true));
  hud.pause = b("❚❚", "Pause", () => montrePause());
  hud.plein = b(estPlein() ? "⤡" : "⛶", "Plein écran", () => basculePlein());
}
function majHUD(force){
  if (!J || !hud.vies) return;
  const pose = (cle, txt) => { const x = hud[cle]; if (x && (force || x.ancien !== txt)){ x.v.innerHTML = txt; x.ancien = txt; } };
  pose("vies", String(J.vies));
  pose("argent", String(Math.floor(J.argent)));
  for (const x of (M.compteurs || [])) pose(x.cle, x.valeur(J));
  pose("vague", J.infini ? `∞<small> ${J.vague}</small>` : `${J.vague}<small> / ${J.vagues.length}</small>`);
  pose("score", nombre(J.score));
  majEnsuite();
  const L = hud.lance;
  const reste = J.vague < J.vagues.length || J.infini;
  L.disabled = !(!J.file.length && reste && !J.fini);
  const txt = J.vague === 0 ? "Lancer la vague 1" :
              !reste ? "Dernière vague" :
              J.entre ? `Vague ${J.vague + 1}<small>dans ${Math.ceil(J.compte)} s</small>` :
              J.file.length ? "Vague en cours…" : `Vague ${J.vague + 1} ▸<small>bonus !</small>`;
  if (L.innerHTML !== txt) L.innerHTML = txt;
  const vt = J.vitesse === 1 ? "▶▶" : "×" + J.vitesse;
  if (hud.vitesse.textContent !== vt) hud.vitesse.textContent = vt;
  hud.vitesse.classList.toggle("actif", J.vitesse > 1);
  for (const b of $(".gdc-bas").querySelectorAll(".gdc-carte-tour")){
    const d = M.tours[b.dataset.type];
    b.classList.toggle("cher", J.argent < d.prix);
    b.classList.toggle("verrou", !dispo(d));
    b.classList.toggle("neuf", J.neufs.has(b.dataset.type));
    b.classList.toggle("choisie", J.aPoser === b.dataset.type);
  }
}
function refuse(quoi){
  son("non");
  const x = quoi === "argent" ? hud.argent : hud[quoi];
  if (x){ x.p.classList.remove("vide"); void x.p.offsetWidth; x.p.classList.add("vide"); }
}

/* ── la boutique et les pouvoirs ── */
function construitBoutique(){
  const b = $(".gdc-bas"); b.innerHTML = "";
  const types = Object.keys(M.tours).filter(k => !M.tours[k].cacheBoutique).sort((a, b) => (M.tours[a].debloque || 0) - (M.tours[b].debloque || 0) || M.tours[a].prix - M.tours[b].prix);
  M.ordre = types;
  types.forEach((type, i) => {
    const d = M.tours[type];
    const x = document.createElement("button");
    x.className = "gdc-carte-tour"; x.dataset.type = type;
    x.title = d.nom + " — " + d.desc + (d.contre && d.contre.length ? " (" + d.contre.map(k => TRAITS[k].role).join(", ") + ")" : "");
    x.append(icone((u) => {
      c.translate(u / 2, u * (d.yIcone || .62)); const k = d.echelleIcone || .62; c.scale(k, k);
      if (M.orienteTour) M.orienteTour(-Math.PI / 2);
      d.dessine({ d, niv:1, ang:-Math.PI / 2, recul:0, pousse:1, g:i + 3, icone:true }, 0);
    }, 58, 60));
    const nom = document.createElement("b"); nom.textContent = d.nom; x.append(nom);
    const prix = document.createElement("span"); prix.append(icone(M.iconeMonnaie, 16)); prix.append(String(d.prix)); x.append(prix);
    const k = document.createElement("kbd"); k.textContent = i < 9 ? i + 1 : ""; x.append(k);
    if (d.contre && d.contre.length){ const r = document.createElement("u"); r.textContent = TRAITS[d.contre[0]].role; r.style.background = TRAITS[d.contre[0]].couleur; x.append(r); }
    const cad = document.createElement("em"); cad.className = "gdc-cadenas"; cad.textContent = "🔒 vague " + (d.debloque || 0); x.append(cad);
    const neuf = document.createElement("i"); neuf.textContent = "nouveau"; x.append(neuf);
    x.addEventListener("click", () => choisisAPoser(J.aPoser === type ? null : type));
    b.append(x);
  });
  const aide = document.createElement("div"); aide.className = "gdc-aide-boutique"; b.append(aide);
  majAideBoutique(); majPouvoirs();
}
function majPouvoirs(){
  if (!J) return;
  for (const b of RACINE.querySelectorAll(".gdc-pouvoir")){
    const p = M.pouvoirs.find(x => x.id === b.dataset.id);
    const k = Math.max(0, (J.pouvoirs[p.id] - J.t) / p.recharge);
    b.style.setProperty("--k", k.toFixed(3));
    b.classList.toggle("pret", k <= 0 && J.vague > 0);
    b.classList.toggle("vise", J.ciblage === p);
  }
}
/* « Ensuite » : de petits portraits des bestioles de la prochaine vague */
function majEnsuite(){
  const E = hud.ensuite; if (!E) return;
  const def = J.vagues[J.vague];
  const cle = J.fini || !def ? "rien" : J.vague + ":" + J.grand;
  if (E.cle === cle) return;
  E.cle = cle; E.el.innerHTML = "";
  E.el.hidden = cle === "rien";
  plusTard();
  if (cle === "rien") return;
  const n = {}, geant = {};
  for (const g of def){
    const [type, nb] = g, d = M.ennemis[type];
    n[type] = (n[type] || 0) + (d.boss || (g[5] && g[5].geant) ? nb : Math.round(nb * R().nombre));
    if (g[5] && g[5].geant) geant[type] = true;
  }
  const t = document.createElement("small"); t.textContent = "Ensuite"; E.el.append(t);
  for (const [type, nb] of Object.entries(n)){
    const d = M.ennemis[type];
    const tr = d.boss ? "boss" : geant[type] ? "boss" : traitsDe(d)[0];
    const b = document.createElement("span"); b.className = "gdc-ens-bete";
    b.title = d.nom + " ×" + nb + (tr ? " — " + (d.boss ? "boss" : geant[type] ? "géant" : TRAITS[tr].nom) : "");
    b.append(icone((u) => {
      c.translate(u / 2, u * .78); const k = Math.min(.9, 15 / (d.r || 12)); c.scale(k, k);
      if (d.vole) c.translate(0, (d.hautCible || 26) - 4);
      try { d.dessine({ d, anim:1, g:7, pv:1, pvMax:1, dir:1, age:9, a:0, r:999, z:0 }, 0); } catch(e){}
    }, 30, 40));
    const nbre = document.createElement("i"); nbre.textContent = "×" + nb; b.append(nbre);
    if (tr){ const p = document.createElement("u"); p.style.background = TRAITS[tr].couleur; p.textContent = d.boss ? "boss" : geant[type] ? "géant" : TRAITS[tr].nom; b.append(p); }
    E.el.append(b);
  }
}
function majAideBoutique(){
  const a = $(".gdc-aide-boutique"); if (!a) return;
  if (J.ciblage) a.innerHTML = `<b>${J.ciblage.nom}</b> — ${J.ciblage.desc} <b>Touche le plateau.</b>`;
  else if (J.aPoser){ const d = M.tours[J.aPoser]; a.innerHTML = `<b>${d.nom}</b> — ${d.desc} ${roleTexte(d)}`; }
  else a.innerHTML = M.astuce || "Choisis un défenseur, puis touche le plateau pour le poser.";
}
function roleTexte(d){
  const c = (d.contre || []).filter(k => TRAITS[k].nom);
  return c.length ? "<em>Utile contre les " + c.map(k => TRAITS[k].nom === "nuée" ? "nuées" : TRAITS[k].nom === "géant" ? "géants" : TRAITS[k].nom + "s").join(", ") + ".</em>" : "";
}
function choisisAPoser(type){
  if (!J) return;
  if (type && !dispo(M.tours[type])){ son("non"); banniere(M.tours[type].nom + " : débloqué à la vague " + M.tours[type].debloque, false, 1500); return; }
  if (type) J.neufs.delete(type);
  if (type && J.argent < M.tours[type].prix){ refuse("argent"); }
  J.aPoser = type; J.fantome = null;
  if (type){ choisisTour(null); J.ciblage = null; majPouvoirs(); }
  majAideBoutique(); majHUD(true);
}

/* ── la fiche d'un défenseur posé ── */
function choisisTour(t){
  J.choisie = t;
  majFiche(true);
}
function coutTexte(t){ return M.coutAmelio ? M.coutAmelio(J, t) : String(prixAmelio(t)); }
function majFiche(force){
  const f = $(".gdc-fiche"), t = J && J.choisie;
  if (!t){ f.hidden = true; return; }
  const petit = cv.clientWidth < 560;
  const parent = petit ? $(".gdc-jeu") : $(".gdc-scene");
  if (f.parentElement !== parent){ parent.append(f); force = true; }
  f.classList.toggle("gdc-fiche-bas", petit);
  f.hidden = false;
  if (force || f.dataset.id !== String(t.id) || f.dataset.niv !== String(t.niv) || f.dataset.v !== t.visee){
    f.dataset.id = t.id; f.dataset.niv = t.niv; f.dataset.v = t.visee;
    const d = t.d, b = branche(t);
    let amel = "";
    if (d.sansNiveau) amel = "";
    else if (M.texteAvant && M.texteAvant(J, t)) amel = `<button class="gdc-bouton sapin" data-a="amel">${M.texteAvant(J, t)}</button>`;
    else if (t.niv === 1) amel = `<button class="gdc-bouton sapin" data-a="amel">Améliorer · ${coutTexte(t)}</button>`;
    else if (t.niv === 2 && d.branches) amel = `<div class="gdc-voies"><small>Choisis sa spécialité · ${coutTexte(t)}</small>${d.branches.map((x, i) =>
        `<button class="gdc-voie v${i}" data-a="b${i}"><b>${x.nom}</b><span>${x.desc}</span></button>`).join("")}</div>`;
    else if (t.niv === 2) amel = `<button class="gdc-bouton sapin" data-a="amel">Améliorer · ${coutTexte(t)}</button>`;
    else amel = `<button class="gdc-bouton" disabled>Niveau max</button>`;
    const viseur = d.genre === "tir" || d.vise ? `<button class="gdc-bouton creme gdc-viseur" data-a="vise">🎯 Vise ${VISEES[t.visee]}</button>` : "";
    f.innerHTML = `
      <button class="gdc-x" title="Fermer">×</button>
      <h4>${b ? b.nom : d.nom} ${d.sansNiveau ? "" : `<span class="gdc-etoiles-niv">${"★".repeat(t.niv)}${"☆".repeat(3 - t.niv)}</span>`}</h4>
      <p>${b ? b.desc : d.desc}</p>${roleTexte(d) ? `<p class="gdc-role">${roleTexte(d)}</p>` : ""}
      ${d.aimant ? `<p>Attire les cadeaux jusqu’à <b>${Math.round(stat(t, "rayon"))}</b> de distance.</p>` : M.infoTour ? `<p>${M.infoTour(J, t)}</p>` : ""}
      ${t.degats > 0 ? `<p class="gdc-exploit">A déjà fait <b>${nombre(t.degats)}</b> de dégâts</p>` : ""}
      ${viseur}
      <div class="gdc-ligne">${t.niv === 2 && d.branches ? "" : amel}
        <button class="gdc-bouton creme" data-a="vend">${M.texteVente || "Reprendre"} · ${prixVente(t)}</button>
      </div>
      ${t.niv === 2 && d.branches ? amel : ""}
      ${M.boutonsFiche ? M.boutonsFiche(J, t) : ""}`;
    f.querySelector(".gdc-x").onclick = () => choisisTour(null);
    f.querySelectorAll("[data-a]").forEach(bt => bt.onclick = () => {
      const a = bt.dataset.a;
      if (a === "amel") amelioreTour(t);
      else if (a === "b0" || a === "b1") amelioreTour(t, +a[1]);
      else if (a === "vend") vendTour(t);
      else if (a === "vise") t.visee = ORDRE_VISEE[(ORDRE_VISEE.indexOf(t.visee) + 1) % ORDRE_VISEE.length];
      else if (M.actionFiche) M.actionFiche(J, t, a);
      majFiche(true);
    });
  }
  const larg = cv.clientWidth, haut = cv.clientHeight;
  if (petit){ f.style.left = ""; f.style.top = ""; }
  else {
    const px = t.x / W * larg, py = t.y / H * haut;
    const fh = f.offsetHeight || 150;
    const dessous = py + 40 + fh < haut;
    f.style.left = borne(px, 125, larg - 125) + "px";
    f.style.top = (dessous ? py + 34 : Math.max(4, py - 46 - fh)) + "px";
  }
  const peut = M.peutAmeliorer ? M.peutAmeliorer(J, t) : J.argent >= prixAmelio(t);
  f.querySelectorAll('[data-a="amel"],[data-a="b0"],[data-a="b1"]').forEach(x => x.disabled = !peut);
}

/* ── la bannière ── */
let minuterieBanniere = 0;
function banniere(txt, alerte = false, duree = 1800){
  const b = $(".gdc-banniere");
  b.textContent = txt; b.classList.toggle("alerte", alerte);
  b.classList.add("vue");
  clearTimeout(minuterieBanniere);
  minuterieBanniere = setTimeout(() => b.classList.remove("vue"), duree);
}

/* ── les voiles ── */
function voile(html, apres){
  const v = $(".gdc-voile");
  v.innerHTML = `<div class="gdc-feuille">${html}</div>`;
  v.hidden = false;
  if (apres) apres(v);
  const cadre = $(".gdc-cadre");
  cadre.style.minHeight = "";
  const besoin = v.firstElementChild.offsetHeight + 40;
  if (besoin > cadre.offsetHeight) cadre.style.minHeight = besoin + "px";
  return v;
}
function fermeVoile(){ $(".gdc-voile").hidden = true; $(".gdc-cadre").style.minHeight = ""; }

function montreIntro(enJeu){
  if (enJeu){ J.pause = true; }
  let mode = J.mode;
  const pouv = (M.pouvoirs || []).map(p => `<li><b>${p.nom}</b> — ${p.desc}</li>`).join("");
  voile(`
    <h2>${M.nom}${nomCarte(M, J.carte) ? " — " + nomCarte(M, J.carte) : ""}</h2>
    ${M.cartes && M.cartes[J.carte] ? `<p class="gdc-carte-desc">Niveau ${J.carte + 1} · ${M.cartes[J.carte].desc}</p>` : ""}
    <p class="gdc-accroche">${M.histoire}</p>
    <details class="gdc-regles"${enJeu ? "" : " open"}><summary>Comment on joue ici</summary>
      <ul>${M.regles.map(r => `<li>${r}</li>`).join("")}</ul>
    </details>
    ${pouv ? `<details class="gdc-regles"><summary>Tes pouvoirs (touches A et Z)</summary><ul>${pouv}</ul></details>` : ""}
    <details class="gdc-regles"><summary>Partout : vagues, défenseurs, bonus</summary>
    <ul>
      <li><b>30 vagues</b>, un boss aux vagues 10, 20 et 30, des géants aux vagues 5, 15 et 25. Les 10 premières vagues servent à s'installer ; ensuite, ça devient sérieux.</li>
      <li>De <b>nouveaux défenseurs se débloquent</b> au fil des vagues : plus chers, plus forts, et chacun a son rôle (son étiquette de couleur).</li>
      <li>Certaines bestioles <b>volent</b>, sont <b>blindées</b>, ont un <b>bouclier</b>, sont <b>invisibles</b> ou arrivent en <b>nuée</b>. Le cadre « Ensuite », dans la barre du haut, montre ce qui arrive : prépare le bon mélange de défenseurs !</li>
      <li><b>Double-clique</b> (ou touche deux fois) un défenseur pour l'améliorer tout de suite, sans ouvrir sa fiche.</li>
      <li>Au niveau 3, chaque défenseur choisit <b>une spécialité parmi deux</b> : là, sa fiche s'ouvre pour que tu choisisses.</li>
      <li>Attrape les <b>cadeaux</b> qui tombent, enchaîne les <b>combos</b> et vise les bestioles <b>dorées</b>.</li>
      <li>Appeler la vague suivante plus tôt rapporte un petit <b>bonus</b>.</li>
    </ul>
    </details>
    ${enJeu ? "" : `
    <h3>Choisis ta difficulté</h3>
    <div class="gdc-modes">
      <button class="gdc-mode${mode === "petit" ? " choisi" : ""}" data-m="petit"><b>Petit gardien</b><span>Des bestioles plus fragiles et du temps pour réfléchir. Idéal pour découvrir.</span></button>
      <button class="gdc-mode${mode === "grand" ? " choisi" : ""}" data-m="grand"><b>Grand gardien</b><span>Le vrai défi : l'argent est rare, chaque défenseur compte, et après la vague 10 il faut une vraie stratégie.</span></button>
    </div>`}
    <div class="gdc-actions">
      ${enJeu ? `<button class="gdc-bouton sapin" data-a="go">Reprendre</button>` :
                `<button class="gdc-bouton creme" data-a="menu">◂ Mondes</button><button class="gdc-bouton sapin" data-a="go">C'est parti !</button>`}
    </div>`, (v) => {
    v.querySelectorAll(".gdc-mode").forEach(b => b.onclick = () => {
      mode = b.dataset.m; v.querySelectorAll(".gdc-mode").forEach(x => x.classList.toggle("choisi", x === b));
    });
    v.querySelector('[data-a="go"]').onclick = () => {
      if (!enJeu && mode !== J.mode){ nouvellePartie(M, mode, J.carte); construitHUD(); construitBoutique(); }
      memoire.ecris("mode", mode);
      fermeVoile(); J.pause = false; majHUD(true);
    };
    const m = v.querySelector('[data-a="menu"]'); if (m) m.onclick = () => { fermeVoile(); montreMenu(); };
  });
}
function montrePause(){
  if (!J || J.fini) return;
  J.pause = true;
  voile(`
    <h2>Pause</h2>
    <p class="gdc-accroche">Les bestioles attendent sagement… pour l'instant.</p>
    <div class="gdc-actions">
      <button class="gdc-bouton creme" data-a="menu">◂ Mondes</button>
      <button class="gdc-bouton creme" data-a="rejoue">Recommencer</button>
      <button class="gdc-bouton creme" data-a="regles">Comment jouer</button>
      <button class="gdc-bouton creme" data-a="son">${muet ? "Son : coupé" : "Son : activé"}</button>
      <button class="gdc-bouton sapin" data-a="go">Reprendre</button>
    </div>`, (v) => {
    v.querySelector('[data-a="go"]').onclick = () => { fermeVoile(); J.pause = false; };
    v.querySelector('[data-a="menu"]').onclick = () => { fermeVoile(); montreMenu(); };
    v.querySelector('[data-a="rejoue"]').onclick = () => { fermeVoile(); lanceMonde(M, J.mode, false, J.carte); };
    v.querySelector('[data-a="regles"]').onclick = () => montreIntro(true);
    v.querySelector('[data-a="son"]').onclick = (ev) => { muet = !muet; memoire.ecris("muet", muet); ev.target.textContent = muet ? "Son : coupé" : "Son : activé"; };
  });
}
function grandeEtoile(pleine){
  return icone((u) => etoile5(u/2, u/2 + 1, u*.44, u*.2, pleine ? "#F2B33B" : "rgba(51,38,29,.18)", pleine ? 5 : 9, pleine ? 1.2 : 0), 64);
}
function montreFin(victoire, etoiles){
  const mvp = meilleurDefenseur();
  const record = J.score > J.ancienRecord;
  const titre = J.infini ? "Fin du mode infini" : victoire ? M.texteVictoire : M.texteDefaite;
  const phrase = J.infini ? `Tu as tenu <b>${J.vague - 1} vagues</b> !` :
    victoire ? `${J.repousses} bestioles repoussées, ${J.vies} ${M.nomVies.toLowerCase()} sur ${J.viesMax} sauvé${J.vies > 1 ? "s" : ""}.`
             : `Tu as tenu ${J.vague - 1} vague${J.vague > 2 ? "s" : ""} sur ${J.vagues.length}. ${M.conseil}`;
  const v = voile(`
    <h2>${titre}</h2>
    ${victoire ? `<div class="gdc-grandes-etoiles"></div>` : ""}
    <p class="gdc-accroche">${phrase}</p>
    <div class="gdc-bilan">
      <div><small>Score</small><b>${nombre(J.score)}</b>${record ? `<em>Nouveau record !</em>` : `<span>Record : ${nombre(J.ancienRecord)}</span>`}</div>
      <div><small>Meilleur combo</small><b>×${J.comboMax}</b></div>
      ${mvp ? `<div><small>Meilleur défenseur</small><b>${branche(mvp) ? branche(mvp).nom : mvp.d.nom}</b><span>${nombre(mvp.degats)} dégâts</span></div>` : ""}
    </div>
    <div class="gdc-actions">
      <button class="gdc-bouton creme" data-a="menu">◂ Mondes</button>
      <button class="gdc-bouton ${victoire && !J.infini ? "creme" : "sapin"}" data-a="rejoue">${victoire ? "Rejouer" : "Réessayer"}</button>
      ${victoire && !J.infini ? `<button class="gdc-bouton tomate" data-a="infini">Mode infini ∞</button>` : ""}
      ${victoire && M.cartes && J.carte < M.cartes.length - 1 ? `<button class="gdc-bouton sapin" data-a="suivant">Terrain suivant ▸</button>` : ""}
    </div>`, (v) => {
    v.querySelector('[data-a="menu"]').onclick = () => { fermeVoile(); montreMenu(); };
    v.querySelector('[data-a="rejoue"]').onclick = () => { fermeVoile(); lanceMonde(M, J.mode, false, J.carte); };
    const inf = v.querySelector('[data-a="infini"]'); if (inf) inf.onclick = continueInfini;
    const suiv = v.querySelector('[data-a="suivant"]'); if (suiv) suiv.onclick = () => { fermeVoile(); lanceMonde(M, J.mode, true, J.carte + 1); };
  });
  const ge = v.querySelector(".gdc-grandes-etoiles");
  if (ge) for (let i = 0; i < 3; i++){ const k = grandeEtoile(i < etoiles); k.style.animation = `gdc-pose .4s ${.15 + i * .2}s both`; ge.append(k); }
}

/* ── le menu des mondes ── */
function montreMenu(){
  J = null; M = null;
  $(".gdc-jeu").hidden = true;
  const m = $(".gdc-menu"); m.hidden = false;
  const titre = "Les Gardiens du Centre";
  const couleurs = FETE.titre || ["#E0533D", "#2F8F6B", "#3E9FC9", "#7A4E9E", "#F2B33B"];
  m.innerHTML = `
    <h1 class="gdc-titre">${[...titre].map((l, i) => l === " " ? " " :
      `<span style="color:${couleurs[i % couleurs.length]};transform:rotate(${(hache(i) - .5) * 12}deg) translateY(${(hache(i + 9) - .5) * 6}px)">${l}</span>`).join("")}</h1>
    ${FETE.badge ? `<p class="gdc-fete-badge">${FETE.badge}</p>` : ""}
    <p class="gdc-sous-titre">Quatre mondes, quatre façons de jouer. Pose tes défenseurs, repousse les bestioles gourmandes et protège ce qui compte !</p>
    <div class="gdc-mondes"></div>
    <div class="gdc-pied"><button class="gdc-bouton creme" data-a="son">${muet ? "🔇 Son coupé" : "🔊 Son activé"}</button><button class="gdc-bouton creme" data-a="plein">${estPlein() ? "⤡ Quitter le plein écran" : "⛶ Plein écran"}</button></div>`;
  const liste = m.querySelector(".gdc-mondes");
  for (const monde of MONDES){
    const b = document.createElement("button"); b.className = "gdc-monde";
    const k = document.createElement("canvas"); k.width = 480; k.height = 288;
    const x = k.getContext("2d"); x.scale(.5, .5);
    const ancien = OMBRE; OMBRE = monde.ombre || "rgba(70,40,15,.30)";
    avec(x, () => {
      const faux = { t:0, tours:[], ennemis:[], vies:monde.vies, viesMax:monde.vies, mode:"petit", apercu:true, argent:0, vague:0, file:[], cadeaux:[], carte:0 };
      if (monde.charge) monde.charge(0);
      monde.init(faux); monde.fond(faux); habilleSol(x, k, monde);
      if (monde.dessineSol) monde.dessineSol(faux);
      for (const [type, px, py, ang] of (monde.apercu.tours || [])){
        const d = monde.tours[type];
        c.save(); c.translate(px, py); if (monde.orienteTour) monde.orienteTour(ang); d.dessine({ d, niv:2, ang:ang ?? -Math.PI/2, angPose:ang, recul:0, pousse:1, g:px }, 1); c.restore();
      }
      for (const [type, px, py, dir] of (monde.apercu.ennemis || [])){
        const d = monde.ennemis[type];
        c.save(); c.translate(px, py); if (dir < 0 && !d.sansMiroir) c.scale(-1, 1); d.dessine({ d, anim:px / 50, g:py, pv:1, pvMax:1, dir:dir || 1, age:9, a:0, r:999 }, px / 70); c.restore();
      }
    });
    OMBRE = ancien;
    b.append(k);
    const ids = (monde.cartes || [0]).map((_, k) => monde.id + (k ? "-" + (k + 1) : ""));
    const total = ids.reduce((s, id) => s + Math.max(memoire.lis("etoiles:" + id + ":grand", 0), memoire.lis("etoiles:" + id + ":petit", 0)), 0);
    const titreM = document.createElement("b"); titreM.textContent = monde.nom;
    const et = document.createElement("i"); et.className = "gdc-total-etoiles"; et.textContent = "★ " + total + " / " + ids.length * 3;
    titreM.append(et);
    const meca = document.createElement("em"); meca.textContent = monde.mecanique;
    const acc = document.createElement("span"); acc.textContent = monde.accroche;
    b.append(meca, titreM, acc);
    const rec = Math.max(...ids.map(id => Math.max(memoire.lis("record:" + id + ":grand", 0), memoire.lis("record:" + id + ":petit", 0))));
    const inf = Math.max(...ids.map(id => Math.max(memoire.lis("infini:" + id + ":grand", 0), memoire.lis("infini:" + id + ":petit", 0))));
    if (rec){ const r = document.createElement("small"); r.className = "gdc-record"; r.textContent = `Record : ${nombre(rec)}` + (inf ? ` · infini : ${inf} vagues` : ""); b.append(r); }
    if (monde.cartes){ const t = document.createElement("small"); t.className = "gdc-nb-terrains"; t.textContent = monde.cartes.length + " terrains"; b.append(t); }
    b.addEventListener("click", () => monde.cartes ? montreCartes(monde) : lanceMonde(monde, memoire.lis("mode", "petit"), true));
    liste.append(b);
  }
  m.querySelector('[data-a="son"]').onclick = (ev) => { muet = !muet; memoire.ecris("muet", muet); ev.target.textContent = muet ? "🔇 Son coupé" : "🔊 Son activé"; };
}
/* une petite image d'un terrain (pour le choix des terrains) */
function vignette(monde, carte, larg = 320){
  const k = document.createElement("canvas"); k.width = larg; k.height = Math.round(larg * H / W);
  const x = k.getContext("2d"); x.scale(larg / W, larg / W);
  const ancien = OMBRE; OMBRE = monde.ombre || "rgba(70,40,15,.30)";
  avec(x, () => {
    const faux = { t:0, tours:[], ennemis:[], vies:monde.vies, viesMax:monde.vies, mode:"petit", apercu:true, argent:0, vague:0, file:[], cadeaux:[], carte };
    if (monde.charge) monde.charge(carte);
    monde.init(faux); monde.fond(faux); habilleSol(x, k, monde);
    if (monde.dessineSol) monde.dessineSol(faux);
  });
  OMBRE = ancien;
  return k;
}
/* le choix du terrain, après le choix du monde */
function montreCartes(monde){
  const v = voile(`
    <h2>${monde.nom}</h2>
    <p class="gdc-accroche">Choisis ton terrain. Chacun se joue en Petit et en Grand gardien.</p>
    <div class="gdc-cartes"></div>
    <div class="gdc-actions"><button class="gdc-bouton creme" data-a="menu">◂ Mondes</button></div>`, (v) => {
    v.querySelector('[data-a="menu"]').onclick = () => fermeVoile();
  });
  const liste = v.querySelector(".gdc-cartes");
  monde.cartes.forEach((carte, k) => {
    const id = monde.id + (k ? "-" + (k + 1) : "");
    const b = document.createElement("button"); b.className = "gdc-carte-terrain";
    b.append(vignette(monde, k));
    const et = (mode) => { const n = memoire.lis("etoiles:" + id + ":" + mode, 0); return "★".repeat(n) + "☆".repeat(3 - n); };
    const rec = Math.max(memoire.lis("record:" + id + ":grand", 0), memoire.lis("record:" + id + ":petit", 0));
    b.insertAdjacentHTML("beforeend", `<em>Niveau ${k + 1}</em><b>${carte.nom}</b><span>${carte.desc}</span>
      <small>Petit ${et("petit")} · Grand ${et("grand")}${rec ? " · record " + nombre(rec) : ""}</small>`);
    b.onclick = () => { fermeVoile(); lanceMonde(monde, memoire.lis("mode", "petit"), true, k); };
    liste.append(b);
  });
  /* la feuille vient d'être agrandie : on remesure */
  const cadre = $(".gdc-cadre"); cadre.style.minHeight = "";
  const besoin = v.firstElementChild.offsetHeight + 40; if (besoin > cadre.offsetHeight) cadre.style.minHeight = besoin + "px";
}
function lanceMonde(monde, mode, intro, carte = 0){
  $(".gdc-menu").hidden = true; $(".gdc-jeu").hidden = false;
  fermeVoile();
  nouvellePartie(monde, mode, carte);
  $(".gdc-scene").style.background = monde.couleurFond || "#7DB359";
  redim();
  construitHUD(); construitBoutique(); majHUD(true);
  majAstuceEcran(); tailleFixee = ""; ajusteTaille();
  $(".gdc-fiche").hidden = true;
  if (intro){ J.pause = true; montreIntro(false); }
}

/* ═════════════════════════════════════════════════════════════
   LES COMMANDES
   ═════════════════════════════════════════════════════════════ */
let enTactile = false, appui = null;
function posToile(ev){
  const r = cv.getBoundingClientRect();
  return { x:(ev.clientX - r.left) / r.width * W, y:(ev.clientY - r.top) / r.height * H };
}
function fantome(){
  if (!J || !J.aPoser) return null;
  const p = enTactile ? J.fantome : J.souris;
  if (!p) return null;
  return M.emplacement(J, p.x, p.y, J.aPoser);
}
cv.addEventListener("pointermove", (ev) => {
  if (!J) return;
  const p = posToile(ev);
  if (ev.pointerType === "mouse") { enTactile = false; J.souris = p; }
  if (appui && M.glisse){
    if (appui.glisse || dist(appui.x, appui.y, p.x, p.y) > 8){ appui.glisse = true; M.glisse(J, appui, p); }
  }
});
cv.addEventListener("pointerleave", () => { if (J) J.souris = null; });
cv.addEventListener("pointerdown", (ev) => {
  if (!J || J.pause || J.fini) return;
  enTactile = ev.pointerType !== "mouse";
  const p = posToile(ev);
  appui = { x:p.x, y:p.y, glisse:false, debut:M.debutGlisse && !J.ciblage ? M.debutGlisse(J, p) : null };
  try { cv.setPointerCapture(ev.pointerId); } catch(e){}
  if (audio && audio.state === "suspended") audio.resume();
});
cv.addEventListener("pointerup", (ev) => {
  if (!J || J.pause || J.fini){ appui = null; return; }
  const p = posToile(ev);
  const a = appui; appui = null;
  if (a && a.glisse){ if (M.finGlisse) M.finGlisse(J); return; }
  clic(p);
});
function clic(p){
  /* un cadeau d'abord : il s'envole vite */
  let k = null, kd = 34;
  for (const x of J.cadeaux){ const d = dist(p.x, p.y, x.x, x.y - 4); if (d < kd){ kd = d; k = x; } }
  if (k){ ouvreCadeau(k); return; }
  if (J.ciblage){ J.fantome = p; lancePouvoir(J.ciblage, p); return; }
  if (M.clic && M.clic(J, p)) return;
  if (J.aPoser){
    const emp = M.emplacement(J, p.x, p.y, J.aPoser);
    if (enTactile && (!J.fantome || !emp || M.emplacement(J, J.fantome.x, J.fantome.y, J.aPoser)?.cle !== emp.cle)){
      J.fantome = p; return;                     /* au doigt : un premier appui montre, le second pose */
    }
    if (!emp || !emp.ok){ son("non"); return; }
    if (J.argent < M.tours[J.aPoser].prix){ refuse("argent"); return; }
    const t = poseTour(J.aPoser, emp);
    J.fantome = null;
    if (J.argent < M.tours[J.aPoser].prix) choisisAPoser(null);
    return t;
  }
  let meilleur = null, md = 30;
  for (const t of J.tours){ const d = dist(p.x, p.y, t.x, t.y - 8); if (d < md){ md = d; meilleur = t; } }
  /* deux clics rapprochés sur le même défenseur : on l'améliore sans ouvrir sa fiche */
  clearTimeout(minuterieFiche);
  const maintenant = performance.now();
  if (meilleur && dernierClic && dernierClic.t === meilleur && maintenant - dernierClic.h < DOUBLE_CLIC){
    dernierClic = null;
    ameliorationRapide(meilleur);
    return;
  }
  dernierClic = meilleur ? { t: meilleur, h: maintenant } : null;
  if (!meilleur){ choisisTour(null); return; }
  if (J.choisie === meilleur) return;
  if (J.choisie) choisisTour(null);
  /* la fiche attend un instant : si un second clic arrive, elle ne s'ouvre pas */
  minuterieFiche = setTimeout(() => { if (J && J.tours.includes(meilleur) && !J.fini) choisisTour(meilleur); }, DOUBLE_CLIC);
}
const DOUBLE_CLIC = 280;
let dernierClic = null, minuterieFiche = 0;
function ameliorationRapide(t){
  const ouverte = J.choisie === t;
  const choixAFaire = t.niv === 2 && t.d.branches && !(M.texteAvant && M.texteAvant(J, t));
  if (t.d.sansNiveau || t.niv >= 3 || choixAFaire){
    /* rien à améliorer d'un coup : niveau max, ou une spécialité à choisir */
    if (choixAFaire) texte("Choisis sa spécialité", t.x, t.y - 44, "#fff", 14);
    else if (!t.d.sansNiveau) texte("Niveau max", t.x, t.y - 44, "#fff", 14);
    choisisTour(t); return;
  }
  const peut = M.peutAmeliorer ? M.peutAmeliorer(J, t) : J.argent >= prixAmelio(t);
  if (!peut){ amelioreTour(t); choisisTour(t); return; }   /* le refus fait clignoter ce qui manque, la fiche montre le prix */
  if (!ouverte) J.choisie = null;
  amelioreTour(t);
}
document.addEventListener("keydown", (ev) => {
  if (!J || $(".gdc-jeu").hidden || /input|textarea|select/i.test(ev.target.tagName)) return;
  if (!$(".gdc-voile").hidden) return;
  const types = M.ordre || Object.keys(M.tours);
  if (/^[1-9]$/.test(ev.key) && types[+ev.key - 1]){ choisisAPoser(J.aPoser === types[+ev.key - 1] ? null : types[+ev.key - 1]); return; }
  const k = ev.key.toLowerCase();
  if ((k === "a" || k === "z") && M.pouvoirs && M.pouvoirs["az".indexOf(k)]){ activePouvoir(M.pouvoirs["az".indexOf(k)]); return; }
  if (ev.key === "Escape"){ choisisAPoser(null); choisisTour(null); J.ciblage = null; majPouvoirs(); majAideBoutique(); return; }
  if (k === "p"){ montrePause(); return; }
  if (ev.key === "Enter"){ lanceVague(); return; }
  if (M.touche && M.touche(J, ev.key, true, ev)) ev.preventDefault();
});
document.addEventListener("keyup", (ev) => { if (J && M && M.touche) M.touche(J, ev.key, false, ev); });

/* ═════════════════════════════════════════════════════════════
   LA BOUCLE
   ═════════════════════════════════════════════════════════════ */
let dernier = 0, reserve = 0, minuterieHUD = 0;
const PAS = 1 / 60;
function avance(dt){
  if (!J || J.pause || J.fini) return;
  reserve += dt * J.vitesse;
  let n = 0;
  while (reserve >= PAS && n < 12){ pas(PAS); reserve -= PAS; n++; }
  if (n >= 12) reserve = 0;
  if (secousse > 0) secousse = Math.max(0, secousse - dt);
}
function image(){
  if (!J || $(".gdc-jeu").hidden) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);
  avec(ctx, dessineScene);
  minuterieHUD += 1;
  if (minuterieHUD % 6 === 0){ majHUD(); majPouvoirs(); }
  if (J.choisie) majFiche(false);
}
function boucle(t){
  requestAnimationFrame(boucle);
  const dt = dernier ? Math.min(.1, (t - dernier) / 1000) : 0;
  dernier = t;
  avance(dt);
  image();
}

function demarre(){
  GRAIN = fabriqueGrain();
  appliqueFete(lisFete());
  montreMenu();
  requestAnimationFrame(boucle);
  if (/banc/.test(location.search + location.hash)){
    window.__gdc = { get J(){ return J; }, get M(){ return M; }, MONDES, REGLAGE, pas, image, lanceMonde, montreCartes, lanceVague, poseTour,
                     creeEnnemi, fermeVoile, clic, choisisAPoser, amelioreTour, avance, redim, toile:cv, lancePouvoir,
                     continueInfini, semeCadeau, ouvreCadeau, vendTour,
                     simule(sec){ for (let i = 0; i < sec * 60 && J && !J.fini; i++) pas(PAS); image(); } };
  }
}
