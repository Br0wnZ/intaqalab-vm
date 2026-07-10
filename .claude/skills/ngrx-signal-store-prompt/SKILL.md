---
name: ngrx-signal-store-prompt
description: 'Prompt ligero para crear tiendas locales con NgRx SignalStore. Reemplaza al signalstore-engineer pesado.'
---

Crea un NgRx SignalStore para esta entidad.

REGLAS ESTRICTAS:

1. Usa `signalStore` de `@ngrx/signals`.
2. Usa `withEntities` si es una colección.
3. Usa `withState`, `withComputed` y `withMethods`.
4. El data fetching en methods debe usar el Signal Trigger Pattern o asíncronía limpia (nunca .subscribe()).
5. Expón readonly signals. Devuelve solo el código.
