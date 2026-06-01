/* eslint-disable @typescript-eslint/no-explicit-any */
import { type AbstractControl, type FormArray, type FormControl, type FormGroup } from '@angular/forms';

type NonUndefined<T> = T extends undefined ? never : T;

// This type is **Experimental**
export type ControlsOf<T extends Record<string, any>> = {
  [K in keyof T]: NonUndefined<T[K]> extends AbstractControl
    ? T[K]
    : NonUndefined<T[K]> extends (infer R extends AbstractControl<any, any>)[]
      ? FormArray<R>
      : NonUndefined<T[K]> extends readonly any[]
        ? FormControl<T[K]>
        : NonUndefined<T[K]> extends any[]
          ? FormControl<T[K]>
          : NonUndefined<T[K]> extends Date
            ? FormControl<Date>
            : NonUndefined<T[K]> extends Record<any, any>
              ? FormGroup<ControlsOf<T[K]>>
              : FormControl<T[K]>;
};
