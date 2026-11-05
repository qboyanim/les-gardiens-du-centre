/* Assemble les sources en une seule page à poser sur le site.
   Usage : node outils/assemble.js  → les-gardiens-du-centre.html */
const fs = require("fs"), path = require("path");
const ici = (...p) => path.join(__dirname, "..", ...p);
const lis = (f) => fs.readFileSync(ici("src", f), "utf8");

const ORDRE = ["moteur.js", "fetes.js", "monde-potager.js", "monde-gouter.js", "monde-plage.js", "monde-espace.js"]
  .filter(f => fs.existsSync(ici("src", f)));
const js = `(() => {\n"use strict";\n${ORDRE.map(lis).join("\n\n")}\ndemarre();\n})();`
  .replace(/<\/script/gi, "<\\/script");   /* un « </script> » dans le code (même en commentaire) fermerait la page */

const page = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Les Gardiens du Centre</title>
<!-- Les deux polices du jeu (à garder si le site ne les charge pas déjà) -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Nunito:wght@400;700;800;900&family=Sniglet:wght@400;800&display=swap" rel="stylesheet">
<style>
${lis("style.css")}
</style>
</head>
<body>
<!-- ═══ LE JEU : ce bloc, le <style> et le <script> suffisent à le poser dans une page ═══ -->
<div id="gdc"></div>
<script>
${js}
</script>
</body>
</html>
`;
fs.writeFileSync(ici("les-gardiens-du-centre.html"), page);
console.log("les-gardiens-du-centre.html :", Math.round(page.length / 1024), "Ko,", ORDRE.length, "fichiers");
