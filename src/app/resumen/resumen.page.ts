import { Component, inject, computed } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonList,
  IonItem,
  IonLabel,
  IonNote,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  wallet,
  notificationsOutline,
  trendingUp,
  pieChartOutline,
  restaurant,
  bulbOutline,
} from 'ionicons/icons';
import { GastosService } from '../services/gastos.service';
import { ResumenCategoria } from '../models/gasto.model';

@Component({
  selector: 'app-resumen',
  templateUrl: 'resumen.page.html',
  styleUrls: ['resumen.page.scss'],
  standalone: true,
  imports: [
    DecimalPipe,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon,
    IonList,
    IonItem,
    IonLabel,
    IonNote,
  ],
})
export class ResumenPage {
  gastosService = inject(GastosService);

  constructor() {
    addIcons({
      wallet,
      notificationsOutline,
      trendingUp,
      pieChartOutline,
      restaurant,
      bulbOutline,
    });
  }

  segmentosChart = computed(() => {
    return this.gastosService.totalPorCategoria().filter(c => c.porcentaje > 0);
  });

  categoriaDestacada = computed((): ResumenCategoria | null => {
    const categorias = this.gastosService.totalPorCategoria();
    return categorias.length > 0 ? categorias[0] : null;
  });

  calcularDashArray(porcentaje: number): string {
    const circunferencia = 2 * Math.PI * 40;
    const longitud = (porcentaje / 100) * circunferencia;
    return `${longitud} ${circunferencia}`;
  }

  calcularDashOffset(index: number): number {
    const circunferencia = 2 * Math.PI * 40;
    let offset = circunferencia * 0.25; // Empezar desde arriba

    const segmentos = this.segmentosChart();
    for (let i = 0; i < index; i++) {
      offset -= (segmentos[i].porcentaje / 100) * circunferencia;
    }

    return offset;
  }
}
