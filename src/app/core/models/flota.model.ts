export type EstadoVehiculo = 'DISPONIBLE' | 'EN_VIAJE' | 'MANTENIMIENTO';

export interface VehiculoResponse {
  idVehiculo: number;
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  estado: string;
  ultimaRevision: string | null;
  choferAsignado: string | null;
  idChofer?: number | null;
}

export interface VehiculoRequest {
  placa: string;
  marca: string;
  modelo: string;
  anio: number;
  capacidad: number;
  estado: string;
  ultimaRevision?: string | null;
  choferId?: number | null;
}
