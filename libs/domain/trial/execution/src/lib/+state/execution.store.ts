import { computed, inject } from '@angular/core';
import type { TrialCreateModifyForm } from '@intaqalab/models';
import { TrialStatus } from '@intaqalab/models';
import { patchState, signalStore, withComputed, withHooks, withMethods, withState } from '@ngrx/signals';

import { ExecutionService } from '../services/execution.service';

export interface TechUnitStatus {
  id: string;
  labelKey: string;
  ready: boolean;
  observations: string;
}

export interface JltStatus {
  sanitary: boolean;
  security: boolean;
  boat: boolean;
  observations: string;
}

/** Cámara registrada en Calibry con coordenadas XY en el sistema de referencia del polígono */
export interface CalibryCameraOption {
  value: string;
  label: string;
  /** Coordenada X (metros) */
  x: number;
  /** Coordenada Y (metros) */
  y: number;
}

/** Piqueta registrada en Calibry con coordenadas XY en el sistema de referencia del polígono */
export interface CalibryPiquetaOption {
  value: string;
  label: string;
  /** Coordenada X (metros) */
  x: number;
  /** Coordenada Y (metros) */
  y: number;
}

/** Estado del widget Introducción de datos JLT MAO */
export interface JltMaoState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Tabla de tiro numérica */
  ttn: string | null;
  /** Piqueta seleccionada (id de Calibry) */
  piqueta: string | null;
  /** Velocidad inicial teórica (m/s) */
  velocidadInicialTeorica: number | null;
  /** Distancia prevista al pique (metros) */
  distanciaPrevistaPique: number | null;
  /** Deriva tabular (milésimas ºº) */
  derivaTabular: number | null;
  /** Tiempo de vuelo teórico (segundos) */
  tiempoVueloTeorico: number | null;
  /** Diferencia angular (milésimas ºº) */
  diferenciaAngular: number | null;
  /** Ángulo de tiro (milésimas ºº) — puede venir de Planificación */
  anguloTiro: number | null;
  /** Graduación de espoleta (segundos) — puede venir de Planificación/Municiones */
  graduacionEspoleta: number | null;
  /** Altura de funcionamiento (metros) */
  alturaFuncionamiento: number | null;
  /** Distancia de funcionamiento (metros) */
  distanciaFuncionamiento: number | null;
  /** OLT: puede venir de Planificación o ser calculado a partir de coordenadas de pieza, piqueta y diferencia angular */
  olt: number | null;
  /** Estado del disparo seleccionado */
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  /** Lista de piquetas disponibles en Calibry */
  piquetaOptions: CalibryPiquetaOption[];
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
}

/** Estado del widget de Orientación de Cámaras de Vídeo */
export interface VideoCameraOrientationState {
  /** Cámara seleccionada (id de Calibry) */
  camera: string | null;
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Distancia prevista al pique — procedente del widget MAO (metros) */
  estimatedDistancePique: number | null;
  /** Altura de funcionamiento — procedente del widget MAO (metros) */
  operatingHeight: number | null;
  /** Alcance de funcionamiento — procedente del widget MAO (metros) */
  operatingRange: number | null;
  /** Lista de cámaras disponibles en Calibry */
  cameraOptions: CalibryCameraOption[];
}

/** Observador dado de alta en Calibry */
export interface CalibryObserverOption {
  value: string;
  label: string;
}

/** Arma registrada en Calibry */
export interface CalibryWeaponOption {
  value: string;
  label: string;
}

/** Número de serie del arma registrado en Calibry */
export interface CalibryWeaponSerialOption {
  value: string;
  label: string;
  armId?: string; // ID del arma a la que pertenece esta serie
}

/** Tubo registrado en Calibry */
export interface CalibryTubeOption {
  value: string;
  label: string;
}

/** Número de serie del tubo registrado en Calibry */
export interface CalibryTubeSerialOption {
  value: string;
  label: string;
  tubeId?: string; // ID del tubo a la que pertenece esta serie
}

/** Equipo registrado en Calibry */
export interface CalibryEquipmentOption {
  value: string;
  label: string;
  family?: 'dimensional' | 'length' | 'strokes' | 'stroke-ruler'; // Familia del equipo para Equipo Retroceso
}

/** Estado del widget Introducción de datos de Armamento */
export interface ArmamentIntroductionState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Arma seleccionada (id de Calibry) */
  arma: string | null;
  /** Número de serie del arma (id de Calibry) */
  serieArma: string | null;
  /** Tubo seleccionado (id de Calibry) */
  tubo: string | null;
  /** Número de serie del tubo (id de Calibry) */
  serieTubo: string | null;
  /** Equipo Atacado seleccionado (id de Calibry) */
  equipoAtacado: string | null;
  /** Equipo Retroceso seleccionado (id de Calibry) */
  equipoRetroceso: string | null;
  /** Lista de armas disponibles en Calibry */
  armaOptions: CalibryWeaponOption[];
  /** Lista de números de serie del arma disponibles en Calibry (filtrado por arma seleccionada) */
  serieArmaOptions: CalibryWeaponSerialOption[];
  /** Lista de tubos disponibles en Calibry */
  tuboOptions: CalibryTubeOption[];
  /** Lista de números de serie del tubo disponibles en Calibry (filtrado por tubo seleccionado) */
  serieTuboOptions: CalibryTubeSerialOption[];
  /** Lista de equipos Atacados disponibles en Calibry */
  equipoAtacadoOptions: CalibryEquipmentOption[];
  /** Lista de series disponibles para filtrar */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles para filtrar */
  disparoOptions: { value: string; label: string }[];
  /** Lista de equipos Retroceso disponibles en Calibry */
  equipoRetrocesoOptions: CalibryEquipmentOption[];
}

/** Estado del widget Introducción de datos Topografía MAO */
export interface MaoTopographyState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** OLT para diferencia angular (milésimas ºº), 3 decimales */
  olt: number | null;
  /** Coordenada X del arma (metros) */
  xPieza: number | null;
  /** Coordenada Y del arma (metros) */
  yPieza: number | null;
  /** Coordenada Z del arma (metros) */
  zPieza: number | null;
  /** Observador seleccionado */
  observador: string | null;
  /** Coordenada X del blanco (metros) */
  xBlanco: number | null;
  /** Coordenada Y del blanco (metros) */
  yBlanco: number | null;
  /** Coordenada Z del blanco (metros) */
  zBlanco: number | null;
  /** Lista de observadores disponibles en Calibry */
  observadorOptions: CalibryObserverOption[];
  /** Indica si el campo Blanco está habilitado (condiciones del disparo en Planificación) */
  blancoEnabled: boolean;
}

/** Radar registrado en Calibry con coordenadas XY en el sistema de referencia del polígono */
export interface CalibryRadarOption {
  value: string;
  label: string;
  x: number;
  y: number;
}

/** Estado del widget Orientación Radar de Trayectografía */
export interface RadarTrayectographyOrientationState {
  // Filtros de selección
  serie: string | null;
  disparo: string | null;
  radar: string | null;
  // Coordenadas XYZ de la pieza — del widget MAO Topografía
  xPieza: number | null;
  yPieza: number | null;
  zPieza: number | null;
  /** Diferencia angular aportada por Topografía */
  difAngularTopografia: number | null;
  // Del widget MAO JLT
  alcancePrevistoPique: number | null;
  velocidadInicialTeorica: number | null;
  tiempoVueloTeorico: number | null;
  graduacionEspoleta: number | null;
  anguloTiro: number | null;
  // De Planificación > Condiciones del disparo
  pesoNominalProyectil: number | null;
  // Del widget Armamento en Calibry
  longitudTubo: number | null;
  // Tablas balísticas
  derivaTabular: number | null;
  /** Lista de radares disponibles en Calibry */
  radarOptions: CalibryRadarOption[];
}

/** Estado del widget Introducción de datos JLT (Shot Data) */
export interface JltShotDataState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Estado del disparo (read-only, procedente del widget JLT MAO) */
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  /** JET */
  jet: string | null;
  /** Operador de la pieza */
  operadorPieza: string | null;
  /** Equipo Atacado seleccionado (id de Calibry) */
  equipoAtacado: string | null;
  /** Atacado (mm) */
  atacado: number | null;
  /** Equipo Retroceso seleccionado (id de Calibry) */
  equipoRetroceso: string | null;
  /** Retroceso (mm) */
  retroceso: number | null;
  /** Observaciones */
  observaciones: string | null;
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
  /** Lista de equipos Atacados disponibles en Calibry */
  equipoAtacadoOptions: CalibryEquipmentOption[];
  /** Lista de equipos Retroceso disponibles en Calibry */
  equipoRetrocesoOptions: CalibryEquipmentOption[];
}

/** Opción de componente de munición */
export interface MunitionIntroComponentOption {
  value: string;
  label: string;
  /** 'espoleta' | 'polvo' | 'granada' | 'carga' | etc. */
  category: string;
}

/** Opción de denominación de munición */
export interface MunitionIntroDenominacionOption {
  value: string;
  label: string;
  componenteId: string;
  inStock: boolean;
}

/** Opción de lote de munición */
export interface MunitionIntroLoteOption {
  value: string;
  label: string;
  denominacionId: string;
}

/** Selección de un equipo en el diálogo selector de equipos */
export interface EquipmentItemSelection {
  itemId: string;
  categoryId: string;
  series: string[];
  disparos: string[];
}

/** Pestañas del widget Seguimiento */
export type SeguimientoTab = 'velocidades' | 'p-manom' | 'p-pz-cie' | 'p-pz-int' | 'p-pz-cul' | 'p-ipg';

/** Fila de datos de un disparo en el widget Seguimiento */
export interface SeguimientoShotRow {
  /** Número de disparo */
  disparo: number;
  /** Wc/g values por balanza (pólvora) */
  wcValues: (number | null)[];
  /** Wp/g values por balanza (proyectil) */
  wpValues: (number | null)[];
  /** V0 values por radar Doppler */
  v0Values: (number | null)[];
  /** V0c velocidad inicial corregida (calculado) */
  v0c: number | null;
  /** Presión por manómetro */
  pManomValues: (number | null)[];
  /** Presión media (calculado) */
  pManomMean: number | null;
  /** Pmáx por sensor piezoeléctrico — cierre */
  pMaxCierre: (number | null)[];
  /** Pmáx por sensor piezoeléctrico — intermedio */
  pMaxIntermedio: (number | null)[];
  /** Pmáx por sensor piezoeléctrico — culote */
  pMaxCulote: (number | null)[];
}

/** Datos de una serie en el widget Seguimiento */
export interface SeguimientoSerieData {
  serieId: string;
  serieLabel: string;
  rows: SeguimientoShotRow[];
}

/** Estado del widget Seguimiento */
export interface SeguimientoState {
  /** Pestaña activa */
  activeTab: SeguimientoTab;
  /** Unidad de presión/velocidad seleccionada */
  presionVelocidadUnit: string;
  /** Unidad de pesos seleccionada */
  pesosUnit: string;
  /** Pestañas visibles (determinadas por magnitudes seleccionadas) */
  activeTabs: SeguimientoTab[];
  /** Número de balanzas usadas (determina columnas Wc/g y Wp/g) */
  numWeightScales: number;
  /** Número de radares Doppler (determina columnas V0) */
  numRadars: number;
  /** Número de manómetros (determina columnas P) */
  numManometers: number;
  /** Número de sensores piezoeléctricos por posición (determina columnas Pmáx) */
  numPiezoSensors: number;
  /** Datos de series y disparos */
  series: SeguimientoSerieData[];
}

/** Una serie del widget Información Tarado */
export interface InformacionTaradoSerie {
  /** Código de serie (p.ej. «S1») */
  numero: string;
  /** Nombre descriptivo de la serie (de Planificación > Series) */
  nombre: string | null;
  /** Zona (de Planificación > Municiones > Configuraciones) */
  zona: string | null;
  /** Velocidad nominal en m/s (de Planificación > Condiciones del disparo) */
  velocidadNominal: number | null;
  /** Desviación de velocidad máxima σV (de Planificación > Magnitudes y registros > Balística) */
  desviacionVelocidadMax: number | null;
  /** Peso de pólvora Wc/g (de Planificación > Condiciones del disparo) */
  pesoPolvora: number | null;
}

