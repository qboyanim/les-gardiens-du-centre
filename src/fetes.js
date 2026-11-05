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

/* ── les chapeaux des bestioles (dessinés dans le repère de la bestiole) ── */
function chapeauFete(e){
  if (!FETE.chapeau || e.cache || e.d.boss) return;          /* les boss gardent leur couronne */
  const y = -(e.d.hautBarre || 30) + 8, k = borne((e.d.r || 12) / 13, .7, 1.5), g = e.g || 0;
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
