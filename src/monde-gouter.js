/* ═════════════════════════════════════════════════════════════
   MONDE 2 — LE GOÛTER
   Pas de chemin tracé. Les fourmis entrent par les bords et vont au
   plus court vers la nappe. Chaque objet posé est un OBSTACLE : on
   dessine soi-même le labyrinthe, sans jamais boucher tout passage.
   Les guêpes, elles, volent tout droit par-dessus.
   ═════════════════════════════════════════════════════════════ */
{
const NX = 20, NY = 12;
/* ═══ les trois terrains du goûter ═══
   nappe : le rectangle à protéger · entrees : dans l'ordre où elles s'ouvrent
   fixes : arbres, rochers, paniers… ; « eau » bloque, « pont » se traverse mais ne se construit pas
   murs : un labyrinthe d'exemple, pour le joueur automatique des tests */
const ENTREE = {
  g:(y) => ({ gx:0, gy:y, sx:-26, sy:(y + .5) * CASE, nom:"gauche" }),
  d:(y) => ({ gx:NX - 1, gy:y, sx:W + 26, sy:(y + .5) * CASE, nom:"droite" }),
  h:(x) => ({ gx:x, gy:0, sx:(x + .5) * CASE, sy:-26, nom:"haut" }),
  b:(x) => ({ gx:x, gy:NY - 1, sx:(x + .5) * CASE, sy:H + 26, nom:"bas" })
};
const serpentin = (cols, haut) => { const m = []; cols.forEach((x, k) => { for (let y = 0; y < NY; y++){ if ((k % 2 === 0) === haut ? y >= 10 : y <= 1) continue; m.push([x, y]); } }); return m; };
const CARTES = [
  { nom:"La pelouse", desc:"La nappe est au fond du pré. Construis un grand labyrinthe devant elle.",
    nappe:{ x:15, y:4 }, entrees:[ENTREE.g(2), ENTREE.g(9), ENTREE.h(7), ENTREE.b(11)],
    fixes:[["5,5", "arbre"], ["5,6", "rocher"], ["10,8", "arbre"], ["9,2", "rocher"], ["13,10", "rocher"], ["12,4", "panier"], ["2,11", "rocher"], ["17,1", "arbre"], ["16,10", "panier"]],
    murs:serpentin([2, 5, 8, 11], true) },
  { nom:"Le ruisseau", desc:"Un ruisseau coupe le pré en deux. Les fourmis doivent passer par deux petits ponts… où l'on ne peut rien poser.",
    nappe:{ x:15, y:3 }, entrees:[ENTREE.g(2), ENTREE.g(9), ENTREE.h(4), ENTREE.b(5)],
    fixes:[...Array.from({ length:NY }, (_, y) => [10 + "," + y, y === 2 || y === 9 ? "pont" : "eau"]), ["7,5", "rocher"], ["13,8", "rocher"], ["17,9", "arbre"], ["3,6", "panier"]],
    murs:serpentin([3, 6], false), programme:{ budget:62 } },
  { nom:"La clairière", desc:"La nappe est au milieu et les fourmis arrivent des quatre côtés : il faut un labyrinthe tout autour.",
    nappe:{ x:8, y:4 }, entrees:[ENTREE.g(5), ENTREE.d(6), ENTREE.h(10), ENTREE.b(9)],
    fixes:[["4,2", "arbre"], ["15,2", "arbre"], ["4,9", "arbre"], ["15,9", "arbre"], ["7,1", "rocher"], ["12,10", "rocher"], ["13,3", "panier"], ["6,8", "panier"]],
    murs:(() => { const m = []; for (let x = 6; x <= 13; x++){ m.push([x, 2]); m.push([x, 9]); } for (let y = 3; y <= 8; y++){ m.push([6, y]); m.push([13, y]); } return m.filter(([x, y]) => !(x === 6 && y === 2)); })(),
    argent:260, programme:{ budget:38 } }
];
let CARTE, NAPPE, CENTRE_NAPPE, ENTREES, FIXES, PONTS;
function charge(k){
  CARTE = CARTES[k] || CARTES[0];
  const N = CARTE.nappe;
  NAPPE = (x, y) => x >= N.x && x <= N.x + 3 && y >= N.y && y <= N.y + 3;
  CENTRE_NAPPE = { x:(N.x + 2) * CASE, y:(N.y + 2) * CASE };
  ENTREES = CARTE.entrees;
  FIXES = new Map(CARTE.fixes.filter(([, g]) => g !== "pont"));
  PONTS = new Set(CARTE.fixes.filter(([, g]) => g === "pont").map(([k]) => k));
}
charge(0);
const VOISINS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const idx = (x, y) => y * NX + x;

/* le champ des distances jusqu'à la nappe (∞ = muré) */
function champ(bloque){
  const d = new Float32Array(NX * NY).fill(Infinity), file = [];
  for (let y = 0; y < NY; y++) for (let x = 0; x < NX; x++) if (NAPPE(x, y)){ d[idx(x, y)] = 0; file.push(x, y); }
  for (let i = 0; i < file.length; i += 2){
    const x = file[i], y = file[i + 1], v = d[idx(x, y)];
    for (const [dx, dy] of VOISINS){
      const nx = x + dx, ny = y + dy;
      if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) continue;
      const k = idx(nx, ny);
      if (bloque[k] || d[k] !== Infinity) continue;
      d[k] = v + 1; file.push(nx, ny);
    }
  }
  return d;
}
function recalcule(J){ J.dist = champ(J.bloque); }

const ENTREES_OUVERTES = (v) => v < 8 ? 2 : v < 16 ? 3 : 4;