/** Estado del widget Información Tarado */
export interface InformacionTaradoState {
  /** Unidad de velocidad seleccionada */
  velocidadUnit: string;
  /** Datos por serie (procedentes de Planificación, read-only en este widget) */
  series: InformacionTaradoSerie[];
}

/** Estado del diálogo selector de equipos */
export interface EquipmentSelectorState {
  categories: Array<{ id: string; label: string; maxSelection: number }>;
  items: Array<{ id: string; label: string; categoryId: string }>;
  selections: EquipmentItemSelection[];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
}

/** Punto de datos de Tarado (X=Wc/g, Y=V0c) ordenados por Disparo */
export interface TaradoVelocidadDataPoint {
  wc: number;
  v0c: number;
  serie: string;
  disparo: number;
}

/** Regresión V0/Wc del Tarado Pólvora */
export interface TaradoVelocidadRegression {
  pendiente: number;
  ordenada: number;
  correlacion: number;
  wcTarado: number;
  pesoTarado: number;
}

/** Punto de datos del Tarado de Presión (X=Wc/g, Y=Presión media MPa) */
export interface TaradoPresionDataPoint {
  wc: number;
  presion: number;
  serie: string;
  disparo: number;
}

/** Regresión Presión/Wc del Tarado Pólvora */
export interface TaradoPresionRegression {
  pendiente: number;
  ordenada: number;
  correlacion: number;
  wcTarado: number;
  pesoTarado: number;
}

/** Estado del widget Gráfica Tarado - Presiones */
export interface TaradoPresionChartState {
  selectedSerie: string[] | null;
  selectedDisparo: string[] | null;
  /** Presión buscada (MPa), procedente del widget Información Sobrepresión */
  presionBuscada: number | null;
  dataPoints: TaradoPresionDataPoint[];
  regression: TaradoPresionRegression | null;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
}

/** Estado del widget Gráfica Tarado - Velocidad */
export interface TaradoVelocidadChartState {
  selectedSerie: string[] | null;
  selectedDisparo: string[] | null;
  selectedVelocidadNominal: string | null;
  selectedConfiguracion: string | null;
  dataPoints: TaradoVelocidadDataPoint[];
  regression: TaradoVelocidadRegression | null;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  velocidadNominalOptions: { value: string; label: string }[];
  configuracionOptions: { value: string; label: string }[];
}

/** Opción de equipo de trayectografía (Radar Doppler de Trayectografía / Analizador) */
export interface TrayectografiaEquipoOption {
  value: string;
  label: string;
}

/** Datos del tab Trayectorias del widget Introducción datos trayectografía */
export interface TrayectografiaTrayectoriaState {
  alcance: number | null;
  alcanceUnit: string;
  deriva: number | null;
  derivaUnit: string;
  tiempoVuelo: number | null;
  tiempoVueloUnit: string;
  tiempoFuncionamientoEspoleta: number | null;
  tiempoFuncionamientoEspoletaUnit: string;
  alturaFuncionamientoEspoleta: number | null;
  alturaFuncionamientoEspoletaUnit: string;
  alcanceFuncionamientoEspoleta: number | null;
  alcanceFuncionamientoEspoletaUnit: string;
  flecha: number | null;
  flechaUnit: string;
  calificacionVuelo: string | null;
  coeficienteAerodinamico: number | null;
  tiempoEyeccionBotesFumigenos: number | null;
  tiempoEyeccionBotesFumigenosUnit: string;
  observaciones: string | null;
}

/** Datos del tab Funcionamientos del widget Introducción datos trayectografía */
export interface TrayectografiaFuncionamientosState {
  funcionamientoEspoletasTrayectografia: string | null;
  funcionamientoMunicionFumigenaRadar: string | null;
  funcionamientoMunicionIluminanteRadar: string | null;
  numeroBotesEyectados: number | null;
  observaciones: string | null;
}

/** Datos del tab Trazas del widget Introducción datos trayectografía */
export interface TrayectografiaTrazasState {
  tiempoTraza: number | null;
  tiempoTrazaUnit: string;
  existenciaTrazaRadar: string | null;
  observaciones: string | null;
}

/** Estado completo del widget Introducción datos trayectografía */
export interface TrayectografiaIntroductionState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  equipo: string | null;
  trayectorias: TrayectografiaTrayectoriaState;
  funcionamientos: TrayectografiaFuncionamientosState;
  trazas: TrayectografiaTrazasState;
  equipoOptions: TrayectografiaEquipoOption[];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
}

/** Estado del widget Introducción datos topografía */
export interface TopographyIntroductionState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  equipo: string | null;
  tiempoVuelo: number | null;
  tiempoVueloUnit: string;
  tiempoIluminacion: number | null;
  tiempoIluminacionUnit: string;
  numeroEstelaHumo: number | null;
  observaciones: string | null;
  equipoOptions: { value: string; label: string }[];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
}

/** Estado del widget Cálculo coordenadas de paso */
/** Estado del widget Datos del Blanco */
export interface TargetDataState {
  serie: string | null;
  disparo: string | null;
  blanco: string | null;
  material: string | null;
  dimensiones: string | null;
  espesor: number | null;
  espesorUnit: string;
  distancia: number | null;
  distanciaUnit: string;
  inclinacion: number | null;
  inclinacionUnit: string;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  blancoOptions: { value: string; label: string }[];
  materialOptions: { value: string; label: string }[];
  dimensionesOptions: { value: string; label: string }[];
  /** true si los datos son iguales en todos los disparos de la serie → deshabilita selector disparo */
  sameDataAcrossDisparos: boolean;
  /** true si los datos son iguales en toda la prueba → deshabilita selector serie */
  sameDataAcrossSeries: boolean;
}

export interface PassCoordsState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Altura boca-bola pieza (m) — calculada a partir de Altura bola, Z Bola y Z Pieza */
  alturaBocaBolaPieza: number | null;
  /** Distancia geométrica boca-bola (m) — calculada por trigonometría */
  distanciaGeometricaBocaBola: number | null;
  /** Distancia cámara frontal bola (m) — calculada por trigonometría */
  distanciaCamaraFrontalBola: number | null;
  /** Distancia cámara transversal bola (m) — calculada por trigonometría */
  distanciaCamaraTransversalBola: number | null;
  /** Incremento de cota cámara frontal bola (m) — calculada por trigonometría */
  incrementoCotaCamaraFrontalBola: number | null;
  /** Incremento de cota cámara transversal bola (m) — calculada por trigonometría */
  incrementoCotaCamaraTransversalBola: number | null;
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
}

/** Un disparo atípico detectado por el criterio de Grubbs */
export interface GrubbsOutlier {
  shotId: string;
  label: string;
  excluded: boolean;
}

/** Estado del widget Criterio de Grubbs */
export interface GrubbsCriterionState {
  serie: string | null;
  variable: string | null;
  outliers: GrubbsOutlier[];
  serieOptions: { value: string; label: string }[];
  variableOptions: { value: string; label: string }[];
}

/** Estado del widget Información Sobrepresión */
export interface OverpressureInfoState {
  /** Presión máxima introducida por el ingeniero de ensayos */
  presionMaxima: number | null;
  /** Presión mínima introducida por el ingeniero de ensayos */
  presionMinima: number | null;
  /** Presión de referencia introducida por el ingeniero de ensayos */
  presionRef: number | null;
  /** Unidad de presión global del widget (MPa, bar, kPa, psi) */
  unidadPresion: string;
  /** Presión de seguridad procedente de Calibry (tubo seleccionado) */
  presionSeguridad: number | null;
}

/** Punto de datos de Sobrepresión (X=Wc/g, Y=presión en MPa) */
export interface OverpressureDataPoint {
  /** Peso de pólvora Wc/g (g) */
  wc: number;
  /** Valor de la recta de regresión en este Wc/g */
  rectaPresion: number;
  /** Desviación máxima = recta + 3σ */
  desviacionMax: number;
  /** Desviación mínima = recta − 2σ */
  desviacionMin: number;
  /** Nombre de la serie */
  serie: string;
  /** Número de disparo */
  disparo: number;
}

/** Regresión lineal presión/Wc del ensayo de sobrepresión */
export interface OverpressureRegression {
  pendiente: number;
  ordenada: number;
  correlacion: number;
}

/** Estado del widget Gráfica Sobrepresión */
export interface OverpressureChartState {
  /** Series seleccionadas (filtro múltiple) */
  selectedSerie: string[] | null;
  /** Presión de seguridad procedente de Calibry (tubo seleccionado) */
  presionSeguridad: number | null;
  /** Presión máxima introducida en el widget Información Sobrepresión */
  presionMaxima: number | null;
  /** Presión mínima introducida en el widget Información Sobrepresión */
  presionMinima: number | null;
  /** Puntos individuales de presión por disparo */
  dataPoints: OverpressureDataPoint[];
  /** Regresión lineal calculada sobre los disparos seleccionados */
  regression: OverpressureRegression | null;
  /** Opciones de serie disponibles */
  serieOptions: { value: string; label: string }[];
}

/** Fila de la tabla de criterios de calificación del widget Vigilancia */
export interface VigilanciaRow {
  /** Límite mínimo Útil-1 (procedente de Planificación) */
  util1min: number | null;
  /** Límite máximo Útil-1 (procedente de Planificación) */
  util1max: number | null;
  /** Límite mínimo Inútil (procedente de Planificación) */
  inutilmin: number | null;
  /** Límite máximo Inútil (procedente de Planificación) */
  inutilmax: number | null;
  /** Valor real obtenido en la ejecución */
  value: number | null;
  /** Calificación calculada: 'Útil-1' | 'Útil-2' | 'Inútil' | null */
  calificacion: string | null;
}

/** Estado del widget Vigilancia */
export interface VigilanciaState {
  /** Serie seleccionada para filtrar */
  serie: string | null;
  /** Opciones de serie disponibles */
  serieOptions: { value: string; label: string }[];
  /** Unidad de velocidad seleccionada (m/s, ft/s…) */
  velocidadUnit: string;
  /** Unidad de presión seleccionada (bar, MPa, kPa, psi…) */
  presionUnit: string;
  /** ISO date string de la última actualización, null si nunca */
  lastChecked: string | null;
  /** Velocidad inicial corregida V0c */
  v0c: VigilanciaRow;
  /** Velocidad inicial corregida media V̄0c */
  v0cMedia: VigilanciaRow;
  /** Desviación de velocidad inicial corregida σV0c */
  sigmaV0c: VigilanciaRow;
  /** Presión P */
  presion: VigilanciaRow;
  /** Presión media P̄ */
  presionMedia: VigilanciaRow;
  /** Fallos Proyectil */
  proyectil: VigilanciaRow;
  /** Fallos Espoleta */
  espoleta: VigilanciaRow;
  /** Fallos Estopín */
  estopin: VigilanciaRow;
}

/** Criterio de aceptación STANAG extraido del documento de planificación */
export interface CriterioStanag {
  id: string;
  /** Texto del criterio definido en planificación > General */
  texto: string;
  /** null = pendiente de verificación */
  cumple: boolean | null;
}

/** Estado del widget Criterios STANAG */
export interface StanagCriteriosState {
  criterios: CriterioStanag[];
  /** ISO date string de la última verificación, null si nunca se ha ejecutado */
  lastChecked: string | null;
}

/** Configuración de tarado guardada para el widget de Uniformidad */
export interface UniformidadTaradoConfig {
  id: string;
  label: string;
  /** Velocidad nominal en m/s */
  velocidadNominal: number;
  /** Pendiente de la recta de tarado (m/s per g) */
  pendiente: number;
  /** Wc/g tarado (g) — punto de trabajo calculado por regresión */
  wcTarado: number;
}

/** Estado del widget Gráfica Uniformidad */
export interface UniformidadChartState {
  selectedConfig: string | null;
  selectedSerie: string | null;
  selectedDisparo: string[] | null;
  /** Puntos de datos (V0c) por disparo y serie; comparte estructura con TaradoVelocidadDataPoint */
  dataPoints: TaradoVelocidadDataPoint[];
  configOptions: UniformidadTaradoConfig[];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
}

/** Opción de Radar Doppler de Velocidad Inicial */
export interface VelocityRadarDopplerOption {
  value: string;
  label: string;
}

/** Opción de Antena de Radar Doppler */
export interface VelocityAntenaOption {
  value: string;
  label: string;
}

