/* ═════════════════════════════════════════════════════════════
   MONDE 4 — LA BASE SPATIALE
   La base est au centre, les visiteurs arrivent de TOUS les côtés.
   Les tourelles sont posées sur deux ANNEAUX qu'on fait TOURNER en
   les faisant glisser : chacune ne tire que vers l'extérieur, dans
   un cône. Et chaque tir coûte de l'ÉNERGIE ; les panneaux solaires
   en produisent, d'autant plus qu'ils regardent le soleil.
   ═════════════════════════════════════════════════════════════ */
{
const CX = 480, CY = 292;
/* ═══ les trois terrains de l'espace ═══
   anneaux : rayon, nombre d'emplacements, décalage · soleil : son angle
   lumiere : force du soleil (la nébuleuse le voile) · gain : cristaux gagnés */
const CARTES = [
  { nom:"La base", desc:"Deux anneaux et le soleil en haut à gauche : le terrain pour apprendre à tourner.",
    anneaux:[{ r:104, n:6, a0:0 }, { r:188, n:10, a0:TAU / 20 }], soleil:-2.45, lumiere:1, gain:1.3,
    planetes:[[860, 470, 46, "#E0703D", true], [110, 480, 26, "#7FD9A8"], [870, 70, 14, "#C9A3E8"]] },
  { nom:"Les trois anneaux", desc:"Trois anneaux et 24 emplacements… mais le soleil est en bas à droite, et il arrive plus de monde.",
    anneaux:[{ r:86, n:5, a0:0 }, { r:152, n:8, a0:TAU / 16 }, { r:220, n:11, a0:0 }], soleil:.72, lumiere:1, gain:1.3,
    planetes:[[110, 90, 40, "#3E9FC9", true], [880, 80, 20, "#F28DB2"], [90, 500, 16, "#7FD9A8"]], programme:{ budget:46 } },
  { nom:"La nébuleuse", desc:"Un petit anneau et un grand, dans une nébuleuse qui voile le soleil : peu d'énergie, mais des cristaux en plus.",
    anneaux:[{ r:84, n:4, a0:TAU / 8 }, { r:172, n:12, a0:0 }], soleil:-1.57, soleilDist:350, lumiere:.6, gain:1.6, nebuleuse:true,
    planetes:[[880, 480, 34, "#B88FB8", true], [90, 470, 22, "#E0703D"]], programme:{ budget:40 } }
];
let CARTE = CARTES[0], ANNEAUX = CARTE.anneaux, SOLEIL = CARTE.soleil;
function charge(k){ CARTE = CARTES[k] || CARTES[0]; ANNEAUX = CARTE.anneaux; SOLEIL = CARTE.soleil; }
const ARRIVEE = 560, BASE = 52;
const arc = (t) => 1.0 + (t.niv - 1) * .12;
const soleilSur = (a) => (.3 + .7 * Math.max(0, Math.cos(ecartAngle(a, SOLEIL)))) * CARTE.lumiere;
const angleSlot = (J, k, i) => ANNEAUX[k].a0 + i * TAU / ANNEAUX[k].n + (J.rot ? J.rot[k] : 0);

/* ── les tourelles (dessinées « vers le haut » = vers l'extérieur) ── */
function socle(t, coul = "#8C95B8"){ ov(0, 4, 15, 12, "#5B6390", t.g, 1); ov(0, 2, 12, 9, coul, t.g + 1, .3); }
const visee = (t) => t.angPose === undefined ? 0 : borne(ecartAngle(t.angPose + 0, t.ang) , -arc(t), arc(t));
const TOURS = {
  laser:{
    nom:"Laser", prix:55, debloque:0, contre:[], genre:"tir", tir:"rayon", portee:200, cadence:.33, deg:10, energie:.7, couleurTir:"#FF5E8A", bouche:16,
    desc:"Tire très vite de petits rayons roses. Économe en énergie.",
    branches:[
      { nom:"Laser prisme", desc:"Le rayon rebondit sur 2 autres cibles.", effets:{ rebond:2 } },
      { nom:"Gros laser", desc:"Rayon bien plus puissant, critique souvent.", mods:{ deg:1.6 }, effets:{ crit:.2 } }
    ],
    dessine(t){
      socle(t);
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 3);
      bx(-4, -24, 8, 22, "#C9CFE6", t.g + 2, .7);
      fo([-6, -24, 6, -24, 0, -33], "#FF5E8A", t.g + 3, .4);
      ov(0, -2, 7, 7, "#E9ECF7", t.g + 4, .4);
      c.restore();
    }
  },
  fusee:{
    nom:"Lance-fusées", prix:105, debloque:4, contre:["nuee"], genre:"tir", portee:240, cadence:2.1, deg:26, splash:55, vitesseTir:270, energie:5, couleurTir:"#FFB347", bouche:18,
    desc:"Envoie une fusée à tête chercheuse qui éclate sur un groupe. Gourmande en énergie.",
    branches:[
      { nom:"Salve", desc:"Trois fusées d'un coup sur trois cibles.", mods:{ deg:.75 }, effets:{ multi:2 } },
      { nom:"Méga-fusée", desc:"Une explosion énorme qui assomme.", mods:{ splash:1.6, deg:1.5, cadence:1.2 }, effets:{ etourdit:.35 } }
    ],
    dessine(t, tm){
      socle(t, "#9AA3C4");
      c.save(); c.rotate(visee(t) * .6);
      bx(-11, -18, 22, 18, "#5B6390", t.g + 2, .8);
      const pret = t.cd === undefined || t.cd < stat(t, "cadence") * .5 || t.icone;
      if (pret){
        bx(-4, -32, 8, 18, "#F4F1EA", t.g + 3, .5);
        fo([-4, -32, 4, -32, 0, -40], "#E0533D", t.g + 4, .3);
        fo([-4, -16, -8, -12, -4, -20], "#E0533D", t.g + 5, 0); fo([4, -16, 8, -12, 4, -20], "#E0533D", t.g + 6, 0);
      }
      c.restore();
    },
    dessineTir(p){
      c.rotate(p.ang);
      fo([-10, -3, 6, -3, 11, 0, 6, 3, -10, 3], "#F4F1EA", p.g, .4);
      fo([6, -3, 11, 0, 6, 3], "#E0533D", p.g + 1, 0);
      fo([-10, -3, -18 - Math.random() * 6, 0, -10, 3], "#FFB347", p.g + 2, 0);
    }
  },
  tracteur:{
    nom:"Rayon tracteur", prix:80, debloque:2, contre:["rapide"], portee:150, lent:.5, deg:5, energie:2,
    desc:"Attrape un visiteur dans son rayon vert : il avance au ralenti.",
    branches:[
      { nom:"Rayon gel", desc:"Arrête presque complètement sa cible.", mods:{ lent:1.55 } },
      { nom:"Double tracteur", desc:"Attrape deux visiteurs à la fois.", effets:{ double:1 } }
    ],
    agit(J, t, dt){
      t.cibles = [];
      const deja = new Set();
      for (let i = 0; i <= effet(t, "double"); i++){
        const e = cherche(t, deja);
        if (!e) break;
        const cout = t.d.energie * dt * (J.surcharge > J.t ? 0 : 1);
        if (J.energie < cout) break;
        J.energie -= cout; deja.add(e);
        t.cibles.push(e); t.ang = Math.atan2(e.y - t.y, e.x - t.x);
        ralentit(e, 1 - lenteur(t), .15);
        blesse(e, stat(t, "deg") * dt, t, "continu");
      }
      t.cible = t.cibles[0] || null;
    },
    dessine(t, tm){
      socle(t, "#8FB8A8");
      c.save(); c.rotate(visee(t));
      bande(0, -2, 0, -14, 4, "#5B6390", t.g, .4);
      c.beginPath(); c.ellipse(0, -18, 13, 7, 0, Math.PI, TAU); c.closePath();
      c.fillStyle = "#6FD3A0"; c.fill();
      ov(0, -20, 3, 3, t.cible ? "#E9FFE9" : "#2F8F6B", t.g + 3, 0);
      c.restore();
    }
  },
  panneau:{
    nom:"Panneau solaire", prix:65, debloque:0, contre:["eco"], prod:2.4,
    desc:"Fabrique de l'énergie. Beaucoup plus s'il est tourné vers le soleil !",
    branches:[
      { nom:"Panneau géant", desc:"Produit beaucoup plus d'énergie.", mods:{ prod:1.7 } },
      { nom:"Panneau à cristaux", desc:"Fabrique aussi des cristaux au soleil.", effets:{ cristaux:1 } }
    ],
    agit(J, t, dt){
      const k = soleilSur(t.angPose ?? SOLEIL);
      t.eclat = k;
      J.energie = Math.min(J.energieMax, J.energie + stat(t, "prod") * k * dt);
      if (effet(t, "cristaux") && J.vague > 0){
        t.cristT = (t.cristT || 0) + dt * k;
        if (t.cristT >= 5){ t.cristT = 0; gagne(6); texte("+6", t.x, t.y - 30, "#B8F2FF", 15); }
      }
    },
    dessine(t, tm){
      socle(t, "#9AA3C4");
      bande(0, 0, 0, -12, 3, "#5B6390", 0, .3);
      bx(-16, -30, 32, 18, "#2D4A9A", t.g + 2, 1);
      for (let i = 1; i < 4; i++) bande(-16 + i * 8, -30, -16 + i * 8, -12, 1, "#6F8FE0", 0, 0);
      bande(-16, -21, 16, -21, 1, "#6F8FE0", 0, 0);
      const k = t.eclat ?? 1;
      c.globalAlpha *= k; ov(-8, -26, 5, 2.5, "rgba(255,255,255,.6)", 0, 0); c.globalAlpha /= k || 1;
    }
  },
  drone:{
    nom:"Drone", prix:95, genre:"tir", tir:"rayon", portee:140, cadence:.55, deg:7, energie:.5, couleurTir:"#7BE0A8", bouche:4, libre:true, debloque:9, contre:["rapide"],
    desc:"Décolle de l'anneau et tourne tout seul autour de la base. Il tire dans toutes les directions !",
    branches:[
      { nom:"Escadrille", desc:"Tire sur deux cibles à la fois.", effets:{ multi:1 } },
      { nom:"Drone rapide", desc:"Tourne et tire bien plus vite.", mods:{ cadence:.55 } }
    ],
    dessine(t, tm){
      const h = Math.sin(tm * 5 + t.g) * 2;
      c.save(); c.translate(0, h);
      for (const [x, y] of [[-13, -13], [13, -13], [-13, 9], [13, 9]]){
        bande(0, -2, x, y, 2.5, "#5B6390", 0, .3);
        c.globalAlpha *= .6; ov(x, y, 8, 2.2 + Math.abs(Math.sin(tm * 40 + x)) * 1.5, "#DDE3FF", 0, 0); c.globalAlpha /= .6;
      }
      ov(0, -2, 9, 8, "#C9CFE6", t.g, 1);
      ov(0, -3, 4.5, 4.5, t.recul > .3 ? "#E9FFE9" : "#7BE0A8", t.g + 1, 0);
      c.restore();
    }
  }
};