/* ── les objets de la colo ── */
const TOURS = {
  sac:{
    nom:"Sac à dos", prix:8, debloque:0, contre:["mur"], genre:"mur", sansNiveau:true,
    desc:"Ne fait rien… sauf barrer le passage. Parfait pour allonger le labyrinthe !",
    dessine(t){
      ov(0, 14, 17, 5, "rgba(0,0,0,.12)", 0, 0);
      bx(-15, -18, 30, 32, t.g % 2 ? "#3E7FC1" : "#E0703D", t.g, 1.2);
      bx(-12, -22, 24, 10, t.g % 2 ? "#3471AE" : "#C95E2F", t.g + 1, .6);
      bx(-9, -2, 18, 12, t.g % 2 ? "#5596D6" : "#F08A56", t.g + 2, .5);
      bande(-4, 4, 4, 4, 1.5, "#F2B33B", 0, 0);
      bande(-11, -20, -11, 12, 2, "rgba(0,0,0,.18)", 0, 0); bande(11, -20, 11, 12, 2, "rgba(0,0,0,.18)", 0, 0);
    }
  },
  pistolet:{
    nom:"Pistolet à eau", prix:35, debloque:0, contre:["vole"], genre:"tir", portee:125, cadence:.4, deg:8, vitesseTir:520, cibles:"tout", couleurTir:"#5FB8E8", bouche:22, hauteurTir:10,
    desc:"Arrose vite et loin. Touche aussi les guêpes.",
    branches:[
      { nom:"Super soaker", desc:"Un jet presque continu.", mods:{ cadence:.42, deg:.8 } },
      { nom:"Pistolet glacé", desc:"L'eau glacée ralentit fort et fait mal.", mods:{ deg:1.3 }, effets:{ lent:.45 } }
    ],
    dessine(t, tm){
      ov(0, 14, 17, 5, "rgba(0,0,0,.12)", 0, 0);
      bx(-13, -4, 26, 18, "#E7DCC6", t.g, 1);
      bande(-13, 2, 13, 2, 3, "#C9B79A", 0, 0);
      c.save(); c.translate(0, -10); c.rotate(t.ang); c.translate(-t.recul * 4, 0);
      c.scale(1, Math.cos(t.ang) < 0 ? -1 : 1);
      bx(-10, -6, 30, 11, "#F07B2E", t.g + 1, 1);
      bx(18, -3, 8, 5, "#F2B33B", t.g + 2, .5);
      ov(-4, -10, 8, 6, "#5FB8E8", t.g + 3, .6);
      bx(-6, 3, 7, 11, "#2F8F6B", t.g + 4, .6);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.ang); fo([7, 0, -3, -4, -6, 0, -3, 4], "#5FB8E8", p.g, .4); ov(-1, -1, 1.5, 1, "#fff", 0, 0); }
  },
  brume:{
    nom:"Brumisateur", prix:70, debloque:2, contre:["rapide"], genre:"zone", portee:72, cadence:1.2, deg:6, lent:.42, lentDuree:1.6, couleurZone:"rgba(200,235,255,.95)",
    desc:"Envoie un nuage de brume fraîche : tout le monde autour ralentit.",
    branches:[
      { nom:"Brume glacée", desc:"Gèle souvent sur place un instant.", effets:{ etourdit:.4 } },
      { nom:"Grand brumisateur", desc:"Un nuage bien plus large.", mods:{ portee:1.45, deg:1.2 } }
    ],
    dessine(t, tm){
      ov(0, 14, 15, 5, "rgba(0,0,0,.12)", 0, 0);
      const q = 1 + t.recul * .15;
      c.save(); c.scale(1 / q, q);
      bx(-9, -16, 18, 30, "#7FC8E8", t.g, 1.1);
      ov(0, -16, 9, 3, "#A6DBF1", t.g + 1, .4);
      bx(-4, -28, 8, 12, "#F4F1EA", t.g + 2, .7);
      bx(-1, -32, 12, 6, "#F4F1EA", t.g + 3, .5);
      bx(-6, -6, 12, 8, "#FFFFFF", t.g + 4, 0);
      c.restore();
      if (t.recul > .2){ c.globalAlpha = t.recul * .8; for (let i = 0; i < 4; i++) ov(14 + i * 6, -30 - i * 2, 5 + i * 2, 4 + i, "#EAF7FF", i, 0); c.globalAlpha = 1; }
    }
  },
  citronnelle:{
    nom:"Bougie citronnelle", prix:65, debloque:4, contre:["vole"], portee:105, cibles:"tout", couleurZone:"rgba(242,220,90,.5)",
    desc:"Son parfum chasse les guêpes très fort, et dérange un peu les autres.",
    branches:[
      { nom:"Encens géant", desc:"Parfum bien plus fort et plus large contre les guêpes.", mods:{ deg:1.7, portee:1.2 } },
      { nom:"Citronnelle épicée", desc:"Dérange aussi très fort les bestioles à pattes.", effets:{ sol:3 } }
    ],
    agit(J, t, dt){
      const air = 18 * mult(t, "deg"), sol = 3 * mult(t, "deg") * (1 + effet(t, "sol"));
      for (const e of dansPortee(t)) blesse(e, (e.vole ? air : sol) * dt, t, "continu");
    },
    dessine(t, tm){
      ov(0, 14, 15, 5, "rgba(0,0,0,.12)", 0, 0);
      fo([-14, -6, 14, -6, 10, 14, -10, 14], "#C9713E", t.g, 1.1);
      bx(-15, -9, 30, 6, "#D88550", t.g + 1, .5);
      bx(-8, -24, 16, 17, "#F4DC5A", t.g + 2, .7);
      bande(0, -24, 0, -29, 1.4, "#33261D", 0, 0);
      const f = Math.sin(tm * 18 + t.g) * 1.2;
      fo([0, -45 + f, 5, -33, 0, -28, -5, -33], "#F28B2C", t.g + 3, 0);
      fo([0, -39 + f, 2.5, -32, 0, -29, -2.5, -32], "#FFE27A", t.g + 4, 0);
      if (!t.icone){ c.globalAlpha = .35 + Math.sin(tm * 3) * .1; c.beginPath(); c.arc(0, -10, stat(t, "portee") * .25, 0, TAU); c.fillStyle = "rgba(242,220,90,.25)"; c.fill(); c.globalAlpha = 1; }
    }
  },
  ventilo:{
    nom:"Ventilateur", prix:85, debloque:8, contre:["vole"], portee:95, cadence:2.6, cibles:"tout",
    desc:"Un grand coup de vent : les guêpes sont renvoyées en arrière, les autres s'arrêtent net.",
    branches:[
      { nom:"Turbo-ventilo", desc:"Souffle deux fois plus souvent.", mods:{ cadence:.5 } },
      { nom:"Tornade", desc:"Fait reculer tout le monde d'une case en arrière.", effets:{ repousse:1 } }
    ],
    agit(J, t, dt){
      t.tourne = (t.tourne || 0) + dt * (6 + t.recul * 20);
      t.cd -= dt; if (t.cd > 0) return;
      const liste = dansPortee(t);
      if (!liste.length){ t.cd = .1; return; }
      for (const e of liste){
        if (e.vole){
          const a = Math.atan2(e.y - CENTRE_NAPPE.y, e.x - CENTRE_NAPPE.x), k = 60 * mult(t, "portee");
          e.x += Math.cos(a) * k; e.y += Math.sin(a) * k;
          ralentit(e, .5, 1);
        } else {
          ralentit(e, .08, .7 + t.niv * .25);
          if (effet(t, "repousse") && !e.d.boss) recule(J, e);
        }
        blesse(e, 4 * t.niv, t);
      }
      for (let i = 0; i < 6; i++) J.effets.push({ genre:"vent", x:t.x, y:t.y - 14, a:i / 6 * TAU, t:0, dur:.5, r:stat(t, "portee") });
      t.recul = 1; t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      ov(0, 14, 15, 5, "rgba(0,0,0,.12)", 0, 0);
      ov(0, 11, 13, 4, "#6E7D8C", t.g, .8);
      bande(0, 10, 0, -10, 4, "#8796A5", t.g, .6);
      ov(0, -20, 17, 17, "#DCE6EE", t.g + 1, 1);
      const a0 = t.tourne || tm * 6;
      for (let i = 0; i < 4; i++) feuille(0, -20, 14, 9, a0 + i * Math.PI / 2, i % 2 ? "#5FB8E8" : "#3E9FC9", t.g + i, .3);
      ov(0, -20, 4, 4, "#F2B33B", t.g + 5, .3);
      c.globalAlpha = .5; c.beginPath(); c.arc(0, -20, 16, 0, TAU); c.strokeStyle = "#8796A5"; c.lineWidth = 1.5; c.stroke(); c.globalAlpha = 1;
    }
  },
  bulles:{
    nom:"Pistolet à bulles", prix:60, genre:"tir", portee:115, cadence:2.4, deg:4, bulle:1.8, vitesseTir:240, cibles:"tout", bouche:16, hauteurTir:12, debloque:6, contre:["rapide", "soigne"],
    desc:"Enferme une bestiole dans une bulle : elle flotte, coincée, pendant 2 secondes.",
    branches:[
      { nom:"Bulles géantes", desc:"Emprisonne bien plus longtemps.", mods:{ bulle:1.7 } },
      { nom:"Mitraille de bulles", desc:"Trois bulles d'un coup.", effets:{ multi:2 } }
    ],
    surImpact(J, t, e){
      if (e.d.boss || e.d.inarretable){ ralentit(e, .6, 1); return; }
      e.bulleT = J.t + stat(t, "bulle"); ralentit(e, .02, stat(t, "bulle"));
    },
    dessine(t, tm){
      ov(0, 14, 15, 5, "rgba(0,0,0,.12)", 0, 0);
      bx(-12, -4, 24, 18, "#F28DB2", t.g, 1);
      c.save(); c.translate(0, -10); c.rotate(t.ang); c.translate(-t.recul * 3, 0);
      c.scale(1, Math.cos(t.ang) < 0 ? -1 : 1);
      bx(-8, -6, 22, 11, "#7A4E9E", t.g + 1, 1);
      ov(18, 0, 7, 7, "#BFE6FF", t.g + 2, .3);
      bx(-4, 3, 7, 10, "#F2B33B", t.g + 3, .5);
      c.restore();
      for (let i = 0; i < 3; i++){ const k = (tm * .6 + i / 3) % 1; c.globalAlpha = 1 - k; c.beginPath(); c.arc(-6 + i * 6, -24 - k * 30, 3 + i, 0, TAU); c.strokeStyle = "#BFE6FF"; c.lineWidth = 1.5; c.stroke(); }
      c.globalAlpha = 1;
    },
    dessineTir(p){ c.globalAlpha = .7; c.beginPath(); c.arc(0, 0, 8, 0, TAU); c.fillStyle = "rgba(190,230,255,.45)"; c.fill(); c.strokeStyle = "#FFFFFF"; c.lineWidth = 2; c.stroke(); c.globalAlpha = 1; ov(-3, -3, 2, 1.5, "#fff", 0, 0); }
  }
};

