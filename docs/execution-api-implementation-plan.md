# Plan de ejecución: integración de `execution-api`

## 1. Contexto y decisión arquitectónica

Se ha revisado la arquitectura real de la aplicación y se confirma que `centerId` **no debe formar parte de los métodos de `ExecutionService`, del `ExecutionStore` ni de los componentes**.

La responsabilidad está centralizada en `centerInterceptor`, registrado globalmente en `apps/intaqalab/src/app/app.config.ts` mediante `provideHttpClient(withInterceptors(...))`.

El interceptor transforma las URLs base de los servicios, por ejemplo:

```text
/api/execution-api/1.0.0/fire-trials/{fireTrialId}/execution/state
```

en la ruta final con centro:

```text
/api/centers/{centerId}/execution-api/1.0.0/fire-trials/{fireTrialId}/execution/state
```

El proxy reescribe posteriormente la ruta para el backend remoto o para el mock local.

### Consecuencias

- No añadir `centerId` a las firmas de los servicios de ejecución.
- No duplicar `/centers/{centerId}` en las URLs del servicio.
- Mantener las pruebas unitarias de `ExecutionService` sin interceptor cuando validan la URL original.
- Añadir/fortalecer pruebas específicas de `centerInterceptor` para validar la URL final.
- Las pruebas de integración deben registrar el interceptor si se quiere verificar el flujo completo.

## 2. Arquitectura actual

```text
Componente de ejecución
        ↓
ExecutionPageFacade / widget
        ↓
ExecutionStore
        ↓
ExecutionService ────────→ execution-api
        ↓                         ↑
HttpClient → centerInterceptor ┘
        ↓
Proxy de la aplicación
        ↓
Backend remoto o Express mocks
```

La librería ya tiene un `ExecutionService` central basado en `httpResource` y un `ExecutionStore` compuesto por features de SignalStore.

También existen servicios paralelos:

- `FireTrialLifecycleService` para lifecycle del ensayo.
- `WidgetPreferencesService`, parcialmente legacy y con un contrato distinto.
- Accesos directos de algunos widgets a `ExecutionService`.

El objetivo es conservar la separación de responsabilidades y reducir los accesos HTTP directos desde componentes.

## 3. Inventario del contrato `execution-api`

### Cubierto actualmente en `ExecutionService`

- `GET /execution/state`
- `GET /execution/progress`
- `GET /execution/security-countdown`
- `PUT /execution/security-countdown`
- `POST /execution/pause`
- `POST /execution/interrupt`
- `POST /execution/resume`
- `GET /execution/readiness`
- `PUT /execution/readiness/profiles/{profile}/series/{seriesId}`
- `GET /execution/jlt-preparation`
- `PUT /execution/jlt-preparation/series/{seriesId}`
- `POST /execution/jlt-preparation/shots/{shotId}/active`
- `POST /execution/jlt-preparation/fire`
- Preferencias por rol.
- Preferencias por usuario.
- Selector de equipos.
- JLT shot data.
- Velocidades.
- Presiones.
- Municiones.
- Presiones de manómetro.
- Armamento.
- Configuración masiva de armamento.

### Cubierto de forma indirecta o con contrato distinto

- `POST /execution/start`: se delega actualmente a `FireTrialLifecycleService`.
- `POST /execution/finish`: se delega actualmente a `FireTrialLifecycleService`.
- `POST /execution/cancel`: se delega actualmente a `FireTrialLifecycleService`.

Estos endpoints deben revisarse porque el contrato de execution-api es distinto del lifecycle API:

```text
Execution API:
/execution/start
/execution/finish
/execution/cancel

Lifecycle API:
/fire-trials/{fireTrialId}/start
/fire-trials/{fireTrialId}/finish
/fire-trials/{fireTrialId}/cancel
```

La pantalla de ejecución debe utilizar el contrato que corresponda funcionalmente. Si la fuente de verdad es `execution-api.json`, hay que implementar las transiciones directamente en `ExecutionService`.

### Falta implementar

El contrato define además los siguientes pares GET/PUT que no aparecen implementados en `ExecutionService`:

- `jlt-mao`
- `mao-topography`
- `topography`
- `trajectography`
- `acoustic-level`

Rutas:

```text
GET/PUT /execution/jlt-mao/series/{seriesId}/shots/{shotId}
GET/PUT /execution/mao-topography/series/{seriesId}/shots/{shotId}
GET/PUT /execution/topography/series/{seriesId}/shots/{shotId}
GET/PUT /execution/trajectography/series/{seriesId}/shots/{shotId}
GET/PUT /execution/acoustic-level/series/{seriesId}/shots/{shotId}
```

