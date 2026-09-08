import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asiento, VenderPasajeRequest } from '../models/viaje.model';

@Injectable({ providedIn: 'root' })
export class ViajeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/viajes'; 

  getCroquis(idViaje: number): Observable<Asiento[]> {
    return this.http.get<Asiento[]>(`${this.apiUrl}/${idViaje}/croquis`);
  }

  venderPasaje(request: VenderPasajeRequest): Observable<any> {
    return this.http.post('http://localhost:8080/api/v1/pasajes', request); 
  }
}