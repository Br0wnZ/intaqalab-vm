export function formatPreciseNumber(value: number, locale: string, minimumFractionDigits = 0): string {
  const [coefficient, exponent = '0'] = String(value).split('e');
  const fractionDigits = coefficient.split('.')[1]?.length ?? 0;
  const maximumFractionDigits = Math.max(minimumFractionDigits, fractionDigits - Number(exponent), 0);

  return new Intl.NumberFormat(
    locale,
    maximumFractionDigits <= 100 ? { minimumFractionDigits, maximumFractionDigits } : { maximumSignificantDigits: 21 },
  ).format(value);
}
