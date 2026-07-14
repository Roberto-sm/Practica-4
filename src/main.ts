import { enableProdMode, isDevMode } from '@angular/core';
import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { defineCustomElements } from '@ionic/pwa-elements/loader'; // <-- ESTO ES CLAVE

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { environment } from './environments/environment';
import { provideServiceWorker } from '@angular/service-worker';

if (environment.production) {
  enableProdMode();
}

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes), 
    
    // 💡 CORRECCIÓN: Eliminamos el duplicado y añadimos una condición para desactivarlo en Android
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !window.location.origin.includes('caps://') && !window.location.href.startsWith('http://localhost:80'),
      registrationStrategy: 'registerWhenStable:30000'
    }),
  ],
});

// ESTO FUERZA A QUE LA CÁMARA CARGUE EN EL NAVEGADOR
defineCustomElements(window);