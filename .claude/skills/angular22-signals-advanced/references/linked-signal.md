# linkedSignal — Estado Derivado Writable

## ¿Cuándo usarlo?

`linkedSignal` es para estado que **depende de otra señal pero también puede ser modificado** por el usuario.
Es la alternativa a los patrones `signal + effect` o `signal + computed` cuando necesitas estado writable sincronizado.

### Regla rápida

- ¿El estado puede ser editado por el usuario Y también se resetea cuando cambia otra señal? → `linkedSignal`
- ¿El estado solo se lee nunca se escribe? → `computed`
- ¿El estado es independiente? → `signal`

---

## Patrón 1: Reset automático (shorthand)

Cuando cambias la fuente (ej: lista de opciones), la selección vuelve al primer elemento.

```typescript
// ❌ ANTI-PATRÓN actual (signal + effect)
readonly options = signal<Option[]>([]);
readonly selectedOption = signal<Option | null>(null);

constructor() {
  effect(() => {
    // Peligroso: side-effect en effect, crea dependencia frágil
    this.selectedOption.set(this.options()[0]);
  });
}

// ✅ CORRECTO con linkedSignal
import { linkedSignal } from '@angular/core';

readonly options = signal<Option[]>([]);
readonly selectedOption = linkedSignal(() => this.options()[0]);
// selectedOption se resetea automáticamente cuando options cambia
// pero también puede ser modificado con .set()
selectedOption.set(someOtherOption); // ✅ writable
```

---

## Patrón 2: Preservar selección si sigue siendo válida

Cuando la lista cambia, preservar la selección actual si todavía existe.

```typescript
import { linkedSignal } from '@angular/core';

interface Item { id: number; name: string; }

readonly items = signal<Item[]>([]);
readonly selectedItem = linkedSignal<Item[], Item | null>({
  source: this.items,
  computation: (newItems, previous) => {
    // Si el item seleccionado sigue en la nueva lista, mantenerlo
    const currentId = previous?.value?.id;
    return newItems.find(item => item.id === currentId) ?? newItems[0] ?? null;
  }
});
```

---

## Patrón 3: Formulario de edición que se resetea con la entidad

Cuando cargas una entidad para editar y quieres que el formulario refleje la nueva entidad automáticamente.

```typescript
import { linkedSignal } from '@angular/core';

// En el store
readonly selectedEntity = signal<Entity | null>(null);

// En el componente
readonly editModel = linkedSignal<Entity | null, Partial<Entity>>({
  source: this.store.selectedEntity,
  computation: (entity) => ({ ...entity }) // copia para edición
});

saveChanges() {
  this.store.update(this.editModel());
  // No es necesario resetear manualmente — se resetea cuando selectedEntity cambia
}
```

---

## Patrón 4: Custom equality para evitar re-renders innecesarios

```typescript
import { linkedSignal } from '@angular/core';
import { isEqual } from 'lodash-es';

readonly activeUser = signal<User>({ id: 1, name: 'Ana', role: 'admin' });
readonly editCopy = linkedSignal(
  () => ({ ...this.activeUser() }),
  { equal: (a, b) => a.id === b.id } // Solo marca dirty si cambia el ID
);
```

---

## Dónde aplicar en este proyecto

### Casos identificados en el código actual:

**`munitions-shell.component.ts`** — El `selectedMunition` signal que se resetea cuando cambia `munitionComponentTypeOptions`:

```typescript
// ❌ Actual (probablemente usa effect o signal manual)
// ✅ Migrar a:
readonly selectedMunition = linkedSignal(() => this.munitionComponentTypeOptions()[0] ?? null);
```

**Stores con selectedItem** — Cualquier store que tenga `selectedId` y una lista de items:

```typescript
// En el store
readonly selectedItem = linkedSignal<Item[], Item | null>({
  source: this.items,
  computation: (items, previous) =>
    items.find(i => i.id === previous?.value?.id) ?? items[0] ?? null
});
```

---

## Importaciones

```typescript
import { linkedSignal } from '@angular/core';
```

No requiere ninguna dependencia adicional — es parte del núcleo de Angular 22.
