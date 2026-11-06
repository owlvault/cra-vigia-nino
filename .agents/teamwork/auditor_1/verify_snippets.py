import os

def check_snippet(path, start_line, end_line, desc):
    if not os.path.exists(path):
        print(f"[FAIL] File not found: {path}")
        return
    with open(path, encoding='utf-8', errors='replace') as f:
        lines = f.readlines()
    actual_snippet = "".join(lines[max(0, start_line-1):min(len(lines), end_line)])
    print(f"--- {desc} ({path}:{start_line}-{end_line}) ---")
    print(actual_snippet.strip())
    print("-" * 50)

# Check SEC-01: SSL bypass
check_snippet("ingesta/queries_sui/SUI_EXT_07_DATOS_ABIERTOS_SOCRATA.py", 40, 45, "SEC-01 SSL Context")

# Check SEC-02: .gitignore
check_snippet(".gitignore", 1, 15, "SEC-02 .gitignore lines")

# Check SEC-03: servidor_tablero.py POST handler
check_snippet("servidor_tablero.py", 115, 135, "SEC-03 servidor_tablero POST")

# Check SEC-05: servidor_tablero.py end_headers
check_snippet("servidor_tablero.py", 94, 103, "SEC-05 servidor_tablero end_headers")

# Check TST-01: test_indice_riesgo tautological
check_snippet("ingesta/tests/test_indice_riesgo.py", 14, 40, "TST-01 test_indice_riesgo")

# Check TST-02: test_conectores network call
check_snippet("ingesta/tests/test_conectores.py", 12, 30, "TST-02 test_conectores")

# Check COD-01: conector_ungrd_minvivienda reading local json
check_snippet("ingesta/conectores/conector_ungrd_minvivienda.py", 75, 88, "COD-01 conector_ungrd fallback/static read")

# Check COD-01: conector_ideam reading local json
check_snippet("ingesta/conectores/conector_ideam.py", 135, 145, "COD-01 conector_ideam fallback/static read")

# Check DEP-01: requirements.txt
check_snippet("ingesta/requirements.txt", 1, 10, "DEP-01 requirements.txt")

# Check COD-04: magic numbers in pipeline_corte.py
check_snippet("ingesta/pipeline_corte.py", 235, 260, "COD-04 magic numbers in pipeline_corte.py")

# Check COD-05: cli.py relative paths
check_snippet("ingesta/cli.py", 40, 50, "COD-05 cli.py relative paths")

# Check COD-06: auditor_veracidad.py:1138
check_snippet("auditoria/auditor_veracidad.py", 1130, 1145, "COD-06 auditor_veracidad line 1138")
