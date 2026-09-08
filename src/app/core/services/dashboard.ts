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
  estado: 'On Time' | 'Boarding' | 'Delayed 10m';
}

export interface DashboardResumen {
  viajesHoy: number;
  flotaDisponible: number;
  totalFlota: number;
  enMantenimiento: number;
  enRuta: number;
  totalPasajeros: number;
  pasajerosCajamarca: number;
  pasajerosCelendin: number;
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