# Plan de ejecución: arquitectura, calidad y mantenibilidad

## 1. Objetivo y alcance

Recuperar las garantías de entrega, corregir los riesgos funcionales identificados y consolidar la arquitectura existente de INTAQALAB. No se propone una reescritura ni una incorporación indiscriminada de herramientas.

Este plan procede de una revisión estática de configuración, CI, shell Angular, Golden Path de master-data, muestras de planificación, ejecución, calendario, event-log, utilidades y mocks. No constituye una revisión exhaustiva línea por línea. No se han ejecutado build, lint, tests ni mediciones de rendimiento durante esa revisión.

Las observaciones describen el código revisado, no necesariamente un fallo reproducido en ejecución. La fase inicial debe contrastarlas con la revisión del repositorio sobre la que se trabaje. Las tareas de ampliación proponen nuevas garantías; no afirman que sean inexistentes en sistemas externos.

**Estado inicial:** todas las actuaciones están pendientes. Este documento no modifica código, configuración ni políticas del proyecto.

## 2. Prioridades y método

| Prioridad | Propósito               | Resultado esperado                                                  |
| --------- | ----------------------- | ------------------------------------------------------------------- |
| P0        | Entrega verificable     | Controles reales y configuración correcta de producción             |
| P1        | Corrección funcional    | Concurrencia controlada, contratos válidos y pruebas significativas |
| P2        | Arquitectura sostenible | Fronteras exigibles, responsabilidades claras y calidad medible     |
| P3        | Mantenimiento continuo  | Actualizaciones pequeñas y eliminación gradual de residuos          |

### Reglas de implementación

- Realizar cambios pequeños, reversibles y con una preocupación principal.
- Para los defectos reproducibles: añadir un test de regresión y después corregir el comportamiento.
- No mezclar reorganizaciones de archivos con cambios funcionales extensos.
- Mantener compatibilidad temporal mientras se migran consumidores.
- Registrar decisiones arquitectónicas significativas en `docs/adrs/`.
- Ejecutar tareas mediante Nx, utilizando `npm` o `npx`, nunca pnpm.
- Consultar los nombres y targets resueltos de Nx; no deducirlos de los aliases de importación.
- Aplicar las reglas y skills del proyecto correspondientes a cada tarea cuando estén disponibles.
- Conservar código y documentación en UTF-8. Escribir las descripciones de `it()` en inglés.
- No considerar una tarea terminada únicamente porque compila.
- No introducir microfrontends, SSR u otra biblioteca de estado sin una necesidad demostrada.

Los responsables, estimaciones y fechas se asignarán tras completar A01 y A02. Los perfiles indicados en cada fase son propuestas de responsabilidad, no asignaciones a personas.

## 3. Fase 0: diagnóstico ejecutable

**Responsabilidad propuesta:** arquitectura y mantenimiento del workspace.

### A01. Inventariar workspace y dependencias — P0

**Origen:** falta de configuración resuelta y de ejecución local en la revisión estática.

**Acciones**

- [ ] Consultar proyectos mediante `npx nx show projects` y su configuración mediante `npx nx show project <nombre>`.
- [ ] Identificar targets reales de lint, test, build y E2E.
- [ ] Obtener el grafo de dependencias y revisar tags `type:*` y `scope:*`.
- [ ] Confirmar automatización externa y configuración de CI incluida desde otros proyectos.
- [ ] Comprobar compatibilidad efectiva de Angular, Nx, Node y npm a partir de las versiones instaladas y documentación aplicable.
- [ ] Clasificar cada hallazgo como observado, reproducido, descartado o pendiente de validación.

**Aceptación:** inventario de proyectos, targets, relaciones y responsables; ninguna configuración asumida solamente por el nombre de un script.

### A02. Obtener una línea base — P0

**Depende de:** A01.

**Acciones**

- [ ] Realizar una instalación limpia desde el lockfile.
- [ ] Ejecutar lint, tests y builds mediante los targets existentes.
- [ ] Registrar errores, warnings, pruebas omitidas, cobertura efectiva y duración.
- [ ] Medir los bundles reales por ruta y registrar el entorno de construcción.
- [ ] Identificar fallos preexistentes antes de introducir cambios.

