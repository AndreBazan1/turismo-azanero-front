export type RolUsuario = 'VENTANILLA' | 'ADMINISTRADOR' | 'CLIENTE';

export interface LoginRequest {
  dni: string;
  password: string;
  rol: RolUsuario;
}

export interface AuthResponse {
  token: string;
  nombreCompleto: string;
  dni: string;
  rol: RolUsuario;
  mensaje: string;
}

export interface UserSession {
  nombreCompleto: string;
  dni: string;
  rol: RolUsuario;
}
