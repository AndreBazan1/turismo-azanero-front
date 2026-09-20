export type EstadoAsiento = 'LIBRE' | 'OCUPADO' | 'RESERVADO';

export interface Asiento {
  idAsiento: number;
  numero: number;
  estado: string; // 'LIBRE' | 'OCUPADO'
  esChofer: boolean;
  dniPasajero?: string;
  nombrePasajero?: string;
  precio?: number;
}

export interface ViajeResponse {
  idViaje: number;
  ciudadOrigen: string;
  ciudadDestino: string;
  fechaHora: string;
  precio: number;
  placa: string;
  choferNombre: string;
  estado: string;
  asientosLibres: number;
  asientosOcupados: number;
  totalAsientos: number;
}

export interface ViajeRequest {
  ciudadOrigenId: number;
  ciudadDestinoId: number;
  fechaHora: string; // Formato esperado: YYYY-MM-DDTHH:mm:ss
  precio: number;
  vehiculoId: number;
  choferId: number;
}

export interface VenderPasajeRequest {
  viajeId: number;
  numeroAsiento: number;
  nombrePasajero: string;
  dniPasajero: string;
  precio: number;
}

export interface PeruApiDniDTO {
  numeroDocumento: string;
  tipoDocumento: string;
  nombreCompleto: string;
  nombres: string;
  apellidoPaterno: string;
  apellidoMaterno: string;
}

// Modelos auxiliares para los desplegables del Modal
export interface Vehiculo {
  idVehiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  estado: string;
}

export interface Chofer {
  idChofer: number;
  nombreCompleto: string;
  dni: string;
  estado: string;
}

export interface Ciudad {
  idCiudad: number;
  nombre: string;
  provincia: string;
  activa: boolean;
}

export interface PasajeResponse {
  idPasaje: number;
  numeroAsiento: number;
  nombrePasajero: string;
  dniPasajero: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  fechaHora: string;
  precio: number;
  estado: string;
  vendidoPor: string;
  fechaVenta: string;
}

export interface PasajeroForm {
  asiento: Asiento;
  numeroAsiento: number;
  tipoDocumento: string;
  dniPasajero: string;
  nombre: string;
  apellido: string;
  telefono: string;
  cargandoReniec?: boolean;
  errorReniec?: string;
}