**Aceptación:** resultados repetibles desde un checkout limpio. La cobertura configurada no se presenta como cobertura conseguida.

## 4. Fase 1: entrega y controles de calidad

**Responsabilidad propuesta:** mantenimiento de CI y frontend.

**Archivos principales:** `.gitlab-ci.yml`, `package.json`, `apps/intaqalab/project.json`, `nx.json`, `tools/verify/verify.mjs`.

### A03. Sustituir builds disfrazados de tests — P0

**Observado:** los jobs `unit-test-*` ejecutan builds; `test:cicd` únicamente imprime un mensaje.

**Acciones**

- [ ] Ejecutar pruebas reales mediante targets Nx y mantener el build como control independiente.
- [ ] Retirar el script ficticio `test:cicd` o sustituirlo por una ejecución real.
- [ ] Publicar resultados JUnit incluso cuando fallen las pruebas.
- [ ] Comprobar la propagación del código de salida del comando.

**Aceptación:** un test fallido provoca el fallo del job y aparece en el informe. Ningún job de pruebas se limita a compilar. JUnit no se considera un sustituto del código de salida.

### A04. Corregir configuraciones por entorno — P0

**Observado:** `unit-test-pro` ejecuta `build:des`; `build-pro` solicita `pro`, mientras la configuración declarada se llama `production`.

**Acciones**

- [ ] Normalizar los nombres de configuraciones y scripts.
- [ ] Verificar la configuración resuelta y los reemplazos de entorno.
- [ ] Construir producción desde una instalación limpia.
- [ ] Comprobar que el artefacto corresponde a la revisión y entorno previstos.

**Aceptación:** cada entorno usa su configuración; no quedan referencias a configuraciones inexistentes ni a builds de desarrollo en validaciones de producción.

### A05. Reparar las reglas de pipelines — P0

**Observado:** algunas condiciones de merge request combinan `merge_request_event` con `CI_COMMIT_BRANCH`, variable no disponible en ese contexto.

**Acciones**

- [ ] Diferenciar pipelines de rama y de merge request.
- [ ] Elegir la variable de rama origen o destino según la intención de cada regla.
- [ ] Validar una matriz con ramas de trabajo, merge requests y ramas de despliegue.
- [ ] Revisar la configuración expandida y sus inclusiones externas.
- [ ] Comprobar que los controles se ejecutan antes de integrar cambios y que despliegue y validación están separados.
- [ ] Revisar con los responsables los requisitos de integración para que un pipeline fallido no se trate como validación aceptada.

**Aceptación:** la matriz se verifica y ningún control desaparece silenciosamente por el origen del pipeline. Los cambios de políticas se revisan por separado antes de aplicarlos.

### A06. Unificar instalación y verificación — P0/P1

**Observado:** instalación heterogénea y verificación local limitada a lint e i18n. Hay scripts y rutas de cobertura pendientes de comprobar.

**Acciones**

- [ ] Utilizar `npm ci` donde se requiera instalación reproducible.
- [ ] Alinear versiones de Node y npm entre desarrollo y CI.
- [ ] Revisar listas manuales de proyectos, aliases y referencias retiradas.
- [ ] Comprobar el destino de `coverage:merge` y todos los scripts conservados.
- [ ] Alinear rutas de informes entre Nx y Vitest.
- [ ] Separar verificación rápida y completa; la completa debe cubrir tests y build.
- [ ] Evitar depender innecesariamente de Bash para ejecutar el wrapper Node multiplataforma.
- [ ] Revisar inputs de caché y comprobar también una ejecución limpia.

**Aceptación:** todos los scripts conservados funcionan; los informes se generan en su ubicación esperada y la verificación completa refleja la Definition of Done.

**Puerta de salida de la fase:** controles reales, producción reproducible y validación previa a la integración.

## 5. Fase 2: recursos, concurrencia y contratos CRUD

**Responsabilidad propuesta:** frontend de dominio y data-access; coordinación con backend cuando afecte a contratos.

