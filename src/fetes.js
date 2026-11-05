/* ═════════════════════════════════════════════════════════════
   LES FÊTES — le jeu s'habille comme le site des Lilous
   ═════════════════════════════════════════════════════════════

   ★★★★★  C'EST ICI POUR FAIRE LA LIAISON AVEC LE SITE  ★★★★★

   Le jeu cherche la fête du moment, dans cet ordre (le premier trouvé gagne) :

     1. l'adresse de la page, pour essayer :      …/les-gardiens-du-centre.html?fete=halloween
     2. une variable posée par le site AVANT le script du jeu :
            <script>window.LILOUS_FETE = "halloween";</script>
     3. un attribut sur le bloc du jeu, ou sur <html> / <body> :
            <div id="gdc" data-fete="halloween"></div>
            <body data-theme="noel">

   Si le site change de thème sans recharger la page, il prévient le jeu :
            window.GardiensDuCentre.fete("carnaval");
     ou     document.dispatchEvent(new CustomEvent("lilous:fete", { detail: "carnaval" }));
   (et si le site change l'attribut data-fete ou data-theme de <html> ou <body>,
    le jeu le voit tout seul).

   Les noms reconnus — majuscules, accents et « / » ne comptent pas, on peut donc
   envoyer tel quel le libellé du site :
     habituel · halloween · noel (« Noël / Hiver », « hiver ») · carnaval
     · paques (« Pâques / Printemps », « printemps ») · ete (« Été / Plage », « plage »)
   Un nom inconnu (ou vide) remet la tenue habituelle.
   ═════════════════════════════════════════════════════════════ */

const FETES = {
  habituel:{ nom:"Habituel" },
  halloween:{
    nom:"Halloween", badge:"🎃 Spécial Halloween",
    titre:["#F28B2C", "#7A4E9E", "#3B2A4A", "#8DBE4A", "#E0533D"],
    voile:"rgba(70,30,110,.14)", chute:"feuilles", chapeau:"sorciere", cadeau:"citrouille",
    guirlande:{ fil:"#3B2A4A", motifs:["citrouille", "fanion", "chauve-souris", "fanion"], couleurs:["#7A4E9E", "#F28B2C", "#3B2A4A"] },
  },
  noel:{
    nom:"Noël / Hiver", badge:"❄️ Spécial Noël",
    titre:["#C8323A", "#2F8F6B", "#3E9FC9", "#C8323A", "#D9A520"],
    voile:"rgba(190,220,255,.12)", chute:"neige", chapeau:"bonnet", cadeau:["#C8323A", "#2F8F6B", "#3E6FC9"],
    guirlande:{ fil:"#2F6B4F", motifs:["ampoule"], couleurs:["#E0533D", "#F2B33B", "#3E9FC9", "#6DBE5B", "#E883B8"] },
  },
  carnaval:{
    nom:"Carnaval", badge:"🎭 Spécial Carnaval",
    titre:["#E0338C", "#7A4E9E", "#F2B33B", "#3E9FC9", "#2F8F6B"],
    chute:"confettis", chapeau:"cotillon", cadeau:["#E0338C", "#7A4E9E", "#3E9FC9", "#2F8F6B"],
    guirlande:{ fil:"#7A4E9E", motifs:["fanion"], couleurs:["#E0338C", "#F2B33B", "#3E9FC9", "#7A4E9E", "#6DBE5B"] },
  },
  paques:{
    nom:"Pâques / Printemps", badge:"🐣 Spécial Pâques",
    titre:["#E883B8", "#8DBE4A", "#5FB8E8", "#F2B33B", "#B28AD8"],
    chute:"petales", chapeau:"oreilles", cadeau:"oeuf",
    guirlande:{ fil:"#8DBE4A", motifs:["fanion", "oeuf"], couleurs:["#F7B8D2", "#BFE3A0", "#BFE0F7", "#FCE28A", "#D9C3F0"] },
  },
  ete:{
    nom:"Été / Plage", badge:"☀️ Spécial été",
    titre:["#3EC1C9", "#F28D6B", "#F2B33B", "#3E9FC9", "#E0533D"],
    voile:"rgba(255,200,90,.07)", chute:"soleil", chapeau:"paille", cadeau:["#3EC1C9", "#F28D6B", "#F2B33B"],
    guirlande:{ fil:"#3E6FA0", motifs:["fanion"], couleurs:["#3EC1C9", "#FFFFFF", "#F28D6B", "#F2B33B"] },
  },
};
let FETE = FETES.habituel, idFete = "habituel";

/* « Noël / Hiver », "NOEL", "hiver"… → "noel" */
function nomFete(brut){
  const s = " " + String(brut || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]+/g, " ") + " ";
  if (/hallo/.test(s)) return "halloween";
  if (/ (noel|hiver|christmas|winter|xmas) /.test(s)) return "noel";
  if (/carna|mardi gras/.test(s)) return "carnaval";
  if (/ (paques?|printemps|easter|spring) /.test(s)) return "paques";
  if (/ (ete|plage|summer|beach) /.test(s)) return "ete";
  return "habituel";
}
function lisFete(){
  const adr = new URLSearchParams(location.search).get("fete");
  if (adr) return adr;
  if (window.LILOUS_FETE) return window.LILOUS_FETE;
  for (const el of [RACINE, document.documentElement, document.body]){
    if (!el) continue;
    const v = el.getAttribute("data-fete") || (el !== RACINE ? el.getAttribute("data-theme") : null);
    if (v) return v;
  }
  return "habituel";
}
function appliqueFete(brut){
  const id = nomFete(brut);
  idFete = id; FETE = FETES[id];
  RACINE.setAttribute("data-fete", id);
  fondCache = null;                                   /* le plateau se repeint */
  const gu = $(".gdc-guirlande");
  if (gu){
    gu.hidden = !FETE.guirlande;
    gu.style.backgroundImage = FETE.guirlande ? `url(${imageGuirlande(FETE.guirlande)})` : "";
  }
  if (!$(".gdc-menu").hidden && GRAIN) montreMenu();
  return id;
}
window.GardiensDuCentre = Object.assign(window.GardiensDuCentre || {}, {
  fete: (nom) => appliqueFete(nom),
  feteActuelle: () => idFete,
  fetes: Object.keys(FETES),
});
document.addEventListener("lilous:fete", (ev) => appliqueFete(ev.detail));
/* le site change l'attribut de <html> ou <body> : on suit */
try {
  const veille = new MutationObserver(() => {
    if (new URLSearchParams(location.search).get("fete")) return;
    for (const el of [document.documentElement, document.body]){
      const v = el && (el.getAttribute("data-fete") || el.getAttribute("data-theme"));
      if (v && nomFete(v) !== idFete){ appliqueFete(v); return; }
    }
  });
  for (const el of [document.documentElement, document.body]) if (el) veille.observe(el, { attributes:true, attributeFilter:["data-fete", "data-theme"] });
} catch(e){}