/* ── les visiteurs ── */
function rocher(e, r, coul, coul2){
  c.rotate(e.anim * .8 * (e.g % 2 ? 1 : -1));
  papier(ovale(0, 0, r, r * .9, e.g, 11, .16), coul, 1);
  ov(-r * .3, -r * .25, r * .28, r * .24, coul2, e.g + 1, 0);
  ov(r * .35, r * .2, r * .2, r * .18, coul2, e.g + 2, 0);
  ov(r * .05, r * .45, r * .14, r * .12, coul2, e.g + 3, 0);
}
const ENNEMIS = {
  asteroide:{
    nom:"Astéroïde", pv:40, vit:22, prime:7, r:18, hautBarre:28, couleur:"#9C8F86", sansMiroir:true,
    meurt(J, e){ for (const s of [-1, 1]) creeEnnemi("caillou", { r:e.r, a:e.a + s * .12 }); },
    dessine(e){ rocher(e, 18, "#9C8F86", "#7D7068"); c.rotate(-e.anim * .8 * (e.g % 2 ? 1 : -1)); yeux(0, -2, 5, 3, 0, 0, e.g, e.content); }
  },
  caillou:{
    nom:"Caillou", invoque:true, nuee:true, pv:14, vit:36, prime:3, r:9, hautBarre:18, couleur:"#9C8F86", sansMiroir:true,
    dessine(e){ rocher(e, 9, "#A99C93", "#857870"); }
  },
  soucoupe:{
    nom:"Soucoupe", pv:34, vit:36, prime:7, r:15, hautBarre:26, couleur:"#7BE0A8",
    dessine(e, tm){
      c.translate(0, Math.sin(e.anim * 4) * 2);
      ov(0, -6, 8, 8, "#BFF0FF", e.g, .6);
      ov(0, -5, 4.5, 5, "#7BE0A8", e.g + 1, 0); yeux(0, -6, 2, 1.5, 0, 0, e.g, e.content);
      ov(0, 2, 18, 6, "#A9B3D6", e.g + 2, 1);
      for (let i = 0; i < 4; i++) ov(-10 + i * 6.6, 3, 1.8, 1.8, Math.floor(e.anim * 5 + i) % 2 ? "#FFE27A" : "#FF8FB1", 0, 0);
    }
  },
  comete:{
    nom:"Comète", pv:20, vit:70, prime:5, r:10, hautBarre:20, couleur:"#9FE3FF", sansMiroir:true,
    dessine(e){
      c.rotate(e.a);
      for (let i = 3; i >= 0; i--) feuille(0, 0, 18 + i * 9, 10 - i * 1.5, 0, ["#E9FBFF", "#BFEFFF", "#8FDCFF", "#5FC2F2"][i], e.g + i, 0);
      ov(0, 0, 8, 8, "#E9FBFF", e.g + 5, .6);
      c.rotate(-e.a); yeux(0, -1, 3, 2, 0, 0, e.g, e.content);
    }
  },
  cuirasse:{
    nom:"Robot cuirassé", pv:200, vit:20, armure:4, prime:18, r:18, hautBarre:36, couleur:"#C9CFE6",
    dessine(e, tm){
      const b = Math.sin(e.anim * 6) * 2;
      bande(-6, 6, -8 - b, 16, 4, "#7A84B0", 1, .4); bande(6, 6, 8 + b, 16, 4, "#7A84B0", 2, .4);
      bx(-14, -16, 28, 24, "#C9CFE6", e.g, 1.2);
      bx(-10, -12, 20, 10, "#2D3570", e.g + 1, 0);
      ov(-4, -7, 2.5, 2.5, "#7BE0A8", 0, 0); ov(4, -7, 2.5, 2.5, "#7BE0A8", 0, 0);
      bande(0, -16, 0, -24, 1.5, "#7A84B0", 0, 0); ov(0, -25, 2.5, 2.5, "#FF5E8A", 0, 0);
      bx(-10, 1, 20, 4, "#9AA3C4", e.g + 2, 0);
    }
  },
  furtif:{
    nom:"Alien furtif", pv:52, vit:30, prime:11, r:13, hautBarre:28, furtif:true, couleur:"#C9A3E8",
    /* invisible tant qu'il est loin : impossible à viser avant qu'il approche */
    dessine(e, tm){
      if (e.cache) c.globalAlpha *= .22 + Math.abs(Math.sin(e.anim * 3)) * .12;
      ov(0, -8, 11, 13, "#C9A3E8", e.g, e.cache ? 0 : 1);
      ov(0, -10, 7, 6, "#7A4E9E", e.g + 1, 0);
      yeux(0, -11, 3, 2.2, 0, 0, e.g, e.content);
      for (const s of [-1, 1]) bande(s * 5, -20, s * 9, -28, 1.5, "#C9A3E8", 0, 0);
      fo([-11, 2, -6, 10, 0, 4, 6, 10, 11, 2], "#B58FD8", e.g + 2, 0);
      if (e.cache) c.globalAlpha = 1;
    }
  },
  mere:{
    nom:"Vaisseau-mère", pv:1300, vit:8, prime:150, degats:2, r:40, hautBarre:46, boss:true, couleur:"#7BE0A8",
    enerve(J, e){ for (let i = 0; i < 5; i++) creeEnnemi(i % 2 && J.vague > 12 ? "furtif" : "soucoupe", { r:e.r + 20, a:e.a + (i - 2) * .25 }); },
    agit(J, e, dt){
      e.ponte = (e.ponte ?? 4) - dt;
      if (e.ponte <= 0){ e.ponte = 5; creeEnnemi("soucoupe", { r:e.r - 10, a:e.a + alea(-.1, .1) }); }
    },
    dessine(e, tm){
      ov(0, -10, 20, 18, "#BFF0FF", e.g, .8);
      ov(0, -9, 10, 11, "#7BE0A8", e.g + 1, 0); yeux(0, -11, 4, 3, 0, 0, e.g, e.content); sourire(0, -4, 3);
      ov(0, 8, 44, 13, "#A9B3D6", e.g + 2, 1.5);
      ov(0, 12, 30, 6, "#8790BA", e.g + 3, 0);
      for (let i = 0; i < 7; i++) ov(-30 + i * 10, 8, 2.6, 2.6, Math.floor(e.anim * 4 + i) % 2 ? "#FFE27A" : "#FF8FB1", 0, 0);
    }
  }
};

