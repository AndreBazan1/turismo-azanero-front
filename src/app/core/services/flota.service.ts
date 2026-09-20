import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { VehiculoResponse } from '../models/flota.model';

@Injectable({ providedIn: 'root' })
export class FlotaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/vehiculos';

  listarTodos(): Observable<VehiculoResponse[]> {
    return this.http.get<VehiculoResponse[]>(this.apiUrl);
  }
}
