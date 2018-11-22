
import {throwError, Observable, of} from 'rxjs';

/**
 * Reasons, why you cannot use the API.
 */
export enum AutoTranslateDisabledReasonKey {
  NO_PROVIDER,
  NO_KEY,
  INVALID_KEY,
  SOURCE_LANG_NOT_SUPPORTED,
  TARGET_LANG_NOT_SUPPORTED,
  CONNECT_PROBLEM
}

export interface AutoTranslateDisabledReason {
  reason: AutoTranslateDisabledReasonKey;
  details?: string;  // in case of CONNECT_PROBLEM some readable details like status code, error message
}

export interface Language {
  language: string; // language code
  name: string; // human readable language name
}

/**
 * Interface of AutoTranslate Service API.
 * An AutoTranslateService can translate messages to other languages.
 */
export class AutoTranslateServiceAPI {

  public apiKey(): string {
    return null;
  }

  public setApiKey(apiKey: string) {
    // ignore it
  }

  /**
   * Test, wether it is active.
   * @param source the language to translate from
   * @param target the language to translate to
   */
  public canAutoTranslate(source: string, target: string): Observable<boolean> {
    return of(false);
  }

  /**
   * The reason, why canAutoTranslate returns false.
   * @param source the language to translate from
   * @param target the language to translate to
   * @return reason or null, if API is enabled.
   */
  public disabledReason(source: string, target: string): Observable<AutoTranslateDisabledReason> {
    return of({reason: AutoTranslateDisabledReasonKey.NO_PROVIDER});
  }

  /**
   * Return a list of language codes that can be used.
   * Returns codes as "language" and readable name.
   * @param target language for readable name. (default is en)
   */
  supportedLanguages(target?: string): Observable<Language[]> {
    return of([]);
  }

  /**
   * Translate a message.
   * TODO API to be designed
   * @param message the message to be translated
   * @param from source language code
   * @param to target language code
   * @return Observable with translated message or error
   */
  public translate(message: string, from: string, to: string): Observable<string> {
    return throwError('no translation service installed');
  }

  /**
   * Translate an array of messages at once.
   * @param messages the messages to be translated
   * @param from source language code
   * @param to target language code
   * @return Observable with translated messages or error
   */
  public translateMultipleStrings(messages: string[], from: string, to: string): Observable<string[]> {
    return throwError('no translation service installed');
  }
}
