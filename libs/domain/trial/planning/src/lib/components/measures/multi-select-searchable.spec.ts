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

  it('preserves backend order while filtering and marks favorites from options', () => {
    const options = [
      { id: 'z', name: 'Zeta', active: true, favorite: false },
      { id: 'a', name: 'Alfa', active: true, favorite: true },
      { id: 'za', name: 'Zarza', active: true, favorite: false },
    ];
    fixture.componentRef.setInput('options', options);
    fixture.detectChanges();

    expect(component.filteredOptions().map((option) => option.id)).toEqual(['z', 'a', 'za']);
    expect(component.isStarred('a')).toBe(true);
    expect(component.isStarred('z')).toBe(false);

    component.searchTerm.set('z');
    expect(component.filteredOptions().map((option) => option.id)).toEqual(['z', 'za']);
    expect(options.map((option) => option.id)).toEqual(['z', 'a', 'za']);

    fixture.componentRef.setInput(
      'options',
      options.map((option) => ({ ...option, favorite: option.id === 'z' })),
    );
    fixture.detectChanges();
    expect(component.isStarred('z')).toBe(true);
    expect(component.isStarred('a')).toBe(false);
  });
});
