import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { RolUsuario } from '../models/auth.model';

export const roleGuard = (roles: RolUsuario[]): CanActivateFn => {
  return () => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.currentUser();
    if (user && roles.includes(user.rol)) {
      return true;
    }

    // Si no tiene el rol requerido, redirigir a rutas (página base del ventanilla)
    return router.createUrlTree(['/rutas']);
  };
};
