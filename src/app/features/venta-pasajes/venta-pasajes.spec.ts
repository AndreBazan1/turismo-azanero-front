import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VentaPasajes } from './venta-pasajes';

describe('VentaPasajes', () => {
  let component: VentaPasajes;
  let fixture: ComponentFixture<VentaPasajes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VentaPasajes],
    }).compileComponents();

    fixture = TestBed.createComponent(VentaPasajes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
