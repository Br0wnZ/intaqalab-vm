import { ChangeDetectionStrategy, Component, HostBinding, computed, inject, input } from '@angular/core';
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
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IntaIconComponent {
  readonly name = input.required<string>();
  readonly label = input<string>();
  readonly size = input<IntaIconSize | string | number>('md');
  readonly color = input<string>();

  readonly #sanitizer = inject(DomSanitizer);

  readonly svg = computed<SafeHtml>(() => this.#sanitizer.bypassSecurityTrustHtml(getIntaIconSvg(this.name())));

  @HostBinding('style.color')
  get hostColor(): string | null {
    return this.color() ?? null;
  }

  @HostBinding('style.width')
  get width(): string {
    return this.#toCssUnit(this.size());
  }

  @HostBinding('style.height')
  get height(): string {
    return this.#toCssUnit(this.size());
  }

  @HostBinding('attr.role')
  get role(): string | null {
    return this.label() ? 'img' : null;
  }

  @HostBinding('attr.aria-label')
  get ariaLabel(): string | null {
    return this.label() ?? null;
  }

  @HostBinding('attr.aria-hidden')
  get ariaHidden(): string | null {
    return this.label() ? null : 'true';
  }

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
