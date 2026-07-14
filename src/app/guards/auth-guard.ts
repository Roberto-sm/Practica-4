import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service'; // Ajusta la ruta a tu servicio

// REGLA 1: Proteger páginas privadas (como el Home)
export const authGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  // Le pedimos a Supabase la sesión actual
  const { data: { session } } = await supabase.client.auth.getSession();

  if (session) {
    return true; // SÍ está logueado, lo dejamos pasar al Home
  } else {
    // NO está logueado, lo redirigimos al login
    router.navigate(['/inicio-sesion'], { replaceUrl: true });
    return false;
  }
};

// REGLA 2: Evitar que un usuario ya logueado vuelva a ver el Login
export const redirectIfLoggedInGuard: CanActivateFn = async (route, state) => {
  const supabase = inject(SupabaseService);
  const router = inject(Router);

  const { data: { session } } = await supabase.client.auth.getSession();

  if (session) {
    // Si ya está logueado y quiere entrar al login, lo mandamos al Home
    router.navigate(['/home'], { replaceUrl: true });
    return false;
  }
  return true; // Si no está logueado, lo dejamos ver el login normalmente
};