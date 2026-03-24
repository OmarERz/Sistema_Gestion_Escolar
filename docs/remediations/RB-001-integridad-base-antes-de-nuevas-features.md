# Batch 1 - Integridad base antes de nuevas features

## Metadata
- Date: 2026-03-24
- Source audit: `docs/audits/2026-03-24-initial-codex-audit.md`
- Batch ID: `RB-001`
- Current status: Planned
- Owner: Claude Code
- Reviewer: Codex

## Batch Goal
Reducir estados inválidos que hoy pueden contaminar trabajo futuro, sin abrir todavía cambios sensibles de Prisma ni decisiones de producto más amplias de reinscripción y reglas recurrentes.

## Included Findings

| Finding ID | Title | Type | Severity | Leader | Reviewer | Handoff Needed | Status |
|---|---|---|---|---|---|---|---|
| AUD-001 | Withdrawal workflow can be bypassed through generic student updates | Validation gap | Critical | Codex | Claude | No | Open |
| AUD-002 | Cross-cycle invariants are not enforced across students, payments, and reenrollment | Validation gap | Critical | Claude | Codex | Yes | Open |
| AUD-006 | Payment status date logic is ambiguous and may be wrong on due dates | Code bug | High | Claude | Codex | Yes | Open |
| AUD-007 | Enrollment payment-generation failures are silently swallowed | Technical debt | High | Codex | Claude | No | Open |
| AUD-009 | Payment update API exposes manual status changes that do not persist | Validation gap | Low | Codex | Claude | No | Open |
| AUD-011 | Project documentation is materially out of sync with the repository state | Documentation drift | Medium | Codex | Claude | No | Deferred |

## Batch Order

### Fix now
- `AUD-001`
- `AUD-007`
- `AUD-009`

### Validate first
- `AUD-006`

### Product / architecture decision needed
- `AUD-002`

### Defer
- `AUD-011`

## Per-Finding Sections

### AUD-001 - Withdrawal workflow can be bypassed through generic student updates
- Current classification: Validation gap / Critical / Open
- Why this is in this batch: Es un estado inválido claro, localizado y bloquea confianza básica en el flujo de bajas.
- Agente leader: Codex
- Agente reviewer: Claude
- Handoff needed: No
- Proposed implementation scope: Quitar `withdrawn` del update genérico de alumnos y asegurar que la transición solo ocurra por el flujo de `withdrawals`.
- Validation plan: Verificar manualmente que `PUT /students/:id` ya no acepta `withdrawn` y que el flujo normal de baja sigue funcionando.
- Docs update needed: No
- Notes: No debería requerir decisión nueva de negocio. Debe mantenerse alineado con el audit `AUD-001`.

### AUD-002 - Cross-cycle invariants are not enforced across students, payments, and reenrollment
- Current classification: Validation gap / Critical / Open
- Why this is in this batch: Es un blocker de integridad. Si no se define ahora, nuevas features pueden apoyarse en relaciones cruzadas inválidas.
- Agente leader: Claude
- Agente reviewer: Codex
- Handoff needed: Yes
- Proposed implementation scope: No implementar todavía. Primero registrar la regla canónica para alineación de ciclo entre alumno, grupo, pago y reinscripción.
- Validation plan: Confirmar explícitamente si existe algún caso válido de backfill o excepción cross-cycle. Después validar los puntos exactos donde se debe endurecer el backend.
- Docs update needed: No
- Notes: Este finding entra al batch porque debe resolverse en el ciclo actual, pero no está listo para implementación sin decisión previa.

### AUD-006 - Payment status date logic is ambiguous and may be wrong on due dates
- Current classification: Code bug / High / Open
- Why this is in this batch: Afecta pagos y adeudo, pero antes de tocar lógica conviene validar la semántica exacta del estado.
- Agente leader: Claude
- Agente reviewer: Codex
- Handoff needed: Yes
- Proposed implementation scope: Validar primero si el estado canónico para pagos parciales vencidos debe ser `partial` o `overdue`, y si la comparación debe ser por fecha-calendario. Después aplicar ajuste localizado.
- Validation plan: Revisar la regla de negocio acordada y luego probar pagos con fecha de vencimiento hoy, ayer y parcial vencido.
- Docs update needed: Yes
- Notes: La corrección técnica parece localizada, pero la semántica final debe quedar fijada antes de implementarse.