/* ── la guirlande qui pend au-dessus du cadre (une image de 480 × 34 qui se répète) ── */
const fil = (x) => 5 + 8 * Math.sin(Math.PI * (x % 240) / 240);
function imageGuirlande(gu){
  const k = document.createElement("canvas"), r = 2;
  k.width = 480 * r; k.height = 34 * r;
  const x = k.getContext("2d"); x.scale(r, r);
  avec(x, () => {
    c.beginPath(); c.moveTo(0, fil(0));
    for (let i = 4; i <= 480; i += 4) c.lineTo(i, fil(i));
    c.strokeStyle = gu.fil; c.lineWidth = 2; c.stroke();
    for (let i = 0; i < 16; i++){
      const px = 15 + i * 30, py = fil(px), motif = gu.motifs[i % gu.motifs.length], coul = gu.couleurs[i % gu.couleurs.length];
      c.save(); c.translate(px, py); c.rotate(Math.cos(Math.PI * (px % 240) / 240) * .25);
      motifGuirlande(motif, coul, i, gu.fil);
      c.restore();
    }
  });
  return k.toDataURL();
}
function motifGuirlande(motif, coul, g, filC){
  if (motif === "fanion") fo([-10, 0, 10, 0, 0, 19], coul, g, .6);
  else if (motif === "ampoule"){
    bx(-3, -1, 6, 5, "#6F6A5E", g, 0);
    ov(0, 10, 5, 7, coul, g, .5);
    ov(-1.6, 7.5, 1.5, 2.4, "rgba(255,255,255,.7)", 0, 0);
  } else if (motif === "citrouille"){
    bande(0, -1, 0, 4, 2, filC, g, 0);
    ov(0, 11, 9, 7.5, "#F28B2C", g, .6); ov(0, 11, 3.6, 7.5, "#E07A1F", g + 1, 0);
    bx(-1.5, 2, 3, 3, "#5E7A2E", g, 0);
    fo([-5, 9, -2, 9, -3.5, 6.5], "#3B2A1A", g, 0); fo([2, 9, 5, 9, 3.5, 6.5], "#3B2A1A", g + 1, 0);
    fo([-4, 13, 4, 13, 0, 15.5], "#3B2A1A", g + 2, 0);
  } else if (motif === "chauve-souris") chauveSouris(0, 9, 1, g, 0);
  else if (motif === "oeuf"){
    bande(0, -1, 0, 3, 1.6, filC, g, 0);
    ov(0, 11, 6.5, 8.5, coul, g, .5);
    bande(-6.2, 11, 6.2, 11, 2.6, "#FFFFFF", g, 0);
  }
}
function chauveSouris(x, y, k, g, battement){
  const b = Math.sin(battement) * 3 * k;
  fo([x, y - 2*k, x - 6*k, y - 5*k - b, x - 13*k, y - 3*k - b, x - 10*k, y + 1*k, x - 6*k, y, x - 3*k, y + 3*k,
      x, y + 2*k, x + 3*k, y + 3*k, x + 6*k, y, x + 10*k, y + 1*k, x + 13*k, y - 3*k - b, x + 6*k, y - 5*k - b], "#2E2236", g, 0);
  fo([x - 2.5*k, y - 2*k, x - 3*k, y - 6*k, x - .8*k, y - 3*k, x + .8*k, y - 3*k, x + 3*k, y - 6*k, x + 2.5*k, y - 2*k], "#2E2236", g + 1, 0);
  ov(x - 1.2*k, y - 1*k, .8*k, .8*k, "#F2B33B", 0, 0); ov(x + 1.2*k, y - 1*k, .8*k, .8*k, "#F2B33B", 0, 0);
}

