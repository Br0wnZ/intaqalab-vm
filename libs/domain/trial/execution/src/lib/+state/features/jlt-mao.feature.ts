import { computed, inject } from '@angular/core';
import { AngleUnitEnum } from '@intaqalab/models';
import { patchState, signalStoreFeature, withComputed, withMethods, withState } from '@ngrx/signals';

import type { ShotJltMaoRequest } from '../../execution/models/shot-jlt-mao.models';
import { ExecutionService } from '../../services/execution.service';
import type { CalibryPiquetaOption, JltMaoState, MaoTopographyState } from '../execution-state.models';

interface JltMaoSlice {
  jltMao: JltMaoState;
}

const initialState: JltMaoSlice = {
  jltMao: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    ttn: null,
    olt: null,
    piqueta: null,
    velocidadInicialTeorica: null,
    distanciaPrevistaPique: null,
    derivaTabular: null,
    tiempoVueloTeorico: null,
    diferenciaAngular: null,
    anguloTiro: null,
    graduacionEspoleta: null,
    alturaFuncionamiento: null,
    distanciaFuncionamiento: null,
    piquetaOptions: [
      { value: 'piqueta-p1', label: 'Piqueta P1 (Principal)', x: 440100, y: 4480200 },
      { value: 'piqueta-p2', label: 'Piqueta P2 (Auxiliar Norte)', x: 440250, y: 4480350 },
      { value: 'piqueta-p3', label: 'Piqueta P3 (Auxiliar Sur)', x: 439950, y: 4480050 },
    ],
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  },
};

export function withJltMao() {
  return signalStoreFeature(
    withState(initialState),
    withComputed((store, executionService = inject(ExecutionService)) => ({
      isLoadingJltMao: computed(() => executionService.shotJltMaoResource.isLoading()),
      isSavingJltMao: computed(() => executionService.updateShotJltMaoResource.isLoading()),
      jltMaoPlannedOlt: computed((): number | null => {
        const s = store.jltMao();
        if (!s.serie || !s.disparo) {
          return null;
        }
        const conditions = executionService.planningConditionsResource.value();
        if (!conditions?.series) {
          return null;
        }
        const targetSeries = conditions.series.find((serie) => serie.seriesId === s.serie);
        const targetShot = targetSeries?.shots?.find((shot) => shot.shotId === s.disparo);
        if (targetShot?.orientation === undefined || targetShot.orientation === null) {
          return null;
        }
        const unit = conditions.units?.orientation ?? AngleUnitEnum.MILS;
        if (unit === AngleUnitEnum.DEGREES) {
          return targetShot.orientation * (6400 / 360);
        }
        return targetShot.orientation;
      }),
      /**
       * Deriva de puntería = Deriva tabular (diferencia angular + marcación a la piqueta).
       * Depende de la posición de la pieza (MAO Topografía) y de las coordenadas de la piqueta seleccionada.
       */
      derivaPunteriaCalculada: computed(() => {
        const s = store.jltMao();
        const maoTopo = (store as unknown as { maoTopography: () => MaoTopographyState }).maoTopography?.() ?? {
          xPieza: null,
          yPieza: null,
        };
        const piqueta = s.piquetaOptions.find((p) => p.value === s.piqueta) ?? null;
        if (!piqueta || maoTopo.xPieza === null || maoTopo.yPieza === null || s.diferenciaAngular === null) {
          return s.olt;
        }
        const bearingRad = Math.atan2(piqueta.y - maoTopo.yPieza, piqueta.x - maoTopo.xPieza);
        const bearingMils = bearingRad * (3200 / Math.PI);
        return s.diferenciaAngular + bearingMils;
      }),
    })),
    withMethods((store, executionService = inject(ExecutionService)) => ({
      async loadShotJltMao(fireTrialId: string, seriesId: string, shotId: string): Promise<void> {
        try {
          const response = await executionService.fetchShotJltMao(fireTrialId, seriesId, shotId);
          if (response?.jltMaoData) {
            const data = response.jltMaoData;
            patchState(store, (state) => ({
              jltMao: {
                ...state.jltMao,
                ttn: data.numericFiringTable ?? state.jltMao.ttn,
                olt: data.lineOfFireOrientation ?? state.jltMao.olt,
                piqueta: data.stakeId ?? state.jltMao.piqueta,
                velocidadInicialTeorica: data.theoreticalInitialVelocity ?? state.jltMao.velocidadInicialTeorica,
                distanciaPrevistaPique: data.plannedImpactDistance ?? state.jltMao.distanciaPrevistaPique,
                derivaTabular: data.tabularDrift ?? state.jltMao.derivaTabular,
                tiempoVueloTeorico: data.theoreticalFlightTime ?? state.jltMao.tiempoVueloTeorico,
                diferenciaAngular: data.angularDifference ?? state.jltMao.diferenciaAngular,
                anguloTiro: data.shootingAngle ?? state.jltMao.anguloTiro,
                graduacionEspoleta: data.fuseGraduation ?? state.jltMao.graduacionEspoleta,
                alturaFuncionamiento: data.functioningHeight ?? state.jltMao.alturaFuncionamiento,
                distanciaFuncionamiento: data.functioningDistance ?? state.jltMao.distanciaFuncionamiento,
              },
            }));
          }
        } catch (e) {
          console.error('Error loading JltMao', e);
        }
      },
      async saveShotJltMao(
        fireTrialId: string,
        seriesId: string,
        shotId: string,
        requestBody: ShotJltMaoRequest,
      ): Promise<void> {
        await executionService.updateShotJltMao(fireTrialId, seriesId, shotId, requestBody);
      },
      /** Actualiza los campos del widget JLT MAO */
      updateJltMao(updates: Partial<JltMaoState>): void {
        patchState(store, (state) => ({
          jltMao: { ...state.jltMao, ...updates },
        }));
      },

      /** Reemplaza la lista de piquetas (cuando se integre con la API de Calibry) */
      setJltMaoPiquetaOptions(options: CalibryPiquetaOption[]): void {
        patchState(store, (state) => ({
          jltMao: { ...state.jltMao, piquetaOptions: options },
        }));
      },
    })),
  );
}
