import { Router } from 'express';

import {
  getEquipmentSelectorState,
  updateEquipmentSelectorState,
} from '../fixtures/execution/equipment-selector-store';
import {
  applyArmamentBulkConfiguration,
  approvePlanning,
  bumpPlanningVersion,
  getCountdownState,
  getExecutionState,
  getJltPreparation,
  getJltShotData,
  getPlanningState,
  getReadiness,
  getShotAcousticLevel,
  getShotArmament,
  getShotJltMao,
  getShotManometerPressures,
  getShotMaoTopography,
  getShotMunition,
  getShotPressures,
  getShotTopography,
  getShotTrajectography,
  getShotVelocities,
  getShotVideoData,
  registerFireShot,
  selectActiveShot,
  setExecutionStatus,
  setJltReadiness,
  setJltShotData,
  setProfileReadiness,
  setSeriesProfileReadiness,
  setShotAcousticLevel,
  setShotArmament,
  setShotJltMao,
  setShotManometerPressures,
  setShotMaoTopography,
  setShotMunition,
  setShotPressure,
  setShotTopography,
  setShotTrajectography,
  setShotVelocity,
  setShotVideoData,
  updateCountdownState,
} from '../fixtures/execution/execution-store';
import { getFixture } from '../utils';

export const executionRouter = Router();

// ==========================================
// EXECUTION STATE
// ==========================================

// Obtener estado de la ejecución para polling
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/state', (req, res) => {
  const state = getExecutionState(req.params['fireTrialId']);
  res.status(200).json(state);
});

// Obtener progreso actual de series y disparos
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/progress', (req, res) => {
  const progress = getFixture('fixtures/execution', 'execution-progress-fixture.json');
  res.status(200).json(progress);
});

// Obtener estado actual de la cuenta atrás
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/security-countdown', (req, res) => {
  const state = getCountdownState(req.params['fireTrialId']);
  res.status(200).json(state);
});

// Gestionar cuenta de seguridad
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/security-countdown', (req, res) => {
  const { action, durationSeconds } = req.body;
  const updated = updateCountdownState(req.params['fireTrialId'], action, durationSeconds);
  res.status(200).json(updated);
});

// ==========================================
// EXECUTION TRANSITIONS
// ==========================================

// Iniciar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/start', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'STARTED');
  res.status(204).send();
});

// Pausar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/pause', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'PAUSED');
  res.status(204).send();
});

// Interrumpir ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/interrupt', (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'reason' es obligatorio" });
    return;
  }
  setExecutionStatus(req.params['fireTrialId'], 'INTERRUPTED');
  res.status(204).send();
});

// Reanudar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/resume', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'ACTIVE');
  res.status(204).send();
});

// Cancelar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/cancel', (req, res) => {
  const { reason } = req.body as { reason?: string };
  if (!reason) {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: "El campo 'reason' es obligatorio" });
    return;
  }
  setExecutionStatus(req.params['fireTrialId'], 'CANCELED');
  res.status(204).send();
});

// Finalizar ensayo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/finish', (req, res) => {
  setExecutionStatus(req.params['fireTrialId'], 'FINISHED');
  const response = getFixture('fixtures/execution', 'execution-finish-fixture.json');
  res.status(200).json(response);
});

// ==========================================
// EXECUTION PLANNING
// ==========================================

// Obtener planificación actual para la ejecución
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/planning', (req, res) => {
  const planning = getFixture('fixtures/execution', 'execution-planning-fixture.json');
  res.status(200).json(planning);
});

// Modificar planificación actual
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/planning', (req, res) => {
  bumpPlanningVersion(req.params['fireTrialId']);
  const base = getFixture('fixtures/execution', 'execution-planning-fixture.json');
  res.status(200).json({ ...base, ...req.body });
});

// Obtener estado actual de la planificación
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/planning/state', (req, res) => {
  const state = getPlanningState(req.params['fireTrialId']);
  res.status(200).json(state);
});

// Aprobar planificación como cliente
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/planning/approve', (req, res) => {
  approvePlanning(req.params['fireTrialId'], req.body.approved ?? true);
  res.status(204).send();
});

// ==========================================
// WIDGET PREFERENCES
// ==========================================

// Obtener preferencias de widgets por rol
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/preferences/roles/:roleName', (req, res) => {
  const preferences = getFixture('fixtures/execution', 'execution-preferences-fixture.json');
  res.status(200).json(preferences);
});

