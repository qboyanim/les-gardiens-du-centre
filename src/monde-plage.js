/* ═════════════════════════════════════════════════════════════
   MONDE 3 — LE CHÂTEAU DE SABLE
   Cinq couloirs, de la mer au château. Les crabes PINCENT ce qui leur
   barre la route. La MARÉE monte régulièrement et emporte ce qui est
   posé trop près de l'eau. Et l'argent ne tombe pas tout seul : il
   faut RAMASSER les coquillages que la mer dépose sur le sable.
   ═════════════════════════════════════════════════════════════ */
{
const X0 = 168, CW = 84, NC = 8;
const RIVAGE = 150, CHATEAU = 860, LY0 = 76;
/* ═══ les trois terrains de la plage ═══
   couloirs : leur nombre · maree : colonnes noyées [début, après la vague 5] et calme entre deux marées
   rochers : cases où l'on ne construit pas · tresors : coquillages laissés par la mer */
const CARTES = [
  { nom:"La plage", desc:"Cinq couloirs et une marée qui monte de temps en temps. Le bon endroit pour apprendre.",
    couloirs:5, maree:[2, 3], calme:34, rochers:[], tresors:3 },
  { nom:"La crique", desc:"Seulement quatre couloirs, mais des rochers prennent de la place et la marée monte bien plus haut.",
    couloirs:4, maree:[3, 3], calme:32, rochers:[[2, 1], [5, 0], [4, 3], [6, 2], [1, 2]], tresors:4, programme:{ budget:40 } },
  { nom:"La grande marée", desc:"Six couloirs à surveiller et une mer qui revient sans arrêt… en laissant beaucoup de coquillages.",
    couloirs:6, maree:[3, 3], calme:24, rochers:[[3, 5], [6, 0]], tresors:6, programme:{ budget:47 } }
];
let CARTE = CARTES[0], NL = 5, LH = 98, ROCHERS = new Set(), MAREE = {};
function charge(k){
  CARTE = CARTES[k] || CARTES[0];
  NL = CARTE.couloirs; LH = (H - LY0) / NL;
  ROCHERS = new Set(CARTE.rochers.map(([c2, l]) => c2 + "," + l));
  MAREE = { calme:CARTE.calme, alerte:5, monte:2.5, haute:7, descend:2.5 };
}
charge(0);
const yLigne = (l) => LY0 + LH * l + LH / 2;
function mareeX(J){ const m = J.maree; return RIVAGE + (X0 + m.cols * CW - RIVAGE) * m.niveau; }

/* ── les défenseurs ── */
const TOURS = {
  pelle:{
    nom:"Pelle", prix:45, debloque:0, contre:[], genre:"tir", tir:"couloir", portee:720, cadence:1.15, deg:13, pv:80, couleurTir:"#E8C88A",
    desc:"Lance des boules de sable tout droit vers la mer, dans son couloir.",
    branches:[
      { nom:"Pelleteuse", desc:"Le sable traverse 3 bestioles d'affilée.", mods:{ deg:1.15 }, effets:{ perce:3 } },
      { nom:"Double pelle", desc:"Lance presque deux fois plus vite.", mods:{ cadence:.52 } }
    ],
    dessine(t, tm){
      ov(0, 12, 20, 7, "#E3BE7E", t.g, 1);
      c.save(); c.translate(0, 8); c.rotate(-.35 - t.recul * .9);
      bande(0, 0, 0, -34, 4, "#C98E4E", t.g, .8);
      bx(-5, -42, 10, 9, "#C98E4E", t.g + 1, .5);
      fo([-9, 2, 9, 2, 7, 18, 0, 22, -7, 18], "#E0533D", t.g + 2, 1);
      c.restore();
      if (t.recul > .3) ov(-18, -6, 6, 5, "#E8C88A", 1, .5);
    },
    dessineTir(p){ ov(0, 0, 7, 6, "#E8C88A", p.g, .6); ov(-2, -2, 2, 1.5, "#F6E0B0", 0, 0); }
  },
  muret:{
    nom:"Muret de sable", prix:30, debloque:0, contre:["mur"], genre:"mur", pv:320,
    desc:"Un mur bien tassé. Les crabes doivent le pincer longtemps avant de passer.",
    branches:[
      { nom:"Forteresse", desc:"Encore deux fois plus solide.", mods:{ pv:2 } },
      { nom:"Muret à oursins", desc:"Pique fort les crabes qui le pincent.", effets:{ epines:16 } }
    ],
    dessine(t){
      const k = t.pvMax ? t.pv / t.pvMax : 1;
      fo([-24, 14, 24, 14, 20, -22, -20, -22], "#E3BE7E", t.g, 1.3);
      for (let i = 0; i < 3; i++) bx(-22 + i * 15, -30, 12, 10, "#E3BE7E", t.g + i, .7);
      bande(-21, -6, 21, -6, 1.5, "#C9A061", 0, 0); bande(-20, 4, 20, 4, 1.5, "#C9A061", 0, 0);
      if (k < .66) bande(-8, -20, 2, 6, 1.6, "#A97E46", 1, 0);
      if (k < .33){ bande(6, -14, 14, 10, 1.6, "#A97E46", 2, 0); bande(-14, 0, -4, 12, 1.6, "#A97E46", 3, 0); }
      etoile5(0, -34, 4, 1.8, "#F28DB2", t.g, .3);
    }
  },
  mouette:{
    nom:"Mouette", prix:90, debloque:5, contre:["vole"], genre:"tir", portee:900, cadence:1.4, deg:18, pv:70, vitesseTir:520, cibles:"tout", couleurTir:"#DDE3E8", bouche:4, hauteurTir:44,
    desc:"Pique sur les bestioles de son couloir et des deux couloirs voisins. Attrape aussi les goélands.",
    branches:[
      { nom:"Grand goéland ami", desc:"Frappe beaucoup plus fort, critique souvent.", mods:{ deg:1.7 }, effets:{ crit:.2 } },
      { nom:"Volée de mouettes", desc:"Trois cibles à la fois.", effets:{ multi:2 } }
    ],
    dessine(t, tm){
      ov(0, 12, 12, 5, "#E3BE7E", t.g, .6);
      bx(-4, -30, 8, 44, "#B98A55", t.g, 1);
      const bat = t.recul > .1 ? Math.sin(tm * 30) : 0;
      c.save(); c.translate(0, -38);
      fo([-14, 2, 12, 2, 16, -6, 6, -12, -8, -10], "#FFFFFF", t.g + 1, 1);
      fo([-6, -6, 6, -6, -2 - bat * 6, -20 - bat * 6], "#C9D2D9", t.g + 2, .6);
      ov(12, -10, 7, 6.5, "#FFFFFF", t.g + 3, .6);
      fo([17, -10, 26, -8, 17, -6], "#F2B33B", t.g + 4, 0);
      ov(13.5, -12, 1.6, 1.6, "#2B211B", 0, 0);
      fo([-14, 2, -22, -2, -20, 4], "#9AA6B0", t.g + 5, 0);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.ang); fo([8, 0, -6, -4, -3, 0, -6, 4], "#FFFFFF", p.g, .4); bande(-5, 0, 5, 0, 1, "#C9D2D9", 0, 0); }
  },
  epuisette:{
    nom:"Épuisette", prix:40, debloque:4, contre:["armure", "bouclier"], pv:90, cadence:11,
    desc:"Attrape d'un coup la première bestiole qui entre dans sa case. Puis il faut la recharger.",
    branches:[
      { nom:"Filet de pêche", desc:"Se recharge deux fois plus vite.", mods:{ cadence:.5 } },
      { nom:"Grande épuisette", desc:"Attrape deux bestioles d'un coup.", effets:{ double:1 } }
    ],
    agit(J, t, dt){
      if (!t.charge){
        t.rech = (t.rech ?? 0) - dt;
        if (t.rech <= 0){ t.charge = true; }
        return;
      }
      let pris = 0;
      const max = 1 + effet(t, "double");
      for (const e of J.ennemis){
        if (e.mort || e.vole || e.ligne !== t.ligne || e.saut) continue;
        if (Math.abs(e.x - t.x) < 30 + (max > 1 ? 24 : 0)){
          if (e.d.boss){ blesse(e, 140 * mult(t, "deg"), t); texte("Trop gros !", t.x, t.y - 40, "#fff", 15); pris = max; }
          else { texte("Attrapé !", t.x, t.y - 40, "#fff", 16); t.degats += e.pv; repousse(e); pris++; }
          if (pris >= max) break;
        }
      }
      if (pris){
        t.charge = false; t.rech = stat(t, "cadence"); t.recul = 1;
        confettis(t.x, t.y - 10, ["#5FB8E8", "#FFFFFF"], 10);
      }
    },
    dessine(t, tm){
      const pret = t.charge !== false;
      ov(0, 12, 14, 5, "#E3BE7E", t.g, .6);
      if (pret){
        bande(-22, -26, 8, 4, 3.5, "#C98E4E", t.g, .8);
        ov(12, 8, 16, 7, "#2F8F6B", t.g + 1, .8);
        ov(12, 8, 12, 4.5, "rgba(255,255,255,.35)", t.g + 2, 0);
        c.strokeStyle = "rgba(20,70,50,.6)"; c.lineWidth = 1;
        for (let i = -2; i <= 2; i++){ c.beginPath(); c.moveTo(12 + i * 5, 2); c.lineTo(12 + i * 5, 14); c.stroke(); }
      } else {
        bande(-4, 10, 2, -30, 3.5, "#C98E4E", t.g, .8);
        ov(3, -36, 13, 9, "#2F8F6B", t.g + 1, .8);
        ov(3, -30, 9, 9, "rgba(47,143,107,.6)", t.g + 2, 0);
        const k = 1 - (t.rech || 0) / stat(t, "cadence");
        barre(0, -54, 26, k, "#5FB8E8");
      }
    }
  },
  seau:{
    nom:"Seau pêcheur", prix:50, debloque:2, contre:["eco"], pv:70, cadence:12,
    desc:"Remplit son seau de coquillages. Pense à venir les ramasser !",
    branches:[
      { nom:"Seau doré", desc:"Des coquillages bien plus gros.", mods:{ prod:1.7 } },
      { nom:"Seau aimanté", desc:"Ramasse tout seul les coquillages autour de lui.", effets:{ aimant:1 } }
    ],
    agit(J, t, dt){
      t.cd -= dt;
      if (t.cd > 0) return;
      t.cd = stat(t, "cadence");
      t.recul = 1;
      J.coqs.push({ x:t.x + alea(-24, 24), y:t.y + alea(10, 26), val:Math.round(13 * mult(t, "prod")), t:0, dur:14, g:(Math.random() * 99) | 0, saut:.5 });
    },
    dessine(t, tm){
      const q = 1 + t.recul * .1;
      c.save(); c.scale(q, 1 / q);
      fo([-14, -22, 14, -22, 10, 12, -10, 12], t.g % 2 ? "#3E9FC9" : "#E0533D", t.g, 1.2);
      ov(0, -22, 14, 4, t.g % 2 ? "#2F86AE" : "#C2402D", t.g + 1, .3);
      ov(-5, -24, 5, 3.5, "#F6C7B6", t.g + 2, .3); ov(5, -25, 4, 3, "#F3E3C3", t.g + 3, .3);
      c.beginPath(); c.ellipse(0, -22, 13, 16, 0, Math.PI, TAU); c.lineWidth = 2; c.strokeStyle = "#7D8B95"; c.stroke();
      etoile5(-4, -2, 5, 2.2, "#F2B33B", t.g, .3);
      c.restore();
    }
  },
  phare:{
    nom:"Petit phare", prix:75, debloque:10, contre:["soutien"], pv:90, buff:1,
    desc:"N'attaque pas, mais sa lumière fait tirer plus vite et plus fort les défenseurs des cases tout autour.",
    branches:[
      { nom:"Phare puissant", desc:"Sa lumière booste encore plus fort.", mods:{ buff:1.6 } },
      { nom:"Grand phare", desc:"Sa lumière porte à deux cases autour.", effets:{ large:1 } }
    ],
    dessine(t, tm){
      ov(0, 12, 16, 6, "#B9A27A", t.g, .8);
      fo([-11, 12, 11, 12, 7, -30, -7, -30], "#FFFFFF", t.g, 1.2);
      bande(-10, 2, 10, 2, 6, "#E0533D", t.g + 1, 0); bande(-8.5, -14, 8.5, -14, 6, "#E0533D", t.g + 2, 0);
      bx(-8, -40, 16, 11, "#F7E08A", t.g + 3, .6);
      fo([-10, -40, 10, -40, 0, -50], "#E0533D", t.g + 4, .6);
      if (!t.icone){
        const a = tm * 1.8 + t.g;
        c.globalAlpha = .28; fo([0, -35, Math.cos(a) * 70 - Math.sin(a) * 14, -35 + Math.sin(a) * 26 + Math.cos(a) * 6, Math.cos(a) * 70 + Math.sin(a) * 14, -35 + Math.sin(a) * 26 - Math.cos(a) * 6], "#FFF3B0", 0, 0);
        c.globalAlpha = 1;
      }
    }
  }
};
function eclaire(J, phare, t){
  if (phare === t || phare.d !== TOURS.phare) return false;
  const r = 1 + effet(phare, "large");
  return Math.abs(phare.col - t.col) <= r && Math.abs(phare.ligne - t.ligne) <= r;
}

