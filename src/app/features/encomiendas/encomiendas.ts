import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { EncomiendaService } from '../../core/services/encomienda.service';
import { ViajeService } from '../../core/services/viaje';
import { AuthService } from '../../core/services/auth.service';
import { EncomiendaRequest, EncomiendaResponse } from '../../core/models/encomienda.model';
import { Ciudad, ViajeResponse } from '../../core/models/viaje.model';

@Component({
  selector: 'app-encomiendas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './encomiendas.html',
  styleUrl: './encomiendas.css'
})
export class EncomiendasComponent implements OnInit {
  private encomiendaService = inject(EncomiendaService);
  private viajeService = inject(ViajeService);
  public authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  encomiendas: EncomiendaResponse[] = [];
  encomiendasFiltradas: EncomiendaResponse[] = [];
  cargando: boolean = true;
  error: string = '';

  // Filtros
  hoyStr: string = new Date().toISOString().split('T')[0];
  fechaFiltro: string = this.hoyStr;
  mostrarTodos: boolean = false;
  estadoFiltro: string = 'TODOS';
  busquedaTexto: string = '';

  // Modal Registro
  mostrarModalRegistro: boolean = false;
  guardando: boolean = false;
  mensajeModalError: string = '';

  ciudades: Ciudad[] = [];
  viajesDisponibles: ViajeResponse[] = [];

  // Formulario de nueva encomienda
  nuevaEncomienda: {
    remitenteNombre: string;
    remitenteDni: string;
    remitenteTelefono: string;
    destinatarioNombre: string;
    destinatarioDni: string;
    destinatarioTelefono: string;
    ciudadOrigenId: number | null;
    ciudadDestinoId: number | null;
    descripcion: string;
    peso: number;
    precio: number;
    pagoEstado: 'PAGADO' | 'POR_PAGAR';
    viajeId: number | null;
  } = {
    remitenteNombre: '',
    remitenteDni: '',
    remitenteTelefono: '',
    destinatarioNombre: '',
    destinatarioDni: '',
    destinatarioTelefono: '',
    ciudadOrigenId: null,
    ciudadDestinoId: null,
    descripcion: '',
    peso: 2.0,
    precio: 10.0,
    pagoEstado: 'PAGADO',
    viajeId: null
  };

  // Estados de consulta RENIEC
  buscandoDniRemitente: boolean = false;
  buscandoDniDestinatario: boolean = false;
  private ultimoDniConsultadoRemitente: string = '';
  private ultimoDniConsultadoDestinatario: string = '';

  // Modal Boleta / Pegatina
  mostrarModalBoleta: boolean = false;
  encomiendaSeleccionada: EncomiendaResponse | null = null;

  // Modal Asignar Combi
  mostrarModalAsignar: boolean = false;
  encomiendaParaAsignar: EncomiendaResponse | null = null;
  viajeSeleccionadoParaAsignar: number | null = null;

  ngOnInit(): void {
    this.cargarDatosIniciales();
  }

  cargarDatosIniciales(): void {
    this.cargando = true;
    this.encomiendaService.listarTodas().subscribe({
      next: (data) => {
        this.encomiendas = data || [];
        this.aplicarFiltros();
        this.cargando = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar encomiendas:', err);
        this.error = 'No se pudieron cargar las encomiendas.';
        this.cargando = false;
        this.cdr.detectChanges();
      }
    });

    // Cargar ciudades para el modal
    this.viajeService.listarCiudades().subscribe({
      next: (res) => {
        const unicasMap = new Map<string, Ciudad>();
        (res || []).forEach(c => {
          const key = (c.nombre || '').trim().toLowerCase();
          if (key && !unicasMap.has(key)) {
            unicasMap.set(key, c);
          }
        });
        this.ciudades = Array.from(unicasMap.values());
        if (this.ciudades.length >= 2) {
          this.nuevaEncomienda.ciudadOrigenId = this.ciudades[0].idCiudad;
          this.nuevaEncomienda.ciudadDestinoId = this.ciudades[1].idCiudad;
        }
      }
    });

    // Cargar salidas de hoy para poder asociar encomiendas a combis
    this.viajeService.listarProgramados(this.hoyStr).subscribe({
      next: (viajes) => {
        this.viajesDisponibles = viajes || [];
      }
    });
  }

