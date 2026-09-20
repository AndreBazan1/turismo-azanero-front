import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const token = localStorage.getItem('token');

  // Si hay token, verificar si está expirado antes de enviarlo
  if (token) {
    if (isTokenExpired(token)) {
      // Token expirado: limpiar sesión y NO adjuntar el token
      localStorage.removeItem('token');
      localStorage.removeItem('usuario_actual');
      router.navigate(['/login']);
      return next(req);
    }

    const clonedReq = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });

    return next(clonedReq).pipe(
      catchError((err: HttpErrorResponse) => {
        // Si el backend devuelve 401 (token expirado o inválido en servidor)
        if (err.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('usuario_actual');
          router.navigate(['/login']);
        }
        return throwError(() => err);
      })
    );
  }

  return next(req);
};

/**
 * Decodifica el payload del JWT (sin verificar firma)
 * y comprueba si la fecha de expiración (exp) ya pasó.
 */
function isTokenExpired(token: string): boolean {
  try {
    const payload = token.split('.')[1];
    const decoded = JSON.parse(atob(payload));
    if (!decoded.exp) return false;
    // decoded.exp está en segundos, Date.now() en milisegundos
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true; // Si no se puede decodificar, tratar como expirado
  }
}