/* ═══ les renforts de la base : ils se débloquent au fil des 30 vagues ═══ */
Object.assign(TOURS, {
  batterie:{
    nom:"Batterie", prix:150, debloque:6, contre:["eco"], prod:3,
    desc:"Stocke 60 d'énergie en plus et en produit un peu, même loin du soleil.",
    branches:[
      { nom:"Super batterie", desc:"Stocke et produit beaucoup plus.", mods:{ prod:1.8 } },
      { nom:"Batterie à cristaux", desc:"Transforme le trop-plein d'énergie en cristaux.", effets:{ cristaux:1 } }
    ],
    agit(J, t, dt){
      J.energie = Math.min(J.energieMax, J.energie + stat(t, "prod") * dt);
      if (effet(t, "cristaux") && J.energie >= J.energieMax - 1 && J.vague > 0){
        t.cristT = (t.cristT || 0) + dt;
        if (t.cristT >= 4){ t.cristT = 0; gagne(8); texte("+8", t.x, t.y - 30, "#B8F2FF", 15); }
      }
    },
    dessine(t, tm){
      socle(t, "#9AA3C4");
      bx(-9, -32, 18, 30, "#2D3570", t.g + 2, 1);
      bx(-4, -36, 8, 5, "#9AA3C4", t.g + 3, .3);
      const k = J && J.energieMax ? J.energie / J.energieMax : .8;
      bx(-6, -4 - 24 * k, 12, 24 * k, k < .2 ? "#E0533D" : "#FFD447", 0, 0);
    }
  },
  ionique:{
    nom:"Canon ionique", prix:140, debloque:7, contre:["armure"], genre:"tir", tir:"rayon", percant:true, portee:210, cadence:.9, deg:28, energie:2.5, couleurTir:"#8FDCFF", bouche:20,
    desc:"Un rayon qui traverse les blindages : le meilleur contre les robots cuirassés.",
    branches:[
      { nom:"Canon à ions lourds", desc:"Frappe bien plus fort.", mods:{ deg:1.65 } },
      { nom:"Ions sautillants", desc:"Le rayon rebondit sur une autre cible.", effets:{ rebond:1 } }
    ],
    dessine(t){
      socle(t, "#8FB8D0");
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 4);
      bx(-6, -28, 12, 26, "#5B6390", t.g + 2, .8);
      for (let i = 0; i < 3; i++) ov(0, -24 + i * 7, 5, 2, "#8FDCFF", i, 0);
      c.restore();
    }
  },
  radar:{
    nom:"Radar", prix:120, debloque:11, contre:["invisible"], detecte:true, portee:280,
    desc:"Repère les aliens furtifs autour de lui : les tourelles peuvent enfin les viser.",
    branches:[
      { nom:"Grand radar", desc:"Repère beaucoup plus loin.", mods:{ portee:1.4 } },
      { nom:"Radar de visée", desc:"Aide les tourelles voisines : elles tirent plus fort.", effets:{ visee:1 } }
    ],
    dessine(t, tm){
      socle(t, "#9AA3C4");
      bande(0, 0, 0, -12, 3, "#5B6390", 0, .3);
      c.save(); c.translate(0, -16); c.rotate(Math.sin(tm * 1.5 + t.g) * .8);
      c.beginPath(); c.ellipse(0, 0, 14, 7, 0, Math.PI, TAU); c.closePath(); c.fillStyle = "#DCE6EE"; c.fill();
      bande(0, 0, 0, -10, 1.5, "#5B6390", 0, 0); ov(0, -11, 2.5, 2.5, "#FF5E8A", 0, 0);
      c.restore();
    }
  },
  mitrailleuse:{
    nom:"Mitrailleuse à étoiles", prix:170, debloque:13, contre:["bouclier"], genre:"tir", tir:"rayon", portee:175, cadence:.1, deg:3, energie:.18, couleurTir:"#FFE27A", bouche:16,
    desc:"Crache des étoiles sans arrêt : chaque petite étoile compte comme un coup, parfait pour briser les boucliers.",
    branches:[
      { nom:"Pluie d'étoiles", desc:"Tire sur deux cibles à la fois.", effets:{ multi:1 } },
      { nom:"Étoiles filantes", desc:"Des étoiles plus fortes.", mods:{ deg:1.7 } }
    ],
    dessine(t){
      socle(t, "#B8A9D8");
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 2);
      bx(-8, -22, 6, 20, "#C9CFE6", t.g + 2, .6); bx(2, -22, 6, 20, "#C9CFE6", t.g + 3, .6);
      etoile5(0, -26, 6, 2.5, "#FFE27A", t.g, .3);
      c.restore();
    }
  },
  satellite:{
    nom:"Satellite bouclier", prix:260, debloque:16, contre:["soutien"], cadence:22,
    desc:"Charge régulièrement un bouclier : la prochaine bestiole qui atteint la base est arrêtée net, sans rien te coûter.",
    branches:[
      { nom:"Satellite rapide", desc:"Recharge deux fois plus vite.", mods:{ cadence:.5 } },
      { nom:"Satellite géant", desc:"Peut garder trois charges d'avance.", effets:{ stock:1 } }
    ],
    agit(J, t, dt){
      if (J.vague === 0) return;
      t.cd -= dt; if (t.cd > 0) return;
      const max = J.tours.filter(x => x.d === TOURS.satellite).reduce((n, x) => n + 2 + effet(x, "stock"), 0);
      if (J.charges < max){ J.charges++; texte("+1 bouclier", CX, CY - 70, "#B8F7D4", 15); t.recul = 1; }
      t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      socle(t, "#8FB8A8");
      bx(-20, -22, 13, 8, "#2D4A9A", t.g + 1, .5); bx(7, -22, 13, 8, "#2D4A9A", t.g + 2, .5);
      ov(0, -18, 8, 8, "#C9CFE6", t.g + 3, .8);
      ov(0, -18, 4, 4, "#7BE0A8", t.g + 4, 0);
    }
  },
  trounoir:{
    nom:"Trou noir", prix:320, debloque:18, contre:["nuee"], portee:200, cadence:5, deg:30, energie:6,
    desc:"Ouvre un petit trou noir sur un groupe : tout ce qui est autour est aspiré au même endroit, sonné et secoué.",
    branches:[
      { nom:"Trou noir géant", desc:"Aspire de bien plus loin.", effets:{ large:1 } },
      { nom:"Trou noir rapide", desc:"S'ouvre presque deux fois plus souvent.", mods:{ cadence:.55 } }
    ],
    agit(J, t, dt){
      t.cd -= dt; if (t.cd > 0) return;
      const e = cherche(t);
      if (!e){ t.cd = .2; return; }
      if (!M.cout(J, t)){ t.cd = .3; return; }
      const r = 95 * (1 + .5 * effet(t, "large"));
      for (const x of J.ennemis){
        if (x.mort || dist(x.x, x.y, e.x, e.y) > r) continue;
        x.r = x.r + (e.r - x.r) * .7; x.a = x.a + ecartAngle(x.a, e.a) * .7;
        if (!x.d.boss) ralentit(x, .02, 1.2);
        frappe(t, x, stat(t, "deg"), null, true);
      }
      J.effets.push({ genre:"trou", x:e.x, y:e.y, r, t:0, dur:.8 });
      t.recul = 1; t.cd = stat(t, "cadence");
    },
    dessine(t, tm){
      socle(t, "#7A6A9E");
      c.save(); c.translate(0, -18); c.rotate(tm * 3);
      for (let i = 0; i < 3; i++) feuille(0, 0, 14, 7, i * TAU / 3, "#7A4E9E", t.g + i, 0);
      c.restore(); ov(0, -18, 6, 6, "#120B26", t.g + 4, 0);
    }
  },
  plasma:{
    nom:"Canon à plasma", prix:450, debloque:22, contre:["boss", "armure"], genre:"tir", tir:"rayon", percant:true, pourcent:.07, portee:240, cadence:2.6, deg:40, energie:6, couleurTir:"#FF8FB1", bouche:24,
    desc:"Un énorme rayon qui retire une part de la vie de sa cible : l'arme contre le vaisseau-mère et les géants.",
    branches:[
      { nom:"Plasma surchauffé", desc:"Retire une part encore plus grande.", effets:{ pourcentPlus:.04 } },
      { nom:"Plasma en chaîne", desc:"Le rayon rebondit sur 2 autres cibles.", effets:{ rebond:2 } }
    ],
    dessine(t, tm){
      socle(t, "#B88FB8");
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 5);
      bx(-9, -32, 18, 30, "#5B3A70", t.g + 2, 1);
      ov(0, -32, 8, 5, "#FF8FB1", t.g + 3, .3);
      for (let i = 0; i < 2; i++) bande(-9, -24 + i * 10, 9, -24 + i * 10, 2, "#FF8FB1", i, 0);
      c.restore();
    }
  }
});

