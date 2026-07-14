import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonLabel,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  IonButton,
  IonButtons,
  IonBackButton,
  IonChip,
  IonIcon,
  LoadingController
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import { scanOutline } from 'ionicons/icons';

import { GastosService } from '../services/gastos.service';

@Component({
  selector: 'app-nuevo-gasto',
  templateUrl: 'nuevo-gasto.page.html',
  styleUrls: ['nuevo-gasto.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonLabel,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    IonButton,
    IonButtons,
    IonBackButton,
    IonChip,
    IonIcon,
    FormsModule
  ],
})
export class NuevoGastoPage {
  private gastosService = inject(GastosService);
  private router = inject(Router);
  private loadingCtrl = inject(LoadingController);

  modoEdicion = false;
  idEditando: string | null = null;

  gasto: any = {
    concepto: '',
    monto: null,
    categoria: 'otros',
    metodoPago: 'efectivo',
    notas: '',
    creadoPorIA: false,
    imagenTicket: null
  };

  fechaStr: string = this.formatearFechaInput(new Date());

  categorias: any[] = [
    { id: 'comida', nombre: 'Comida' },
    { id: 'transporte', nombre: 'Transporte' },
    { id: 'servicios', nombre: 'Servicios' },
    { id: 'entretenimiento', nombre: 'Entretenimiento' },
    { id: 'salud', nombre: 'Salud' },
    { id: 'compras', nombre: 'Compras' },
    { id: 'otros', nombre: 'Otros' }
  ];

  constructor() {
    addIcons({ scanOutline });
  }

  ionViewWillEnter() {
    const gastoEditando = this.gastosService.gastoEditando();

    if (gastoEditando) {
      this.modoEdicion = true;
      this.idEditando = gastoEditando.id;

      this.gasto = {
        concepto: gastoEditando.concepto || '',
        monto: gastoEditando.monto || null,
        categoria: gastoEditando.categoria || 'otros',
        metodoPago: gastoEditando.metodoPago || 'efectivo',
        notas: gastoEditando.notas || '',
        creadoPorIA: gastoEditando.creadoPorIA || false,
        imagenTicket: gastoEditando.imagenTicket || null
      };

      this.fechaStr = this.formatearFechaInput(gastoEditando.fecha);
      return;
    }

    const datosIA = this.gastosService.datosEscaneados();

    if (datosIA) {
      this.modoEdicion = false;
      this.idEditando = null;

      this.gasto = {
        concepto: datosIA.concepto || '',
        monto: datosIA.monto || null,
        categoria: datosIA.categoria || 'otros',
        metodoPago: datosIA.metodoPago || 'efectivo',
        notas: datosIA.notas || '',
        creadoPorIA: datosIA.creadoPorIA || true,
        imagenTicket: datosIA.imagenTicket || null
      };

      this.fechaStr = datosIA.fecha
        ? this.formatearFechaInput(datosIA.fecha)
        : this.formatearFechaInput(new Date());

      this.gastosService.clearDatosEscaneados();
      return;
    }

    this.limpiarFormulario();
  }

  private formatearFechaInput(fecha: Date | string): string {
    const fechaObj = new Date(fecha);

    if (isNaN(fechaObj.getTime())) {
      return new Date().toISOString().split('T')[0];
    }

    const year = fechaObj.getFullYear();
    const month = String(fechaObj.getMonth() + 1).padStart(2, '0');
    const day = String(fechaObj.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  setMetodoPago(metodo: string) {
    this.gasto.metodoPago = metodo;
  }

  isFormValid(): boolean {
    return !!(
      this.gasto.concepto &&
      Number(this.gasto.monto) > 0 &&
      this.gasto.categoria &&
      this.fechaStr
    );
  }

  cancelar() {
    this.gastosService.clearGastoEditando();
    this.gastosService.clearDatosEscaneados();
    this.limpiarFormulario();
    this.router.navigate(['/home']);
  }

  irAEscanear() {
    this.gastosService.clearGastoEditando();
    this.router.navigate(['/escanear']);
  }

  async guardarGasto() {
    if (!this.isFormValid()) {
      alert('Completa concepto, monto, fecha y categoría.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: this.modoEdicion ? 'Actualizando...' : 'Guardando...'
    });

    await loading.present();

    const gastoAGuardar = {
      concepto: this.gasto.concepto,
      monto: Number(this.gasto.monto),
      categoria: this.gasto.categoria,
      metodoPago: this.gasto.metodoPago || 'efectivo',
      notas: this.gasto.notas || '',
      imagenTicket: this.gasto.imagenTicket || null,
      creadoPorIA: this.gasto.creadoPorIA || false,
      fecha: new Date(`${this.fechaStr}T00:00:00`)
    };

    try {
      if (this.modoEdicion && this.idEditando) {
        await this.gastosService.actualizarGasto(this.idEditando, gastoAGuardar);
        this.gastosService.clearGastoEditando();
        alert('¡Gasto actualizado con éxito!');
      } else {
        await this.gastosService.agregarGasto(gastoAGuardar);
        alert('¡Gasto guardado con éxito!');
      }

      await loading.dismiss();

      this.limpiarFormulario();
      this.router.navigate(['/gastos']);

    } catch (error: any) {
      await loading.dismiss();

      console.error('Error completo al guardar:', error);

      const mensaje =
        error?.message ||
        error?.error_description ||
        error?.details ||
        error?.hint ||
        JSON.stringify(error);

      alert(
        'Error al guardar en BD:\n\n' +
        mensaje
      );
    }
  }

  limpiarFormulario(): void {
    this.gasto = {
      concepto: '',
      monto: null,
      categoria: 'otros',
      metodoPago: 'efectivo',
      notas: '',
      creadoPorIA: false,
      imagenTicket: null
    };

    this.fechaStr = this.formatearFechaInput(new Date());
    this.modoEdicion = false;
    this.idEditando = null;
  }
}