/* ── les bestioles ── */
function pattesCrabe(tm, r, coul){
  for (const s of [-1, 1]) for (let i = 0; i < 3; i++){
    const a = Math.sin(tm * 16 + i * 1.7) * 3;
    bande(s * 3 + (i - 1) * 6, -4, s * 3 + (i - 1) * 7 + a, 4, 2, coul, i, 0);
  }
}
function pinces(tm, x, y, k, coul, ouvre){
  const o = ouvre ? Math.abs(Math.sin(tm * 10)) * .6 : .15;
  c.save(); c.translate(x, y);
  bande(-4, 4, 4, 0, 3 * k, coul, 1, .3);
  c.rotate(-o); fo([2, -1, 12 * k, -5 * k, 13 * k, 0], coul, 2, .5); c.rotate(o * 2); fo([2, 1, 12 * k, 5 * k, 13 * k, 0], coul, 3, .5);
  c.restore();
}
const ENNEMIS = {
  crabe:{
    nom:"Crabe", pv:50, vit:24, pince:12, prime:4, r:14, hautBarre:30, couleur:"#E86A3C",
    dessine(e, tm){
      pattesCrabe(e.anim, 14, "#C9522A");
      ov(0, -10, 15, 10, "#E86A3C", e.g, 1.1);
      ov(-4, -14, 6, 3, "rgba(255,255,255,.25)", 0, 0);
      pinces(e.anim, 12, -8, 1, "#E86A3C", e.pince);
      bande(4, -16, 4, -24, 1.6, "#C9522A", 0, 0); bande(9, -16, 10, -24, 1.6, "#C9522A", 0, 0);
      ov(4, -25, 2.6, 2.6, "#FFFDF6", 1, 0); ov(10, -25, 2.6, 2.6, "#FFFDF6", 2, 0);
      ov(4.8, -25, 1.3, 1.3, "#2B211B", 0, 0); ov(10.8, -25, 1.3, 1.3, "#2B211B", 0, 0); marqueTete(7, -28, .9);
      if (!e.content) sourire(6, -6, 3); else sourire(6, -8, 3.5);
    }
  },
  ermite:{
    nom:"Bernard-l'ermite", pv:35, coquille:70, vit:17, pince:10, prime:8, r:14, hautBarre:36, couleur:"#E8A33C", couleurCoquille:"#EADBC2",
    dessine(e, tm){
      pattesCrabe(e.anim, 10, "#D27A2C");
      ov(8, -8, 7, 6, "#E8A33C", e.g, .6);
      pinces(e.anim, 13, -6, .8, "#E8A33C", e.pince);
      bande(9, -12, 10, -20, 1.4, "#D27A2C", 0, 0);
      ov(10, -21, 2.2, 2.2, "#FFFDF6", 1, 0); ov(10.6, -21, 1.1, 1.1, "#2B211B", 0, 0); marqueTete(10, -23.5, .65);
      if (e.coquille > 0 || e.coquille === undefined){
        ov(-5, -14, 14, 13, "#EADBC2", e.g + 1, 1.1);
        ov(-4, -15, 9, 8.5, "#D9C2A0", e.g + 2, .4);
        ov(-3, -16, 4.5, 4.5, "#EADBC2", e.g + 3, .3);
        fo([-16, -6, -24, -2, -16, 0], "#D9C2A0", e.g + 4, .3);
      } else { ov(-4, -9, 9, 7, "#F6B98A", e.g + 5, .6); }
    }
  },
  tortue:{
    nom:"Tortue", pv:120, vit:14, pince:14, prime:14, r:16, hautBarre:34, couleur:"#5E9C5B",
    /* trop secouée, elle rentre dans sa carapace… puis repart en courant */
    blesse(J, e, deg){
      if (e.rentre > J.t) return deg * .1;
      e.cumul = (e.cumul || 0) + deg;
      if (e.cumul > e.pvMax * .3){ e.cumul = 0; e.rentre = J.t + 1.6; e.sprint = J.t + 3.8; texte("Cachée !", e.x, e.y - 40, "#fff", 13); }
      return deg;
    },
    dessine(e, tm){
      const cache = e.rentre > J.t;
      if (!cache){
        for (const [x, y] of [[-10, -2], [8, -2]]) ov(x + Math.sin(e.anim * 9 + x) * 2, y, 4, 3, "#7FBF6A", e.g + x, .4);
        ov(16, -9, 6, 5, "#7FBF6A", e.g + 1, .5);
        yeux(18, -10, 1.8, 1.6, 1, 0, e.g, e.content);
      }
      ov(0, -10, 16, cache ? 10 : 11, "#5E9C5B", e.g + 2, 1.1);
      for (const [x, y] of [[-7, -12], [0, -15], [7, -12], [-2, -7], [5, -7]]) ov(x, y, 3.5, 2.6, "#7DB873", e.g + x, 0);
    }
  },
  crevette:{
    nom:"Crevette", nuee:true, pv:28, vit:44, pince:6, prime:6, r:11, hautBarre:34, couleur:"#F28DA0", sauteur:true,
    dessine(e, tm){
      const z = e.z || 0; c.translate(0, -z);
      for (let i = 0; i < 5; i++){ const a = i * .45 - .2; ov(-14 + i * 6, -10 - Math.sin(a) * 6, 5.5 - i * .3, 5, i % 2 ? "#F7A5B4" : "#F28DA0", e.g + i, .6); }
      fo([-20, -12, -28, -18, -26, -6], "#F28DA0", e.g + 6, .4);
      ov(13, -12, 6, 5, "#F28DA0", e.g + 7, .6);
      c.beginPath(); c.moveTo(17, -15); c.quadraticCurveTo(28, -28, 34, -20); c.moveTo(16, -14); c.quadraticCurveTo(24, -32, 20, -36);
      c.strokeStyle = "#D96C80"; c.lineWidth = 1.2; c.stroke();
      yeux(14, -14, 1.8, 1.7, 1, 0, e.g, e.content);
      for (let i = 0; i < 4; i++) bande(-10 + i * 6, -6, -11 + i * 6 + Math.sin(e.anim * 20 + i) * 2, 0, 1.2, "#D96C80", i, 0);
    }
  },
  goeland:{
    nom:"Goéland chapardeur", pv:40, vit:38, prime:8, r:13, hautBarre:56, vole:true, couleur:"#E9EEF2", hautCible:34,
    dessine(e, tm){
      c.translate(0, -32 + Math.sin(e.anim * 4) * 3);
      ov(0, 30, 12, 4, "rgba(0,0,0,.08)", 0, 0);
      const a = Math.sin(e.anim * 9);
      fo([-6, -2, 6, -2, -4 - a * 4, -18 - a * 8, -14, -14 - a * 8], "#C9D2D9", e.g, .7);
      fo([-16, 2, 10, 2, 14, -4, 4, -8, -10, -6], "#E9EEF2", e.g + 1, 1);
      ov(12, -6, 6.5, 6, "#E9EEF2", e.g + 2, .5);
      fo([17, -6, 26, -5, 24, -2, 17, -3], "#F2B33B", e.g + 3, 0);
      ov(24, -3.5, 1.2, 1.2, "#E0533D", 0, 0);
      ov(13.5, -8, 1.6, 1.6, "#2B211B", 0, 0); marqueTete(12, -11.5, .8);
      bande(10, -11, 16, -10, 1.2, "#2B211B", 0, 0);
      fo([-6, -2, 6, -2, 2 + a * 4, 12 + a * 8, -8, 10 + a * 8], "#B7C2CA", e.g + 4, .5);
    }
  },
  royal:{
    enerve(J, e){ for (const d of [-1, 1, -1, 1]) creeEnnemi("crabe", { ligne:borne(e.ligne + d, 0, NL - 1), x:e.x - alea(0, 60) }); },
    nom:"Crabe royal", pv:1100, vit:9, pince:60, prime:120, degats:3, r:30, hautBarre:64, boss:true, couleur:"#C9372A",
    dessine(e, tm){
      c.scale(2, 2);
      pattesCrabe(e.anim, 14, "#A12A20");
      ov(0, -10, 15, 10, "#C9372A", e.g, .8);
      ov(-4, -14, 6, 3, "rgba(255,255,255,.25)", 0, 0);
      pinces(e.anim, 12, -8, 1, "#C9372A", e.pince);
      bande(4, -16, 4, -22, 1.4, "#A12A20", 0, 0); bande(9, -16, 10, -22, 1.4, "#A12A20", 0, 0);
      ov(4, -23, 2.4, 2.4, "#FFFDF6", 1, 0); ov(10, -23, 2.4, 2.4, "#FFFDF6", 2, 0);
      ov(4.8, -23, 1.2, 1.2, "#2B211B", 0, 0); ov(10.8, -23, 1.2, 1.2, "#2B211B", 0, 0);
      fo([-7, -18, -6, -27, -2, -21, 1, -29, 4, -21, 8, -27, 8, -18], "#F2B33B", e.g + 3, .4);
      sourire(5, -6, 3);
    }
  }
};

