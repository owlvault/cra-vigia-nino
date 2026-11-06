import re
import os

content = open('docs/auditoria/03_resultado_auditoria_tecnica.md', encoding='utf-8').read()

findings_raw = re.split(r'### Ficha Técnica ', content)[1:]
print(f"Total Fichas Técnicas found: {len(findings_raw)}")

results = []
for idx, chunk in enumerate(findings_raw, 1):
    lines = chunk.splitlines()
    header = lines[0]
    id_m = re.search(r'^([A-Z]{3}-\d{2})', header)
    fid = id_m.group(1) if id_m else f"UNK_{idx}"
    
    file_line = None
    sev = None
    for l in lines[:12]:
        if '**Archivo y Línea:**' in l or '**Ubicación:**' in l:
            file_line = l.split(':**')[1].strip().replace('`', '')
        if '**Severidad:**' in l:
            sev = l.split(':**')[1].strip().replace('*', '').strip()
            
    results.append({'id': fid, 'sev': sev, 'loc': file_line, 'header': header})

print("\nDetailed Verification of Referenced Files:")
for r in results:
    loc = r['loc'] or "N/A"
    # handle cases where multiple files or notes are in loc
    file_path = loc.split(':')[0].strip()
    # If file_path has space or generic words
    exists = os.path.exists(file_path) if file_path and not ' ' in file_path else None
    print(f"[{r['id']}] Severity: {r['sev']:<8} | Target: {loc:<55} | File exists: {exists}")
