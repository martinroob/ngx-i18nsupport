/**
 * Created by martin on 29.06.2017.
 */

export class AutoTranslateResult {

  constructor(private _success: boolean, private _details: string) {

  }

  public success(): boolean {
    return this._success;
  }
}
