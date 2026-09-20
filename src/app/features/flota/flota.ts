import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FlotaService } from '../../core/services/flota.service';
import { VehiculoResponse } from '../../core/models/flota.model';

type FiltroFlota = 'TODOS' | 'DISPONIBLE' | 'EN_VIAJE' | 'MANTENIMIENTO';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './flota.html',
  styleUrl: './flota.css'
})
export class FlotaComponent implements OnInit {
  private flotaService = inject(FlotaService);

  vehiculos: VehiculoResponse[] = [];
  filtroActual: FiltroFlota = 'TODOS';
  cargando = false;

  get vehiculosFiltrados(): VehiculoResponse[] {
    if (this.filtroActual === 'TODOS') return this.vehiculos;
    return this.vehiculos.filter(v =>
      this.normalizeEstado(v.estado) === this.filtroActual
    );
  }

  get countDisponible(): number {
    return this.vehiculos.filter(v => this.normalizeEstado(v.estado) === 'DISPONIBLE').length;
  }

  get countEnViaje(): number {
    return this.vehiculos.filter(v => this.normalizeEstado(v.estado) === 'EN_VIAJE').length;
  }

  get countMantenimiento(): number {
    return this.vehiculos.filter(v => this.normalizeEstado(v.estado) === 'MANTENIMIENTO').length;
  }

  normalizeEstado(estado: string): FiltroFlota {
    const upper = estado?.toUpperCase().replace(/ /g, '_') ?? '';
    if (upper.includes('DISPONIBLE')) return 'DISPONIBLE';
    if (upper.includes('VIAJE') || upper.includes('TRANSITO') || upper.includes('TRANSIT')) return 'EN_VIAJE';
    if (upper.includes('MANTENIMIENTO')) return 'MANTENIMIENTO';
    return 'DISPONIBLE';
  }

  getEstadoLabel(estado: string): string {
    const norm = this.normalizeEstado(estado);
    const labels: Record<FiltroFlota, string> = {
      TODOS: 'Todos',
      DISPONIBLE: 'Disponible',
      EN_VIAJE: 'En Viaje',
      MANTENIMIENTO: 'Mantenimiento'
    };
    return labels[norm];
  }

  getEstadoClass(estado: string): string {
    const norm = this.normalizeEstado(estado);
    return {
      TODOS: '',
      DISPONIBLE: 'estado-disponible',
      EN_VIAJE: 'estado-en-viaje',
      MANTENIMIENTO: 'estado-mantenimiento'
    }[norm];
  }

  setFiltro(filtro: FiltroFlota): void {
    this.filtroActual = filtro;
  }

  ngOnInit(): void {
    this.cargando = true;
    this.flotaService.listarTodos().subscribe({
      next: (data) => {
        this.vehiculos = data;
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error al cargar vehículos:', err);
        this.cargando = false;
      }
    });
  }
}