**Archivos principales:** `libs/domain/master-data/src/lib/services/master-data-resource.factory.ts`, sus stores y tests, `libs/shared/utils/src/lib/signals/action-trigger.ts`, `libs/domain/calendar-trials/src/lib/+state/calendar-trials.store.ts` y las features de ejecución.

### A07. Separar consultas de comandos — P1

**Riesgo identificado:** `httpResource` gestiona mutaciones y `actionTrigger` fuerza reactividad, pero no garantiza una cola ni confirmaciones individuales.

**Acciones**

- [ ] Inventariar consumidores de mutaciones reactivas.
- [ ] Definir por operación si se bloquean duplicados, se serializan solicitudes o se permite paralelismo.
- [ ] Mantener las consultas reactivas e introducir comandos explícitos para escrituras.
- [ ] Representar el resultado y el error de cada comando.
- [ ] Migrar primero un CRUD de master-data y después los consumidores complejos.
- [ ] Registrar la decisión y sus implicaciones en un ADR.

**Aceptación:** un doble clic no genera escrituras accidentales; operaciones válidas no se sustituyen silenciosamente; la cancelación cliente no se interpreta como rollback servidor; el estado de guardado termina tanto con éxito como con error.

### A08. Corregir el contrato de actualización y borrado — P1

**Observado:** el borrado acepta un objeto que se interpola en la URL; una guarda por falsedad descarta el ID numérico `0`; la actualización obtiene `id` mediante cast.

**Acciones**

- [ ] Definir un tipo explícito de identificador.
- [ ] Restringir el borrado al identificador o extraerlo explícitamente.
- [ ] Exigir identidad en el contrato de actualización.
- [ ] Distinguir ausencia mediante `null` y `undefined`.
- [ ] Establecer el tratamiento de IDs inválidos de acuerdo con la API.

**Aceptación:** tests para IDs string, numéricos e inválidos; ninguna URL incluye `[object Object]` o `undefined`; `0` se admite si el contrato lo permite o se rechaza explícitamente; el compilador impide actualizar sin la identidad requerida.

### A09. Refrescar únicamente tras éxito — P1

**Observado:** la recarga depende de cualquier `statusCode()` verdadero.

**Acciones**

- [ ] Vincular invalidación a una finalización exitosa explícita.
- [ ] Eliminar recargas duplicadas entre efectos.
- [ ] Mantener datos anteriores y error visible tras un fallo.
- [ ] Comprobar respuestas exitosas sin cuerpo, especialmente borrados.

**Aceptación:** una escritura fallida no se trata como completada; una exitosa invalida la consulta pertinente; los tests verifican el número de recargas.

### A10. Unificar lectura y estado de recursos — P1

**Observado:** lecturas directas de `.value()` sin guarda y comparaciones `.error() !== null` en stores revisados.

**Acciones**

- [ ] Inventariar patrones equivalentes en los dominios.
- [ ] Adoptar `hasValue()` o un helper revisado.
- [ ] Normalizar la detección de error y distinguir carga inicial, refresco, vacío y fallo.
- [ ] Evitar que los helpers oculten excepciones inesperadas como listas vacías.

**Aceptación:** pruebas para idle, carga, éxito, vacío, error y recuperación; un fallo de recurso no provoca una excepción secundaria ni se presenta como ausencia de resultados.

### A11. Eliminar carreras del calendario — P1

**Riesgo identificado:** cambios de fecha, vista o línea lanzan solicitudes independientes que pueden resolverse fuera de orden.

**Acciones**

- [ ] Modelar la consulta con fecha, vista y línea seleccionada.
- [ ] Cancelar solicitudes obsoletas o impedir que sus resultados se apliquen.
- [ ] Asociar `loading` a la consulta vigente.
- [ ] Revisar la destrucción de la vista y traducir los mensajes de error.

**Aceptación:** si A y B se resuelven en orden inverso, B permanece visible; el error de A no pisa el éxito de B; el indicador no termina mientras siga pendiente la consulta vigente.

### A12. Validar la igualdad basada en `updatedAt` — P1

