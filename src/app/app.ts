import { Component, inject } from '@angular/core';
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
export class AppComponent {
  authService = inject(AuthService);
  private router = inject(Router);

  isLoginPage(): boolean {
    return this.router.url.includes('/login');
  }

  logout(): void {
    this.authService.logout();
  }
}