## 4. Objetivos de implementación

1. Alinear el servicio con todos los endpoints del contrato.
2. Mantener `centerId` exclusivamente en el interceptor.
3. Hacer que el store sea la fachada de estado para los componentes.
4. Uniformar la gestión de mutaciones, errores y respuestas.
5. Completar mocks mutables y fixtures.
6. Alinear códigos HTTP y validaciones con Swagger.
7. Mantener tests unitarios rápidos y añadir tests de integración del interceptor.

---

# 5. Plan por fases

## Fase 0 — Baseline y trazabilidad

### Tareas

- Extraer de `apis/execution-api.json` todos los `operationId`, métodos, rutas, cuerpos y respuestas.
- Crear una matriz de trazabilidad endpoint → servicio → store → componente → mock → fixture → test.
- Confirmar los schemas exactos de los cinco widgets faltantes.
- Confirmar el contrato oficial de `ExecutionFinishResponse`.
- Confirmar si start/finish/cancel de la pantalla deben utilizar Execution API o Lifecycle API.
- Revisar el estado inicial de `git` y no tocar cambios ajenos.

### Entregable

Matriz de cobertura contractual sin cambios funcionales.

## Fase 1 — Blindar la responsabilidad del `centerInterceptor`

### Tareas

- No modificar las firmas de `ExecutionService` para añadir `centerId`.
- Añadir tests reales de `centerInterceptor` para:
  - URL local `/api`.
  - URL remota versionada.
  - endpoint execution.
  - endpoint planning.
  - `SKIP_CENTER_INTERCEPTOR`.
  - URLs externas o no pertenecientes al `apiUrl`.
- Verificar que no se inyecta el centro dos veces.
- Verificar el orden de interceptores en `app.config.ts`.
- Documentar que las pruebas de servicio no incluyen automáticamente el interceptor.
- Crear, si es necesario, una configuración de test de integración con `withInterceptors([centerInterceptor])`.

### Criterio de aceptación

Una petición del servicio sigue usando la URL base sin centro y la petición interceptada contiene exactamente un segmento `/centers/{centerId}`.

## Fase 2 — Corregir transiciones de ejecución

### Tareas

- Decidir el contrato oficial para start/finish/cancel.
- Si se confirma execution-api, implementar recursos en `ExecutionService`:
  - `startResource` para `POST /execution/start`.
  - `finishResource` para `POST /execution/finish`.
  - `cancelResource` para `POST /execution/cancel`.
- Mantener `FireTrialLifecycleService` para el resto de pantallas que trabajen con lifecycle.
- Alinear los payloads de motivo y respuesta de finalización.
- Corregir `ExecutionPageFacade.pauseExecution()` para que invoque al store después del diálogo.
- Hacer que todas las transiciones sincronicen estado y progreso después de resolución.

### Transiciones afectadas

- start
- pause
- interrupt
- resume
- cancel
- finish

### Criterio de aceptación

Cada transición realiza una única petición al endpoint esperado, maneja su código HTTP contractual y provoca la recarga de estado/progreso.

## Fase 3 — Sincronización y polling

### Tareas

- Cambiar el polling para refrescar conjuntamente:
  - execution state.
  - execution progress.
- Mantener el polling condicionado por visibilidad de página.
- Mantener el latch de carga inicial para no destruir el grid.
- Evitar peticiones duplicadas después de una transición.
- Reactivar `loadError` en `ExecutionPageFacade`.
- Exponer errores de estado, progreso, planning, preferencias y readiness.
- Añadir acción de retry en la pantalla.

### Criterio de aceptación

El header refleja cambios de estado y porcentaje sin recargar la página, y los errores son visibles y recuperables.

## Fase 4 — Completar los servicios de datos faltantes

### Tareas

Para cada widget faltante implementar en `ExecutionService` el mismo patrón ya usado para widgets existentes:

- Tipos request/response.
- Señales de parámetros con `_t`.
- Resource GET reactivo.
- Método `getX` para disparar el resource.
- Resource PUT.
- Método de mutación async cuando el formulario necesite esperar.
- Propagación de errores.
- Tests unitarios HTTP.

### Recursos

#### JLT MAO

```text
GET/PUT /execution/jlt-mao/series/{seriesId}/shots/{shotId}
```

#### MAO Topography

```text
GET/PUT /execution/mao-topography/series/{seriesId}/shots/{shotId}
```

#### Topography

```text
GET/PUT /execution/topography/series/{seriesId}/shots/{shotId}
```

#### Trajectography

```text
GET/PUT /execution/trajectography/series/{seriesId}/shots/{shotId}
```

