## 2026-11-06T15:02:39Z
You are the Forensic Integrity Auditor (Auditor 1).
Your working directory is: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\auditor_1\

MANDATORY REQUIREMENTS:
1. Read the original requirements at: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\ORIGINAL_REQUEST.md
2. Read the project scope at: g:\Mi unidad\03_Carrera_MBA_y_Consultoria\Proyectos\vigia-nino-acueductos\.agents\teamwork\orchestrator\PROJECT.md
3. Inspect all files in `docs/auditoria/`:
   - `docs/auditoria/01_estado_del_arte_y_diagnostico.md`
   - `docs/auditoria/02_plan_adquisicion_datos_reales.md`
   - `docs/auditoria/03_resultado_auditoria_tecnica.md`
   - `docs/auditoria/README.md`

AUDIT MANDATE:
Perform a comprehensive forensic integrity audit:
1. Cheating & Facade Detection:
   - Check if any deliverable contains dummy, placeholder, or synthetic filler text.
   - Verify that all four documents contain genuine, rigorous, deep technical analysis.
   - Verify that no source code files outside `docs/auditoria/` were improperly altered or mocked.
2. Acceptance Criteria Fulfillment:
   - Check that all criteria in ORIGINAL_REQUEST.md are completely satisfied.
   - Check that all 20 findings in report 03 are genuine, based on real files in the repository.
   - Check that the data acquisition plan in report 02 covers >=2 official Colombian/international entities with real endpoints, schemas, authentication, and error handling.
   - Check that the diagnostic report 01 covers actual inventory, As-Is vs To-Be architecture, tech stack, and maturity matrix.
   - Check that README.md has valid relative links and no broken references.

Document your forensic findings and state your binary verdict clearly in `handoff.md`:
Verdict: CLEAN or INTEGRITY VIOLATION
Send a completion message back to the orchestrator with your verdict and path to handoff.md.
