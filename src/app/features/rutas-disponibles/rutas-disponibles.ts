import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
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
  private cd = inject(ChangeDetectorRef);
  authService = inject(AuthService);

  viajes: any[] = [];
  cargando: boolean = false;

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
    horaLocal: string;
    precio: number;
  } = {
    ciudadOrigenId: null,
    ciudadDestinoId: null,
    vehiculoId: null,
    choferId: null,
    horaLocal: '',
    precio: 0
  };

  get esAdmin(): boolean {
    return this.authService.currentUser()?.rol === 'ADMINISTRADOR';
  }

  ngOnInit() {
    this.cargarViajes();
    if (this.esAdmin) {
      this.cargarDatosModal();
    }
  }

  cargarViajes() {
    this.cargando = true;
    this.viajeService.listarProgramados().subscribe({
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

  cargarDatosModal() {
    this.viajeService.listarCiudades().subscribe({
      next: (d) => {
        this.ciudades = d || [];
        this.cd.detectChanges();
      }
    });

    this.viajeService.listarVehiculos().subscribe({
      next: (d) => {
        const validos = (d || []).filter(v => 
          !v.estado || ['OPERATIVO', 'ACTIVO', 'DISPONIBLE'].includes(v.estado.toUpperCase())
        );
        this.vehiculos = validos.length > 0 ? validos : (d || []);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar vehículos para modal:', err)
    });

    this.viajeService.listarChoferes().subscribe({
      next: (d) => {
        const validos = (d || []).filter(c => 
          !c.estado || ['ACTIVO', 'DISPONIBLE'].includes(c.estado.toUpperCase())
        );
        this.choferes = validos.length > 0 ? validos : (d || []);
        this.cd.detectChanges();
      },
      error: (err) => console.error('Error al cargar choferes para modal:', err)
    });
  }

  abrirModal() {
    this.mensajeExito = '';
    this.mensajeError = '';
    this.nuevaRuta = { ciudadOrigenId: null, ciudadDestinoId: null, vehiculoId: null, choferId: null, horaLocal: '', precio: 0 };
    this.mostrarModal = true;
  }

  cerrarModal() {
    this.mostrarModal = false;
  }

  guardarRuta() {
    const { ciudadOrigenId, ciudadDestinoId, vehiculoId, choferId, horaLocal, precio } = this.nuevaRuta;
    if (!ciudadOrigenId || !ciudadDestinoId || !vehiculoId || !choferId || !horaLocal || precio <= 0) {
      this.mensajeError = 'Por favor completa todos los campos.';
      return;
    }

    const hoy = new Date().toISOString().split('T')[0];
    const fechaHora = `${hoy}T${horaLocal}:00`;

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
}