/* ── sur le plateau : la lumière, ce qui tombe, les petits décors ── */
const bougeMoins = () => { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch(e){ return false; } };
function dessineFete(){
  if (!FETE.chute && !FETE.voile) return;
  if (M && M.id === "espace") passageEspace();
  const t = J.t, calme = bougeMoins();
  if (FETE.voile){ c.fillStyle = FETE.voile; c.fillRect(0, 0, W, H); }
  const tombe = (n, vMin, vMax, f) => {
    for (let i = 0; i < n; i++){
      const v = vMin + hache(i * 3.1 + 1) * (vMax - vMin);
      const y = (hache(i * 1.9 + 2) * (H + 60) + (calme ? 0 : t * v)) % (H + 60) - 30;
      const x = hache(i * 7.7 + 3) * W + Math.sin(t * .9 + i * 1.7) * 16;
      f(x, y, i);
    }
  };
  switch (FETE.chute){
    case "feuilles":
      toiles();
      tombe(16, 22, 46, (x, y, i) => feuille(x, y, 12, 7, t * 1.3 + i, ["#E07A1F", "#C8452E", "#B8862E", "#8E5A2E"][i % 4], i, .5));
      for (let i = 0; i < 3; i++){
        const lg = W + 260, x = (calme ? hache(i) * W : (t * (55 + i * 14) + i * 420) % lg) - 130;
        chauveSouris(x, 70 + i * 120 + Math.sin(t * 2 + i) * 18, 1.25, i, t * 14 + i);
      }
      break;
    case "neige":
      tombe(48, 16, 38, (x, y, i) => ov(x, y, 1.6 + hache(i) * 2.4, 1.6 + hache(i) * 2.4, "rgba(255,255,255,.92)", i, 0));
      c.globalAlpha = .95;
      for (let x = -10; x < W + 30; x += 34) ov(x, H + 3, 24 + hache(x) * 8, 8 + hache(x + 1) * 4, "#FFFFFF", x, .4);
      c.globalAlpha = 1;
      break;
    case "confettis":
      tombe(42, 26, 56, (x, y, i) => {
        c.save(); c.translate(x, y); c.rotate(t * 3 + i); c.scale(1, Math.abs(Math.sin(t * 4 + i)) + .2);
        bx(-3, -2, 6, 4, FETE.titre[i % FETE.titre.length], i, 0); c.restore();
      });
      tombe(4, 14, 22, (x, y, i) => {
        c.beginPath();
        for (let k = 0; k <= 24; k++){ const yy = y + k * 2.4, xx = x + Math.sin(k * .7 + t * 2 + i) * 6; k ? c.lineTo(xx, yy) : c.moveTo(xx, yy); }
        c.strokeStyle = FETE.titre[(i + 2) % FETE.titre.length]; c.lineWidth = 2.6; c.lineCap = "round"; c.stroke();
      });
      break;
    case "petales":
      tombe(24, 16, 34, (x, y, i) => {
        c.save(); c.translate(x, y); c.rotate(t * 1.6 + i);
        ov(0, 0, 4.5, 2.6, ["#F7B8D2", "#FFFFFF", "#FCE28A", "#F4A6C6"][i % 4], i, .3); c.restore();
      });
      for (let i = 0; i < 2; i++){
        const x = (calme ? 300 + i * 300 : (t * 38 + i * 520) % (W + 120)) - 60, y = 110 + i * 230 + Math.sin(t * 1.7 + i) * 26;
        const b = Math.abs(Math.sin(t * 9 + i));
        feuille(x, y, 11, 9 * (b + .3), -2.3, ["#F28DB2", "#5FB8E8"][i], i, .3);
        feuille(x, y, 11, 9 * (b + .3), -.8, ["#F28DB2", "#5FB8E8"][i], i + 1, .3);
        bande(x, y - 3, x, y + 5, 2, "#3B2A1A", i, 0);
      }
      break;
    case "soleil": {
      const g = c.createRadialGradient(W - 40, 30, 10, W - 40, 30, 260);
      g.addColorStop(0, "rgba(255,236,150,.42)"); g.addColorStop(1, "rgba(255,236,150,0)");
      c.fillStyle = g; c.fillRect(W - 320, 0, 320, 300);
      for (let i = 0; i < 18; i++){
        const k = Math.sin(t * 2.2 + i * 2.3); if (k < .35) continue;
        etoile5(hache(i * 4.1) * W, hache(i * 2.7 + 5) * H, 5 * k, 1.6 * k, "rgba(255,255,255,.85)", i, 0);
      }
      break;
    }
  }
}
/* les toiles d'araignée dans les coins (Halloween) */
function toiles(){
  c.save(); c.strokeStyle = "rgba(255,255,255,.55)"; c.lineWidth = 1.2;
  for (const [cx, sx] of [[0, 1], [W, -1]]){
    for (let k = 0; k < 6; k++){ const a = k / 5 * Math.PI / 2; c.beginPath(); c.moveTo(cx, 0); c.lineTo(cx + sx * Math.cos(a) * 78, Math.sin(a) * 78); c.stroke(); }
    for (let r = 20; r <= 70; r += 17){
      c.beginPath();
      for (let k = 0; k <= 5; k++){ const a = k / 5 * Math.PI / 2, rr = r * (k % 5 ? .9 : 1); const x = cx + sx * Math.cos(a) * rr, y = Math.sin(a) * rr; k ? c.quadraticCurveTo(cx + sx * Math.cos(a - .16) * r * .78, Math.sin(a - .16) * r * .78, x, y) : c.moveTo(x, y); }
      c.stroke();
    }
  }
  c.restore();
  const y = 52 + Math.sin(J.t * 1.4) * 8;
  c.beginPath(); c.moveTo(46, 0); c.lineTo(46, y); c.strokeStyle = "rgba(255,255,255,.6)"; c.stroke();
  ov(46, y + 4, 4.5, 5, "#2E2236", 1, .4);
  for (const s of [-1, 1]) for (let k = 0; k < 3; k++) bande(46, y + 3 + k * 2, 46 + s * 8, y + k * 3, 1, "#2E2236", k, 0);
}

/* ── les chapeaux des bestioles ──
   Pendant son dessin, la bestiole dit où est sa tête : yeux() le fait tout seul, et celles qui
   dessinent leurs yeux à la main appellent marqueTete(x, bordDuChapeau, taille). On reprend alors
   exactement son repère (pas, saut, vol, miroir…). Pas de tête vue = pas de chapeau (les cailloux). */
function chapeauFete(e){
  if (!FETE.chapeau || e.cache || e.d.boss || !teteVue) return;   /* les boss gardent leur couronne */
  c.save(); c.setTransform(teteVue.m); c.translate(teteVue.x, 0);
  dessineChapeau(teteVue.y, borne(teteVue.k, .5, 1.5), e.g || 0);
  c.restore();
}
function dessineChapeau(y, k, g){
  switch (FETE.chapeau){
    case "sorciere":
      ov(0, y, 12 * k, 3.4 * k, "#3B2A4A", g, .5);
      fo([-7 * k, y, 7 * k, y, 3 * k, y - 11 * k, 8 * k, y - 16 * k, 0, y - 12 * k], "#4A3560", g, .5);
      bande(-6.4 * k, y - 2 * k, 6.4 * k, y - 2 * k, 2.6 * k, "#F28B2C", g, 0);
      break;
    case "bonnet":
      fo([-8 * k, y, 8 * k, y, 9 * k, y - 9 * k, 3 * k, y - 13 * k], "#C8323A", g, .5);
      bx(-9 * k, y - 2.5 * k, 18 * k, 5 * k, "#FFFFFF", g, .3);
      ov(9.5 * k, y - 9.5 * k, 3 * k, 3 * k, "#FFFFFF", g, .3);
      break;
    case "cotillon": {
      const coul = FETE.titre[g % FETE.titre.length];
      fo([-6 * k, y + 1, 6 * k, y + 1, 0, y - 15 * k], coul, g, .5);
      bande(-4.4 * k, y - 3 * k, 4.4 * k, y - 4.5 * k, 1.8 * k, "#FFFFFF", g, 0);
      bande(-2.4 * k, y - 8.5 * k, 2.4 * k, y - 9.5 * k, 1.6 * k, "#FFFFFF", g + 1, 0);
      etoile5(0, y - 16 * k, 3.4 * k, 1.5 * k, "#F2B33B", g, 0);
      break;
    }
    case "oreilles":
      for (const s of [-1, 1]){
        feuille(s * 4 * k, y + 1, 15 * k, 6.5 * k, -Math.PI / 2 + s * .22, "#FFFFFF", g + s, .5);
        feuille(s * 4 * k + s * .5, y - 1, 11 * k, 3 * k, -Math.PI / 2 + s * .22, "#F7B8D2", g + s, 0);
      }
      break;
    case "paille":
      ov(0, y, 13 * k, 3.6 * k, "#E9C46A", g, .5);
      ov(0, y - 3.5 * k, 7 * k, 5 * k, "#E2B85A", g + 1, .3);
      bande(-6.8 * k, y - 1.6 * k, 6.8 * k, y - 1.6 * k, 2.2 * k, "#E0533D", g, 0);
      break;
  }
}

