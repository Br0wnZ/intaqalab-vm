# 03 — Bidirectional Mapper (`<widget>.mapper.ts`)

Guía para estructurar mappers bidireccionales (`mapRemoteToState` y `mapStateToRequest`) respetando la resolución de IDs numéricos de Calibry y el tipado estricto (cero `any`).

---

## 1. Reglas de Arquitectura

- **Fichero dedicado obligatorio:** `<widget-name>.mapper.ts` en la carpeta del widget junto a `<widget-name>.mapper.spec.ts`. NUNCA incluir funciones pesadas de transformación en el componente.
- **Tipado estricto (Zero any):** Uso exhaustivo de TypeScript interfaces y enums de dominio (`DistanceUnitEnum`, `TimeUnitEnum`, `WeightUnitEnum`).
- **Resolución de IDs Calibry (Número ↔ String UI):**
  - `GET response` (número backend: ej. `21031`) → valor selector UI (`'bal-01'`).
  - `PUT request` (`'bal-01'`) → ID numérico (`21031`).

```typescript
function resolveBalanzaValue(balanceId: number | string | null | undefined): string | null {
  if (balanceId === null || balanceId === undefined) return null;
  const str = String(balanceId);
  if (str === '21031' || str === 'bal-01') return 'bal-01';
  if (str === '21032' || str === 'bal-02') return 'bal-02';
  return str;
}

function resolveCamaraValue(id: number | string | null | undefined): string | null {
  if (id === null || id === undefined) return null;
  const str = String(id);
  if (str === '21045' || str === 'camara-01') return 'camara-01';
  if (str === '21046' || str === 'camara-02') return 'camara-02';
  if (str === 'sala-01') return 'sala-01';
  return str;
}
```

---

## 2. `mapRemoteToState` (GET response → Estado de Tabs)

```typescript
export function mapRemoteTo<Widget>State(
  response: <Resource>Response | null | undefined,
  fallbackComponentId?: string | null,
): {
  identificacion: Partial<<Widget>IdentificationState>;
  pesos: Partial<<Widget>PesosState>;
  acondicionamiento: Partial<<Widget>AcondicionamientoState>;
} {
  const components = response?.munitionData ?? [];
  if (components.length === 0) {
    return { identificacion: {}, pesos: {}, acondicionamiento: {} };
  }

  const target =
    (fallbackComponentId
      ? components.find((c) => c.componentId === fallbackComponentId)
      : null) ?? components[0];

  const ident = target.identificationData;
  const weights = target.weightData;
  const cond = target.conditioningData;

  return {
    identificacion: {
      componente: target.componentId,
      denominacion: ident?.denominationId ?? null,
      lote: ident?.batch ?? null,
      numeroCliente: ident?.clientNumber ?? null,
      modoFuncionamiento: ident?.fuseWorkingModeId ?? null,
      graduacionEspoleta: ident?.fuseGraduation ?? null,
      observaciones: ident?.observations ?? null,
    },
    pesos: {
      componente: target.componentId,
      balanza: resolveBalanzaValue(weights?.balanceId),
      peso: weights?.weight ?? null,
      pesoAnadido: weights?.weightAdded ?? null,
      pesoRetirado: weights?.weightRemoved ?? null,
      fechaHora: weights?.weighingDateTime ?? null,
      rangoPesada: weights?.weighingRange ?? null,
      observaciones: weights?.observations ?? null,
    },
    acondicionamiento: {
      camara: resolveCamaraValue(cond?.climaticChamberId),
      componente: target.componentId,
      // REGLA: truncar ISO 8601 a 16 chars (YYYY-MM-DDTHH:mm) para datetime-local
      fechaHoraEntrada: cond?.chamberEntryDateTime
        ? cond.chamberEntryDateTime.substring(0, 16)
        : null,
      fechaHoraSalida: cond?.chamberExitDateTime
        ? cond.chamberExitDateTime.substring(0, 16)
        : null,
      temperatura: cond?.temperature ?? null,
      temperaturaCorregida: cond?.programmedTemperature ?? null,
      observaciones: cond?.observations ?? null,
    },
  };
}
```

---

## 3. `mapStateToRequest` (Estado de Tabs → PUT body)

```typescript
export function map<Widget>StateToRequest(params: {
  componentId: string;
  identificacion: Partial<<Widget>IdentificationState>;
  pesos: Partial<<Widget>PesosState>;
  acondicionamiento: Partial<<Widget>AcondicionamientoState>;
  existingComponents?: <Resource>ComponentRequest[];
}): <Resource>Request {
  const { componentId, identificacion, pesos, acondicionamiento, existingComponents = [] } = params;

  let balanceId: number | null = null;
  if (pesos.balanza === 'bal-01') balanceId = 21031;
  else if (pesos.balanza === 'bal-02') balanceId = 21032;
  else if (pesos.balanza) balanceId = Number(pesos.balanza) || null;

  let climaticChamberId: number | null = null;
  if (acondicionamiento.camara === 'camara-01') climaticChamberId = 21045;
  else if (acondicionamiento.camara === 'camara-02') climaticChamberId = 21046;
  else if (acondicionamiento.camara) climaticChamberId = Number(acondicionamiento.camara) || null;

  const currentComponent: <Resource>ComponentRequest = {
    componentId,
    identificationData: {
      denominationId: identificacion.denominacion ?? null,
      batch: identificacion.lote ?? null,
      clientNumber: identificacion.numeroCliente ?? null,
      fuseWorkingModeId: identificacion.modoFuncionamiento ?? null,
      fuseGraduation: identificacion.graduacionEspoleta ?? null,
      fuseGraduationUnit: 'S' as TimeUnitEnum,
      observations: identificacion.observaciones ?? null,
    },
    weightData: {
      balanceId,
      weight: pesos.peso ?? null,
      weightUnit: 'G' as WeightUnitEnum,
      weightAdded: pesos.pesoAnadido ?? null,
      weightAddedUnit: 'G' as WeightUnitEnum,
      weightRemoved: pesos.pesoRetirado ?? null,
      weightRemovedUnit: 'G' as WeightUnitEnum,
      weighingDateTime: pesos.fechaHora ?? null,
      observations: pesos.observations ?? null,
    },
    conditioningData: {
      climaticChamberId,
      chamberEntryDateTime: acondicionamiento.fechaHoraEntrada ?? null,
      chamberExitDateTime: acondicionamiento.fechaHoraSalida ?? null,
      observations: acondicionamiento.observaciones ?? null,
    },
  };

  const otherComponents = existingComponents.filter((c) => c.componentId !== componentId);
  return { components: [currentComponent, ...otherComponents] };
}
```