  aplicarFiltros(): void {
    let filtradas = [...this.encomiendas];

    // Filtro de fecha
    if (!this.mostrarTodos && this.fechaFiltro) {
      filtradas = filtradas.filter(e => {
        if (!e.fechaRegistro) return false;
        return e.fechaRegistro.startsWith(this.fechaFiltro);
      });
    }

    // Filtro de estado
    if (this.estadoFiltro !== 'TODOS') {
      filtradas = filtradas.filter(e => e.estado === this.estadoFiltro);
    }

    // Buscador por texto
    if (this.busquedaTexto.trim()) {
      const q = this.busquedaTexto.toLowerCase().trim();
      filtradas = filtradas.filter(e =>
        (e.codigoSeguimiento && e.codigoSeguimiento.toLowerCase().includes(q)) ||
        (e.remitenteDni && e.remitenteDni.includes(q)) ||
        (e.remitenteNombre && e.remitenteNombre.toLowerCase().includes(q)) ||
        (e.destinatarioDni && e.destinatarioDni.includes(q)) ||
        (e.destinatarioNombre && e.destinatarioNombre.toLowerCase().includes(q)) ||
        (e.descripcion && e.descripcion.toLowerCase().includes(q))
      );
    }

    this.encomiendasFiltradas = filtradas;
  }

  filtrarHoy(): void {
    this.mostrarTodos = false;
    this.fechaFiltro = this.hoyStr;
    this.aplicarFiltros();
  }

  filtrarAyer(): void {
    this.mostrarTodos = false;
    const ayer = new Date();
    ayer.setDate(ayer.getDate() - 1);
    this.fechaFiltro = ayer.toISOString().split('T')[0];
    this.aplicarFiltros();
  }

  filtrarTodos(): void {
    this.mostrarTodos = true;
    this.aplicarFiltros();
  }

  cambiarFecha(f: string): void {
    this.fechaFiltro = f;
    this.mostrarTodos = false;
    this.aplicarFiltros();
  }

  // Extraer nombre completo del DNI soportando todas las variantes de respuesta
  private extraerNombreCompleto(res: any): string {
    if (!res) return '';
    if (res.nombreCompleto && typeof res.nombreCompleto === 'string' && res.nombreCompleto.trim()) {
      return res.nombreCompleto.trim();
    }
    if (res.cliente && typeof res.cliente === 'string' && res.cliente.trim()) {
      return res.cliente.trim();
    }
    const nombres = (res.nombres || '').trim();
    const apPaterno = (res.apellidoPaterno || res.apellido_paterno || '').trim();
    const apMaterno = (res.apellidoMaterno || res.apellido_materno || '').trim();
    const apellidos = [apPaterno, apMaterno].filter(Boolean).join(' ').trim();
    return [nombres, apellidos].filter(Boolean).join(' ').trim();
  }

  // Evento automático al escribir DNI del remitente
  onDniRemitenteInput(): void {
    const digitos = (this.nuevaEncomienda.remitenteDni || '').replace(/\D/g, '').slice(0, 8);
    this.nuevaEncomienda.remitenteDni = digitos;
    if (digitos.length === 8 && digitos !== this.ultimoDniConsultadoRemitente) {
      this.consultarDniRemitente();
    }
  }

  // Evento automático al escribir DNI del destinatario
  onDniDestinatarioInput(): void {
    const digitos = (this.nuevaEncomienda.destinatarioDni || '').replace(/\D/g, '').slice(0, 8);
    this.nuevaEncomienda.destinatarioDni = digitos;
    if (digitos.length === 8 && digitos !== this.ultimoDniConsultadoDestinatario) {
      this.consultarDniDestinatario();
    }
  }

