import { Pipe, PipeTransform } from '@angular/core';

const MILLISECONDS_PER_MINUTE = 1000 * 60;
const MILLISECONDS_PER_HOUR = MILLISECONDS_PER_MINUTE * 60;

@Pipe({
  name: 'formattedAge',
})
export class AgePipe implements PipeTransform {

  transform<T>(milliseconds: number): string {
    if (milliseconds <= MILLISECONDS_PER_MINUTE) {
      return `${(milliseconds / 1000).toFixed(2)} seconds`;
    } else if (milliseconds <= MILLISECONDS_PER_HOUR) {
      return `${(milliseconds / MILLISECONDS_PER_MINUTE).toFixed(2)} minutes`;
    } else {
      return `${(milliseconds / MILLISECONDS_PER_HOUR).toFixed(2)} hours`;
    }
  }

}
