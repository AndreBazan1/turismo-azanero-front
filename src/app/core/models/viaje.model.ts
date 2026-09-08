export type EstadoAsiento = 'LIBRE' | 'OCUPADO' | 'RESERVADO';

export interface Asiento {
  idAsiento: number;
  numero: number;
  estado: string; // 'LIBRE' | 'OCUPADO'
  esChofer: boolean;
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

export interface VenderPasajeRequest {
  viajeId: number;
  numeroAsiento: number;
  nombrePasajero: string;
  dniPasajero: string;
  precio: number;
}