/* une bestiole renvoyée une case en arrière, sur une case libre */
function recule(J, e){
  const gx = borne(Math.floor(e.x / CASE), 0, NX - 1), gy = borne(Math.floor(e.y / CASE), 0, NY - 1);
  let best = null, bv = -1;
  for (const [dx, dy] of VOISINS){
    const nx = gx + dx, ny = gy + dy;
    if (nx < 0 || ny < 0 || nx >= NX || ny >= NY || J.bloque[idx(nx, ny)]) continue;
    const v = J.dist[idx(nx, ny)]; if (v !== Infinity && v > bv){ bv = v; best = [nx, ny]; }
  }
  if (!best) return;
  e.x = (best[0] + .5) * CASE; e.y = (best[1] + .5) * CASE; e.cx = best[0]; e.cy = best[1];
  confettis(e.x, e.y, "#FFFFFF", 4);
}

/* ── les bestioles ── */
function pattesFourmi(x, y, l, tm){
  for (let i = 0; i < 3; i++){ const a = Math.sin(tm * 18 + i * 2.1) * 3; bande(x - 4 + i * 4, y, x - 6 + i * 4 + a, y + l, 1.4, "#2B1D16", i, 0); }
}
const ENNEMIS = {
  fourmi:{
    nom:"Fourmi", nuee:true, pv:12, vit:48, prime:3, r:7, hautBarre:18, couleur:"#5A3A2A",
    dessine(e, tm){
      pattesFourmi(0, -4, 5, e.anim);
      ov(-7, -6, 5.5, 4.5, "#5A3A2A", e.g, .6); ov(0, -6, 3.5, 3, "#4A2E20", e.g + 1, .3); ov(6, -7, 4.5, 4, "#5A3A2A", e.g + 2, .5);
      bande(7, -10, 11, -15, 1, "#2B1D16", 0, 0);
      yeux(7, -8, 1.6, 1.4, 1, 0, e.g, e.content);
      if (e.miette) ov(10, -12, 3, 2.5, "#F2D59A", 1, .3);
    }
  },
  souris:{
    nom:"Souris", pv:38, vit:92, prime:5, r:11, hautBarre:24, couleur:"#A9A4A0",
    dessine(e, tm){
      const b = Math.abs(Math.sin(e.anim * 16)) * 1.5;
      c.beginPath(); c.moveTo(-12, -5); c.quadraticCurveTo(-24, -6 + Math.sin(e.anim * 9) * 5, -28, -14);
      c.strokeStyle = "#E3A3A6"; c.lineWidth = 1.8; c.stroke();
      ov(-1, -7 - b, 13, 8, "#A9A4A0", e.g, 1);
      ov(10, -9 - b, 7, 6, "#B8B3AF", e.g + 1, .6);
      ov(6, -15 - b, 4.5, 5, "#B8B3AF", e.g + 2, .4); ov(6, -15 - b, 2.5, 3, "#F2B5B8", 0, 0);
      ov(16.5, -9 - b, 2, 2, "#E37C83", 0, 0);
      yeux(11, -11 - b, 1.8, 1.7, 1, 0, e.g, e.content);
    }
  },
  scarabee:{
    nom:"Scarabée", pv:135, vit:28, prime:14, armure:4, r:13, hautBarre:30, couleur:"#2E6B6A",
    dessine(e, tm){
      pattesFourmi(-2, -4, 6, e.anim); pattesFourmi(6, -4, 6, e.anim + 1);
      ov(-2, -10, 15, 11, "#2E6B6A", e.g, 1.2);
      bande(-2, -20, -2, 0, 1.5, "#1E4A4A", 0, 0);
      ov(-7, -14, 5, 3, "rgba(170,240,220,.45)", 0, 0);
      ov(13, -9, 6, 5.5, "#24504F", e.g + 1, .5);
      bande(16, -12, 22, -18, 2.4, "#24504F", 0, 0);
      yeux(14, -10, 2, 1.6, 1, 0, e.g, e.content);
    }
  },
  guepe:{
    nom:"Guêpe", pv:26, vit:58, prime:7, r:10, hautBarre:44, vole:true, couleur:"#F2C230", hautCible:26,
    dessine(e, tm){
      c.translate(0, -24 + Math.sin(e.anim * 5) * 3);
      ov(0, 10, 9, 3, "rgba(0,0,0,.1)", 0, 0);
      const a = Math.abs(Math.sin(e.anim * 30));
      c.globalAlpha *= .75; ov(-1, -9 - a * 3, 6, 8 * (.4 + a * .6), "#EAF6FF", e.g, .3); ov(4, -8 - a * 2, 5, 7 * (.4 + a * .6), "#F4FBFF", e.g + 1, .3); c.globalAlpha /= .75;
      ov(-4, 0, 9, 6.5, "#F2C230", e.g + 2, .8);
      bande(-7, -6, -7, 6, 2.5, "#2B211B", 0, 0); bande(-2, -6.5, -2, 6.5, 2.5, "#2B211B", 0, 0);
      fo([-12, -1, -17, 0, -12, 2], "#2B211B", 0, 0);
      ov(7, -1, 5.5, 5, "#F2C230", e.g + 3, .4);
      yeux(8, -2, 1.8, 1.7, 1, 0, e.g, e.content);
    }
  },
  infirmiere:{
    nom:"Fourmi infirmière", soigne:true, pv:34, vit:44, prime:9, r:9, hautBarre:22, couleur:"#E8E1D6",
    /* elle soigne ses copines autour d'elle : à repousser en premier ! */
    agit(J, e, dt){
      e.soin = (e.soin ?? 1.5) - dt;
      if (e.soin > 0) return;
      e.soin = 2.2;
      let n = 0;
      for (const x of J.ennemis) if (x !== e && !x.mort && x.pv < x.pvMax && dist(x.x, x.y, e.x, e.y) < 80){ x.pv = Math.min(x.pvMax, x.pv + x.pvMax * .18); n++; }
      if (n){ onde(e.x, e.y - 6, 80, "rgba(120,220,140,.9)", .5); texte("+", e.x, e.y - 24, "#7BE08A", 18); }
    },
    dessine(e, tm){
      pattesFourmi(0, -4, 5, e.anim);
      ov(-7, -6, 6, 5, "#5A3A2A", e.g, .6); ov(0, -6, 3.5, 3, "#4A2E20", e.g + 1, .3); ov(6, -7, 5, 4.5, "#5A3A2A", e.g + 2, .5);
      bx(2, -15, 9, 5, "#FFFFFF", e.g + 3, .3);
      bande(6.5, -14.5, 6.5, -10.5, 1.4, "#E0533D", 0, 0); bande(4.5, -12.5, 8.5, -12.5, 1.4, "#E0533D", 0, 0);
      yeux(7, -8, 1.6, 1.4, 1, 0, e.g, e.content);
    }
  },
  reine:{
    nom:"Reine des fourmis", pv:1300, vit:19, prime:120, degats:4, r:24, hautBarre:50, boss:true, couleur:"#7A4A30",
    enerve(J, e){ for (let i = 0; i < 6; i++) creeEnnemi(i % 3 ? "fourmi" : "infirmiere", { cx:e.cx, cy:e.cy }, e.x + alea(-10, 10), e.y + alea(-10, 10)); },
    agit(J, e, dt){
      e.ponte = (e.ponte ?? 3) - dt;
      if (e.ponte <= 0){
        e.ponte = 4.5;
        for (let i = 0; i < 2; i++){ const f = creeEnnemi("fourmi", { cx:e.cx, cy:e.cy }, e.x + alea(-8, 8), e.y + alea(-8, 8)); f.pv = f.pvMax = 18; }
      }
    },
    dessine(e, tm){
      for (let i = 0; i < 3; i++){ const a = Math.sin(e.anim * 10 + i * 2.1) * 4; bande(-6 + i * 8, -6, -9 + i * 8 + a, 4, 2.6, "#2B1D16", i, 0); }
      ov(-18, -14, 16, 12, "#7A4A30", e.g, 1.4); ov(-21, -18, 6, 4, "rgba(255,255,255,.2)", 0, 0);
      ov(0, -14, 8, 7, "#6A3E26", e.g + 1, .8); ov(14, -17, 10, 9, "#7A4A30", e.g + 2, 1);
      fo([6, -26, 9, -36, 13, -29, 16, -38, 19, -29, 23, -36, 23, -25], "#F2B33B", e.g + 3, .6);
      ov(16, -33, 1.8, 1.8, "#E0533D", 0, 0);
      yeux(17, -18, 3.4, 2.6, 1, 0, e.g, e.content);
      sourire(18, -11, 3);
    }
  }
};

