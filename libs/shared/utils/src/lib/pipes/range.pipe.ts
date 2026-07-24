import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';

@Pipe({
  name: 'range',
})
export class RangePipe implements PipeTransform {
  transform(length: number | undefined | null, start = 1): number[] {
    if (!length || length <= 0) return [];
    return Array.from({ length }, (_, i) => i + start);
  }
}
