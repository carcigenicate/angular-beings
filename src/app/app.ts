import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MainCanvas } from './core/main-canvas/main-canvas';

@Component({
  selector: 'app-root',
  imports: [ RouterOutlet, MainCanvas ],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('beings');
}
