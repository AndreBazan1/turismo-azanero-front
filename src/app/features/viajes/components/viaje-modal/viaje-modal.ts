import { Component, EventEmitter, Input, Output, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ViajeService } from '../../../../core/services/viaje';
import { ViajeRequest } from '../../../../core/models/viaje.model';

@Component({
  selector: 'app-viaje-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './viaje-modal.html',
  styleUrls: ['./viaje-modal.css']
})
export class ViajeModalComponent implements OnInit {
  @Input() isOpen = false;
  @Output() closeModal = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private viajeService = inject(ViajeService);

  viajeForm!: FormGroup;

  // Mock de datos (Idealmente poblados vía CiudadService, VehiculoService, etc.)
  ciudades = [{ id: 1, nombre: 'Cajamarca' }, { id: 2, nombre: 'Celendín' }];
  vehiculos = [{ id: 1, placa: 'C-101 (Combi)' }, { id: 2, placa: 'M-202 (Minivan)' }];
  choferes = [{ id: 1, nombre: 'Carlos Mendoza' }, { id: 2, nombre: 'Juan Pérez' }];

  ngOnInit() {
    this.viajeForm = this.fb.group({
      ciudadOrigenId: [null, Validators.required],
      ciudadDestinoId: [null, Validators.required],
      vehiculoId: [null, Validators.required],
      choferId: [null, Validators.required],
      fecha: ['', Validators.required],
      hora: ['', Validators.required],
      precio: [null, [Validators.required, Validators.min(0.01)]]
    });
  }

  guardar(): void {
    if (this.viajeForm.invalid) return;

    const formValue = this.viajeForm.value;
    
    const request: ViajeRequest = {
      ciudadOrigenId: formValue.ciudadOrigenId,
      ciudadDestinoId: formValue.ciudadDestinoId,
      vehiculoId: formValue.vehiculoId,
      choferId: formValue.choferId,
      precio: formValue.precio,
      // Concatenamos para coincidir con el formato LocalDateTime de Spring Boot
      fechaHora: `${formValue.fecha}T${formValue.hora}:00`
    };

    this.viajeService.crearViaje(request).subscribe({
      next: () => {
        this.onSave.emit();
        this.cerrar();
      },
      error: (err) => console.error('Error al registrar la ruta', err)
    });
  }

  cerrar(): void {
    this.viajeForm.reset();
    this.closeModal.emit();
  }
}