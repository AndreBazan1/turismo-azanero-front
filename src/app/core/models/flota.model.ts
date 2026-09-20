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
}
