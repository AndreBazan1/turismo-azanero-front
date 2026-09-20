import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DashboardService, DashboardResumen } from '../../core/services/dashboard';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css'
})
export class DashboardComponent implements OnInit {
  private dashboardService = inject(DashboardService);
  private cd = inject(ChangeDetectorRef); // 1. Inyectar ChangeDetectorRef

  data: DashboardResumen | null = null;
  cargando: boolean = true;

  ngOnInit(): void {
    this.cargarDashboard();
  }

  cargarDashboard(): void {
    this.dashboardService.getResumen().subscribe({
      next: (res) => {
        this.data = res;
        this.cargando = false;
        this.cd.detectChanges(); // 2. Forzar el pintado inmediato de los datos
      },
      error: (err) => {
        console.error('Error al cargar métricas del dashboard:', err);
        this.cargando = false;
        this.cd.detectChanges(); // 3. Forzar el pintado si ocurre error
      }
    });
  }
}