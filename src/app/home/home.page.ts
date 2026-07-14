import { Component, inject, signal } from '@angular/core'; 
import { Router } from '@angular/router';
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
  IonFab,
  IonFabButton,
} from '@ionic/angular/standalone';

import { addIcons } from 'ionicons';
import {
  wallet,
  searchOutline,
  notificationsOutline,
  trendingUp,
  walletOutline,
  receiptOutline,
  restaurantOutline,
  cameraOutline,
  chevronForward,
  chevronBack,
  add,
  restaurant,
  car,
  flash,
  medkit,
  ellipsisHorizontal,
} from 'ionicons/icons';

import { GastosService } from '../services/gastos.service';
import { SupabaseService } from '../services/supabase.service'; 
import { CategoriaGasto, CATEGORIAS } from '../models/gasto.model';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
  standalone: true,
  imports: [
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
    IonFab,
    IonFabButton,
  ],
})
export class HomePage {
  gastosService = inject(GastosService);
  private supabaseService = inject(SupabaseService); 
  private router = inject(Router);

  mesSeleccionado: Date = new Date();
  
  nombreUsuario = signal<string>('Usuario');
  
  // Signals para la auditoría inteligente de IA
  consejoIA = signal<string | null>(null);
  mostrarPlanAlivio = signal<boolean>(false); 
  montoARecortar = signal<number>(0);         

  constructor() {
    addIcons({
      wallet,
      searchOutline,
      notificationsOutline,
      trendingUp,
      walletOutline,
      receiptOutline,
      restaurantOutline,
      cameraOutline,
      chevronForward,
      chevronBack,
      add,
      restaurant,
      car,
      flash,
      medkit,
      ellipsisHorizontal,
    });
  }

  async ionViewWillEnter(): Promise<void> {
    await this.gastosService.recargarGastos();
    await this.obtenerPerfilUsuario();
    this.detectarAnomaliasDeGasto();
  }

  async obtenerPerfilUsuario(): Promise<void> {
    try {
      const { data: { user }, error: authError } = await this.supabaseService.client.auth.getUser();

      if (authError || !user) return;

      const { data: perfil, error: perfilError } = await this.supabaseService.client
        .from('profiles')
        .select('nombre, email')
        .eq('id', user.id)
        .single();

      if (perfil && perfil.nombre) {
        this.nombreUsuario.set(perfil.nombre);
      } else if (user.email) {
        const alias = user.email.split('@')[0];
        this.nombreUsuario.set(alias.charAt(0).toUpperCase() + alias.slice(1));
      }
    } catch (err) {
      console.error('Error al mapear el perfil del usuario:', err);
    }
  }

  detectarAnomaliasDeGasto(): void {
    const gastos = this.gastosMesSeleccionado();
    const LIMITE_PROMEDIO = 500; 

    const totalesPorCategoria = gastos.reduce((acc, g) => {
      acc[g.categoria] = (acc[g.categoria] || 0) + g.monto;
      return acc;
    }, {} as Record<string, number>);

    const categoriaAlerta = Object.keys(totalesPorCategoria).find(
      cat => totalesPorCategoria[cat] > LIMITE_PROMEDIO && (cat === 'alimentacion' || cat === 'entretenimiento')
    );

    if (categoriaAlerta) {
      // Calculamos cuánto dinero se pasó del presupuesto asignado
      const exceso = totalesPorCategoria[categoriaAlerta] - LIMITE_PROMEDIO;
      this.montoARecortar.set(exceso);

      const consejosFormulados = [
        "⚠️ Detecté un pico de antojos en esta categoría. Darse gustos es genial, pero que no devoren tu meta del mes.",
        "💡 Tus gastos aquí superaron los $500. El 'efecto hormiga' por puros gustos frena tu libertad financiera. ¡Ojo ahí!",
        "🔥 Alerta de salud financiera: Estás gastando más de tu promedio por mero placer. Ajusta el freno antes de que acabe el mes.",
        "📊 Tu IA detectó anomalías: Disfrutar está bien, pero el interés compuesto de tus ahorros rinde más que ese gasto momentáneo."
      ];

      const indiceAleatorio = Math.floor(Math.random() * consejosFormulados.length);
      this.consejoIA.set(consejosFormulados[indiceAleatorio]);
    } else {
      this.consejoIA.set(null); 
      this.mostrarPlanAlivio.set(false);
    }
  }

  togglePlanAlivio(): void {
    this.mostrarPlanAlivio.update(v => !v);
  }

  mesAnterior(): void {
    this.mesSeleccionado = new Date(
      this.mesSeleccionado.getFullYear(),
      this.mesSeleccionado.getMonth() - 1,
      1
    );
    this.detectarAnomaliasDeGasto();
  }

  mesSiguiente(): void {
    this.mesSeleccionado = new Date(
      this.mesSeleccionado.getFullYear(),
      this.mesSeleccionado.getMonth() + 1,
      1
    );
    this.detectarAnomaliasDeGasto();
  }

  nombreMesSeleccionado(): string {
    return new Intl.DateTimeFormat('es-MX', {
      month: 'long',
      year: 'numeric'
    }).format(this.mesSeleccionado);
  }

  totalMesSeleccionado(): number {
    return this.gastosService.totalPorMes(this.mesSeleccionado);
  }

  gastosMesSeleccionado() {
    return this.gastosService.gastosPorMes(this.mesSeleccionado);
  }

  ticketsMesSeleccionado(): number {
    return this.gastosMesSeleccionado()
      .filter(g => g.creadoPorIA)
      .length;
  }

  getTopCategoria(): string {
    const resumen = this.gastosService.categoriaTopPorMes(this.mesSeleccionado);

    if (resumen && resumen.categoria) {
      return resumen.categoria.nombre;
    }

    return 'N/A';
  }

  getCategoriaIcon(categoria: CategoriaGasto): string {
    return CATEGORIAS.find(c => c.id === categoria)?.icono || 'ellipsis-horizontal';
  }

  getCategoriaColor(categoria: CategoriaGasto): string {
    return CATEGORIAS.find(c => c.id === categoria)?.color || '#8B5CF6';
  }

  irAEscanear(): void {
    this.router.navigate(['/escanear']);
  }

  irAGastos(): void {
    this.router.navigate(['/gastos']);
  }

  irANuevoGasto(): void {
    this.gastosService.clearGastoEditando();
    this.router.navigate(['/nuevo-gasto']);
  }
}