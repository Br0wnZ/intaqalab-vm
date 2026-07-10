---
name: angular-signals-refactor-prompt
description: 'Prompt ligero para refactorizar a Angular 22 (Zoneless, Signals-first). Reemplaza al auditor pesado.'
---

Refactoriza este componente Angular a Angular 22 Signals-first.

REGLAS ESTRICTAS:

1. Elimina RxJS de UI state (cambia .subscribe() a firstValueFrom o toSignal).
2. Usa Signal Forms estables (`form()`), elimina `ReactiveFormsModule`, y asegura la sintaxis `{ when: () => condición }` para campos deshabilitados/readonly/ocultos.
3. Usa `linkedSignal` si el estado depende de inputs u otros signals pero es mutable.
4. Usa `httpResource` estable para fetching, eliminando Observables asíncronos.
5. Usa el decorador `@Service()` para servicios singleton en lugar de `@Injectable({ providedIn: 'root' })`.
6. Usa Signal Queries (`viewChild`, `viewChildren`, `contentChild`, `contentChildren`) en lugar de decoradores legacy (`@ViewChild`, etc.).
7. Omite `changeDetection: ChangeDetectionStrategy.OnPush` en componentes nuevos ya que es el comportamiento por defecto.
8. No uses ChangeDetectorRef ni NgZone (Zoneless).
9. Mantén la lógica exacta, solo migra sintaxis. Muestra solo el código final.
