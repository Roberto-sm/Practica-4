import { Routes } from '@angular/router';
import { authGuard, redirectIfLoggedInGuard } from './guards/auth-guard'; // <-- Asegúrate de que la ruta a tu guard sea correcta

export const routes: Routes = [
  // 1. PÁGINA PÚBLICA: Inicio de sesión (Fuera de los tabs para pantalla completa)
  {
    path: 'inicio-sesion',
    loadComponent: () => import('./inicio-sesion/inicio-sesion.component').then(m => m.InicioSesionComponent),
    canActivate: [redirectIfLoggedInGuard] // Si ya está logueado, lo rebota al Home automáticamente
  },

  // 2. RUTA RAÍZ PROTEGIDA: Contiene el contenedor de pestañas (Tabs)
  {
    path: '',
    loadComponent: () => import('./tabs/tabs.component').then(m => m.TabsComponent),
    canActivate: [authGuard], // <-- PROTEGE TODO: Si no hay sesión, este guard te manda a /inicio-sesion
    children: [
      {
        path: '',
        redirectTo: 'home', // Al entrar con sesión activa, la pestaña por defecto será Home
        pathMatch: 'full'
      },
      {
        path: 'home',
        loadComponent: () => import('./home/home.page').then(m => m.HomePage)
      },
      {
        path: 'gastos',
        loadComponent: () => import('./gastos/gastos.page').then(m => m.GastosService)
      },
      {
        path: 'escanear',
        loadComponent: () => import('./escanear/escanear.page').then(m => m.EscanearPage)
      },
      {
        path: 'resumen',
        loadComponent: () => import('./resumen/resumen.page').then(m => m.ResumenPage)
      },
      // 💡 PERFIL INTEGRADO: Al estar aquí dentro, conservará la barra de navegación de abajo
      {
        path: 'perfil',
        loadComponent: () => import('./perfil/perfil.page').then(m => m.PerfilPage)
      }
    ]
  },

  // 3. OTRAS PÁGINAS PRIVADAS (Fuera de los tabs, se abren cubriendo toda la pantalla)
  {
    path: 'nuevo-gasto',
    loadComponent: () => import('./nuevo-gasto/nuevo-gasto.page').then(m => m.NuevoGastoPage),
    canActivate: [authGuard] // Protegido
  },
  {
    path: 'confirmar-gasto',
    loadComponent: () => import('./confirmar-gasto/confirmar-gasto.page').then(m => m.ConfirmarGastoPage),
    canActivate: [authGuard] // Protegido
  },

  // 4. COMODÍN: Cualquier ruta desconocida redirige a la raíz
  // Importante: Siempre debe ir al final de todo el arreglo de rutas
  {
    path: '**',
    redirectTo: ''
  }
];