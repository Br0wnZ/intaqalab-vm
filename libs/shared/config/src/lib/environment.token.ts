import { InjectionToken } from '@angular/core';

import type { AppEnvironment } from './environment.types';

/**
 * Token de inyección para la configuración de entorno.
 *
 * IMPORTANTE: Este token NO tiene factory por defecto.
 * Debe ser provisto explícitamente en app.config.ts mediante provideAppEnvironment().
 * Esto garantiza que un entorno mal configurado falle rápido y de forma visible.
 */
export const APP_ENV = new InjectionToken<AppEnvironment>('app.environment');
