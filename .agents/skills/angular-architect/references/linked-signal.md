# linkedSignal — Derived Writable State

## When to use it?

`linkedSignal` is for state that **depends on another signal but can also be modified** locally.
It replaces brittle `signal + effect` or `signal + computed` workarounds when writable synchronization is required.

### Quick Decision Matrix

- Can the state be edited locally AND reset when a source signal changes? → `linkedSignal`
- Is the state purely read-only derived? → `computed`
- Is the state fully independent? → `signal`

---

## Pattern 1: Automatic Reset (Shorthand)

When changing the source (e.g. options list), reset selection to the first element:

```typescript
// ❌ ANTI-PATTERN (signal + effect)
readonly options = signal<Option[]>([]);
readonly selectedOption = signal<Option | null>(null);

constructor() {
  effect(() => {
    this.selectedOption.set(this.options()[0]);
  });
}

// ✅ CORRECT with linkedSignal
import { linkedSignal } from '@angular/core';

readonly options = signal<Option[]>([]);
readonly selectedOption = linkedSignal(() => this.options()[0]);
// Automatically resets when options change, but remains writable:
selectedOption.set(someOtherOption); // ✅ writable
```

---

## Pattern 2: Preserving Selection if Still Valid

When the list updates, preserve the active selection if it exists in the new list:

```typescript
import { linkedSignal } from '@angular/core';

interface Item { id: number; name: string; }

readonly items = signal<Item[]>([]);
readonly selectedItem = linkedSignal<Item[], Item | null>({
  source: this.items,
  computation: (newItems, previous) => {
    const currentId = previous?.value?.id;
    return newItems.find(item => item.id === currentId) ?? newItems[0] ?? null;
  }
});
```

---

## Pattern 3: Edit Form Resetting on Entity Change

When loading an entity to edit, make the draft form automatically track entity updates:

```typescript
import { linkedSignal } from '@angular/core';

readonly selectedEntity = signal<Entity | null>(null);

// In component:
readonly editModel = linkedSignal<Entity | null, Partial<Entity>>({
  source: this.store.selectedEntity,
  computation: (entity) => ({ ...entity })
});

saveChanges() {
  this.store.update(this.editModel());
}
```

---

## Pattern 4: Custom Equality to Prevent Redundant Emits

```typescript
import { linkedSignal } from '@angular/core';

readonly activeUser = signal<User>({ id: 1, name: 'Ana', role: 'admin' });
readonly editCopy = linkedSignal(
  () => ({ ...this.activeUser() }),
  { equal: (a, b) => a.id === b.id }
);
```