/* ── les cadeaux qui tombent prennent la couleur de la fête ── */
function cadeauFete(s, g){
  const quoi = FETE.cadeau;
  if (quoi === "citrouille"){
    ov(0, 0, s * 1.05, s * .88, "#F28B2C", g, 1);
    ov(-s * .45, 0, s * .32, s * .82, "#E8801F", g + 1, 0); ov(s * .45, 0, s * .32, s * .82, "#E8801F", g + 2, 0);
    bx(-s * .13, -s * 1.12, s * .26, s * .4, "#5E7A2E", g, .3);
    fo([-s * .55, -s * .1, -s * .15, -s * .1, -s * .35, -s * .45], "#3B2A1A", g, 0);
    fo([s * .15, -s * .1, s * .55, -s * .1, s * .35, -s * .45], "#3B2A1A", g + 1, 0);
    fo([-s * .55, s * .25, s * .55, s * .25, s * .3, s * .5, 0, s * .32, -s * .3, s * .5], "#3B2A1A", g + 2, 0);
  } else if (quoi === "oeuf"){
    const coul = ["#F7B8D2", "#BFE0F7", "#FCE28A", "#D9C3F0"][g % 4];
    ov(0, 0, s * .8, s * 1.02, coul, g, 1);
    fo([-s * .78, -s * .05, -s * .4, -s * .3, 0, -s * .05, s * .4, -s * .3, s * .78, -s * .05, s * .78, s * .2, s * .4, -s * .05, 0, s * .2, -s * .4, -s * .05, -s * .78, s * .2], "#FFFFFF", g, 0);
    for (let i = -1; i <= 1; i++) ov(i * s * .38, s * .52, s * .1, s * .1, "#E0533D", g + i, 0);
  } else {
    const pal = Array.isArray(quoi) ? quoi : ["#E0533D", "#3E9FC9", "#7A4E9E", "#2F8F6B"];
    paquet(0, 0, s, g, pal[g % pal.length]);
  }
}

/* ═════════════════════════════════════════════════════════════
   LE SOL DE FÊTE
   Le décor du plateau est dessiné une fois dans une image (fond()) : on la repeint pixel par
   pixel selon la fête (l'herbe devient neige à Noël, roussit à Halloween…), puis on y sème
   quelques petits décors, seulement là où il y avait de l'herbe.
   ═════════════════════════════════════════════════════════════ */
function enHsl(r, g, b){
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
  if (!d) return [0, 0, l];
  const s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? ((g - b) / d + (g < b ? 6 : 0)) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h * 60, s, l];
}
function enRgb(h, s, l){
  h = ((h % 360) + 360) % 360 / 360; s = borne(s, 0, 1); l = borne(l, 0, 1);
  if (!s){ const v = Math.round(l * 255); return [v, v, v]; }
  const q = l < .5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
  const f = (t) => { t = (t + 1) % 1; return t < 1/6 ? p + (q - p) * 6 * t : t < 1/2 ? q : t < 2/3 ? p + (q - p) * (2/3 - t) * 6 : p; };
  return [Math.round(f(h + 1/3) * 255), Math.round(f(h) * 255), Math.round(f(h - 1/3) * 255)];
}
const estHerbe = (h, s, l) => h >= 60 && h <= 170 && s > .15 && l > .12 && l < .85;
const estSable = (h, s, l) => h >= 22 && h <= 55 && s > .25 && l > .5;
const estNuit = (h, s, l) => h >= 200 && h <= 300 && l < .45;           /* le ciel de l'espace et ses nébuleuses */
const estSoleil = (h, s, l) => h >= 30 && h <= 55 && s > .6 && l > .45;
/* lieu : "herbe" (potager, goûter), "sable" (plage) ou "ciel" (espace) */
const SOLS = {
  noel(h, s, l, lieu){
    if (estHerbe(h, s, l)) return l < .26 ? [h, s * .6, l] : [205, .4, borne(.88 + (l - .5) * .6, .74, .97)];
    if (lieu === "sable" && estSable(h, s, l)) return [h, s * .3, l + (1 - l) * .55];         /* la plage sous la neige */
    if (lieu !== "ciel" && estSable(h, s, l)) return [h, s * .55, l + (1 - l) * .35];        /* chemins givrés (pas le soleil !) */
    if (lieu === "ciel" && estNuit(h, s, l)) return [h - 10, s * .8, l * 1.12];               /* une nuit d'hiver, plus bleue */
    if (h >= 180 && h <= 215 && s > .3 && l > .35) return [h + 6, s * .7, l + (1 - l) * .3];  /* l'eau se glace un peu */
    return null;
  },
  halloween(h, s, l, lieu){
    if (estHerbe(h, s, l)) return [36 + (h - 93) * .3, Math.min(.62, s * 1.05), l * .8];     /* l'herbe d'automne, dorée */
    if (lieu === "sable" && estSable(h, s, l)) return [h - 6, s * .7, l * .8];                /* sable du soir */
    if (lieu === "ciel" && estNuit(h, s, l)) return [h + 42, s * 1.1, l * .95];               /* nuit violette */
    if (lieu === "ciel" && estSoleil(h, s, l)) return [h - 18, Math.min(1, s * 1.1), l * .95];/* soleil citrouille */
    return null;
  },
  carnaval(h, s, l, lieu){
    if (lieu === "ciel" && estNuit(h, s, l)) return [h + 55, s * 1.15, l * 1.05];             /* nuit de fête, prune */
    return null;
  },
  paques(h, s, l, lieu){
    if (estHerbe(h, s, l)) return [h + 4, s * 1.12, Math.min(.9, l * 1.06)];
    if (lieu === "sable" && estSable(h, s, l)) return [h - 8, s * .95, Math.min(.92, l * 1.04)];
    if (lieu === "ciel" && estNuit(h, s, l)) return [h + 22, s * .9, l * 1.25];               /* ciel pastel */
    return null;
  },
  ete(h, s, l, lieu){
    if (estHerbe(h, s, l)) return [h - 15, s * .95, Math.min(.9, l * 1.05)];
    if (lieu === "sable" && estSable(h, s, l)) return [h + 3, Math.min(1, s * 1.15), Math.min(.92, l * 1.03)];
    if (lieu === "ciel" && estNuit(h, s, l)) return [h - 28, s, l * 1.1];                     /* nuit d'été, bleu-vert */
    return null;
  },
};