Object.assign(ENNEMIS, {
  gardien:{
    nom:"Alien gardien", pv:60, vit:28, prime:12, r:14, hautBarre:28, bouclier:8, couleur:"#7BE0A8",
    dessine(e, tm){
      ov(0, -8, 12, 12, "#7BE0A8", e.g, 1);
      yeux(0, -10, 3.4, 2.4, 0, 0, e.g, e.content);
      bx(-14, -4, 6, 14, "#9FD8F2", e.g + 1, .4); bx(8, -4, 6, 14, "#9FD8F2", e.g + 2, .4);
      for (const s of [-1, 1]) bande(s * 5, -18, s * 8, -26, 1.5, "#7BE0A8", 0, 0);
    }
  },
  essaim:{
    nom:"Essaim de météores", pv:10, vit:52, prime:2, r:7, hautBarre:16, nuee:true, couleur:"#FFB347", sansMiroir:true,
    dessine(e){
      c.rotate(e.a || 0);
      feuille(0, 0, 18, 6, 0, "#FFE27A", e.g, 0);
      ov(0, 0, 5, 5, "#FFB347", e.g + 1, .4);
    }
  },
  reparateur:{
    nom:"Robot réparateur", pv:60, vit:26, prime:12, r:13, hautBarre:30, soigne:true, couleur:"#C9CFE6",
    agit(J, e, dt){
      e.soin = (e.soin ?? 1.5) - dt;
      if (e.soin > 0) return;
      e.soin = 2.5; let n = 0;
      for (const x of J.ennemis) if (x !== e && !x.mort && x.pv < x.pvMax && dist(x.x, x.y, e.x, e.y) < 90){ x.pv = Math.min(x.pvMax, x.pv + x.pvMax * .16); n++; }
      if (n){ onde(e.x, e.y, 90, "rgba(123,224,168,.9)", .5); texte("+", e.x, e.y - 22, "#7BE08A", 18); }
    },
    dessine(e, tm){
      bx(-11, -16, 22, 20, "#C9CFE6", e.g, 1);
      bx(-7, -12, 14, 8, "#2D3570", e.g + 1, 0);
      ov(-3, -8, 1.8, 1.8, "#7BE0A8", 0, 0); ov(3, -8, 1.8, 1.8, "#7BE0A8", 0, 0);
      bande(-3, 0, 3, 0, 2, "#E0533D", 0, 0); bande(0, -3, 0, 3, 2, "#E0533D", 0, 0);
      c.save(); c.translate(12, -6); c.rotate(e.anim * 4); bande(-5, 0, 5, 0, 2, "#7A84B0", 0, 0); bande(0, -5, 0, 5, 2, "#7A84B0", 0, 0); c.restore();
    }
  }
});

/* ═══ LES FUSIONS ═══
   Peu de place sur les anneaux : deux tourelles posées peuvent fusionner
   en une seule tourelle hybride. Elle garde l'emplacement de la première,
   libère celui de la seconde, et garde le plus bas des deux niveaux. */
const HYBRIDE = { cacheBoutique:true, debloque:999 };
function cornes(t, coul){ for (const s of [-1, 1]) bx(s > 0 ? 9 : -21, -16, 12, 8, coul, t.g + s, .5); }
Object.assign(TOURS, {
  missileSolaire:{ ...HYBRIDE,
    nom:"Missile solaire", prix:170, contre:["nuee", "eco"], genre:"tir", portee:260, cadence:1.6, deg:34, splash:60, vitesseTir:300, energie:0, prodEnergie:2.6, couleurTir:"#FFB347", bouche:18,
    desc:"Des missiles qui ne coûtent aucune énergie, et des ailes solaires qui en produisent.",
    dessine(t, tm){
      socle(t, "#C9B26A");
      cornes(t, "#2D4A9A");
      c.save(); c.rotate(visee(t) * .6);
      bx(-6, -34, 12, 22, "#F4F1EA", t.g + 3, .6);
      fo([-6, -34, 6, -34, 0, -43], "#F2B33B", t.g + 4, .3);
      fo([-6, -16, -10, -11, -6, -20], "#E0533D", t.g + 5, 0); fo([6, -16, 10, -11, 6, -20], "#E0533D", t.g + 6, 0);
      c.restore();
    },
    dessineTir(p){
      c.rotate(p.ang);
      fo([-10, -3, 6, -3, 11, 0, 6, 3, -10, 3], "#F4F1EA", p.g, .4);
      fo([6, -3, 11, 0, 6, 3], "#F2B33B", p.g + 1, 0);
      fo([-10, -3, -18 - Math.random() * 6, 0, -10, 3], "#FFD447", p.g + 2, 0);
    }
  },
  laserSolaire:{ ...HYBRIDE,
    nom:"Laser solaire", prix:120, contre:["eco"], genre:"tir", tir:"rayon", portee:210, cadence:.3, deg:12, energie:0, prodEnergie:1.6, couleurTir:"#FFD447", bouche:16,
    desc:"Un laser qui s'alimente tout seul au soleil : il tire sans rien coûter et recharge même la base.",
    dessine(t){
      socle(t, "#C9B26A"); cornes(t, "#2D4A9A");
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 3);
      bx(-4, -26, 8, 24, "#F4E8B0", t.g + 2, .7);
      fo([-6, -26, 6, -26, 0, -35], "#FFD447", t.g + 3, .4);
      c.restore();
    }
  },
  laserGlacant:{ ...HYBRIDE,
    nom:"Laser glaçant", prix:135, contre:["rapide"], genre:"tir", tir:"rayon", portee:200, cadence:.33, deg:11, energie:.8, effets:{ lent:.45 }, couleurTir:"#9FE3FF", bouche:16,
    desc:"Chaque rayon gèle à moitié sa cible : rien ne file plus devant lui.",
    dessine(t){
      socle(t, "#8FB8D0");
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 3);
      c.beginPath(); c.ellipse(0, -10, 12, 6, 0, Math.PI, TAU); c.closePath(); c.fillStyle = "#6FD3A0"; c.fill();
      bx(-4, -28, 8, 20, "#DFF4FF", t.g + 2, .6);
      etoile5(0, -31, 5, 2, "#9FE3FF", t.g, .3);
      c.restore();
    }
  },
  laserRadar:{ ...HYBRIDE,
    nom:"Laser radar", prix:175, contre:["invisible"], genre:"tir", tir:"rayon", toutAutour:true, detecte:true, portee:230, cadence:.35, deg:12, energie:.9, couleurTir:"#C9A3E8", bouche:12,
    desc:"Il voit tout autour de lui : il tire dans toutes les directions et révèle les aliens furtifs.",
    dessine(t, tm){
      socle(t, "#B8A9D8");
      c.save(); c.translate(0, -14); c.rotate(tm * 2);
      c.beginPath(); c.ellipse(0, 0, 13, 6, 0, Math.PI, TAU); c.closePath(); c.fillStyle = "#DCE6EE"; c.fill();
      c.restore();
      c.save(); c.rotate(t.ang + Math.PI / 2 - (t.angPose ?? -Math.PI / 2) - Math.PI / 2); bx(-3, -30, 6, 18, "#C9A3E8", t.g + 2, .5); c.restore();
    }
  },
  fuseeAimantee:{ ...HYBRIDE,
    nom:"Fusée aimantée", prix:185, contre:["nuee", "rapide"], genre:"tir", portee:240, cadence:1.9, deg:28, splash:70, vitesseTir:270, energie:4, effets:{ lent:.5, etourdit:.2 }, couleurTir:"#7BE0A8", bouche:18,
    desc:"Sa fusée explose en champ magnétique : tout le groupe touché est englué, et parfois sonné.",
    dessine(t){
      socle(t, "#8FB8A8");
      c.save(); c.rotate(visee(t) * .6);
      c.beginPath(); c.arc(0, -16, 11, Math.PI, TAU); c.lineWidth = 6; c.strokeStyle = "#E0533D"; c.stroke();
      bx(-14, -18, 6, 5, "#DCE6EE", 1, 0); bx(8, -18, 6, 5, "#DCE6EE", 2, 0);
      bx(-4, -34, 8, 18, "#7BE0A8", t.g + 3, .5); fo([-4, -34, 4, -34, 0, -41], "#2F8F6B", t.g + 4, .3);
      c.restore();
    },
    dessineTir(p){ c.rotate(p.ang); fo([-9, -3, 6, -3, 10, 0, 6, 3, -9, 3], "#7BE0A8", p.g, .4); fo([-9, -3, -16 - Math.random() * 5, 0, -9, 3], "#B8F7D4", p.g + 1, 0); }
  },
  droneMitrailleur:{ ...HYBRIDE,
    nom:"Drone mitrailleur", prix:265, contre:["bouclier", "rapide"], genre:"tir", tir:"rayon", libre:true, portee:150, cadence:.1, deg:4, energie:.15, effets:{ multi:1 }, couleurTir:"#FFE27A", bouche:4,
    desc:"Un drone qui tourne autour de la base en crachant des étoiles sur deux cibles : il brise tous les boucliers.",
    dessine(t, tm){
      const h = Math.sin(tm * 5 + t.g) * 2;
      c.save(); c.translate(0, h);
      for (const [x, y] of [[-14, -14], [14, -14], [-14, 10], [14, 10]]){
        bande(0, -2, x, y, 2.5, "#5B6390", 0, .3);
        c.globalAlpha *= .6; ov(x, y, 8, 2.2 + Math.abs(Math.sin(tm * 40 + x)) * 1.5, "#DDE3FF", 0, 0); c.globalAlpha /= .6;
      }
      ov(0, -2, 10, 9, "#C9CFE6", t.g, 1);
      etoile5(0, -3, 6, 2.5, "#FFE27A", t.g + 1, .2);
      c.restore();
    }
  },
  centrale:{ ...HYBRIDE,
    nom:"Centrale solaire", prix:215, contre:["eco"], prod:6,
    desc:"Stocke 120 d'énergie en plus, en produit beaucoup face au soleil, et change le trop-plein en cristaux.",
    agit(J, t, dt){
      J.energie = Math.min(J.energieMax, J.energie + stat(t, "prod") * soleilSur(t.angPose ?? SOLEIL) * dt);
      if (J.energie >= J.energieMax - 1 && J.vague > 0){
        t.cristT = (t.cristT || 0) + dt;
        if (t.cristT >= 5){ t.cristT = 0; const n = Math.round(10 * R().gain); gagne(n); texte("+" + n, t.x, t.y - 30, "#B8F2FF", 15); }
      }
    },
    dessine(t, tm){
      socle(t, "#9AA3C4");
      bx(-20, -34, 40, 20, "#2D4A9A", t.g + 2, 1);
      for (let i = 1; i < 5; i++) bande(-20 + i * 8, -34, -20 + i * 8, -14, 1, "#6F8FE0", 0, 0);
      bx(-6, -14, 12, 14, "#2D3570", t.g + 3, .5);
      const k = J && J.energieMax ? J.energie / J.energieMax : .8;
      bx(-4, -2 - 10 * k, 8, 10 * k, "#FFD447", 0, 0);
    }
  },
  annihilateur:{ ...HYBRIDE,
    nom:"Annihilateur", prix:590, contre:["boss", "armure"], genre:"tir", tir:"rayon", percant:true, pourcent:.1, portee:260, cadence:2, deg:60, energie:7, effets:{ rebond:1 }, couleurTir:"#FF5E8A", bouche:26,
    desc:"L'arme ultime : un rayon qui traverse tout blindage, arrache une grosse part de vie et rebondit.",
    dessine(t){
      socle(t, "#B88FB8");
      c.save(); c.rotate(visee(t)); c.translate(0, t.recul * 5);
      bx(-11, -36, 22, 34, "#5B3A70", t.g + 2, 1.1);
      ov(0, -36, 10, 6, "#FF5E8A", t.g + 3, .3);
      for (let i = 0; i < 3; i++) ov(0, -28 + i * 8, 6, 2, "#8FDCFF", i, 0);
      c.restore();
    }
  }
});

