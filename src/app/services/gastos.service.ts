import { Injectable, signal, inject } from '@angular/core'; // 💡 Importamos inject
import { SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';
import { Gasto, CategoriaGasto, CATEGORIAS } from '../models/gasto.model';
import { SupabaseService } from './supabase.service'; // 💡 Importamos tu servicio global (Ajusta la ruta si es necesario)

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  // 💡 Inyectamos el servicio central que maneja el login y la sesión activa
  private supabaseService = inject(SupabaseService);

  gastos = signal<Gasto[]>([]); // se extraen del supabase para calcular promedio
  datosEscaneados = signal<Partial<Gasto> | null>(null);
  gastoEditando = signal<Gasto | null>(null);

  cargando = signal(false);
  yaCargo = signal(false);

  constructor() {
    // 💡 Eliminamos el createClient manual para que use la sesión del usuario logueado
    this.cargarGastos();
  }

  async cargarGastos(): Promise<void> {
    this.cargando.set(true);

    // 💡 Usamos el cliente autenticado global: this.supabaseService.client
    const { data, error } = await this.supabaseService.client
      .from('gastos')
      .select('*')
      .order('fecha', { ascending: false });

    this.cargando.set(false);

    if (error) {
      console.error('Error cargando gastos:', error);
      return;
    }

    const gastosFormateados: Gasto[] = (data || []).map(g => ({
      id: g.id,
      monto: Number(g.monto) || 0,
      concepto: g.concepto || 'Sin concepto',
      categoria: (g.categoria as CategoriaGasto) || 'otros',
      metodoPago: g.metodo_pago,
      notes: g.notas,
      imagenTicket: g.imagen_ticket,
      fecha: new Date(g.fecha),
      creadoPorIA: Boolean(g.creado_por_ia)
    }));

    this.gastos.set(gastosFormateados);
    this.yaCargo.set(true);
  }

  async recargarGastos(): Promise<void> {
    await this.cargarGastos();
  }

  async agregarGasto(gasto: Omit<Gasto, 'id'>): Promise<void> {
    // 💡 Usamos el cliente autenticado global
    const { error } = await this.supabaseService.client
      .from('gastos')
      .insert([{
        monto: gasto.monto,
        concepto: gasto.concepto,
        categoria: gasto.categoria,
        metodo_pago: gasto.metodoPago,
        notas: gasto.notas || null,
        imagen_ticket: gasto.imagenTicket || null,
        creado_por_ia: gasto.creadoPorIA || false,
        fecha: new Date(gasto.fecha).toISOString()
      }]);

    if (error) {
      console.error('Error al guardar en BD:', error);
      alert('Error al guardar en BD: ' + error.message);
      return;
    }

    await this.cargarGastos();
  }

  async actualizarGasto(id: string, gasto: Omit<Gasto, 'id'>): Promise<void> {
    // 💡 Usamos el cliente autenticado global
    const { error } = await this.supabaseService.client
      .from('gastos')
      .update({
        monto: gasto.monto,
        concepto: gasto.concepto,
        categoria: gasto.categoria,
        metodo_pago: gasto.metodoPago,
        notas: gasto.notas || null,
        imagen_ticket: gasto.imagenTicket || null,
        creado_por_ia: gasto.creadoPorIA || false,
        fecha: new Date(gasto.fecha).toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('Error actualizando gasto:', error);
      alert('Error al actualizar gasto: ' + error.message);
      return;
    }

    await this.cargarGastos();
  }

  async eliminarGasto(id: string): Promise<void> {
    // 💡 Usamos el cliente autenticado global
    const { error } = await this.supabaseService.client
      .from('gastos')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error eliminando gasto:', error);
      alert('Error eliminando gasto: ' + error.message);
      return;
    }

    await this.cargarGastos();
  }

  setDatosEscaneados(datos: Partial<Gasto>): void {
    this.datosEscaneados.set(datos);
  }

  clearDatosEscaneados(): void {
    this.datosEscaneados.set(null);
  }

  setGastoEditando(gasto: Gasto): void {
    this.gastoEditando.set(gasto);
  }

  clearGastoEditando(): void {
    this.gastoEditando.set(null);
  }

  gastosRecientes(): Gasto[] {
    return this.gastos().slice(0, 5);
  }

  totalMes(): number {
    const ahora = new Date();
    return this.totalPorMes(ahora);
  }

  totalPorMes(fechaReferencia: Date): number {
    const mes = fechaReferencia.getMonth();
    const anio = fechaReferencia.getFullYear();
    // filtra los gastos del mes y año especificados y suma sus montos

    return this.gastos()
      .filter(g => {
        const fecha = new Date(g.fecha);
        return (
          fecha.getMonth() === mes &&
          fecha.getFullYear() === anio
        );
      })
      .reduce((sum, g) => sum + Number(g.monto), 0);
  }

  gastosPorMes(fechaReferencia: Date): Gasto[] {
    const mes = fechaReferencia.getMonth();
    const anio = fechaReferencia.getFullYear();
    // retorna los gastos del mes y año especificados de ese periodo para evaluar el promedio.

    return this.gastos()
      .filter(g => {
        const fecha = new Date(g.fecha);
        return (
          fecha.getMonth() === mes &&
          fecha.getFullYear() === anio
        );
      });
  }

  totalGeneral(): number {
    return this.gastos()
      .reduce((sum, g) => sum + Number(g.monto), 0);
  }

  numeroGastos(): number {
    return this.gastos().length;
  }

  numeroTickets(): number {
    return this.gastos()
      .filter(g => g.creadoPorIA)
      .length;
  }

  numeroGastosPorMes(fechaReferencia: Date): number {
    return this.gastosPorMes(fechaReferencia).length;
  }

  numeroTicketsPorMes(fechaReferencia: Date): number {
    return this.gastosPorMes(fechaReferencia)
      .filter(g => g.creadoPorIA)
      .length;
  }

  categoriaTop() {
    const categorias = this.totalPorCategoria();

    if (categorias.length === 0) {
      return {
        categoria: {
          id: 'otros' as CategoriaGasto,
          nombre: 'Sin datos',
          icono: 'ellipsis-horizontal',
          color: '#9ca3af'
        },
        total: 0,
        porcentaje: 0
      };
    }

    return categorias[0];
  }

  categoriaTopPorMes(fechaReferencia: Date) {
    const categorias = this.totalPorCategoriaDeLista(
      this.gastosPorMes(fechaReferencia)
    );

    if (categorias.length === 0) {
      return {
        categoria: {
          id: 'otros' as CategoriaGasto,
          nombre: 'Sin datos',
          icono: 'ellipsis-horizontal',
          color: '#9ca3af'
        },
        total: 0,
        porcentaje: 0
      };
    }

    return categorias[0];
  }

  totalPorCategoria() {
    return this.totalPorCategoriaDeLista(this.gastos());
  }

  private totalPorCategoriaDeLista(gastos: Gasto[]) {
    const categoriasMap = new Map<string, number>();
    let totalGeneral = 0;

    gastos.forEach(g => {
      const totalCat = categoriasMap.get(g.categoria) || 0;
      const monto = Number(g.monto) || 0;

      categoriasMap.set(g.categoria, totalCat + monto);
      totalGeneral += monto;
    });

    return Array.from(categoriasMap.entries())
      .map(([categoriaId, total]) => {
        const categoriaObj = CATEGORIAS.find(c => c.id === categoriaId) || {
          id: categoriaId as CategoriaGasto,
          nombre: 'Otros',
          icono: 'ellipsis-horizontal',
          color: '#9ca3af'
        };

        return {
          categoria: categoriaObj,
          total,
          porcentaje: totalGeneral > 0 ? (total / totalGeneral) * 100 : 0
        };
      })
      .sort((a, b) => b.total - a.total);
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(Number(monto) || 0);
  }

  formatearFecha(fecha: Date | string): string {
    return new Intl.DateTimeFormat('es-MX', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    }).format(new Date(fecha));
  }
}