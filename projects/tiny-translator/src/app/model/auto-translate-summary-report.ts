import {AutoTranslateResult} from './auto-translate-result';
import {format} from 'util';
/**
 * A report about a run of Google Translate over all untranslated unit.
 * * Created by martin on 29.06.2017.
 */

export class AutoTranslateSummaryReport {

  private _total: number;
  private _ignored: number;
  private _success: number;
  private _failed: number;
  private _allResults: {[id: string]: AutoTranslateResult};

  constructor() {
    this._allResults = {};
    this._total = 0;
    this._ignored = 0;
    this._success = 0;
    this._failed = 0;
  }

  /**
   * Add a single result to the summary.
   * @param result
   */
  public addSingleResult(result: AutoTranslateResult) {
    this._allResults[result.translationUnit().id()] = result;
    this._total++;
    if (result.success()) {
      if (result.ignored()) {
        this._ignored++;
      } else {
        this._success++;
      }
    } else {
      this._failed++;
    }
  }

  /**
   * Merge another summary into this one.
   * @param anotherSummary
   */
  public merge(anotherSummary: AutoTranslateSummaryReport) {
    this._allResults = Object.assign({}, this._allResults, anotherSummary._allResults);
    this._total += anotherSummary.total();
    this._ignored += anotherSummary.ignored();
    this._success += anotherSummary.success();
    this._failed += anotherSummary.failed();
  }

  public total(): number {
    return this._total;
  }

  public ignored(): number {
    return this._ignored;
  }

  public success(): number {
    return this._success;
  }

  public failed(): number {
    return this._failed;
  }

  /**
   * Human readable version of report
   */
  public content(): string {
    return format('Total translated: %s\nIgnored: %s\nSuccesful: %s\nFailed: %s',
      this._total, this._ignored, this._success, this._failed);
  }

  public singleResult(tuId: string): AutoTranslateResult {
    return this._allResults[tuId];
  }

  public allResults(): AutoTranslateResult[] {
    const result: AutoTranslateResult[] = [];
    Object.keys(this._allResults).forEach((val) => {
      result.push(this._allResults[val]);
    })
    return result;
  }
}
