import {AutoTranslateResult} from './auto-translate-result';
import {format} from 'util';
import {ITransUnit} from 'ngx-i18nsupport-lib/dist';
/**
 * A report about a run of Google Translate over all untranslated unit.
 * * Created by martin on 29.06.2017.
 */

export class AutoTranslateSummaryReport {

  private _error: string;
  private _total: number;
  private _ignored: number;
  private _success: number;
  private _failed: number;

  constructor() {
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

  public total(): number {
    return this._total;
  }

  /**
   * Human readable version of report
   */
  public content(): string {
    let result;
    if (this._error) {
      result = format('Translate failed: %s, Failed: %s', this._error, this._failed);
    } else {
      result = format('Total translated: %s, Ignored: %s, Succesful: %s, Failed: %s', this._total, this._ignored, this._success, this._failed);
    }
    return result;
  }
}
