import type { ComponentFixture } from '@angular/core/testing';
import { TestBed } from '@angular/core/testing';

import { VideoCameraOrientation } from './video-camera-orientation';

describe('VideoCameraOrientation', () => {
  let component: VideoCameraOrientation;
  let fixture: ComponentFixture<VideoCameraOrientation>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VideoCameraOrientation],
    }).compileComponents();

    fixture = TestBed.createComponent(VideoCameraOrientation);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
