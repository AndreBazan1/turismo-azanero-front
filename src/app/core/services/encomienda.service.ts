import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { EncomiendaRequest, EncomiendaResponse } from '../models/encomienda.model';

@Injectable({
  providedIn: 'root'
})
export class EncomiendaService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/encomiendas';

  // Listar todas las encomiendas
  listarTodas(): Observable<EncomiendaResponse[]> {
    return this.http.get<EncomiendaResponse[]>(this.apiUrl);
  }

  // Registrar nueva encomienda
  registrar(request: EncomiendaRequest): Observable<EncomiendaResponse> {
    return this.http.post<EncomiendaResponse>(this.apiUrl, request);
  }

  // Obtener seguimiento por código RX-...
  getSeguimiento(codigo: string): Observable<EncomiendaResponse> {
    return this.http.get<EncomiendaResponse>(`${this.apiUrl}/seguimiento/${codigo}`);
  }

  // Actualizar estado (RECEPCIONADO, EN_TRANSITO, EN_AGENCIA_DESTINO, ENTREGADO)
  actualizarEstado(id: number, estado: string, descripcion?: string): Observable<EncomiendaResponse> {
    return this.http.put<EncomiendaResponse>(`${this.apiUrl}/${id}/estado`, {
      estado,
      descripcion: descripcion || `Cambio de estado a ${estado}`
    });
  }

  // Asignar encomienda a una combi / viaje
  asignarViaje(idEncomienda: number, idViaje: number): Observable<EncomiendaResponse> {
    return this.http.put<EncomiendaResponse>(`${this.apiUrl}/${idEncomienda}/asignar-viaje/${idViaje}`, {});
  }
}