/* ═══ les renforts de la plage : ils se débloquent au fil des 30 vagues ═══ */
Object.assign(TOURS, {
  bouee:{
    nom:"Bouée", prix:60, debloque:6, contre:["rapide"], flotte:true, traversable:true, genre:"aura", portee:48, lent:.45, effets:{ pique:5 },
    desc:"La seule chose qu'on peut poser dans l'eau : la marée ne l'emporte pas. Les bestioles passent dessous en ralentissant.",
    branches:[
      { nom:"Bouée canard", desc:"Ralentit beaucoup plus.", mods:{ lent:1.6 } },
      { nom:"Bouée à piquants", desc:"Pique fort ce qui passe dessous.", effets:{ pique:16 } }
    ],
    dessine(t, tm){
      const f = Math.sin(tm * 2 + t.g) * 2;
      c.save(); c.translate(0, f);
      ov(0, 4, 20, 11, "#E0533D", t.g, 1); ov(0, 4, 9, 5, "#4FB3C9", t.g + 1, 0);
      for (const a of [0, 1.57, 3.14, 4.71]) ov(Math.cos(a) * 15, 4 + Math.sin(a) * 8, 4, 3.5, "#FFFFFF", t.g + a, 0);
      c.restore();
    }
  },
  rateau:{
    nom:"Râteau", prix:110, debloque:8, contre:["armure"], genre:"tir", tir:"couloir", percant:true, portee:720, cadence:1.4, deg:32, pv:90, couleurTir:"#C98E4E",
    desc:"Ratisse dans son couloir : ses dents passent à travers les carapaces des homards.",
    branches:[
      { nom:"Grand râteau", desc:"Frappe bien plus fort.", mods:{ deg:1.6 } },
      { nom:"Râteau à dents longues", desc:"Traverse 2 bestioles d'affilée.", effets:{ perce:2 } }
    ],
    dessine(t, tm){
      ov(0, 12, 18, 6, "#E3BE7E", t.g, .8);
      c.save(); c.translate(0, 8); c.rotate(.4 - t.recul * .8);
      bande(0, 0, 0, -36, 3.5, "#C98E4E", t.g, .8);
      bande(-12, -36, 12, -36, 4, "#3E9FC9", t.g + 1, .5);
      for (let i = -2; i <= 2; i++) bande(i * 5, -36, i * 5, -44, 2, "#3E9FC9", i + 3, 0);
      c.restore();
    },
    dessineTir(p){ for (let i = -1; i <= 1; i++) bande(-6, i * 4, 6, i * 4, 2, "#C98E4E", i + 2, .3); }
  },
  moulinet:{
    nom:"Moulinet", prix:160, debloque:12, contre:["bouclier"], genre:"tir", tir:"couloir", portee:720, cadence:.16, deg:4.2, pv:70, couleurTir:"#F6E0B0",
    desc:"Le vent le fait tourner et il crache des grains de sable sans arrêt : idéal pour casser les boucliers des oursins.",
    branches:[
      { nom:"Moulinet tempête", desc:"Tourne encore plus vite.", mods:{ cadence:.6 } },
      { nom:"Moulinet à galets", desc:"Des galets plus lourds.", mods:{ deg:1.8 } }
    ],
    dessine(t, tm){
      ov(0, 12, 14, 5, "#E3BE7E", t.g, .6);
      bande(0, 12, 0, -24, 3, "#9A7046", t.g, .8);
      c.save(); c.translate(0, -26); c.rotate(tm * (6 + t.recul * 8));
      for (let i = 0; i < 4; i++) feuille(0, 0, 16, 10, i * Math.PI / 2, ["#E0533D", "#F2B33B", "#3E9FC9", "#2F8F6B"][i], t.g + i, .3);
      c.restore(); ov(0, -26, 3, 3, "#FFFFFF", 0, 0);
    },
    dessineTir(p){ ov(0, 0, 3, 3, "#F6E0B0", p.g, .2); }
  },
  patecanon:{
    nom:"Canon à pâtés", prix:220, debloque:14, contre:["nuee"], genre:"tir", tir:"lob", troisCouloirs:true, cibles:"sol", portee:900, cadence:2.6, deg:42, splash:70, pv:90, vitesseTir:280, couleurTir:"#E8C88A", hauteurTir:16,
    desc:"Envoie de gros pâtés de sable qui éclatent sur un groupe, dans trois couloirs.",
    branches:[
      { nom:"Pâté géant", desc:"Une explosion bien plus large.", mods:{ splash:1.4, deg:1.2 } },
      { nom:"Pâtés mouillés", desc:"Le sable mouillé colle et ralentit.", effets:{ lent:.4 } }
    ],
    dessine(t, tm){
      ov(0, 12, 20, 7, "#E3BE7E", t.g, .8);
      ov(-10, 8, 7, 7, "#8E6440", t.g + 1, .5); ov(10, 8, 7, 7, "#8E6440", t.g + 2, .5);
      c.save(); c.rotate(-.5 - t.recul * .3);
      fo([-8, 4, 8, 4, 10, -24, -10, -24], "#E0533D", t.g + 3, 1);
      bande(-10, -18, 10, -18, 3, "#F2B33B", 0, 0);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.age * 5); fo([-7, 6, 7, 6, 5, -4, -5, -4], "#E8C88A", p.g, .4); bx(-5, -8, 10, 4, "#E8C88A", p.g + 1, 0); }
  },
  lunette:{
    nom:"Longue-vue", prix:130, debloque:16, contre:["invisible"], detecte:true, portee:260, pv:60,
    desc:"Le sauveteur repère tout : autour d'elle, les pieuvres camouflées deviennent visibles.",
    branches:[
      { nom:"Grande longue-vue", desc:"Repère beaucoup plus loin.", mods:{ portee:1.45 } },
      { nom:"Longue-vue du capitaine", desc:"Ses indications font tirer plus fort les défenseurs voisins.", effets:{ conseil:1 } }
    ],
    dessine(t, tm){
      ov(0, 12, 12, 5, "#B9A27A", t.g, .6);
      bande(-8, 12, 0, -10, 2.5, "#8E6440", t.g, .5); bande(8, 12, 0, -10, 2.5, "#8E6440", t.g + 1, .5);
      c.save(); c.translate(0, -12); c.rotate(-.35 + Math.sin(tm * .7 + t.g) * .3);
      bx(-16, -5, 22, 10, "#C98E4E", t.g + 2, .8); bx(4, -6, 12, 12, "#F2B33B", t.g + 3, .5); ov(16, 0, 3, 5, "#BFE6FF", 0, 0);
      c.restore();
    }
  },
  pelican:{
    nom:"Pélican", prix:280, debloque:19, contre:["vole"], pv:90, cadence:6,
    desc:"Il gobe d'un coup le premier goéland qui passe dans ses trois couloirs. Puis il digère un moment.",
    branches:[
      { nom:"Pélican gourmand", desc:"Digère deux fois plus vite.", mods:{ cadence:.5 } },
      { nom:"Pélican pêcheur", desc:"Gobe aussi les bestioles à pattes.", effets:{ sol:1 } }
    ],
    agit(J, t, dt){
      t.cd -= dt; if (t.cd > 0) return;
      let cible = null;
      for (const e of J.ennemis){
        if (e.mort || e.cache || Math.abs(e.ligne - t.ligne) > 1 || e.x > t.x + 40) continue;
        if (!e.vole && !effet(t, "sol")) continue;
        if (!cible || e.x > cible.x) cible = e;
      }
      if (!cible){ t.cd = .2; return; }
      if (cible.d.boss || cible.geant) blesse(cible, 300 * mult(t, "deg"), t);
      else { texte("Gobé !", cible.x, cible.y - 40, "#fff", 16); t.degats += cible.pv; repousse(cible); }
      confettis(cible.x, cible.y - 20, ["#FFFFFF", "#F2B33B"], 10);
      t.recul = 1; t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      ov(0, 12, 14, 5, "#E3BE7E", t.g, .6);
      const pret = !(t.cd > 1);
      ov(-2, -10, 14, 12, "#FFFFFF", t.g, 1);
      fo([-14, -12, -24, -6, -14, -4], "#E9EEF2", t.g + 1, .3);
      ov(8, -26, 7, 7, "#FFFFFF", t.g + 2, .6);
      fo([12, -28, 34, -22, 12, -20], "#F2B33B", t.g + 3, .4);
      ov(22, -18, pret ? 8 : 12, pret ? 4 : 8, "#F7C96A", t.g + 4, .3);
      ov(9, -28, 1.6, 1.6, "#2B211B", 0, 0);
      bande(-4, 1, -6, 12, 2, "#F2B33B", 0, 0); bande(2, 1, 4, 12, 2, "#F2B33B", 0, 0);
    }
  },
  sousmarin:{
    nom:"Sous-marin jaune", prix:420, debloque:22, contre:["boss", "armure"], genre:"tir", tir:"couloir", percant:true, pourcent:.07, portee:720, cadence:3.2, deg:60, pv:120, couleurTir:"#F2B33B", effets:{ perce:1 },
    desc:"Lance des torpilles de bulles qui retirent une part de la vie de ce qu'elles touchent : parfait contre le crabe royal et les géants.",
    branches:[
      { nom:"Torpilles doubles", desc:"Tire presque deux fois plus vite.", mods:{ cadence:.55 } },
      { nom:"Grosse torpille", desc:"Retire une part encore plus grande.", mods:{ deg:1.4 }, effets:{ pourcentPlus:.04, perce:1 } }
    ],
    dessine(t, tm){
      ov(0, 12, 22, 6, "#4FB3C9", t.g, .6);
      ov(0, -2, 22, 11, "#F2B33B", t.g + 1, 1.1);
      bx(-4, -20, 12, 10, "#F2B33B", t.g + 2, .6); bande(4, -20, 4, -28, 2, "#8E6440", 0, 0); bande(4, -28, 10, -28, 2, "#8E6440", 0, 0);
      for (let i = 0; i < 3; i++) ov(-12 + i * 9, -2, 3, 3, "#BFE6FF", i, 0);
      feuille(20, -2, 8, 6, 0, "#E0A030", t.g + 3, 0);
    },
    dessineTir(p){ ov(0, 0, 10, 4, "#F2B33B", p.g, .4); ov(-10, 0, 3, 3, "rgba(255,255,255,.8)", 0, 0); }
  }
});

