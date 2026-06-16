import type { PipeTransform } from '@angular/core';
import { Pipe } from '@angular/core';
import { format, parseISO } from 'date-fns';

@Pipe({
  name: 'intaDate',
})
export class IntaDatePipe implements PipeTransform {
  transform(value: string | Date | null | undefined, outputFormat = 'dd/MM/yyyy'): string {
    if (!value) return '';
    try {
      const date = typeof value === 'string' ? parseISO(value) : value;
      return format(date, outputFormat);
    } catch {
      return '';
    }
  }
}
