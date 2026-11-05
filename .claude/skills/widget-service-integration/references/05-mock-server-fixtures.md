# 05 — Mock Server Fixtures and Routes

Guía para definir fixtures JSON coherentes con el feature store y rutas Express en el servidor mock (`mocks/src/`).

---

## 1. Fixture JSON Coherente con el Store

Los IDs del fixture deben coincidir exactamente con los selectores y catálogos iniciales del store:

- `componentId` debe existir en `componenteOptions`.
- `denominationId` debe pertenecer a `denominacionOptions` con el `componenteId` adecuado.
- `batch` debe existir en `loteOptions` asociado al `denominacionId`.
- IDs de Calibry: `balanceId: 21031` (`bal-01`), `climaticChamberId: 21045` (`camara-01`).

```json
{
  "munitionData": [
    {
      "componentId": "granada-01",
      "identificationData": {
        "denominationId": "den-01",
        "batch": "lote-01",
        "clientNumber": null,
        "fuseWorkingModeId": null,
        "fuseGraduation": null,
        "observations": null
      },
      "weightData": {
        "balanceId": 21031,
        "weight": 44.5,
        "weightAdded": 0.0,
        "weightRemoved": 0.0,
        "weighingDateTime": "2026-01-10T09:30:00Z",
        "weighingRange": "0-500",
        "observations": null
      },
      "conditioningData": {
        "climaticChamberId": 21045,
        "chamberEntryDateTime": "2026-01-10T08:00:00Z",
        "chamberExitDateTime": "2026-01-10T10:00:00Z",
        "temperature": 20,
        "programmedTemperature": 21,
        "observations": null
      }
    }
  ]
}
```

---

## 2. Mock Express y Store de Simulación

En `mocks/src/fixtures/execution/execution-store.ts`:

```typescript
set<Resource>(fireTrialId: string, seriesId: string, shotId: string, body: <Resource>Request) {
  const trial = this.trials.find((t) => t.id === fireTrialId);
  if (!trial) throw new HttpError(404, `FireTrial ${fireTrialId} not found`);

  // IMPORTANTE: aceptar PENDING, ACTIVE y FIRED (no solo ACTIVE)
  const shot = this.#findShot(seriesId, shotId);
  const editableStatuses = ['PENDING', 'ACTIVE', 'FIRED'];
  if (shot && !editableStatuses.includes(shot.status)) {
    throw new HttpError(422, `Shot ${shotId} not editable (status: ${shot.status})`);
  }

  return { munitionData: body.components };
}
```
