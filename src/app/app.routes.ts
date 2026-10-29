import { Routes } from '@angular/router';
import { LoginComponent } from './features/auth/login/login.component';
import { DashboardComponent } from './features/dashboard/dashboard';
import { RutasDisponiblesComponent } from './features/rutas-disponibles/rutas-disponibles';
import { VentaPasajes } from './features/venta-pasajes/venta-pasajes';
import { FlotaComponent } from './features/flota/flota';
import { PasajerosComponent } from './features/pasajeros/pasajeros';
import { EncomiendasComponent } from './features/encomiendas/encomiendas';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'dashboard', component: DashboardComponent, canActivate: [authGuard] },
  { path: 'rutas', component: RutasDisponiblesComponent, canActivate: [authGuard] },
  { path: 'venta-pasajes/:id', component: VentaPasajes, canActivate: [authGuard] },
  { path: 'viajes/:id/croquis', component: VentaPasajes, canActivate: [authGuard] },
  { path: 'flota', component: FlotaComponent, canActivate: [authGuard, roleGuard(['ADMINISTRADOR'])] },
  { path: 'pasajeros', component: PasajerosComponent, canActivate: [authGuard] },
  { path: 'pasajeros/:id', component: PasajerosComponent, canActivate: [authGuard] },
  { path: 'encomiendas', component: EncomiendasComponent, canActivate: [authGuard] },
  { path: '**', redirectTo: 'login' }
];