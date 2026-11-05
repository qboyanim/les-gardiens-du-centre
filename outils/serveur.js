/* Petit serveur de test : sert le dossier du jeu, et
   POST /capture?nom (data-URL PNG) → outils/captures/nom.png */
const http = require("http"), fs = require("fs"), path = require("path");
const RACINE = path.join(__dirname, "..");
const PORT = +process.argv[2] || 4420;
const TYPES = { ".html":"text/html; charset=utf-8", ".js":"text/javascript", ".css":"text/css", ".png":"image/png" };
http.createServer((req, res) => {
  const u = new URL(req.url, "http://x");
  if (req.method === "POST" && u.pathname === "/capture"){
    let corps = "";
    req.on("data", (d) => corps += d);
    req.on("end", () => {
      const nom = (u.search.slice(1) || "capture").replace(/[^\w-]/g, "");
      fs.mkdirSync(path.join(__dirname, "captures"), { recursive:true });
      fs.writeFileSync(path.join(__dirname, "captures", nom + ".png"), Buffer.from(corps.split(",")[1], "base64"));
      res.end("ok");
    });
    return;
  }
  let f = path.join(RACINE, decodeURIComponent(u.pathname));
  if (u.pathname === "/") f = path.join(RACINE, "les-gardiens-du-centre.html");
  if (!f.startsWith(RACINE) || !fs.existsSync(f) || fs.statSync(f).isDirectory()){ res.writeHead(404); res.end(); return; }
  res.writeHead(200, { "Content-Type":TYPES[path.extname(f)] || "application/octet-stream", "Cache-Control":"no-store" });
  fs.createReadStream(f).pipe(res);
}).listen(PORT, () => console.log("http://localhost:" + PORT));