/** Estado del widget Introducción datos velocidades */
export interface VelocityIntroductionState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Estado del disparo */
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  /** Radar Doppler seleccionado */
  radarDoppler: string | null;
  /** Antena seleccionada */
  antena: string | null;
  /** Velocidad (m/s) */
  velocidad: number | null;
  /** Unidad de velocidad */
  velocidadUnit: string;
  /** Incertidumbre del software (m/s) — read-only, procede del tarado */
  incertidumbreSoftware: number | null;
  /** Unidad de incertidumbre del software */
  incertidumbreSoftwareUnit: string;
  /** Pérdida (m/s) */
  perdida: number | null;
  /** Unidad de pérdida */
  perdidaUnit: string;
  /** Cadencia (dpm) */
  cadencia: number | null;
  /** Unidad de cadencia */
  cadenciaUnit: string;
  /** Observaciones libres */
  observaciones: string | null;
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
  /** Lista de Radares Doppler de Velocidad Inicial disponibles en Calibry */
  radarDopplerOptions: VelocityRadarDopplerOption[];
  /** Lista de Antenas de Radar Doppler disponibles en Calibry */
  antenaOptions: VelocityAntenaOption[];
}

/** Estado de una posición piezoeléctrica (cierre, intermedio, culote) */
export interface PiezoPosicionState {
  captador: string | null;
  amplificador: string | null;
  registrador: string | null;
  presionMaxima: number | null;
  tiempoAccion: number | null;
  tiempoRetardo: number | null;
}

/** Estado del widget Introducción datos presión piezoeléctrica */
export interface PiezoPressureIntroductionState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  cierre: PiezoPosicionState;
  intermedio: PiezoPosicionState;
  culote: PiezoPosicionState;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  captadorOptions: { value: string; label: string }[];
  amplificadorOptions: { value: string; label: string }[];
  registradorOptions: { value: string; label: string }[];
}

/** Estado del widget Introducción datos presión manómetros */
export interface ManometerIntroductionState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  manometro: string | null;
  crusher: string | null;
  micrometroPalpador: string | null;
  h1: number | null;
  h1Unit: string;
  h2: number | null;
  h2Unit: string;
  h3: number | null;
  h3Unit: string;
  h4: number | null;
  h4Unit: string;
  h5: number | null;
  h5Unit: string;
  /** Presión calculada (de tablas Calibry) */
  presion: number | null;
  presionUnit: string;
  observaciones: string | null;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  manometroOptions: { value: string; label: string }[];
  crusherOptions: { value: string; label: string }[];
  micrometroPalpadorOptions: { value: string; label: string }[];
}

/** Estado del widget Radar Trayectografía METCMQ */
export interface RadarMetcmqState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Texto del boletín para el bloque horario del disparo seleccionado */
  texto: string | null;
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
}

/** Balanza disponible en Calibry */
export interface MunitionIntroBalanzaOption {
  value: string;
  label: string;
  rangoMin?: number;
  rangoMax?: number;
  unit?: string;
}

/** Cámara climática / sala climatizada disponible en Calibry */
export interface MunitionIntroCamaraOption {
  value: string;
  label: string;
  temperatura?: number;
}

/** Estado del tab Identificación */
export interface MunitionIntroIdentificationState {
  componente: string | null;
  denominacion: string | null;
  lote: string | null;
  numeroCliente: string | null;
  modoFuncionamiento: string | null;
  graduacionEspoleta: number | null;
  observaciones: string | null;
  denominacionFromPlanning: boolean;
  loteFromPlanning: boolean;
  denominacionNotInStock: boolean;
  loteNotInStock: boolean;
}

/** Estado del tab Pesos */
export interface MunitionIntroPesosState {
  componente: string | null;
  balanza: string | null;
  peso: number | null;
  pesoAnadido: number | null;
  pesoRetirado: number | null;
  fechaHora: string | null;
  rangoPesada: string | null;
  observaciones: string | null;
}

/** Estado del tab Acondicionamiento */
export interface MunitionIntroAcondicionamientoState {
  camara: string | null;
  componente: string | null;
  fechaHoraEntrada: string | null;
  fechaHoraSalida: string | null;
  temperatura: number | null;
  temperaturaCorregida: number | null;
  observaciones: string | null;
}

/** Estado completo del widget Introducción datos municiones */
export interface MunitionIntroductionState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  identificacion: MunitionIntroIdentificationState;
  pesos: MunitionIntroPesosState;
  acondicionamiento: MunitionIntroAcondicionamientoState;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  componenteOptions: MunitionIntroComponentOption[];
  denominacionOptions: MunitionIntroDenominacionOption[];
  loteOptions: MunitionIntroLoteOption[];
  modoFuncionamientoOptions: { value: string; label: string }[];
  balanzaOptions: MunitionIntroBalanzaOption[];
  camaraOptions: MunitionIntroCamaraOption[];
}

/** Estado del widget Introducción datos nivel acústico */
export interface AcousticLevelIntroductionState {
  /** Serie de disparo seleccionada */
  serie: string | null;
  /** Disparo seleccionado */
  disparo: string | null;
  /** Estado del disparo */
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  /** Sonómetro (equipo) seleccionado */
  equipo: string | null;
  /** Coordenada X del sonómetro (metros) */
  xSonometro: number | null;
  /** Coordenada Y del sonómetro (metros) */
  ySonometro: number | null;
  /** Coordenada Z del sonómetro (metros) */
  zSonometro: number | null;
  /** Distancia sonómetro-boca (metros) */
  distanciaSonometroBoca: number | null;
  /** Unidad de distancia sonómetro-boca */
  distanciaSonometroBocaUnit: string;
  /** Nivel acústico (decibelios) */
  nivelAcustico: number | null;
  /** Unidad de nivel acústico */
  nivelAcusticoUnit: string;
  /** Observaciones */
  observaciones: string | null;
  /** Lista de sonómetros disponibles */
  equipoOptions: { value: string; label: string }[];
  /** Lista de series disponibles */
  serieOptions: { value: string; label: string }[];
  /** Lista de disparos disponibles */
  disparoOptions: { value: string; label: string }[];
}

/** Shared value+unit type used across widget states and dialogs */
export type InputFieldValue = { value: string; unit: string } | null;

export interface DatosBlancoBolasState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  // Row 1
  blancoBolax: InputFieldValue;
  blancoBolay: InputFieldValue;
  blancoBolaz: InputFieldValue;
  bocaPiezaX: InputFieldValue;
  bocaPiezaY: InputFieldValue;
  bocaPiezaZ: InputFieldValue;
  diametroBola: InputFieldValue;
  alturaBola: InputFieldValue;
  // Row 2
  altTripodeCamTransversal: InputFieldValue;
  camaraFrontalX: InputFieldValue;
  camaraFrontalY: InputFieldValue;
  camaraFrontalZ: InputFieldValue;
  altTripodeCamFrontal: InputFieldValue;
  camTransversalX: InputFieldValue;
  camTransversalY: InputFieldValue;
  camTransversalZ: InputFieldValue;
}

export interface SeguridadBlock {
  camara: string | null;
  grabador: string | null;
  canal: string | null;
  texto: string | null;
}

export interface SeguridadState {
  serie: string | null;
  disparo: string | null;
  estadoDisparo: 'EN_CURSO' | 'PENDIENTE' | 'EJECUTADA' | null;
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  camaraOptions: { value: string; label: string }[];
  grabadorOptions: { value: string; label: string }[];
  canalOptions: { value: string; label: string }[];
  prueba: SeguridadBlock;
  blanco: SeguridadBlock;
  boca: SeguridadBlock;
  cierre: SeguridadBlock;
  pique: SeguridadBlock;
}

interface ExecutionState {
  fireTrialId: string | null;
  fireTrial: TrialCreateModifyForm | null;
  techUnits: TechUnitStatus[];
  jltStatus: JltStatus;
  videoCameraOrientation: VideoCameraOrientationState;
  radarTrayectographyOrientation: RadarTrayectographyOrientationState;
  maoTopography: MaoTopographyState;
  jltMao: JltMaoState;
  armamentIntroduction: ArmamentIntroductionState;
  jltShotData: JltShotDataState;
  munitionIntroduction: MunitionIntroductionState;
  activeSerieId: string | null;
  activeShotId: string | null;
  equipmentSelector: EquipmentSelectorState;
  radarMetcmq: RadarMetcmqState;
  taradoVelocidadChart: TaradoVelocidadChartState;
  taradoPresionChart: TaradoPresionChartState;
  velocityIntroduction: VelocityIntroductionState;
  piezoPressureIntroduction: PiezoPressureIntroductionState;
  manometerIntroduction: ManometerIntroductionState;
  seguimiento: SeguimientoState;
  informacionTarado: InformacionTaradoState;
  uniformidadChart: UniformidadChartState;
  stanagCriterios: StanagCriteriosState;
  trayectografiaIntroduction: TrayectografiaIntroductionState;
  overpressureInfo: OverpressureInfoState;
  overpressureChart: OverpressureChartState;
  passCoords: PassCoordsState;
  grubbsCriterion: GrubbsCriterionState;
  topographyIntroduction: TopographyIntroductionState;
  targetData: TargetDataState;
  acousticLevelIntroduction: AcousticLevelIntroductionState;
  vigilancia: VigilanciaState;
  datosBlancoBola: DatosBlancoBolasState;
  seguridad: SeguridadState;
}

