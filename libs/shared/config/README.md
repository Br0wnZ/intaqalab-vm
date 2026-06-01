# @intaqalab/config

**Sistema de Configuración Optimizado para Angular 21 + Nx**

Librería moderna que elimina el boilerplate de inyección manual mediante funciones de utilidad basadas en `inject()`.

---

## 🚀 Quick Start

### Uso Básico (Patrón Recomendado)

```typescript
import { Injectable } from '@angular/core';
import { injectApiUrl } from '@intaqalab/config';

@Injectable({ providedIn: 'root' })
export class MyService {
  // ✅ Una línea: limpio, claro y type-safe
  readonly apiUrl = injectApiUrl('/my-endpoint');
}
```

### Testing Simplificado

```typescript
import { provideConfigForTesting } from '@intaqalab/config';

TestBed.configureTestingModule({
  providers: [provideConfigForTesting()],
});
```

---

## 📦 API Principal

| Función                     | Uso                            | Cuándo Usar                                |
| --------------------------- | ------------------------------ | ------------------------------------------ |
| `injectApiUrl(path)`        | Construir URLs de API          | ⭐ **90% de casos** - Servicios de datos   |
| `injectConfig()`            | Acceso completo a config       | Múltiples propiedades o lógica condicional |
| `configSignal()`            | Signal reactivo completo       | Componentes reactivos con Signals          |
| `configProperty(key)`       | Signal de propiedad específica | Una propiedad reactiva con type safety     |
| `provideConfigForTesting()` | Testing helper                 | En todos tus tests                         |

---

## 💡 Ejemplos

### Servicio de Datos

```typescript
@Injectable({ providedIn: 'root' })
export class TrialsService {
  readonly #url = injectApiUrl('/fire-trials');

  getTrials() {
    return this.http.get<Trial[]>(this.#url);
  }
}
```

### Componente Reactivo

```typescript
@Component({
  /* ... */
})
export class ConfigComponent {
  readonly config = configSignal();
  readonly apiUrl = computed(() => this.config().apiUrl);
}
```

### Interceptor

```typescript
export const myInterceptor: HttpInterceptorFn = (req, next) => {
  const config = injectConfig();
  // ... lógica con config
  return next(req);
};
```

---

## 📚 Documentación Completa

- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - Diseño y arquitectura del sistema (5000+ palabras)
- **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** - Guía de migración paso a paso (3000+ palabras)
- **[EXAMPLES.ts](./EXAMPLES.ts)** - 10+ ejemplos prácticos comentados (400+ líneas)

---

## ✅ Características

- ✅ **75% menos código** que el patrón tradicional
- ✅ **Type Safety completo** con TypeScript
- ✅ **Tree Shakeable** - elimina código no usado
- ✅ **Angular 21 First** - aprovecha inject() y Signals
- ✅ **Testing Friendly** - helper dedicado para tests
- ✅ **Zero Breaking Changes** - compatible con código existente

---

## 📊 Comparativa

### ❌ Antes (Patrón Antiguo)

```typescript
import { inject } from '@angular/core';
import { CONFIG } from '@intaqalab/config';

@Injectable({ providedIn: 'root' })
export class MyService {
  private config = inject(CONFIG); // Boilerplate
  readonly url = `${this.config.apiUrl}/endpoint`; // Manual
}
```

**4 líneas, 2-3 imports, concatenación manual**

### ✅ Después (Patrón Nuevo)

```typescript
import { injectApiUrl } from '@intaqalab/config';

@Injectable({ providedIn: 'root' })
export class MyService {
  readonly url = injectApiUrl('/endpoint'); // Directo
}
```

**1 línea, 1 import, automático** → **75% menos código**

---

## 🎓 Migración

### Paso 1: Identificar Patrón Antiguo

```typescript
private config = inject(CONFIG);
readonly url = `${this.config.apiUrl}/endpoint`;
```

### Paso 2: Reemplazar con Utility

```typescript
readonly url = injectApiUrl('/endpoint');
```

### Paso 3: Actualizar Tests