/* les petits décors posés sur l'herbe */
function sapin(x, y, g){
  bx(x - 2, y - 2, 4, 7, "#7A5232", g, .4);
  for (let i = 0; i < 3; i++){
    const yy = y - 4 - i * 7, l = 11 - i * 3;
    fo([x - l, yy, x + l, yy, x, yy - 11], "#2F6B4F", g + i, .7);
    fo([x - l * .55, yy - 4, x + l * .55, yy - 4, x, yy - 10], "#FFFFFF", g + i + 5, 0);
  }
  etoile5(x, y - 26, 3.4, 1.5, "#F2B33B", g, 0);
}
function bonhomme(x, y, g){
  ov(x, y - 6, 8.5, 7.5, "#FFFFFF", g, .8); ov(x, y - 17, 6, 5.5, "#FFFFFF", g + 1, .6);
  bande(x - 6, y - 12, x + 6, y - 12, 2.6, "#C8323A", g, 0); bande(x + 4, y - 12, x + 6, y - 6, 2.4, "#C8323A", g + 1, 0);
  fo([x, y - 17, x + 7, y - 16, x, y - 15.4], "#F28B2C", g, 0);
  ov(x - 2.2, y - 19, .9, .9, "#2B211B", 0, 0); ov(x + 1.6, y - 19.4, .9, .9, "#2B211B", 0, 0);
  bx(x - 4.5, y - 24.5, 9, 2, "#2B211B", g, 0); bx(x - 3, y - 30, 6, 6, "#2B211B", g + 1, 0);
}
function citrouilleSol(x, y, g, s = 7){
  ov(x, y, s * 1.1, s * .85, "#F28B2C", g, .8); ov(x, y, s * .38, s * .85, "#E07A1F", g + 1, 0);
  bx(x - 1.2, y - s - 2, 2.4, 3.5, "#5E7A2E", g, 0);
  if (g % 2){ fo([x - 4, y - 1, x - 1, y - 1, x - 2.5, y - 3.5], "#3B2A1A", g, 0); fo([x + 1, y - 1, x + 4, y - 1, x + 2.5, y - 3.5], "#3B2A1A", g, 0); fo([x - 3.5, y + 2, x + 3.5, y + 2, x, y + 3.8], "#3B2A1A", g, 0); }
}
function oeufSol(x, y, g){
  const coul = ["#F7B8D2", "#BFE0F7", "#FCE28A", "#D9C3F0"][g % 4];
  ov(x, y, 5, 6.5, coul, g, .6); bande(x - 4.8, y, x + 4.8, y, 2, "#FFFFFF", g, 0);
  ov(x - 2, y - 3, .9, .9, "#FFFFFF", 0, 0); ov(x + 2, y + 3, .9, .9, "#FFFFFF", 0, 0);
}
function fleurSol(x, y, g, coul){
  for (let k = 0; k < 5; k++) ov(x + Math.cos(k * 1.26) * 3.6, y + Math.sin(k * 1.26) * 3.6, 2.8, 2.8, coul, g + k, .3);
  ov(x, y, 2, 2, "#F2B33B", 0, 0);
}
function tulipe(x, y, g){
  bande(x, y, x, y - 10, 1.6, "#4F9A43", g, 0); feuille(x, y - 1, 8, 3.5, -2.2, "#5AA84B", g, 0);
  fo([x - 4, y - 10, x - 4, y - 16, x - 1.5, y - 13.5, x, y - 17, x + 1.5, y - 13.5, x + 4, y - 16, x + 4, y - 10], ["#E883B8", "#F2B33B", "#E0533D", "#B28AD8"][g % 4], g, .4);
}
const DECORS_FETE = {
  noel:{ n:10, dessine(x, y, i){ (i % 3 === 2 ? bonhomme : sapin)(x, y, i); } },
  halloween:{ n:11, dessine(x, y, i){
    if (i % 3 === 2){ for (let k = 0; k < 5; k++) feuille(x + (hache(i + k) - .5) * 22, y + (hache(i + k + 9) - .5) * 12, 9, 5, hache(k + i) * 6, ["#E07A1F", "#C8452E", "#B8862E"][k % 3], i + k, .3); }
    else { citrouilleSol(x, y, i, 7 + (i % 2) * 2); if (i % 4 === 0) citrouilleSol(x + 12, y + 4, i + 1, 5); }
  } },
  paques:{ n:16, dessine(x, y, i){
    if (i % 2) oeufSol(x, y, i);
    else if (i % 4 === 0){ tulipe(x - 4, y, i); tulipe(x + 5, y + 2, i + 1); }
    else fleurSol(x, y, i, ["#FFFFFF", "#F7B8D2", "#FCE28A"][i % 3]);
  } },
  carnaval:{ n:14, dessine(x, y, i){
    const pal = FETES.carnaval.titre;
    for (let k = 0; k < 9; k++){ c.save(); c.translate(x + (hache(i * 9 + k) - .5) * 30, y + (hache(i * 9 + k + 50) - .5) * 18); c.rotate(hache(k + i) * 6); bx(-2.5, -1.5, 5, 3, pal[(i + k) % pal.length], i + k, 0); c.restore(); }
    if (i % 3 === 0){ c.beginPath(); for (let k = 0; k <= 20; k++){ const a = k * .6, rr = 2 + k * .5; const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * .6; k ? c.lineTo(px, py) : c.moveTo(px, py); } c.strokeStyle = pal[i % pal.length]; c.lineWidth = 2; c.stroke(); }
  } },
  ete:{ n:12, dessine(x, y, i){
    if (i === 3){ ov(x, y, 8, 8, "#FFFFFF", i, .8); fo([x - 8, y, x - 2, y - 7.5, x + 2, y - 7.5, x + 1, y + 7.9, x - 2, y + 7.6], "#E0533D", i, 0); fo([x + 3, y - 7, x + 8, y - 1, x + 7, y + 4, x + 3, y + 7], "#3E9FC9", i + 1, 0); }
    else fleurSol(x, y, i, i % 3 ? "#FFFFFF" : "#F7D046");
  } },
};

