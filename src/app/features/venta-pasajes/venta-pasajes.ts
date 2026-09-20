import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { ViajeService } from '../../core/services/viaje';
import { Asiento, ViajeResponse, PasajeroForm, VenderPasajeRequest } from '../../core/models/viaje.model';

@Component({
  selector: 'app-venta-pasajes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './venta-pasajes.html',
  styleUrl: './venta-pasajes.css'
})
export class VentaPasajes implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private viajeService = inject(ViajeService);
  private cdr = inject(ChangeDetectorRef);

  idViaje: number = 0;
  viaje: ViajeResponse | null = null;
  asientos: Asiento[] = [];
  cargandoCroquis: boolean = true;

  // Paso del flujo: 'CROQUIS' | 'PAGO' | 'EXITO'
  pasoActual: 'CROQUIS' | 'PAGO' | 'EXITO' = 'CROQUIS';

  // Selección múltiple de asientos
  asientosSeleccionados: Asiento[] = [];
  precioPasaje: number = 10.00;

  // Paso 2: Información de pasajeros y pago
  pasajeros: PasajeroForm[] = [];
  metodoPago: 'EFECTIVO' | 'YAPE' = 'EFECTIVO';
  procesandoPago: boolean = false;
  mensajeErrorPago: string = '';
  boletosEmitidos: any[] = [];

  // Modo inspección/edición individual para asiento ocupado
  asientoOcupadoSeleccionado: Asiento | null = null;
  modoEdicionOcupado: boolean = false;
  dniPasajeroOcupado: string = '';
  nombrePasajeroOcupado: string = '';

  ngOnInit() {
    this.idViaje = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idViaje) {
      this.cargarViaje();
      this.cargarCroquis();
    }
  }

  cargarViaje() {
    this.viajeService.obtenerViajePorId(this.idViaje).subscribe({
      next: (data) => {
        this.viaje = data;
        if (data.precio && data.precio > 0) {
          this.precioPasaje = data.precio;
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar datos del viaje:', err);
      }
    });
  }

  cargarCroquis() {
    this.cargandoCroquis = true;
    this.viajeService.getCroquis(this.idViaje).subscribe({
      next: (data) => {
        this.asientos = data.filter(asiento => !asiento.esChofer && asiento.numero > 0);
        this.cargandoCroquis = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al obtener croquis:', err);
        this.cargandoCroquis = false;
        this.cdr.detectChanges();
      }
    });
  }

  // Comprueba si un asiento está en la lista de seleccionados
  estaSeleccionado(asiento: Asiento): boolean {
    return this.asientosSeleccionados.some(a => a.idAsiento === asiento.idAsiento);
  }

  // Alterna selección múltiple de asientos
  toggleAsiento(asiento: Asiento) {
    if (asiento.estado === 'OCUPADO') {
      // Si hace click en ocupado y no tiene libres seleccionados, muestra detalle del boleto
      if (this.asientosSeleccionados.length === 0) {
        this.asientoOcupadoSeleccionado = asiento;
        this.dniPasajeroOcupado = (asiento as any).dniPasajero || (asiento as any).dni || '';
        this.nombrePasajeroOcupado = (asiento as any).nombrePasajero || (asiento as any).pasajero || '';
        this.modoEdicionOcupado = false;
      }
      return;
    }

    // Si había un ocupado seleccionado, lo deselecciona
    this.asientoOcupadoSeleccionado = null;

    const index = this.asientosSeleccionados.findIndex(a => a.idAsiento === asiento.idAsiento);
    if (index >= 0) {
      this.asientosSeleccionados.splice(index, 1);
    } else {
      this.asientosSeleccionados.push(asiento);
    }

    // Ordenar por número de asiento para orden visual
    this.asientosSeleccionados.sort((a, b) => a.numero - b.numero);
    this.cdr.detectChanges();
  }

  // Total a pagar acumulado
  get totalPagar(): number {
    return this.asientosSeleccionados.length * this.precioPasaje;
  }

  get listaNumerosAsientos(): string {
    return this.asientosSeleccionados.map(a => a.numero).join(', ');
  }

  // Clic en botón "ACEPTAR" del croquis -> pasa a ventana de pasajeros y modo de pago
  continuarAPago() {
    if (this.asientosSeleccionados.length === 0) return;

    this.mensajeErrorPago = '';
    // Mapear cada asiento a su formulario de datos
    this.pasajeros = this.asientosSeleccionados.map(asiento => {
      // Si ya existía en la lista de pasajeros temporal, preserva datos
      const existente = this.pasajeros.find(p => p.asiento.idAsiento === asiento.idAsiento);
      if (existente) return existente;

      return {
        asiento,
        numeroAsiento: asiento.numero,
        tipoDocumento: 'DNI',
        dniPasajero: '',
        nombre: '',
        apellido: '',
        telefono: '',
        cargandoReniec: false,
        errorReniec: ''
      };
    });

    this.pasoActual = 'PAGO';
    this.cdr.detectChanges();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  volverACroquis() {
    this.pasoActual = 'CROQUIS';
    this.cdr.detectChanges();
  }

  // Búsqueda en RENIEC por pasajero individual
  buscarDniPasajero(p: PasajeroForm) {
    p.errorReniec = '';
    if (!p.dniPasajero || p.dniPasajero.length !== 8) {
      return;
    }

    p.cargandoReniec = true;
    this.cdr.detectChanges();

    this.viajeService.consultarDni(p.dniPasajero).subscribe({
      next: (res: any) => {
        p.cargandoReniec = false;
        if (res && (res.nombres || res.nombreCompleto)) {
          p.nombre = res.nombres || res.nombreCompleto;
          p.apellido = [res.apellidoPaterno, res.apellidoMaterno].filter(Boolean).join(' ');
        } else {
          p.errorReniec = 'No encontrado en RENIEC. Ingrese el nombre manualmente.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        p.cargandoReniec = false;
        p.errorReniec = 'Sin conexión a RENIEC. Ingrese los nombres manualmente.';
        this.cdr.detectChanges();
      }
    });
  }

  // Validar antes de pagar
  get formularioValido(): boolean {
    if (this.pasajeros.length === 0) return false;
    return this.pasajeros.every(p => 
      p.dniPasajero?.trim().length === 8 && 
      p.nombre?.trim().length > 0
    );
  }

  // Confirmar y emitir boletos para todos los asientos seleccionados
  confirmarPago() {
    this.mensajeErrorPago = '';

    for (const p of this.pasajeros) {
      if (!p.dniPasajero || p.dniPasajero.trim().length !== 8) {
        this.mensajeErrorPago = `El pasajero del Asiento N° ${p.numeroAsiento} debe tener un DNI de 8 dígitos.`;
        return;
      }
      if (!p.nombre || p.nombre.trim().length === 0) {
        this.mensajeErrorPago = `El pasajero del Asiento N° ${p.numeroAsiento} requiere al menos un nombre.`;
        return;
      }
    }

    this.procesandoPago = true;
    this.cdr.detectChanges();

    // Crear peticiones para cada pasajero
    const requests$ = this.pasajeros.map(p => {
      const nombreCompleto = [p.nombre.trim(), p.apellido?.trim()].filter(Boolean).join(' ');
      const req: VenderPasajeRequest = {
        viajeId: this.idViaje,
        numeroAsiento: p.numeroAsiento,
        nombrePasajero: nombreCompleto,
        dniPasajero: p.dniPasajero.trim(),
        precio: this.precioPasaje
      };
      return this.viajeService.venderPasaje(req);
    });

    forkJoin(requests$).subscribe({
      next: (respuestas) => {
        this.procesandoPago = false;
        this.boletosEmitidos = respuestas;
        this.pasoActual = 'EXITO';
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.procesandoPago = false;
        this.mensajeErrorPago = 'Error al procesar la venta: ' + (err.error?.message || 'Error en el servidor');
        console.error('Error al vender pasajes:', err);
        this.cdr.detectChanges();
      }
    });
  }

  // Navegación post-venta
  irAManifiesto() {
    this.router.navigate(['/pasajeros', this.idViaje]);
  }

  volverARutas() {
    this.router.navigate(['/rutas']);
  }

  nuevaVenta() {
    this.pasoActual = 'CROQUIS';
    this.asientosSeleccionados = [];
    this.pasajeros = [];
    this.boletosEmitidos = [];
    this.cargarCroquis();
  }

  // Acciones sobre asiento ocupado existente
  cerrarDetalleOcupado() {
    this.asientoOcupadoSeleccionado = null;
    this.modoEdicionOcupado = false;
  }

  activarEdicionOcupado() {
    this.modoEdicionOcupado = true;
  }

  guardarEdicionOcupado() {
    if (!this.asientoOcupadoSeleccionado || !this.dniPasajeroOcupado || !this.nombrePasajeroOcupado) return;

    const req: VenderPasajeRequest = {
      viajeId: this.idViaje,
      numeroAsiento: this.asientoOcupadoSeleccionado.numero,
      nombrePasajero: this.nombrePasajeroOcupado,
      dniPasajero: this.dniPasajeroOcupado,
      precio: this.precioPasaje
    };

    this.viajeService.venderPasaje(req).subscribe({
      next: () => {
        alert('Datos del pasajero actualizados correctamente');
        this.cerrarDetalleOcupado();
        this.cargarCroquis();
      },
      error: (err) => alert('Error al actualizar: ' + (err.error?.message || err.message))
    });
  }
}