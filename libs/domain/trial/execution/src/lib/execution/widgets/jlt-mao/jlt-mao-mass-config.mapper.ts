import type { JltMaoBulkConfigurationRequest } from '../../models/shot-jlt-mao.models';

export type JltMaoMassConfigInputField = { value: string; unit: string } | null;

export interface JltMaoMassConfigFields {
  velocidadInicial: JltMaoMassConfigInputField;
  distanciaPique: JltMaoMassConfigInputField;
  derivaTabular: JltMaoMassConfigInputField;
  tiempoVuelo: JltMaoMassConfigInputField;
  diferenciaAngular: JltMaoMassConfigInputField;
  anguloTiro: JltMaoMassConfigInputField;
  graduacionEspoleta: JltMaoMassConfigInputField;
  alturaFuncionamiento: JltMaoMassConfigInputField;
  distanciaFuncionamiento: JltMaoMassConfigInputField;
}

function isSameInputField(left: JltMaoMassConfigInputField, right: JltMaoMassConfigInputField): boolean {
  return left?.value === right?.value && left?.unit === right?.unit;
}

function hasValueToApply(
  value: JltMaoMassConfigInputField | undefined,
  initialValue: JltMaoMassConfigInputField,
  omitUnchanged = false,
): boolean {
  if (value === undefined || (omitUnchanged && isSameInputField(value, initialValue))) return false;
  return value !== null || initialValue !== null;
}

function resolveNumber(
  value: JltMaoMassConfigInputField | undefined,
  initialValue: JltMaoMassConfigInputField,
  omitUnchanged = false,
): number | null | undefined {
  if (value === undefined || (omitUnchanged && isSameInputField(value, initialValue))) return undefined;
  if (value === null) return initialValue === null ? undefined : null;

  const parsedValue = Number(value.value.replace(',', '.'));
  return Number.isFinite(parsedValue) ? parsedValue : undefined;
}

export function mapJltMaoMassConfigToRequest(
  values: Partial<JltMaoMassConfigFields>,
  current: JltMaoMassConfigFields,
  assignedShotIds: string[],
): JltMaoBulkConfigurationRequest | null {
  const body: JltMaoBulkConfigurationRequest = { assignedShotIds: [...new Set(assignedShotIds)] };
  const theoreticalInitialVelocity = resolveNumber(values.velocidadInicial, current.velocidadInicial);
  const plannedImpactDistance = resolveNumber(values.distanciaPique, current.distanciaPique);
  const tabularDrift = resolveNumber(values.derivaTabular, current.derivaTabular);
  const theoreticalFlightTime = resolveNumber(values.tiempoVuelo, current.tiempoVuelo);
  const angularDifference = resolveNumber(values.diferenciaAngular, current.diferenciaAngular);
  const shootingAngle = resolveNumber(values.anguloTiro, current.anguloTiro, true);
  const fuseGraduation = resolveNumber(values.graduacionEspoleta, current.graduacionEspoleta, true);
  const functioningHeight = resolveNumber(values.alturaFuncionamiento, current.alturaFuncionamiento);
  const functioningDistance = resolveNumber(values.distanciaFuncionamiento, current.distanciaFuncionamiento);

  if (theoreticalInitialVelocity !== undefined) body.theoreticalInitialVelocity = theoreticalInitialVelocity;
  if (plannedImpactDistance !== undefined) body.plannedImpactDistance = plannedImpactDistance;
  if (tabularDrift !== undefined) body.tabularDrift = tabularDrift;
  if (theoreticalFlightTime !== undefined) body.theoreticalFlightTime = theoreticalFlightTime;
  if (angularDifference !== undefined) body.angularDifference = angularDifference;
  if (shootingAngle !== undefined) body.shootingAngle = shootingAngle;
  if (fuseGraduation !== undefined) body.fuseGraduation = fuseGraduation;
  if (functioningHeight !== undefined) body.functioningHeight = functioningHeight;
  if (functioningDistance !== undefined) body.functioningDistance = functioningDistance;

  const hasRequiredField = [
    body.numericFiringTable,
    body.theoreticalInitialVelocity,
    body.plannedImpactDistance,
    body.tabularDrift,
    body.theoreticalFlightTime,
    body.shootingAngle,
    body.fuseGraduation,
    body.functioningHeight,
    body.functioningDistance,
    body.observations,
  ].some((value) => value !== undefined);

  return body.assignedShotIds.length > 0 && hasRequiredField ? body : null;
}

export function canApplyJltMaoMassConfig(values: JltMaoMassConfigFields, current: JltMaoMassConfigFields): boolean {
  return (
    hasValueToApply(values.velocidadInicial, current.velocidadInicial) ||
    hasValueToApply(values.distanciaPique, current.distanciaPique) ||
    hasValueToApply(values.derivaTabular, current.derivaTabular) ||
    hasValueToApply(values.tiempoVuelo, current.tiempoVuelo) ||
    hasValueToApply(values.anguloTiro, current.anguloTiro, true) ||
    hasValueToApply(values.graduacionEspoleta, current.graduacionEspoleta, true) ||
    hasValueToApply(values.alturaFuncionamiento, current.alturaFuncionamiento) ||
    hasValueToApply(values.distanciaFuncionamiento, current.distanciaFuncionamiento)
  );
}