/* ── les décors de la plage (sur le sable) et de l'espace (dans le ciel, loin des anneaux) ── */
function pingouin(x, y, g){
  ov(x, y - 8, 7, 9.5, "#2B2B3A", g, .8); ov(x, y - 6.5, 4.6, 7, "#FFFFFF", g + 1, 0);
  ov(x, y - 17, 5, 4.6, "#2B2B3A", g + 2, .4);
  ov(x - 1.8, y - 17.5, 1.3, 1.3, "#FFFFFF", 0, 0); ov(x + 1.8, y - 17.5, 1.3, 1.3, "#FFFFFF", 0, 0);
  ov(x - 1.6, y - 17.4, .6, .6, "#2B211B", 0, 0); ov(x + 2, y - 17.4, .6, .6, "#2B211B", 0, 0);
  fo([x - 1.6, y - 15.6, x + 1.6, y - 15.6, x, y - 13.4], "#F2B33B", g, 0);
  ov(x - 3, y + 1, 2.6, 1.3, "#F2B33B", g, 0); ov(x + 3, y + 1, 2.6, 1.3, "#F2B33B", g + 1, 0);
  bande(x - 5, y - 11, x + 5, y - 11, 2.2, "#C8323A", g, 0);
}
function fantome(x, y, g){
  fo([x - 8, y, x - 8, y - 12, x - 5, y - 19, x, y - 21, x + 5, y - 19, x + 8, y - 12, x + 8, y, x + 5, y - 3, x + 2.5, y, x, y - 3, x - 2.5, y, x - 5, y - 3], "#FBF8F2", g, .8);
  ov(x - 2.8, y - 13, 1.6, 2.2, "#2B211B", 0, 0); ov(x + 2.8, y - 13, 1.6, 2.2, "#2B211B", 0, 0);
  ov(x, y - 8.5, 1.6, 1.9, "#2B211B", 0, 0);
}
function poussin(x, y, g){
  ov(x, y - 6, 7, 6.5, "#FCE28A", g, .7); ov(x + 3, y - 13, 4.6, 4.4, "#FCE28A", g + 1, .4);
  ov(x + 4.2, y - 13.8, .9, .9, "#2B211B", 0, 0);
  fo([x + 7, y - 13.5, x + 10, y - 12.5, x + 7, y - 11.5], "#F28B2C", g, 0);
  feuille(x - 3, y - 7, 6, 3.5, 2.6, "#F7D046", g, 0);
  fo([x - 7, y - 4, x - 3, y - 7, x + 1, y - 4, x + 5, y - 7, x + 7, y - 4, x + 7, y, x - 7, y], "#FBF6EA", g + 2, .4);   /* la coquille */
}
function serviette(x, y, g){
  c.save(); c.translate(x, y); c.rotate((hache(g) - .5) * .5);
  bx(-14, -8, 28, 16, ["#3E9FC9", "#E883B8", "#F2B33B"][g % 3], g, .6);
  for (let i = 0; i < 3; i++) bande(-14, -4 + i * 4, 14, -4 + i * 4, 1.6, "#FFFFFF", g + i, 0);
  c.restore();
}
function parasol(x, y, g){
  ov(x + 4, y + 2, 16, 5, "rgba(0,0,0,.12)", 0, 0);
  bande(x, y, x, y - 22, 1.8, "#8E6440", g, 0);
  const coul = ["#E0533D", "#3E9FC9", "#F2B33B"][g % 3];
  fo([x - 17, y - 20, x - 8, y - 29, x, y - 31, x + 8, y - 29, x + 17, y - 20], coul, g, .7);
  fo([x - 6, y - 21, x - 3, y - 30, x + 3, y - 30, x + 6, y - 21], "#FFFFFF", g + 1, 0);
}
function etoileMer(x, y, g){ etoile5(x, y, 7, 3, "#F28D6B", g, .6, -Math.PI / 2 + hache(g)); ov(x, y, 1.4, 1.4, "#FCE28A", 0, 0); }
function ballon(x, y, g, r = 7){
  ov(x, y, r, r, "#FFFFFF", g, .7);
  fo([x - r, y, x - r * .3, y - r * .95, x + r * .15, y - r, x + r * .1, y + r * .98, x - r * .3, y + r * .95], "#E0533D", g, 0);
  fo([x + r * .35, y - r * .9, x + r, y - r * .1, x + r * .9, y + r * .4, x + r * .35, y + r * .9], "#3E9FC9", g + 1, 0);
}
function boule(x, y, g){
  bande(x, y - 18, x, y - 9, 1, "rgba(255,255,255,.55)", g, 0);
  bx(x - 2, y - 10, 4, 3, "#D9A520", g, 0);
  ov(x, y - 2, 7, 7, ["#C8323A", "#3E9FC9", "#F2B33B", "#2F8F6B"][g % 4], g, .6);
  ov(x - 2.4, y - 4.4, 2, 1.6, "rgba(255,255,255,.6)", 0, 0);
  bande(x - 6.5, y - 1, x + 6.5, y - 1, 1.4, "rgba(255,255,255,.7)", g, 0);
}
function sucreOrge(x, y, g){
  c.save(); c.translate(x, y); c.rotate((hache(g) - .5) * 1.2);
  c.beginPath(); c.moveTo(0, 10); c.lineTo(0, -6); c.arc(-4, -6, 4, 0, Math.PI, true);
  c.lineWidth = 3.6; c.lineCap = "round"; c.strokeStyle = "#FFFFFF"; c.stroke();
  c.setLineDash([2.5, 3]); c.strokeStyle = "#C8323A"; c.stroke(); c.setLineDash([]);
  c.restore();
}
function lune(x, y, g){
  ov(x, y, 30, 30, "#F4EDD2", g, 1.2);
  ov(x - 9, y - 6, 6, 5, "#E2D9B8", g + 1, 0); ov(x + 8, y + 9, 8, 6, "#E2D9B8", g + 2, 0); ov(x + 11, y - 11, 3.5, 3, "#E2D9B8", g + 3, 0);
  chauveSouris(x - 4, y + 4, 1.4, g, 1);
}
function masque(x, y, g){
  const coul = ["#E0338C", "#7A4E9E", "#3E9FC9", "#F2B33B"][g % 4];
  fo([x - 13, y - 4, x - 6, y - 7, x, y - 4, x + 6, y - 7, x + 13, y - 4, x + 11, y + 3, x + 5, y + 5, x, y + 2, x - 5, y + 5, x - 11, y + 3], coul, g, .7);
  ov(x - 5.5, y - 1, 3, 2, "#1E1838", 0, 0); ov(x + 5.5, y - 1, 3, 2, "#1E1838", 0, 0);
  feuille(x + 11, y - 5, 12, 4, -1.1, "#F2B33B", g, 0); feuille(x + 10, y - 5, 10, 3.5, -.7, "#FFFFFF", g + 1, 0);
}
function glace(x, y, g){
  fo([x - 5, y - 6, x + 5, y - 6, x, y + 9], "#E2B06A", g, .6);
  bande(x - 3, y - 3, x + 2, y + 4, .8, "#C48A45", g, 0);
  ov(x, y - 9, 6, 5.5, ["#F7B8D2", "#FCE28A", "#BFE3A0"][g % 3], g, .5);
  ov(x + 1.5, y - 14, 4.5, 4, ["#FFFFFF", "#E0533D", "#BFE0F7"][g % 3], g + 1, .3);
}
function bouee(x, y, g){
  ov(x, y, 10, 10, "#FFFFFF", g, .7);
  for (let k = 0; k < 4; k++){ c.beginPath(); c.arc(x, y, 7.8, k * Math.PI / 2, k * Math.PI / 2 + .8); c.lineWidth = 4.4; c.strokeStyle = "#E0533D"; c.stroke(); }
  ov(x, y, 5.2, 5.2, "rgba(30,24,56,.9)", 0, 0);
}
const DECORS_SABLE = {
  noel:{ n:9, dessine(x, y, i){ [sapin, bonhomme, pingouin][i % 3](x, y, i); } },
  halloween:{ n:10, dessine(x, y, i){ if (i % 3 === 1) fantome(x, y, i); else { citrouilleSol(x, y, i, 7 + (i % 2) * 2); if (i % 2) citrouilleSol(x + 13, y + 3, i + 1, 5); } } },
  paques:{ n:12, dessine(x, y, i){ if (i % 3 === 0) poussin(x, y, i); else { oeufSol(x, y, i); if (i % 2) oeufSol(x + 11, y + 3, i + 1); } } },
  carnaval:DECORS_FETE.carnaval,
  ete:{ n:10, dessine(x, y, i){ [serviette, parasol, etoileMer, ballon, etoileMer][i % 5](x, y, i); } },
};
const DECORS_CIEL = {
  noel:{ n:10, dessine(x, y, i){ if (i % 3 === 2) sucreOrge(x, y, i); else if (i % 4 === 1) paquet(x, y, 7, i, ["#C8323A", "#2F8F6B"][i % 2]); else boule(x, y, i); } },
  halloween:{ n:9, dessine(x, y, i){ if (i === 0) lune(x, y, i); else if (i % 2) fantome(x, y, i); else citrouilleSol(x, y, i, 8); } },
  paques:{ n:10, dessine(x, y, i){ c.save(); c.translate(x, y); c.rotate((hache(i) - .5) * 1.4); c.scale(1.4, 1.4); oeufSol(0, 0, i); c.restore(); } },
  carnaval:{ n:10, dessine(x, y, i){ if (i % 2) masque(x, y, i); else DECORS_FETE.carnaval.dessine(x, y, i); } },
  ete:{ n:10, dessine(x, y, i){ [glace, bouee, ballon][i % 3](x, y, i); } },
};