#### Acoustic Level

```text
GET/PUT /execution/acoustic-level/series/{seriesId}/shots/{shotId}
```

### Criterio de aceptación

Todos los endpoints del contrato tienen un método tipado en el servicio y una prueba que verifica URL, método, body y respuesta.

## Fase 5 — Integrar los servicios faltantes en el store

### Tareas

- Añadir slices/features para los cinco grupos de datos faltantes.
- Exponer señales de:
  - valor actual.
  - loading.
  - saving.
  - error.
- Añadir acciones de carga por selección de serie/disparo.
- Añadir acciones de actualización.
- Aplicar `createSelectionGuard` cuando exista cambio rápido de shot.
- Mantener dirty tracking basado en valores.
- Actualizar snapshots después de PUT exitoso.
- Recargar o parchear el estado tras mutaciones según el contrato.

### Criterio de aceptación

Los widgets pueden funcionar consumiendo únicamente señales y métodos del store.

## Fase 6 — Migrar componentes y widgets

### Prioridad

1. JLT shot data.
2. Velocities.
3. Pressures.
4. Armament.
5. Munitions.
6. Manometer pressures.
7. Equipment selector.
8. JLT MAO.
9. MAO topography.
10. Topography.
11. Trajectography.
12. Acoustic level.

### Tareas

- Eliminar gradualmente inyecciones directas de `ExecutionService` en componentes.
- Consumir `ExecutionStore` desde widgets y diálogos.
- Mantener los mappers cerca del store o del widget según la convención existente.
- Hacer que `saveForm()` devuelva/espere una promesa cuando corresponda.
- Propagar errores al `WidgetStateService`.
- Comprobar que el cambio de selección no conserva datos del shot anterior.
- Verificar que los widgets futuros y shots ejecutados mantienen el modo read-only.

### Criterio de aceptación

El flujo principal queda:

```text
Componente → ExecutionStore → ExecutionService → HttpClient → centerInterceptor
```

## Fase 7 — Normalizar preferencias

### Problema actual

`WidgetPreferencesService` usa un contrato antiguo con:

```text
/execution/preferences
```

y modelos basados en `widgets`, mientras que `ExecutionService` y mocks usan:

```text
/execution/preferences/roles/{roleName}
/execution/preferences/users/{username}
```

y:

```ts
{ widgetsLayout: string[] }
```

### Tareas

- Adoptar `ExecutionWidgetLayout` como modelo único.
- Migrar `WidgetPreferencesStore` a `ExecutionService` o a una fachada de preferencias alineada.
- Eliminar las rutas base no definidas por Swagger.
- Mantener preferencias por rol y usuario.
- Actualizar `ExecutionPageFacade` y su store.
- Marcar `WidgetPreferencesService` como deprecated.
- Eliminarlo cuando no queden consumidores.

### Criterio de aceptación

No existen modelos ni rutas incompatibles para preferencias.

## Fase 8 — Separar Planning, Execution y Lifecycle

### Decisión

No es necesario modificar esta separación de forma inmediata, pero debe evitarse que `ExecutionService` crezca indefinidamente.

### Propuesta

`ExecutionService`:

- Solo `/execution/...`.

`ExecutionPlanningService` o servicio de planning existente:

- `/planning/series`.
- `/planning/equipment/items`.
- `/planning/armament`.

`FireTrialLifecycleService`:

- `/fire-trials/{id}/start`.
- `/fire-trials/{id}/finish`.
- `/fire-trials/{id}/cancel`.
- `/fire-trials/{id}/void`.
- `/fire-trials/{id}/close`.
- `/fire-trials/{id}/reopen`.
- `/fire-trials/{id}/reactivate`.

### Tareas

- Identificar qué consumidores necesitan cada dominio.
- Extraer progresivamente métodos de planning de `ExecutionService`.
- Evitar cambios de API pública innecesarios durante la migración.
- Mantener exports compatibles temporalmente.

## Fase 9 — Completar mocks y fixtures

### Rutas nuevas

Añadir en `mocks/src/routes/execution.routes.ts` GET/PUT para:

- JLT MAO.
- MAO topography.
- Topography.
- Trajectography.
- Acoustic level.

### Estado mutable

Cada widget debe usar una clave compuesta:

```text
fireTrialId + seriesId + shotId
```

### Reglas de mock

- GET devuelve fixture clonado.
- PUT persiste el payload y devuelve la respuesta contractual.
- Shot inexistente devuelve `404`.
- Shot no editable devuelve `409`.
- Payload inválido devuelve `400`.
- Las respuestas sin body devuelven `204`.
- No devolver fixtures estáticos después de una mutación.

