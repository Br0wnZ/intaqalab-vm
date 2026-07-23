/**
 * Combina clases CSS filtrando valores falseable.
 *
 * Alternativa ligera a `tailwind-merge`/`clsx` suficiente para el
 * caso de uso del proyecto (sin colisiones de utilities complejas).
 *
 * Si en el futuro se necesita resolución inteligente de colisiones Tailwind,
 * esta función puede sustituirse por `tailwind-merge` sin cambiar ningún import.
 *
 * @example
 * cn('flex gap-2', isActive && 'bg-client-primary', userClass)
 * // → 'flex gap-2 bg-client-primary' (si isActive es true)
 */
export function cn(...classes: Array<string | undefined | null | false | 0>): string {
  return classes.filter(Boolean).join(' ');
}
