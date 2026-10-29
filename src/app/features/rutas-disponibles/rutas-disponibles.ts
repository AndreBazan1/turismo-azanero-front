import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { forkJoin } from 'rxjs';
import { ViajeService } from '../../core/services/viaje';
import { AuthService } from '../../core/services/auth.service';
import { ViajeRequest, Vehiculo, Chofer, Ciudad } from '../../core/models/viaje.model';

@Component({
  selector: 'app-rutas-disponibles',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './rutas-disponibles.html',
  styleUrl: './rutas-disponibles.css'
})
export class RutasDisponiblesComponent implements OnInit {
  private viajeService = inject(ViajeService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cd = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  viajes: any[] = [];
  cargando: boolean = false;

  // Filtros de fecha
  hoyStr: string = new Date().toISOString().split('T')[0];
  fechaFiltro: string = new Date().toISOString().split('T')[0];
  mostrarTodos: boolean = false;

  // Estado del modal "Nueva Ruta"
  mostrarModal: boolean = false;
  guardando: boolean = false;
  mensajeExito: string = '';
  mensajeError: string = '';

  // Datos para los selects del modal
  ciudades: Ciudad[] = [];
  vehiculos: Vehiculo[] = [];
  choferes: Chofer[] = [];

  // Formulario del modal
  nuevaRuta: {
    ciudadOrigenId: number | null;
    ciudadDestinoId: number | null;
    vehiculoId: number | null;
    choferId: number | null;
    fecha: string;
    horaLocal: string;
    precio: number;
  } = {
    ciudadOrigenId: null,
    ciudadDestinoId: null,
    vehiculoId: null,
    choferId: null,
    fecha: new Date().toISOString().split('T')[0],
    horaLocal: '',
    precio: 10.00
  };

  get esAdmin(): boolean {
    return this.authService.currentUser()?.rol === 'ADMINISTRADOR';
  }

  ngOnInit() {
    this.cargarViajes();
    if (this.esAdmin) {
      this.cargarDatosModal(() => {
        this.escucharQueryParams();
      });
    }
  }

  cargarViajes() {
    this.cargando = true;
    const fecha = this.mostrarTodos ? undefined : this.fechaFiltro;
    this.viajeService.listarProgramados(fecha, this.mostrarTodos).subscribe({
      next: (data) => {
        this.viajes = data.map((v: any) => ({
          ...v,
          precio: v.precio ?? 10.00
        }));
        this.cargando = false;
        this.cd.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar salidas:', err);
        this.cargando = false;
        this.cd.detectChanges();
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

  cargarDatosModal(onReady?: () => void) {
    forkJoin({
      ciudades: this.viajeService.listarCiudades(),
      vehiculos: this.viajeService.listarVehiculos(),
      choferes: this.viajeService.listarChoferes()
    }).subscribe({
      next: (res) => {
        // Deduplicación estricta de ciudades por nombre
        const unicas: Ciudad[] = [];
        const vistas = new Set<string>();
        for (const c of (res.ciudades || [])) {
          const nombreNorm = (c.nombre || (c as any).nombreCiudad || '').trim().toLowerCase();
          if (nombreNorm && !vistas.has(nombreNorm)) {
            vistas.add(nombreNorm);
            unicas.push(c);
          }
        }
        this.ciudades = unicas;

        const validosV = (res.vehiculos || []).filter(v =>
          !v.estado || ['OPERATIVO', 'ACTIVO', 'DISPONIBLE'].includes(v.estado.toUpperCase())
        );
        this.vehiculos = validosV.length > 0 ? validosV : (res.vehiculos || []);

        const validosC = (res.choferes || []).filter(c =>
          !c.estado || ['ACTIVO', 'DISPONIBLE'].includes(c.estado.toUpperCase())
        );
        this.choferes = validosC.length > 0 ? validosC : (res.choferes || []);

        this.cd.detectChanges();
        if (onReady) onReady();
      },
      error: (err) => {
        console.error('Error al cargar datos auxiliares para modal:', err);
        if (onReady) onReady();
      }
    });
  }

  escucharQueryParams() {
    this.route.queryParams.subscribe(params => {
      if (params['abrirModal'] === 'true') {
        const vId = params['vehiculoId'] ? Number(params['vehiculoId']) : null;
        this.abrirModal(vId);
      }
    });
  }

  onVehiculoChange() {
    if (!this.nuevaRuta.vehiculoId) return;
    const vId = Number(this.nuevaRuta.vehiculoId);
    const v = this.vehiculos.find(item => item.idVehiculo === vId);
    if (v) {
      if (v.idChofer) {
        this.nuevaRuta.choferId = v.idChofer;
      } else if (v.choferAsignado && v.choferAsignado !== 'Por asignar') {
        const match = this.choferes.find(c =>
          c.nombreCompleto.toLowerCase().trim() === v.choferAsignado?.toLowerCase().trim()
        );
        if (match) {
          this.nuevaRuta.choferId = match.idChofer;
        }
      }
    }
    this.cd.detectChanges();
  }

  abrirModal(vehiculoIdPreseleccionado?: number | null) {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.nuevaRuta = {
      ciudadOrigenId: null,
      ciudadDestinoId: null,
      vehiculoId: vehiculoIdPreseleccionado || null,
      choferId: null,
      fecha: this.fechaFiltro || this.hoyStr,
      horaLocal: '',
      precio: 10.00
    };
    if (vehiculoIdPreseleccionado) {
      this.onVehiculoChange();
    }
    this.mostrarModal = true;
    this.cd.detectChanges();
  }

  cerrarModal() {
    this.mostrarModal = false;
    // Limpiar queryParams para evitar re-apertura accidental
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {},
      replaceUrl: true
    });
  }

  guardarRuta() {
    const { ciudadOrigenId, ciudadDestinoId, vehiculoId, choferId, fecha, horaLocal, precio } = this.nuevaRuta;
    if (!ciudadOrigenId || !ciudadDestinoId || !vehiculoId || !choferId || !horaLocal || precio <= 0) {
      this.mensajeError = 'Por favor completa todos los campos.';
      return;
    }

    const fechaBase = fecha || this.hoyStr;
    const fechaHora = `${fechaBase}T${horaLocal}:00`;

    const request: ViajeRequest = {
      ciudadOrigenId,
      ciudadDestinoId,
      vehiculoId,
      choferId,
      fechaHora,
      precio
    };

    this.guardando = true;
    this.mensajeError = '';

    this.viajeService.crearViaje(request).subscribe({
      next: () => {
        this.guardando = false;
        this.mensajeExito = '¡Ruta registrada correctamente!';
        this.cargarViajes();
        setTimeout(() => this.cerrarModal(), 1200);
      },
      error: (err) => {
        this.guardando = false;
        this.mensajeError = 'Error al guardar la ruta. Intenta nuevamente.';
        console.error(err);
      }
    });
  }

  seleccionarViaje(idViaje: number) {
    this.router.navigate(['/venta-pasajes', idViaje]);
  }

  verManifiesto(idViaje: number) {
    this.router.navigate(['/pasajeros', idViaje]);
  }

  getEstadoViaje(fechaHoraStr: string, libres: number): { texto: string; clase: string } {
    if (!fechaHoraStr) return { texto: 'A Tiempo', clase: 'badge-activo' };
    const fechaViaje = new Date(fechaHoraStr);
    const ahora = new Date();
    const difMinutos = (ahora.getTime() - fechaViaje.getTime()) / (1000 * 60);

    if (difMinutos > 120) {
      return { texto: 'Finalizado', clase: 'badge-finalizado' };
    } else if (difMinutos > 0) {
      return { texto: 'En Ruta', clase: 'badge-en-ruta' };
    } else if (difMinutos > -20 || libres === 0) {
      return { texto: 'Embarcando', clase: 'badge-embarque' };
    } else {
      return { texto: 'A Tiempo', clase: 'badge-activo' };
    }
  }

  haPartio(fechaHoraStr: string): boolean {
    if (!fechaHoraStr) return false;
    const fechaViaje = new Date(fechaHoraStr);
    const ahora = new Date();
    return ahora.getTime() > (fechaViaje.getTime() + 10 * 60 * 1000);
  }
}