  // RENIEC API para Remitente
  consultarDniRemitente(): void {
    const dni = (this.nuevaEncomienda.remitenteDni || '').trim();
    if (dni.length !== 8 || this.buscandoDniRemitente) return;

    this.ultimoDniConsultadoRemitente = dni;
    this.buscandoDniRemitente = true;
    this.viajeService.consultarDni(dni).subscribe({
      next: (res: any) => {
        this.buscandoDniRemitente = false;
        const nombre = this.extraerNombreCompleto(res);
        if (nombre) {
          this.nuevaEncomienda.remitenteNombre = nombre;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoDniRemitente = false;
        this.cdr.detectChanges();
      }
    });
  }

  // RENIEC API para Destinatario
  consultarDniDestinatario(): void {
    const dni = (this.nuevaEncomienda.destinatarioDni || '').trim();
    if (dni.length !== 8 || this.buscandoDniDestinatario) return;

    this.ultimoDniConsultadoDestinatario = dni;
    this.buscandoDniDestinatario = true;
    this.viajeService.consultarDni(dni).subscribe({
      next: (res: any) => {
        this.buscandoDniDestinatario = false;
        const nombre = this.extraerNombreCompleto(res);
        if (nombre) {
          this.nuevaEncomienda.destinatarioNombre = nombre;
        }
        this.cdr.detectChanges();
      },
      error: () => {
        this.buscandoDniDestinatario = false;
        this.cdr.detectChanges();
      }
    });
  }

  abrirModalRegistro(): void {
    this.mensajeModalError = '';
    this.ultimoDniConsultadoRemitente = '';
    this.ultimoDniConsultadoDestinatario = '';
    this.nuevaEncomienda = {
      remitenteNombre: '',
      remitenteDni: '',
      remitenteTelefono: '',
      destinatarioNombre: '',
      destinatarioDni: '',
      destinatarioTelefono: '',
      ciudadOrigenId: this.ciudades[0]?.idCiudad || null,
      ciudadDestinoId: this.ciudades[1]?.idCiudad || null,
      descripcion: '',
      peso: 2.0,
      precio: 10.0,
      pagoEstado: 'PAGADO',
      viajeId: null
    };
    this.mostrarModalRegistro = true;
  }

  cerrarModalRegistro(): void {
    this.mostrarModalRegistro = false;
  }

  guardarEncomienda(): void {
    const {
      remitenteNombre, remitenteDni, remitenteTelefono,
      destinatarioNombre, destinatarioDni, destinatarioTelefono,
      ciudadOrigenId, ciudadDestinoId, descripcion, peso, precio, pagoEstado, viajeId
    } = this.nuevaEncomienda;

    if (!remitenteNombre.trim() || !remitenteDni.trim()) {
      this.mensajeModalError = 'Por favor ingresa los datos del remitente.';
      return;
    }
    if (!destinatarioNombre.trim() || !destinatarioDni.trim()) {
      this.mensajeModalError = 'Por favor ingresa los datos de quien recibirá el paquete.';
      return;
    }
    if (!ciudadOrigenId || !ciudadDestinoId) {
      this.mensajeModalError = 'Selecciona ciudad de origen y destino.';
      return;
    }
    if (ciudadOrigenId === ciudadDestinoId) {
      this.mensajeModalError = 'El origen y destino deben ser diferentes.';
      return;
    }
    if (!precio || precio <= 0) {
      this.mensajeModalError = 'Ingresa un precio válido.';
      return;
    }

    const request: EncomiendaRequest = {
      remitenteNombre: remitenteNombre.trim(),
      remitenteDni: remitenteDni.trim(),
      remitenteTelefono: remitenteTelefono.trim() || 'Sin teléfono',
      destinatarioNombre: destinatarioNombre.trim(),
      destinatarioDni: destinatarioDni.trim(),
      destinatarioTelefono: destinatarioTelefono.trim() || 'Sin teléfono',
      ciudadOrigenId,
      ciudadDestinoId,
      descripcion: descripcion.trim() || 'Encomienda / Paquete',
      peso: Number(peso) || 1.0,
      precio: Number(precio),
      pagoEstado: pagoEstado,
      viajeId: viajeId || null
    };

    this.guardando = true;
    this.mensajeModalError = '';

    this.encomiendaService.registrar(request).subscribe({
      next: (creada) => {
        this.guardando = false;
        this.mostrarModalRegistro = false;
        this.cargarDatosIniciales();
        // Abrir inmediatamente la boleta para que la pegue en el paquete
        this.verBoleta(creada);
      },
      error: (err) => {
        this.guardando = false;
        console.error('Error al registrar encomienda:', err);
        this.mensajeModalError = 'Ocurrió un error al registrar la encomienda. Verifica los datos.';
        this.cdr.detectChanges();
      }
    });
  }

  verBoleta(e: EncomiendaResponse): void {
    this.encomiendaSeleccionada = e;
    this.mostrarModalBoleta = true;
  }

  cerrarModalBoleta(): void {
    this.mostrarModalBoleta = false;
    this.encomiendaSeleccionada = null;
  }

  imprimirBoleta(): void {
    document.body.classList.add('imprimiendo-boleta');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('imprimiendo-boleta');
    }, 1000);
  }

  abrirAsignarCombi(e: EncomiendaResponse): void {
    this.encomiendaParaAsignar = e;
    this.viajeSeleccionadoParaAsignar = null;
    this.mostrarModalAsignar = true;
  }

  cerrarModalAsignar(): void {
    this.mostrarModalAsignar = false;
    this.encomiendaParaAsignar = null;
    this.viajeSeleccionadoParaAsignar = null;
  }

  confirmarAsignacionCombi(): void {
    if (!this.encomiendaParaAsignar || !this.viajeSeleccionadoParaAsignar) return;

    this.encomiendaService.asignarViaje(
      this.encomiendaParaAsignar.idEncomienda,
      this.viajeSeleccionadoParaAsignar
    ).subscribe({
      next: (actualizada) => {
        this.cerrarModalAsignar();
        this.cargarDatosIniciales();
      },
      error: (err) => {
        console.error('Error al asignar viaje:', err);
        alert('No se pudo asignar la combi.');
      }
    });
  }

  cambiarEstado(e: EncomiendaResponse, nuevoEstado: string): void {
    let confirmMsg = `¿Deseas marcar la encomienda ${e.codigoSeguimiento} como ${nuevoEstado}?`;
    if (nuevoEstado === 'ENTREGADO') {
      confirmMsg = `¿Confirmas que la encomienda ${e.codigoSeguimiento} fue ENTREGADA al destinatario ${e.destinatarioNombre}?`;
      if (e.pagoEstado === 'POR_PAGAR') {
        confirmMsg += `\n\n⚠️ ¡ATENCIÓN! Esta encomienda tiene PAGO CONTRAENTREGA.\nDebes COBRAR S/ ${e.precio.toFixed(2)} al momento de entregar.`;
      }
    }

    if (!confirm(confirmMsg)) return;

    this.encomiendaService.actualizarEstado(e.idEncomienda, nuevoEstado).subscribe({
      next: () => {
        this.cargarDatosIniciales();
      },
      error: (err) => {
        console.error('Error al actualizar estado:', err);
        alert('Error al actualizar el estado de la encomienda.');
      }
    });
  }

  // Conteo resumen
  get totalHoy(): number {
    return this.encomiendas.filter(e => e.fechaRegistro && e.fechaRegistro.startsWith(this.hoyStr)).length;
  }

  get totalRecepcionados(): number {
    return this.encomiendas.filter(e => e.estado === 'RECEPCIONADO').length;
  }

  get totalEnTransito(): number {
    return this.encomiendas.filter(e => e.estado === 'EN_TRANSITO').length;
  }

  get totalEntregados(): number {
    return this.encomiendas.filter(e => e.estado === 'ENTREGADO').length;
  }
}
