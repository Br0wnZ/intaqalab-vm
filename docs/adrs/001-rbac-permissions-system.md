# ADR-001: Sistema de Permisos Basado en Roles (RBAC)

**Estado:** Aceptado  
**Fecha:** 2026-06-18  
**Autores:** AI Orchestrator (INTAQALAB)

---

## Contexto

INTAQALAB gestiona 15 perfiles de usuario con distintos niveles de acceso al sistema. Se requiere controlar:

1. **Visibilidad de menú lateral** — qué secciones aparecen según rol
2. **Acceso a rutas** — protección a nivel de router con `canMatch`
3. **Acciones sobre pruebas** — botón de acciones filtrado por rol + estado
4. **Acceso a planificación** — visible solo cuando la prueba está validada (`PLANNED`+) salvo roles privilegiados
5. **Modo readonly en planificación** — usuarios sin permiso de edición ven pero no modifican
6. **Permisos de calendario** — acciones especiales restringidas por rol

## Decisión

### 1. Fuente única de verdad: `role-groups.constants.ts`

Todos los grupos de roles se definen **una sola vez** en `libs/core/src/lib/utils-auth/models/role-groups.constants.ts` y se exportan desde `@intaqalab/core`.

**Alternativa rechazada:** Definir roles inline en cada componente/servicio — genera inconsistencias cuando cambian los requisitos.

### 2. Permisos de planificación: status-based + role-based en el shell

La pestaña de Planificación en el detalle de una prueba se controla desde `FeaturePlanningGeneralDataShellComponent` usando `PlanningPermissionsService`:

| Estado prueba  | Rol                             | Acceso              |
| -------------- | ------------------------------- | ------------------- |
| `UNDER_REVIEW` | Admin, PlanningHead, Consultant | ✅ Edición completa |
| `UNDER_REVIEW` | Resto                           | ❌ Sin acceso       |
| `PLANNED`+     | Admin, PlanningHead, Consultant | ✅ Edición completa |
| `PLANNED`+     | Todos (excepto Viewer)          | ✅ Solo lectura     |
| `PLANNED`+     | Viewer                          | ❌ Sin acceso       |

La regla "prueba validada = estado PLANNED" evita añadir campos extra al modelo.

### 3. Modo readonly en formularios de planificación

El input `readonly: boolean` se propaga desde el shell a cada pestaña. Signal Forms usa `disabled()` reactivo para bloquear todos los campos cuando `readonly = true`. Los botones Guardar/Cancelar/Validar se ocultan con `@if (!readonly())`.

### 4. Acciones de prueba: filtrado en `ButtonTrialActionsComponent`

La función `filterTrialActions()` filtra por rol **y** estado de forma reactiva. Las constantes de cada acción usan los grupos de `role-groups.constants.ts`.

### 5. Rutas: `canMatchRole` guard

El guard `canMatchRole` lee `route.data.roles` y comprueba contra `AuthService.hasAnyRole()`. Las rutas usan los grupos centralizados.

## Consecuencias

### Positivas

- Un solo punto de cambio cuando evolucionan los roles
- Permisos verificables en tests sin tocar componentes
- Comportamiento reactivo: si los roles cambian en runtime, la UI se actualiza

### Negativas

- Los subcomponentes de planificación (SeriesAndShots, Armament, etc.) necesitan implementar el input `readonly` para honrar el modo lectura — trabajo incremental

### Pendiente

- Gestión Documental: `createdBy` no existe aún en el modelo de documento; cuando se añada, implementar la comprobación "solo puede editar/eliminar documentos propios" en `TrialDocsService`
- Viewer + lista de pruebas: filtrar en backend/frontend solo pruebas del cliente asociado al Viewer

## Referencias

- `libs/core/src/lib/utils-auth/models/role-groups.constants.ts`
- `libs/domain/trial/planning/src/lib/planning-permissions.service.ts`
- `libs/domain/trial/trial-management/src/lib/permissions/trial-persmissions.service.ts`
- `apps/intaqalab/src/app/app.routes.ts`
- `apps/intaqalab/src/app/components/menu-left/menu-left.config.ts`
