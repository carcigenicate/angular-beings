import { Component, computed, input, model, OnDestroy, OnInit, Signal, signal } from '@angular/core';
import { Being, Sex } from '../../models/Being';
import { InputNumber } from 'primeng/inputnumber';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { IsInstanceOfPipe } from '../is-instance-of-pipe';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ProgressBar } from 'primeng/progressbar';
import { InputGroup } from 'primeng/inputgroup';
import { Button } from 'primeng/button';
import { InputGroupAddon } from 'primeng/inputgroupaddon';
import { v4 as uuidv4 } from 'uuid';
import { Position } from '../../models/Misc';
import * as elementUtil from '../../util/element';

@Component({
  selector: 'app-being-editor',
  imports: [
    InputNumber,
    KeyValuePipe,
    TableModule,
    FormsModule,
    DecimalPipe,
    IsInstanceOfPipe,
    InputText,
    Select,
    ProgressBar,
    InputGroup,
    Button,
    InputGroupAddon
  ],
  templateUrl: './being-editor.html',
  styleUrl: './being-editor.scss',
})
export class BeingEditor implements OnInit, OnDestroy {
  beingModel = model.required<Being>({ alias: 'being' });
  groupColors = input<Record<string, string>>({});

  canvas = input<HTMLCanvasElement | null>(null);

  positionSelectionClickHandler: ((event: MouseEvent) => void) | null = null;

  protected readonly Being = Being;

  sexOptions: { label: string; value: Sex }[] = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
  ];

  groupOptions!: Signal<string[]>;

  ngOnInit() {
    this.groupOptions = computed(() => {
      return Object.keys(this.groupColors());
    });
  }

  randomizeId() {
    this.beingModel.update((being) => {
      being.id = uuidv4();
      return being;
    });
  }

  async getPositionOnCanvasByClick(): Promise<Position> {
    return new Promise((resolve, reject) => {
      const canvas = this.canvas();
      if (canvas) {
        function clickCallback($event: MouseEvent) {
          if (canvas) {
            const pos = elementUtil.getClickPosition(canvas, $event);
            canvas.removeEventListener('click', clickCallback);
            $event.stopPropagation();
            resolve(pos);
          }
        }
        this.positionSelectionClickHandler = clickCallback;
        canvas.addEventListener('click', clickCallback);
      }
    });
  }

  async setPositionFromCanvas() {
    const canvas = this.canvas();

    if (canvas) {
      const pos = await this.getPositionOnCanvasByClick();
      this.beingModel.update((being) => {
        being.position = pos;
        return being;
      })
    }
  }

  ngOnDestroy() {
    const canvas = this.canvas();
    if (this.positionSelectionClickHandler && canvas) {
      canvas.removeEventListener('click', this.positionSelectionClickHandler);
    }
  }
}
