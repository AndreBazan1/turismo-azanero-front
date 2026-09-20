import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ViajeModal } from './viaje-modal';

describe('ViajeModal', () => {
  let component: ViajeModal;
  let fixture: ComponentFixture<ViajeModal>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViajeModal],
    }).compileComponents();

    fixture = TestBed.createComponent(ViajeModal);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
