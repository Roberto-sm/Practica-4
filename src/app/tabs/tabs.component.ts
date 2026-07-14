import { Component } from '@angular/core';
import { Router } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  walletOutline,
  scanOutline,
  barChartOutline, personOutline } from 'ionicons/icons';

@Component({
  selector: 'app-tabs',
  templateUrl: 'tabs.component.html',
  styleUrls: ['tabs.component.scss'],
  standalone: true,
  imports: [
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
})
export class TabsComponent {
  constructor(private router: Router) {
    addIcons({homeOutline,walletOutline,scanOutline,barChartOutline,personOutline,});
  }

  irAEscanear(event: Event): void {
    event.preventDefault();
    event.stopPropagation();
    this.router.navigate(['/escanear']);
  }
}
