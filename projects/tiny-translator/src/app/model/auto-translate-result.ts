import {TranslationUnit} from './translation-unit';
/**
 * Created by martin on 29.06.2017.
 */

export class AutoTranslateResult {

  public static Success(tu: TranslationUnit): AutoTranslateResult {
    return new AutoTranslateResult(tu, true, false, null);
  }

  public static Failed(tu: TranslationUnit, details: string): AutoTranslateResult {
    return new AutoTranslateResult(tu, false, false, details);
  }

  public static Ignored(tu: TranslationUnit, details: string): AutoTranslateResult {
    return new AutoTranslateResult(tu, true, true, details);
  }

  private constructor(private _transUnit: TranslationUnit, private _success: boolean, private _ignored: boolean, private _details: string) {

  }

  public success(): boolean {
    return this._success;
  }

  public failed(): boolean {
    return !this._success;
  }

  public ignored(): boolean {
    return this._ignored;
  }

  public details(): string {
    return this._details;
  }

  public translationUnit(): TranslationUnit {
    return this._transUnit;
  }

}