/* ═══ les renforts du goûter : ils se débloquent au fil des 30 vagues ═══ */
function socleColo(t){ ov(0, 14, 16, 5, "rgba(0,0,0,.12)", 0, 0); }
Object.assign(TOURS, {
  miel:{
    nom:"Pot de miel", prix:45, debloque:7, contre:["rapide", "mur"], genre:"aura", portee:62, lent:.35,
    desc:"Bloque une case comme un sac… et englue tout ce qui passe juste à côté.",
    branches:[
      { nom:"Miel épais", desc:"Englue beaucoup plus fort.", mods:{ lent:1.6 } },
      { nom:"Miel de ronces", desc:"Englue et pique ce qui passe.", effets:{ pique:7 } }
    ],
    dessine(t, tm){
      socleColo(t);
      ov(0, 0, 15, 14, "#F2B33B", t.g, 1.1);
      bx(-13, -18, 26, 7, "#F4F1EA", t.g + 1, .5); bande(-13, -14, 13, -14, 2, "#E0533D", 0, 0);
      fo([-6, -6, 0, 6, 4, -4], "#E89A1E", t.g + 2, 0);
      if (!t.icone){ c.globalAlpha = .25; c.beginPath(); c.arc(0, 6, stat(t, "portee") * .7, 0, TAU); c.fillStyle = "#F2B33B"; c.fill(); c.globalAlpha = 1; }
    }
  },
  fronde:{
    nom:"Fronde à guimauves", prix:120, debloque:9, contre:["armure"], genre:"tir", percant:true, cibles:"tout", portee:145, cadence:1.3, deg:32, vitesseTir:380, couleurTir:"#FBE3EC", bouche:14, hauteurTir:14,
    desc:"Une grosse guimauve lancée fort : elle passe à travers les carapaces des scarabées.",
    branches:[
      { nom:"Guimauve géante", desc:"Frappe bien plus fort et assomme parfois.", mods:{ deg:1.6 }, effets:{ etourdit:.3 } },
      { nom:"Double fronde", desc:"Deux guimauves sur deux cibles.", effets:{ multi:1 } }
    ],
    dessine(t, tm){
      socleColo(t);
      bande(0, 12, 0, -10, 4, "#8E6440", t.g, .8);
      bande(0, -10, -10, -26, 3.5, "#8E6440", t.g + 1, .6); bande(0, -10, 10, -26, 3.5, "#8E6440", t.g + 2, .6);
      const tire = 1 - t.recul;
      c.beginPath(); c.moveTo(-10, -26); c.quadraticCurveTo(0, -14 + tire * 8, 10, -26); c.strokeStyle = "#E0533D"; c.lineWidth = 2; c.stroke();
      if (tire > .5) ov(0, -18 + tire * 6, 6, 5, "#FBE3EC", t.g + 3, .3);
    },
    dessineTir(p){ c.rotate(p.age * 6); bx(-6, -5, 12, 10, "#FBE3EC", p.g, .5); }
  },
  confettis:{
    nom:"Canon à confettis", prix:190, debloque:11, contre:["nuee"], genre:"tir", tir:"lob", cibles:"sol", portee:165, cadence:2.2, deg:28, splash:70, vitesseTir:260, couleurTir:"#F28DB2", hauteurTir:16,
    desc:"Une explosion de confettis qui disperse toute une colonne de fourmis d'un coup.",
    branches:[
      { nom:"Confettis géants", desc:"Une explosion bien plus large.", mods:{ splash:1.4, deg:1.15 } },
      { nom:"Serpentins", desc:"Les serpentins emmêlent et ralentissent.", effets:{ lent:.4 } }
    ],
    dessine(t, tm){
      socleColo(t);
      ov(-8, 8, 6, 6, "#8E6440", t.g, .5); ov(8, 8, 6, 6, "#8E6440", t.g + 1, .5);
      c.save(); c.translate(0, -2); c.rotate(-.5 - t.recul * .3);
      bx(-6, -26, 12, 26, "#7A4E9E", t.g + 2, 1); bande(-6, -18, 6, -18, 3, "#F2B33B", 0, 0); bande(-6, -8, 6, -8, 3, "#F2B33B", 0, 0);
      c.restore();
    },
    dessineTir(p){ for (let i = 0; i < 4; i++) bx(-5 + (i % 2) * 6, -5 + (i >> 1) * 6, 4, 4, ["#F28DB2", "#F2B33B", "#5FB8E8", "#7BE08A"][i], p.g + i, 0); }
  },
  lampe:{
    nom:"Lampe torche", prix:110, debloque:13, contre:["invisible"], detecte:true, genre:"aura", portee:150, lent:.15,
    desc:"Sa lumière révèle les souris masquées qui se faufilent dans le noir, et éblouit un peu.",
    branches:[
      { nom:"Projecteur", desc:"Éclaire beaucoup plus loin.", mods:{ portee:1.4 } },
      { nom:"Lampe stroboscope", desc:"Éblouit fort et pique les yeux.", mods:{ lent:2.5 }, effets:{ pique:5 } }
    ],
    dessine(t, tm){
      socleColo(t);
      bx(-5, -4, 10, 18, "#3E3A36", t.g, 1);
      fo([-9, -20, 9, -20, 5, -4, -5, -4], "#E0533D", t.g + 1, .8);
      ov(0, -20, 9, 3, "#FFF3B0", t.g + 2, 0);
      if (!t.icone){ c.globalAlpha = .18 + Math.sin(tm * 3) * .05; fo([-9, -20, 9, -20, 30, -80, -30, -80], "#FFF3B0", 0, 0); c.globalAlpha = 1; }
    }
  },
  arroseur:{
    nom:"Arroseur tournant", prix:230, debloque:15, contre:["bouclier", "nuee"], portee:105, cadence:.3, deg:6, cibles:"tout",
    desc:"Il tourne et arrose tout autour, très vite : chaque goutte compte comme un coup, parfait contre les boucliers.",
    branches:[
      { nom:"Arroseur turbo", desc:"Tourne presque deux fois plus vite.", mods:{ cadence:.55 } },
      { nom:"Grand arroseur", desc:"Arrose plus loin et plus fort.", mods:{ portee:1.35, deg:1.3 } }
    ],
    agit(J, t, dt){
      t.tourne = (t.tourne || 0) + dt * 5;
      t.cd -= dt; if (t.cd > 0) return;
      const liste = dansPortee(t).slice(0, 5);
      if (!liste.length){ t.cd = .1; return; }
      for (const e of liste){ frappe(t, e, stat(t, "deg"), effetsDe(t), true); J.effets.push({ genre:"rayon", x:t.x, y:t.y - 22, x2:e.x, y2:e.y - 6, t:0, dur:.08, coul:"#9FD8F2" }); }
      t.recul = 1; t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      socleColo(t);
      bande(0, 12, 0, -16, 4, "#6E7D8C", t.g, .8);
      const a = t.tourne || tm * 5;
      c.save(); c.translate(0, -18); c.rotate(a);
      bande(-16, 0, 16, 0, 3.5, "#3E9FC9", t.g + 1, .5); ov(-16, 0, 3, 3, "#5FB8E8", 0, 0); ov(16, 0, 3, 3, "#5FB8E8", 0, 0);
      c.restore();
      ov(0, -18, 4, 4, "#F2B33B", t.g + 2, .3);
    }
  },
  cerfvolant:{
    nom:"Cerf-volant", prix:300, debloque:18, contre:["vole", "armure"], genre:"tir", cibles:"air", percant:true, portee:230, cadence:1.1, deg:50, vitesseTir:460, couleurTir:"#E0533D", bouche:4, hauteurTir:50,
    desc:"Il monte très haut et fonce sur les volants, même les frelons à carapace. Ne touche pas le sol.",
    branches:[
      { nom:"Cerf-volant dragon", desc:"Frappe bien plus fort.", mods:{ deg:1.6 } },
      { nom:"Cerfs-volants jumeaux", desc:"Deux cibles à la fois.", effets:{ multi:1 } }
    ],
    dessine(t, tm){
      socleColo(t);
      bx(-6, -2, 12, 14, "#8E6440", t.g, .8);
      const h = Math.sin(tm * 1.5 + t.g) * 4;
      c.beginPath(); c.moveTo(0, -2); c.quadraticCurveTo(10, -30, 4, -52 + h); c.strokeStyle = "rgba(51,38,29,.6)"; c.lineWidth = 1; c.stroke();
      fo([4, -70 + h, 16, -54 + h, 4, -40 + h, -8, -54 + h], "#E0533D", t.g + 1, .8);
      bande(4, -70 + h, 4, -40 + h, 1.2, "#F2B33B", 0, 0); bande(-8, -54 + h, 16, -54 + h, 1.2, "#F2B33B", 0, 0);
      for (let i = 0; i < 3; i++) bx(2 + Math.sin(tm * 4 + i) * 3, -38 + h + i * 6, 4, 3, i % 2 ? "#5FB8E8" : "#F2B33B", i, 0);
    },
    dessineTir(p){ c.rotate(p.ang); fo([8, 0, -4, -5, -2, 0, -4, 5], "#E0533D", p.g, .3); }
  },
  glaciere:{
    nom:"Glacière", prix:360, debloque:21, contre:["rapide", "boss"], portee:115, cadence:6.5, deg:40, cibles:"tout",
    desc:"Un grand souffle glacé : tout ce qui est autour gèle sur place deux secondes. Les géants ralentissent beaucoup.",
    branches:[
      { nom:"Grand froid", desc:"Gèle beaucoup plus loin.", mods:{ portee:1.35 } },
      { nom:"Pluie de glaçons", desc:"Souffle plus souvent et fait plus mal.", mods:{ cadence:.7, deg:2.2 } }
    ],
    agit(J, t, dt){
      t.cd -= dt; if (t.cd > 0) return;
      const liste = dansPortee(t);
      if (!liste.length){ t.cd = .2; return; }
      for (const e of liste){
        frappe(t, e, stat(t, "deg"), null, true);
        if (e.d.boss || e.geant) ralentit(e, .4, 2.5); else ralentit(e, .02, 2);
      }
      onde(t.x, t.y - 10, stat(t, "portee"), "rgba(190,235,255,.95)", .6);
      confettis(t.x, t.y - 10, ["#DFF4FF", "#FFFFFF"], 14);
      t.recul = 1; t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      socleColo(t);
      bx(-16, -16, 32, 28, "#3E9FC9", t.g, 1.1);
      bx(-17, -22, 34, 9, "#FFFFFF", t.g + 1, .6);
      bx(-6, -26, 12, 5, "#E7DCC6", t.g + 2, .3);
      for (let i = 0; i < 3; i++) etoile5(-8 + i * 8, -2, 3.5, 1.4, "#DFF4FF", i, 0, 0);
      if (t.recul > .2){ c.globalAlpha = t.recul * .6; ov(0, -30, 18, 10, "#DFF4FF", 1, 0); c.globalAlpha = 1; }
    }
  }
});