**Riesgo identificado:** la comparación de estado en ejecución usa únicamente `updatedAt`.

**Acciones**

- [ ] Confirmar la garantía backend de actualización de versión.
- [ ] Probar contenido distinto con el mismo `updatedAt` y cambios de entidad.
- [ ] Incorporar identidad cuando corresponda o retirar el comparador si no existe garantía suficiente.

**Aceptación:** ningún cambio relevante queda oculto; la optimización tiene contrato y prueba, no solo un comentario.

## 6. Fase 3: confianza en las pruebas

**Responsabilidad propuesta:** frontend y calidad; aplicar angular-testing-expert cuando esté disponible.

### A13. Reparar tests falsamente verdes — P1

**Observado:** un test de búsqueda inicial comprueba la existencia de `.set`, no que se haya realizado la búsqueda.

**Acciones**

- [ ] Comprobar parámetros concretos o resultados observables.
- [ ] Revisar aserciones similares de mera existencia o creación trivial.
- [ ] Verificar que retirar el comportamiento esperado hace fallar el test.

**Aceptación:** el test falla al eliminar la búsqueda inicial; las acciones verifican payload, resultado y error pertinentes.

### A14. Hacer estricta la verificación HTTP — P1

**Observado:** un helper resuelve solicitudes sobrantes con `{}` y silencia excepciones.

**Acciones**

- [ ] Sustituir la limpieza permisiva por resolución explícita de solicitudes.
- [ ] Verificar que no quedan peticiones inesperadas.
- [ ] Tratar cancelaciones intencionales de forma explícita.
- [ ] Añadir escenarios de error, respuesta vacía y concurrencia.

**Aceptación:** una solicitud extra provoca fallo; ningún error inesperado desaparece en un `catch` vacío.

### A15. Unificar cobertura y configuración — P1/P2

**Acciones**

- [ ] Comparar la ejecución raíz y por proyecto.
- [ ] Comprobar umbrales efectivos y rutas de informes.
- [ ] Mantener el mínimo existente donde realmente se aplique.
- [ ] Definir objetivos progresivos para código modificado.
- [ ] Detectar pruebas omitidas y exclusiones excesivas.

**Aceptación:** el mismo alcance produce resultados comparables en local y CI; la lógica crítica cubre sus ramas relevantes; el porcentaje no mejora artificialmente mediante exclusiones.

### A16. Añadir E2E y pruebas de contrato — P2

**Ampliación propuesta:** confirmar antes la existencia de automatización externa.

**Acciones**

- [ ] Automatizar CRUD de maestros, planificación y persistencia, calendario, ejecución y recuperación ante fallo de guardado.
- [ ] Utilizar fixtures deterministas y escenarios de latencia y fallos parciales.
- [ ] Validar peticiones y respuestas frente a OpenAPI.
- [ ] Introducir pruebas de mutación selectivas sobre lógica crítica.

**Aceptación:** recorridos críticos ejecutables automáticamente; fallos con evidencia útil; cambios incompatibles de contrato detectados antes del despliegue.

## 7. Fase 4: arquitectura y Golden Path

**Responsabilidad propuesta:** arquitectura y responsables de dominio.

### A17. Corregir los límites Nx — P2

**Observado:** se permite `feature → feature`, no hay restricciones equivalentes por scope y las carpetas internas no son proyectos Nx separados.

**Acciones**

- [ ] Definir las dependencias legítimas por dominio antes de prohibir relaciones.
- [ ] Establecer APIs públicas y restricciones por `scope:*`.
- [ ] Separar bibliotecas solo cuando exista una responsabilidad, reutilización o propiedad clara.
- [ ] Añadir comprobaciones negativas de importaciones prohibidas.

**Aceptación:** los dominios no consumen detalles internos ajenos; reglas y documentación coinciden; las excepciones están justificadas y acotadas.

### A18. Dividir el servicio de ejecución — P2

**Observado:** `execution.service.ts` tiene 1.994 líneas en la versión revisada e incluye numerosos tipos. La inspección completa de sus responsabilidades está pendiente.

