"""
Interfaz de Línea de Comandos (CLI) — Vigía El Niño · Acueductos
Proyecto: Vigía El Niño · Acueductos (CRA)
"""

import sys
import json
import argparse
from pathlib import Path
from ingesta.orquestador import OrquestadorIngesta

def main():
    parser = argparse.ArgumentParser(
        description="CLI de Ingesta y Cálculo — Vigía El Niño · Acueductos (CRA)"
    )
    subparsers = parser.add_subparsers(dest="comando", help="Comandos disponibles")

    # Comando: ejecutar-todo
    subparsers.add_parser("ejecutar-todo", help="Ejecuta el ciclo diario completo de ingesta y cálculo del ICR")

    # Comando: estado
    subparsers.add_parser("estado", help="Muestra el estado de la última captura y del corte vigente")

    # Comando: fuente
    parser_fuente = subparsers.add_parser("fuente", help="Ejecuta la captura de una sola fuente")
    parser_fuente.add_argument("id_fuente", choices=["NOAA", "SIVICAP", "IDEAM", "UNGRD_MVCT", "XM", "FIRMS"], help="ID del conector a ejecutar")

    args = parser.parse_args()

    if not args.comando:
        parser.print_help()
        sys.exit(1)

    orquestador = OrquestadorIngesta()

    if args.comando == "ejecutar-todo":
        print("\n>>> Ejecutando ciclo de ingesta completa Vigía El Niño...")
        res = orquestador.ejecutar_ciclo_completo()
        print("\n=== RESULTADO DEL CORTE DIARIO ===")
        print(json.dumps(res, indent=2, ensure_ascii=False))

    elif args.comando == "estado":
        archivo_corte = Path("data/oro/corte_vigente.json")
        if archivo_corte.exists():
            with open(archivo_corte, "r", encoding="utf-8") as f:
                corte = json.load(f)
            meta = corte.get("metadata_corte", {})
            print("\n=== CORTE VIGENTE EN ZONA ORO ===")
            print(f"Fecha de corte: {meta.get('fecha_corte')}")
            print(f"Versión configuración: {meta.get('version_configuracion')}")
            print(f"Estado de calidad: {meta.get('estado_calidad')}")
            print(f"Total municipios evaluados: {meta.get('total_municipios_evaluados')}")
            print(f"ICR Nacional Ponderado: {meta.get('icr_nacional_ponderado')}")
            print(f"Población en riesgo crítico: {meta.get('poblacion_en_riesgo_critico'):,}")
            print(f"Distribución de alertas: {meta.get('conteo_niveles_nacional')}")
        else:
            print("No se ha generado ningún corte todavía. Ejecute: python -m ingesta.cli ejecutar-todo")

    elif args.comando == "fuente":
        conector = orquestador.conectores.get(args.id_fuente)
        if conector:
            print(f"\n>>> Ejecutando fuente: {args.id_fuente} ({conector.nombre_fuente})...")
            res = conector.ejecutar()
            print(json.dumps(res.to_dict(), indent=2, ensure_ascii=False))
        else:
            print(f"Fuente {args.id_fuente} no reconocida.")

if __name__ == "__main__":
    main()