### AUD-007 - Enrollment payment-generation failures are silently swallowed
- Current classification: Technical debt / High / Open
- Why this is in this batch: Es una falla clara de integridad operativa y tiene arreglo localizado.
- Agente leader: Codex
- Agente reviewer: Claude
- Handoff needed: No
- Proposed implementation scope: Hacer visible el fallo de generación de pagos en inscripción. La salida exacta puede ser error explícito o resultado parcial con señal clara.
- Validation plan: Simular o forzar fallo en generación y verificar que ya no queda oculto al operador.
- Docs update needed: No
- Notes: Si durante implementación aparece impacto de UX o flujo mayor al esperado, Claude debe decidir el comportamiento final.

### AUD-009 - Payment update API exposes manual status changes that do not persist
- Current classification: Validation gap / Low / Open
- Why this is in this batch: Es pequeño, localizado y limpia un contrato API engañoso antes de que se use más.
- Agente leader: Codex
- Agente reviewer: Claude
- Handoff needed: No
- Proposed implementation scope: Quitar `status` del update genérico o mover toda transición de estado a endpoints explícitos.
- Validation plan: Confirmar que el contrato API ya no promete una edición manual que luego se recalcula.
- Docs update needed: Yes
- Notes: Es el item menos riesgoso del batch, pero conviene cerrarlo junto con los fixes inmediatos.

### AUD-011 - Project documentation is materially out of sync with the repository state
- Current classification: Documentation drift / Medium / Deferred
- Why this is in this batch: Se mantiene visible porque depende de varios findings del mismo eje, pero no conviene reescribir docs antes de fijar decisiones y cambios.
- Agente leader: Codex
- Agente reviewer: Claude
- Handoff needed: No
- Proposed implementation scope: No corregir todavía. Reagrupar los ajustes documentales una vez resueltos `AUD-002` y `AUD-006`.
- Validation plan: Al cierre del batch, revisar qué partes ya quedaron firmes para documentar sin re-trabajo.
- Docs update needed: Yes
- Notes: Este finding permanece en el batch como recordatorio de alineación posterior, no como trabajo activo inmediato.

## Inline Handoffs (only when needed)

### Handoff for AUD-002
- Current owner: Codex
- Next owner: Claude
- Context: El audit detectó que hoy no se fuerza alineación de ciclo entre alumno, grupo, pago y reinscripción.
- Decision already made: No
- Proposed direction: Definir primero la regla canónica. Si no hay excepciones válidas, endurecer validaciones backend y derivar ciclo desde la entidad canónica cuando aplique.
- Risks: Introducir una regla demasiado rígida puede romper flujos de backfill si existen. Dejarlo ambiguo mantiene integridad débil.
- Validation: Revisar todos los puntos de entrada que escriben `groupId` y `schoolCycleId`, y confirmar manualmente escenarios válidos e inválidos.
- Next action: Claude debe registrar la decisión de negocio/arquitectura antes de implementación.

### Handoff for AUD-006
- Current owner: Codex
- Next owner: Claude
- Context: El audit detectó una comparación de fecha potencialmente incorrecta y una semántica no completamente alineada entre código y docs.
- Decision already made: No
- Proposed direction: Acordar primero la semántica de `partial` vs `overdue`, luego corregir la lógica para usar comparación por fecha-calendario.
- Risks: Corregir solo la comparación técnica sin fijar semántica puede dejar una discrepancia persistente entre código, UI y docs.
- Validation: Probar pagos con vencimiento hoy, con pago parcial, y pagos vencidos sin pago para verificar transición de estado.
- Next action: Claude debe validar la regla de negocio y luego mover el fix a implementación localizada.

## Batch Validation Summary
- manual checks to run: baja vía flujo normal; intento de poner `withdrawn` por update genérico; inscripción con fallo de generación de pagos; update de pago sin `status` manual; casos de pago con vencimiento hoy y pago parcial.
- Codex review required: Sí, para cualquier implementación de `AUD-002` o `AUD-006`.
- tests to add later: transiciones de estado de pago; invariantes de ciclo; flujo de inscripción con generación de pagos.
- docs to align later: `docs/implementation-plan.md`, `docs/Architecture.md`, `docs/data-models.md`.

## Open Blockers
- Falta decisión explícita sobre invariantes cross-cycle para `AUD-002`.
- Falta decisión explícita sobre la semántica final de `partial` vs `overdue` para `AUD-006`.

## Next Recommended Action
Claude debería tomar este batch como contenedor activo, registrar primero las decisiones de `AUD-002` y `AUD-006`, y luego implementar en este orden: `AUD-001`, `AUD-007`, `AUD-009`. Una vez estabilizado eso, Codex hace review y se reevalúa si el siguiente batch debe abrir `AUD-003`, `AUD-005` y `AUD-008`.
