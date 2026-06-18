# 🏛️ Arquitectura del Sistema

Esta guía detalla la arquitectura de alto nivel de **INTAQALAB**, un monorepo Nx basado en **Angular 21 (Zoneless)**. Las reglas aquí descritas gobiernan cómo se organizan y comunican los módulos.

## 1. Estructura del Monorepo

El monorepo está organizado en dominios estrictos (`libs/domain/`) y código transversal (`libs/shared/`).

```
nx-intaqalab/
├── apps/
│   └── intaqalab/              # Aplicación Angular principal (shell)
├── libs/
│   ├── core/                   # Interceptores HTTP, loader, auth, utilidades globales
│   ├── demos/                  # Componentes de demostración y prototipado
│   ├── pruebas/                # Librería de pruebas experimentales
│   ├── domain/                 # Lógica de negocio por dominio
│   │   ├── admin/              
│   │   ├── calendar-trials/    
│   │   ├── master-data/        # GOLDEN PATH (Implementación de referencia)
│   │   ├── trial/
│   │   │   ├── planning/       
│   │   │   └── trial-management/ 
│   │   └── wharehouse-managment/ 
│   └── shared/                 # Código compartido transversal
│       ├── config/             # Configuración de entorno y tokens
│       ├── data-access/        # Servicios HTTP compartidos
│       ├── models/             # Interfaces y modelos de dominio
│       ├── theme/              # Tema visual compartido
│       ├── ui/                 # Componentes UI reutilizables
│       └── utils/              # Utilidades, pipes y helpers de testing
├── mocks/                      # Servidor Express mock con fixtures JSON
└── scripts/                    # Scripts de utilidad
```

## 2. Reglas de Boundaries (Module Boundaries)

El sistema de tags de Nx (`scope:*`, `type:*`) previene acoplamientos indeseados. Estas reglas se validan estáticamente en el linter:

| Capa (`type:*`)                      | Puede importar de                      | No puede importar de           |
| ------------------------------------ | -------------------------------------- | ------------------------------ |
| `feature` (componentes inteligentes) | `data-access`, `ui`, `models`, `utils` | Otras features directamente    |
| `ui` (componentes presentacionales)  | `models`, `utils`                      | `data-access`, `feature`       |
| `data-access` (servicios, stores)    | `models`, `utils`, `config`            | `feature`, `ui`                |
| `util`                               | `models`                               | `feature`, `ui`, `data-access` |

## 3. Configuración Global (`app.config.ts`)

La aplicación es **standalone** y **Zoneless**:
- **Zoneless:** Detección de cambios puramente reactiva (`provideZoneChangeDetection({ eventCoalescing: true })`). No se usa `zone.js`.
- **Routing:** `provideRouter()` con `withComponentInputBinding()`. Todas las rutas usan **lazy loading** (`loadChildren()`).
- **HTTP:** Pipeline funcional con interceptores clave: `loaderInterceptor`, `centerInterceptor`, `authInterceptor`, `languageInterceptor`, `globalHttpErrorInterceptor`, `successToastInterceptor`.

## 4. Inyección de URLs Base y Entorno

Nunca se hardcodean URLs de API en los dominios. Se resuelven dinámicamente inyectando funciones de `@intaqalab/config`:
- `injectApiUrl()` → `environment.apiUrl`
- `injectApiUrlWithCenter()` → `environment.apiUrl` + cabecera de centro INTA
- `injectFireTrialsEndpoint()` → `environment.apiUrl` + `/fire-trials`

## 5. Infraestructura y Mock Server

El mock server local corre sobre **Express** (`mocks/main.ts`) respondiendo con fixtures JSON alojadas en `mocks/src/fixtures/`. Está modelado de forma idéntica a los contratos de la API real (Swagger/OpenAPI).

### Scripts Core
```bash
npm start                  # Serve de la aplicación
npm run start:dev          # Serve aplicación + mock server
npm run start:mocks        # Solo mock server
```
