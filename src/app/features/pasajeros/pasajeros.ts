import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

import { ViajeService } from '../../core/services/viaje';
import { AuthService } from '../../core/services/auth.service';
import { ViajeResponse, Asiento, PasajeResponse } from '../../core/models/viaje.model';

export interface FilaManifiesto {
  numeroAsiento: number;
  nombrePasajero: string;
  dniPasajero: string;
  telefono: string;
  precio: number;
  estado: 'ASIGNADO' | 'DISPONIBLE';
}

@Component({
  selector: 'app-pasajeros',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './pasajeros.html',
  styleUrl: './pasajeros.css'
})
export class PasajerosComponent implements OnInit {
  private viajeService = inject(ViajeService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private cdr = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  // Modo de visualización: LISTA_VIAJES o MANIFIESTO
  modoVista: 'LISTA_VIAJES' | 'MANIFIESTO' = 'LISTA_VIAJES';

  // Lista de viajes
  viajes: ViajeResponse[] = [];
  cargandoViajes: boolean = true;
  busquedaViaje: string = '';

  // Datos del manifiesto seleccionado
  viajeSeleccionado: ViajeResponse | null = null;
  cargandoManifiesto: boolean = false;
  asientosCroquis: Asiento[] = [];
  pasajesManifiesto: PasajeResponse[] = [];
  filasManifiesto: FilaManifiesto[] = [];

  // Buscador de pasajeros dentro del manifiesto
  filtroPasajero: string = '';

  ngOnInit() {
    // Si viene con parámetro id en la URL, carga directamente el manifiesto de ese viaje
    this.route.paramMap.subscribe(params => {
      const idParam = params.get('id');
      if (idParam) {
        const idViaje = Number(idParam);
        this.abrirManifiestoPorId(idViaje);
      } else {
        this.cargarViajes();
      }
    });
  }

  cargarViajes() {
    this.modoVista = 'LISTA_VIAJES';
    this.cargandoViajes = true;
    this.viajeService.listarProgramados().subscribe({
      next: (data) => {
        this.viajes = data || [];
        this.cargandoViajes = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar viajes programados:', err);
        this.cargandoViajes = false;
        this.cdr.detectChanges();
      }
    });
  }

  get viajesFiltrados(): ViajeResponse[] {
    if (!this.busquedaViaje?.trim()) return this.viajes;
    const q = this.busquedaViaje.toLowerCase().trim();
    return this.viajes.filter(v => 
      v.ciudadOrigen?.toLowerCase().includes(q) ||
      v.ciudadDestino?.toLowerCase().includes(q) ||
      v.placa?.toLowerCase().includes(q) ||
      v.choferNombre?.toLowerCase().includes(q)
    );
  }

  abrirManifiesto(viaje: ViajeResponse) {
    this.viajeSeleccionado = viaje;
    this.modoVista = 'MANIFIESTO';
    this.cargarDetalleManifiesto(viaje.idViaje);
  }

  abrirManifiestoPorId(idViaje: number) {
    this.modoVista = 'MANIFIESTO';
    this.cargandoManifiesto = true;

    this.viajeService.obtenerViajePorId(idViaje).subscribe({
      next: (viaje) => {
        this.viajeSeleccionado = viaje;
        this.cargarDetalleManifiesto(idViaje);
      },
      error: (err) => {
        console.error('Error al obtener viaje:', err);
        this.cargandoManifiesto = false;
        this.cargarViajes();
      }
    });
  }

  cargarDetalleManifiesto(idViaje: number) {
    this.cargandoManifiesto = true;
    this.filtroPasajero = '';

    // Consultamos croquis y manifiesto en paralelo
    this.viajeService.getCroquis(idViaje).subscribe({
      next: (asientos) => {
        this.asientosCroquis = (asientos || []).filter(a => !a.esChofer && a.numero > 0);

        this.viajeService.obtenerManifiesto(idViaje).subscribe({
          next: (pasajes) => {
            this.pasajesManifiesto = pasajes || [];
            this.construirFilasManifiesto();
            this.cargandoManifiesto = false;
            this.cdr.detectChanges();
          },
          error: (err) => {
            console.error('Error al obtener pasajes manifiesto:', err);
            // Fallback usando los datos embebidos en el croquis
            this.pasajesManifiesto = [];
            this.construirFilasManifiesto();
            this.cargandoManifiesto = false;
            this.cdr.detectChanges();
          }
        });
      },
      error: (err) => {
        console.error('Error al obtener croquis:', err);
        this.cargandoManifiesto = false;
        this.cdr.detectChanges();
      }
    });
  }

  construirFilasManifiesto() {
    // Si tenemos croquis, listamos cada asiento de 1 a N
    const filas: FilaManifiesto[] = [];
    const total = this.asientosCroquis.length > 0 
      ? this.asientosCroquis.length 
      : (this.viajeSeleccionado?.totalAsientos || 15);

    for (let num = 1; num <= total; num++) {
      const asiento = this.asientosCroquis.find(a => a.numero === num);
      const pasaje = this.pasajesManifiesto.find(p => p.numeroAsiento === num);

      if (pasaje) {
        filas.push({
          numeroAsiento: num,
          nombrePasajero: pasaje.nombrePasajero,
          dniPasajero: pasaje.dniPasajero,
          telefono: '---',
          precio: pasaje.precio || this.viajeSeleccionado?.precio || 10,
          estado: 'ASIGNADO'
        });
      } else if (asiento && asiento.estado === 'OCUPADO' && asiento.nombrePasajero) {
        filas.push({
          numeroAsiento: num,
          nombrePasajero: asiento.nombrePasajero,
          dniPasajero: asiento.dniPasajero || '---',
          telefono: '---',
          precio: asiento.precio || this.viajeSeleccionado?.precio || 10,
          estado: 'ASIGNADO'
        });
      } else {
        filas.push({
          numeroAsiento: num,
          nombrePasajero: 'Disponible',
          dniPasajero: '---',
          telefono: '---',
          precio: this.viajeSeleccionado?.precio || 10,
          estado: 'DISPONIBLE'
        });
      }
    }

    this.filasManifiesto = filas;
  }

  get filasFiltradas(): FilaManifiesto[] {
    if (!this.filtroPasajero?.trim()) return this.filasManifiesto;
    const q = this.filtroPasajero.toLowerCase().trim();
    return this.filasManifiesto.filter(f => 
      f.nombrePasajero.toLowerCase().includes(q) ||
      f.dniPasajero.includes(q) ||
      f.numeroAsiento.toString() === q
    );
  }

  get totalAsignados(): number {
    return this.filasManifiesto.filter(f => f.estado === 'ASIGNADO').length;
  }

  get totalCapacidad(): number {
    return this.filasManifiesto.length || this.viajeSeleccionado?.totalAsientos || 15;
  }

  get porcentajeOcupacion(): number {
    if (this.totalCapacidad === 0) return 0;
    return Math.round((this.totalAsignados / this.totalCapacidad) * 100);
  }

  esAsientoOcupado(numero: number): boolean {
    const fila = this.filasManifiesto.find(f => f.numeroAsiento === numero);
    return fila?.estado === 'ASIGNADO';
  }

  volverAListaViajes() {
    this.modoVista = 'LISTA_VIAJES';
    this.viajeSeleccionado = null;
    this.filasManifiesto = [];
    this.cargarViajes();
  }

  irAVenderPasaje(idViaje?: number) {
    const id = idViaje || this.viajeSeleccionado?.idViaje;
    if (id) {
      this.router.navigate(['/venta-pasajes', id]);
    }
  }

  imprimirManifiesto() {
    window.print();
  }
}
