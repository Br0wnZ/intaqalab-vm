# Testing Utilities (`libs/shared/utils/src/lib/testing`)

Esta librería proporciona un conjunto de utilidades, mocks y factories para facilitar las pruebas unitarias y de integración en el proyecto, especialmente enfocadas en componentes que utilizan Angular Material, Signals y la arquitectura de httpResource.

## Contenido

### 1. Factories de Modelos

Permiten generar datos de prueba consistentes y tipados rápidamente.

**Ubicación:** `testing-helpers.ts`

```typescript
import { createSpecimens, createTrial, createUsers } from '@inta/shared/utils/testing';

// Crear lista de especímenes por defecto
const specimens = createSpecimens(); // { page, pageSize, totalElements, items: [{id, name, type, active}, ...] }

// Personalizar cantidad
const manyUsers = createUsers(10);

// Sobrescribir propiedades
const customTrial = createTrial({
  name: 'Prueba Personalizada',
  code: 'CUSTOM-001',
});
```

### 2. Mocks de Angular Material

Utilidades para testear componentes que usan diálogos sin depender del módulo real de Material.

**Ubicación:** `dialog-test-helpers.ts`, `testing-helpers.ts`

```typescript
import { createMockMatDialog, createMockMatDialogRef } from '@inta/shared/utils/testing';

// Mockear MatDialogRef
const dialogRef = createMockMatDialogRef();
component.dialogRef = dialogRef;

// Mockear MatDialog con retorno específico
const dialog = createMockMatDialog({
  defaultResult: { confirmed: true },
});
```

### 3. Signal Helpers

Herramientas avanzadas para testear `Signals` de Angular, especialmente útiles para efectos asíncronos o cambios de estado reactivos.

**Ubicación:** `core/signal.helpers.ts`

```typescript
import { waitForSignal, waitForSignalValue } from '@inta/shared/utils/testing/core';

// Esperar a que un signal cumpla una condición
await waitForSignal(mySignal, (val) => val > 10);

// Esperar un valor específico
await waitForSignalValue(statusSignal, 'resolved');
```

### 4. Resource Helpers

Facilita el testing de componentes que usan Resource (`Resource<T>`), permitiendo simular estados de carga, error y éxito manualmente.

**Ubicación:** `core/resource.helpers.ts`

```typescript
import { createMockResource } from '@inta/shared/utils/testing/core';

const userResource = createMockResource<User>();

// Simular carga
userResource._setLoading(true);

// Simular datos recibidos
userResource._setValue({ id: 1, name: 'Test' });

// Simular error
userResource._setError(new Error('Network fail'));
```

### 5. Service Mocks

Mocks pre-configurados para servicios de negocio complejos.

**Ubicación:** `testing-helpers.ts`

```typescript
import { createMockDataPlanningService } from '@inta/shared/utils/testing';

const mockService = createMockDataPlanningService({
  specimens: customSpecimens, // opcional: inyectar datos iniciales
});
```

## Cómo crear nuevas utilidades

1.  **Identificar el patrón:** Si te encuentras repitiendo la misma configuración de mock o creación de objetos en múltiples tests, es candidato para esta librería.
2.  **Ubicación:**
    - **Factories de Modelos:** Añadir a `testing-helpers.ts` siguiendo el patrón `createNombreEntidad`.
    - **Helpers Genéricos:** Si es lógica pura (ej. manejo de DOM o asincronía), añadir a `core/` o crear un nuevo archivo si es específico.
    - **Mocks de Servicios:** Añadir a `testing-helpers.ts` o crear `service-mocks.ts` si crecen demasiado.
3.  **Tipado:** Asegúrate de exportar interfaces si tus mocks tienen una estructura compleja (como `MockResource`).

## Mejores Prácticas

- **Usar `setupTestEnvironment`:** Limpia automáticamente los mocks de Vitest (`vi.clearAllMocks`) antes de cada test si se configura en el `beforeEach`.
- **Preferir Factories:** En lugar de objetos literales en los tests, usa las factories. Si cambia la interfaz del modelo, solo tendrás que actualizar la factory, no 50 archivos de test.
