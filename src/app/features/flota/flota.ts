import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { FlotaService } from '../../core/services/flota.service';
import { VehiculoResponse, VehiculoRequest } from '../../core/models/flota.model';

type FiltroFlota = 'TODOS' | 'DISPONIBLE' | 'EN_VIAJE' | 'MANTENIMIENTO';

@Component({
  selector: 'app-flota',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './flota.html',
  styleUrl: './flota.css'
})
export class FlotaComponent implements OnInit {
  private flotaService = inject(FlotaService);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);

  vehiculos: VehiculoResponse[] = [];
  choferes: any[] = [];
  filtroActual: FiltroFlota = 'TODOS';
  cargando = false;

  // Modal para registrar nueva flota / vehículo
  mostrarModalNuevoVehiculo = false;
  guardandoVehiculo = false;
  mensajeErrorVehiculo = '';
  mensajeExitoVehiculo = '';

  nuevoVehiculo: VehiculoRequest = {
    placa: '',
    marca: '',
    modelo: '',
    anio: new Date().getFullYear(),
    capacidad: 15,
    estado: 'OPERATIVO',
    ultimaRevision: null,
    choferId: null
  };

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
    if (upper.includes('DISPONIBLE') || upper.includes('OPERATIVO') || upper.includes('ACTIVO')) return 'DISPONIBLE';
    if (upper.includes('VIAJE') || upper.includes('TRANSITO') || upper.includes('TRANSIT')) return 'EN_VIAJE';
    if (upper.includes('MANTENIMIENTO') || upper.includes('TALLER')) return 'MANTENIMIENTO';
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
    this.cargarFlota();
    this.cargarChoferes();
  }

  cargarFlota(): void {
    this.cargando = true;
    this.flotaService.listarTodos().subscribe({
      next: (data) => {
        this.vehiculos = data || [];
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar vehículos:', err);
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });
  }

  cargarChoferes(): void {
    this.flotaService.listarChoferes().subscribe({
      next: (data) => {
        this.choferes = data || [];
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error al cargar choferes:', err)
    });
  }

  // Redirigir a "Registrar nueva ruta" preseleccionando esta combi
  asignarViaje(v: VehiculoResponse): void {
    this.router.navigate(['/rutas'], {
      queryParams: { abrirModal: 'true', vehiculoId: v.idVehiculo }
    });
  }

  // Métodos del modal de nuevo vehículo
  abrirModalNuevoVehiculo(): void {
    this.mensajeErrorVehiculo = '';
    this.mensajeExitoVehiculo = '';
    this.nuevoVehiculo = {
      placa: '',
      marca: 'Toyota',
      modelo: 'HiAce',
      anio: new Date().getFullYear(),
      capacidad: 15,
      estado: 'OPERATIVO',
      ultimaRevision: new Date().toISOString().split('T')[0],
      choferId: null
    };
    this.mostrarModalNuevoVehiculo = true;
    this.cdr.detectChanges();
  }

  cerrarModalNuevoVehiculo(): void {
    this.mostrarModalNuevoVehiculo = false;
    this.cdr.detectChanges();
  }

  guardarVehiculo(): void {
    const { placa, marca, modelo, anio, capacidad, estado } = this.nuevoVehiculo;
    if (!placa?.trim() || !marca?.trim() || !modelo?.trim() || !anio || !capacidad || !estado) {
      this.mensajeErrorVehiculo = 'Por favor completa todos los campos requeridos (*).';
      return;
    }

    this.guardandoVehiculo = true;
    this.mensajeErrorVehiculo = '';

    const req: VehiculoRequest = {
      ...this.nuevoVehiculo,
      placa: this.nuevoVehiculo.placa.trim().toUpperCase(),
      marca: this.nuevoVehiculo.marca.trim(),
      modelo: this.nuevoVehiculo.modelo.trim(),
      choferId: this.nuevoVehiculo.choferId ? Number(this.nuevoVehiculo.choferId) : null,
      ultimaRevision: this.nuevoVehiculo.ultimaRevision || null
    };

    this.flotaService.crearVehiculo(req).subscribe({
      next: () => {
        this.guardandoVehiculo = false;
        this.mensajeExitoVehiculo = '¡Vehículo registrado correctamente en la flota!';
        this.cargarFlota();
        setTimeout(() => this.cerrarModalNuevoVehiculo(), 1200);
      },
      error: (err) => {
        this.guardandoVehiculo = false;
        this.mensajeErrorVehiculo = err.error?.message || 'Error al registrar el vehículo. Verifica la placa.';
        this.cdr.detectChanges();
      }
    });
  }
}
