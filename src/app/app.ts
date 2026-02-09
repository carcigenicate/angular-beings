import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainCanvas } from './core/main-canvas/main-canvas';
import { Card } from 'primeng/card';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, MainCanvas, Card ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('beings');
}