const FUSIONS = [
  { a:"fusee", b:"panneau", res:"missileSolaire" },
  { a:"laser", b:"panneau", res:"laserSolaire" },
  { a:"laser", b:"tracteur", res:"laserGlacant" },
  { a:"laser", b:"radar", res:"laserRadar" },
  { a:"fusee", b:"tracteur", res:"fuseeAimantee" },
  { a:"drone", b:"mitrailleuse", res:"droneMitrailleur" },
  { a:"batterie", b:"panneau", res:"centrale" },
  { a:"ionique", b:"plasma", res:"annihilateur" }
];
const coutFusion = (a, b) => Math.round((TOURS[a].prix + TOURS[b].prix) * .3);
function partenaire(J, t, type){
  let best = null, bd = Infinity;
  for (const x of J.tours) if (x !== t && x.type === type){ const d = dist(x.x, x.y, t.x, t.y); if (d < bd){ bd = d; best = x; } }
  return best;
}
function fusionne(J, t, f){
  const autre = f.a === t.type ? f.b : f.a;
  const p = partenaire(J, t, autre);
  if (!p) return false;
  const cout = coutFusion(t.type, autre);
  if (J.argent < cout){ refuse("argent"); return false; }
  J.argent -= cout;
  const niv = Math.min(t.niv, p.niv), degats = t.degats + p.degats, investi = t.investi + p.investi + cout;
  confettis(p.x, p.y, ["#FFE27A", "#7BE0A8", "#FFFFFF"], 14);
  retireTour(p, "fusion");
  Object.assign(t, { type:f.res, d:TOURS[f.res], niv, branche:undefined, investi, degats, cd:.4, cible:null, cibles:null, orb:undefined, recul:1 });
  for (let i = 0; i < 3; i++) J.effets.push({ genre:"onde", x:t.x, y:t.y, r:60 + i * 25, t:-i * .08, dur:.5, coul:"rgba(255,226,122,.9)" });
  confettis(t.x, t.y, ["#FFE27A", "#FF8FB1", "#7BE0A8", "#FFFFFF"], 26);
  etoilesAutour(t.x, t.y);
  banniere("Fusion : " + t.d.nom + " !", false, 2200); son("pouvoir");
  J.score += 300;
  majHUD(true);
  return true;
}

/* les fusions possibles en ce moment : un éclair entre chaque paire */
const ORDRE_FUSIONS = ["annihilateur", "missileSolaire", "droneMitrailleur", "laserRadar", "laserSolaire", "fuseeAimantee", "centrale", "laserGlacant"];
function pairesFusion(J){
  const pris = new Set(), res = [];
  for (const nom of ORDRE_FUSIONS){
    const f = FUSIONS.find(x => x.res === nom);
    for (;;){
      let best = null, bd = Infinity;
      for (const a of J.tours) if (a.type === f.a && !pris.has(a))
        for (const b of J.tours) if (b.type === f.b && !pris.has(b)){ const d = dist(a.x, a.y, b.x, b.y); if (d < bd){ bd = d; best = [a, b]; } }
      if (!best) break;
      const [a, b] = best;
      pris.add(a); pris.add(b);
      const k = Math.min(42, bd / 2) / (bd || 1);
      res.push({ a, b, f, cout:coutFusion(f.a, f.b), x:a.x + (b.x - a.x) * k, y:a.y + (b.y - a.y) * k - 6 });
    }
  }
  return res;
}
function eclair(x, y, s, coul){
  fo([x + 2 * s, y - 9 * s, x - 5 * s, y + 1 * s, x, y + 1 * s, x - 2 * s, y + 9 * s, x + 5 * s, y - 1 * s, x, y - 1 * s], coul, 3, .4);
}