**Acciones**

- [ ] Mapear capacidades, consumidores y comportamiento antes de extraer código.
- [ ] Separar contratos hacia `models`.
- [ ] Agrupar operaciones por capacidades coherentes: ciclo de vida, preparación, planificación, preferencias y widgets, según el análisis real.
- [ ] Mantener una fachada temporal durante la migración.
- [ ] Extraer mappers y reglas de dominio.
- [ ] Retirar la fachada cuando todos los consumidores estén migrados.

**Aceptación:** los contratos y el comportamiento se mantienen; disminuye el acoplamiento; el número de líneas no es el único criterio de diseño.

### A19. Normalizar modelos y estados de dominio — P2

**Acciones**

- [ ] Separar DTO, entidad de dominio y modelo de formulario.
- [ ] Consolidar estados legacy mediante adaptadores explícitos.
- [ ] Modelar las transiciones válidas de ejecución.
- [ ] Revisar listas vacías y agregaciones como `every()` según las reglas de negocio.
- [ ] Probar unidades, fechas, estados incompletos y transiciones inválidas.

**Aceptación:** los estados incompatibles no se mezclan silenciosamente; los mappers tienen pruebas independientes; una transición inválida produce un resultado explícito y coherente con backend.

### A20. Corregir el Golden Path — P2

**Depende de:** A07–A10 y la reparación de pruebas relevante.

**Observado:** templates acceden directamente a stores; hay tipos inline y formularios sin `mat-label`, en contradicción con reglas declaradas.

**Acciones**

- [ ] Inyectar stores privadamente y exponer señales específicas a templates.
- [ ] Mover tipos a sus ubicaciones acordadas.
- [ ] Incorporar `mat-label` y placeholders traducidos.
- [ ] Mantener `SaveButton` vinculado al estado correcto de la operación.
- [ ] Revisar los nombres accesibles de botones de icono.
- [ ] Cubrir el patrón completo con pruebas representativas.
- [ ] Retirar afirmaciones absolutas de «cero deuda» de la documentación.

**Aceptación:** la referencia cumple sus propias reglas y puede reutilizarse sin propagar los defectos conocidos.

### A21. Regularizar mocks — P2

**Observado:** `mocks/src/main.ts` usa `any` y desactiva reglas. Zod aparece en las instrucciones, pero no como dependencia directa del package.json raíz revisado.

**Acciones**

- [ ] Sustituir `any` por tipos Express y contratos explícitos.
- [ ] Retirar desactivaciones innecesarias de ESLint.
- [ ] Confirmar e implementar una estrategia verificable de validación contractual.
- [ ] Añadir escenarios configurables de error y latencia.
- [ ] Separar construcción de aplicación y arranque si facilita las pruebas.
- [ ] Probar las reescrituras de URLs versionadas.

**Aceptación:** un payload incompatible no se acepta silenciosamente; las fixtures válidas satisfacen el contrato; los escenarios son reproducibles sin editar manualmente datos; el código migrado no usa `any`.

## 8. Fase 5: rendimiento, UX, accesibilidad e i18n

**Responsabilidad propuesta:** frontend/UI y calidad; aplicar las skills de UI e i18n disponibles.

### A22. Revisar navegación y recargas — P2

**Observado:** `NoReuseStrategy` desactiva la reutilización global.

**Acciones**

- [ ] Identificar el motivo funcional original.
- [ ] Medir recreaciones, pérdida de estado y solicitudes repetidas.
- [ ] Restringir el comportamiento especial a las rutas que lo necesiten.
- [ ] Probar navegación hacia atrás y cambios de parámetros.

**Aceptación:** no quedan recargas innecesarias demostradas ni regresiones en actualización de datos.

### A23. Diferenciar carga inicial de refresco — P2

**Acciones**

- [ ] Reservar skeleton para la primera carga.
- [ ] Mantener datos anteriores durante actualizaciones cuando sea adecuado.
- [ ] Mostrar refresco y error sin destruir innecesariamente el contexto visual.
- [ ] Preservar selección, foco y paginación.

