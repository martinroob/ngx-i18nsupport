import {ITranslationUnitFilter} from './i-translation-unit-filter';
import {TranslationUnit} from '../translation-unit';
import {STATE_TRANSLATED} from'@ngx-i18nsupport/ngx-i18nsupport-lib';
/**
 * Filter that filters all units that have status "translated".
 * Created by martin on 30.05.2017.
 */
export class TranslationUnitFilterNeedsReview implements ITranslationUnitFilter {

  public filters(tu: TranslationUnit): boolean {
    return tu.targetState() === STATE_TRANSLATED;
  }

  public name(): string {
    return 'needsReview';
  }
}