```typescript
// De:
{ provide: CONFIG, useValue: { apiUrl: '' } }
// A:
provideConfigForTesting()
```

Ver **[MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)** para detalles completos.

---

## 🧪 Testing

```typescript
describe('MyService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // ✅ Configuración por defecto
        provideConfigForTesting(),
      ],
    });
  });

  it('should work', () => {
    expect(TestBed.inject(MyService)).toBeTruthy();
  });
});

describe('MyService with custom config', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        // ✅ Overrides type-safe
        provideConfigForTesting({
          apiUrl: 'http://test-api.com',
        }),
      ],
    });
  });

  it('should use custom config', () => {
    const service = TestBed.inject(MyService);
    expect(service.url).toContain('test-api.com');
  });
});
```

---

## 🏗️ Arquitectura

```
Application Bootstrap
  └─> Angular DI Container
       └─> CONFIG Token (InjectionToken<Config>)
            └─> Utility Functions
                 ├─ injectConfig() ⭐
                 ├─ injectApiUrl() ⭐⭐⭐
                 ├─ configSignal()
                 └─ configProperty()
```

Ver **[ARCHITECTURE.md](./ARCHITECTURE.md)** para arquitectura completa.

---

## 📝 Interfaz Config

```typescript
interface Config {
  production: boolean;
  apiUrl: string;
  enableTablNavigation: boolean;
}
```

---

## 🔗 Exports

### Core

```typescript
export { Config, CONFIG } from './lib/config/config';
export { injectConfig, injectApiUrl, configSignal, configProperty } from './lib/config/config';
```

### Testing

```typescript
export { provideConfigForTesting, DEFAULT_TEST_CONFIG } from './lib/config/config.testing';
```

---

## 🎯 Casos de Uso

| Escenario              | Función Recomendada | Ejemplo                           |
| ---------------------- | ------------------- | --------------------------------- |
| Servicio de datos      | `injectApiUrl()`    | `injectApiUrl('/users')`          |
| Múltiples propiedades  | `injectConfig()`    | `injectConfig().production`       |
| UI reactiva            | `configSignal()`    | `computed(() => config().apiUrl)` |
| Una propiedad reactiva | `configProperty()`  | `configProperty('apiUrl')`        |
| Interceptor            | `injectConfig()`    | `const cfg = injectConfig()`      |
| Guard                  | `injectConfig()`    | `if (!injectConfig().production)` |

---

## 💻 Desarrollo

### Running unit tests

```bash
nx test config
```

### Running lint

```bash
nx lint config
```

### Build

```bash
nx build config
```

---

## 📦 Estructura del Proyecto

```
libs/shared/config/
├── src/
│   ├── index.ts                    # Public API
│   └── lib/
│       └── config/
│           ├── config.ts           # Core utilities
│           └── config.testing.ts   # Testing helpers
├── ARCHITECTURE.md                 # Arquitectura completa
├── MIGRATION_GUIDE.md             # Guía de migración
├── EXAMPLES.ts                    # Ejemplos prácticos
└── README.md                      # Este archivo
```

---

## ✨ Beneficios Clave

1. **Menos Boilerplate** - 75% menos código
2. **Type Safety** - Tipado estricto garantizado
3. **Ergonomía** - API intuitiva y expresiva
4. **Testing** - Helper dedicado simplifica tests
5. **Moderno** - Aprovecha Angular 21 features
6. **Compatible** - No breaking changes
7. **Documentado** - 8000+ palabras de docs
8. **Tree Shakeable** - Optimización automática

---

## 🆘 Ayuda

- **Documentación:** Ver [ARCHITECTURE.md](./ARCHITECTURE.md) y [MIGRATION_GUIDE.md](./MIGRATION_GUIDE.md)
- **Ejemplos:** Ver [EXAMPLES.ts](./EXAMPLES.ts)
- **Código Fuente:** Ver [config.ts](./src/lib/config/config.ts)

---

## 📄 License

Este proyecto es parte del monorepo **@intaqalab**.

---

**Versión:** 2.0.0  
**Última Actualización:** Enero 2026  
**Estado:** ✅ Producción Ready
