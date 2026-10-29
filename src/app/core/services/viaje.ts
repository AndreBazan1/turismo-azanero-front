import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Asiento, VenderPasajeRequest, ViajeResponse, ViajeRequest, PeruApiDniDTO, Vehiculo, Chofer, Ciudad, PasajeResponse } from '../models/viaje.model';

@Injectable({ providedIn: 'root' })
export class ViajeService {
  private http = inject(HttpClient);
  private apiUrl = 'http://localhost:8080/api/v1/viajes';
  private baseUrl = 'http://localhost:8080/api/v1';

  // Pantalla principal: Listar viajes programados (por día o todos)
  listarProgramados(fecha?: string, todos: boolean = false): Observable<ViajeResponse[]> {
    let params = new HttpParams();
    if (todos) {
      params = params.set('todos', 'true');
    } else if (fecha) {
      params = params.set('fecha', fecha);
    }
    return this.http.get<ViajeResponse[]>(this.apiUrl, { params });
  }

  // Obtener un viaje específico por ID
  obtenerViajePorId(idViaje: number): Observable<ViajeResponse> {
    return this.http.get<ViajeResponse>(`${this.apiUrl}/${idViaje}`);
  }

  // Pantalla principal: Buscador superior
  buscarDisponibles(origenId: number, destinoId: number): Observable<ViajeResponse[]> {
    const params = new HttpParams()
      .set('origenId', origenId.toString())
      .set('destinoId', destinoId.toString());
    return this.http.get<ViajeResponse[]>(`${this.apiUrl}/disponibles`, { params });
  }

  // Modal: Registrar Nueva Ruta
  crearViaje(request: ViajeRequest): Observable<ViajeResponse> {
    return this.http.post<ViajeResponse>(this.apiUrl, request);
  }

  // Proceso de Venta (Croquis)
  getCroquis(idViaje: number): Observable<Asiento[]> {
    return this.http.get<Asiento[]>(`${this.apiUrl}/${idViaje}/croquis`);
  }

  // Proceso de Venta (Confirmación)
  venderPasaje(request: VenderPasajeRequest): Observable<any> {
    return this.http.post(`${this.baseUrl}/pasajes/vender`, request);
  }

  // Obtener Manifiesto de Pasajeros por Viaje
  obtenerManifiesto(idViaje: number): Observable<PasajeResponse[]> {
    return this.http.get<PasajeResponse[]>(`${this.baseUrl}/pasajes/manifiesto/${idViaje}`);
  }

  // Consume tu PeruApiController existente
  consultarDni(dni: string): Observable<PeruApiDniDTO> {
    return this.http.get<PeruApiDniDTO>(`${this.apiUrl}/consulta/dni/${dni}`);
  }

  // Auxiliares para el Modal "Registrar Nueva Ruta"
  listarCiudades(): Observable<Ciudad[]> {
    return this.http.get<Ciudad[]>(`${this.baseUrl}/ciudades`);
  }

  listarVehiculos(): Observable<Vehiculo[]> {
    return this.http.get<Vehiculo[]>(`${this.baseUrl}/vehiculos`);
  }

  listarChoferes(): Observable<Chofer[]> {
    return this.http.get<Chofer[]>(`${this.baseUrl}/choferes`);
  }
}