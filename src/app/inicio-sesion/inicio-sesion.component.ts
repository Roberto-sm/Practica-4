import { Component, inject } from '@angular/core';
import { SupabaseService } from '../services/supabase.service';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonContent } from '@ionic/angular/standalone';

@Component({
  selector: 'app-inicio-sesion',
  templateUrl: './inicio-sesion.component.html',
  styleUrls: ['./inicio-sesion.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent]
})
export class InicioSesionComponent {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  email = '';
  password = '';
  loading = false;

  async iniciarSesion() {
    if (!this.email || !this.password) {
      alert('Por favor completa todos los campos.');
      return;
    }

    this.loading = true;

    try {
      const { data, error } = await this.supabase.client.auth.signInWithPassword({
        email: this.email,
        password: this.password,
      });

      if (error) throw error;

      // Redirección directa al Home usando el enrutador clásico
      console.log('Login correcto, navegando al home...');
      this.router.navigate(['/home'], { replaceUrl: true });

    } catch (error: any) {
      console.error('Error al ingresar:', error);

      // 💡 SOLUCIÓN PUNTO 2: Extraemos el mensaje real o forzamos la lectura del objeto
      let mensajeError = 'Credenciales incorrectas o error de red';

      if (error) {
        if (typeof error === 'string') {
          mensajeError = error;
        } else if (error.message) {
          mensajeError = error.message; // El mensaje estándar que manda Supabase
        } else if (error.error_description) {
          mensajeError = error.error_description;
        } else {
          // Si todo lo demás falla, forzamos la conversión a texto para que Android no pinte {}
          mensajeError = JSON.stringify(error); 
        }
      }

      alert(mensajeError);
    } finally {
      this.loading = false;
    }
  }
}