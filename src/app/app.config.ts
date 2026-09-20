import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
// Importación corregida
import { provideHttpClient, withInterceptors } from '@angular/common/http'; 
import { authInterceptor } from './core/interceptors/auth-interceptor';
import { routes } from './app.routes';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    // Solo un provideHttpClient con el interceptor configurado
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes)
  ]
};