Object.assign(ENNEMIS, {
  homard:{
    nom:"Homard", pv:140, vit:15, pince:22, prime:16, r:17, hautBarre:36, armure:6, couleur:"#B8322A",
    dessine(e, tm){
      pattesCrabe(e.anim, 14, "#8E2620");
      for (let i = 0; i < 3; i++) ov(-14 + i * 7, -9, 7, 7, i % 2 ? "#C93A30" : "#B8322A", e.g + i, .6);
      fo([-28, -6, -20, -14, -20, 0], "#B8322A", e.g + 4, .4);
      ov(6, -10, 10, 8, "#C93A30", e.g + 5, 1);
      pinces(e.anim, 14, -12, 1.3, "#B8322A", e.pince);
      bande(10, -16, 22, -30, 1, "#8E2620", 0, 0); bande(12, -16, 26, -24, 1, "#8E2620", 0, 0);
      yeux(9, -14, 2.4, 2, 1, 0, e.g, e.content);
    }
  },
  oursin:{
    nom:"Oursin", pv:55, vit:18, pince:8, prime:11, r:13, hautBarre:30, bouclier:7, couleur:"#4A2E5E",
    dessine(e, tm){
      const b = Math.sin(e.anim * 8) * 1.5;
      for (let i = 0; i < 14; i++){ const a = i / 14 * TAU + e.anim * .3; bande(Math.cos(a) * 8, -11 + Math.sin(a) * 8, Math.cos(a) * 17, -11 + Math.sin(a) * 15 + b, 1.6, "#6B4A80", i, 0); }
      ov(0, -11, 11, 10, "#4A2E5E", e.g, 1);
      yeux(3, -12, 2.6, 2.2, 1, 0, e.g, e.content);
    }
  },
  pieuvre:{
    nom:"Pieuvre camouflée", pv:70, vit:22, pince:12, prime:12, r:14, hautBarre:34, furtif:true, couleur:"#E37C9A",
    dessine(e, tm){
      if (e.cache) c.globalAlpha *= .2;
      for (let i = 0; i < 5; i++){ const x = -12 + i * 6, o = Math.sin(e.anim * 8 + i) * 3; bande(x, -6, x + o - 3, 4, 3.5, "#D96A88", i, e.cache ? 0 : .3); }
      ov(0, -15, 13, 12, "#E37C9A", e.g, e.cache ? 0 : 1);
      ov(-4, -20, 4, 3, "rgba(255,255,255,.3)", 0, 0);
      yeux(4, -14, 2.6, 2.2, 1, 0, e.g, e.content);
      if (e.cache) c.globalAlpha = 1;
    }
  }
});

