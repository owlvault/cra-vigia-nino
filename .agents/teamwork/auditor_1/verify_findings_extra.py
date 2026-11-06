import os, glob

# Check .github/workflows
print(".github/workflows exists:", os.path.exists(".github/workflows"))

# Check .env.example
print(".env.example exists:", os.path.exists(".env.example"))

# Check root README.md
print("root README.md exists:", os.path.exists("README.md"))

# Check data files in git
import subprocess
out = subprocess.check_output(["git", "ls-files", "data/"]).decode('utf-8')
data_files = [l for l in out.splitlines() if l.strip()]
print(f"Tracked files in data/: {len(data_files)}")

# Check vendored libs in tablero/js
print("tablero/js/leaflet.js exists:", os.path.exists("tablero/js/leaflet.js"))
print("tablero/js/echarts.min.js exists:", os.path.exists("tablero/js/echarts.min.js"))

# Check innerHTML in app.js and auditoria.js
app_js = open("tablero/js/app.js", encoding="utf-8", errors="replace").read()
inner_app = app_js.count(".innerHTML")
print(f"app.js .innerHTML occurrences: {inner_app}")

aud_js = open("tablero/auditoria/js/auditoria.js", encoding="utf-8", errors="replace").read()
inner_aud = aud_js.count(".innerHTML")
print(f"auditoria.js .innerHTML occurrences: {inner_aud}")

# Check duplication in auditoria vs tablero/auditoria
print("auditoria/reporte_auditoria_vigente.json exists:", os.path.exists("auditoria/reporte_auditoria_vigente.json"))
print("tablero/auditoria/reporte_auditoria_vigente.json exists:", os.path.exists("tablero/auditoria/reporte_auditoria_vigente.json"))
