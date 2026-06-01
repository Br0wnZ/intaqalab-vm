import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { IntaSignalCheckboxComponent } from './inta-mat-checkbox-component';

describe('IntaSignalCheckboxComponent', () => {
  let component: IntaSignalCheckboxComponent;
  let fixture: ComponentFixture<IntaSignalCheckboxComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IntaSignalCheckboxComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(IntaSignalCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