ajouteMonde({
  id:"espace", nom:"La Base spatiale",
  mecanique:"Faire tourner les anneaux · énergie",
  accroche:"Ça arrive de tous les côtés ! Fais tourner tes anneaux pour viser, et surveille ton énergie.",
  histoire:"La base spatiale des Gardiens flotte tranquille… quand des astéroïdes et des petits visiteurs curieux arrivent de partout à la fois. Protège le bouclier !",
  regles:[
    "Pose tes tourelles sur les <b>emplacements des deux anneaux</b> autour de la base.",
    "Une tourelle ne tire que <b>vers l'extérieur, dans son cône</b>. <b>Fais glisser un anneau</b> avec le doigt (ou la souris) pour le faire tourner et viser là où ça arrive. Au clavier : ← → pour l'anneau du milieu, Maj + ← → pour le grand.",
    "Chaque tir coûte de l'<b>énergie</b>. Sans énergie, plus rien ne tire !",
    "Les <b>panneaux solaires</b> en fabriquent, et beaucoup plus quand ils sont tournés vers le soleil, en haut à gauche.",
    "Les gros astéroïdes se cassent en deux petits cailloux. Les <b>aliens furtifs</b> sont invisibles tant qu'ils sont loin.",
    "Le <b>drone</b> quitte son anneau et tire tout autour : pas besoin de le tourner.",
    "Pas assez de place ? <b>Fusionne</b> deux tourelles en une : touche une tourelle, sa fiche te propose les mélanges possibles. La fusion garde le plus petit des deux niveaux et libère un emplacement.",
    "Les recettes : " + FUSIONS.map(f => TOURS[f.a].nom + " + " + TOURS[f.b].nom + " = <b>" + TOURS[f.res].nom + "</b>").join(" · ") + "."
  ],
  pouvoirs:[
    { id:"impulsion", nom:"Impulsion", recharge:40,
      desc:"Une onde géante part de la base : tout ce qui est proche est sonné et repoussé.",
      icone(u){ ov(u*.5, u*.5, u*.12, u*.12, "#7BE0A8", 1, 1); for (let i = 1; i < 3; i++){ c.beginPath(); c.arc(u*.5, u*.5, u*(.16 + i * .14), 0, TAU); c.lineWidth = 3; c.strokeStyle = i === 1 ? "#B8F7D4" : "#7BE0A8"; c.stroke(); } },
      lance(J){
        for (const e of J.ennemis) if (e.r < 330){ if (!e.d.boss) ralentit(e, .02, 2.5); e.r += e.d.boss ? 20 : 70; blesse(e, 30, null); }
        for (let i = 0; i < 3; i++) J.effets.push({ genre:"onde", x:CX, y:CY, r:330 + i * 40, t:-i * .1, dur:.6, coul:"rgba(123,224,168,.9)" });
        secousse = .4;
      } },
    { id:"surcharge", nom:"Surcharge", recharge:50,
      desc:"Pendant 6 secondes, toutes les tourelles tirent deux fois plus vite… sans dépenser d'énergie !",
      icone(u){ fo([u*.58, u*.06, u*.2, u*.56, u*.46, u*.56, u*.38, u*.94, u*.8, u*.42, u*.54, u*.42], "#FF5E8A", 1, 1); },
      lance(J){ J.surcharge = J.t + 6; banniere("Surcharge !", false, 1200); } }
  ],
  conseil:"Mets des panneaux solaires sur l'anneau, et tourne-le pour qu'ils regardent le soleil entre deux vagues.",
  astuce:"<b>Astuce :</b> fais glisser un anneau pour le faire tourner. Quand un <b>éclair ⚡</b> relie deux tourelles, touche-le pour les <b>fusionner</b> !",
  texteVictoire:"La base est sauvée !", texteDefaite:"Le bouclier a lâché…",
  nomVies:"Bouclier", nomMonnaie:"Cristaux", texteVente:"Démonter",
  vies:10, argent:170, croissance:.07, attente:16, durGrand:.65, primeVague:(J) => 10 + J.vague * 4,
  couleurMonnaie:"#B8F2FF", couleurFond:"#1D2152", ombre:"rgba(0,0,0,.42)",
  apercu:{ tours:[["laser", CX + 104, CY, 0], ["panneau", CX - 74, CY - 74, -2.36], ["fusee", CX - 54, CY + 180, 1.86]],
           ennemis:[["asteroide", 760, 160, 1], ["soucoupe", 200, 420, 1], ["comete", 640, 470, 1]] },
  tours:TOURS, ennemis:ENNEMIS,
  courbe:[.055, .0075], get gain(){ return CARTE.gain; },
  cartes:CARTES, charge, geo:() => ({ anneaux:ANNEAUX, CX, CY }),
  programme:{ budget:40, boss:"mere", bossPv:.6, ennemis:{
    asteroide:{ des:1, menace:9 }, soucoupe:{ des:2, menace:7 }, comete:{ des:4, menace:8 }, cuirasse:{ des:9, menace:24 },
    furtif:{ des:12, menace:12 }, gardien:{ des:15, menace:15 }, essaim:{ des:19, menace:2.5 }, reparateur:{ des:21, menace:14 }
  } },
  entreeGroupe:(v, x) => x < .3 ? null : Math.floor((x - .3) / .7 * 8) * 45,

  iconeVie(u){ ov(u*.5, u*.5, u*.4, u*.4, "rgba(123,224,168,.35)", 1, 0); papier(ovale(u*.5, u*.5, u*.4, u*.4, 2), "rgba(0,0,0,0)", 0);
               fo([u*.5, u*.12, u*.85, u*.28, u*.8, u*.62, u*.5, u*.9, u*.2, u*.62, u*.15, u*.28], "#7BE0A8", 3, 1); fo([u*.5, u*.24, u*.72, u*.34, u*.68, u*.6, u*.5, u*.76], "#B8F7D4", 4, 0); },
  iconeMonnaie(u){ fo([u*.5, u*.08, u*.82, u*.4, u*.5, u*.92, u*.18, u*.4], "#7FD9F2", 1, 1); fo([u*.5, u*.08, u*.62, u*.4, u*.5, u*.92], "#B8F2FF", 2, 0); },
  compteurs:[{
    cle:"energie", nom:"Énergie",
    icone(u){ fo([u*.58, u*.06, u*.2, u*.56, u*.46, u*.56, u*.38, u*.94, u*.8, u*.42, u*.54, u*.42], "#FFD447", 1, 1); },
    valeur:(J) => `${Math.floor(J.energie)}<small> / ${J.energieMax}</small>`
  }],
  buff(J, t, k){
    if (k !== "deg") return 1;
    for (const p of J.tours) if (p !== t && effet(p, "visee") && dist(p.x, p.y, t.x, t.y) < 220) return 1.25;
    return 1;
  },
  dessineEffet(f, k){
    if (f.genre === "trou"){
      c.save(); c.translate(f.x, f.y); c.rotate(k * 8); c.globalAlpha = 1 - k;
      for (let i = 0; i < 4; i++) feuille(0, 0, f.r * (1 - k) * .8, 20, i * TAU / 4, "#7A4E9E", i, 0);
      ov(0, 0, 14 * (1 - k * .5), 14 * (1 - k * .5), "#120B26", 1, 0);
      c.restore();
    }
  },
  orienteTour(a){ if (a !== undefined) c.rotate(a + Math.PI / 2); },

  init(J){
    if (J.carte !== undefined) charge(J.carte);
    J.rot = ANNEAUX.map(() => 0); J.occ = {}; J.energie = 100; J.energieMax = 100; J.tourne = null;
  },
  maj(J, dt){
    J.energieMax = 100 + J.tours.reduce((n, t) => n + (t.d === TOURS.batterie ? 60 : t.d === TOURS.centrale ? 120 : 0) * mult(t, "prod"), 0);
    J.energie = Math.min(J.energieMax, J.energie + 4.5 * dt);
    for (const t of J.tours) if (t.d.prodEnergie) J.energie = Math.min(J.energieMax, J.energie + t.d.prodEnergie * mult(t, "prod") * soleilSur(t.angPose ?? SOLEIL) * dt);
    if (J.tourne) J.rot[J.tourne.k] += J.tourne.s * 1.7 * dt;
    for (const t of J.tours){
      if (t.d.libre){
        /* le drone tourne tout seul autour de la base */
        t.orb = (t.orb ?? angleSlot(J, t.anneau, t.slot)) + dt * (branche(t) && branche(t).mods ? 1.4 : .8);
        t.x = CX + Math.cos(t.orb) * 148; t.y = CY + Math.sin(t.orb) * 148; t.angPose = undefined;
        continue;
      }
      const a = angleSlot(J, t.anneau, t.slot);
      t.angPose = a; t.x = CX + Math.cos(a) * ANNEAUX[t.anneau].r; t.y = CY + Math.sin(a) * ANNEAUX[t.anneau].r;
    }
  },
  visible(J, e){ return e.r < 110; },
  protege(J, e){
    if (!(J.charges > 0)) return false;
    J.charges--; texte("Bloqué !", e.x, e.y - 20, "#B8F7D4", 18); confettis(e.x, e.y, ["#7BE0A8", "#FFFFFF"], 14); son("pop");
    return true;
  },
  cout(J, t){
    if (J.surcharge > J.t){ t.enPanne = false; return true; }
    const e = t.d.energie || 0;
    if (J.energie < e){ t.enPanne = true; return false; }
    t.enPanne = false; J.energie -= e; return true;
  },
  FUSIONS, fusionne, pairesFusion,
  /* un appui sur un éclair = la fusion, directement */
  clic(J, p){
    for (const q of pairesFusion(J)){
      if (dist(p.x, p.y, q.x, q.y) > 24) continue;
      if (J.argent < q.cout){ refuse("argent"); texte("Il faut " + q.cout + " cristaux", q.x, q.y - 26, "#FFE27A", 15); return true; }
      fusionne(J, q.a, q.f);
      choisisTour(q.a);
      return true;
    }
    return false;
  },
  finVague(J){
    if (!J.fusionAnnoncee && pairesFusion(J).length){ J.fusionAnnoncee = true; banniere("⚡ Fusion possible : touche l'éclair !", false, 3200); }
  },
  boutonsFiche(J, t){
    const rec = FUSIONS.filter(f => f.a === t.type || f.b === t.type);
    if (!rec.length) return "";
    let html = '<div class="gdc-fusions"><small>Fusionner pour gagner de la place</small>';
    for (const f of rec){
      const autre = f.a === t.type ? f.b : f.a, res = TOURS[f.res], cout = coutFusion(t.type, autre);
      if (partenaire(J, t, autre)) html += `<button class="gdc-fusion" data-a="fus:${FUSIONS.indexOf(f)}"${J.argent < cout ? " disabled" : ""}><b>+ ${TOURS[autre].nom} → ${res.nom}</b><span>${res.desc}</span><em>Fusion · ${cout}</em></button>`;
      else html += `<p class="gdc-fusion-idee">+ ${TOURS[autre].nom} → <b>${res.nom}</b>${dispo(TOURS[autre]) ? "" : " (vague " + TOURS[autre].debloque + ")"}</p>`;
    }
    return html + "</div>";
  },
  actionFiche(J, t, a){ if (a.startsWith("fus:")) fusionne(J, t, FUSIONS[+a.slice(4)]); },
  vise(J, t, e){
    if (t.d.libre || t.d.toutAutour || t.angPose === undefined) return true;
    return Math.abs(ecartAngle(t.angPose, Math.atan2(e.y - t.y, e.x - t.x))) <= arc(t);
  },
  emplacement(J, x, y){
    let meilleur = null, md = 34;
    ANNEAUX.forEach((A, k) => {
      for (let i = 0; i < A.n; i++){
        const a = angleSlot(J, k, i), sx = CX + Math.cos(a) * A.r, sy = CY + Math.sin(a) * A.r, d = dist(x, y, sx, sy);
        if (d < md){ md = d; meilleur = { x:sx, y:sy, ang:a, cle:k + ":" + i, anneau:k, slot:i }; }
      }
    });
    if (!meilleur) return { ok:false, raison:"Pose-la sur un anneau", x:undefined };
    meilleur.ok = !J.occ[meilleur.cle];
    meilleur.raison = meilleur.ok ? null : "Déjà occupé";
    return meilleur;
  },
  pose(J, t, emp){ J.occ[t.cle] = t; t.anneau = emp.anneau; t.slot = emp.slot; t.angPose = t.d.libre ? undefined : emp.ang; },
  retire(J, t){ delete J.occ[t.cle]; },
  dessinePortee(x, y, t, ok){
    const r = stat(t, "portee"); if (!r) return;
    const tour = t.d.libre || t.d.toutAutour;
    const a = t.angPose ?? t.ang ?? 0, w = tour ? Math.PI : arc(t);
    c.beginPath(); if (!tour) c.moveTo(x, y); c.arc(x, y, r, a - w, a + w); c.closePath();
    c.fillStyle = ok ? "rgba(255,255,255,.16)" : "rgba(224,83,61,.2)"; c.fill();
    c.setLineDash([6, 5]); c.lineWidth = 2; c.strokeStyle = ok ? "rgba(255,255,255,.8)" : "rgba(224,83,61,.9)"; c.stroke(); c.setLineDash([]);
  },
  infoTour(J, t){
    if (t.d.cacheBoutique){
      const f = FUSIONS.find(x => x.res === t.type);
      const prod = t.d.prodEnergie ? ` · produit ${(t.d.prodEnergie * mult(t, "prod") * soleilSur(t.angPose ?? SOLEIL)).toFixed(1)} énergie/s` : "";
      return `Fusion de <b>${TOURS[f.a].nom}</b> + <b>${TOURS[f.b].nom}</b>. ${t.d.deg ? "Force <b>" + Math.round(stat(t, "deg")) + "</b>" : ""}${prod}`;
    }
    if (t.d === TOURS.panneau) return `Produit <b>${(stat(t, "prod") * soleilSur(t.angPose)).toFixed(1)}</b> énergie par seconde (face au soleil : ${(stat(t, "prod")).toFixed(1)}).`;
    const e = t.d === TOURS.tracteur ? `${t.d.energie} énergie par seconde` : `${t.d.energie} énergie par tir`;
    return `Force <b>${Math.round(stat(t, "deg"))}</b> · ${e}`;
  },
  debutGlisse(J, p){
    const r = dist(p.x, p.y, CX, CY);
    let k = -1, md = 36;
    ANNEAUX.forEach((A, i) => { const d = Math.abs(r - A.r); if (d < md){ md = d; k = i; } });
    if (k < 0) return null;
    return { k, a0:Math.atan2(p.y - CY, p.x - CX), rot0:J.rot[k] };
  },
  glisse(J, appui, p){
    const d = appui.debut; if (!d) return;
    J.rot[d.k] = d.rot0 + ecartAngle(d.a0, Math.atan2(p.y - CY, p.x - CX));
    J.glisse = d.k;
  },
  finGlisse(J){ J.glisse = null; },
  touche(J, k, bas, ev){
    if (k !== "ArrowLeft" && k !== "ArrowRight") return false;
    if (!bas){ J.tourne = null; return true; }
    J.tourne = { k:Math.min(ANNEAUX.length - 1, ev.altKey ? 2 : ev.shiftKey ? 1 : 0), s:k === "ArrowLeft" ? -1 : 1 };
    return true;
  },

  apparait(J, e, entree){
    if (entree && typeof entree === "object"){ e.r = entree.r; e.a = entree.a; }
    else {
      e.r = ARRIVEE + alea(0, 30);
      e.a = entree === null || entree === undefined ? Math.random() * TAU : (entree / 180 * Math.PI) + alea(-.35, .35);
    }
    e.w = e.type === "soucoupe" ? (Math.random() < .5 ? -1 : 1) * alea(.18, .32) : 0;
    e.x = CX + Math.cos(e.a) * e.r; e.y = CY + Math.sin(e.a) * e.r;
  },
  deplace(J, e, dt){
    e.r -= vitesse(e) * dt;
    if (e.w) e.a += e.w * dt * (e.lentT > J.t ? e.lentF : 1) * (120 / Math.max(120, e.r));
    e.x = CX + Math.cos(e.a) * e.r; e.y = CY + Math.sin(e.a) * e.r;
    e.prog = -e.r;
    return e.r < BASE + (e.d.r || 10) * .4;
  },
  perdVie(J, e){ confettis(e.x, e.y, ["#7BE0A8", "#B8F7D4", "#FFFFFF"], 14); J.choc = 1; },

  fond(J){
    const g = c.createRadialGradient(CX, CY, 40, CX, CY, 620);
    g.addColorStop(0, "#2A3170"); g.addColorStop(1, "#151840");
    c.fillStyle = g; c.fillRect(0, 0, W, H);
    for (let i = 0; i < 7; i++) ov(hache(i + 600) * W, hache(i + 620) * H, 80 + hache(i) * 90, 40 + hache(i + 1) * 50, i % 2 ? "rgba(122,78,158,.18)" : "rgba(62,159,201,.14)", i, 0);
    for (let i = 0; i < 90; i++){
      const x = hache(i + 700) * W, y = hache(i + 800) * H, s = .8 + hache(i + 900) * 2.2;
      if (i % 7 === 0) etoile5(x, y, s * 2.2, s * .9, "#FFF3C4", i, .3);
      else ov(x, y, s * .7, s * .7, i % 3 ? "#DDE3FF" : "#FFF3C4", i, 0);
    }
    /* le soleil, là où le terrain le place */
    const sd = CARTE.soleilDist || 520, sx = CX + Math.cos(SOLEIL) * sd, sy = CY + Math.sin(SOLEIL) * sd;
    for (let i = 0; i < 12; i++) feuille(sx, sy, 150, 40, i / 12 * TAU, i % 2 ? "#E9A93A" : "#F2C14E", i, 0);
    ov(sx, sy, 100, 100, "#FFC93C", 1, 1.4); ov(sx, sy, 78, 78, "#FFD95E", 2, 0);
    /* les planètes */
    CARTE.planetes.forEach(([x, y, r, coul, anneau], i) => {
      ov(x, y, r, r, coul, 3 + i, r > 30 ? 1.5 : 1); ov(x - r * .25, y - r * .25, r * .35, r * .26, "rgba(255,255,255,.3)", 4 + i, 0);
      if (anneau){ c.save(); c.translate(x, y); c.rotate(-.35); c.beginPath(); c.ellipse(0, 0, r * 1.6, r * .3, 0, 0, TAU); c.lineWidth = 6; c.strokeStyle = "rgba(242,179,59,.75)"; c.stroke(); c.restore(); }
    });
    /* la nébuleuse voile tout */
    if (CARTE.nebuleuse) for (let i = 0; i < 10; i++) ov(hache(i + 950) * W, hache(i + 970) * H, 120 + hache(i + 3) * 120, 70 + hache(i + 4) * 60, i % 2 ? "rgba(184,143,216,.20)" : "rgba(242,141,178,.14)", i + 40, 0);
  },
  dessineSol(J){
    /* les anneaux et leurs emplacements */
    ANNEAUX.forEach((A, k) => {
      const actif = J.glisse === k || (J.tourne && J.tourne.k === k);
      c.beginPath(); c.arc(CX, CY, A.r, 0, TAU);
      c.lineWidth = 26; c.strokeStyle = actif ? "rgba(255,255,255,.22)" : "rgba(255,255,255,.10)"; c.stroke();
      c.lineWidth = 2; c.setLineDash([3, 9]); c.strokeStyle = "rgba(255,255,255,.35)"; c.stroke(); c.setLineDash([]);
      for (let i = 0; i < A.n; i++){
        const a = angleSlot(J, k, i), x = CX + Math.cos(a) * A.r, y = CY + Math.sin(a) * A.r;
        if (J.occ && J.occ[k + ":" + i]) continue;
        ov(x, y, 11, 11, "rgba(255,255,255,.18)", i + k * 20, 0);
        c.beginPath(); c.arc(x, y, 11, 0, TAU); c.lineWidth = 1.5; c.strokeStyle = "rgba(255,255,255,.45)"; c.stroke();
      }
      /* les flèches qui disent « je tourne » */
      for (const s of [0, Math.PI]){
        const a = (J.rot ? J.rot[k] : 0) + s + .5 + k;
        c.beginPath(); c.arc(CX, CY, A.r + 22, a, a + .28);
        c.lineWidth = 3; c.lineCap = "round"; c.strokeStyle = "rgba(255,255,255,.3)"; c.stroke();
        const fx = CX + Math.cos(a + .28) * (A.r + 22), fy = CY + Math.sin(a + .28) * (A.r + 22);
        c.save(); c.translate(fx, fy); c.rotate(a + .28 + Math.PI / 2);
        c.globalAlpha = .3; fo([-5, -4, 6, 0, -5, 4], "#FFFFFF", 0, 0); c.globalAlpha = 1; c.restore();
      }
    });
    /* les cônes de tir, discrets */
    for (const t of (J.tours || [])){
      if (!t.d.portee || J.choisie === t || t.d.libre || t.d.toutAutour) continue;
      const a = t.angPose, w = arc(t);
      c.beginPath(); c.moveTo(t.x, t.y); c.arc(t.x, t.y, stat(t, "portee") * .55, a - w, a + w); c.closePath();
      c.fillStyle = t.enPanne ? "rgba(224,83,61,.10)" : "rgba(255,255,255,.06)"; c.fill();
    }
    /* la base */
    const choc = J.choc || 0;
    if (J.choc) J.choc = Math.max(0, J.choc - .03);
    const k = J.vies / J.viesMax;
    c.beginPath(); c.arc(CX, CY, BASE + 8, 0, TAU);
    c.fillStyle = `rgba(123,224,168,${.10 + k * .18 + choc * .4})`; c.fill();
    c.lineWidth = 3; c.strokeStyle = `rgba(184,247,212,${.3 + k * .5})`; c.stroke();
    ov(CX, CY, 40, 40, "#9AA3C4", 11, 1.4);
    ov(CX, CY, 30, 30, "#C9CFE6", 12, .4);
    ov(CX, CY - 4, 17, 15, "#BFF0FF", 13, .5);
    ov(CX - 5, CY - 9, 5, 4, "rgba(255,255,255,.7)", 0, 0);
    for (let i = 0; i < 6; i++){ const a = i / 6 * TAU + J.t * .3; ov(CX + Math.cos(a) * 34, CY + Math.sin(a) * 34, 2.6, 2.6, i % 2 ? "#FFE27A" : "#7BE0A8", 0, 0); }
    for (let i = 0; i < (J.charges || 0); i++){ const a = -Math.PI / 2 + (i - (J.charges - 1) / 2) * .5; ov(CX + Math.cos(a) * (BASE + 30), CY + Math.sin(a) * (BASE + 30), 6, 6, "#7BE0A8", i, .5); }
    /* la jauge d'énergie autour de la base */
    if (J.energieMax){
      c.beginPath(); c.arc(CX, CY, BASE + 16, -Math.PI / 2, -Math.PI / 2 + TAU * J.energie / J.energieMax);
      c.lineWidth = 5; c.lineCap = "round"; c.strokeStyle = J.energie < 10 ? "#E0533D" : "#FFD447"; c.stroke();
    }
  },
  dessineDessus(J){
    /* les éclairs de fusion */
    if (!J.apercu){
      const paires = pairesFusion(J);
      if (paires.length && !J.fusionAnnoncee && J.vague > 0){ J.fusionAnnoncee = true; banniere("⚡ Fusion possible : touche l'éclair !", false, 3200); }
      for (const q of paires){
        const ok = J.argent >= q.cout, pulse = 1 + Math.sin(J.t * 5) * .08;
        c.save(); c.globalAlpha = ok ? .7 : .35;
        c.setLineDash([5, 6]); c.lineDashOffset = -J.t * 20;
        c.beginPath(); c.moveTo(q.a.x, q.a.y - 8); c.lineTo(q.b.x, q.b.y - 8);
        c.lineWidth = 2.5; c.strokeStyle = "#FFE27A"; c.stroke(); c.setLineDash([]);
        c.restore();
        c.save(); c.translate(q.x, q.y); c.scale(pulse, pulse);
        if (ok){ c.globalAlpha = .35; ov(0, 0, 21, 21, "#FFE27A", 1, 0); c.globalAlpha = 1; }
        ov(0, 0, 15, 15, ok ? "#F2B33B" : "#8790BA", 2, 1);
        eclair(0, 0, 1.2, ok ? "#FFFFFF" : "#DCE6EE");
        c.restore();
        texteP(String(q.cout), q.x, q.y + 24, 12, ok ? "#FFE27A" : "#DCE6EE", "center", "rgba(0,0,0,.6)");
      }
    }
    for (const t of J.tours) for (const e of (t.cibles || [])){
      if (e.mort) continue;
      c.globalAlpha = .45 + Math.sin(J.t * 20) * .1;
      const a = Math.atan2(e.y - t.y, e.x - t.x), px = -Math.sin(a), py = Math.cos(a), l = dist(t.x, t.y, e.x, e.y);
      papier([t.x + px * 4, t.y + py * 4, e.x + px * 18, e.y + py * 18, e.x - px * 18, e.y - py * 18, t.x - px * 4, t.y - py * 4], "#6FD3A0", 0);
      c.globalAlpha = 1;
      if (l > 0) for (let i = 0; i < 3; i++){ const k = ((J.t * 1.5 + i / 3) % 1); ov(e.x - Math.cos(a) * l * k, e.y - Math.sin(a) * l * k, 3, 3, "#E9FFE9", i, 0); }
    }
    if (J.energie !== undefined && J.energie < 6 && J.tours.some(t => t.d.energie) && Math.floor(J.t * 2) % 2)
      texteP("Plus d'énergie !", CX, CY + BASE + 40, 17, "#FFD447", "center", "rgba(0,0,0,.6)");
  }
});
}
