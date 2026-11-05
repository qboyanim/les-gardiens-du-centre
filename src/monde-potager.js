/* ═════════════════════════════════════════════════════════════
   MONDE 1 — LE POTAGER
   Un chemin classique. Ce qui change : on PLANTE. Un légume posé
   n'est qu'une pousse ; il lui faut quelques secondes pour grandir
   avant d'agir. Et on l'améliore à l'ARROSOIR : l'eau se remplit
   lentement pendant les vagues, il faut choisir qui arroser.
   ═════════════════════════════════════════════════════════════ */
{
/* ═══ les trois terrains du potager ═══
   chemins : une ou plusieurs lignes (en cases) de l'entrée au cageot
   decor : ce qui occupe des cases où l'on ne peut pas planter */
const CARTES = [
  { nom:"Le jardin du Centre", desc:"Un chemin qui serpente jusqu'au cageot. Idéal pour commencer.",
    chemins:[[[-1.4, 2], [4, 2], [4, 9], [9, 9], [9, 3], [14, 3], [14, 8], [18.4, 8]]],
    cageot:[19, 8], decor:[["cabane", 16, 0], ["compost", 0, 10]] },
  { nom:"Le verger", desc:"Les bestioles arrivent par le haut et le chemin est long… mais les pommiers prennent beaucoup de place.",
    chemins:[[[2, -1.4], [2, 9], [7, 9], [7, 3], [12, 3], [12, 10], [17, 10], [17, 5], [18.4, 5]]],
    cageot:[19, 5], decor:[["pommier", 4, 2], ["pommier", 4, 6], ["pommier", 9, 1], ["pommier", 9, 6], ["pommier", 14, 1], ["pommier", 14, 6], ["compost", 0, 10]],
    programme:{ budget:68 } },
  { nom:"Les deux allées", desc:"Deux entrées, deux chemins qui se rejoignent avant le cageot : il faut défendre sur tous les fronts.",
    chemins:[[[-1.4, 1], [6, 1], [6, 5], [10, 5], [10, 8], [15, 8], [15, 4], [18.4, 4]],
             [[-1.4, 10], [10, 10], [10, 8], [15, 8], [15, 4], [18.4, 4]]],
    cageot:[19, 4], decor:[["mare", 12, 1], ["compost", 0, 4]], programme:{ budget:64 } }
];
const TAILLES = { cabane:[4, 2], compost:[2, 2], pommier:[1, 1], mare:[2, 2] };
let CARTE = CARTES[0], CH = [], SUR_CHEMIN = new Set(), BLOQUE = new Set();
function prepareChemin(pts){
  const P = pts.map(([x, y]) => [(x + .5) * CASE, (y + .5) * CASE]), seg = [];
  let long = 0;
  for (let i = 0; i < P.length - 1; i++){
    const [ax, ay] = P[i], [bx2, by] = P[i + 1], l = dist(ax, ay, bx2, by);
    seg.push({ ax, ay, l, d0:long, ux:(bx2 - ax) / l, uy:(by - ay) / l }); long += l;
  }
  return { P, seg, long };
}
function point(d, ch = CH[0]){
  let s = ch.seg[0];
  for (const x of ch.seg) if (d >= x.d0) s = x;
  const k = Math.min(d - s.d0, s.l);
  return { x:s.ax + s.ux * k, y:s.ay + s.uy * k, ux:s.ux, uy:s.uy };
}
function charge(k){
  CARTE = CARTES[k] || CARTES[0];
  CH = CARTE.chemins.map(prepareChemin);
  SUR_CHEMIN = new Set(); BLOQUE = new Set();
  for (const ch of CH) for (let d = 0; d <= ch.long; d += 6){ const p = point(d, ch); SUR_CHEMIN.add(Math.floor(p.x / CASE) + "," + Math.floor(p.y / CASE)); }
  const [cx, cy] = CARTE.cageot;
  for (let y = cy - 1; y <= cy + 1; y++) BLOQUE.add(cx + "," + y);
  for (const [genre, x, y] of CARTE.decor){ const [w, h] = TAILLES[genre]; for (let i = 0; i < w; i++) for (let j = 0; j < h; j++) BLOQUE.add((x + i) + "," + (y + j)); }
}
charge(0);
const EAU_TEMPS = 11, COUT_EAU = [0, 2, 3];
const POUSSE = 4.5;

const VERT = "#5DB656", VERT_F = "#3F8E3E", TERRE = "#8A5A3A";

/* ── les défenseurs ── */
function butte(t){ ov(0, 9, 19, 7.5, TERRE, t.g, 1); ov(-6, 7, 5, 2, "#A26E48", t.g + 1, 0); }
function croissance(t){ const p = t.pousse ?? 1; const k = .3 + .7 * p; c.scale(k, k); return p; }

const TOURS = {
  radis:{
    nom:"Radis", prix:45, debloque:0, contre:["vole"], genre:"tir", portee:118, cadence:.8, deg:9, vitesseTir:470, cibles:"tout", couleurTir:"#E2457A",
    desc:"Lance des graines de radis, vite et loin. Touche aussi les papillons.",
    branches:[
      { nom:"Radis mitraillette", desc:"Tire deux fois plus vite.", mods:{ cadence:.5, deg:.85 } },
      { nom:"Radis noir", desc:"Ses graines rebondissent sur 2 autres bestioles.", mods:{ deg:1.2 }, effets:{ rebond:2 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      const s = Math.sin(tm * 2 + t.g) * .06;
      feuille(-2, -15, 21, 10, -Math.PI / 2 - .55 + s, "#4FA34A", t.g + 1);
      feuille(0, -15, 26, 11, -Math.PI / 2 + s, VERT, t.g + 2);
      feuille(2, -15, 20, 9, -Math.PI / 2 + .6 + s, "#4FA34A", t.g + 3);
      const q = 1 + t.recul * .14;
      c.save(); c.scale(q, 1 / q);
      fo([-5, 4, 0, 13, 5, 4], "#F1E3D3", t.g + 4, .5);
      ov(0, -5, 14, 13, "#E2457A", t.g + 5);
      ov(-5, -10, 4, 3, "rgba(255,255,255,.35)", 0, 0);
      yeux(0, -6, 5, 3.4, Math.cos(t.ang), Math.sin(t.ang), t.g);
      sourire(0, -1, 3);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.ang); ov(0, 0, 6, 4, "#E2457A", p.g, .5); feuille(-5, 0, 6, 4, Math.PI, "#4FA34A", p.g, 0); }
  },
  tomate:{
    nom:"Tomate", prix:85, debloque:3, contre:["nuee"], genre:"tir", tir:"lob", portee:158, cadence:1.9, deg:20, splash:46, vitesseTir:250, cibles:"sol",
    couleurTir:"#E5482F", hauteurTir:20,
    desc:"Lance des tomates bien mûres qui éclaboussent un groupe. Pas les papillons.",
    branches:[
      { nom:"Tomates cerises", desc:"Trois tomates d'un coup, sur trois cibles.", mods:{ deg:.7 }, effets:{ multi:2 } },
      { nom:"Tomate géante", desc:"Énorme éclaboussure qui assomme souvent.", mods:{ splash:1.5, deg:1.35, cadence:1.15 }, effets:{ etourdit:.3 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      bande(0, 8, 0, -38, 4, "#9C6B3E", t.g, 1);
      feuille(0, -14, 18, 9, Math.PI + .5, VERT, t.g + 1);
      feuille(0, -22, 17, 8, -.5, "#4FA34A", t.g + 2);
      feuille(0, -32, 14, 7, Math.PI + .7, VERT, t.g + 3);
      const q = 1 + t.recul * .18;
      ov(11, -8, 7, 6.5, "#E5482F", t.g + 4);
      ov(-11, -22, 6, 5.5, "#F06A3D", t.g + 5);
      c.save(); c.translate(4, -30); c.scale(q, 1 / q);
      ov(0, 0, 11, 10, "#E5482F", t.g + 6);
      etoile5(0, -9, 5, 2, VERT_F, t.g, .3);
      ov(-4, -4, 3, 2, "rgba(255,255,255,.35)", 0, 0);
      yeux(0, 0, 4, 2.8, Math.cos(t.ang), Math.sin(t.ang), t.g);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.age * 6); ov(0, 0, 7, 6.5, "#E5482F", p.g, .5); etoile5(0, -5, 3.5, 1.4, VERT_F, p.g, 0); }
  },
  piment:{
    nom:"Piment", prix:75, debloque:5, contre:["nuee"], genre:"zone", portee:74, cadence:.9, deg:9, couleurZone:"rgba(240,120,40,.9)",
    desc:"Souffle un air brûlant tout autour de lui. Tout ce qui passe près s'en va vite !",
    branches:[
      { nom:"Piment de feu", desc:"Ce qu'il touche continue de chauffer 3 secondes.", effets:{ brule:9 } },
      { nom:"Piment volcan", desc:"Souffle bien plus loin et plus fort.", mods:{ portee:1.35, deg:1.4 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      const q = 1 + t.recul * .2, chaud = t.recul;
      c.save(); c.scale(1 / q, q); c.rotate(Math.sin(tm * 3 + t.g) * .05);
      fo([-8, -30, 8, -32, 12, -22, 9, -4, 3, 6, -2, 10, -5, 2, -10, -16], chaud > .5 ? "#F04A24" : "#D93A2B", t.g, 1);
      fo([-9, -30, -2, -36, 9, -31, 3, -27], VERT, t.g + 1, .6);
      bande(0, -34, 4, -42, 3, VERT_F, t.g, .5);
      ov(-3, -20, 2.5, 6, "rgba(255,255,255,.3)", 0, 0);
      yeux(1, -18, 4.5, 3, 0, 0, t.g, false);
      c.beginPath(); c.moveTo(-4, -26); c.lineTo(0, -24); c.moveTo(6, -26); c.lineTo(2, -24);
      c.strokeStyle = "#2B211B"; c.lineWidth = 1.6; c.stroke();
      sourire(1, -11, 3);
      c.restore();
    }
  },
  chou:{
    nom:"Chou", prix:60, debloque:2, contre:["rapide"], genre:"aura", portee:86, lent:.36,
    desc:"Ses grandes feuilles collantes ralentissent tout ce qui passe autour.",
    branches:[
      { nom:"Chou glacé", desc:"Ralentit énormément.", mods:{ lent:1.7 } },
      { nom:"Chou piquant", desc:"Ralentit et pique tout ce qui passe.", effets:{ pique:9 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      const r = Math.sin(tm * 1.5 + t.g) * .04;
      for (let i = 0; i < 7; i++) feuille(0, -8, 22, 15, -Math.PI / 2 + (i - 3) * .45 + r, i % 2 ? "#8DCB6E" : "#76B85C", t.g + i, 1);
      ov(0, -12, 13, 11, "#A9DC88", t.g + 9);
      ov(0, -14, 8, 6, "#C3E8A6", t.g + 10, .4);
      yeux(0, -12, 4.5, 2.6, 0, 0, t.g, true);
      sourire(0, -7, 2.5);
    }
  },
  tournesol:{
    nom:"Tournesol", prix:55, debloque:0, contre:["eco"], genre:"prod", prod:12, cadence:9,
    desc:"Ne repousse personne, mais te donne des graines régulièrement.",
    branches:[
      { nom:"Tournesol doré", desc:"Donne beaucoup plus de graines.", mods:{ prod:1.6 } },
      { nom:"Tournesol de pluie", desc:"Donne aussi une goutte d'eau à chaque récolte.", effets:{ eau:1 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      bande(0, 8, 1, -34, 4.5, "#4E9C45", t.g, 1);
      feuille(0, -10, 16, 9, Math.PI + .4, VERT, t.g + 1);
      feuille(0, -18, 16, 9, -.4, "#4FA34A", t.g + 2);
      c.save(); c.translate(1, -38); c.rotate(Math.sin(tm * .8 + t.g) * .15);
      const q = 1 + t.recul * .2; c.scale(q, q);
      for (let i = 0; i < 12; i++) feuille(0, 0, 18, 8, i / 12 * TAU + .1, i % 2 ? "#F7C531" : "#F2B020", t.g + i, .7);
      ov(0, 0, 10, 10, "#7A4A26", t.g + 13);
      for (let i = 0; i < 5; i++) ov(Math.cos(i * 1.3) * 5, Math.sin(i * 1.3) * 5, 1.4, 1.4, "#5B3418", 0, 0);
      yeux(0, -1, 3.8, 2.4, 0, 0, t.g);
      sourire(0, 3.5, 2.6, "#FFE5A8");
      c.restore();
    }
  },
  epouvantail:{
    nom:"Épouvantail", prix:70, debloque:10, contre:["rapide"], portee:82, cadence:4.5, peur:1.3, cibles:"sol",
    desc:"Agite les bras : les bestioles autour prennent peur et font demi-tour un moment.",
    branches:[
      { nom:"Épouvantail géant", desc:"Fait fuir plus loin et plus longtemps.", mods:{ portee:1.3, peur:1.7 } },
      { nom:"Épouvantail grincheux", desc:"Effraie deux fois plus souvent, et pique un peu.", mods:{ cadence:.5 }, effets:{ pique:1 } }
    ],
    agit(J, t, dt){
      if (t.pousse < 1) return;
      t.cd -= dt;
      if (t.cd > 0) return;
      const liste = dansPortee(t);
      if (!liste.length){ t.cd = .15; return; }
      const duree = stat(t, "peur");
      for (const e of liste){
        if (e.d.boss || e.d.inarretable){ ralentit(e, .5, 1); continue; }
        e.peurT = J.t + duree;
        if (effet(t, "pique")) blesse(e, 10 * mult(t, "deg"), t);
      }
      onde(t.x, t.y - 20, stat(t, "portee"), "rgba(255,240,200,.9)", .5);
      t.recul = 1; t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      butte(t); croissance(t);
      bande(0, 8, 0, -40, 4, "#9C6B3E", t.g, 1);
      const bras = Math.sin(tm * 2 + t.g) * .08 + t.recul * Math.sin(tm * 30) * .35;
      c.save(); c.translate(0, -26); c.rotate(bras);
      bande(-24, 0, 24, 0, 4, "#9C6B3E", t.g + 1, .8);
      fo([-26, -3, -32, 6, -22, 4], "#F2D06B", t.g + 2, .3); fo([26, -3, 32, 6, 22, 4], "#F2D06B", t.g + 3, .3);
      c.restore();
      fo([-11, -32, 11, -32, 14, -8, -14, -8], "#5A8FD1", t.g + 4, 1);
      bx(-4, -24, 6, 6, "#E0533D", t.g + 5, 0);
      ov(0, -42, 10, 10, "#F2D9A6", t.g + 6, .8);
      fo([-17, -46, 17, -46, 9, -50, 6, -62, -6, -62, -9, -50], "#B9733F", t.g + 7, .8);
      bande(-8, -50, 8, -50, 3, "#E0533D", 0, 0);
      bande(-6, -45, -2, -41, 1.5, "#2B211B", 0, 0); bande(-2, -45, -6, -41, 1.5, "#2B211B", 0, 0);
      bande(2, -45, 6, -41, 1.5, "#2B211B", 0, 0); bande(6, -45, 2, -41, 1.5, "#2B211B", 0, 0);
      sourire(0, -36, 3);
    }
  }
};

/* ── les bestioles ── */
function pattes(n, x0, ecart, y, lg, tm, coul = "#2B211B"){
  for (let i = 0; i < n; i++){ const a = Math.sin(tm * 14 + i * 2) * 3; bande(x0 + i * ecart, y, x0 + i * ecart + a, y + lg, 1.8, coul, i, 0); }
}
const ENNEMIS = {
  puceron:{
    nom:"Puceron", nuee:true, pv:20, vit:62, prime:3, r:8, hautBarre:20, couleur:"#9BD06B",
    dessine(e, tm){
      const b = Math.abs(Math.sin(e.anim * 12)) * 1.5;
      pattes(3, -4, 4, -3, 4, e.anim);
      ov(0, -7 - b, 9, 6.5, "#9BD06B", e.g);
      ov(-2, -10 - b, 4, 2, "rgba(255,255,255,.4)", 0, 0);
      ov(7, -9 - b, 4.5, 4.5, "#86BD58", e.g + 1, .4);
      yeux(8, -10 - b, 2.2, 1.8, 1, 0, e.g);
    }
  },
  chenille:{
    nom:"Chenille", pv:50, vit:42, prime:6, r:12, hautBarre:26, couleur:"#7CC36A",
    dessine(e, tm){
      for (let i = 0; i < 5; i++){
        const b = Math.max(0, Math.sin(e.anim * 7 - i * .9)) * 4;
        ov(-18 + i * 7, -7 - b, 6.5, 6.5, i % 2 ? "#8ACF6C" : "#6FB85A", e.g + i, .8);
        ov(-18 + i * 7, -2 - b * .3, 1.2, 1.2, "#3A6B2C", 0, 0);
      }
      const b = Math.max(0, Math.sin(e.anim * 7 - 5 * .9)) * 4;
      ov(17, -10 - b, 8.5, 8, "#7CC36A", e.g + 7);
      bande(15, -17 - b, 12, -25 - b, 1.6, "#3A6B2C", e.g, 0); bande(19, -17 - b, 21, -25 - b, 1.6, "#3A6B2C", e.g, 0);
      ov(12, -25 - b, 2, 2, "#E0533D", 0, 0); ov(21, -25 - b, 2, 2, "#E0533D", 0, 0);
      yeux(18, -11 - b, 3, 2.4, 1, 0, e.g, e.content);
      joues(18, -6 - b, 6, 2);
    }
  },
  escargot:{
    nom:"Escargot", pv:95, vit:24, prime:12, armure:6, r:13, hautBarre:34, couleur:"#D79A5B",
    dessine(e, tm){
      const et = Math.sin(e.anim * 4) * 1.5;
      fo([-18, 0, 16 + et, 0, 20 + et, -6, 8, -8, -14, -6], "#D9C9A3", e.g, 1);
      ov(16 + et, -12, 5.5, 8, "#D9C9A3", e.g + 1, .6);
      bande(14 + et, -18, 12 + et, -27, 1.8, "#BBA77E", 0, 0); bande(18 + et, -18, 20 + et, -27, 1.8, "#BBA77E", 0, 0);
      ov(12 + et, -28, 2.6, 2.6, "#FFFDF6", 1, 0); ov(20 + et, -28, 2.6, 2.6, "#FFFDF6", 2, 0);
      ov(12.6 + et, -28, 1.4, 1.4, "#2B211B", 0, 0); ov(20.6 + et, -28, 1.4, 1.4, "#2B211B", 0, 0);
      ov(-3, -15, 14, 13, "#B9733F", e.g + 3);
      ov(-2, -16, 9.5, 9, "#D79A5B", e.g + 4, .5);
      ov(-1, -17, 5, 5, "#F0C48A", e.g + 5, .4);
      ov(0, -17.5, 1.8, 1.8, "#B9733F", 0, 0);
    }
  },
  sauterelle:{
    nom:"Sauterelle", pv:32, vit:46, prime:8, r:11, hautBarre:34, couleur:"#7DB843", saute:true,
    dessine(e, tm){
      const z = e.z || 0; c.translate(0, -z);
      const pli = z > 2 ? .9 : 0;
      bande(-4, -10, -12, -22 + pli * 10, 3.2, "#5E9C33", e.g, .6);
      bande(-12, -22 + pli * 10, -16, -2 + pli * 2, 2.4, "#5E9C33", e.g + 1, .6);
      ov(0, -10, 15, 6, "#7DB843", e.g + 2);
      feuille(-12, -12, 18, 5, -.05, "#9AD15F", e.g + 3, .5);
      ov(13, -13, 6.5, 6, "#8CC64E", e.g + 4);
      bande(15, -18, 22, -28, 1.4, "#3F6E22", 0, 0);
      pattes(2, 0, 6, -6, 6, z > 2 ? 0 : e.anim, "#4F8A2B");
      yeux(14, -14, 2.6, 2.2, 1, 0, e.g, e.content);
    }
  },
  papillon:{
    nom:"Papillon", pv:26, vit:55, prime:7, r:12, hautBarre:46, vole:true, couleur:"#FFC94A", hautCible:28, sansMiroir:false,
    dessine(e, tm){
      c.translate(0, -26 + Math.sin(e.anim * 3) * 4);
      const a = .25 + Math.abs(Math.sin(e.anim * 13)) * .75;
      c.save(); c.scale(1, a);
      feuille(0, 0, 17, 13, -2.2, "#FFC94A", e.g, .8); feuille(0, 0, 15, 12, -1.0, "#FFD86B", e.g + 1, .8);
      ov(-6, -9, 3, 2.5, "#F28B2C", 0, 0); ov(5, -10, 2.6, 2.2, "#F28B2C", 0, 0);
      c.restore();
      c.save(); c.scale(1, -a);
      feuille(0, 0, 11, 9, -2.4, "#F6A9C8", e.g + 2, .6); feuille(0, 0, 10, 8, -.8, "#F6A9C8", e.g + 3, .6);
      c.restore();
      ov(1, 0, 8, 2.5, "#3B3530", e.g + 4, .4);
      bande(8, -1, 12, -8, 1.2, "#3B3530", 0, 0);
      yeux(9, -1, 1.6, 1.5, 1, 0, e.g);
    }
  },
  taupe:{
    nom:"Taupe", sousTerre:true, pv:70, vit:34, prime:10, r:12, hautBarre:30, couleur:"#6B5446",
    /* elle plonge sous terre : on ne peut plus la toucher, et elle file */
    agit(J, e, dt){
      e.terre = (e.terre ?? alea(0, 2)) + dt;
      const sous = e.terre % 4.2 > 2.4;
      if (sous !== e.sous){ e.sous = sous; confettis(e.x, e.y, "#8A5A3A", 6); }
      e.invuln = e.cache = sous && !revele(e);
    },
    dessine(e, tm){
      if (e.sous){
        const b = Math.sin(e.anim * 14) * 1.5;
        ov(0, -4 - b, 16, 8, "#8A5A3A", e.g, 1); ov(-8, -6, 4, 3, "#A26E48", e.g + 1, 0); ov(7, -8 - b, 3, 2, "#6F4630", e.g + 2, 0);
        return;
      }
      ov(0, -11, 15, 12, "#6B5446", e.g, 1);
      ov(-4, -15, 6, 4, "rgba(255,255,255,.15)", 0, 0);
      ov(13, -10, 5, 4, "#F2A1B0", e.g + 1, .4);
      for (const s of [-1, 1]) fo([4, -2, 12, 0 + s, 8, 4], "#F2C9B0", e.g + 2 + s, .3);
      bx(1, -17, 12, 5, "#2B211B", e.g + 3, 0);
      sourire(8, -6, 2.4);
    }
  },
  limace:{
    nom:"Limace géante", pv:1500, vit:15, prime:120, armure:2, degats:5, r:30, hautBarre:58, boss:true, couleur:"#B98AD0",
    enerve(J, e){ for (let i = 0; i < 5; i++) creeEnnemi("puceron", { dist:e.dist + i * 14, ch:e.ch }); },
    dessine(e, tm){
      const et = Math.sin(e.anim * 2.5) * 3;
      fo([-46, 0, 34 + et, 0, 42 + et, -14, 30, -30, -6, -34, -34, -22], "#B98AD0", e.g, 1.6);
      ov(-14, -22, 7, 5, "#9C6DB8", e.g + 1, 0); ov(6, -26, 5, 4, "#9C6DB8", e.g + 2, 0); ov(-28, -12, 5, 3.5, "#9C6DB8", e.g + 3, 0);
      bande(28 + et, -26, 24 + et, -46, 3, "#A57ABD", e.g, .6); bande(36 + et, -24, 40 + et, -44, 3, "#A57ABD", e.g, .6);
      yeux(32 + et, -46, 8, 5, 1, .3, e.g, e.content);
      sourire(34 + et, -14, 6);
      joues(34 + et, -18, 10, 3);
    }
  }
};

/* ═══ les renforts du potager : ils se débloquent au fil des 30 vagues ═══ */
Object.assign(TOURS, {
  lavande:{
    nom:"Lavande", prix:90, debloque:4, contre:["vole", "armure"], genre:"tir", cibles:"air", percant:true, portee:155, cadence:.6, deg:15, vitesseTir:420, couleurTir:"#A57AD8",
    desc:"Son parfum pique les insectes volants, même ceux à carapace. Ne touche pas ceux qui marchent.",
    branches:[
      { nom:"Lavande sauvage", desc:"Le parfum rebondit sur 2 autres volants.", effets:{ rebond:2 } },
      { nom:"Grande lavande", desc:"Bien plus forte et plus loin.", mods:{ deg:1.5, portee:1.2 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      for (let i = -2; i <= 2; i++){
        const a = -Math.PI / 2 + i * .24 + Math.sin(tm * 2 + i) * .04;
        bande(0, 6, Math.cos(a) * 30, Math.sin(a) * 30 + 6, 2, "#5E9C45", i + 3, .4);
        for (let k = 0; k < 4; k++) ov(Math.cos(a) * (16 + k * 4), Math.sin(a) * (16 + k * 4) + 6, 3.4 - k * .4, 2.6, k % 2 ? "#A57AD8" : "#8E5FC8", i * 5 + k + 10, .3);
      }
    },
    dessineTir(p){ ov(0, 0, 4, 4, "#C9A3E8", p.g, .3); ov(3, -2, 2.5, 2.5, "#A57AD8", p.g + 1, 0); }
  },
  ortie:{
    nom:"Ortie", prix:95, debloque:6, contre:["armure"], genre:"zone", percant:true, cibles:"sol", portee:72, cadence:.8, deg:12, couleurZone:"rgba(120,200,90,.9)",
    desc:"Ses poils piquent à travers les carapaces et les coquilles. Courte portée.",
    branches:[
      { nom:"Ortie royale", desc:"Pique deux fois plus fort.", mods:{ deg:1.8 } },
      { nom:"Ortie brûlante", desc:"Ce qu'elle touche continue de gratter.", effets:{ brule:10 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      const q = 1 + t.recul * .12; c.save(); c.scale(q, 1 / q);
      bande(0, 8, 0, -36, 3.5, "#3F7E35", t.g, .8);
      for (let i = 0; i < 4; i++){
        const y = -8 - i * 7, sens = i % 2 ? 1 : -1;
        feuille(0, y, 16 - i * 2, 9, sens > 0 ? -.5 : Math.PI + .5, i % 2 ? "#4F9A43" : "#5DB656", t.g + i, .6);
        for (let k = 0; k < 3; k++) bande(sens * (4 + k * 4), y - 2, sens * (6 + k * 4), y - 7, .9, "#2F5E27", k, 0);
      }
      yeux(0, -20, 3.5, 2.2, 0, 0, t.g); c.restore();
    }
  },
  herisson:{
    nom:"Hérisson", prix:120, debloque:8, contre:["invisible"], detecte:true, genre:"tir", cibles:"sol", portee:125, cadence:.9, deg:8, vitesseTir:380, couleurTir:"#7A5A44",
    desc:"Il flaire tout : autour de lui, les taupes cachées sous terre deviennent visibles et attaquables.",
    branches:[
      { nom:"Hérisson fouineur", desc:"Flaire beaucoup plus loin.", mods:{ portee:1.5 } },
      { nom:"Hérisson roulé", desc:"Lance des piquants qui traversent les carapaces.", mods:{ deg:2.2 }, effets:{ percant:1 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      for (let i = 0; i < 9; i++){ const a = Math.PI + i / 8 * Math.PI; fo([Math.cos(a) * 11, Math.sin(a) * 9 - 8, Math.cos(a) * 21, Math.sin(a) * 18 - 9, Math.cos(a + .17) * 11, Math.sin(a + .17) * 9 - 8], "#6B5446", t.g + i, .4); }
      ov(0, -8, 14, 10, "#8A6A52", t.g + 10, 1);
      ov(12, -6, 7, 6, "#E9D2B0", t.g + 11, .5); ov(18.5, -6, 2, 2, "#2B211B", 0, 0);
      yeux(10, -9, 2, 1.8, 1, 0, t.g);
    },
    dessineTir(p){ c.rotate(p.ang); bande(-6, 0, 6, 0, 2, "#6B5446", p.g, .3); }
  },
  mais:{
    nom:"Maïs pop-corn", prix:150, debloque:12, contre:["bouclier", "vole"], genre:"tir", cibles:"tout", portee:125, cadence:.13, deg:3.4, vitesseTir:520, couleurTir:"#FFF3C4",
    desc:"Une mitraille de pop-corn : peu de force par grain, mais tellement de grains qu'il brise les boucliers.",
    branches:[
      { nom:"Pop-corn caramel", desc:"Chaque grain colle et ralentit.", effets:{ lent:.25 } },
      { nom:"Maïs géant", desc:"Plus fort et plus loin.", mods:{ deg:1.5, portee:1.2 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      bande(0, 8, 0, -28, 4, "#6DA544", t.g, .8);
      feuille(0, -4, 22, 8, Math.PI + .7, "#7FB84F", t.g + 1, .6); feuille(0, -8, 22, 8, -.7, "#6DA544", t.g + 2, .6);
      c.save(); c.translate(0, -30); c.rotate(t.ang + Math.PI / 2);
      ov(0, -6, 7, 14, "#F2C531", t.g + 3, 1);
      for (let i = 0; i < 6; i++) ov(-3 + (i % 2) * 6, -14 + Math.floor(i / 2) * 6, 2.4, 2.2, "#F7DA6A", i, 0);
      c.restore();
    },
    dessineTir(p){ ov(0, 0, 3.6, 3.2, "#FFF6D8", p.g, .3); ov(1, -1, 2, 2, "#FFFFFF", 0, 0); }
  },
  citrouille:{
    nom:"Citrouille", prix:220, debloque:14, contre:["nuee"], genre:"tir", tir:"lob", cibles:"sol", portee:190, cadence:3, deg:55, splash:75, vitesseTir:230, couleurTir:"#F08A2C", effets:{ etourdit:.35 }, hauteurTir:20,
    desc:"Catapulte d'énormes graines : une grosse explosion qui assomme toute une nuée.",
    branches:[
      { nom:"Citrouille d'automne", desc:"Explosion encore plus grande.", mods:{ splash:1.4, deg:1.2 } },
      { nom:"Citrouille mitraille", desc:"Tire presque deux fois plus vite.", mods:{ cadence:.55 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      const q = 1 + t.recul * .15; c.save(); c.scale(q, 1 / q);
      for (const i of [-2, 2, -1, 1, 0]) ov(i * 6, -10, 9, 13, i % 2 ? "#F08A2C" : "#E8771F", t.g + i + 3, i === 0 ? 1 : .5);
      bande(0, -22, 3, -30, 3.5, "#4F7A2E", t.g, .3);
      fo([-7, -14, -2, -11, -9, -9], "#2B211B", 1, 0); fo([7, -14, 2, -11, 9, -9], "#2B211B", 2, 0);
      sourire(0, -4, 5); c.restore();
    },
    dessineTir(p){ c.rotate(p.age * 5); ov(0, 0, 8, 9, "#F08A2C", p.g, .5); bande(0, -9, 1, -12, 2, "#4F7A2E", 0, 0); }
  },
  pasteque:{
    nom:"Pastèque géante", prix:380, debloque:18, contre:["boss", "armure"], genre:"tir", tir:"lob", cibles:"sol", portee:175, cadence:3.4, deg:45, splash:40, pourcent:.06, vitesseTir:220, couleurTir:"#E8536A", hauteurTir:22,
    desc:"Elle écrase ce qui est gros : chaque pastèque retire une part de la vie de sa cible. Idéale contre les géants et la limace.",
    branches:[
      { nom:"Pastèque XXL", desc:"Écrase encore plus fort.", mods:{ deg:1.5 }, effets:{ pourcentPlus:.04 } },
      { nom:"Pépins collants", desc:"Les pépins ralentissent tout autour.", effets:{ lent:.45 } }
    ],
    dessine(t, tm){
      butte(t); croissance(t);
      const q = 1 + t.recul * .12; c.save(); c.scale(q, 1 / q);
      ov(0, -12, 22, 17, "#3F8E3E", t.g, 1.2);
      for (let i = -2; i <= 2; i++) bande(i * 7, -27, i * 8, 3, 2.5, "#2F6E2F", i + 5, 0);
      ov(-6, -18, 6, 3, "rgba(255,255,255,.25)", 0, 0);
      yeux(0, -12, 5, 3, Math.cos(t.ang), Math.sin(t.ang), t.g); sourire(0, -4, 4);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.age * 4); ov(0, 0, 10, 10, "#E8536A", p.g, .6); bande(-9, 2, 9, 2, 3, "#3F8E3E", 0, 0); for (let i = 0; i < 3; i++) ov(-4 + i * 4, -2, 1.2, 1.8, "#2B211B", 0, 0); }
  },
  ruche:{
    nom:"Ruche", prix:300, debloque:20, contre:["vole", "nuee"], genre:"tir", cibles:"tout", portee:165, cadence:.9, deg:16, vitesseTir:300, effets:{ multi:3 }, couleurTir:"#F2C230",
    desc:"Envoie quatre abeilles amies à la fois, au sol comme dans les airs.",
    branches:[
      { nom:"Essaim", desc:"Six abeilles d'un coup.", effets:{ multi:5 } },
      { nom:"Abeilles royales", desc:"Des abeilles bien plus fortes, qui piquent à travers les carapaces.", mods:{ deg:1.7 }, effets:{ percant:1 } }
    ],
    dessine(t, tm){
      bande(-12, 12, -10, -4, 3, "#8E6440", t.g, .6); bande(12, 12, 10, -4, 3, "#8E6440", t.g + 1, .6);
      for (let i = 0; i < 4; i++) ov(0, -6 - i * 9, 17 - i * 3, 6, i % 2 ? "#E9B44C" : "#D9A03A", t.g + i + 2, i ? .5 : 1);
      ov(0, -10, 4, 3.5, "#5A3A1A", 0, 0);
      for (let i = 0; i < 3; i++){ const a = tm * 3 + i * 2.1; ov(Math.cos(a) * 22, -20 + Math.sin(a * 1.4) * 10, 3, 2.2, "#F2C230", i, 0); }
    },
    dessineTir(p){ c.rotate(p.ang); ov(0, 0, 4.5, 3, "#F2C230", p.g, .3); bande(-1, -3, -1, 3, 1.4, "#2B211B", 0, 0); ov(-1, -3.5, 3, 2, "rgba(255,255,255,.8)", 0, 0); }
  }
});

Object.assign(ENNEMIS, {
  cloporte:{
    nom:"Cloporte", pv:60, vit:30, prime:9, r:13, hautBarre:26, bouclier:8, couleur:"#7F8C99",
    dessine(e, tm){
      pattes(4, -10, 6, -2, 4, e.anim, "#5A6672");
      for (let i = 0; i < 5; i++) ov(-12 + i * 6, -8, 6, 7.5, i % 2 ? "#8E9AA6" : "#7F8C99", e.g + i, i ? .4 : 1);
      ov(15, -7, 5, 5, "#6E7B88", e.g + 6, .4);
      yeux(16, -8, 1.8, 1.6, 1, 0, e.g, e.content);
    }
  },
  hanneton:{
    nom:"Hanneton", pv:90, vit:34, prime:13, r:13, hautBarre:44, vole:true, armure:5, couleur:"#8A5A2E", hautCible:26,
    dessine(e, tm){
      c.translate(0, -24 + Math.sin(e.anim * 4) * 3);
      const a = Math.abs(Math.sin(e.anim * 26));
      c.globalAlpha *= .7; ov(-2, -10 - a * 3, 8, 9 * (.4 + a * .6), "#EAF2F7", e.g, .3); c.globalAlpha /= .7;
      ov(-2, 0, 12, 9, "#8A5A2E", e.g + 1, 1);
      bande(-2, -8, -2, 8, 1.2, "#5E3B1C", 0, 0);
      ov(-6, -4, 4, 2, "rgba(255,255,255,.25)", 0, 0);
      ov(10, -1, 5.5, 5, "#2B211B", e.g + 2, .4);
      yeux(11, -2, 1.8, 1.6, 1, 0, e.g, e.content);
      bande(13, -4, 19, -9, 1, "#2B211B", 0, 0); bande(13, -3, 19, -1, 1, "#2B211B", 0, 0);
    }
  },
  criquet:{
    nom:"Criquet voyageur", pv:45, vit:78, prime:9, r:11, hautBarre:30, inarretable:true, couleur:"#C9A23A",
    dessine(e, tm){
      const b = Math.abs(Math.sin(e.anim * 18)) * 3;
      bande(-4, -10 - b, -14, -20 - b, 3, "#A8862E", e.g, .5); bande(-14, -20 - b, -18, -2, 2.2, "#A8862E", e.g + 1, .5);
      ov(0, -10 - b, 15, 5.5, "#C9A23A", e.g + 2, 1);
      feuille(-12, -12 - b, 20, 5, -.05, "#E0C060", e.g + 3, .4);
      ov(13, -12 - b, 6, 5.5, "#D2AE44", e.g + 4, .6);
      bande(15, -16 - b, 24, -24 - b, 1.2, "#7A5E1E", 0, 0);
      yeux(14, -13 - b, 2.4, 2, 1, 0, e.g, e.content);
      for (let i = 0; i < 3; i++) bande(-24 - i * 6, -10 + i * 3, -30 - i * 6, -10 + i * 3, 1.5, "rgba(255,255,255,.6)", i, 0);
    }
  }
});

ajouteMonde({
  id:"potager", nom:"Le Potager",
  mecanique:"Planter · faire pousser · arroser",
  accroche:"Les légumes doivent pousser avant de défendre. Choisis bien qui tu arroses !",
  histoire:"Les bestioles du jardin ont repéré le cageot de légumes du Centre. Plante tes défenseurs le long du chemin : ils mettent un peu de temps à pousser, alors anticipe !",
  regles:[
    "Choisis un légume en bas, puis pose-le sur l'herbe (pas sur le chemin).",
    "Un légume planté est d'abord une <b>petite pousse</b> : il lui faut quelques secondes pour grandir avant d'agir.",
    "Pour rendre un légume plus fort, <b>arrose-le</b> (de l'eau et des graines) : touche-le, puis « Arroser ». L'eau de l'arrosoir se remplit toute seule pendant les vagues, une goutte à la fois.",
    "Le <b>tournesol</b> ne repousse personne mais te donne des graines. L'<b>épouvantail</b> fait faire demi-tour.",
    "Les <b>taupes</b> plongent sous terre : impossible de les toucher tant qu'elles creusent !",
    "Si une bestiole atteint le cageot, elle emporte un légume. Garde-les tous !"
  ],
  pouvoirs:[
    { id:"averse", nom:"Averse", recharge:45,
      desc:"Une grosse pluie : tout le monde ralentit, les pousses grandissent d'un coup et l'arrosoir gagne une goutte.",
      icone(u){ ov(u*.5, u*.36, u*.34, u*.2, "#E9F2F7", 1, 1); ov(u*.32, u*.4, u*.16, u*.14, "#E9F2F7", 2, 0);
                for (let i = 0; i < 3; i++) fo([u*(.3 + i*.2), u*.62, u*(.34 + i*.2), u*.78, u*(.26 + i*.2), u*.78], "#5FB8E8", i, .3); },
      lance(J){
        for (const e of J.ennemis) ralentit(e, .45, 4);
        for (const t of J.tours) if (t.pousse < 1) t.pousse = 1;
        J.eau = Math.min(J.eauMax, J.eau + 1);
        for (let i = 0; i < 60; i++) J.effets.push({ genre:"goutte", x:alea(0, W), y:alea(-40, H - 60), t:-alea(0, .8), dur:.5, g:i });
        banniere("Averse !", false, 1200); majHUD(true);
      } },
    { id:"coccis", nom:"Coccinelles", recharge:28, cible:true, rayon:90,
      desc:"Une nuée de coccinelles s'abat là où tu touches et chasse tout ce qui s'y trouve pendant 4 secondes.",
      icone(u){ ov(u*.5, u*.55, u*.3, u*.28, "#E0533D", 1, 1); bande(u*.5, u*.3, u*.5, u*.82, 1.5, "#2B211B", 0, 0);
                ov(u*.5, u*.28, u*.14, u*.1, "#2B211B", 2, 0); for (const [x, y] of [[.38, .5], [.62, .5], [.4, .68], [.6, .68]]) ov(u*x, u*y, u*.06, u*.06, "#2B211B", 3, 0); },
      lance(J, p){ J.coccis.push({ x:p.x, y:p.y, fin:J.t + 4 }); } }
  ],
  conseil:"Plante tôt : un légume a besoin de temps pour pousser !",
  astuce:"<b>Astuce :</b> plante avant de lancer la vague, tes légumes auront le temps de pousser.",
  texteVictoire:"Le potager est sauvé !", texteDefaite:"Le cageot est vide…",
  nomVies:"Légumes", nomMonnaie:"Graines", texteVente:"Arracher",
  vies:10, argent:130, croissance:.1, attente:16, bonusAppel:1,
  couleurMonnaie:"#FFE38A", couleurFond:"#86BE57",
  apercu:{ tours:[["tomate", 280, 200], ["radis", 520, 300], ["tournesol", 120, 420]], ennemis:[["chenille", 430, 456, 1], ["escargot", 690, 168, 1], ["papillon", 330, 470, 1]] },
  tours:TOURS, ennemis:ENNEMIS,
  programme:{ budget:60, boss:"limace", ennemis:{
    chenille:{ des:1, menace:9 }, puceron:{ des:2, menace:6 }, sauterelle:{ des:4, menace:8 }, papillon:{ des:6, menace:5 },
    escargot:{ des:7, menace:15 }, taupe:{ des:10, menace:15 }, cloporte:{ des:13, menace:17 }, hanneton:{ des:16, menace:14 },
    criquet:{ des:19, menace:13 }
  } },

  iconeVie(u){ fo([u*.5, u*.95, u*.32, u*.32, u*.68, u*.32], "#F08A2C", 1, 1); bande(u*.36, u*.5, u*.5, u*.52, 1.4, "#C96A18", 0, 0);
               feuille(u*.5, u*.33, u*.3, u*.14, -Math.PI/2 - .4, "#4FA34A", 2, .5); feuille(u*.5, u*.33, u*.3, u*.14, -Math.PI/2 + .4, "#5DB656", 3, .5); },
  iconeMonnaie(u){ fo([u*.5, u*.12, u*.78, u*.55, u*.5, u*.9, u*.22, u*.55], "#E9C46A", 4, 1); bande(u*.5, u*.25, u*.5, u*.78, u*.07, "#B98B3A", 0, 0); },
  compteurs:[{
    cle:"eau", nom:"Eau de l'arrosoir",
    icone(u){ fo([u*.5, u*.08, u*.78, u*.58, u*.68, u*.82, u*.5, u*.9, u*.32, u*.82, u*.22, u*.58], "#4FA9DD", 6, 1); ov(u*.4, u*.6, u*.07, u*.11, "rgba(255,255,255,.6)", 0, 0); },
    valeur:(J) => `${J.eau}<small> / ${J.eauMax}</small>`
  }],

  cartes:CARTES, charge,
  init(J){
    if (J.carte !== undefined) charge(J.carte);
    J.occ = {}; J.eau = 2; J.eauMax = 5; J.eauT = 0; J.coccis = [];
  },
  maj(J, dt){
    for (const z of J.coccis) for (const e of J.ennemis) if (!e.mort && dist(z.x, z.y, e.x, e.y) < 90) blesse(e, 32 * dt * (1 + J.vague * .08), null, true);
    J.coccis = J.coccis.filter(z => z.fin > J.t);
    if (J.vague > 0 && J.eau < J.eauMax){
      J.eauT += dt;
      if (J.eauT >= EAU_TEMPS){ J.eauT = 0; J.eau++; texte("+1 goutte", 60, 30, "#BFE6FF", 16); son("eau"); majHUD(true); }
    }
  },
  emplacement(J, x, y){
    const gx = Math.floor(x / CASE), gy = Math.floor(y / CASE);
    if (gx < 0 || gy < 0 || gx >= 20 || gy >= 12) return null;
    const cle = gx + "," + gy;
    let raison = null;
    if (SUR_CHEMIN.has(cle)) raison = "Pas sur le chemin !";
    else if (BLOQUE.has(cle)) raison = "Pas ici !";
    else if (J.occ[cle]) raison = "Déjà planté";
    return { x:(gx + .5) * CASE, y:(gy + .5) * CASE + 4, ok:!raison, cle, raison };
  },
  dessineCase(J, emp){
    const [gx, gy] = emp.cle.split(",").map(Number);
    c.globalAlpha = .5; bx(gx * CASE + 3, gy * CASE + 3, CASE - 6, CASE - 6, emp.ok ? "#FFF6DA" : "#E0533D", 1, 0); c.globalAlpha = 1;
  },
  pose(J, t){ J.occ[t.cle] = t; t.pousse = 0; },
  retire(J, t){ delete J.occ[t.cle]; },
  actif(J, t, dt){
    if (t.pousse < 1){
      t.pousse = Math.min(1, t.pousse + dt / POUSSE);
      if (t.pousse >= 1){ texte("Prêt !", t.x, t.y - 40, "#fff", 15); confettis(t.x, t.y - 10, "#9AD15F", 6); }
      return false;
    }
    return true;
  },
  ameliore(J, t){
    if (t.pousse < 1){ if (J.eau < 1){ refuse("eau"); return false; } J.eau--; t.pousse = 1; arrosage(J, t); return false; }
    const cout = COUT_EAU[t.niv], p = prixAmelio(t);
    if (J.eau < cout){ refuse("eau"); return false; }
    if (J.argent < p){ refuse("argent"); return false; }
    J.eau -= cout; J.argent -= p; t.investi += p; arrosage(J, t);
    return true;
  },
  peutAmeliorer(J, t){ return t.pousse < 1 ? J.eau >= 1 : J.eau >= COUT_EAU[t.niv] && J.argent >= prixAmelio(t); },
  texteAvant(J, t){ return t.pousse < 1 ? "Arroser pour qu'il pousse · 1 💧" : null; },
  coutAmelio(J, t){ return `${prixAmelio(t)} + ${COUT_EAU[t.niv]} 💧`; },
  apresProd(J, t){ if (effet(t, "eau") && J.eau < J.eauMax){ J.eau++; texte("+1 goutte", t.x, t.y - 52, "#BFE6FF", 14); majHUD(true); } },
  infoTour(J, t){
    if (t.pousse < 1) return `Encore une pousse : <b>${Math.round(t.pousse * 100)} %</b>. Arrose-la pour qu'elle grandisse tout de suite.`;
    if (t.d === TOURS.epouvantail) return `Fait fuir pendant <b>${stat(t, "peur").toFixed(1)} s</b>, toutes les ${stat(t, "cadence").toFixed(1)} s.`;
    if (t.d.genre === "prod") return `Donne <b>${Math.round(stat(t, "prod"))} graines</b> toutes les ${t.d.cadence} s.`;
    if (t.d.genre === "aura") return `Ralentit de <b>${Math.round(lenteur(t) * 100)} %</b>.`;
    return `Force <b>${Math.round(stat(t, "deg"))}</b> · portée <b>${Math.round(stat(t, "portee"))}</b>`;
  },

  apparait(J, e, entree){
    e.ch = entree && entree.ch !== undefined ? entree.ch : Math.floor(Math.random() * CH.length);
    e.dist = entree && entree.dist !== undefined ? Math.max(0, entree.dist + alea(-12, 12)) : 0;
    e.dec = alea(-9, 9); e.ph = Math.random() * 3; e.z = 0;
    const p = point(e.dist, CH[e.ch]); e.x = p.x; e.y = p.y;
  },
  deplace(J, e, dt){
    let v = vitesse(e);
    if (e.d.saute){
      e.ph += dt * 1.7;
      const s = Math.sin(e.ph * Math.PI);
      v *= s > 0 ? 2.3 : .12; e.z = Math.max(0, s) * 18;
    }
    if (e.sous) v *= 1.6;
    if (e.peurT > J.t && !e.d.inarretable) v *= -.7;               /* l'épouvantail : demi-tour ! */
    const ch = CH[e.ch];
    e.dist = Math.max(0, e.dist + v * dt);
    const p = point(e.dist, ch);
    e.x = p.x - p.uy * e.dec; e.y = p.y + p.ux * e.dec;
    e.prog = e.dist - ch.long;
    return e.dist >= ch.long;
  },
  perdVie(J){ confettis((CARTE.cageot[0] + .5) * CASE, (CARTE.cageot[1] + .5) * CASE, ["#F08A2C", "#E5482F", "#5DB656"], 10); },

  fond(J){
    c.fillStyle = "#86BE57"; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 46; i++) ov(hache(i) * W, hache(i + 50) * H, 30 + hache(i + 9) * 50, 16 + hache(i + 7) * 22, i % 3 ? "#7DB54F" : "#92C862", i, 0);
    /* le chemin de terre battue (ou les chemins) */
    CH.forEach((ch, n) => { for (const s of ch.seg){
      const x2 = s.ax + s.ux * s.l, y2 = s.ay + s.uy * s.l;
      bande(s.ax - s.ux * 22, s.ay - s.uy * 22, x2 + s.ux * 22, y2 + s.uy * 22, 44, "#D8B27A", s.d0 + n * 50, 1.4);
    } });
    CH.forEach((ch, n) => { for (const s of ch.seg){
      const x2 = s.ax + s.ux * s.l, y2 = s.ay + s.uy * s.l;
      bande(s.ax - s.ux * 16, s.ay - s.uy * 16, x2 + s.ux * 16, y2 + s.uy * 16, 30, "#E4C38F", s.d0 + 3 + n * 50, 0);
    } });
    CH.forEach((ch, n) => { for (let i = 0; i < 50; i++){ const p = point(hache(i + 300 + n * 77) * ch.long, ch); ov(p.x + (hache(i + 1) - .5) * 30, p.y + (hache(i + 2) - .5) * 30, 2.5, 2, "#BE955D", i, 0); } });
    /* les entrées : des haies trouées */
    const gauche = CH.filter(ch => ch.P[0][0] < 0).map(ch => ch.P[0][1]), haut = CH.filter(ch => ch.P[0][1] < 0).map(ch => ch.P[0][0]);
    for (let y = 0; y < H; y += 26) if (gauche.every(e => Math.abs(y + 13 - e) > 30)) ov(6, y + 13, 16, 15, y % 52 ? "#4F9A43" : "#5AA84B", y, 1);
    if (haut.length) for (let x = 0; x < W; x += 26) if (haut.every(e => Math.abs(x + 13 - e) > 30)) ov(x + 13, 4, 15, 14, x % 52 ? "#4F9A43" : "#5AA84B", x + 3, 1);
    for (const [genre, gx, gy] of CARTE.decor) DECORS[genre](gx * CASE, gy * CASE, gx * 7 + gy);
    /* fleurs et touffes */
    for (let i = 0; i < 26; i++){
      const x = hache(i + 80) * W, y = hache(i + 120) * H;
      const cle = Math.floor(x / CASE) + "," + Math.floor(y / CASE);
      if (SUR_CHEMIN.has(cle) || BLOQUE.has(cle)) continue;
      if (i % 3){ for (let k = 0; k < 3; k++) feuille(x, y, 10, 4, -Math.PI / 2 + (k - 1) * .5, "#5E9E45", i + k, .4); }
      else { const coul = choixFixe(["#FFFFFF", "#F7D046", "#F28DB2"], i); for (let k = 0; k < 5; k++) ov(x + Math.cos(k * 1.26) * 4, y + Math.sin(k * 1.26) * 4, 3, 3, coul, i + k, .3); ov(x, y, 2, 2, "#F2B33B", 0, 0); }
    }
  },
  dessineSol(J){
    /* le cageot de légumes : ce qu'il reste à protéger */
    const x0 = CARTE.cageot[0] * CASE - 26, y0 = (CARTE.cageot[1] - 1) * CASE + 14;
    bx(x0, y0 + 30, 68, 60, "#C99A62", 61, 1.4);
    const nb = J.vies, pos = [];
    for (let i = 0; i < 10; i++) pos.push([x0 + 10 + (i % 4) * 15 + (Math.floor(i / 4) % 2) * 6, y0 + 26 - Math.floor(i / 4) * 9]);
    for (let i = 0; i < Math.min(nb, 10); i++){
      const [x, y] = pos[i];
      if (i % 3 === 0){ fo([x - 5, y, x + 5, y, x, y + 16], "#F08A2C", i, .6); feuille(x, y, 9, 4, -Math.PI/2 - .3, "#4FA34A", i, 0); }
      else if (i % 3 === 1){ ov(x, y + 4, 7, 6.5, "#E5482F", i, .6); etoile5(x, y - 1, 3, 1.2, VERT_F, i, 0); }
      else { ov(x, y + 4, 7, 7, "#B5D96F", i, .6); ov(x - 2, y + 2, 3, 2, "#D2EBA0", 0, 0); }
    }
    for (let i = 0; i < 3; i++) bande(x0 - 2, y0 + 44 + i * 16, x0 + 70, y0 + 44 + i * 16, 4, "#A97A45", i, .3);
    if (J.apercu) return;
    /* la jauge de l'arrosoir, discrète, en haut à gauche */
    if (J.eau < J.eauMax && J.vague > 0){
      const k = J.eauT / EAU_TEMPS;
      c.globalAlpha = .9;
      bx(14, 12, 64, 9, "rgba(51,38,29,.5)", 0, 0); bx(16, 14, 60 * k, 5, "#4FA9DD", 0, 0);
      c.globalAlpha = 1;
    }
  },
  dessineDessus(J){
    for (const z of J.coccis){
      c.globalAlpha = .18; c.beginPath(); c.arc(z.x, z.y, 90, 0, TAU); c.fillStyle = "#E0533D"; c.fill(); c.globalAlpha = 1;
      for (let i = 0; i < 9; i++){
        const a = J.t * (2 + i % 3) + i * 1.7, r = 20 + (i * 23) % 64;
        const x = z.x + Math.cos(a) * r, y = z.y + Math.sin(a * 1.3) * r * .7;
        c.save(); c.translate(x, y); c.rotate(a + Math.PI / 2);
        ov(0, 0, 6, 5, "#E0533D", i, .5); bande(0, -5, 0, 5, 1, "#2B211B", 0, 0); ov(0, -5, 3, 2.5, "#2B211B", i, 0);
        ov(-2.5, 1, 1.2, 1.2, "#2B211B", 0, 0); ov(2.5, 1, 1.2, 1.2, "#2B211B", 0, 0);
        c.restore();
      }
    }
    for (const e of J.ennemis) if (e.peurT > J.t) texteP("!", e.x, e.y - (e.d.hautBarre || 30) - 8, 18, "#E0533D", "center", "#fff");
  },
  dessineEffet(f, k){
    if (f.genre === "goutte"){ c.globalAlpha = 1 - k; fo([f.x, f.y - 6 + k * 30, f.x + 3, f.y + k * 30, f.x - 3, f.y + k * 30], "#4FA9DD", f.g, 0); c.globalAlpha = 1; }
  }
});

/* les décors des terrains, dessinés depuis le coin haut-gauche de leur première case */
const DECORS = {
  cabane(X, Y){
    bx(X + 14, Y + 18, 150, 66, "#B5754A", 41, 1.5);
    for (let i = 0; i < 6; i++) bande(X + 22 + i * 24, Y + 22, X + 22 + i * 24, Y + 80, 1.5, "#9A5F38", i, 0);
    fo([X + 2, Y + 24, X + 89, Y - 14, X + 3 * CASE + 30, Y + 24], "#C9493A", 42, 1.4);
    bx(X + 70, Y + 44, 30, 40, "#7A4A2C", 43, .6);
    ov(X + 94, Y + 64, 2.5, 2.5, "#F2B33B", 0, 0);
    bx(X + 22, Y + 36, 30, 22, "#CDE7F2", 44, .6); bande(X + 37, Y + 36, X + 37, Y + 58, 2, "#9A5F38", 0, 0);
  },
  compost(X, Y){
    bx(X + 8, Y + 6, 84, 80, "#8E6440", 51, 1.4);
    for (let i = 0; i < 4; i++) bande(X + 10, Y + 16 + i * 20, X + 90, Y + 16 + i * 20, 5, "#A87850", i, .4);
    ov(X + 50, Y + 6, 34, 10, "#6B4A2C", 52, .4);
    feuille(X + 30, Y + 4, 18, 8, -2.2, "#7FB84F", 53, .5); ov(X + 62, Y, 6, 5, "#E5482F", 54, .4);
  },
  pommier(X, Y, g){
    const x = X + CASE / 2, y = Y + CASE / 2;
    bx(x - 5, y - 4, 10, 22, "#8E6440", g, 1);
    ov(x, y - 14, 26, 22, "#4E9C45", g + 1, 1.4); ov(x - 9, y - 20, 12, 9, "#5DB656", g + 2, .4);
    for (let i = 0; i < 4; i++) ov(x - 12 + i * 8, y - 14 + (i % 2) * 8, 3.6, 3.6, "#E0533D", g + i, .3);
  },
  mare(X, Y, g){
    ov(X + CASE, Y + CASE, 44, 34, "#4FA9C9", g, 1.2); ov(X + CASE - 6, Y + CASE - 6, 30, 20, "#6FC0DB", g + 1, 0);
    for (let i = 0; i < 3; i++) ov(X + 30 + i * 18, Y + 50 - (i % 2) * 22, 7, 5, "#5DB656", g + i, .3);
    for (let i = 0; i < 4; i++) bande(X + 8 + i * 5, Y + 70, X + 6 + i * 6, Y + 44 - i * 3, 2, "#4F7A2E", i, 0);
  }
};
function arrosage(J, t){
  for (let i = 0; i < 9; i++) J.effets.push({ genre:"goutte", x:t.x + alea(-16, 16), y:t.y - 50 - alea(0, 20), t:-i * .04, dur:.5, g:i });
  son("eau");
}
function choixFixe(t, i){ return t[Math.floor(hache(i * 3.3) * t.length)]; }
}
