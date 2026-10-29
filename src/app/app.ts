import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class AppComponent implements OnInit {
  authService = inject(AuthService);
  private router = inject(Router);

  isDarkMode: boolean = false;

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('turismo_theme');
    if (savedTheme === 'dark' || (!savedTheme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    } else {
      this.isDarkMode = false;
      document.body.classList.remove('dark-theme');
    }
  }

  toggleDarkMode(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('turismo_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('turismo_theme', 'light');
    }
  }

  isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  logout(): void {
    this.authService.logout();
  }

  programarViaje(): void {
    this.router.navigate(['/rutas'], { queryParams: { abrirModal: 'true', t: Date.now() } });
  }
}