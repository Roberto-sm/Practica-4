import { inject, Injectable, signal } from '@angular/core';
import { SupabaseService } from '../services/supabase.service'; // Ajusta la ruta si es necesario
import { Gasto } from '../models/gasto.model';

@Injectable({
  providedIn: 'root'
})
export class GastosService {
  private supabase: SupabaseService = inject(SupabaseService);
  
  // Tu signal de gastos actual
  gastos = signal<Gasto[]>([]);
  private gastoEditando = signal<Gasto | null>(null);

  async recargarGastos() {
    try {
      const { data, error } = await this.supabase.client
        .from('gastos')
        .select('*')
        .order('fecha', { ascending: false });

      if (error) throw error;

      this.gastos.set(data ?? []);
      return data;
    } catch (error: any) {
      console.error('Error al recargar gastos:', error);
      throw error;
    }
  }

  async agregarGasto(nuevoGasto: Omit<Gasto, 'id' | 'usuario_id'>) {
    try {
      const { data, error } = await this.supabase.client
        .from('gastos')
        .insert([
          {
            concepto: nuevoGasto.concepto,
            monto: nuevoGasto.monto,
            categoria: nuevoGasto.categoria,
            fecha: nuevoGasto.fecha || new Date().toISOString(),
            // 💡 NOTA: No enviamos "usuario_id". Supabase usará automáticamente 
            // el valor por defecto 'auth.uid()' del usuario que está logueado.
          }
        ])
        .select();

      if (error) throw error;

      // Recargamos la lista local para ver el cambio instantáneo
      await this.recargarGastos();
      return data;
    } catch (error) {
      console.error('Error al agregar gasto:', error);
      throw error;
    }
  }

  async eliminarGasto(id: string) {
    try {
      const { error } = await this.supabase.client
        .from('gastos')
        .delete()
        .eq('id', id); // 💡 RLS evitará que José borre el ID de otro usuario aunque lo intente

      if (error) throw error;

      // Actualizamos el estado local quitando el gasto eliminado
      this.gastos.set(this.gastos().filter(g => g.id !== id));
    } catch (error) {
      console.error('Error al eliminar gasto:', error);
    }
  }
}