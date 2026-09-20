import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app'; // <-- Cambiar 'App' por 'AppComponent' (o './app/app')

bootstrapApplication(AppComponent, appConfig)
  .catch((err) => console.error(err));