ajouteMonde({
  id:"plage", nom:"Le Château de sable",
  mecanique:"Couloirs · marée · ramassage",
  accroche:"La marée monte et emporte tout ! Ramasse les coquillages pour payer tes défenses.",
  histoire:"Le plus beau château de sable de la colo est sur la plage… et les crabes ont décidé de s'y installer ! Ils sortent de la mer et avancent chacun dans leur couloir.",
  regles:[
    "Les bestioles avancent <b>tout droit dans leur couloir</b>, de la mer vers le château.",
    "Elles <b>pincent</b> tout ce qui leur barre la route : un muret les retient longtemps.",
    "Les coquillages sont ton argent : <b>touche-les pour les ramasser</b> avant qu'ils disparaissent. La mer en dépose après chaque marée !",
    "Toutes les 30 secondes environ, <b>la marée monte</b> : les cases rayées de rouge vont être recouvertes, et ce qui s'y trouve est emporté.",
    "Dans l'eau, les crabes vont plus vite. Les <b>goélands</b> volent par-dessus les murets : seule la mouette les attrape.",
    "Le <b>petit phare</b> booste tous les défenseurs autour de lui. Les <b>tortues</b> se cachent dans leur carapace quand on les tape trop."
  ],
  pouvoirs:[
    { id:"vague", nom:"Grosse vague", recharge:28, cible:true,
      desc:"Une vague déferle dans un couloir : toutes les bestioles qui s'y trouvent sont renvoyées vers la mer.",
      icone(u){ fo([u*.08, u*.8, u*.2, u*.4, u*.5, u*.2, u*.8, u*.32, u*.62, u*.42, u*.7, u*.62, u*.92, u*.8], "#4FB3C9", 1, 1); fo([u*.5, u*.2, u*.8, u*.32, u*.62, u*.38], "#FFFFFF", 2, 0); },
      apercu(J, p){
        const l = borne(Math.floor((p.y - LY0) / LH), 0, NL - 1);
        c.fillStyle = "rgba(79,179,201,.35)"; c.fillRect(RIVAGE, LY0 + l * LH + 4, CHATEAU - RIVAGE, LH - 8);
        c.setLineDash([8, 6]); c.lineWidth = 3; c.strokeStyle = "#FFFFFF"; c.strokeRect(RIVAGE, LY0 + l * LH + 4, CHATEAU - RIVAGE, LH - 8); c.setLineDash([]);
      },
      lance(J, p){
        const l = borne(Math.floor((p.y - LY0) / LH), 0, NL - 1);
        for (const e of J.ennemis) if (e.ligne === l && !e.vole){ e.x = Math.max(20, e.x - (e.d.boss ? 90 : 220)); e.saut = null; e.z = 0; blesse(e, 20, null); }
        J.vagueLigne = { l, t:J.t };
        for (let i = 0; i < 16; i++) confettis(alea(RIVAGE, CHATEAU), yLigne(l) + alea(-30, 30), ["#9FD8EE", "#FFFFFF"], 1);
      } },
    { id:"mouille", nom:"Sable mouillé", recharge:50,
      desc:"Tout le sable devient collant : les bestioles ralentissent beaucoup, et tes défenseurs abîmés sont réparés.",
      icone(u){ ov(u*.5, u*.62, u*.38, u*.22, "#E3BE7E", 1, 1); for (let i = 0; i < 3; i++) fo([u*(.3 + i*.2), u*.12, u*(.36 + i*.2), u*.36, u*(.24 + i*.2), u*.36], "#4FA9DD", i, .3); },
      lance(J){
        for (const e of J.ennemis) if (!e.vole) ralentit(e, .35, 5);
        for (const t of J.tours) if (t.pvMax){ t.pv = Math.min(t.pvMax, t.pv + t.pvMax * .6); }
        J.mouilleT = J.t + 5; banniere("Sable mouillé !", false, 1200);
      } }
  ],
  conseil:"Ramasse tous les coquillages, et ne construis pas trop près de la mer !",
  astuce:"<b>Astuce :</b> touche les coquillages qui brillent sur le sable pour les ramasser.",
  texteVictoire:"Le château tient bon !", texteDefaite:"Les crabes ont pris le château…",
  nomVies:"Drapeaux", nomMonnaie:"Coquillages", texteVente:"Démonter",
  vies:8, argent:150, croissance:.06, attente:18,
  couleurMonnaie:"#FFE0EC", couleurFond:"#F2D49B",
  apercu:{ tours:[["pelle", X0 + CW * 5.5, yLigne(1) + 8], ["muret", X0 + CW * 3.5, yLigne(2) + 8], ["mouette", X0 + CW * 6.5, yLigne(3) + 8], ["seau", X0 + CW * 7.5, yLigne(0) + 8]],
           ennemis:[["crabe", X0 + CW * 2.6, yLigne(2) + 12, 1], ["ermite", X0 + CW * 1.5, yLigne(1) + 12, 1], ["crevette", X0 + CW * 3, yLigne(4) + 12, 1]] },
  tours:TOURS, ennemis:ENNEMIS,
  programme:{ budget:34, boss:"royal", ennemis:{
    crabe:{ des:1, menace:6 }, crevette:{ des:3, menace:6 }, ermite:{ des:5, menace:11 }, goeland:{ des:7, menace:9 },
    tortue:{ des:9, menace:18 }, homard:{ des:10, menace:24 }, oursin:{ des:13, menace:15 }, pieuvre:{ des:18, menace:17 }
  } },
  entreeGroupe:(v, x) => { const m = Math.floor(NL / 2); return v <= 2 ? m : v <= 4 ? [m - 1, m, m + 1] : x < .3 ? Math.floor(x / .3 * NL) : null; },

  iconeVie(u){ bande(u*.3, u*.92, u*.3, u*.1, u*.06, "#8E6440", 0, .4); fo([u*.32, u*.1, u*.86, u*.26, u*.32, u*.44], "#E0533D", 2, .8); },
  iconeMonnaie(u){
    c.save(); c.translate(u*.5, u*.56);
    for (let i = 0; i < 7; i++) feuille(0, u*.3, u*.62, u*.2, -Math.PI/2 + (i - 3) * .28, i % 2 ? "#F6C7B6" : "#F3B3A0", i, i ? 0 : .8);
    ov(0, u*.32, u*.14, u*.08, "#E89A86", 9, 0);
    c.restore();
  },

  cartes:CARTES, charge, geo:() => ({ X0, CW, NC, NL, yLigne }),
  init(J){
    if (J.carte !== undefined) charge(J.carte);
    J.occ = {}; J.coqs = []; J.coqT = 3;
    J.maree = { phase:"calme", t:MAREE.calme + 6, niveau:0, cols:2 };
    if (J.apercu) J.coqs.push({ x:X0 + CW * 4.5, y:yLigne(3) + 20, val:10, t:0, dur:99, g:1 }, { x:X0 + CW * 1.4, y:yLigne(0) + 26, val:10, t:0, dur:99, g:2 });
  },
  maj(J, dt){
    /* les coquillages */
    for (const s of J.coqs){ s.t += dt; if (s.saut) s.saut = Math.max(0, s.saut - dt); }
    /* le seau aimanté ramasse ce qui traîne près de lui */
    for (const t of J.tours) if (effet(t, "aimant")) for (const s of [...J.coqs]) if (s.t > .8 && dist(s.x, s.y, t.x, t.y) < 150) ramasse(J, s);
    J.coqs = J.coqs.filter(s => s.t < s.dur && s.x > mareeX(J) - 10 || s.t < .1);
    if (J.vague > 0){
      J.coqT -= dt;
      if (J.coqT <= 0){ J.coqT = alea(5, 7.5); semeCoquillage(J, 8); }
    }
    /* la marée */
    if (J.vague === 0) return;
    const m = J.maree;
    m.t -= dt;
    if (m.phase === "calme" && m.t <= 0){
      m.phase = "alerte"; m.t = MAREE.alerte; m.cols = CARTE.maree[J.vague < 6 ? 0 : 1];
      banniere("La marée monte !", true, 2400); son("alerte");
    } else if (m.phase === "alerte" && m.t <= 0){ m.phase = "monte"; m.t = MAREE.monte; }
    else if (m.phase === "monte"){
      m.niveau = 1 - Math.max(0, m.t) / MAREE.monte;
      const mx = mareeX(J);
      for (const t of [...J.tours]) if (t.x - 20 < mx && !t.d.flotte){
        texte("Emporté !", t.x, t.y - 30, "#fff", 15);
        confettis(t.x, t.y, ["#9FD8EE", "#FFFFFF"], 12);
        retireTour(t, "maree");
      }
      if (m.t <= 0){ m.phase = "haute"; m.t = MAREE.haute; m.niveau = 1; }
    }
    else if (m.phase === "haute" && m.t <= 0){ m.phase = "descend"; m.t = MAREE.descend; }
    else if (m.phase === "descend"){
      m.niveau = Math.max(0, m.t) / MAREE.descend;
      if (m.t <= 0){
        m.phase = "calme"; m.t = MAREE.calme; m.niveau = 0;
        const n = CARTE.tresors + Math.floor(Math.random() * 2);
        for (let i = 0; i < n; i++){
          const col = Math.floor(Math.random() * m.cols), l = Math.floor(Math.random() * NL);
          J.coqs.push({ x:X0 + col * CW + alea(18, CW - 18), y:yLigne(l) + alea(4, 34), val:12, t:0, dur:16, g:(Math.random() * 99) | 0, tresor:true, saut:.5 });
        }
        texte("La mer a laissé des coquillages !", 330, 60, "#FFE0EC", 18);
      }
    }
  },
  clic(J, p){
    let meilleur = null, md = 34;
    for (const s of J.coqs){ const d = dist(p.x, p.y, s.x, s.y - 4); if (d < md){ md = d; meilleur = s; } }
    if (!meilleur) return false;
    ramasse(J, meilleur);
    return true;
  },
  /* le phare booste les défenseurs autour */
  buff(J, t, k){
    if (k !== "cadence" && k !== "deg") return 1;
    let b = 0;
    for (const p of J.tours) if (eclaire(J, p, t)) b = Math.max(b, .25 * [1, 1.3, 1.6][p.niv - 1] * mult(p, "buff"));
    if (k === "deg") for (const p of J.tours) if (p !== t && effet(p, "conseil") && dist(p.x, p.y, t.x, t.y) < 200) b = Math.max(b, .3);
    return k === "cadence" ? 1 / (1 + b) : 1 + b * .8;
  },
  posCadeau(J){ return { x:alea(Math.max(X0, mareeX(J) + 30), CHATEAU - 30), y:alea(LY0 + 30, H - 30) }; },
  emplacement(J, x, y, type){
    const cc = Math.floor((x - X0) / CW), ll = Math.floor((y - LY0) / LH);
    if (ROCHERS.has(cc + "," + ll)) return { x:X0 + cc * CW + CW / 2, y:yLigne(ll) + 8, cle:cc + "," + ll, col:cc, ligne:ll, ok:false, raison:"Un rocher est là" };
    const col = Math.floor((x - X0) / CW), l = Math.floor((y - LY0) / LH);
    if (col < 0 || col >= NC || l < 0 || l >= NL) return null;
    const cle = col + "," + l, cx = X0 + col * CW + CW / 2;
    const res = { x:cx, y:yLigne(l) + 8, cle, col, ligne:l, ok:false, raison:null };
    if (J.occ[cle]) res.raison = "Déjà construit";
    else if (cx - 20 < mareeX(J) + 4 && !(type && TOURS[type] && TOURS[type].flotte)) res.raison = "La mer est là !";
    else res.ok = true;
    return res;
  },
  dessineCase(J, emp){
    c.globalAlpha = .45; bx(X0 + emp.col * CW + 3, LY0 + emp.ligne * LH + 3, CW - 6, LH - 6, emp.ok ? "#FFF6DA" : "#E0533D", 1, 0); c.globalAlpha = 1;
  },
  dessinePortee(x, y, t, ok){
    const l = t.ligne ?? Math.floor((y - 8 - LY0) / LH);
    c.fillStyle = ok ? "rgba(255,255,255,.22)" : "rgba(224,83,61,.2)";
    if (t.d.tir === "couloir") c.fillRect(0, LY0 + l * LH + 6, x, LH - 12);
    else if (t.d === TOURS.mouette || t.d.troisCouloirs) c.fillRect(0, LY0 + Math.max(0, l - 1) * LH + 6, x + 40, (Math.min(NL - 1, l + 1) - Math.max(0, l - 1) + 1) * LH - 12);
    else if (t.d === TOURS.epuisette) c.fillRect(x - 32, LY0 + l * LH + 6, 64, LH - 12);
    else if (t.d === TOURS.phare){
      const col = Math.floor((x - X0) / CW), r = 1 + effet(t, "large");
      c.fillRect(X0 + (col - r) * CW, LY0 + (l - r) * LH, (2 * r + 1) * CW, (2 * r + 1) * LH);
    }
  },
  pose(J, t, emp){ J.occ[t.cle] = t; t.ligne = emp.ligne; t.col = emp.col; t.charge = true; t.cd = t.d === TOURS.seau ? 4 : t.cd; },
  retire(J, t){ delete J.occ[t.cle]; },
  vise(J, t, e){
    if (t.d.tir === "couloir") return e.ligne === t.ligne && !e.vole && e.x < t.x + 10;
    if (t.d === TOURS.mouette || t.d.troisCouloirs) return Math.abs(e.ligne - t.ligne) <= 1 && e.x < t.x + 40;
    return true;
  },
  prepareTir(J, t, e, p){
    if (p.genre === "couloir"){ p.vx = -400; p.ligne = t.ligne; p.y = t.y - 12; p.x = t.x - 16; }
  },
  infoTour(J, t){
    const pv = t.pvMax ? `Solidité <b>${Math.ceil(t.pv)}</b> / ${t.pvMax}` : "";
    if (t.d === TOURS.seau) return `Remplit ${Math.round(13 * mult(t, "prod"))} coquillages toutes les ${Math.round(stat(t, "cadence"))} s. ${pv}`;
    if (t.d === TOURS.epuisette) return `Se recharge en ${Math.round(stat(t, "cadence"))} s. ${pv}`;
    if (t.d === TOURS.muret) return pv;
    if (t.d === TOURS.phare) return `Boost de <b>+${Math.round(25 * [1, 1.3, 1.6][t.niv - 1] * mult(t, "buff"))} %</b> sur les cases autour. ${pv}`;
    return `Force <b>${Math.round(stat(t, "deg"))}</b>. ${pv}`;
  },

  apparait(J, e, entree){
    if (entree && typeof entree === "object" && !Array.isArray(entree)){ e.ligne = entree.ligne; e.x = Math.max(10, entree.x); e.y = yLigne(e.ligne) + 14; e.z = 0; return; }
    e.ligne = Array.isArray(entree) ? choix(entree) : entree ?? Math.floor(Math.random() * NL);
    e.x = alea(10, 40); e.y = yLigne(e.ligne) + 14 + alea(-6, 6); e.z = 0;
  },
  deplace(J, e, dt){
    e.pince = false;
    if (e.saut){
      const s = e.saut; s.t += dt / .7;
      e.x = s.x0 + (s.x1 - s.x0) * Math.min(1, s.t); e.z = Math.sin(Math.min(1, s.t) * Math.PI) * 40;
      if (s.t >= 1){ e.saut = null; e.z = 0; }
      e.prog = e.x; return e.x >= CHATEAU;
    }
    if (e.rentre > J.t){ e.prog = e.x; return false; }
    if (!e.vole){
      let devant = null;
      for (const t of J.tours) if (t.ligne === e.ligne && !t.d.traversable && t.x > e.x - 4 && t.x - e.x < (e.d.r || 14) + 22 && (!devant || t.x < devant.x)) devant = t;
      if (devant && devant.d === TOURS.epuisette && devant.charge) devant = null;
      if (devant){
        if (e.d.sauteur && !e.aSaute){ e.aSaute = true; e.saut = { x0:e.x, x1:devant.x + 46, t:0 }; return false; }
        e.pince = true;
        devant.pv -= (e.d.pince || 10) * dt * (e.lentT > J.t ? e.lentF : 1);
        if (effet(devant, "epines")) blesse(e, effet(devant, "epines") * dt, devant, true);
        if (Math.random() < dt * 3) confettis(devant.x - 14, devant.y - 10, "#E8C88A", 1);
        if (devant.pv <= 0){ texte("Pincé !", devant.x, devant.y - 30, "#fff", 15); confettis(devant.x, devant.y, "#E3BE7E", 14); retireTour(devant, "pince"); }
        e.prog = e.x; return false;
      }
    }
    const dansLEau = e.x < mareeX(J);
    e.x += vitesse(e) * (dansLEau && !e.vole ? 1.6 : 1) * (e.sprint > J.t ? 1.8 : 1) * dt;
    e.prog = e.x;
    return e.x >= CHATEAU;
  },
  perdVie(J){ confettis(CHATEAU + 40, H / 2, ["#E0533D", "#E3BE7E"], 14); },

  fond(J){
    c.fillStyle = "#F2D49B"; c.fillRect(0, 0, W, H);
    /* les couloirs : des bandes de sable à peine différentes */
    for (let l = 0; l < NL; l++) bx(RIVAGE - 20, LY0 + l * LH + 2, W, LH - 4, l % 2 ? "#F0CF92" : "#F5DAA6", l + 30, .5);
    for (const [cc, l] of CARTE.rochers){
      const x = X0 + cc * CW + CW / 2, y = yLigne(l) + 6;
      ov(x, y, 32, 24, "#9C948A", cc * 5 + l, 1.4); ov(x - 8, y - 8, 14, 8, "#B5ADA2", cc + l, 0);
      ov(x + 14, y + 10, 10, 7, "#8A8278", cc + l + 3, .5); feuille(x - 20, y + 14, 14, 5, -.4, "#5E9C5B", 1, 0);
    }
    for (let col = 1; col < NC; col++){
      c.strokeStyle = "rgba(170,130,70,.18)"; c.setLineDash([4, 6]); c.beginPath(); c.moveTo(X0 + col * CW, LY0); c.lineTo(X0 + col * CW, H); c.stroke(); c.setLineDash([]);
    }
    for (let i = 0; i < 160; i++) ov(RIVAGE + hache(i) * (W - RIVAGE), LY0 + hache(i + 99) * (H - LY0), 1.6, 1.3, i % 2 ? "#DDB777" : "#FBE6BD", i, 0);
    /* la dune du haut */
    bx(-10, -10, W + 20, LY0 + 6, "#EBC584", 7, 1.2);
    for (let x = 10; x < W; x += 34){ for (let k = 0; k < 3; k++) feuille(x + hache(x) * 12, LY0 - 8, 22 + hache(x + k) * 10, 5, -Math.PI / 2 + (k - 1) * .4, k % 2 ? "#8DB255" : "#7BA246", x + k, .5); }
    for (let x = 200; x < W - 100; x += 46){ bx(x, 20, 6, 40, "#B98A55", x, .6); }
    bande(196, 30, W - 100, 32, 2.5, "#9A7046", 1, .3); bande(196, 48, W - 100, 50, 2.5, "#9A7046", 2, .3);
    /* le parasol et la serviette */
    bx(40, 14, 60, 34, "#3E9FC9", 61, .8); for (let i = 0; i < 4; i++) bande(42 + i * 15, 14, 42 + i * 15, 48, 4, "#FFFFFF", i, 0);
    /* le château */
    const xc = CHATEAU + 8;
    fo([xc - 8, H, xc, LY0 + 30, W + 10, LY0 + 20, W + 10, H], "#E3BE7E", 71, 1.6);
    for (let l = 0; l < NL; l++){
      const y = yLigne(l);
      bx(xc + 4, y - 40, 50, 64, "#EBCB8D", 72 + l, 1.3);
      for (let k = 0; k < 4; k++) bx(xc + 4 + k * 13, y - 50, 9, 12, "#EBCB8D", 80 + l * 4 + k, .6);
      fo([xc + 20, y + 24, xc + 20, y - 4, xc + 38, y - 4, xc + 38, y + 24], "#C9A061", 90 + l, 0);
      ov(xc + 29, y - 4, 9, 7, "#C9A061", 95 + l, 0);
    }
  },
  dessineSol(J){
    const t = J.t, m = J.maree;
    /* la mer */
    const mx = mareeX(J);
    const bord = [];
    for (let y = -10; y <= H + 10; y += 16) bord.push(mx + Math.sin(y * .05 + t * 1.6) * 7, y);
    papier([-10, -10, ...bord, -10, H + 10], "#4FB3C9", 0);
    const ecume = [];
    for (let y = -10; y <= H + 10; y += 16) ecume.push(mx + Math.sin(y * .05 + t * 1.6) * 7 + 2, y);
    for (let y = H + 10; y >= -10; y -= 16) ecume.push(mx + Math.sin(y * .05 + t * 1.6) * 7 - 12 - Math.sin(y * .09 + t * 2.2) * 4, y);
    papier(ecume, "rgba(255,255,255,.85)", 0);
    for (let i = 0; i < 9; i++){
      const y = (i * 67 + t * 12) % (H + 40) - 20, x = mx - 50 - (i % 3) * 30;
      if (x > 10){ c.strokeStyle = "rgba(255,255,255,.5)"; c.lineWidth = 2.5; c.lineCap = "round"; c.beginPath(); c.moveTo(x - 12, y); c.quadraticCurveTo(x, y - 6, x + 12, y); c.stroke(); }
    }
    /* l'alerte : les cases qui vont être noyées */
    if (m.phase === "alerte" || m.phase === "monte"){
      const xl = X0 + m.cols * CW;
      c.save(); c.beginPath(); c.rect(X0, LY0, xl - X0, H - LY0); c.clip();
      c.globalAlpha = .28 + Math.sin(J.t * 8) * .1; c.strokeStyle = "#E0533D"; c.lineWidth = 9;
      for (let k = -H; k < xl; k += 26){ c.beginPath(); c.moveTo(k, H); c.lineTo(k + H, 0); c.stroke(); }
      c.restore(); c.globalAlpha = 1;
    }
    /* la jauge de marée */
    if (!J.apercu && J.vague > 0){
      const total = m.phase === "calme" ? MAREE.calme : 1, k = m.phase === "calme" ? 1 - m.t / total : 1;
      bx(16, LY0 + 8, 92, 24, "rgba(255,255,255,.75)", 3, .5);
      bx(22, LY0 + 18, 80, 7, "rgba(51,38,29,.25)", 0, 0);
      bx(22, LY0 + 18, 80 * borne(k, 0, 1), 7, m.phase === "calme" ? "#3E9FC9" : "#E0533D", 0, 0);
      c.font = "800 9px Nunito, sans-serif"; c.fillStyle = "#33261D"; c.textAlign = "left"; c.fillText("MARÉE", 23, LY0 + 15);
    }
    /* les drapeaux du château = les vies */
    const xc = CHATEAU + 8;
    for (let i = 0; i < J.viesMax; i++){
      const l = Math.floor(i * NL / J.viesMax), y = yLigne(l) - 52 - (i % 2) * 10, x = xc + 12 + (i % 2) * 28;
      if (i >= J.vies){ ov(x + 2, y + 2, 3, 2, "#C9A061", 0, 0); continue; }
      bande(x, y, x, y - 26, 2, "#8E6440", i, .3);
      const f = Math.sin(J.t * 5 + i) * 2;
      fo([x + 1, y - 26, x + 16, y - 21 + f, x + 1, y - 15], ["#E0533D", "#3E9FC9", "#F2B33B", "#2F8F6B"][i % 4], i, .4);
    }
    /* les coquillages à ramasser */
    for (const s of J.coqs){
      const k = s.dur - s.t;
      if (k < 3 && Math.floor(k * 6) % 2) continue;
      const sa = s.saut ? Math.sin((1 - s.saut / .5) * Math.PI) * 14 : 0;
      c.save(); c.translate(s.x, s.y - sa);
      const b = 1 + Math.sin(J.t * 5 + s.g) * .08; c.scale(b, b);
      c.globalAlpha = .3 + Math.sin(J.t * 4 + s.g) * .2; ov(0, -6, 18, 14, "#FFFFFF", 0, 0); c.globalAlpha = 1;
      for (let i = 0; i < 7; i++) feuille(0, 2, 15, 5, -Math.PI / 2 + (i - 3) * .28, i % 2 ? "#F6C7B6" : (s.tresor ? "#F9A87F" : "#F3B3A0"), s.g + i, i ? 0 : .8);
      ov(0, 2, 3.5, 2, "#E89A86", 0, 0);
      c.restore();
    }
  }
});

function ramasse(J, s){
  J.coqs.splice(J.coqs.indexOf(s), 1);
  const v = Math.round(s.val * R().gain);
  gagne(v); J.score += v * 5;
  texte("+" + v, s.x, s.y - 20, "#FFE0EC", 18);
  confettis(s.x, s.y, ["#F6C7B6", "#FFFFFF", "#F2B33B"], 8);
  son("piece"); majHUD(true);
}
function semeCoquillage(J, val){
  for (let essai = 0; essai < 6; essai++){
    const col = Math.floor(Math.random() * NC), l = Math.floor(Math.random() * NL);
    const x = X0 + col * CW + alea(16, CW - 16), y = yLigne(l) + alea(6, 36);
    if (x < mareeX(J) + 30) continue;
    J.coqs.push({ x, y, val, t:0, dur:12, g:(Math.random() * 99) | 0, saut:.5 });
    return;
  }
}
}