// Actualizar preferencias de widgets por rol
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/preferences/roles/:roleName', (req, res) => {
  res.status(200).json(req.body);
});

// Obtener preferencias de widgets por usuario
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/preferences/users/:username', (req, res) => {
  const preferences = getFixture('fixtures/execution', 'execution-preferences-fixture.json');
  res.status(200).json(preferences);
});

// Actualizar preferencias de widgets por usuario
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/preferences/users/:username', (req, res) => {
  res.status(200).json(req.body);
});

// ==========================================
// EXECUTION READINESS
// ==========================================

// Obtener readiness de todos los perfiles
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/readiness', (req, res) => {
  const readiness = getReadiness(req.params['fireTrialId']);
  res.status(200).json(readiness);
});

// Registrar readiness de un perfil para una serie individual
executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/readiness/profiles/:profile/series/:seriesId',
  (req, res) => {
    const { profile, fireTrialId, seriesId } = req.params as {
      profile: string;
      fireTrialId: string;
      seriesId: string;
    };
    const { isReady, observations } = req.body as { isReady?: boolean; observations?: string };

    if (typeof isReady !== 'boolean') {
      res.status(400).json({
        title: 'Bad Request',
        status: 400,
        detail: "El campo 'isReady' es obligatorio y debe ser un booleano",
      });
      return;
    }

    const updated = setSeriesProfileReadiness(fireTrialId, profile as never, seriesId, isReady, observations);
    res.status(200).json(updated);
  },
);

// Registrar readiness de un perfil (legacy batch array)
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/readiness/profiles/:profile', (req, res) => {
  const { profile, fireTrialId } = req.params as { profile: string; fireTrialId: string };
  const { seriesReadiness } = req.body as { seriesReadiness?: unknown[] };

  if (!seriesReadiness || !Array.isArray(seriesReadiness)) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: "El campo 'seriesReadiness' es obligatorio y debe ser un array",
    });
    return;
  }

  const updated = setProfileReadiness(fireTrialId, profile as never, seriesReadiness as never);
  res.status(200).json(updated);
});

// Obtener preparación JLT + unidades técnicas para una serie
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/jlt-preparation', (req, res) => {
  const fireTrialId = req.params['fireTrialId'] as string;
  const seriesId = req.query['seriesId'] as string | undefined;

  if (!seriesId) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: "El query param 'seriesId' es obligatorio",
    });
    return;
  }

  const readiness = getJltPreparation(fireTrialId, seriesId);
  res.status(200).json(readiness);
});

// Registrar readiness del JLT para una serie
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/jlt-preparation/series/:seriesId', (req, res) => {
  const fireTrialId = req.params['fireTrialId'] as string;
  const { sanitaryServicesReady, securityReady, vessel, observations } = req.body as {
    sanitaryServicesReady?: boolean;
    securityReady?: boolean;
    vessel?: boolean;
    observations?: string;
  };

  if (typeof sanitaryServicesReady !== 'boolean' || typeof securityReady !== 'boolean' || typeof vessel !== 'boolean') {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: "Los campos 'sanitaryServicesReady', 'securityReady' y 'vessel' son obligatorios y booleanos",
    });
    return;
  }

  const updated = setJltReadiness(fireTrialId, sanitaryServicesReady, securityReady, vessel, observations);
  res.status(200).json(updated);
});

// Seleccionar disparo activo
executionRouter.post(
  '/:centerId/fire-trials/:fireTrialId/execution/jlt-preparation/shots/:shotId/active',
  (req, res) => {
    const fireTrialId = req.params['fireTrialId'] as string;
    const shotId = req.params['shotId'] as string;
    selectActiveShot(fireTrialId, shotId);
    res.status(200).send();
  },
);

// Registrar disparo del shot activo
executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/jlt-preparation/fire', (req, res) => {
  const fireTrialId = req.params['fireTrialId'] as string;
  registerFireShot(fireTrialId);
  res.status(200).send();
});

// ==========================================
// DATA ENTRY - WIDGET 3 JLT SHOT DATA
// ==========================================

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/jlt-shot-data/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getJltShotData(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/jlt-shot-data/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setJltShotData(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid JLT shot data payload' });
    }
  },
);

// ==========================================
// DATA ENTRY - WIDGET 4 VELOCITIES
// ==========================================

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/velocities/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotVelocities(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/velocities/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotVelocity(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid velocities payload' });
    }
  },
);

