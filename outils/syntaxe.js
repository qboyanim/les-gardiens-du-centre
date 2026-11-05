const s = require("fs").readFileSync(require("path").join(__dirname, "../les-gardiens-du-centre.html"), "utf8");
const js = s.slice(s.lastIndexOf("<script>\n") + 9, s.lastIndexOf("</script>"));
try { new Function(js); console.log("syntaxe ok"); } catch (e) { console.log(e.message); process.exit(1); }