function habilleSol(x, k, monde){
  const lieu = monde && monde.id === "espace" ? "ciel" : monde && monde.id === "plage" ? "sable" : "herbe";
  const regle = SOLS[idFete], decor = (lieu === "ciel" ? DECORS_CIEL : lieu === "sable" ? DECORS_SABLE : DECORS_FETE)[idFete];
  if (!regle && !decor) return;
  const w = k.width, h = k.height;
  let img;
  try { img = x.getImageData(0, 0, w, h); } catch(e){ return; }
  const d = img.data, avant = decor ? new Uint8ClampedArray(d) : null;
  if (regle){
    const memo = new Map();
    for (let i = 0; i < d.length; i += 4){
      const cle = d[i] << 16 | d[i + 1] << 8 | d[i + 2];
      let v = memo.get(cle);
      if (v === undefined){
        const n = regle(...enHsl(d[i], d[i + 1], d[i + 2]), lieu);
        if (n){ const [r, g, b] = enRgb(...n); v = r << 16 | g << 8 | b; } else v = -1;
        memo.set(cle, v);
      }
      if (v >= 0){ d[i] = v >> 16 & 255; d[i + 1] = v >> 8 & 255; d[i + 2] = v & 255; }
    }
    x.putImageData(img, 0, 0);
  }
  if (!decor) return;
  const sc = w / W;
  /* où a-t-on le droit de poser un décor ? */
  const geo = lieu === "ciel" && monde.geo ? monde.geo() : null;
  const libre = lieu === "herbe" ? estHerbe : lieu === "sable" ? estSable : (h2, s2, l2) => l2 < .42;
  const zone = lieu === "sable" ? (gx, gy) => gx > 230 && gx < 830 && gy > 96
             : geo ? (gx, gy) => { const r = dist(gx, gy, geo.CX, geo.CY); return r > 90 && geo.anneaux.every(A => Math.abs(r - A.r) > 36); }
             : () => true;
  const okEn = (gx, gy) => {
    const px = Math.round(gx * sc), py = Math.round(gy * sc);
    if (px < 0 || py < 0 || px >= w || py >= h) return false;
    const i = (py * w + px) * 4;
    return libre(...enHsl(avant[i], avant[i + 1], avant[i + 2]));
  };
  const autour = [[0, 0], [-18, 4], [18, 4], [0, -26], [-12, -14], [12, -14], [0, 10], [-20, -10], [20, -10]];
  const poses = [];
  avec(x, () => {
    for (let i = 0; i < 500 && poses.length < decor.n; i++){
      const gx = 28 + hache(i * 5.37 + 11) * (W - 56), gy = 34 + hache(i * 2.91 + 7) * (H - 60);
      if (poses.some(([a, b]) => dist(a, b, gx, gy) < 90)) continue;
      if (!zone(gx, gy) || !autour.every(([a, b]) => okEn(gx + a, gy + b))) continue;
      decor.dessine(gx, gy, poses.length);
      poses.push([gx, gy]);
    }
  });
}

