# Safe Effects — explicitEffect, effect(), untracked(), afterRenderEffect

> [!IMPORTANT]
> In this project, it is **mandatory** to prioritize `explicitEffect` from `@intaqalab/utils` over native `effect()` when precise control over dependency triggers is required, preventing unintended reactive tracking.

---

## 1. Read Signals BEFORE `await` in Async Effects

Reactive context is lost after any `await`. Signals evaluated after `await` are NOT registered as dependencies.

```typescript
// ❌ DANGEROUS — theme() is not tracked; effect will not re-run when theme changes
effect(async () => {
  const data = await fetchUserData(); // reactive tracking lost
  console.log(`User: ${data.name}, Theme: ${this.theme()}`);
});

// ✅ CORRECT — read signals synchronously before await
effect(async () => {
  const currentTheme = this.theme(); // ✅ Tracked
  const userId = this.userId(); // ✅ Tracked
  const data = await fetchUserData(userId);
  console.log(`User: ${data.name}, Theme: ${currentTheme}`);
});
```

---

## 2. Using `untracked()` for Non-Reactive Reads

When reading a signal value inside an effect without wanting that signal to re-trigger the effect:

```typescript
import { effect, untracked } from '@angular/core';

effect(() => {
  const currentId = this.selectedId(); // ✅ Tracked trigger
  const user = untracked(() => this.currentUser()); // Read without tracking
  this.analytics.track('selection_change', { id: currentId, user });
});
```

---

## 3. DOM Operations via `afterRenderEffect`

Never manipulate the DOM directly inside standard `effect()`. Use `afterRenderEffect`:

```typescript
import { afterRenderEffect, ElementRef, viewChild } from '@angular/core';

readonly canvasRef = viewChild<ElementRef<HTMLCanvasElement>>('chartCanvas');

constructor() {
  afterRenderEffect(() => {
    const canvas = this.canvasRef()?.nativeElement;
    if (canvas) {
      this.renderChart(canvas);
    }
  });
}
```
