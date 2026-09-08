import { TestBed } from '@angular/core/testing';
import { Viaje } from './viaje';

describe('Viaje', () => {
  let service: Viaje;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(Viaje);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
