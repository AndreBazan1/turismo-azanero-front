import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RolUsuario } from '../../../core/models/auth.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cd = inject(ChangeDetectorRef);

  loginForm!: FormGroup;
  cargando: boolean = false;
  mensajeError: string = '';
  mostrarPassword: boolean = false;

  rolesDisponibles: { id: RolUsuario; label: string; icon: string }[] = [
    { id: 'VENTANILLA', label: 'Ventanilla', icon: '🎫' },
    { id: 'ADMINISTRADOR', label: 'Administrador', icon: '🛡️' }
  ];

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern('^[0-9]{8}$')]],
      password: ['', [Validators.required, Validators.minLength(4)]],
      rol: ['VENTANILLA' as RolUsuario, [Validators.required]]
    });
  }

  seleccionarRol(rol: RolUsuario): void {
    this.loginForm.patchValue({ rol });
  }

  toggleMostrarPassword(): void {
    this.mostrarPassword = !this.mostrarPassword;
  }

  // Atajo rápido para pruebas de desarrollo
  cargarCredencialesPrueba(tipo: 'VENTANILLA' | 'ADMINISTRADOR'): void {
    if (tipo === 'VENTANILLA') {
      this.loginForm.patchValue({
        dni: '77777777',
        password: '123456',
        rol: 'VENTANILLA'
      });
    } else {
      this.loginForm.patchValue({
        dni: '88888888',
        password: 'admin123',
        rol: 'ADMINISTRADOR'
      });
    }
    this.mensajeError = '';
    this.cd.detectChanges();
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }

    this.cargando = true;
    this.mensajeError = '';

    const { dni, password, rol } = this.loginForm.value;

    this.authService.login({ dni, password, rol }).subscribe({
      next: (res) => {
        this.cargando = false;
        this.router.navigate(['/dashboard']);
      },
      error: (err) => {
        this.cargando = false;
        console.error('Error en login:', err);
        if (err.status === 400 || err.status === 401 || err.status === 403) {
          this.mensajeError = err.error?.message || 'DNI, contraseña o rol incorrectos.';
        } else if (err.status === 0) {
          this.mensajeError = 'No se pudo conectar con el servidor backend (puerto 8080). Asegúrate de que Spring Boot esté iniciado.';
        } else {
          this.mensajeError = err.error?.message || 'Ocurrió un error inesperado al iniciar sesión.';
        }
        this.cd.detectChanges();
      }
    });
  }
}
