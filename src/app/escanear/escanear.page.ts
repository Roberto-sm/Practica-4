import { Component, ElementRef, ViewChild, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  LoadingController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  imagesOutline,
  sparkles,
  refreshOutline,
  wallet,
  notificationsOutline,
  documentTextOutline
} from 'ionicons/icons';

import { GastosService } from '../services/gastos.service';
import { CategoriaGasto } from '../models/gasto.model';

@Component({
  selector: 'app-escanear',
  templateUrl: 'escanear.page.html',
  styleUrls: ['escanear.page.scss'],
  standalone: true,
  imports: [
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonButton,
    IonIcon
  ],
})
export class EscanearPage {
  @ViewChild('cameraInput', { static: false })
  cameraInput?: ElementRef<HTMLInputElement>;

  @ViewChild('galleryInput', { static: false })
  galleryInput?: ElementRef<HTMLInputElement>;

  @ViewChild('videoPreview', { static: false })
  videoPreview?: ElementRef<HTMLVideoElement>;

  private router = inject(Router);
  private gastosService = inject(GastosService);
  private loadingCtrl = inject(LoadingController);

  imagenCapturada = signal<string | null>(null);
  mostrarCamara = signal(false);

  private videoStream: MediaStream | null = null;

  private openRouterKey =
    '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';

  constructor() {
    addIcons({
      cameraOutline,
      imagesOutline,
      sparkles,
      refreshOutline,
      wallet,
      notificationsOutline,
      documentTextOutline
    });
  }

  async tomarFoto(): Promise<void> {
    const esMovil = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (esMovil) {
      this.cameraInput?.nativeElement.click();
      return;
    }

    await this.iniciarCamaraPC();
  }

  async iniciarCamaraPC(): Promise<void> {
    try {
      this.reiniciar();

      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false
      });

      this.videoStream = stream;
      this.mostrarCamara.set(true);

      setTimeout(() => {
        const video = this.videoPreview?.nativeElement;

        if (video) {
          video.srcObject = stream;
          video.play();
        }
      }, 100);

    } catch (error) {
      console.error('Error al abrir cámara:', error);
      alert('No se pudo acceder a la cámara de la PC.');
    }
  }

  capturarDesdeWebcam(): void {
    const video = this.videoPreview?.nativeElement;

    if (!video) {
      alert('No se encontró la cámara.');
      return;
    }

    const canvas = document.createElement('canvas');

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const ctx = canvas.getContext('2d');

    if (!ctx) return;

    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const imagen = canvas.toDataURL('image/jpeg', 0.95);

    this.imagenCapturada.set(imagen);
    this.detenerCamaraPC();
  }

  detenerCamaraPC(): void {
    if (this.videoStream) {
      this.videoStream.getTracks().forEach(track => track.stop());
      this.videoStream = null;
    }

    this.mostrarCamara.set(false);
  }

  abrirGaleria(): void {
    this.galleryInput?.nativeElement.click();
  }

  cargarDesdeNavegador(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    const reader = new FileReader();

    reader.onload = () => {
      const result = reader.result as string;
      this.imagenCapturada.set(result);
    };

    reader.readAsDataURL(file);
  }

  reiniciar(): void {
    this.imagenCapturada.set(null);
    this.detenerCamaraPC();

    if (this.cameraInput?.nativeElement) {
      this.cameraInput.nativeElement.value = '';
    }

    if (this.galleryInput?.nativeElement) {
      this.galleryInput.nativeElement.value = '';
    }
  }

  reiniciarYTomarFoto(): void {
    this.reiniciar();
  }

  private obtenerFechaActualISO(): string {
    return new Date().toISOString().split('T')[0];
  }

  private convertirFechaIA(fecha: string | undefined | null): Date {
    if (!fecha) {
      return new Date();
    }

    const fechaLimpia = String(fecha).trim();

    // Formato correcto: YYYY-MM-DD
    if (/^\d{4}-\d{2}-\d{2}$/.test(fechaLimpia)) {
      return new Date(`${fechaLimpia}T00:00:00`);
    }

    // Formato común en tickets: dd/mm/yyyy
    if (/^\d{2}\/\d{2}\/\d{4}$/.test(fechaLimpia)) {
      const [dia, mes, anio] = fechaLimpia.split('/');
      return new Date(`${anio}-${mes}-${dia}T00:00:00`);
    }

    // Formato común en tickets: dd-mm-yyyy
    if (/^\d{2}-\d{2}-\d{4}$/.test(fechaLimpia)) {
      const [dia, mes, anio] = fechaLimpia.split('-');
      return new Date(`${anio}-${mes}-${dia}T00:00:00`);
    }

    const fechaConvertida = new Date(fechaLimpia);

    if (isNaN(fechaConvertida.getTime())) {
      return new Date();
    }

    return fechaConvertida;
  }

  async analizarConIA(): Promise<void> {
    const imagen = this.imagenCapturada();

    if (!imagen) {
      alert('Por favor, selecciona una foto primero.');
      return;
    }

    const loading = await this.loadingCtrl.create({
      message: 'Analizando ticket...'
    });

    await loading.present();

    try {
      const fechaActual = this.obtenerFechaActualISO();

      const response = await fetch(
        'google/gemini-2.0-flash-001',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openRouterKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Gasto Facil'
          },
          body: JSON.stringify({
            model: 'openrouter/free',            
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'text',
                    text: `
Analiza este ticket de compra.

Responde solamente JSON valido, sin markdown, sin explicaciones.

Formato exacto:
{
  "concepto": "Nombre del comercio o descripcion corta",
  "monto": 0,
  "fecha": "YYYY-MM-DD",
  "categoria": "comida"
}

Reglas:
- "monto" debe ser el total final del ticket.
- "fecha" debe estar en formato YYYY-MM-DD.
- Si el ticket muestra la fecha como dd/mm/aaaa, conviértela a YYYY-MM-DD.
- Si el ticket muestra la fecha como dd-mm-aaaa, conviértela a YYYY-MM-DD.
- Si no puedes leer la fecha, usa esta fecha actual: "${fechaActual}".

Categorias permitidas:
comida, transporte, servicios, entretenimiento, salud, compras, otros

Si no puedes leer algo, usa:
{
  "concepto": "Ticket",
  "monto": 0,
  "fecha": "${fechaActual}",
  "categoria": "otros"
}
                    `
                  },
                  {
                    type: 'image_url',
                    image_url: {
                      url: imagen
                    }
                  }
                ]
              }
            ],
            temperature: 0.1
          })
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Respuesta OpenRouter:', result);
        throw new Error(result?.error?.message || 'Error al conectar con la IA');
      }

      const text = result.choices?.[0]?.message?.content;

      if (!text) {
        console.error('Respuesta sin contenido:', result);
        throw new Error('La IA no devolvio contenido');
      }

      const jsonLimpio = text
        .replace(/```json/g, '')
        .replace(/```/g, '')
        .trim();

      const data = JSON.parse(jsonLimpio);

      this.gastosService.setDatosEscaneados({
        monto: Number(data.monto) || 0,
        concepto: data.concepto || 'Ticket',
        fecha: this.convertirFechaIA(data.fecha),
        categoria: (data.categoria as CategoriaGasto) || 'otros',
        creadoPorIA: true
      });

      await loading.dismiss();

      this.router.navigate(['/nuevo-gasto']);
    } catch (error) {
      await loading.dismiss();
      console.error('Error IA:', error);
      alert('Error en la IA. Intenta de nuevo.');
    }
  }
}