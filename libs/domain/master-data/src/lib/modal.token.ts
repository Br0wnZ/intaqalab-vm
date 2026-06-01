import type { Type } from '@angular/core';
import { InjectionToken } from '@angular/core';

export const MODAL_COMPONENT = new InjectionToken<Type<unknown>>('MODAL_COMPONENT');
