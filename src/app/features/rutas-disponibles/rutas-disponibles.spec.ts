import { ComponentFixture, TestBed } from '@angular/core/testing';
import { RutasDisponibles } from './rutas-disponibles';

describe('RutasDisponibles', () => {
  let component: RutasDisponibles;
  let fixture: ComponentFixture<RutasDisponibles>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RutasDisponibles],
    }).compileComponents();

    fixture = TestBed.createComponent(RutasDisponibles);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
