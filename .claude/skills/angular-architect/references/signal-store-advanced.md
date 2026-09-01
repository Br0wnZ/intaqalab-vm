# Advanced SignalStore Patterns

## Additional Patterns for the Intaqalab SignalStore Architecture

The project builds upon `@ngrx/signals` with `withState`, `withComputed`, `withMethods`, and `withHooks`. Below are advanced patterns for scalability.

---

## 1. Private Store Members & Encapsulation

```typescript
import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';

export const MyStore = signalStore(
  withState({
    items: [] as Item[],
    isLoading: false,
    totalElements: 0,
  }),
  withComputed(({ items, totalElements }) => ({
    isEmpty: computed(() => items().length === 0),
    hasMore: computed(() => items().length < totalElements()),
  })),
  withMethods((store, service = inject(MyService)) => ({
    async loadPage(page: number, size = 10): Promise<void> {
      patchState(store, { isLoading: true });
      service.setParams({ page, size });
    },
  })),
);
```

---

## 2. Entity Management with `withEntities`

For collections of domain entities with unique identifiers (`id`):

```typescript
import { signalStore, type, withComputed, withMethods } from '@ngrx/signals';
import { setAllEntities, withEntities } from '@ngrx/signals/entities';

export const UserListStore = signalStore(
  withEntities({ entity: type<User>(), collection: 'user' }),
  withMethods((store) => ({
    setUsers(users: User[]): void {
      patchState(store, setAllEntities(users, { collection: 'user' }));
    },
  })),
);
```