Object.assign(ENNEMIS, {
  masquee:{
    nom:"Souris masquée", pv:50, vit:62, prime:11, r:11, hautBarre:24, furtif:true, couleur:"#5E5A57",
    dessine(e, tm){
      if (e.cache) c.globalAlpha *= .22;
      const b = Math.abs(Math.sin(e.anim * 16)) * 1.5;
      c.beginPath(); c.moveTo(-12, -5); c.quadraticCurveTo(-24, -6 + Math.sin(e.anim * 9) * 5, -28, -14);
      c.strokeStyle = "#8A8480"; c.lineWidth = 1.8; c.stroke();
      ov(-1, -7 - b, 13, 8, "#5E5A57", e.g, e.cache ? 0 : 1);
      ov(10, -9 - b, 7, 6, "#6E6A67", e.g + 1, 0);
      ov(6, -15 - b, 4.5, 5, "#6E6A67", e.g + 2, 0);
      bx(6, -13 - b, 11, 4, "#2B211B", e.g + 3, 0);
      ov(11, -11 - b, 1.3, 1.3, "#FFFFFF", 0, 0); ov(14.5, -11 - b, 1.3, 1.3, "#FFFFFF", 0, 0); marqueTete(11, -15 - b, .8);
      bande(-10, -8 - b, -16, -4 - b, 1.5, "#2B211B", 0, 0);
      if (e.cache) c.globalAlpha = 1;
    }
  },
  cafard:{
    nom:"Cafard costaud", pv:70, vit:60, prime:12, r:12, hautBarre:26, bouclier:6, couleur:"#6B3E22",
    dessine(e, tm){
      pattesFourmi(-2, -4, 6, e.anim); pattesFourmi(6, -4, 6, e.anim + 1);
      ov(-2, -9, 15, 8, "#6B3E22", e.g, 1);
      ov(-6, -12, 5, 2.5, "rgba(255,255,255,.25)", 0, 0);
      ov(13, -8, 5, 4.5, "#4E2C16", e.g + 1, .4);
      bande(16, -10, 26, -18, 1, "#2B1D16", 0, 0); bande(16, -9, 27, -12, 1, "#2B1D16", 0, 0);
      yeux(14, -9, 1.8, 1.5, 1, 0, e.g, e.content);
    }
  },
  frelon:{
    nom:"Frelon", pv:110, vit:48, prime:16, r:13, hautBarre:48, vole:true, armure:6, couleur:"#C9772A", hautCible:28,
    dessine(e, tm){
      c.translate(0, -26 + Math.sin(e.anim * 5) * 3);
      const a = Math.abs(Math.sin(e.anim * 30));
      c.globalAlpha *= .75; ov(-2, -11 - a * 3, 8, 10 * (.4 + a * .6), "#EAF6FF", e.g, .3); ov(4, -10 - a * 2, 7, 9 * (.4 + a * .6), "#F4FBFF", e.g + 1, .3); c.globalAlpha /= .75;
      ov(-5, 0, 12, 8, "#E0A030", e.g + 2, 1);
      bande(-9, -7, -9, 7, 3, "#5A2E12", 0, 0); bande(-3, -8, -3, 8, 3, "#5A2E12", 0, 0);
      fo([-16, -1, -22, 0, -16, 2], "#2B211B", 0, 0);
      ov(9, -1, 7, 6, "#C9772A", e.g + 3, .5);
      yeux(10, -3, 2.2, 2, 1, 0, e.g, e.content);
    }
  }
});

