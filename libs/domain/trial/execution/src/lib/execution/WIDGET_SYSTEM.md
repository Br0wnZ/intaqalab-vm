# Widget System Documentation

## 🎯 Overview

Sistema centralizado de gestión de widgets para el grid de ejecución. Incluye:

- **Enum centralizado** de IDs de widgets (`WidgetId`)
- **Registro de configuración** con metadatos de cada widget
- **Persistencia en backend** de preferencias de usuario/rol
- **Sincronización automática** entre estado local y servidor

---

## 📦 Estructura

### Modelos

```
models/
├── widget-id.enum.ts              # Enum WidgetId (única fuente de verdad)
├── widget-registry.ts              # Configuración de cada widget
├── widget-preferences.model.ts     # Tipos para persistencia
├── execution-grid.models.ts        # Tipos del grid (usar WidgetId)
└── index.ts                        # Exports centralizados
```

### Servicios & Stores

```
services/
└── widget-preferences.service.ts   # HTTP requests

+state/
└── widget-preferences.store.ts     # SignalStore (persistencia)
```

---

## 🚀 Quick Start

### Usar WidgetId en componentes

```typescript
import { WidgetId } from '@intaqalab/domain-trial-execution';

// En el grid switch:
@switch (widget.type) {
  @case (WidgetId.SHOT) { <inta-shot-widget /> }
  @case (WidgetId.JLT_MAO) { <inta-jlt-mao /> }
  @case (WidgetId.EXECUTION_PREP_TECH) {
    <inta-execution-prep-tech-widget [techProfile]="widget.techProfile" />
  }
}
```

### Cargar preferencias guardadas

```typescript
import { WidgetPreferencesStore } from '@intaqalab/domain-trial-execution';

export class ExecutionComponent {
  readonly preferencesStore = inject(WidgetPreferencesStore);

  ngOnInit() {
    // Cargar preferencias del backend
    await this.preferencesStore.loadPreferences(centerId, fireTrialId);

    // Acceder a widgets guardados
    const widgets = this.preferencesStore.getAllWidgets();
  }
}
```

### Guardar cambios de widgets

```typescript
// Cuando el usuario reordena/añade/remueve widgets:
await this.preferencesStore.savePreferences(
  this.widgetStateService.placedWidgets().map((w) => ({
    widgetId: w.type,
    position: w.position,
    width: w.width,
    height: w.height,
    techProfile: w.techProfile,
  })),
);
```

---

## 📋 Widget Registry

Todos los widgets están registrados en `WIDGET_REGISTRY`:

```typescript
export const WIDGET_REGISTRY: Record<WidgetId, WidgetConfig> = {
  [WidgetId.SHOT]: {
    id: WidgetId.SHOT,
    titleKey: 'TRIAL_EXECUTION.WIDGETS.SHOT.TITLE',
    descriptionKey: 'TRIAL_EXECUTION.WIDGETS.SHOT.DESCRIPTION',
    defaultWidth: 1,
    hasForm: true,
  },
  // ... más widgets
};
```

**Acceder a configuración de un widget**:

```typescript
import { getWidgetConfig } from '@intaqalab/domain-trial-execution';

const config = getWidgetConfig(WidgetId.SHOT);
console.log(config.titleKey); // "TRIAL_EXECUTION.WIDGETS.SHOT.TITLE"
```

---

## 💾 API Endpoints

### General (usuario actual)

```http
GET    /{centerId}/fire-trials/{fireTrialId}/execution/preferences
PUT    /{centerId}/fire-trials/{fireTrialId}/execution/preferences
```

### Por Rol

```http
GET    /{centerId}/fire-trials/{fireTrialId}/execution/preferences/roles/{roleName}
PUT    /{centerId}/fire-trials/{fireTrialId}/execution/preferences/roles/{roleName}
```

### Por Usuario

```http
GET    /{centerId}/fire-trials/{fireTrialId}/execution/preferences/users/{username}
PUT    /{centerId}/fire-trials/{fireTrialId}/execution/preferences/users/{username}
```

### Payload de petición

```json
{
  "widgets": [
    {
      "widgetId": "shot",
      "position": { "row": 1, "col": 1 },
      "width": 1,
      "height": 1
    },
    {
      "widgetId": "execution-prep-tech",
      "position": { "row": 1, "col": 2 },
      "width": 2,
      "height": 1,
      "techProfile": "velocidades"
    }
  ]
}
```

