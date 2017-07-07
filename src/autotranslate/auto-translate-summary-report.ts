import {AutoTranslateResult} from './auto-translate-result';
import {format} from 'util';
import {ITransUnit} from 'ngx-i18nsupport-lib/dist';
/**
 * A report about a run of Google Translate over all untranslated unit.
 * * Created by martin on 29.06.2017.
 */

export class AutoTranslateSummaryReport {

  private _error: string;
  private _from: string;
  private _to: string;
  private _total: number;
  private _ignored: number;
  private _success: number;
  private _failed: number;

  constructor(from: string, to: string) {
    this._from = from;
    this._to = to;
    this._total = 0;
    this._ignored = 0;
    this._success = 0;
    this._failed = 0;
  }

  /**
   * Set error if total call failed (e.g. "invalid api key" or "no connection" ...)
   * @param error
   * @param total
   */
  public setError(error: string, total: number) {
    this._error = error;
    this._total = total;
    this._failed = total;
  }

  public error(): string {
    return this._error;
  }

  public setIgnored(ignored: number) {
    this._total += ignored;
    this._ignored = ignored;
  }

  /**
   * Add a single result to the summary.
   * @param tu
   * @param result
   */
  public addSingleResult(tu: ITransUnit, result: AutoTranslateResult) {
    // TODO
    this._total++;
    if (result.success()) {
      this._success++;
    } else {
      this._failed++;
    }
  }

  /**
   * Merge another summary into this one.
   * @param anotherSummary
   */
  public merge(anotherSummary: AutoTranslateSummaryReport) {
    if (!this._error) {
      this._error = anotherSummary._error;
    }
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
    let result;
    if (this._error) {
      result = format('Auto translation from "%s" to "%s" failed: "%s", failed units: %s', this._from, this._to, this._error, this._failed);
    } else {
      result = format('Auto translation from "%s" to "%s", total auto translated units: %s, ignored: %s, succesful: %s, failed: %s',
          this._from, this._to, this._total, this._ignored, this._success, this._failed);
    }
    return result;
  }
}
