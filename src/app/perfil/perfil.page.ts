import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';
import { 
  IonContent, 
  IonHeader, 
  IonTitle, 
  IonToolbar, 
  IonItem, 
  IonInput, 
  IonButton, 
  IonIcon,
  IonList,
  IonLabel
} from '@ionic/angular/standalone';

@Component({
  selector: 'app-perfil',
  templateUrl: './perfil.page.html',
  styleUrls: ['./perfil.page.scss'],
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    IonContent, 
    IonHeader, 
    IonTitle, 
    IonToolbar, 
    IonItem, 
    IonInput, 
    IonButton, 
    IonIcon,
    IonList,
    IonLabel
  ]
})
export class PerfilPage implements OnInit {
  private supabase = inject(SupabaseService);
  private router = inject(Router);

  email: string = '';
  nombre: string = '';
  loading: boolean = false;
  userId: string = '';

  async ngOnInit() {
    this.cargarDatosUsuario();
  }

  async cargarDatosUsuario() {
    try {
      // 1. Obtener el usuario autenticado actual
      const { data: { user } } = await this.supabase.client.auth.getUser();
      
      if (user) {
        this.userId = user.id;
        this.email = user.email || '';

        // 2. Traer el nombre guardado en la tabla pública 'profiles'
        const { data, error } = await this.supabase.client
          .from('profiles')
          .select('nombre')
          .eq('id', user.id)
          .single();

        if (data && !error) {
          this.nombre = data.nombre || '';
        }
      }
    } catch (error) {
      console.error('Error cargando perfil:', error);
    }
  }

  async actualizarNombre() {
    if (!this.nombre.trim()) return;
    
    this.loading = true;
    try {
      // Actualizar la columna 'nombre' en Supabase para este ID
      const { error } = await this.supabase.client
        .from('profiles')
        .update({ nombre: this.nombre })
        .eq('id', this.userId);

      if (error) throw error;
      alert('Nombre actualizado con éxito 🎉');
    } catch (error: any) {
      alert(error.message || 'Error al actualizar el nombre');
    } finally {
      this.loading = false;
    }
  }

  async cerrarSesion() {
    try {
      // Cerrar la sesión en el cliente de Supabase
      await this.supabase.client.auth.signOut();
      
      // Limpiar el historial y mandar al login
      this.router.navigate(['/inicio-sesion'], { replaceUrl: true });
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  }
}