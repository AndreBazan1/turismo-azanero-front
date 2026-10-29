import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehiculoResponse, VehiculoRequest } from '../models/flota.model';

@Injectable({ providedIn: 'root' })
export class FlotaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/vehiculos';
  private baseUrl = 'http://localhost:8080/api/v1';

  listarTodos(): Observable<VehiculoResponse[]> {
    return this.http.get<VehiculoResponse[]>(this.apiUrl);
  }

  crearVehiculo(request: VehiculoRequest): Observable<VehiculoResponse> {
    return this.http.post<VehiculoResponse>(this.apiUrl, request);
  }

  listarChoferes(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}/choferes`);
  }
}