### Progreso

Hacer mutable el progreso de ejecución para que:

- selección de shot actualice estado activo.
- fire marque el shot como `FIRED`.
- se actualicen timestamps.
- el porcentaje del header cambie durante polling.

### JLT preparation

Persistir el estado por `fireTrialId` y `seriesId`; no ignorar `seriesId`.

## Fase 10 — Tests

### Tests de servicio

Para cada endpoint verificar:

- URL base generada por el servicio.
- Método HTTP.
- Query params.
- Body.
- Respuesta exitosa.
- Error propagado.
- Código `204` cuando corresponda.
- Repetición de la misma acción mediante `_t`.

### Tests del interceptor

Verificar:

- inserción de centro en local.
- inserción de centro después de versión en remoto.
- no duplicación.
- bypass mediante `SKIP_CENTER_INTERCEPTOR`.
- URLs fuera de `apiUrl`.

### Tests del store

Verificar:

- sincronización de resources.
- patch tras PUT.
- reload tras transición.
- reload de state y progress.
- estado de loading/error.
- selección de serie/shot.

### Tests de componentes

Cada widget debe cubrir:

- carga inicial.
- cambio de serie.
- cambio de disparo.
- protección ante respuesta obsoleta.
- dirty tracking.
- guardado.
- reset.
- error de guardado.
- read-only.

## Fase 11 — Validación final

Ejecutar el conjunto específico de ejecución:

```bash
NX_DAEMON=false npx vitest run --config libs/domain/trial/execution/vite.config.mts
```

Después ejecutar el typecheck/build definido por el workspace.

### Checklist final

- [ ] Ningún servicio añade manualmente `centerId`.
- [ ] El interceptor añade exactamente un centro.
- [ ] Todas las rutas execution del contrato tienen método de servicio.
- [ ] Todos los métodos de servicio tienen mock.
- [ ] Todos los widgets tienen fixture.
- [ ] Las transiciones utilizan el contrato correcto.
- [ ] Las transiciones sincronizan state y progress.
- [ ] `pauseExecution()` ejecuta realmente la pausa.
- [ ] El progreso mock es mutable.
- [ ] JLT preparation respeta `seriesId`.
- [ ] No se usan rutas antiguas de preferencias.
- [ ] Los componentes consumen preferentemente el store.
- [ ] Los errores se exponen y se pueden reintentar.
- [ ] Las pruebas del interceptor cubren local y remoto.

# 6. Orden recomendado de entrega

## Entrega 1 — Correcciones funcionales críticas

- Transiciones de execution API.
- Pausa incompleta.
- Recarga inmediata de state/progress.
- Polling de progreso.
- Alineación de códigos HTTP en mocks.

## Entrega 2 — Cobertura contractual

- Cinco servicios de widgets faltantes.
- Tipos y tests.
- Rutas y fixtures mock.

## Entrega 3 — Integración de estado

- Features del store.
- Migración de widgets prioritarios.
- Dirty tracking y errores.

## Entrega 4 — Normalización arquitectónica

- Preferencias.
- Separación Planning/Execution/Lifecycle.
- Eliminación de servicios legacy.

## Entrega 5 — Hardening

- Tests de interceptor.
- Tests de errores y concurrencia.
- Validación end-to-end con mocks.

# 7. Riesgos y decisiones pendientes

## Riesgo: doble responsabilidad de centro

Mitigación: no cambiar `ExecutionService`; cubrirlo con tests del interceptor.

## Riesgo: dos APIs para transiciones

Mitigación: decidir explícitamente entre Execution API y Lifecycle API antes de modificar start/finish/cancel.

## Riesgo: mutaciones `void` no esperables

Mitigación: migrar los guardados de formulario a métodos async que devuelvan la respuesta o propaguen el error.

## Riesgo: respuestas legacy incompatibles

Mitigación: modelar adaptadores temporales, pero mantener un contrato interno único.

## Riesgo: cambios ajenos en el checkout

Mitigación: no sobrescribir ni incluir en cambios archivos modificados por otros agentes o por el usuario.

# 8. Resultado esperado

La arquitectura final será:

```text
Componente
  ↓
ExecutionStore / ExecutionPageFacade
  ↓
ExecutionService
  ↓
HttpClient
  ↓
centerInterceptor (añade centerId)
  ↓
Proxy
  ↓
execution-api o mocks
```

Con todos los endpoints de `execution-api` cubiertos, estado y progreso sincronizados, widgets desacoplados del acceso HTTP directo y mocks suficientemente realistas para validar la ejecución completa.
