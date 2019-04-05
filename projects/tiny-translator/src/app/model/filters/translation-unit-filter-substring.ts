import {ITranslationUnitFilter} from './i-translation-unit-filter';
import {TranslationUnit} from '../translation-unit';
import {isNullOrUndefined} from '../../common/util';
/**
 * Filter that filters units, that contain a given substring in source or target.
 * Created by martin on 01.06.2017.
 */
export class TranslationUnitFilterSubstring implements ITranslationUnitFilter {

  constructor(private substring: string) {
  }

  public filters(tu: TranslationUnit): boolean {
    if (!this.substring) {
      return true;
    }
    const source = tu.sourceContent();
    if (this.matches(source)) {
      return true;
    }
    const target = tu.targetContent();
    if (this.matches(target)) {
      return true;
    }
    return false;
  }

  private matches(val: string): boolean {
    if (isNullOrUndefined(val)) {
      return false;
    }
    return val.toLowerCase().includes(this.substring.toLowerCase());
  }

  public name(): string {
    return 'bySubstring';
  }

  public substringFilterPattern(): string {
    return this.substring;
  }
}