/* ── dans l'espace, quelqu'un passe dans le ciel de temps en temps ── */
function passageEspace(){
  const t = J.t;
  if (idFete === "carnaval"){ feuxArtifice(t); return; }
  const periode = 26, duree = 9, p = (t + 6) % periode;
  if (p > duree) return;
  const tour = Math.floor((t + 6) / periode), sens = tour % 2 ? -1 : 1;
  const x = sens > 0 ? -120 + p / duree * (W + 240) : W + 120 - p / duree * (W + 240);
  const y = 70 + hache(tour * 3.3) * 110 + Math.sin(t * 1.8) * 10;
  c.save(); c.translate(x, y); if (sens < 0) c.scale(-1, 1);
  if (idFete === "noel") traineau(t);
  else if (idFete === "halloween") sorciere(t);
  else if (idFete === "paques") oeufFusee(t);
  else if (idFete === "ete") banderole(t, sens);
  c.restore();
}
function traineau(t){
  for (let i = 0; i < 6; i++){ const k = Math.sin(t * 7 + i * 1.3); if (k > .2) etoile5(-40 - i * 12, 6 + Math.sin(i * 2.1) * 6, 3.4 * k, 1.4 * k, "#FFF3C4", i, 0); }
  for (let r = 0; r < 3; r++){
    const rx = 40 + r * 24, saut = Math.sin(t * 9 + r) * 2.5;
    c.beginPath(); c.moveTo(14, 0); c.lineTo(rx - 6, saut - 2); c.strokeStyle = "#C9A35A"; c.lineWidth = 1.2; c.stroke();
    ov(rx, saut, 8, 4.5, "#8E5A2E", r, .5);
    for (const s of [-1, 1]) bande(rx + s * 4, saut + 2, rx + s * 5 + Math.sin(t * 12 + r + s) * 2, saut + 8, 1.6, "#6F4426", r, 0);
    ov(rx + 8, saut - 5, 3.6, 3, "#8E5A2E", r + 1, .3);
    bande(rx + 7, saut - 7, rx + 5, saut - 13, 1.2, "#5E3A1E", r, 0); bande(rx + 9, saut - 7, rx + 11, saut - 13, 1.2, "#5E3A1E", r, 0);
    if (r === 2) ov(rx + 11.5, saut - 5, 1.6, 1.6, "#E0533D", 0, 0);
  }
  fo([-22, -4, 14, -4, 18, -12, 14, 4, -20, 4, -26, -2], "#C8323A", 1, .8);
  bande(-24, 7, 18, 7, 1.8, "#D9A520", 1, 0); bande(-24, 7, -28, 2, 1.8, "#D9A520", 2, 0);
  paquet(-14, -10, 5, 3, "#2F8F6B"); paquet(-4, -12, 4, 4, "#3E9FC9");
  ov(6, -10, 6, 6.5, "#C8323A", 5, .4); ov(7, -17, 4, 3.8, "#F2C9B0", 6, 0);
  ov(7.5, -14.5, 3.6, 2.6, "#FFFFFF", 7, 0);
  fo([3, -19, 11, -19, 6, -26], "#C8323A", 8, 0); ov(6, -26, 1.6, 1.6, "#FFFFFF", 0, 0);
}
function sorciere(t){
  for (let i = 0; i < 5; i++){ const k = Math.sin(t * 6 + i * 1.7); if (k > .3) etoile5(-34 - i * 11, 4 + Math.sin(i * 1.9) * 5, 3 * k, 1.3 * k, "#F2B33B", i, 0); }
  bande(-22, 4, 26, -2, 2.2, "#8E6440", 1, .4);
  fo([-22, 4, -36, -3, -38, 4, -36, 11], "#C9A35A", 2, .3);
  fo([-4, 2, 6, 1, 4, -14, -6, -10], "#3B2A4A", 3, .5);
  fo([-6, -10, -14, -2 + Math.sin(t * 8) * 2, -18, 4 + Math.sin(t * 8) * 3, -4, 0], "#2E2236", 4, 0);
  ov(4, -17, 4.6, 4.4, "#9CC97A", 5, .3);
  ov(5.5, -17.5, .8, .8, "#2B211B", 0, 0);
  ov(-1, -20, 9, 2.4, "#2E2236", 6, 0); fo([-5, -20, 5, -20, 2, -31, -4, -28], "#2E2236", 7, 0);
  ov(14, -4, 2.6, 2.6, "#7BE0A8", 0, 0);
}
function oeufFusee(t){
  for (let i = 0; i < 4; i++) ov(-24 - i * 7 + Math.sin(t * 20 + i) * 1.5, 0, 6 - i, 4 - i * .6, ["#F2B33B", "#F28B2C", "#E0533D", "#FCE28A"][i], i, 0);
  c.save(); c.rotate(Math.PI / 2);
  ov(0, 0, 13, 17, "#F7B8D2", 1, .8);
  bande(-12.6, -2, 12.6, -2, 3, "#FFFFFF", 1, 0); bande(-11, 6, 11, 6, 2.4, "#BFE0F7", 2, 0);
  c.restore();
  ov(6, -1, 5, 5, "#BFE0F7", 3, .3); ov(6, -1, 3.4, 3.4, "#FFFFFF", 4, 0);
  feuille(4, -5, 8, 3, -1.9, "#FFFFFF", 5, 0); feuille(8, -5, 8, 3, -1.2, "#FFFFFF", 6, 0);
}
function banderole(t, sens){
  c.beginPath(); c.moveTo(-14, 0);
  for (let k = 1; k <= 8; k++) c.lineTo(-14 - k * 6, Math.sin(t * 5 + k) * 1.5);
  c.strokeStyle = "rgba(255,255,255,.7)"; c.lineWidth = 1; c.stroke();
  const bx0 = -170;
  const pts = [];
  for (let k = 0; k <= 10; k++) pts.push(bx0 + k * 11.5, -9 + Math.sin(t * 5 + k * .7) * 2.2);
  for (let k = 10; k >= 0; k--) pts.push(bx0 + k * 11.5, 9 + Math.sin(t * 5 + k * .7) * 2.2);
  papier(pts, "#FCE28A", .6);
  c.save(); c.translate(bx0 + 57, 0); if (sens < 0) c.scale(-1, 1); texteP("Vive l'été !", 0, 0, 13, "#E0533D", "center", null); c.restore();
  ov(0, 4, 18, 6, "#7BE0A8", 1, .8); ov(0, -1, 9, 7, "#BFE0F7", 2, .3);
  ov(0, -2, 4.5, 4.4, "#7BE0A8", 3, 0);
  bx(-4.6, -4, 9.2, 2.4, "#2B211B", 4, 0);
  for (let k = -1; k <= 1; k++) ov(k * 9, 5, 1.8, 1.8, ["#F2B33B", "#E0533D", "#3E9FC9"][k + 1], 0, 0);
}
function feuxArtifice(t){
  for (let i = 0; i < 4; i++){
    const per = 2.8, q = (t + i * .73) / per, n = Math.floor(q), p = q - n;
    const x = 80 + hache(n * 7.1 + i) * (W - 160), y = 60 + hache(n * 3.7 + i * 2) * 200;
    const coul = FETES.carnaval.titre[(n + i) % FETES.carnaval.titre.length];
    if (p < .28){
      const k = p / .28; ov(x, H + 10 - (H + 10 - y) * k, 2.2, 3.6, "#FFF3C4", i, 0);
      continue;
    }
    const k = (p - .28) / .72, r = 10 + k * 46;
    c.globalAlpha = Math.max(0, 1 - k * 1.1);
    for (let a = 0; a < 14; a++){
      const ang = a / 14 * TAU + n;
      bande(x + Math.cos(ang) * r * .55, y + Math.sin(ang) * r * .55 + k * 8, x + Math.cos(ang) * r, y + Math.sin(ang) * r + k * 12, 2.2, coul, a, 0);
    }
    c.globalAlpha = 1;
  }
}
