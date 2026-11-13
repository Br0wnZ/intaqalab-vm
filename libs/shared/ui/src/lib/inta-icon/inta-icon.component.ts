import { Component, computed, inject, input } from '@angular/core';
import type { SafeHtml } from '@angular/platform-browser';
import { DomSanitizer } from '@angular/platform-browser';

import { getIntaIconSvg } from './inta-icon.registry';
import { INTA_ICON_SIZES, type IntaIconSize } from './inta-icon.sizes';

@Component({
  selector: 'ui-inta-icon',
  template: `
    <span class="ui-inta-icon__glyph" [innerHTML]="svg()"></span>
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 auto;
      color: currentColor;
      line-height: 0;
      vertical-align: middle;
    }

    .ui-inta-icon__glyph {
      display: inline-flex;
      width: 100%;
      height: 100%;
    }
  `,
  host: {
    '[style.color]': 'color() ?? null',
    '[style.width]': 'dimension()',
    '[style.height]': 'dimension()',
    '[attr.role]': 'label() ? "img" : null',
    '[attr.aria-label]': 'label() ?? null',
    '[attr.aria-hidden]': 'label() ? null : "true"',
  },
})
export class IntaIconComponent {
  readonly name = input.required<string>();
  readonly label = input<string>();
  readonly size = input<IntaIconSize | string | number>('md');
  readonly color = input<string>();

  readonly #sanitizer = inject(DomSanitizer);

  readonly svg = computed<SafeHtml>(() => this.#sanitizer.bypassSecurityTrustHtml(getIntaIconSvg(this.name())));
  readonly dimension = computed<string>(() => this.#toCssUnit(this.size()));

  #toCssUnit(value: IntaIconSize | string | number): string {
    if (typeof value === 'number') {
      return `${value}px`;
    }

    if (value in INTA_ICON_SIZES) {
      return `${INTA_ICON_SIZES[value as IntaIconSize]}px`;
    }

    return value;
  }
}
