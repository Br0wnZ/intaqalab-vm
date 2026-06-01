import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { MultiSelectSearchableComponent } from './multi-select-searchable';

describe('MultiSelectSearchable', () => {
  let component: MultiSelectSearchableComponent;
  let fixture: ComponentFixture<MultiSelectSearchableComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MultiSelectSearchableComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(MultiSelectSearchableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
