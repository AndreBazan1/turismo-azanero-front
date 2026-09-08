import { Routes } from '@angular/router';
import { DashboardComponent } from './features/dashboard/dashboard';
import { Viajes } from './features/viajes/viajes'; 
import { VentaPasajes } from './features/venta-pasajes/venta-pasajes';

export const routes: Routes = [
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
  { path: 'dashboard', component: DashboardComponent },
  { path: 'rutas', component: DashboardComponent }, // Redirección temporal mientras creamos la vista específica
  { path: 'flota', component: DashboardComponent },
  { path: 'pasajeros', component: DashboardComponent },
  { path: 'viajes/:id/croquis', component: VentaPasajes },
  { path: '**', redirectTo: 'dashboard' }
];