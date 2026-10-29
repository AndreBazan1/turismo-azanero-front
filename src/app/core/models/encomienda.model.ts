export interface HistorialEncomiendaDTO {
  estado: string;
  descripcion: string;
  fecha: string;
}

export interface EncomiendaResponse {
  idEncomienda: number;
  codigoSeguimiento: string;
  remitenteNombre: string;
  remitenteDni: string;
  remitenteTelefono: string;
  destinatarioNombre: string;
  destinatarioDni: string;
  destinatarioTelefono: string;
  ciudadOrigen: string;
  ciudadDestino: string;
  descripcion?: string;
  peso: number;
  precio: number;
  pagoEstado: 'PAGADO' | 'POR_PAGAR';
  viajeId?: number;
  viajeInfo?: string;
  estado: 'RECEPCIONADO' | 'EN_TRANSITO' | 'EN_AGENCIA_DESTINO' | 'ENTREGADO' | 'DEVUELTO';
  fechaRegistro: string;
  registradoPor: string;
  historial?: HistorialEncomiendaDTO[];
}

export interface EncomiendaRequest {
  remitenteNombre: string;
  remitenteDni: string;
  remitenteTelefono: string;
  destinatarioNombre: string;
  destinatarioDni: string;
  destinatarioTelefono: string;
  ciudadOrigenId: number;
  ciudadDestinoId: number;
  descripcion?: string;
  peso: number;
  precio: number;
  pagoEstado?: 'PAGADO' | 'POR_PAGAR';
  viajeId?: number | null;
}