ajouteMonde({
  id:"gouter", nom:"Le Goûter",
  mecanique:"Construire le labyrinthe",
  accroche:"Pas de chemin : c'est toi qui le dessines avec tes objets. Fais-les tourner en rond !",
  histoire:"Le goûter est servi sur la grande nappe… et les fourmis l'ont senti ! Elles arrivent par les bords et foncent au plus court. Pose les objets de la colo pour leur barrer la route.",
  regles:[
    "Il n'y a <b>pas de chemin tracé</b> : les fourmis, souris et scarabées vont toujours au plus court vers la nappe.",
    "Chaque objet posé <b>bloque une case</b>. Construis un labyrinthe pour les faire marcher longtemps devant tes défenseurs !",
    "Tu ne peux <b>jamais fermer complètement</b> le passage : le jeu te prévient.",
    "Les petits points montrent le chemin que prendront les bestioles.",
    "Les <b>guêpes volent tout droit</b> par-dessus tes murs : la bougie citronnelle et le ventilateur sont faits pour elles.",
    "Les <b>fourmis infirmières</b> soignent leurs copines : repousse-les en premier !",
    "Attention, de nouvelles entrées s'ouvrent au fil des vagues !"
  ],
  pouvoirs:[
    { id:"leurre", nom:"Bonbon leurre", recharge:32, cible:true, rayon:130,
      desc:"Lance un gros bonbon : toutes les bestioles à pattes autour s'arrêtent pour le grignoter.",
      icone(u){ fo([u*.1, u*.32, u*.3, u*.5, u*.1, u*.68], "#F2B33B", 1, .5); fo([u*.9, u*.32, u*.7, u*.5, u*.9, u*.68], "#F2B33B", 2, .5); ov(u*.5, u*.5, u*.25, u*.22, "#E0533D", 3, 1); bande(u*.4, u*.38, u*.48, u*.62, 2, "#FFFFFF", 0, 0); },
      lance(J, p){
        J.leurres.push({ x:p.x, y:p.y, fin:J.t + 4 });
        for (const e of J.ennemis) if (!e.vole && !e.d.boss && dist(p.x, p.y, e.x, e.y) < 130) ralentit(e, .02, 4);
        confettis(p.x, p.y, ["#E0533D", "#F2B33B"], 14);
      } },
    { id:"torchon", nom:"Coup de torchon", recharge:40,
      desc:"Un grand coup de torchon autour de la nappe : les guêpes sont chassées loin, les autres sont sonnées.",
      icone(u){ bx(u*.18, u*.2, u*.64, u*.56, "#FFFFFF", 1, 1); for (let i = 0; i < 3; i++) bande(u*.18, u*(.3 + i*.17), u*.82, u*(.3 + i*.17), 2.5, "#E15B4F", i, 0); },
      lance(J){
        for (const e of J.ennemis){
          const d = dist(e.x, e.y, CENTRE_NAPPE.x, CENTRE_NAPPE.y);
          if (e.vole){ const a = Math.atan2(e.y - CENTRE_NAPPE.y, e.x - CENTRE_NAPPE.x); e.x += Math.cos(a) * 170; e.y += Math.sin(a) * 170; blesse(e, 25, null); }
          else if (d < 300){ ralentit(e, .02, 2); blesse(e, 15, null); }
        }
        for (let i = 0; i < 10; i++) J.effets.push({ genre:"vent", x:CENTRE_NAPPE.x, y:CENTRE_NAPPE.y, a:i / 10 * TAU, t:0, dur:.6, r:300 });
        secousse = .3;
      } }
  ],
  conseil:"Les sacs à dos ne coûtent presque rien : un long labyrinthe vaut mieux que beaucoup de défenseurs.",
  astuce:"<b>Astuce :</b> les sacs à dos ne coûtent que 8 bonbons. Fais un grand zigzag !",
  texteVictoire:"Le goûter est sauvé !", texteDefaite:"Il ne reste plus une miette…",
  nomVies:"Goûters", nomMonnaie:"Bonbons", texteVente:"Ranger",
  vies:12, argent:160, croissance:.07, attente:16, durGrand:1.15, primeVague:(J) => 10 + J.vague * 4,
  couleurMonnaie:"#FFB8D0", couleurFond:"#9CCB6A",
  apercu:{ tours:[["sac", 6.5 * CASE, 4.6 * CASE], ["sac", 7.5 * CASE, 4.6 * CASE], ["pistolet", 8.5 * CASE, 4.6 * CASE], ["ventilo", 12.5 * CASE, 7.6 * CASE]],
           ennemis:[["fourmi", 4.5 * CASE, 2.6 * CASE, 1], ["fourmi", 3.4 * CASE, 2.7 * CASE, 1], ["souris", 8 * CASE, 9.6 * CASE, 1], ["guepe", 12 * CASE, 3.6 * CASE, 1]] },
  tours:TOURS, ennemis:ENNEMIS,
  programme:{ budget:60, boss:"reine", bossPv:.75, ennemis:{
    fourmi:{ des:1, menace:3 }, souris:{ des:3, menace:9 }, guepe:{ des:5, menace:9 }, infirmiere:{ des:8, menace:12 },
    scarabee:{ des:10, menace:24 }, masquee:{ des:15, menace:14 }, cafard:{ des:17, menace:17 }, frelon:{ des:20, menace:25 }
  } },
  entreeGroupe:(v, x) => Math.floor(x * ENTREES_OUVERTES(v - 1)),

  iconeVie(u){ ov(u*.5, u*.55, u*.36, u*.3, "#E8B36A", 1, 1); for (let i = 0; i < 5; i++) ov(u*(.32 + i*.09), u*(.47 + (i%2)*.12), u*.04, u*.04, "#5A3A2A", i, 0); },
  iconeMonnaie(u){ fo([u*.12, u*.35, u*.3, u*.5, u*.12, u*.65], "#F28DB2", 1, .5); fo([u*.88, u*.35, u*.7, u*.5, u*.88, u*.65], "#F28DB2", 2, .5); ov(u*.5, u*.5, u*.24, u*.2, "#F25C8E", 3, 1); bande(u*.4, u*.4, u*.45, u*.6, 1.5, "#FFFFFF", 0, 0); },

  cartes:CARTES, charge, mursBot:() => CARTE.murs,
  init(J){
    if (J.carte !== undefined) charge(J.carte);
    J.bloque = new Uint8Array(NX * NY);
    for (const k of FIXES.keys()){ const [x, y] = k.split(",").map(Number); J.bloque[idx(x, y)] = 1; }
    J.occ = {}; J.leurres = [];
    recalcule(J);
  },
  maj(J, dt){
    J.essaiT = (J.essaiT || 0) + dt; if (J.essaiT > .4){ J.essaiT = 0; J.essai = null; }
    J.leurres = J.leurres.filter(l => l.fin > J.t);
  },
  dessineDessus(J){
    for (const l of J.leurres){
      const s = 1 + Math.sin(J.t * 6) * .05;
      c.save(); c.translate(l.x, l.y); c.scale(s, s);
      fo([-30, -10, -16, 0, -30, 10], "#F2B33B", 1, .6); fo([30, -10, 16, 0, 30, 10], "#F2B33B", 2, .6);
      ov(0, 0, 18, 15, "#E0533D", 3, 1.2); bande(-8, -8, 4, 10, 4, "#FFFFFF", 0, 0);
      c.restore();
    }
  },
  debutVague(J){
    const avant = ENTREES_OUVERTES(J.vague - 2), apres = ENTREES_OUVERTES(J.vague - 1);
    if (apres > avant) setTimeout(() => banniere("Elles arrivent aussi par le " + ENTREES[apres - 1].nom + " !", true, 2600), 1900);
  },
  emplacement(J, x, y){
    const gx = Math.floor(x / CASE), gy = Math.floor(y / CASE);
    if (gx < 0 || gy < 0 || gx >= NX || gy >= NY) return null;
    const cle = gx + "," + gy, k = idx(gx, gy);
    const res = { x:(gx + .5) * CASE, y:(gy + .5) * CASE + 4, cle, ok:false, raison:null };
    if (NAPPE(gx, gy)){ res.raison = "Pas sur la nappe !"; return res; }
    if (PONTS.has(cle)){ res.raison = "Pas sur le pont !"; return res; }
    if (J.bloque[k]){ res.raison = "C'est occupé"; return res; }
    if (ENTREES.some(e => e.gx === gx && e.gy === gy)){ res.raison = "Laisse l'entrée libre"; return res; }
    for (const e of J.ennemis) if (!e.vole && ((e.cx === gx && e.cy === gy) || (Math.floor(e.x / CASE) === gx && Math.floor(e.y / CASE) === gy))){ res.raison = "Une bestiole est là"; return res; }
    /* le passage doit rester ouvert */
    if (J.essai !== cle){
      J.bloque[k] = 1; const d = champ(J.bloque); J.bloque[k] = 0;
      let ouvert = ENTREES.every(e => d[idx(e.gx, e.gy)] < Infinity);
      for (const e of J.ennemis) if (ouvert && !e.vole && e.cx !== undefined && d[idx(e.cx, e.cy)] === Infinity) ouvert = false;
      J.essai = cle; J.essaiOk = ouvert;
    }
    if (!J.essaiOk){ res.raison = "Il faut laisser un passage !"; return res; }
    res.ok = true; return res;
  },
  dessineCase(J, emp){
    const [gx, gy] = emp.cle.split(",").map(Number);
    c.globalAlpha = .55; bx(gx * CASE + 2, gy * CASE + 2, CASE - 4, CASE - 4, emp.ok ? "#FFF6DA" : "#E0533D", 1, 0); c.globalAlpha = 1;
  },
  pose(J, t){
    const [gx, gy] = t.cle.split(",").map(Number);
    J.bloque[idx(gx, gy)] = 1; J.occ[t.cle] = t; J.essai = null; recalcule(J);
  },
  retire(J, t){
    const [gx, gy] = t.cle.split(",").map(Number);
    J.bloque[idx(gx, gy)] = 0; delete J.occ[t.cle]; J.essai = null; recalcule(J);
  },
  infoTour(J, t){
    if (t.type === "sac") return "Un simple obstacle.";
    if (t.type === "citronnelle") return `Contre les guêpes : <b>${Math.round(18 * mult(t, "deg"))}</b> par seconde.`;
    if (t.type === "ventilo") return `Souffle toutes les ${(stat(t, "cadence")).toFixed(1)} s.`;
    return `Force <b>${Math.round(stat(t, "deg"))}</b> · portée <b>${Math.round(stat(t, "portee"))}</b>`;
  },

  apparait(J, e, entree, x, y){
    if (entree && typeof entree === "object"){ e.x = x; e.y = y; e.cx = entree.cx; e.cy = entree.cy; return; }
    const n = ENTREES_OUVERTES(J.vague - 1);
    const E = ENTREES[entree ?? Math.floor(Math.random() * n)];
    e.x = E.sx + alea(-6, 6); e.y = E.sy + alea(-6, 6);
    e.cx = E.gx; e.cy = E.gy;
    e.ph = Math.random() * TAU;
  },
  deplace(J, e, dt){
    if (e.vole){
      const dx = CENTRE_NAPPE.x - e.x, dy = CENTRE_NAPPE.y - e.y, l = Math.hypot(dx, dy);
      const v = vitesse(e) * dt;
      e.ph += dt * 3;
      e.x += dx / l * v - dy / l * Math.sin(e.ph) * 18 * dt;
      e.y += dy / l * v + dx / l * Math.sin(e.ph) * 18 * dt;
      e.prog = -l / CASE;
      return l < 40;
    }
    let reste = vitesse(e) * dt, d = 0;
    for (let n = 0; n < 4 && reste > 0; n++){
      const tx = (e.cx + .5) * CASE, ty = (e.cy + .5) * CASE;
      d = dist(e.x, e.y, tx, ty);
      if (d > reste){ e.x += (tx - e.x) / d * reste; e.y += (ty - e.y) / d * reste; d -= reste; reste = 0; break; }
      e.x = tx; e.y = ty; reste -= d; d = 0;
      if (NAPPE(e.cx, e.cy)) return true;
      const ici = J.dist[idx(e.cx, e.cy)];
      let best = null, bv = ici;
      VOISINS.forEach(([dx, dy], i) => {
        const nx = e.cx + dx, ny = e.cy + dy;
        if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) return;
        const v = J.dist[idx(nx, ny)] + hache(e.g + i + e.cx * 3 + e.cy * 7) * .01;
        if (v < bv){ bv = v; best = [nx, ny]; }
      });
      if (!best) break;
      e.cx = best[0]; e.cy = best[1];
    }
    e.prog = -(J.dist[idx(e.cx, e.cy)] + d / CASE);
    return false;
  },
  perdVie(J, e){ confettis(CENTRE_NAPPE.x, CENTRE_NAPPE.y, ["#E8B36A", "#F28DB2", "#FFFFFF"], 12); },

  fond(J){
    c.fillStyle = "#9CCB6A"; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 50; i++) ov(hache(i + 3) * W, hache(i + 70) * H, 26 + hache(i + 5) * 46, 14 + hache(i + 8) * 20, i % 3 ? "#93C462" : "#A8D477", i, 0);
    /* un quadrillage très discret, pour lire les cases */
    c.strokeStyle = "rgba(255,255,255,.10)"; c.lineWidth = 1;
    for (let x = 1; x < NX; x++){ c.beginPath(); c.moveTo(x * CASE, 0); c.lineTo(x * CASE, H); c.stroke(); }
    for (let y = 1; y < NY; y++){ c.beginPath(); c.moveTo(0, y * CASE); c.lineTo(W, y * CASE); c.stroke(); }
    /* le ruisseau et ses ponts */
    for (const [k, genre] of CARTE.fixes){
      if (genre !== "eau" && genre !== "pont") continue;
      const [gx, gy] = k.split(",").map(Number), X = gx * CASE, Y = gy * CASE;
      bx(X - 6, Y - 1, CASE + 12, CASE + 2, "#4FA9C9", gy, 0);
      c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2; c.lineCap = "round";
      c.beginPath(); c.moveTo(X + 6, Y + 16); c.quadraticCurveTo(X + 16, Y + 10, X + 26, Y + 16); c.moveTo(X + 20, Y + 34); c.quadraticCurveTo(X + 30, Y + 28, X + 40, Y + 34); c.stroke();
      if (genre === "pont"){
        bx(X - 10, Y + 4, CASE + 20, CASE - 8, "#B98A55", gy + 5, 1.2);
        for (let i = 0; i < 6; i++) bande(X - 6 + i * 11, Y + 6, X - 6 + i * 11, Y + CASE - 6, 1.5, "#8E6440", i, 0);
        bande(X - 10, Y + 5, X + CASE + 10, Y + 5, 3, "#8E6440", 1, .3); bande(X - 10, Y + CASE - 5, X + CASE + 10, Y + CASE - 5, 3, "#8E6440", 2, .3);
      }
    }
    /* la nappe à carreaux */
    const NX0 = CARTE.nappe.x * CASE, NY0 = CARTE.nappe.y * CASE;
    bx(NX0 - 6, NY0 - 6, 4 * CASE + 12, 4 * CASE + 12, "#FFFFFF", 91, 1.6);
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) if ((x + y) % 2 === 0) bx(NX0 - 6 + x * 25.5, NY0 - 6 + y * 25.5, 25.5, 25.5, "#E15B4F", x * 8 + y, 0);
    /* les entrées : des trous dans la haie */
    for (let y = 0; y < H; y += 24){
      if (!ENTREES.some(e => e.sx < 0 && Math.abs(y + 12 - e.sy) < 30)) ov(4, y + 12, 13, 14, y % 48 ? "#5E9E45" : "#6AAE50", y, 1);
      if (!ENTREES.some(e => e.sx > W && Math.abs(y + 12 - e.sy) < 30)) ov(W - 4, y + 12, 13, 14, y % 48 ? "#5E9E45" : "#6AAE50", y + 2, 1);
    }
    for (let x = 0; x < W; x += 24){
      if (!ENTREES.some(e => e.sy < 0 && Math.abs(x + 12 - e.sx) < 30)) ov(x + 12, 4, 14, 12, x % 48 ? "#5E9E45" : "#6AAE50", x + 5, 1);
      if (!ENTREES.some(e => e.sy > H && Math.abs(x + 12 - e.sx) < 30)) ov(x + 12, H - 2, 14, 12, x % 48 ? "#5E9E45" : "#6AAE50", x + 9, 1);
    }
    /* les obstacles fixes */
    for (const [k, genre] of FIXES){
      const [gx, gy] = k.split(",").map(Number), x = (gx + .5) * CASE, y = (gy + .5) * CASE;
      if (genre === "rocher"){ ov(x, y + 4, 20, 15, "#A79E93", gx * 3 + gy, 1.3); ov(x - 5, y - 2, 8, 5, "#BDB5AA", gx + gy, 0); }
      if (genre === "panier"){
        ov(x, y + 6, 20, 14, "#C98E4E", gx + gy, 1.3);
        for (let i = -1; i <= 1; i++) bande(x + i * 9, y - 6, x + i * 9, y + 18, 2, "#A87038", i, 0);
        c.beginPath(); c.ellipse(x, y - 2, 15, 13, 0, Math.PI, TAU); c.lineWidth = 3; c.strokeStyle = "#A87038"; c.stroke();
        ov(x - 6, y - 2, 6, 5, "#E5482F", 3, .4); ov(x + 6, y - 1, 6, 5, "#9BD06B", 4, .4);
      }
    }
    for (const [k, genre] of FIXES){
      if (genre !== "arbre") continue;
      const [gx, gy] = k.split(",").map(Number), x = (gx + .5) * CASE, y = (gy + .5) * CASE;
      bx(x - 7, y - 12, 14, 26, "#8E6440", gx + gy, 1);
    }
    for (const [k, genre] of FIXES){
      if (genre !== "arbre") continue;
      const [gx, gy] = k.split(",").map(Number), x = (gx + .5) * CASE, y = (gy + .5) * CASE;
      if (FIXES.get(gx + "," + (gy - 1)) === "arbre") continue;
      ov(x, y - 30, 36, 28, "#4E9C45", gx * 9 + gy, 1.6); ov(x - 12, y - 38, 18, 14, "#5DB656", gx + 2, .5); ov(x + 14, y - 26, 14, 11, "#5DB656", gx + 3, .3);
    }
    /* fleurs */
    for (let i = 0; i < 20; i++){
      const x = 40 + hache(i + 400) * (W - 80), y = 40 + hache(i + 440) * (H - 80);
      if (NAPPE(Math.floor(x / CASE), Math.floor(y / CASE)) || CARTE.fixes.some(([k]) => k === Math.floor(x / CASE) + "," + Math.floor(y / CASE))) continue;
      const coul = ["#FFFFFF", "#F7D046", "#C9A3E8"][i % 3];
      for (let k = 0; k < 5; k++) ov(x + Math.cos(k * 1.26) * 3.5, y + Math.sin(k * 1.26) * 3.5, 2.6, 2.6, coul, i + k, .3);
      ov(x, y, 1.8, 1.8, "#F2B33B", 0, 0);
    }
  },
  dessineSol(J){
    /* le goûter sur la nappe : ce qu'il reste à protéger */
    const pos = [];
    for (let i = 0; i < 12; i++) pos.push([CARTE.nappe.x * CASE + 18 + (i % 4) * 44 + (Math.floor(i / 4) % 2) * 10, CARTE.nappe.y * CASE + 30 + Math.floor(i / 4) * 52]);
    for (let i = 0; i < Math.min(J.vies, 12); i++){
      const [x, y] = pos[i], s = i % 4;
      if (s === 0){ ov(x, y, 13, 12, "#E8B36A", i, 1); for (let k = 0; k < 4; k++) ov(x - 5 + (k % 2) * 9, y - 4 + (k >> 1) * 7, 1.8, 1.8, "#5A3A2A", k, 0); }
      else if (s === 1){ bx(x - 8, y - 8, 16, 18, "#F4F1EA", i, 1); bx(x - 6, y - 2, 12, 11, "#F28B2C", i + 1, 0); bande(x + 3, y - 8, x + 6, y - 18, 2, "#E15B4F", 0, 0); }
      else if (s === 2){ fo([x - 11, y + 8, x + 11, y + 8, x + 7, y - 4, x - 7, y - 4], "#C9713E", i, 1); ov(x, y - 6, 10, 7, "#F7EFF4", i + 2, .5); ov(x, y - 13, 3, 3, "#E0533D", 0, .3); }
      else { ov(x, y, 12, 9, "#F2D59A", i, 1); ov(x, y - 2, 8, 5, "#E85D75", i + 3, 0); }
    }
    if (J.apercu) return;
    /* le chemin que prendront les bestioles */
    const n = ENTREES_OUVERTES(Math.max(0, J.vague - (J.file.length || J.ennemis.length ? 1 : 0)));
    c.fillStyle = "rgba(255,255,255,.55)";
    for (let i = 0; i < n; i++){
      let x = ENTREES[i].gx, y = ENTREES[i].gy;
      for (let pas = 0; pas < 80 && !NAPPE(x, y); pas++){
        c.beginPath(); c.arc((x + .5) * CASE, (y + .5) * CASE, 3, 0, TAU); c.fill();
        let best = null, bv = J.dist[idx(x, y)];
        for (const [dx, dy] of VOISINS){ const nx = x + dx, ny = y + dy; if (nx < 0 || ny < 0 || nx >= NX || ny >= NY) continue; if (J.dist[idx(nx, ny)] < bv){ bv = J.dist[idx(nx, ny)]; best = [nx, ny]; } }
        if (!best) break;
        x = best[0]; y = best[1];
      }
      /* la flèche d'entrée */
      const E = ENTREES[i], fx = (E.gx + .5) * CASE, fy = (E.gy + .5) * CASE;
      const ang = E.sx < 0 ? 0 : E.sx > W ? Math.PI : E.sy < 0 ? Math.PI / 2 : -Math.PI / 2;
      c.save(); c.translate(fx - Math.cos(ang) * 18, fy - Math.sin(ang) * 18); c.rotate(ang);
      c.globalAlpha = .8 + Math.sin(J.t * 4) * .2; fo([-8, -9, 10, 0, -8, 9, -4, 0], "#E0533D", i, .6); c.restore(); c.globalAlpha = 1;
    }
  },
  dessineEffet(f, k){
    if (f.genre === "vent"){
      const r = f.r * (.25 + k * .8);
      c.globalAlpha = 1 - k; c.beginPath(); c.arc(f.x, f.y, r, f.a, f.a + .5);
      c.strokeStyle = "#FFFFFF"; c.lineWidth = 3; c.lineCap = "round"; c.stroke(); c.globalAlpha = 1;
    }
  }
});
}
