import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupabaseService {
  private supabase: SupabaseClient;
  private userRole: string | null = null; // Caché del rol en memoria

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          // 💡 CAMBIADO A FALSE: Evita guardar la sesión en el localStorage.
          // Al recargar o reabrir la app, siempre te mandará al login.
          persistSession: false, 
          autoRefreshToken: true,
          detectSessionInUrl: true,
          // 💡 ESTA LÍNEA ES la que remedia el error "NavigatorLockAcquireTimeoutError"
          // @ts-ignore: propiedad experimental de Supabase
          navigatorLock: { choice: 'use-backend' }
        }
      }
    );
  }

  get client(): SupabaseClient {
    return this.supabase;
  }

  /**
   * Obtiene el rol del usuario actual desde la tabla 'profiles'
   */
  async getProfileRole(): Promise<string> {
    if (this.userRole) return this.userRole as string; // Si ya lo leímos antes, lo devuelve rápido

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      if (!user) return 'standard';

      const { data, error } = await this.supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (error || !data) return 'standard';
      
      this.userRole = data.role; // Guardamos en caché
      return this.userRole as string;
    } catch {
      return 'standard';
    }
  }

  /**
   * Limpia la sesión y resetea el rol en caché
   */
  async cerrarSesion() {
    await this.supabase.auth.signOut();
    this.userRole = null;
  }
}