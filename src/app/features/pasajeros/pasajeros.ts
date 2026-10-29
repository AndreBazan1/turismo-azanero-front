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

  // Filtros por día
  hoyStr: string = new Date().toISOString().split('T')[0];
  fechaFiltro: string = new Date().toISOString().split('T')[0];
  mostrarTodos: boolean = false;

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
    const f = this.mostrarTodos ? undefined : this.fechaFiltro;
    this.viajeService.listarProgramados(f, this.mostrarTodos).subscribe({
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

  filtrarHoy() {
    this.mostrarTodos = false;
    this.fechaFiltro = this.hoyStr;
    this.cargarViajes();
  }

  filtrarAyer() {
    this.mostrarTodos = false;
    const d = new Date();
    d.setDate(d.getDate() - 1);
    this.fechaFiltro = d.toISOString().split('T')[0];
    this.cargarViajes();
  }

  filtrarManana() {
    this.mostrarTodos = false;
    const d = new Date();
    d.setDate(d.getDate() + 1);
    this.fechaFiltro = d.toISOString().split('T')[0];
    this.cargarViajes();
  }

  filtrarTodos() {
    this.mostrarTodos = true;
    this.cargarViajes();
  }

  cambiarFecha(nuevaFecha: string) {
    if (nuevaFecha) {
      this.mostrarTodos = false;
      this.fechaFiltro = nuevaFecha;
      this.cargarViajes();
    }
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

  getFilaManifiesto(numero: number): FilaManifiesto | undefined {
    return this.filasManifiesto.find(f => f.numeroAsiento === numero);
  }

  // Estructura idéntica al croquis de la combi para 15 y 18 asientos
  get estructuraCroquis() {
    const numeros = this.filasManifiesto.map(f => f.numeroAsiento).sort((a, b) => a - b);
    const total = numeros.length > 0 ? Math.max(...numeros) : (this.viajeSeleccionado?.totalAsientos || 15);

    const cabina = [1, 2].filter(n => numeros.includes(n));
    const filaPuerta = [3, 4, 5].filter(n => numeros.includes(n));

    const cantFondo = Math.min(4, Math.max(1, total - 5));
    const inicioFondo = total - cantFondo + 1;
    const filaFondo: number[] = [];
    for (let i = inicioFondo; i <= total; i++) {
      if (numeros.includes(i)) filaFondo.push(i);
    }

    const intermediosNums = numeros.filter(n => n >= 6 && n < inicioFondo);
    const filasIntermedias: { izq1?: number; izq2?: number; der?: number }[] = [];

    for (let i = 0; i < intermediosNums.length; i += 3) {
      filasIntermedias.push({
        izq1: intermediosNums[i],
        izq2: intermediosNums[i + 1],
        der: intermediosNums[i + 2]
      });
    }

    return { cabina, filaPuerta, filasIntermedias, filaFondo };
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
    document.body.classList.add('imprimiendo-manifiesto');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('imprimiendo-manifiesto');
    }, 1000);
  }
}
