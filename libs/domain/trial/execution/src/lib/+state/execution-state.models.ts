import type { EquipmentItemSelection, EquipmentMagnitudeSelectionGroup } from '../execution/models';

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

// EquipmentItemSelection is imported from execution/models

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
  categories: Array<{ id: string; label: string; maxSelection: number; equipmentType?: string }>;
  items: Array<{ id: string; label: string; categoryId: string; equipmentType?: string }>;
  equipments: EquipmentMagnitudeSelectionGroup[];
  selections: EquipmentItemSelection[];
  serieOptions: { value: string; label: string }[];
  disparoOptions: { value: string; label: string }[];
  serieDisparoMap?: Record<string, string[]>;
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