### Respuesta del servidor

```json
{
  "success": true,
  "message": "Preferencias guardadas correctamente",
  "preferences": {
    "centerId": "center-001",
    "fireTrialId": "trial-001",
    "widgets": [...],
    "createdAt": "2026-06-11T10:00:00Z",
    "updatedAt": "2026-06-11T10:00:00Z"
  }
}
```

---

## 🔧 Añadir un nuevo widget

### 1. Añadir ID al enum

**File**: `models/widget-id.enum.ts`

```typescript
export enum WidgetId {
  // ...
  MY_NEW_WIDGET = 'my-new-widget',
}
```

### 2. Registrar en el registry

**File**: `models/widget-registry.ts`

```typescript
[WidgetId.MY_NEW_WIDGET]: {
  id: WidgetId.MY_NEW_WIDGET,
  titleKey: 'TRIAL_EXECUTION.WIDGETS.MY_NEW_WIDGET.TITLE',
  descriptionKey: 'TRIAL_EXECUTION.WIDGETS.MY_NEW_WIDGET.DESCRIPTION',
  defaultWidth: 2,
  hasForm: true, // si tiene formulario con cambios
},
```

### 3. Actualizar el switch en execution-grid.ts

```typescript
@case (WidgetId.MY_NEW_WIDGET) {
  <inta-my-new-widget [widgetId]="widget.id" />
}
```

### 4. Añadir traducciones

**Files**: `es.json`, `en.json`, `de.json`

```json
"WIDGETS": {
  "MY_NEW_WIDGET": {
    "TITLE": "Mi Nuevo Widget",
    "DESCRIPTION": "Descripción del widget"
  }
}
```

---

## ✅ Type Safety

### Type Guard

```typescript
import { isValidWidgetId } from '@intaqalab/domain-trial-execution';

if (isValidWidgetId(someValue)) {
  // someValue es un WidgetId válido
}
```

### Acceder a valores del enum

```typescript
import { ALL_WIDGET_IDS } from '@intaqalab/domain-trial-execution';

// Iterar sobre todos los widgets
ALL_WIDGET_IDS.forEach((id) => {
  const config = getWidgetConfig(id);
  console.log(config.titleKey);
});
```

---

## 🔄 Flujo de sincronización

```
┌─────────────────────────────────────────┐
│  Usuario interactúa con grid            │
│  (añade/remueve/reordena widgets)       │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  WidgetStateService actualiza en memoria│
│  (PlacedWidget[] signal)                │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Usuario hace clic "Guardar"            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  preferencesStore.savePreferences()     │
│  - Convierte PlacedWidget[] a           │
│    SavedWidgetConfig[]                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  WidgetPreferencesService.               │
│  upsertWidgetPreferences()              │
│  - HTTP PUT al backend                  │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  Backend persiste en DB                 │
│  y retorna WidgetPreferences            │
└──────────────┬──────────────────────────┘
               │
               ▼
┌─────────────────────────────────────────┐
│  preferencesStore actualiza              │
│  su estado signal                       │
└─────────────────────────────────────────┘
```

---

## 🐛 Debugging

### Verificar widgets registrados

```typescript
import { ALL_WIDGET_IDS, WIDGET_REGISTRY } from '@intaqalab/domain-trial-execution';

console.log('Total widgets:', ALL_WIDGET_IDS.length);
console.log('Registry:', WIDGET_REGISTRY);
```

### Verificar estado de preferencias

```typescript
import { WidgetPreferencesStore } from '@intaqalab/domain-trial-execution';

const store = inject(WidgetPreferencesStore);
console.log('Preferences:', store.preferences());
console.log('Error:', store.error());
console.log('Loading:', store.isLoading());
```

### Validar IDs

```typescript
import { isValidWidgetId } from '@intaqalab/domain-trial-execution';

const testId = 'shot';
if (isValidWidgetId(testId)) {
  console.log('✓ ID válido:', testId);
} else {
  console.log('✗ ID inválido:', testId);
}
```

---

## 📚 References

- [WidgetId Enum](./models/widget-id.enum.ts)
- [Widget Registry](./models/widget-registry.ts)
- [Execution Grid Models](./models/execution-grid.models.ts)
- [Widget Preferences Models](./models/widget-preferences.model.ts)
- [Widget Preferences Service](./services/widget-preferences.service.ts)
- [Widget Preferences Store](./+state/widget-preferences.store.ts)
