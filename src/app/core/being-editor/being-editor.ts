import { Component, computed, input, model, Signal, signal } from '@angular/core';
import { Being, Sex } from '../../models/Being';
import { InputNumber } from 'primeng/inputnumber';
import { DecimalPipe, KeyValuePipe } from '@angular/common';
import { TableModule } from 'primeng/table';
import { FormsModule } from '@angular/forms';
import { IsInstanceOfPipe } from '../is-instance-of-pipe';
import { InputText } from 'primeng/inputtext';
import { Select } from 'primeng/select';
import { ProgressBar } from 'primeng/progressbar';

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
    ProgressBar
  ],
  templateUrl: './being-editor.html',
  styleUrl: './being-editor.scss',
})
export class BeingEditor {
  beingModel = model.required<Being>({ alias: 'being' });
  groupColors = input<Record<string, string>>({});

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
}
