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
const SOLS = {
  noel(h, s, l){
    if (estHerbe(h, s, l)) return l < .26 ? [h, s * .6, l] : [205, .4, borne(.88 + (l - .5) * .6, .74, .97)];
    if (h >= 22 && h <= 52 && s > .25 && l > .5) return [h, s * .55, l + (1 - l) * .35];      /* sable et chemins givrés */
    if (h >= 180 && h <= 215 && s > .3 && l > .35) return [h + 6, s * .7, l + (1 - l) * .3];  /* l'eau se glace un peu */
    return null;
  },
  halloween(h, s, l){ return estHerbe(h, s, l) ? [36 + (h - 93) * .3, Math.min(.62, s * 1.05), l * .8] : null; },   /* l'herbe d'automne, dorée */
  paques(h, s, l){ return estHerbe(h, s, l) ? [h + 4, s * 1.12, Math.min(.9, l * 1.06)] : null; },
  ete(h, s, l){ return estHerbe(h, s, l) ? [h - 15, s * .95, Math.min(.9, l * 1.05)] : null; },
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

function habilleSol(x, k){
  const regle = SOLS[idFete], decor = DECORS_FETE[idFete];
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
        const n = regle(...enHsl(d[i], d[i + 1], d[i + 2]));
        if (n){ const [r, g, b] = enRgb(...n); v = r << 16 | g << 8 | b; } else v = -1;
        memo.set(cle, v);
      }
      if (v >= 0){ d[i] = v >> 16 & 255; d[i + 1] = v >> 8 & 255; d[i + 2] = v & 255; }
    }
    x.putImageData(img, 0, 0);
  }
  if (!decor) return;
  const sc = w / W;
  const herbeEn = (gx, gy) => {
    const px = Math.round(gx * sc), py = Math.round(gy * sc);
    if (px < 0 || py < 0 || px >= w || py >= h) return false;
    const i = (py * w + px) * 4;
    return estHerbe(...enHsl(avant[i], avant[i + 1], avant[i + 2]));
  };
  const autour = [[0, 0], [-18, 4], [18, 4], [0, -26], [-12, -14], [12, -14], [0, 10], [-20, -10], [20, -10]];
  const poses = [];
  avec(x, () => {
    for (let i = 0; i < 400 && poses.length < decor.n; i++){
      const gx = 28 + hache(i * 5.37 + 11) * (W - 56), gy = 34 + hache(i * 2.91 + 7) * (H - 60);
      if (poses.some(([a, b]) => dist(a, b, gx, gy) < 90)) continue;
      if (!autour.every(([a, b]) => herbeEn(gx + a, gy + b))) continue;
      decor.dessine(gx, gy, poses.length);
      poses.push([gx, gy]);
    }
  });
}
