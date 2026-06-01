import type { ComponentType } from '@angular/cdk/portal';
import type { InjectionToken } from '@angular/core';

export interface TabTopProcess<Payload = object | null> {
  data: Payload;
  label: string;
  loader: () => Promise<ComponentType<unknown>>;
  route?: string;
  injector: InjectionToken<Payload> | null;
}
