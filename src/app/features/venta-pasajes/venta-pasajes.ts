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
  cargandoDniEdicion: boolean = false;
  errorDniEdicion: string = '';

  // Layout del croquis fiel a la imagen de referencia y al tipo de combi (15 o 18 asientos):
  // Col 1: PILOTO | 3 | 6 | 9  | (12) | 12/15 (fondo)
  // Col 2: vacío  | 4 | 7 | 10 | (13) | 13/16 (fondo)
  // Col 3: 1      | 5 | PASILLO| (PAS)| 14/17 (fondo)
  // Col 4: 2      | PUERTA | 8 | 11 | (14) | 15/18 (fondo)
  get estructuraCroquis() {
    const numeros = this.asientos.map(a => a.numero).sort((a, b) => a - b);
    const total = numeros.length > 0 ? Math.max(...numeros) : 15;

    // 1. Cabina: asientos 1 y 2
    const cabina = [1, 2].filter(n => numeros.includes(n));

    // 2. Fila detrás de cabina / acceso: asientos 3, 4, 5 (col 1, 2, 3) y col 4 es PUERTA
    const filaPuerta = [3, 4, 5].filter(n => numeros.includes(n));

    // 3. Última fila del fondo: siempre 4 asientos corridos de lado a lado
    // Si total es 15 -> 12, 13, 14, 15
    // Si total es 18 -> 15, 16, 17, 18
    const cantFondo = Math.min(4, Math.max(1, total - 5));
    const inicioFondo = total - cantFondo + 1;
    const filaFondo: number[] = [];
    for (let i = inicioFondo; i <= total; i++) {
      if (numeros.includes(i)) filaFondo.push(i);
    }

    // 4. Filas intermedias: asientos entre 6 y inicioFondo - 1
    // Cada fila tiene [izq1, izq2, PASILLO, der]
    const intermediosNums = numeros.filter(n => n >= 6 && n < inicioFondo);
    const filasIntermedias: { izq1?: number; izq2?: number; der?: number }[] = [];

    for (let i = 0; i < intermediosNums.length; i += 3) {
      filasIntermedias.push({
        izq1: intermediosNums[i],
        izq2: intermediosNums[i + 1],
        der: intermediosNums[i + 2]
      });
    }

    return {
      cabina,
      filaPuerta,
      filasIntermedias,
      filaFondo
    };
  }

  // Getters para compatibilidad con plantillas previas
  get filasIzquierda(): number[][] {
    return this.estructuraCroquis.filasIntermedias
      .map(f => [f.izq1, f.izq2].filter((n): n is number => n !== undefined && n !== null));
  }

  get filasDerecha(): number[][] {
    return this.estructuraCroquis.filasIntermedias
      .map(f => [f.der].filter((n): n is number => n !== undefined && n !== null));
  }

  ngOnInit() {
    this.idViaje = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idViaje) {
      this.cargarViaje();
      this.cargarCroquis();
    }
  }

  //ESTO ESTÁ MODIFICADO XD
  cargarViaje() {
    this.viajeService.obtenerViajePorId(this.idViaje).subscribe({
      next: (data) => {
        // AGREGADO: Normalización de fechaHora reemplazando espacios por 'T' para formato ISO
        if (data && data.fechaHora) {
          data.fechaHora = data.fechaHora.toString().replace(' ', 'T');
        }

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

  // Busca un asiento por número de asiento
  getAsiento(numero: number): Asiento | undefined {
    return this.asientos.find(a => a.numero === numero);
  }

  // Retorna las clases CSS para un asiento
  getClaseAsiento(asiento: Asiento): { [key: string]: boolean } {
    return {
      'libre': asiento.estado === 'LIBRE',
      'ocupado': asiento.estado === 'OCUPADO',
      'seleccionado': this.estaSeleccionado(asiento)
    };
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
        if (res && (res.nombres || res.nombreCompleto || res.cliente)) {
          const nombres = (res.nombres || '').trim();
          const apPaterno = (res.apellido_paterno || res.apellidoPaterno || '').trim();
          const apMaterno = (res.apellido_materno || res.apellidoMaterno || '').trim();
          let apellidos = [apPaterno, apMaterno].filter(Boolean).join(' ').trim();

          // Si apellidos vinieron vacíos pero cliente/nombreCompleto sí existe
          if (!apellidos && (res.cliente || res.nombreCompleto)) {
            const full = (res.cliente || res.nombreCompleto).trim();
            if (nombres && full.includes(nombres)) {
              apellidos = full.replace(nombres, '').trim();
            }
          }

          p.nombre = nombres || res.cliente || res.nombreCompleto || '';
          p.apellido = apellidos;
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

  // Búsqueda de DNI en modo edición del asiento ocupado
  buscarDniEdicion() {
    this.errorDniEdicion = '';
    if (!this.dniPasajeroOcupado || this.dniPasajeroOcupado.length !== 8) return;

    this.cargandoDniEdicion = true;
    this.cdr.detectChanges();

    this.viajeService.consultarDni(this.dniPasajeroOcupado).subscribe({
      next: (res: any) => {
        this.cargandoDniEdicion = false;
        if (res && (res.nombres || res.nombreCompleto || res.cliente)) {
          const nombres = (res.nombres || '').trim();
          const apPaterno = (res.apellido_paterno || res.apellidoPaterno || '').trim();
          const apMaterno = (res.apellido_materno || res.apellidoMaterno || '').trim();
          let apellidos = [apPaterno, apMaterno].filter(Boolean).join(' ').trim();
          if (!apellidos && (res.cliente || res.nombreCompleto)) {
            const full = (res.cliente || res.nombreCompleto).trim();
            if (nombres && full.includes(nombres)) apellidos = full.replace(nombres, '').trim();
          }
          this.nombrePasajeroOcupado = [nombres || res.cliente || res.nombreCompleto, apellidos]
            .filter(Boolean).join(' ').trim();
          this.errorDniEdicion = '';
        } else {
          this.errorDniEdicion = 'No encontrado en RENIEC. Ingrese el nombre manualmente.';
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.cargandoDniEdicion = false;
        this.errorDniEdicion = 'Sin conexión a RENIEC. Ingrese el nombre manualmente.';
        this.cdr.detectChanges();
      }
    });
  }

  // Acciones sobre asiento ocupado existente
  cerrarDetalleOcupado() {
    this.asientoOcupadoSeleccionado = null;
    this.modoEdicionOcupado = false;
    this.errorDniEdicion = '';
    this.cargandoDniEdicion = false;
  }

  activarEdicionOcupado() {
    this.modoEdicionOcupado = true;
    this.errorDniEdicion = '';
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