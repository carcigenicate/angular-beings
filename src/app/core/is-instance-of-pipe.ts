import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'isInstanceOf',
})
export class IsInstanceOfPipe implements PipeTransform {

  transform<T>(value: unknown, type: new (...args: any[]) => T): value is T {
    return value instanceof type;
  }

}
