import { Injectable } from '@angular/core';
import {ITranslationUnitFilter} from './i-translation-unit-filter';
import {TranslationUnitFilterAll} from './translation-unit-filter-all';
import {TranslationUnitFilterAutoTranslated} from './translation-unit-filter-autotranslated';
import {AutoTranslateSummaryReport} from '../auto-translate-summary-report';
import {TranslationUnitFilterAutoTranslatedFailed} from './translation-unit-filter-autotranslated-failed';
import {TranslationUnitFilterAutoTranslatedIgnored} from './translation-unit-filter-autotranslated-ignored';
import {TranslationUnitFilterNeedsReview} from './translation-unit-filter-needs-review';
import {TranslationUnitFilterSubstring} from './translation-unit-filter-substring';
import {TranslationUnitFilterUntranslated} from './translation-unit-filter-untranslated';

export const FILTER_ALL = 'all';
export const FILTER_AUTOTRANSLATED = 'autotranslated';
export const FILTER_AUTOTRANSLATED_FAILED = 'autotranslatedFailed';
export const FILTER_AUTOTRANSLATED_IGNORED = 'autotranslatedIgnored';
export const FILTER_NEEDS_REVIEW = 'needsReview';
export const FILTER_SUBSTRING = 'bySubstring';
export const FILTER_UNTRANSLATED = 'untranslated';

@Injectable()
export class TranslationUnitFilterService {

  private _autoTranslateSummaryReport: AutoTranslateSummaryReport;

  constructor() {
  }

  /**
   * Create a new filter.
   * @param name one of the FILTER_.. constants
   * @param substr Substring in case of FILTER_SUBSTRING
   * @return {ITranslationUnitFilter} new filter instance
   */
  public getFilter(name: string, substr?: string): ITranslationUnitFilter {
    switch (name) {
      case FILTER_ALL:
        return new TranslationUnitFilterAll();
      case 'autotranslated':
        return new TranslationUnitFilterAutoTranslated(this._autoTranslateSummaryReport);
      case 'autotranslatedFailed':
        return new TranslationUnitFilterAutoTranslatedFailed(this._autoTranslateSummaryReport);
      case 'autotranslatedIgnored':
        return new TranslationUnitFilterAutoTranslatedIgnored(this._autoTranslateSummaryReport);
      case 'needsReview':
        return new TranslationUnitFilterNeedsReview();
      case 'bySubstring':
        return new TranslationUnitFilterSubstring(substr);
      case 'untranslated':
        return new TranslationUnitFilterUntranslated();
    }
    return null;
  }

  /**
   * Remember the last Autotranslate Summary report.
   * Some filters need that.
   * @param summary
   */
  public setAutotranslateSummaryReport(summary: AutoTranslateSummaryReport) {
    this._autoTranslateSummaryReport = summary;
  }
}