// ==========================================
// DATA ENTRY - WIDGET 5 PRESSURES
// ==========================================

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/pressures/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotPressures(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/pressures/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotPressure(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid pressures payload' });
    }
  },
);

// ==========================================
// EQUIPMENT SELECTOR / SELECTION
// ==========================================

// Contrato GET selector de equipos (legacy & Swagger formats)
executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/equipment-selection', (req, res) => {
  const data = getEquipmentSelectorState(req.params['fireTrialId']);
  res.status(200).json(data);
});

executionRouter.get('/:centerId/fire-trials/:fireTrialId/execution/equipment-selector', (req, res) => {
  const data = getEquipmentSelectorState(req.params['fireTrialId']);
  res.status(200).json(data);
});

// Contrato PUT selector de equipos (legacy & Swagger formats)
executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/equipment-selection', (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'El cuerpo debe ser un array de grupos de medida',
    });
    return;
  }

  updateEquipmentSelectorState(req.params['fireTrialId'], req.body);
  res.status(200).send();
});

executionRouter.put('/:centerId/fire-trials/:fireTrialId/execution/equipment-selector', (req, res) => {
  if (!Array.isArray(req.body)) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'El cuerpo debe ser un array de grupos de medida',
    });
    return;
  }

  const updated = updateEquipmentSelectorState(req.params['fireTrialId'], req.body);
  res.status(200).json(updated);
});

// ==========================================
// DATA ENTRY - WIDGET 22 ARMAMENT
// ==========================================

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/armament/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotArmament(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/armament/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotArmament(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid armament payload' });
    }
  },
);

executionRouter.post('/:centerId/fire-trials/:fireTrialId/execution/armament/bulk-configuration', (req, res) => {
  const { fireTrialId } = req.params as { fireTrialId: string };
  const body = req.body;

  if (!body?.assignedSeriesIds || !Array.isArray(body.assignedSeriesIds) || body.assignedSeriesIds.length === 0) {
    res.status(400).json({
      title: 'Bad Request',
      status: 400,
      detail: 'El campo assignedSeriesIds es obligatorio y no puede estar vacío',
    });
    return;
  }

  try {
    applyArmamentBulkConfiguration(fireTrialId, body);
    res.status(200).json({ message: 'Configuración de armamento aplicada correctamente.' });
  } catch {
    res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Error applying bulk armament configuration' });
  }
});

// ==========================================
// DATA ENTRY - WIDGET 20 MUNITIONS
// ==========================================

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/munitions/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotMunition(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/munitions/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotMunition(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid munitions payload' });
    }
  },
);

// ==========================================
// DATA ENTRY - WIDGET 21 MANOMETER PRESSURES
// ==========================================

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/manometer-pressures/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotManometerPressures(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/manometer-pressures/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotManometerPressures(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid manometer pressures payload' });
    }
  },
);

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/jlt-mao/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotJltMao(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/jlt-mao/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotJltMao(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid payload' });
    }
  },
);

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/mao-topography/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotMaoTopography(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/mao-topography/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotMaoTopography(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid payload' });
    }
  },
);

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/topography/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotTopography(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/topography/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotTopography(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid payload' });
    }
  },
);

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/trajectography/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotTrajectography(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/trajectography/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotTrajectography(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid payload' });
    }
  },
);

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/acoustic-level/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotAcousticLevel(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/acoustic-level/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotAcousticLevel(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid payload' });
    }
  },
);

executionRouter.get(
  '/:centerId/fire-trials/:fireTrialId/execution/video/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    res.status(200).json(getShotVideoData(fireTrialId, seriesId, shotId));
  },
);

executionRouter.put(
  '/:centerId/fire-trials/:fireTrialId/execution/video/series/:seriesId/shots/:shotId',
  (req, res) => {
    const { fireTrialId, seriesId, shotId } = req.params as {
      fireTrialId: string;
      seriesId: string;
      shotId: string;
    };

    try {
      const updated = setShotVideoData(fireTrialId, seriesId, shotId, req.body);
      res.status(200).json(updated);
    } catch (error) {
      if (error instanceof Error && error.message === 'SHOT_NOT_FOUND') {
        res.status(404).json({ title: 'Not Found', status: 404, detail: 'Shot not found' });
        return;
      }

      if (error instanceof Error && error.message === 'SHOT_NOT_EDITABLE') {
        res.status(409).json({ title: 'Conflict', status: 409, detail: 'Shot not editable in current status' });
        return;
      }

      res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid payload' });
    }
  },
);