**Aceptación:** el usuario distingue datos anteriores de una actualización pendiente; no se pierde contexto injustificadamente.

### A24. Ajustar budgets y preproducción — P2

**Observado:** budgets iniciales de 3 MB de warning y 4 MB de error; `pre` tiene `optimization: false`. Estos límites no son tamaños medidos.

**Acciones**

- [ ] Medir chunks y carga por ruta.
- [ ] Investigar dependencias grandes donde exista impacto real.
- [ ] Definir presupuestos desde la línea base y objetivos de uso.
- [ ] Hacer preproducción representativa del build productivo.
- [ ] Mantener una configuración diagnóstica alternativa si se necesita.

**Aceptación:** se detectan regresiones de tamaño; las mediciones representan el artefacto desplegado.

### A25. Accesibilidad y localización — P2

**Observado:** botones de icono del listado revisado carecen de etiqueta accesible explícita; el idioma activo debe contrastarse con `LOCALE_ID` fijo en español.

**Acciones**

- [ ] Incorporar nombres accesibles traducidos en iconos y controles.
- [ ] Probar teclado, foco de diálogos y recuperación tras error.
- [ ] Revisar contraste y estados de interacción.
- [ ] Comprobar fechas y números al cambiar entre `es`, `en` y `de`.
- [ ] Añadir regresión visual de componentes clave.

**Aceptación:** los recorridos principales se realizan sin ratón; controles identificables por nombre accesible; textos y formatos coherentes por idioma.

## 9. Fase 6: operación y mantenimiento

**Responsabilidad propuesta:** frontend, plataforma y mantenimiento técnico.

### A26. Incorporar observabilidad funcional — P2

**Acciones**

- [ ] Capturar errores con versión de aplicación y operación.
- [ ] Medir duración de consultas y mutaciones críticas.
- [ ] Correlacionar solicitudes con backend.
- [ ] Diferenciar errores recuperados y fallos finales.
- [ ] Definir responsables y respuesta operativa, recogiendo solo la información necesaria.

**Aceptación:** un fallo se relaciona con versión y recorrido; el diagnóstico no depende exclusivamente de la consola del usuario.

### A27. Mejorar la promoción de artefactos — P2/P3

**Acciones**

- [ ] Evaluar configuración en runtime.
- [ ] Cuando sea viable, promover el mismo artefacto probado entre entornos.
- [ ] Mantener identidad inmutable de versión.
- [ ] Ensayar la vuelta a una versión anterior.

**Aceptación:** existe trazabilidad entre artefacto probado y desplegado; la recuperación es reproducible.

### A28. Alinear documentación y reglas — P2

**Observado:** la documentación describe zoneless con `provideZoneChangeDetection`, contradice límites entre features y contiene afirmaciones más estrictas que la implementación.

**Acciones**

- [ ] Corregir explicación zoneless, árbol de dominios y límites reales.
- [ ] Unificar Definition of Done y la fuente principal de reglas para agentes.
- [ ] Registrar ADR de mutaciones y fronteras.
- [ ] Automatizar restricciones de alto valor.
- [ ] Convertir warnings en errores progresivamente tras resolver la deuda.
- [ ] Documentar motivo, responsable y revisión de cada excepción.

**Aceptación:** documentación y configuración coinciden; los cambios nuevos no aumentan la deuda tolerada.

### A29. Mantener dependencias y limpiar residuos — P3

**Acciones**

- [ ] Realizar actualizaciones pequeñas, compatibles y verificadas.
- [ ] Revisar overrides y dependencias sin uso.
- [ ] Alinear herramientas de compilación y pruebas.
- [ ] Retirar scripts, aliases y configuraciones obsoletos tras comprobar consumidores.
- [ ] Migrar nombres antiguos al modificar funcionalidad, evitando renombrados masivos sin beneficio funcional.

**Aceptación:** cada dependencia y override conservado tiene uso o justificación; las actualizaciones no se acumulan hasta exigir una migración disruptiva.

La revisión especializada de seguridad queda fuera de este plan y se debe canalizar mediante Security Analyst Agent. Este documento no certifica ese ámbito.

