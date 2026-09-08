import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ViajeService } from '../../core/services/viaje';
import { Asiento } from '../../core/models/viaje.model';

@Component({
  selector: 'app-venta-pasajes',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './venta-pasajes.html',
  styleUrl: './venta-pasajes.css'
})
export class VentaPasajes implements OnInit {
  private route = inject(ActivatedRoute);
  private viajeService = inject(ViajeService);

  asientos: Asiento[] = [];
  idViaje: number = 0;
  asientoSeleccionado: Asiento | null = null;

  seleccionarAsiento(asiento: Asiento) {
    if (asiento.estado === 'OCUPADO' || asiento.esChofer) return;
    
    // Si vuelve a hacer clic en el mismo asiento lo deselecciona; si no, lo marca
    this.asientoSeleccionado = this.asientoSeleccionado?.idAsiento === asiento.idAsiento ? null : asiento;
  }
  
  ngOnInit() {
    this.idViaje = Number(this.route.snapshot.paramMap.get('id'));
    if (this.idViaje) {
      this.cargarCroquis();
    }
  }

  cargarCroquis() {
    this.viajeService.getCroquis(this.idViaje).subscribe({
      next: (data) => this.asientos = data,
      error: (err) => console.error('Error al consultar el backend:', err)
    });
  }
}