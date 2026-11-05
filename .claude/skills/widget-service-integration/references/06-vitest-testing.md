# 06 — Vitest Testing Harness (`<widget>.spec.ts`)

Guía para construir suites de tests unitarios e integrados con Vitest + Angular Testing Library (ATL) para widgets de ejecución, garantizando cero `any` y cero `!`.

---

## 1. Setup y Providers de Prueba

```typescript
import { TestBed } from '@angular/core/testing';
import { render } from '@testing-library/angular';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TranslateModule } from '@ngx-translate/core';
import { provideTestingEnvironment } from '@intaqalab/utils/testing';

const mockWidgetStateService = {
  updateWidgetFormState: () => { /* noop */ },
  registerWidgetInstance: () => { /* noop */ },
  unregisterWidgetInstance: () => { /* noop */ },
  addWidget: () => { /* noop */ },
  placedWidgets: () => [],
};

describe('<Widget>', () => {
  const renderWidget = (widgetId = 'test-widget', customProviders: Provider[] = []) =>
    render(<Widget>, {
      inputs: { widgetId },
      providers: [
        provideNoopAnimations(),
        provideTestingEnvironment(),
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: WidgetStateService, useValue: mockWidgetStateService },
        ExecutionStore,
        ExecutionService,
        { provide: TrialsDataService, useClass: MockTrialsDataService },
        ...customProviders,
      ],
      imports: [TranslateModule.forRoot()],
    });

  it('renders without errors', async () => {
    await renderWidget();
    expect(document.querySelector('h3')).toBeTruthy();
  });

  it('formState starts clean (not dirty)', async () => {
    const { fixture } = await renderWidget();
    expect(fixture.componentInstance.formState().dirty).toBe(false);
    expect(fixture.componentInstance.formState().widgetId).toBe('test-widget');
  });

  it('saveForm calls ExecutionService with correct params', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    const updateSpy = vi.spyOn(execService, 'update<Resource>').mockResolvedValue(mockResponse);

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'disparo-1' });

    await fixture.componentInstance.saveForm();

    expect(updateSpy).toHaveBeenCalledWith('trial-123', 'serie-1', 'disparo-1', expect.any(Object));
  });

  it('saveForm handles network errors gracefully', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'update<Resource>').mockRejectedValue(new Error('Network error'));

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'disparo-1' });

    await expect(fixture.componentInstance.saveForm()).rejects.toThrow('Network error');
  });

  it('fetches data on disparo change and applies to tabs and store', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'fetch<Resource>').mockResolvedValue(mockResponse);

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance.onSerieSelected('serie-1');
    fixture.componentInstance.onDisparoSelected('disparo-1');

    await vi.waitFor(() => {
      expect(execService.fetch<Resource>).toHaveBeenCalledWith('trial-123', 'serie-1', 'disparo-1');
    });

    expect(TestBed.inject(ExecutionStore).<widgetCamelName>().identificacion.componente).toBe('granada-01');
  });

  it('saveForm delegates save() to child tabs after successful PUT', async () => {
    const { fixture } = await renderWidget();
    const execService = TestBed.inject(ExecutionService);
    vi.spyOn(execService, 'update<Resource>').mockResolvedValue(mockResponse);

    const identTab = fixture.componentInstance.identTab();
    const pesosTab = fixture.componentInstance.pesosTab();
    const acondTab = fixture.componentInstance.acondTab();
    if (!identTab || !pesosTab || !acondTab) throw new Error('Tabs must be defined');

    const identSpy = vi.spyOn(identTab, 'save');
    const pesosSpy = vi.spyOn(pesosTab, 'save');
    const acondSpy = vi.spyOn(acondTab, 'save');

    TestBed.inject(ExecutionStore).setFireTrialId('trial-123');
    fixture.componentInstance['selectorFormModel'].set({ serie: 'serie-1', disparo: 'disparo-1' });
    await fixture.componentInstance.saveForm();

    expect(identSpy).toHaveBeenCalled();
    expect(pesosSpy).toHaveBeenCalled();
    expect(acondSpy).toHaveBeenCalled();
  });

  it('resetForm delegates reset() to child tabs', async () => {
    const { fixture } = await renderWidget();
    const identTab = fixture.componentInstance.identTab();
    if (!identTab) throw new Error('IdentTab must be defined');

    const identSpy = vi.spyOn(identTab, 'reset');
    fixture.componentInstance.resetForm();
    expect(identSpy).toHaveBeenCalled();
  });
});
```

---

## 2. Comandos de Verificación

```bash
# Widget específico
npx vitest run src/lib/execution/widgets/<widget-name>/

# Suite completa del dominio
npx nx test execution

# TypeScript check
cd libs/domain/trial/execution && npx tsc --noEmit
```
