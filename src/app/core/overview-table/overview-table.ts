import { Component, input, Signal, WritableSignal } from '@angular/core';
import { DecimalPipe, SlicePipe } from '@angular/common';
import { ProgressBar } from 'primeng/progressbar';
import { TableModule } from 'primeng/table';
import { Environment } from '../environment';
import { Being } from '../../models/Being';
import { Draw } from '../draw';

@Component({
  selector: 'app-overview-table',
  imports: [
    DecimalPipe,
    ProgressBar,
    TableModule,
    SlicePipe
  ],
  templateUrl: './overview-table.html',
  styleUrl: './overview-table.scss',
})
export class OverviewTable {
  examineTableRowHeightPx: number = 50;

  beings: Signal<Being[]>;
  selectedBeing: WritableSignal<Being | null>;
  groupColors: Record<string, string>;

  constructor(
    private environmentService: Environment,
    private drawService: Draw,
  ) {
    this.beings = this.environmentService.beings;
    this.selectedBeing = this.environmentService.selectedBeing;
    this.groupColors = this.drawService.groupColors;
  }
}
