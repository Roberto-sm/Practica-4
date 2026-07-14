import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton,
  IonButton,
  IonLabel,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonIcon,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  wallet,
  sparkles,
  expandOutline,
  calendarOutline,
  scanOutline,
  restaurant,
  car,
  flash,
  medkit,
  ellipsisHorizontal,
  listOutline,
} from 'ionicons/icons';
import { GastosService } from '../services/gastos.service';
import { CategoriaGasto, MetodoPago, CATEGORIAS } from '../models/gasto.model';

@Component({
  selector: 'app-confirmar-gasto',
  templateUrl: 'confirmar-gasto.page.html',
  styleUrls: ['confirmar-gasto.page.scss'],
  standalone: true,
  imports: [
    FormsModule,
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    IonButton,
    IonLabel,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonIcon,
  ],
})
export class ConfirmarGastoPage implements OnInit {
  private gastosService = inject(GastosService);
  private router = inject(Router);

  categorias = CATEGORIAS;
  
  monto: number = 0;
  concepto = '';
  categoria: CategoriaGasto = 'comida';
  metodoPago: MetodoPago = 'efectivo';
  notas = '';
  fechaStr = '';
  imagenTicket?: string;

  datosEscaneados = this.gastosService.datosEscaneados;

  constructor() {
    addIcons({
      wallet,
      sparkles,
      expandOutline,
      calendarOutline,
      scanOutline,
      restaurant,
      car,
      flash,
      medkit,
      ellipsisHorizontal,
      listOutline,
    });
  }

  ngOnInit(): void {
    const datos = this.datosEscaneados();
    if (datos) {
      this.monto = datos.monto || 0;
      this.concepto = datos.concepto || '';
      this.categoria = datos.categoria || 'otros';
      this.imagenTicket = datos.imagenTicket;
      this.fechaStr = this.formatDate(datos.fecha || new Date());
    } else {
      this.fechaStr = this.formatDate(new Date());
    }
  }

  getCategoriaIcon(): string {
    return CATEGORIAS.find(c => c.id === this.categoria)?.icono || 'ellipsis-horizontal';
  }

  getCategoriaColor(): string {
    return CATEGORIAS.find(c => c.id === this.categoria)?.color || '#8B5CF6';
  }

  getCategoriaNombre(): string {
    return CATEGORIAS.find(c => c.id === this.categoria)?.nombre || 'Otros';
  }

  guardarGasto(): void {
    if (!this.concepto || this.monto <= 0) {
      alert('Por favor verifica que el concepto y el monto estén llenos.');
      return;
    }

    const datos = this.datosEscaneados();
    
    this.gastosService.agregarGasto({
      concepto: this.concepto,
      monto: this.monto,
      fecha: datos?.fecha || new Date(),
      categoria: this.categoria,
      metodoPago: this.metodoPago,
      notas: this.notas || undefined,
      imagenTicket: this.imagenTicket,
      creadoPorIA: true,
    });

    this.gastosService.clearDatosEscaneados();
    this.router.navigate(['/tabs/gastos']);
  }

  corregirManualmente(): void {
    this.gastosService.clearDatosEscaneados();
    this.router.navigate(['/tabs/escanear']);
  }

  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: '2-digit',
      year: '2-digit'
    }).format(new Date(date));
  }
}