const initialState: ExecutionState = {
  fireTrialId: null,
  fireTrial: null,
  techUnits: [
    { id: 'velocidades', labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VELOCIDADES', ready: true, observations: 'Aquí las observaciones que han hecho' },
    { id: 'trayectografia', labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.TRAYECTOGRAFIA', ready: true, observations: 'Aquí las observaciones que han hecho' },
    { id: 'presiones', labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.PRESIONES', ready: true, observations: 'Aquí las observaciones que han hecho' },
    { id: 'municiones', labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.MUNICIONES', ready: true, observations: 'Aquí las observaciones que han hecho' },
    { id: 'video', labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.VIDEO', ready: true, observations: 'Aquí las observaciones que han hecho' },
    { id: 'armamento', labelKey: 'TRIAL_EXECUTION.WIDGETS.EXEC_PREP_TECH.PROFILES.ARMAMENTO', ready: true, observations: 'Aquí las observaciones que han hecho' },
  ],
  jltStatus: {
    sanitary: false,
    security: false,
    boat: false,
    observations: '',
  },
  videoCameraOrientation: {
    camera: null,
    serie: null,
    disparo: null,
    estimatedDistancePique: null,
    operatingHeight: null,
    operatingRange: null,
    cameraOptions: [
      { value: 'cam-01', label: 'Cámara 01', x: 120.5, y: 340.2 },
      { value: 'cam-02', label: 'Cámara 02', x: 95.0,  y: 410.8 },
      { value: 'cam-03', label: 'Cámara 03', x: 200.3, y: 280.0 },
    ],
  },
  radarTrayectographyOrientation: {
    serie: null,
    disparo: null,
    radar: null,
    xPieza: null,
    yPieza: null,
    zPieza: null,
    difAngularTopografia: null,
    alcancePrevistoPique: null,
    velocidadInicialTeorica: null,
    tiempoVueloTeorico: null,
    graduacionEspoleta: null,
    anguloTiro: null,
    pesoNominalProyectil: null,
    longitudTubo: null,
    derivaTabular: null,
    radarOptions: [
      { value: 'radar-01', label: 'Radar 01', x: 450.0, y: 120.5 },
      { value: 'radar-02', label: 'Radar 02', x: 380.0, y: 250.0 },
    ],
  },
  activeSerieId: 'funcionamiento-1',
  activeShotId: 'shot-3',
  taradoVelocidadChart: {
    selectedSerie: null,
    selectedDisparo: null,
    selectedVelocidadNominal: '445',
    selectedConfiguracion: null,
    dataPoints: [
      { wc: 400, v0c: 240.93, serie: 'Baja Z1', disparo: 3 },
      { wc: 400, v0c: 244.96, serie: 'Baja Z1', disparo: 4 },
      { wc: 400, v0c: 243.27, serie: 'Baja Z1', disparo: 5 },
      { wc: 500, v0c: 278.47, serie: 'Alta Z1', disparo: 6 },
      { wc: 500, v0c: 281.56, serie: 'Alta Z1', disparo: 7 },
      { wc: 500, v0c: 280.99, serie: 'Alta Z1', disparo: 8 },
      { wc: 810, v0c: 367.63, serie: 'Baja Z3', disparo: 9 },
      { wc: 810, v0c: 366.84, serie: 'Baja Z3', disparo: 10 },
      { wc: 810, v0c: 368.12, serie: 'Baja Z3', disparo: 11 },
      { wc: 910, v0c: 392.59, serie: 'Alta Z3', disparo: 12 },
      { wc: 910, v0c: 392.27, serie: 'Alta Z3', disparo: 13 },
      { wc: 910, v0c: 392.65, serie: 'Alta Z3', disparo: 14 },
    ],
    regression: {
      pendiente: 0.28986,
      ordenada: 130.99553,
      correlacion: 0.99841,
      wcTarado: 445.0519,
      pesoTarado: 445,
    },
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
      { value: 'Baja Z3', label: 'Baja Z3' },
      { value: 'Alta Z3', label: 'Alta Z3' },
    ],
    disparoOptions: [
      { value: '3', label: 'Disparo 3' },
      { value: '4', label: 'Disparo 4' },
      { value: '5', label: 'Disparo 5' },
      { value: '6', label: 'Disparo 6' },
      { value: '7', label: 'Disparo 7' },
      { value: '8', label: 'Disparo 8' },
      { value: '9', label: 'Disparo 9' },
      { value: '10', label: 'Disparo 10' },
      { value: '11', label: 'Disparo 11' },
      { value: '12', label: 'Disparo 12' },
      { value: '13', label: 'Disparo 13' },
      { value: '14', label: 'Disparo 14' },
    ],
    velocidadNominalOptions: [
      { value: '445', label: '445 m/s' },
    ],
    configuracionOptions: [
      { value: 'tarado-z1', label: 'Tarado Z1' },
    ],
  },
  taradoPresionChart: {
    selectedSerie: null,
    selectedDisparo: null,
    presionBuscada: 335,
    dataPoints: [
      { wc: 400, presion: 246.93, serie: 'Baja Z1', disparo: 3 },
      { wc: 400, presion: 250.96, serie: 'Baja Z1', disparo: 4 },
      { wc: 400, presion: 249.27, serie: 'Baja Z1', disparo: 5 },
      { wc: 500, presion: 276.47, serie: 'Alta Z1', disparo: 6 },
      { wc: 500, presion: 279.56, serie: 'Alta Z1', disparo: 7 },
      { wc: 500, presion: 278.99, serie: 'Alta Z1', disparo: 8 },
      { wc: 810, presion: 365.63, serie: 'Baja Z3', disparo: 9 },
      { wc: 810, presion: 364.84, serie: 'Baja Z3', disparo: 10 },
      { wc: 810, presion: 366.12, serie: 'Baja Z3', disparo: 11 },
      { wc: 910, presion: 440.59, serie: 'Alta Z3', disparo: 12 },
      { wc: 910, presion: 440.27, serie: 'Alta Z3', disparo: 13 },
      { wc: 910, presion: 440.65, serie: 'Alta Z3', disparo: 14 },
    ],
    regression: {
      pendiente: 0.28986,
      ordenada: 130.99553,
      correlacion: 0.99841,
      wcTarado: 703.6,
      pesoTarado: 704,
    },
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
      { value: 'Baja Z3', label: 'Baja Z3' },
      { value: 'Alta Z3', label: 'Alta Z3' },
    ],
    disparoOptions: [
      { value: '3', label: 'Disparo 3' },
      { value: '4', label: 'Disparo 4' },
      { value: '5', label: 'Disparo 5' },
      { value: '6', label: 'Disparo 6' },
      { value: '7', label: 'Disparo 7' },
      { value: '8', label: 'Disparo 8' },
      { value: '9', label: 'Disparo 9' },
      { value: '10', label: 'Disparo 10' },
      { value: '11', label: 'Disparo 11' },
      { value: '12', label: 'Disparo 12' },
      { value: '13', label: 'Disparo 13' },
      { value: '14', label: 'Disparo 14' },
    ],
  } satisfies TaradoPresionChartState,
  radarMetcmq: {
    serie: null,
    disparo: null,
    texto: null,
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
  velocityIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    radarDoppler: null,
    antena: null,
    velocidad: null,
    velocidadUnit: 'm/s',
    incertidumbreSoftware: null,
    incertidumbreSoftwareUnit: 'm/s',
    perdida: null,
    perdidaUnit: 'm/s',
    cadencia: null,
    cadenciaUnit: 'dpm',
    observaciones: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    radarDopplerOptions: [
      { value: 'W700I_SN8302', label: 'W700I_SN8302 / SL-520A_SN6124' },
      { value: 'W700I_SN9001', label: 'W700I_SN9001 / SL-520A_SN7200' },
    ],
    antenaOptions: [
      { value: 'SL520A_SN6124', label: 'W700I_SN8302 / SL-520A_SN6124' },
      { value: 'SL520A_SN7200', label: 'W700I_SN9001 / SL-520A_SN7200' },
    ],
  },
  piezoPressureIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    cierre: { captador: null, amplificador: null, registrador: null, presionMaxima: null, tiempoAccion: null, tiempoRetardo: null },
    intermedio: { captador: null, amplificador: null, registrador: null, presionMaxima: null, tiempoAccion: null, tiempoRetardo: null },
    culote: { captador: null, amplificador: null, registrador: null, presionMaxima: null, tiempoAccion: null, tiempoRetardo: null },
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    captadorOptions: [
      { value: 'captador-kistler-6215', label: 'Kistler 6215 / SN001' },
      { value: 'captador-kistler-6215b', label: 'Kistler 6215B / SN002' },
    ],
    amplificadorOptions: [
      { value: 'amp-kistler-5018', label: 'Kistler 5018 / SN101' },
      { value: 'amp-kistler-5019', label: 'Kistler 5019 / SN102' },
    ],
    registradorOptions: [
      { value: 'reg-yokogawa-dl850', label: 'Yokogawa DL850 / SN201' },
      { value: 'reg-yokogawa-dl9040', label: 'Yokogawa DL9040 / SN202' },
    ],
  },
  manometerIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    manometro: null,
    crusher: null,
    micrometroPalpador: null,
    h1: null,
    h1Unit: 'μm',
    h2: null,
    h2Unit: 'μm',
    h3: null,
    h3Unit: 'μm',
    h4: null,
    h4Unit: 'μm',
    h5: null,
    h5Unit: 'μm',
    presion: null,
    presionUnit: 'MPa',
    observaciones: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    manometroOptions: [
      { value: 'manometro-PN6-SN001', label: 'Manómetro PN6 / SN001' },
      { value: 'manometro-PN10-SN002', label: 'Manómetro PN10 / SN002' },
    ],
    crusherOptions: [
      { value: 'crusher-cobre-SN101', label: 'Crusher Cobre / SN101' },
      { value: 'crusher-plomo-SN102', label: 'Crusher Plomo / SN102' },
    ],
    micrometroPalpadorOptions: [
      { value: 'micrometro-SN201', label: 'Micrómetro palpador / SN201' },
      { value: 'micrometro-SN202', label: 'Micrómetro palpador / SN202' },
    ],
  },
  equipmentSelector: {
    categories: [
      { id: 'radar-dopler', label: 'Radar Dopler', maxSelection: 3 },
      { id: 'sensor-piezoelectrico', label: 'Sensor Piezoelectrico', maxSelection: 2 },
      { id: 'amplificador', label: 'Amplificador', maxSelection: 5 },
      { id: 'antena', label: 'Antena', maxSelection: 1 },
    ],
    items: [
      { id: 'rd-2356', label: 'Radar doppler 2356', categoryId: 'radar-dopler' },
      { id: 'rd-9876', label: 'Radar doppler 9876', categoryId: 'radar-dopler' },
      { id: 'rd-4321', label: 'Radar doppler 4321', categoryId: 'radar-dopler' },
      { id: 'rd-5566', label: 'Radar doppler 5566', categoryId: 'radar-dopler' },
      { id: 'rd-8899', label: 'Radar doppler 8899', categoryId: 'radar-dopler' },
      { id: 'sp-01', label: 'Sensor Piezoelectrico 01', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-02', label: 'Sensor Piezoelectrico 02', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-03', label: 'Sensor Piezoelectrico 03', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-04', label: 'Sensor Piezoelectrico 04', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-05', label: 'Sensor Piezoelectrico 05', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-06', label: 'Sensor Piezoelectrico 06', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-07', label: 'Sensor Piezoelectrico 07', categoryId: 'sensor-piezoelectrico' },
      { id: 'sp-08', label: 'Sensor Piezoelectrico 08', categoryId: 'sensor-piezoelectrico' },
      { id: 'amp-01', label: 'Amplificador 01', categoryId: 'amplificador' },
      { id: 'amp-02', label: 'Amplificador 02', categoryId: 'amplificador' },
      { id: 'amp-03', label: 'Amplificador 03', categoryId: 'amplificador' },
      { id: 'amp-04', label: 'Amplificador 04', categoryId: 'amplificador' },
      { id: 'amp-05', label: 'Amplificador 05', categoryId: 'amplificador' },
      { id: 'amp-06', label: 'Amplificador 06', categoryId: 'amplificador' },
      { id: 'amp-07', label: 'Amplificador 07', categoryId: 'amplificador' },
      { id: 'amp-08', label: 'Amplificador 08', categoryId: 'amplificador' },
      { id: 'amp-09', label: 'Amplificador 09', categoryId: 'amplificador' },
      { id: 'amp-10', label: 'Amplificador 10', categoryId: 'amplificador' },
      { id: 'ant-01', label: 'Antena 01', categoryId: 'antena' },
      { id: 'ant-02', label: 'Antena 02', categoryId: 'antena' },
      { id: 'ant-03', label: 'Antena 03', categoryId: 'antena' },
      { id: 'ant-04', label: 'Antena 04', categoryId: 'antena' },
      { id: 'ant-05', label: 'Antena 05', categoryId: 'antena' },
      { id: 'ant-06', label: 'Antena 06', categoryId: 'antena' },
      { id: 'ant-07', label: 'Antena 07', categoryId: 'antena' },
      { id: 'ant-08', label: 'Antena 08', categoryId: 'antena' },
    ],
    selections: [
      { itemId: 'rd-9876', categoryId: 'radar-dopler', series: [], disparos: [] },
      { itemId: 'rd-4321', categoryId: 'radar-dopler', series: [], disparos: [] },
      { itemId: 'rd-8899', categoryId: 'radar-dopler', series: [], disparos: [] },
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
  munitionIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    identificacion: {
      componente: null,
      denominacion: null,
      lote: null,
      numeroCliente: null,
      modoFuncionamiento: null,
      graduacionEspoleta: null,
      observaciones: null,
      denominacionFromPlanning: false,
      loteFromPlanning: false,
      denominacionNotInStock: false,
      loteNotInStock: false,
    },
    pesos: {
      componente: null,
      balanza: null,
      peso: null,
      pesoAnadido: null,
      pesoRetirado: null,
      fechaHora: null,
      rangoPesada: null,
      observaciones: null,
    },
    acondicionamiento: {
      camara: null,
      componente: null,
      fechaHoraEntrada: null,
      fechaHoraSalida: null,
      temperatura: 20,
      temperaturaCorregida: null,
      observaciones: null,
    },
    serieOptions: [
      { value: 'calentamiento', label: 'Calentamiento' },
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    componenteOptions: [
      { value: 'espoleta-01', label: 'Espoleta', category: 'espoleta' },
      { value: 'granada-01', label: 'Granada', category: 'granada' },
      { value: 'polvo-01', label: 'Pólvora', category: 'polvo' },
      { value: 'carga-01', label: 'Carga propulsora', category: 'carga' },
    ],
    denominacionOptions: [
      { value: 'den-01', label: '155mm M107', componenteId: 'granada-01', inStock: true },
      { value: 'den-02', label: 'Espoleta M578', componenteId: 'espoleta-01', inStock: true },
      { value: 'den-03', label: 'Pólvora M232', componenteId: 'polvo-01', inStock: true },
      { value: 'den-04', label: 'Carga L8A1', componenteId: 'carga-01', inStock: true },
    ],
    loteOptions: [
      { value: 'lote-01', label: 'Lote A-2024', denominacionId: 'den-01' },
      { value: 'lote-02', label: 'Lote B-2024', denominacionId: 'den-01' },
      { value: 'lote-03', label: 'Lote C-2025', denominacionId: 'den-02' },
      { value: 'lote-04', label: 'Lote D-2025', denominacionId: 'den-03' },
    ],
    modoFuncionamientoOptions: [
      { value: 'percusion', label: 'Percusión' },
      { value: 'tiempo', label: 'Tiempo' },
      { value: 'ppd', label: 'PPD (Retardo)' },
      { value: 'superpercusion', label: 'Superpercusión' },
    ],
    balanzaOptions: [
      { value: 'bal-01', label: 'Balanza Precisión 500g', rangoMin: 0, rangoMax: 500, unit: 'g' },
      { value: 'bal-02', label: 'Balanza Precisión 2000g', rangoMin: 0, rangoMax: 2000, unit: 'g' },
    ],
    camaraOptions: [
      { value: 'camara-01', label: 'Cámara climática 01', temperatura: 20 },
      { value: 'camara-02', label: 'Cámara climática 02', temperatura: -10 },
      { value: 'sala-01', label: 'Sala climatizada 01', temperatura: 15 },
    ],
  },
  jltShotData: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    jet: null,
    operadorPieza: null,
    equipoAtacado: null,
    atacado: null,
    equipoRetroceso: null,
    retroceso: null,
    observaciones: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    equipoAtacadoOptions: [
      { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
      { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
    ],
    equipoRetrocesoOptions: [
      { value: 'eq-retro-01', label: 'Equipo Retroceso 01', family: 'dimensional' },
      { value: 'eq-retro-02', label: 'Equipo Retroceso 02', family: 'length' },
    ],
  },
  jltMao: {
    serie: null,
    disparo: null,
    ttn: null,
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
    olt: null,
    estadoDisparo: 'EN_CURSO',
    piquetaOptions: [
      { value: 'piq-01', label: 'Piqueta 01', x: 500.0, y: 200.0 },
      { value: 'piq-02', label: 'Piqueta 02', x: 600.0, y: 350.0 },
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
  maoTopography: {
    serie: null,
    disparo: null,
    olt: null,
    xPieza: null,
    yPieza: null,
    zPieza: null,
    observador: null,
    xBlanco: null,
    yBlanco: null,
    zBlanco: null,
    observadorOptions: [
      { value: 'obs-01', label: 'Observador 01' },
      { value: 'obs-02', label: 'Observador 02' },
    ],
    blancoEnabled: true,
  },
  armamentIntroduction: {
    serie: null,
    disparo: null,
    arma: null,
    serieArma: null,
    tubo: null,
    serieTubo: null,
    equipoAtacado: null,
    equipoRetroceso: null,
    armaOptions: [
      { value: 'arma-01', label: 'Arma 01' },
      { value: 'arma-02', label: 'Arma 02' },
    ],
    serieArmaOptions: [
      { value: 'serie-arma-01', label: 'Serie Arma 01' },
      { value: 'serie-arma-02', label: 'Serie Arma 02' },
    ],
    tuboOptions: [
      { value: 'tubo-01', label: 'Tubo 01' },
      { value: 'tubo-02', label: 'Tubo 02' },
    ],
    serieTuboOptions: [
      { value: 'serie-tubo-01', label: 'Serie Tubo 01' },
      { value: 'serie-tubo-02', label: 'Serie Tubo 02' },
    ],
    equipoAtacadoOptions: [
      { value: 'eq-atac-01', label: 'Equipo Atacado 01' },
      { value: 'eq-atac-02', label: 'Equipo Atacado 02' },
    ],
    equipoRetrocesoOptions: [
      { value: 'eq-retro-01', label: 'Equipo Retroceso 01', family: 'dimensional' },
      { value: 'eq-retro-02', label: 'Equipo Retroceso 02', family: 'length' },
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
  informacionTarado: {
    velocidadUnit: 'm/s',
    series: [
      { numero: 'S1', nombre: 'Tarado pólvora tipo A Zona 1 (baja)', zona: '1', velocidadNominal: 260, desviacionVelocidadMax: 2.5, pesoPolvora: 400 },
      { numero: 'S2', nombre: 'Tarado pólvora tipo A Zona 1 (alta)', zona: '1', velocidadNominal: 285, desviacionVelocidadMax: 2.5, pesoPolvora: 450 },
      { numero: 'S3', nombre: 'Tarado pólvora tipo B Zona 3 (baja)', zona: '3', velocidadNominal: 310, desviacionVelocidadMax: 3.0, pesoPolvora: 810 },
      { numero: 'S4', nombre: 'Tarado pólvora tipo B Zona 3 (alta)', zona: '3', velocidadNominal: 340, desviacionVelocidadMax: 3.0, pesoPolvora: 910 },
    ],
  } satisfies InformacionTaradoState,
  uniformidadChart: {
    selectedConfig: 'tarado-z1',
    selectedSerie: 'Baja Z1',
    selectedDisparo: null,
    dataPoints: [
      { wc: 445, v0c: 263.47, serie: 'Baja Z1', disparo: 3 },
      { wc: 445, v0c: 264.15, serie: 'Baja Z1', disparo: 4 },
      { wc: 445, v0c: 261.93, serie: 'Baja Z1', disparo: 5 },
      { wc: 445, v0c: 260.57, serie: 'Baja Z1', disparo: 6 },
      { wc: 445, v0c: 265.02, serie: 'Alta Z1', disparo: 7 },
      { wc: 445, v0c: 263.88, serie: 'Alta Z1', disparo: 8 },
      { wc: 445, v0c: 262.41, serie: 'Alta Z1', disparo: 9 },
      { wc: 445, v0c: 261.14, serie: 'Alta Z1', disparo: 10 },
    ],
    configOptions: [
      { id: 'tarado-z1', label: 'Tarado Zona 1', velocidadNominal: 260, pendiente: 0.28986, wcTarado: 445.0519 },
    ],
    serieOptions: [
      { value: 'Baja Z1', label: 'Baja Z1' },
      { value: 'Alta Z1', label: 'Alta Z1' },
    ],
    disparoOptions: [
      { value: '3', label: 'Disparo 3' },
      { value: '4', label: 'Disparo 4' },
      { value: '5', label: 'Disparo 5' },
      { value: '6', label: 'Disparo 6' },
      { value: '7', label: 'Disparo 7' },
      { value: '8', label: 'Disparo 8' },
      { value: '9', label: 'Disparo 9' },
      { value: '10', label: 'Disparo 10' },
    ],
  } satisfies UniformidadChartState,
  trayectografiaIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    equipo: null,
    trayectorias: {
      alcance: 20,
      alcanceUnit: 'm',
      deriva: 12,
      derivaUnit: 'm',
      tiempoVuelo: 47,
      tiempoVueloUnit: 's',
      tiempoFuncionamientoEspoleta: 12,
      tiempoFuncionamientoEspoletaUnit: 's',
      alturaFuncionamientoEspoleta: 60,
      alturaFuncionamientoEspoletaUnit: 'm',
      alcanceFuncionamientoEspoleta: 120,
      alcanceFuncionamientoEspoletaUnit: 'm',
      flecha: 4,
      flechaUnit: 'm',
      calificacionVuelo: '3',
      coeficienteAerodinamico: 4,
      tiempoEyeccionBotesFumigenos: 12,
      tiempoEyeccionBotesFumigenosUnit: 's',
      observaciones: null,
    },
    funcionamientos: {
      funcionamientoEspoletasTrayectografia: '4',
      funcionamientoMunicionFumigenaRadar: '5',
      funcionamientoMunicionIluminanteRadar: '8',
      numeroBotesEyectados: 8,
      observaciones: null,
    },
    trazas: {
      tiempoTraza: 12,
      tiempoTrazaUnit: 's',
      existenciaTrazaRadar: null,
      observaciones: null,
    },
    equipoOptions: [
      { value: 'radar-doppler-01', label: 'Radar Doppler 01' },
      { value: 'radar-doppler-02', label: 'Radar Doppler 02' },
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
  } satisfies TrayectografiaIntroductionState,
  stanagCriterios: {
    lastChecked: null,
    criterios: [
      { id: 'c1', texto: 'Velocidad inicial V0 dentro del ±2\u202f% de la velocidad nominal especificada en el contrato.', cumple: true },
      { id: 'c2', texto: 'Dispersión D50 inferior al límite establecido en la tabla de requisitos del pliego de prescripciones técnicas.', cumple: false },
      { id: 'c3', texto: 'Presión de recámara máxima Pm ≤ 530\u202fMPa en todas las mediciones efectuadas.', cumple: true },
      { id: 'c4', texto: 'Variación de velocidad entre disparos σV ≤ desviación máxima especificada en planificación.', cumple: null },
      { id: 'c5', texto: 'Funcionamiento correcto del elemento impulsor en el 100\u202f% de los disparos del ensayo.', cumple: true },
      { id: 'c6', texto: 'Temperatura ambiente dentro del rango operativo −20\u202f°C a +52\u202f°C durante toda la sesión de fuego.', cumple: true },
    ],
  } satisfies StanagCriteriosState,
  seguimiento: {
    activeTab: 'p-manom' as SeguimientoTab,
    presionVelocidadUnit: 'MPa',
    pesosUnit: 'g',
    activeTabs: ['velocidades', 'p-manom', 'p-pz-cie', 'p-pz-int', 'p-pz-cul', 'p-ipg'] as SeguimientoTab[],
    numWeightScales: 2,
    numRadars: 2,
    numManometers: 3,
    numPiezoSensors: 1,
    series: [
      {
        serieId: 'funcionamiento-1',
        serieLabel: 'Serie 1',
        rows: [
          { disparo: 1, wcValues: [120, 16130], wpValues: [261.48, null], v0Values: [261.48, 261.48], v0c: 261.48, pManomValues: [261.48, 261.48, 261.48], pManomMean: 261.48, pMaxCierre: [261.48], pMaxIntermedio: [261.48], pMaxCulote: [261.48] },
          { disparo: 2, wcValues: [120, null], wpValues: [261.48, null], v0Values: [261.48, 261.48], v0c: 261.48, pManomValues: [261.48, 261.48, 261.48], pManomMean: 261.48, pMaxCierre: [261.48], pMaxIntermedio: [261.48], pMaxCulote: [261.48] },
          { disparo: 3, wcValues: [125, 16130], wpValues: [261.48, null], v0Values: [261.48, 261.48], v0c: 261.48, pManomValues: [261.48, 261.48, 261.48], pManomMean: 261.48, pMaxCierre: [261.48], pMaxIntermedio: [261.48], pMaxCulote: [261.48] },
          { disparo: 4, wcValues: [125, 16130], wpValues: [261.48, null], v0Values: [261.48, 261.48], v0c: 261.48, pManomValues: [261.48, 261.48, 261.48], pManomMean: 261.48, pMaxCierre: [261.48], pMaxIntermedio: [261.48], pMaxCulote: [261.48] },
        ],
      },
      {
        serieId: 'funcionamiento-2',
        serieLabel: 'Serie 2',
        rows: [
          { disparo: 1, wcValues: [122, 16200], wpValues: [263.10, null], v0Values: [263.10, 262.90], v0c: 263.00, pManomValues: [268.50, 267.80, 269.10], pManomMean: 268.47, pMaxCierre: [268.50], pMaxIntermedio: [267.80], pMaxCulote: [269.10] },
          { disparo: 2, wcValues: [122, 16200], wpValues: [263.10, null], v0Values: [262.80, 263.20], v0c: 263.00, pManomValues: [268.10, 267.50, 268.90], pManomMean: 268.17, pMaxCierre: [268.10], pMaxIntermedio: [267.50], pMaxCulote: [268.90] },
        ],
      },
    ],
  } satisfies SeguimientoState,
  overpressureInfo: {
    presionMaxima: 273.75,
    presionMinima: 262.05,
    presionRef: 233.97,
    unidadPresion: 'MPa',
    presionSeguridad: 379.00,
  } satisfies OverpressureInfoState,
  overpressureChart: {
    selectedSerie: null,
    presionSeguridad: 379.00,
    presionMaxima: 273.75,
    presionMinima: 262.05,
    dataPoints: [
      { wc: 120, rectaPresion: 261.59435, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie A', disparo: 1 },
      { wc: 120, rectaPresion: 267.7424,  desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie A', disparo: 2 },
      { wc: 125, rectaPresion: 269.17735, desviacionMax: 311.8796835, desviacionMin: 255.1275651, serie: 'Serie A', disparo: 3 },
      { wc: 125, rectaPresion: 268.17225, desviacionMax: 311.8796835, desviacionMin: 255.1275651, serie: 'Serie A', disparo: 4 },
      { wc: 125, rectaPresion: 300.93165, desviacionMax: 311.8796835, desviacionMin: 255.1275651, serie: 'Serie A', disparo: 5 },
      { wc: 125, rectaPresion: 273.0324,  desviacionMax: 311.8796835, desviacionMin: 255.1275651, serie: 'Serie A', disparo: 6 },
      { wc: 120, rectaPresion: 260.88365, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 7 },
      { wc: 120, rectaPresion: 278.2398,  desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 8 },
      { wc: 120, rectaPresion: 274.41675, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 9 },
      { wc: 120, rectaPresion: 277.07555, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 10 },
      { wc: 120, rectaPresion: 270.29795, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 11 },
      { wc: 120, rectaPresion: 245.86525, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 12 },
      { wc: 120, rectaPresion: 265.59345, desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 13 },
      { wc: 120, rectaPresion: 270.4705,  desviacionMax: 301.269236, desviacionMin: 244.5171176, serie: 'Serie B', disparo: 14 },
    ],
    regression: {
      pendiente: 2.07680,
      ordenada: 12.10195,
      correlacion: 0.41,
    },
    serieOptions: [
      { value: 'Serie A', label: 'Serie A' },
      { value: 'Serie B', label: 'Serie B' },
    ],
  } satisfies OverpressureChartState,
  passCoords: {
    serie: null,
    disparo: null,
    alturaBocaBolaPieza: null,
    distanciaGeometricaBocaBola: null,
    distanciaCamaraFrontalBola: null,
    distanciaCamaraTransversalBola: null,
    incrementoCotaCamaraFrontalBola: null,
    incrementoCotaCamaraTransversalBola: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  } satisfies PassCoordsState,
  grubbsCriterion: {
    serie: null,
    variable: null,
    outliers: [],
    serieOptions: [
      { value: 'func-1', label: 'Funcionamiento I' },
      { value: 'func-2', label: 'Funcionamiento II' },
    ],
    variableOptions: [
      { value: 'velocidad', label: 'Velocidad inicial' },
      { value: 'presion', label: 'Presión máxima' },
    ],
  } satisfies GrubbsCriterionState,
  topographyIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: null,
    equipo: null,
    tiempoVuelo: null,
    tiempoVueloUnit: 's',
    tiempoIluminacion: null,
    tiempoIluminacionUnit: 's',
    numeroEstelaHumo: null,
    observaciones: null,
    equipoOptions: [
      { value: 'cron-01', label: 'Cronómetro 01' },
      { value: 'cron-02', label: 'Cronómetro 02' },
      { value: 'timer-01', label: 'Temporizador 01' },
    ],
    serieOptions: [
      { value: 'func-1', label: 'Funcionamiento I' },
      { value: 'func-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
  } satisfies TopographyIntroductionState,
  targetData: {
    serie: null,
    disparo: null,
    blanco: null,
    material: null,
    dimensiones: null,
    espesor: null,
    espesorUnit: 'mm',
    distancia: null,
    distanciaUnit: 'm',
    inclinacion: null,
    inclinacionUnit: 'º',
    serieOptions: [
      { value: 'func-1', label: 'Funcionamiento I' },
      { value: 'func-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    blancoOptions: [],
    materialOptions: [],
    dimensionesOptions: [],
    sameDataAcrossDisparos: false,
    sameDataAcrossSeries: false,
  } satisfies TargetDataState,
  acousticLevelIntroduction: {
    serie: null,
    disparo: null,
    estadoDisparo: 'EN_CURSO',
    equipo: null,
    xSonometro: null,
    ySonometro: null,
    zSonometro: null,
    distanciaSonometroBoca: null,
    distanciaSonometroBocaUnit: 'm',
    nivelAcustico: null,
    nivelAcusticoUnit: 'db',
    observaciones: null,
    equipoOptions: [
      { value: 'sonometro-norsonic-140', label: 'Norsonic 140 / SN001' },
      { value: 'sonometro-norsonic-145', label: 'Norsonic 145 / SN002' },
      { value: 'sonometro-bruel-2270', label: 'Brüel & Kjær 2270 / SN003' },
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
  } satisfies AcousticLevelIntroductionState,
  vigilancia: {
    serie: null,
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    velocidadUnit: 'm/s',
    presionUnit: 'bar',
    lastChecked: null,
    v0c:       { util1min: null,  util1max: null,   inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
    v0cMedia:  { util1min: 818,   util1max: 828,    inutilmin: 806.5,  inutilmax: 839.5,  value: null, calificacion: null },
    sigmaV0c:  { util1min: null,  util1max: 5,      inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
    presion:   { util1min: null,  util1max: 2680,   inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
    presionMedia: { util1min: null, util1max: null, inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
    proyectil: { util1min: null,  util1max: 0,      inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
    espoleta:  { util1min: null,  util1max: 2,      inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
    estopin:   { util1min: null,  util1max: 1,      inutilmin: null,   inutilmax: null,   value: null, calificacion: null },
  } satisfies VigilanciaState,
  datosBlancoBola: {
    serie: 'funcionamiento-1',
    disparo: 'disparo-3',
    estadoDisparo: 'EN_CURSO',
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    blancoBolax: null,
    blancoBolay: null,
    blancoBolaz: null,
    bocaPiezaX: null,
    bocaPiezaY: null,
    bocaPiezaZ: null,
    diametroBola: null,
    alturaBola: null,
    altTripodeCamTransversal: null,
    camaraFrontalX: null,
    camaraFrontalY: null,
    camaraFrontalZ: null,
    altTripodeCamFrontal: null,
    camTransversalX: null,
    camTransversalY: null,
    camTransversalZ: null,
  } satisfies DatosBlancoBolasState,
  seguridad: {
    serie: 'funcionamiento-1',
    disparo: 'disparo-3',
    estadoDisparo: 'EN_CURSO',
    serieOptions: [
      { value: 'funcionamiento-1', label: 'Funcionamiento I' },
      { value: 'funcionamiento-2', label: 'Funcionamiento II' },
    ],
    disparoOptions: [
      { value: 'disparo-1', label: 'Disparo 1' },
      { value: 'disparo-2', label: 'Disparo 2' },
      { value: 'disparo-3', label: 'Disparo 3' },
    ],
    camaraOptions: [
      { value: 'camara-001', label: 'Cámara 001' },
      { value: 'camara-002', label: 'Cámara 002' },
      { value: 'camara-003', label: 'Cámara 003' },
    ],
    grabadorOptions: [
      { value: 'grabador-001', label: 'Grabador 001' },
      { value: 'grabador-002', label: 'Grabador 002' },
    ],
    canalOptions: [
      { value: 'canal-1', label: 'Canal 1' },
      { value: 'canal-2', label: 'Canal 2' },
      { value: 'canal-3', label: 'Canal 3' },
      { value: 'canal-4', label: 'Canal 4' },
    ],
    prueba: { camara: null, grabador: null, canal: null, texto: null },
    blanco: { camara: null, grabador: null, canal: null, texto: null },
    boca:   { camara: null, grabador: null, canal: null, texto: null },
    cierre: { camara: null, grabador: null, canal: null, texto: null },
    pique:  { camara: null, grabador: null, canal: null, texto: null },
  } satisfies SeguridadState,
};

export const ExecutionStore = signalStore(
  withState(initialState),

  withComputed((store, executionService = inject(ExecutionService)) => ({
    // Execution State
    executionState: computed(() => executionService.executionStateResource.value()),
    isLoadingExecutionState: computed(() => executionService.executionStateResource.isLoading()),
    executionStateError: computed(() => executionService.executionStateResource.error()),

    // Execution Progress
    executionProgress: computed(() => executionService.executionProgressResource.value()),
    isLoadingExecutionProgress: computed(() => executionService.executionProgressResource.isLoading()),
    executionProgressError: computed(() => executionService.executionProgressResource.error()),

    // Security Countdown State
    securityCountdown: computed(() => executionService.securityCountdownResource.value()),
    isLoadingSecurityCountdown: computed(() => executionService.securityCountdownResource.isLoading()),
    securityCountdownError: computed(() => executionService.securityCountdownResource.error()),
    isUpdatingSecurityCountdown: computed(() => executionService.updateSecurityCountdownResource.isLoading()),

    // Execution Transitions
    isStarting: computed(() => executionService.startResource.isLoading()),
    isPausing: computed(() => executionService.pauseResource.isLoading()),
    isInterrupting: computed(() => executionService.interruptResource.isLoading()),
    isResuming: computed(() => executionService.resumeResource.isLoading()),
    isCanceling: computed(() => executionService.cancelResource.isLoading()),
    isFinishing: computed(() => executionService.finishResource.isLoading()),
    finishResponse: computed(() => executionService.finishResource.value()),

    /**
     * Indica si la prueba está en un estado de solo lectura
     * (Ejecutada, Finalizando, Cerrada o Cancelada).
     * Cuando es `true`, todos los widgets de entrada deben ser no editables.
     */
    isTrialReadOnly: computed(() => {
      const status = store.fireTrial()?.status;
      const READONLY_STATUSES: TrialStatus[] = [
        TrialStatus.EXECUTED,
        TrialStatus.FINALIZING,
        TrialStatus.CLOSED,
        TrialStatus.CANCELLED,
      ];
      return status !== null && READONLY_STATUSES.includes(status as TrialStatus);
    }),

    // Execution transitions status
    pauseExecutionStatus: computed(() => executionService.pauseResource.status()),
    interruptExecutionStatus: computed(() => executionService.interruptResource.status()),
    resumingExecutionStatus: computed(() => executionService.resumeResource.status()),
    cancelingExecutionStatus: computed(() => executionService.cancelResource.status()),
    finishingExecutionStatus: computed(() => executionService.finishResource.status()),


    // Execution Planning
    planning: computed(() => executionService.planningResource.value()),
    isLoadingPlanning: computed(() => executionService.planningResource.isLoading()),
    planningError: computed(() => executionService.planningResource.error()),
    isUpdatingPlanning: computed(() => executionService.updatePlanningResource.isLoading()),
    planningState: computed(() => executionService.planningStateResource.value()),
    isLoadingPlanningState: computed(() => executionService.planningStateResource.isLoading()),
    isApprovingPlanning: computed(() => executionService.approvePlanningResource.isLoading()),

    // Widget Preferences
    preferencesByRole: computed(() => executionService.preferencesByRoleResource.value()),
    isLoadingPreferencesByRole: computed(() => executionService.preferencesByRoleResource.isLoading()),
    isUpdatingPreferencesByRole: computed(() => executionService.updatePreferencesByRoleResource.isLoading()),
    preferencesByUser: computed(() => executionService.preferencesByUserResource.value()),
    isLoadingPreferencesByUser: computed(() => executionService.preferencesByUserResource.isLoading()),
    isUpdatingPreferencesByUser: computed(() => executionService.updatePreferencesByUserResource.isLoading()),

    // Video Camera Orientation — diferencia angular calculada
    videoCameraAngularDifference: computed((): number | null => {
      const vco = store.videoCameraOrientation();
      const cam = vco.cameraOptions.find(c => c.value === vco.camera) ?? null;
      const height = vco.operatingHeight;
      const range  = vco.operatingRange;

      if (!cam || height === null || range === null || range === 0) return null;

      // Coordenadas de la piqueta B4 en Calibry (placeholder hasta integración real)
      const b4 = { x: 0, y: 0 };
      const dX = cam.x - b4.x;
      const dY = cam.y - b4.y;
      const horizontalDist = Math.sqrt(dX * dX + dY * dY);

      if (horizontalDist === 0) return null;

      const angleCameraRad = Math.atan2(height, horizontalDist);
      const angleRangeRad  = Math.atan2(height, range);
      return (angleCameraRad - angleRangeRad) * (180 / Math.PI);
    }),

    // Radar Trayectografía — valores calculados
    // Piqueta B4 placeholder: { x: 0, y: 0 }. Se reemplazará con datos reales de Calibry.

    /** OLT geográfico = difAngularTopografía + θ(arma→B4) */
    radarTrayectographyOltGeografico: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      if (s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null) return null;
      const b4 = { x: 0, y: 0 };
      const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
      return s.difAngularTopografia + thetaDeg;
    }),

    /** X P. Caída = xPieza + alcance·sin(OLT) + deriva·cos(OLT) */
    radarTrayectographyXPCaida: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      if (s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null || s.alcancePrevistoPique === null) return null;
      const b4 = { x: 0, y: 0 };
      const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
      const oltRad = (s.difAngularTopografia + thetaDeg) * Math.PI / 180;
      const deriva = s.derivaTabular ?? 0;
      return s.xPieza + s.alcancePrevistoPique * Math.sin(oltRad) + deriva * Math.cos(oltRad);
    }),

    /** Y P. Caída = yPieza + alcance·cos(OLT) − deriva·sin(OLT) */
    radarTrayectographyYPCaida: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      if (s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null || s.alcancePrevistoPique === null) return null;
      const b4 = { x: 0, y: 0 };
      const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
      const oltRad = (s.difAngularTopografia + thetaDeg) * Math.PI / 180;
      const deriva = s.derivaTabular ?? 0;
      return s.yPieza + s.alcancePrevistoPique * Math.cos(oltRad) - deriva * Math.sin(oltRad);
    }),

    /** Diferencia angular radar = atan2(radar.y − B4.y, radar.x − B4.x) */
    radarTrayectographyDifAngularRadar: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      const radar = s.radarOptions.find(r => r.value === s.radar) ?? null;
      if (!radar) return null;
      const b4 = { x: 0, y: 0 };
      return Math.atan2(radar.y - b4.y, radar.x - b4.x) * (180 / Math.PI);
    }),

    /** I. Transversal = componente perpendicular de (radar−arma) respecto al eje OLT */
    radarTrayectographyITransversal: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      const radar = s.radarOptions.find(r => r.value === s.radar) ?? null;
      if (!radar || s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null) return null;
      const b4 = { x: 0, y: 0 };
      const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
      const oltRad = (s.difAngularTopografia + thetaDeg) * Math.PI / 180;
      const dx = radar.x - s.xPieza;
      const dy = radar.y - s.yPieza;
      return dx * Math.cos(oltRad) - dy * Math.sin(oltRad);
    }),

    /** I. Longitudinal = componente paralela de (radar−arma) respecto al eje OLT */
    radarTrayectographyILongitudinal: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      const radar = s.radarOptions.find(r => r.value === s.radar) ?? null;
      if (!radar || s.xPieza === null || s.yPieza === null || s.difAngularTopografia === null) return null;
      const b4 = { x: 0, y: 0 };
      const thetaDeg = Math.atan2(b4.y - s.yPieza, b4.x - s.xPieza) * (180 / Math.PI);
      const oltRad = (s.difAngularTopografia + thetaDeg) * Math.PI / 180;
      const dx = radar.x - s.xPieza;
      const dy = radar.y - s.yPieza;
      return dx * Math.sin(oltRad) + dy * Math.cos(oltRad);
    }),

    /** Distancia boca-blanco = sqrt((xB−xP)² + (yB−yP)² + (zB−zP)²) — salida de topografía */
    maoTopographyDistanciaBocaBlanco: computed((): number | null => {      const s = store.maoTopography();
      if (
        s.xPieza === null || s.yPieza === null || s.zPieza === null ||
        s.xBlanco === null || s.yBlanco === null || s.zBlanco === null
      ) return null;
      return Math.sqrt(
        Math.pow(s.xBlanco - s.xPieza, 2) +
        Math.pow(s.yBlanco - s.yPieza, 2) +
        Math.pow(s.zBlanco - s.zPieza, 2),
      );
    }),

    /** OLT JLT MAO: si hay pieza + piqueta + diferenciaAngular, se calcula; si no, se usa el valor guardado */
    jltMaoComputedOlt: computed((): number | null => {
      const s = store.jltMao();
      const maoTopo = store.maoTopography();
      const piqueta = s.piquetaOptions.find(p => p.value === s.piqueta) ?? null;
      if (!piqueta || maoTopo.xPieza === null || maoTopo.yPieza === null || s.diferenciaAngular === null) {
        return s.olt;
      }
      const bearingRad = Math.atan2(piqueta.y - maoTopo.yPieza, piqueta.x - maoTopo.xPieza);
      const bearingMils = bearingRad * (3200 / Math.PI);
      return s.diferenciaAngular + bearingMils;
    }),

    /** Altura de boca = zPieza + sin(anguloTiro) × longitudTubo */
    radarTrayectographyAlturaBoca: computed((): number | null => {
      const s = store.radarTrayectographyOrientation();
      if (s.zPieza === null || s.anguloTiro === null || s.longitudTubo === null) return null;
      return s.zPieza + Math.sin(s.anguloTiro * Math.PI / 180) * s.longitudTubo;
    }),

    // Global Readiness (JLT + Tech)
    isReadyForExecution: computed(() => {
      const jlt = store.jltStatus();
      const techReady = store.techUnits().every(u => u.ready);
      return jlt.sanitary && jlt.security && jlt.boat && techReady;
    }),

    /** Presión buscada = media aritmética entre presión máxima y presión mínima */
    overpressurePresionBuscada: computed((): number | null => {
      const s = store.overpressureInfo();
      if (s.presionMaxima === null || s.presionMinima === null) return null;
      return (s.presionMaxima + s.presionMinima) / 2;
    }),
  })),

  withMethods((store, executionService = inject(ExecutionService)) => ({
    setFireTrialData(fireTrialId: string, fireTrial: TrialCreateModifyForm): void {
      patchState(store, { fireTrialId, fireTrial });
      this.loadExecutionState(fireTrialId);
      this.loadExecutionProgress(fireTrialId);
      this.loadSecurityCountdown(fireTrialId);
      this.loadPlanning(fireTrialId);
      this.loadPlanningState(fireTrialId);
    },

    setFireTrialId(fireTrialId: string | null): void {
      patchState(store, { fireTrialId });
      if (fireTrialId) {
        this.loadExecutionState(fireTrialId);
        this.loadExecutionProgress(fireTrialId);
        this.loadSecurityCountdown(fireTrialId);
        this.loadPlanning(fireTrialId);
        this.loadPlanningState(fireTrialId);
      }
    },

    loadExecutionState(fireTrialId: string): void {
      executionService.getExecutionState(fireTrialId);
    },

    loadExecutionProgress(fireTrialId: string): void {
      executionService.getExecutionProgress(fireTrialId);
    },

    loadSecurityCountdown(fireTrialId: string): void {
      executionService.getSecurityCountdownState(fireTrialId);
    },

    updateSecurityCountdown(
      fireTrialId: string,
      body: Parameters<typeof executionService.updateSecurityCountdown>[1],
    ): void {
      executionService.updateSecurityCountdown(fireTrialId, body);
    },

    startExecution(fireTrialId: string): void {
      executionService.startExecution(fireTrialId);
    },

    pauseExecution(fireTrialId: string): void {
      executionService.pauseExecution(fireTrialId);
    },

    interruptExecution(fireTrialId: string, reason: string): void {
      executionService.interruptExecution(fireTrialId, reason);
    },

    resumeExecution(fireTrialId: string): void {
      executionService.resumeExecution(fireTrialId);
    },

    cancelExecution(fireTrialId: string, reason: string): void {
      executionService.cancelExecution(fireTrialId, reason);
    },

    finishExecution(fireTrialId: string): void {
      executionService.finishExecution(fireTrialId);
    },

    loadPlanning(fireTrialId: string): void {
      executionService.getExecutionPlanning(fireTrialId);
    },

    updatePlanning(fireTrialId: string, body: Parameters<typeof executionService.updateExecutionPlanning>[1]): void {
      executionService.updateExecutionPlanning(fireTrialId, body);
    },

    loadPlanningState(fireTrialId: string): void {
      executionService.getExecutionPlanningState(fireTrialId);
    },

    approvePlanning(fireTrialId: string, body: Parameters<typeof executionService.approveExecutionPlanning>[1]): void {
      executionService.approveExecutionPlanning(fireTrialId, body);
    },

    loadPreferencesByRole(fireTrialId: string, roleName: string): void {
      executionService.getPreferencesByRole(fireTrialId, roleName);
    },

    updatePreferencesByRole(fireTrialId: string, roleName: string, body: Record<string, unknown>): void {
      executionService.updatePreferencesByRole(fireTrialId, roleName, body);
    },

    loadPreferencesByUser(fireTrialId: string, username: string): void {
      executionService.getPreferencesByUser(fireTrialId, username);
    },

    updatePreferencesByUser(fireTrialId: string, username: string, body: Record<string, unknown>): void {
      executionService.updatePreferencesByUser(fireTrialId, username, body);
    },

    // --- Widgets Local State Methods ---
    updateTechUnit(id: string, updates: Partial<TechUnitStatus>): void {
      patchState(store, (state) => ({
        techUnits: state.techUnits.map(u => u.id === id ? { ...u, ...updates } : u)
      }));
    },

    updateJltStatus(updates: Partial<JltStatus>): void {
      patchState(store, (state) => ({
        jltStatus: { ...state.jltStatus, ...updates }
      }));
    },

    setActiveSerie(serieId: string): void {
      patchState(store, { activeSerieId: serieId });
    },

    setActiveShot(shotId: string): void {
      patchState(store, { activeShotId: shotId });
    },

    // --- Video Camera Orientation ---

    /** Actualiza la selección de cámara, serie y/o disparo del widget */
    updateVideoCameraSelection(updates: Partial<Pick<VideoCameraOrientationState, 'camera' | 'serie' | 'disparo'>>): void {
      patchState(store, (state) => ({
        videoCameraOrientation: { ...state.videoCameraOrientation, ...updates },
      }));
    },

    /**
     * Actualiza los campos de salida procedentes del widget MAO.
     * Llamar cuando el widget MAO persiste sus datos.
     */
    updateMaoOutputs(outputs: Partial<Pick<VideoCameraOrientationState, 'estimatedDistancePique' | 'operatingHeight' | 'operatingRange'>>): void {
      patchState(store, (state) => ({
        videoCameraOrientation: { ...state.videoCameraOrientation, ...outputs },
      }));
    },

    /** Reemplaza la lista de cámaras (cuando se integre con la API de Calibry) */
    setCameraOptions(options: CalibryCameraOption[]): void {
      patchState(store, (state) => ({
        videoCameraOrientation: { ...state.videoCameraOrientation, cameraOptions: options },
      }));
    },

    // --- MAO Topografía ---

    /** Actualiza los campos de entrada del widget MAO Topografía */
    updateMaoTopography(updates: Partial<MaoTopographyState>): void {      patchState(store, (state) => ({
        maoTopography: { ...state.maoTopography, ...updates },
      }));
    },

    /** Reemplaza la lista de observadores (cuando se integre con la API de Calibry) */
    setObserverOptions(options: CalibryObserverOption[]): void {
      patchState(store, (state) => ({
        maoTopography: { ...state.maoTopography, observadorOptions: options },
      }));
    },

    // --- JLT MAO ---

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

    /** Actualiza los campos del widget Introducción de datos de Armamento */
    updateArmamentIntroduction(updates: Partial<ArmamentIntroductionState>): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, ...updates },
      }));
    },

    /** Reemplaza la lista de armas (cuando se integre con la API de Calibry) */
    setArmamentIntroductionArmaOptions(options: CalibryWeaponOption[]): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, armaOptions: options },
      }));
    },

    /** Reemplaza la lista de números de serie del arma (filtrado por arma seleccionada) */
    setArmamentIntroductionSerieArmaOptions(options: CalibryWeaponSerialOption[]): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, serieArmaOptions: options },
      }));
    },

    /** Reemplaza la lista de tubos (cuando se integre con la API de Calibry) */
    setArmamentIntroductionTuboOptions(options: CalibryTubeOption[]): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, tuboOptions: options },
      }));
    },

    /** Reemplaza la lista de números de serie del tubo (filtrado por tubo seleccionado) */
    setArmamentIntroductionSerieTuboOptions(options: CalibryTubeSerialOption[]): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, serieTuboOptions: options },
      }));
    },

    /** Reemplaza la lista de equipos atacados (cuando se integre con la API de Calibry) */
    setArmamentIntroductionEquipoAtacadoOptions(options: CalibryEquipmentOption[]): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, equipoAtacadoOptions: options },
      }));
    },

    /** Reemplaza la lista de equipos de retroceso (cuando se integre con la API de Calibry) */
    setArmamentIntroductionEquipoRetrocesoOptions(options: CalibryEquipmentOption[]): void {
      patchState(store, (state) => ({
        armamentIntroduction: { ...state.armamentIntroduction, equipoRetrocesoOptions: options },
      }));
    },


    /** Actualiza los filtros de selección del widget (serie, disparo, radar) */
    updateRadarTrayectographySelection(
      updates: Partial<Pick<RadarTrayectographyOrientationState, 'serie' | 'disparo' | 'radar'>>,
    ): void {
      patchState(store, (state) => ({
        radarTrayectographyOrientation: { ...state.radarTrayectographyOrientation, ...updates },
      }));
    },

    /**
     * Actualiza los datos procedentes de los widgets MAO.
     * Llamar cuando MAO Topografía o MAO JLT persistan sus datos.
     */
    updateRadarTrayectographyMaoData(
      data: Partial<Omit<RadarTrayectographyOrientationState, 'serie' | 'disparo' | 'radar' | 'radarOptions'>>,
    ): void {
      patchState(store, (state) => ({
        radarTrayectographyOrientation: { ...state.radarTrayectographyOrientation, ...data },
      }));
    },

    /** Reemplaza la lista de radares (cuando se integre con la API de Calibry) */
    setRadarOptions(options: CalibryRadarOption[]): void {
      patchState(store, (state) => ({
        radarTrayectographyOrientation: { ...state.radarTrayectographyOrientation, radarOptions: options },
      }));
    },

    /** Actualiza los campos del widget Introducción de datos JLT */
    updateJltShotData(updates: Partial<JltShotDataState>): void {
      patchState(store, (state) => ({
        jltShotData: { ...state.jltShotData, ...updates },
      }));
    },

    /** Actualiza selector de serie/disparo del widget Introducción datos municiones */
    updateMunitionIntroductionSelector(updates: Partial<Pick<MunitionIntroductionState, 'serie' | 'disparo'>>): void {
      patchState(store, (state) => ({
        munitionIntroduction: { ...state.munitionIntroduction, ...updates },
      }));
    },

    /** Actualiza el tab Identificación del widget Introducción datos municiones */
    updateMunitionIntroductionIdentification(updates: Partial<MunitionIntroIdentificationState>): void {
      patchState(store, (state) => ({
        munitionIntroduction: {
          ...state.munitionIntroduction,
          identificacion: { ...state.munitionIntroduction.identificacion, ...updates },
        },
      }));
    },

    /** Actualiza el tab Pesos del widget Introducción datos municiones */
    updateMunitionIntroductionPesos(updates: Partial<MunitionIntroPesosState>): void {
      patchState(store, (state) => ({
        munitionIntroduction: {
          ...state.munitionIntroduction,
          pesos: { ...state.munitionIntroduction.pesos, ...updates },
        },
      }));
    },

    /** Actualiza el estado del widget Gráfica Tarado - Velocidad */
    updateTaradoVelocidadChart(updates: Partial<TaradoVelocidadChartState>): void {
      patchState(store, (state) => ({
        taradoVelocidadChart: { ...state.taradoVelocidadChart, ...updates },
      }));
    },

    /** Actualiza los campos del widget Gráfica Tarado - Presiones */
    updateTaradoPresionChart(updates: Partial<TaradoPresionChartState>): void {
      patchState(store, (state) => ({
        taradoPresionChart: { ...state.taradoPresionChart, ...updates },
      }));
    },

    /** Actualiza los campos del widget Gráfica Uniformidad */
    updateUniformidadChart(updates: Partial<UniformidadChartState>): void {
      patchState(store, (state) => ({
        uniformidadChart: { ...state.uniformidadChart, ...updates },
      }));
    },

    /** Actualiza los campos del widget Criterios STANAG */
    updateStanagCriterios(updates: Partial<StanagCriteriosState>): void {
      patchState(store, (state) => ({
        stanagCriterios: { ...state.stanagCriterios, ...updates },
      }));
    },

    /** Actualiza los campos del widget Radar Trayectografía METCMQ */
    updateRadarMetcmq(updates: Partial<RadarMetcmqState>): void {
      patchState(store, (state) => ({
        radarMetcmq: { ...state.radarMetcmq, ...updates },
      }));
    },

    /** Actualiza los campos del widget Introducción datos velocidades */
    updateVelocityIntroduction(updates: Partial<VelocityIntroductionState>): void {
      patchState(store, (state) => ({
        velocityIntroduction: { ...state.velocityIntroduction, ...updates },
      }));
    },

    /** Actualiza los campos del widget Introducción datos presión manómetros */
    updateManometerIntroduction(updates: Partial<ManometerIntroductionState>): void {
      patchState(store, (state) => ({
        manometerIntroduction: { ...state.manometerIntroduction, ...updates },
      }));
    },

    /** Actualiza los campos del widget Introducción datos presión piezoeléctrica */
    updatePiezoPressureIntroduction(updates: Partial<PiezoPressureIntroductionState>): void {
      patchState(store, (state) => ({
        piezoPressureIntroduction: { ...state.piezoPressureIntroduction, ...updates },
      }));
    },

    /** Actualiza los datos de una posición piezoeléctrica concreta */
    updatePiezoPressurePosicion(posicion: 'cierre' | 'intermedio' | 'culote', updates: Partial<PiezoPosicionState>): void {
      patchState(store, (state) => ({
        piezoPressureIntroduction: {
          ...state.piezoPressureIntroduction,
          [posicion]: { ...state.piezoPressureIntroduction[posicion], ...updates },
        },
      }));
    },

    /** Persiste las selecciones del diálogo selector de equipos */
    updateEquipmentSelections(selections: EquipmentItemSelection[]): void {
      patchState(store, (state) => ({
        equipmentSelector: { ...state.equipmentSelector, selections },
      }));
    },

    /** Actualiza el tab Acondicionamiento del widget Introducción datos municiones */
    updateMunitionIntroductionAcondicionamiento(updates: Partial<MunitionIntroAcondicionamientoState>): void {
      patchState(store, (state) => ({
        munitionIntroduction: {
          ...state.munitionIntroduction,
          acondicionamiento: { ...state.munitionIntroduction.acondicionamiento, ...updates },
        },
      }));
    },

    /** Actualiza los campos del widget Seguimiento */
    updateSeguimiento(updates: Partial<SeguimientoState>): void {
      patchState(store, (state) => ({
        seguimiento: { ...state.seguimiento, ...updates },
      }));
    },

    /** Actualiza los campos del widget Información Tarado */
    updateInformacionTarado(updates: Partial<InformacionTaradoState>): void {
      patchState(store, (state) => ({
        informacionTarado: { ...state.informacionTarado, ...updates },
      }));
    },

    /** Actualiza el selector (serie/disparo/equipo) del widget Introducción datos trayectografía */
    updateTrayectografiaSelector(updates: Partial<Pick<TrayectografiaIntroductionState, 'serie' | 'disparo' | 'equipo' | 'estadoDisparo'>>): void {
      patchState(store, (state) => ({
        trayectografiaIntroduction: { ...state.trayectografiaIntroduction, ...updates },
      }));
    },

    /** Actualiza los datos del tab Trayectorias */
    updateTrayectografiaTrayectorias(updates: Partial<TrayectografiaTrayectoriaState>): void {
      patchState(store, (state) => ({
        trayectografiaIntroduction: {
          ...state.trayectografiaIntroduction,
          trayectorias: { ...state.trayectografiaIntroduction.trayectorias, ...updates },
        },
      }));
    },

    /** Actualiza los datos del tab Funcionamientos */
    updateTrayectografiaFuncionamientos(updates: Partial<TrayectografiaFuncionamientosState>): void {
      patchState(store, (state) => ({
        trayectografiaIntroduction: {
          ...state.trayectografiaIntroduction,
          funcionamientos: { ...state.trayectografiaIntroduction.funcionamientos, ...updates },
        },
      }));
    },

    /** Actualiza los datos del tab Trazas */
    updateTrayectografiaTrazas(updates: Partial<TrayectografiaTrazasState>): void {
      patchState(store, (state) => ({
        trayectografiaIntroduction: {
          ...state.trayectografiaIntroduction,
          trazas: { ...state.trayectografiaIntroduction.trazas, ...updates },
        },
      }));
    },

    /** Actualiza el estado del widget Información Sobrepresión */
    updateOverpressureInfo(updates: Partial<OverpressureInfoState>): void {
      patchState(store, (state) => ({
        overpressureInfo: { ...state.overpressureInfo, ...updates },
      }));
    },

    /** Actualiza el estado del widget Gráfica Sobrepresión */
    updateOverpressureChart(updates: Partial<OverpressureChartState>): void {
      patchState(store, (state) => ({
        overpressureChart: { ...state.overpressureChart, ...updates },
      }));
    },

    /** Actualiza los campos del widget Cálculo coordenadas de paso */
    updatePassCoords(updates: Partial<PassCoordsState>): void {
      patchState(store, (state) => ({
        passCoords: { ...state.passCoords, ...updates },
      }));
    },

    /** Actualiza el estado del widget Criterio de Grubbs */
    updateGrubbsCriterion(updates: Partial<GrubbsCriterionState>): void {
      patchState(store, (state) => ({
        grubbsCriterion: { ...state.grubbsCriterion, ...updates },
      }));
    },

    /** Actualiza los campos del widget Introducción datos topografía */
    updateTopographyIntroduction(updates: Partial<TopographyIntroductionState>): void {
      patchState(store, (state) => ({
        topographyIntroduction: { ...state.topographyIntroduction, ...updates },
      }));
    },

    /** Actualiza los campos del widget Datos del Blanco */
    updateTargetData(updates: Partial<TargetDataState>): void {
      patchState(store, (state) => ({
        targetData: { ...state.targetData, ...updates },
      }));
    },

    /** Actualiza los campos del widget Introducción datos nivel acústico */
    updateAcousticLevelIntroduction(updates: Partial<AcousticLevelIntroductionState>): void {
      patchState(store, (state) => ({
        acousticLevelIntroduction: { ...state.acousticLevelIntroduction, ...updates },
      }));
    },

    /** Actualiza el estado del widget Vigilancia */
    updateVigilancia(updates: Partial<VigilanciaState>): void {
      patchState(store, (state) => ({
        vigilancia: { ...state.vigilancia, ...updates },
      }));
    },

    /** Actualiza los campos del widget Datos blanco bola */
    updateDatosBlancoBola(updates: Partial<DatosBlancoBolasState>): void {
      patchState(store, (state) => ({
        datosBlancoBola: { ...state.datosBlancoBola, ...updates },
      }));
    },

    /** Actualiza el estado del widget Seguridad */
    updateSeguridad(updates: Partial<SeguridadState>): void {
      patchState(store, (state) => ({
        seguridad: { ...state.seguridad, ...updates },
      }));
    },

    /** Marca un disparo atípico como excluido o incluido */
    setGrubbsOutlierExcluded(shotId: string, excluded: boolean): void {
      patchState(store, (state) => ({
        grubbsCriterion: {
          ...state.grubbsCriterion,
          outliers: state.grubbsCriterion.outliers.map((o) =>
            o.shotId === shotId ? { ...o, excluded } : o,
          ),
        },
      }));
    },
  })),

  withHooks({
    onInit(store) {
      const fireTrialId = store.fireTrialId();
      if (fireTrialId) {
        store.loadExecutionState(fireTrialId);
        store.loadExecutionProgress(fireTrialId);
        store.loadSecurityCountdown(fireTrialId);
        store.loadPlanning(fireTrialId);
        store.loadPlanningState(fireTrialId);
      }
    },
  }),
);

export type ExecutionStoreType = InstanceType<typeof ExecutionStore>;
