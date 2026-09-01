# RxJS → Signals Migration

## Philosophy

In this project, RxJS is permitted ONLY for:

1. Interoperability with third-party libraries (Angular Material dialogs, OIDC, etc.)
2. Complex stream operators when no project reactive utility exists
3. Wrapped in `toSignal()` or consumed with `firstValueFrom()`

**STRICTLY PROHIBITED:** Uncontrolled `.subscribe()` in components.

---

## Pattern 1: Dialogs — `.subscribe()` → `firstValueFrom()`

The most frequent pattern across the project: `dialogRef.afterClosed().subscribe(...)`.

```typescript
import { firstValueFrom } from 'rxjs';

// ❌ ANTI-PATTERN
openDialog() {
  const dialogRef = this.dialog.open(MyDialogComponent, { data });
  dialogRef.afterClosed().subscribe((result) => {
    if (result) {
      this.store.save(result);
    }
  });
}

// ✅ CORRECT: async/await with firstValueFrom
async openDialog(): Promise<void> {
  const dialogRef = this.dialog.open(MyDialogComponent, { data });
  const result = await firstValueFrom(dialogRef.afterClosed());
  if (result) {
    this.store.save(result);
  }
}
```

---

## Pattern 2: Component State Streams → Signals

```typescript
// ❌ ANTI-PATTERN: BehaviorSubject + async pipe
readonly data$ = new BehaviorSubject<Data[]>([]);
readonly loading$ = new BehaviorSubject<boolean>(false);

// ✅ CORRECT: Signals
readonly data = signal<Data[]>([]);
readonly loading = signal<boolean>(false);
```

---

## Pattern 3: Derived Observable Combines → `computed()`

```typescript
// ❌ ANTI-PATTERN: combineLatest + map
readonly total$ = combineLatest([this.items$, this.tax$]).pipe(
  map(([items, tax]) => calculateTotal(items, tax))
);

// ✅ CORRECT: computed
readonly total = computed(() => calculateTotal(this.items(), this.tax()));
```
