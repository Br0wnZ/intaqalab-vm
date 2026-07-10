---
name: swagger-api-mock-prompt
description: 'Prompt ligero para generar Mocks, Modelos y Servicios httpResource desde un JSON de Swagger.'
---

Implementa este endpoint a partir del JSON/Swagger proporcionado.

SALIDA ESPERADA:

1. TypeScript Models (interfaces exactas).
2. Angular Data-Access Service usando `httpResource` (no Observables).
3. ExpressJS Route mockeado + Fixtures (JSON realista).
   Genera directamente el código de las tres partes, sin teoría ni adornos.
