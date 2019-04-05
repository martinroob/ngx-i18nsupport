import {ITranslationUnitFilter} from './i-translation-unit-filter';
import {TranslationUnit} from '../translation-unit';
import {STATE_TRANSLATED} from '@ngx-i18nsupport/ngx-i18nsupport-lib';
import {AutoTranslateSummaryReport} from '../auto-translate-summary-report';
import {isNullOrUndefined} from '../../common/util';
/**
 * Filter that filters all units that are autotranslated by google.
 * This cannot be decided just by looking at the unit, but you must have a list of autotranslated units.
 * This list is contained in the AutoTranslateSummaryReport.
 * Created by roobm on 10.07.2017.
 */
export class TranslationUnitFilterAutoTranslated implements ITranslationUnitFilter {

  constructor(private autoTranslateSummaryReport: AutoTranslateSummaryReport) {

  }

  public filters(tu: TranslationUnit): boolean {
    return this.autoTranslateSummaryReport && tu.targetState() === STATE_TRANSLATED && !isNullOrUndefined(this.autoTranslateSummaryReport.singleResult(tu.id()));
  }

  public name(): string {
    return 'autotranslated';
  }
}
