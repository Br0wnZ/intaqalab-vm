# ADR-030: Sesión tipada de cambios de planificación en ejecución

**Estado:** Aceptado  
**Fecha:** 2026-11-25  
**Autores:** Equipo INTAQALAB

## Contexto

La modificación de planificación durante ejecución necesitaba comparar valores reales de formularios con datos cargados mediante `revision=execution`, conservar valores anterior/nuevo y asociar cada diff con tab y recurso. El detector anterior recibía eventos manuales no conectados a formularios, usaba etiquetas de UI como identidad y persistía mediante endpoints legacy de `/planning/modifications`.

El contrato `apis/planning-changes-openapi.json` define GET `/planning/changes`, POST `/planning/changes` y POST `/planning/changes/apply`. Solo admite `UPDATE` para cinco `resourceType`; los valores viajan como strings o `null`. Medidas no tiene tipo/operación en ese contrato y Series y disparos tendrá endpoint independiente futuro.

## Decisión

1. **Una sesión SignalStore por diálogo en Execution.** `PlanningChangesStore` mantiene contexto de trial/centro, snapshot de cambios por sección, validación, selección/clasificación de drafts, estado de guardado y recuperación. No es root singleton: cada apertura comienza con una sesión limpia. Cada editor mantiene su modelo Signal Forms existente y emite snapshots antes/después completos al shell; no se acumulan eventos de teclas ni se usa `dirty()` como diff.
2. **Diff puro y estable.** `PlanningChangeDetector` conserva primera referencia por tab, sustituye current snapshot, compara con `deepEqual`, elimina cambios revertidos y permite rebase tras aplicación ACCEPTED. `planning-change-diff.ts` contiene adapters de General, Condiciones, Municiones, Armamento, Medidas y Series y disparos. Campos de formulario y capacidades HTTP se mantienen separados.
3. **Identidad confirmada por tab.** General usa `fireTrialId`; Condiciones usa `shotId`; Municiones usa `configurations[i].id`; Armamento usa `armament.id`, publicado por backend y preservado desde el GET hasta el POST. Medidas conserva identidad local por ID de item, pero se omite del envío por confirmación funcional de 2026-11-26. Series y disparos utiliza identidad local estable y no se envía al endpoint de cambios actual. No se sustituye identidad ausente por índice, ID de disparo ni ID de catálogo.
4. **Cambios de recurso compartido se deduplican y respetan ejecución.** Un campo se envía como máximo una vez por `resourceType/resourceId/field`; Armamento compartido une `affectedShots`. Si un cambio en Condiciones, Municiones o Armamento afecta algún disparo `FIRED`, queda local-only. `PLANNING_INFO` no se bloquea por disparos ejecutados, según contrato.
5. **Identidad remota de Armamento disponible en backend (2026-11-26).** Modelos y mocks documentan `armament.id` como identidad de cambios `ARMAMENT`, según confirmación funcional. El campo sigue siendo opcional en modelos editables para filas aún sin asignación persistida; sin él, diff queda visible como local-only y no se serializa. Proyector mock exige coincidencia con `armament.id`, sin fallback a `shotId`. El OpenAPI local de planning todavía no refleja el nuevo campo publicado en backend.
6. **Solo campos actualmente soportados son persistibles.** Serializador valida `resourceType`, `field`, ID real, operación `UPDATE` y serializa números/booleanos/listas a strings canónicos en el límite HTTP. `null` se conserva y `oldValue` siempre se envía. Medidas, Series y disparos, altas/bajas y campos no incluidos se detectan donde aplica, pero no se envían a PUT ordinario ni a endpoints inventados.
7. **Componentes de munición respetan discrepancia de ID.** Diff por campo se conserva y presenta; `MUNITION_COMPONENT` queda local-only mientras API requiera ID del componente y la identidad contractual confirmada para tab sea ID de configuración. No se intercambian IDs ni se envía payload ambiguo.
8. **Lecturas y escrituras CQS.** `PlanningChangesService` usa `httpResource` con trigger privado para GET y `HttpClient` + `firstValueFrom` para POST create/apply. URL base ya contiene `centers/{centerId}`; cliente agrega `fire-trials/{fireTrialId}/planning/...` sin duplicar el centro. Regla específica de proxy procesa esta forma antes del rewrite legacy. Mutaciones no llevan `revision`. Lecturas de planning permanecen en las APIs de planning existentes con `revision=execution`.
9. **Revisión y resolución explícita.** Nuevos diffs son cambios netos por recurso/campo. Borradores remotos solo se aplican tras selección explícita. Cambios PENDING bloquean edición y nuevas operaciones; status precheck remoto falla cerrado. Clasificación `false/false` acepta; una sola bandera true deja PENDING; true/true nunca se genera.
10. **Recuperación sin duplicar creación.** Se guarda snapshot y UUID de cada draft devuelto por POST. Si falla `/apply`, reintento usa esos mismos IDs; no vuelve a crear lote. Selección de drafts remotos y cambios creados se combinan en la petición `/apply` sin incluir histórico no seleccionado.
11. **Edición no llama rutas legacy.** En modo de sesión se ocultan/bloquean guardados ordinarios, validación lifecycle y mutaciones secundarias; altas, bajas, diálogos masivos y cambios de series quedan locales. Planificación normal conserva guardados existentes.
12. **Refresco tras aceptación.** Al cerrar con ACCEPTED, facade refresca estado de ejecución y queries compartidas de series, condiciones, municiones, armamento y medidas. En una sesión abierta, el detector rebasa snapshot local confirmado para cambios posteriores.
13. **Mocks implementan el flujo.** POST create valida lote atómico, recurso/campo duplicados, old/new y bloqueos pendientes; apply procesa IDs seleccionados. Proyectores aplican ACCEPTED sobre una copia de baseline para `revision=execution`; baseline no muta.

## Consecuencias

**Positivas**

- Valor anterior/nuevo deriva de modelo inicial y estado de Signal Forms, no de orden de eventos ni selector visual.
- Cambios pueden cubrir nuevas secciones sin acoplar forms a HTTP; un campo local-only sigue visible y nunca se pierde silenciosamente.
- Identidad de recurso es explícita por tab y DTO solo contiene campos del contrato.
- POST ambiguo o apply fallido no induce creación duplicada; status remoto y pendiente controlan el estado de sesión.
- Tests cubren diff por las seis secciones, serializer, servicio, store, diálogo, revisión y mocks.

**Limitaciones / trabajo backend pendiente**

- Medidas requiere contrato explícito de `resourceType`, fields y operaciones.
- Series y disparos requiere endpoint separado; hasta entonces modificaciones permanecen locales, visibles y no persistibles.
- Campos de componentes de Municiones permanecen local-only hasta resolver ID de recurso compatible entre `configurations[i].id` y `MUNITION_COMPONENT`.
- Contrato no publica idempotency key ni delete/update de DRAFT; tras respuesta de creación ambigua puede requerirse reconciliación manual.

Relacionados: ADR-017 (lecturas compartidas), ADR-020 (mutaciones), ADR-025 (descomposición de servicios de Execution), ADR-029 (revisión `baseline|execution`).
