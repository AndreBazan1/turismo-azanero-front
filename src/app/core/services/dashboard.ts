import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SalidaDTO {
  idViaje: number;
  ruta: string;
  hora: string;
  chofer: string;
  iniciales: string;
  vehiculoId: string;
  ocupacion: string;
  porcentaje: number;
  estado: string;
}

export interface DashboardResumen {
  viajesHoy: number;
  viajesAyer?: number;
  tendenciaViajes?: string;
  tendenciaPositiva?: boolean;
  flotaDisponible: number;
  totalFlota: number;
  enMantenimiento: number;
  enRuta: number;
  totalPasajeros: number;
  pasajerosCajamarca: number;
  pasajerosCelendin: number;
  tendenciaPasajeros?: string;
  proximasSalidas: SalidaDTO[];
}

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/dashboard';

  getResumen(): Observable<DashboardResumen> {
    return this.http.get<DashboardResumen>(this.apiUrl);
  }
}