## 10. Hitos y dependencias

| Hito                         | Actuaciones      | Resultado verificable                                        |
| ---------------------------- | ---------------- | ------------------------------------------------------------ |
| H0: diagnóstico reproducible | A01–A02          | Alcance, fallos y métricas conocidos                         |
| H1: pipeline fiable          | A03–A06          | Controles reales y producción construible                    |
| H2: comportamiento fiable    | A07–A14          | Mutaciones, recursos, calendario y pruebas corregidos        |
| H3: arquitectura coherente   | A17–A21          | Golden Path válido y fronteras claras                        |
| H4: producto comprobable     | A15–A16, A22–A25 | Cobertura efectiva, E2E, contratos, UX y rendimiento medidos |
| H5: calidad sostenible       | A26–A29          | Observabilidad y mantenimiento continuo                      |

### Paralelismo permitido

- CI y reparación de tests pueden avanzar en paralelo tras la línea base.
- Calendario puede corregirse en paralelo con el CRUD de master-data.
- El refactor del servicio de ejecución debe esperar cobertura suficiente de sus contratos y comportamientos.
- La propagación del Golden Path debe esperar la corrección del propio patrón.
- Las optimizaciones de rendimiento requieren medición previa y no bloquean las correcciones P0.
- La documentación debe actualizarse junto con cada cambio, aunque A28 cierre la revisión global.

### Control de cada entrega

Cada tarea debe registrar responsable, revisión de partida, alcance, test o evidencia de validación, resultado, limitaciones y estrategia de reversión. Si una hipótesis se descarta, registrar la evidencia y cerrar la actuación como no aplicable en lugar de introducir un cambio innecesario.

No asignar fechas definitivas hasta conocer los resultados de H0, la capacidad del equipo y las dependencias externas. Priorizar por impacto y riesgo, no por facilidad de cierre.

## 11. Definition of Done

- [ ] Instalación limpia y reproducible.
- [ ] Cero errores de lint y excepciones restantes inventariadas.
- [ ] Tests unitarios relevantes pasando mediante Nx.
- [ ] Build productivo correcto.
- [ ] Cero imports rotos y fronteras arquitectónicas comprobadas.
- [ ] Regresiones conocidas de concurrencia cubiertas.
- [ ] Contratos críticos verificados.
- [ ] Recorridos E2E principales automatizados.
- [ ] Accesibilidad y rendimiento con objetivos medidos.
- [ ] Documentación alineada con la implementación.
- [ ] Cambios pequeños, trazables y reversibles.

**Inicio recomendado:** A01–A06 y A13–A14. Antes de reorganizar la arquitectura, conseguir un pipeline que ejecute controles reales y pruebas que fallen cuando el comportamiento esperado se rompe.

## 12. Referencias

### Evidencias del repositorio

- [Configuración CI](../.gitlab-ci.yml)
- [Scripts y dependencias](../package.json)
- [Configuración Nx](../nx.json)
- [Reglas ESLint](../eslint.base.config.mjs)
- [Build y entornos de aplicación](../apps/intaqalab/project.json)
- [Configuración Angular](../apps/intaqalab/src/app/app.config.ts)
- [Verificación local](../tools/verify/verify.mjs)
- [Golden Path](../libs/domain/master-data/README.md)
- [Factoría de recursos de maestros](../libs/domain/master-data/src/lib/services/master-data-resource.factory.ts)
- [Pruebas de la factoría](../libs/domain/master-data/src/lib/services/master-data-resource.factory.spec.ts)
- [Pruebas del listado](../libs/domain/master-data/src/lib/components/list/master-data-list.component.spec.ts)
- [Store de calendario](../libs/domain/calendar-trials/src/lib/+state/calendar-trials.store.ts)
- [Servicio de ejecución](../libs/domain/trial/execution/src/lib/services/execution.service.ts)
- [Features de ejecución](../libs/domain/trial/execution/src/lib/+state/features/)
- [Servidor mock](../mocks/src/main.ts)
- [Arquitectura documentada](ARCHITECTURE.md)
