import {ITranslationUnitFilter} from './i-translation-unit-filter';
import {TranslationUnit} from '../translation-unit';
import {AutoTranslateSummaryReport} from '../auto-translate-summary-report';
/**
 * Filter that filters all units that should be autotranslated by google, but are ignored.
 * This cannot be decided just by looking at the unit, but you must have a list of autotranslated units.
 * This list is contained in the AutoTranslateSummaryReport.
 * Created by roobm on 10.07.2017.
 */
export class TranslationUnitFilterAutoTranslatedIgnored implements ITranslationUnitFilter {

  constructor(private autoTranslateSummaryReport: AutoTranslateSummaryReport) {

  }

  public filters(tu: TranslationUnit): boolean {
    if (this.autoTranslateSummaryReport) {
      const autotranslateResult = this.autoTranslateSummaryReport.singleResult(tu.id());
      return autotranslateResult && autotranslateResult.ignored();
    } else {
      return false;
    }
  }

  public name(): string {
    return 'autotranslatedIgnored';
  }
}
