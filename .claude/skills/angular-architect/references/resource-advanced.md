# Advanced resource() & httpResource Patterns

## 1. `resource.hasValue()` as Type Guard

Always check `hasValue()` before accessing `value()` to avoid undefined/null runtime issues when error states occur:

```typescript
// ❌ RISKY
const name = computed(() => this.userResource.value()?.firstName ?? '');

// ✅ CORRECT: hasValue acts as a reliable type guard
const firstName = computed(() => {
  if (this.userResource.hasValue()) {
    return this.userResource.value().firstName;
  }
  return '';
});

// In Template:
// @if (resource.hasValue()) { {{ resource.value().name }} }
// @else if (resource.isLoading()) { <ui-skeleton /> }
// @else { <error-message /> }
```

---

## 2. Parameter-Driven Automatic Refetching

Angular's `httpResource` automatically watches parameter signals inside its request computation function:

```typescript
readonly #activeId = signal<string | null>(null);

readonly userResource = httpResource<UserResponse>(() => {
  const id = this.#activeId();
  if (!id) return undefined;
  return {
    url: `/api/v1/users/${id}`,
    method: 'GET',
  };
});

// Changing parameter signal automatically triggers a fresh HTTP request:
loadUser(id: string) {
  this.#activeId.set(id);
}
```
