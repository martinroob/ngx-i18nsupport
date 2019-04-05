import { Pipe, PipeTransform } from '@angular/core';
import {isNullOrUndefined, isString} from '../common/util';

/**
 * A Pipe to abbreviate long text.
 * The text is cut and .. is added at the end.
 * The length can be given as parameter.
 * Default is 20.
 * Examples:
 * 'abcdefghijklmnopqrstuvwxyz' | abbreviate -> 'abcdefghijklmnopqrst..'
 * 'abcdefghijklmnopqrstuvwxyz' | abbreviate:5 -> 'abcde..'
 */
@Pipe({
  name: 'abbreviate'
})
export class AbbreviatePipe implements PipeTransform {

  private DEFAULT_LENGTH = 20; // aabreviation length if not given as parameter

  transform(value: string, lengthParam?: number): any {
    const length = (!isNullOrUndefined(lengthParam))? lengthParam : this.DEFAULT_LENGTH;
    if (isString(value)) {
      if (value.length > length) {
        return value.substring(0, length).concat('..');
      } else {
        return value;
      }
    }
    return value;
  }

}
