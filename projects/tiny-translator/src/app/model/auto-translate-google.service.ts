
import {throwError as observableThrowError, Observable, BehaviorSubject, of, forkJoin} from 'rxjs';
import {Inject, Injectable} from '@angular/core';
import {
  AutoTranslateDisabledReason, AutoTranslateDisabledReasonKey, AutoTranslateServiceAPI,
  Language
} from './auto-translate-service-api';
import {APP_CONFIG, AppConfig} from '../app.config';
import {HttpClient} from '@angular/common/http';
import {isNullOrUndefined} from '../common/util';
import {catchError, map} from 'rxjs/operators';

/**
 * Types form google translate api.
 */

interface GetSupportedLanguagesRequest {
  target: string; // The language to use to return localized, human readable names of supported\nlanguages.
}

interface LanguagesResource {
  language: string; // code of the language
  name: string; // human readable name (in target language)
}

interface LanguagesListResponse {
  languages: LanguagesResource[];
}

interface TranslateTextRequest {
  q: string[];  // The input texts to translate
  target: string; // The language to use for translation of the input text
  source: string; // The language of the source text
  format?: string; // "html" (default) or "text"
  model?: string; // see public documentation
}

interface TranslationsResource {
  detectedSourceLanguage?: string;
  model?: string;
  translatedText: string;
}

interface TranslationsListResponse {
  translations: TranslationsResource[];
}

// maximum number of strings to translate in one request (a Google limit!)
const MAX_SEGMENTS = 128;

/**
 * Auto Translate Service using Google Translate.
 */
@Injectable()
export class AutoTranslateGoogleService extends AutoTranslateServiceAPI {

  private _rootUrl: string;

  private _apiKey: string;

  // a setting for tests!!
  // if set to true, all autotranslations containing placeholder or tags will FAIL BY DESIGN
  // Used to allow testing of report page and filters for failed translations.
  private failByDesign: boolean;

  /**
   * Cache of supported languages.
   */
  private _subjects: {[target: string]: BehaviorSubject<Language[]>};

  /**
   * Reason, that currently disables the API.
   * (no key, invalid key)
   */
  private _permanentFailReason: AutoTranslateDisabledReason;

  /**
   * Strip region code and convert to lower
   * @param lang lang
   * @return lang without region code and in lower case.
   */
  public static stripRegioncode(lang: string): string {
    if (isNullOrUndefined(lang)) {
      return null;
    }
    const langLower = lang.toLowerCase();
    for (let i = 0; i < langLower.length; i++) {
      const c = langLower.charAt(i);
      if (c < 'a' || c > 'z') {
        return langLower.substring(0, i);
      }
    }
    return langLower;
  }

  constructor(@Inject(APP_CONFIG) app_config: AppConfig, private httpClient: HttpClient) {
    super();
    this._rootUrl = app_config.GOOGLETRANSLATE_API_ROOT_URL;
    // API key is secret, normally it is nit configured and will be null
    // it can be set interactively in the app
    // but in the karma tests it will be set. It is stored than in environment.secret.ts (not in Git)
    this.setApiKey(app_config.GOOGLETRANSLATE_API_KEY); // must be set explicitly via setApiKey()
    this.failByDesign = false;
    if (app_config.GOOGLETRANSLATE_PROVOKE_FAILURES === true) {
      this.failByDesign = true;
    }
  }

  public apiKey(): string {
    return this._apiKey;
  }

  public setApiKey(key: string) {
    this._apiKey = key;
    this._permanentFailReason = null;
    this._subjects = {};
    if (!this._apiKey) {
      this._permanentFailReason = {reason: AutoTranslateDisabledReasonKey.NO_KEY};
    }
  }

  /**
   * Test, wether it is active.
   * @param source the language to translate from
   * @param target the language to translate to
   */
  public canAutoTranslate(source: string, target: string): Observable<boolean> {
    return this.supportedLanguages().pipe(
        map((languages: Language[]) => {
          const s = AutoTranslateGoogleService.stripRegioncode(source);
          const t = AutoTranslateGoogleService.stripRegioncode(target);
          if (!s || languages.findIndex((lang) => lang.language === s) < 0) {
            return false;
          }
          return (t && languages.findIndex((lang) => lang.language === t) >= 0);
    }));
  }

  /**
   * The reason, why canAutoTranslate returns false.
   * @param source the language to translate from
   * @param target the language to translate to
   * @return reason or null, if API is enabled.
   */
  public disabledReason(source: string, target: string): Observable<AutoTranslateDisabledReason> {
    return this.supportedLanguages().pipe(
        map((languages: Language[]) => {
          if (languages.length === 0) {
            return this._permanentFailReason;
          }
          const s = AutoTranslateGoogleService.stripRegioncode(source);
          if (!s || languages.findIndex((lang) => lang.language === s) < 0) {
            return {reason: AutoTranslateDisabledReasonKey.SOURCE_LANG_NOT_SUPPORTED};
          }
          const t = AutoTranslateGoogleService.stripRegioncode(target);
          if (!t || languages.findIndex((lang) => lang.language === t) < 0) {
            return {reason: AutoTranslateDisabledReasonKey.TARGET_LANG_NOT_SUPPORTED};
          }
          return null;
        })
    );
  }

  /**
   * Return a list of language codes that can be used.
   * Returns codes as "language" and readable name.
   * @param target language for readable name. (default is en)
   */
  supportedLanguages(target?: string): Observable<Language[]> {
    if (!target) {
      target = 'en';
    } else {
      target = AutoTranslateGoogleService.stripRegioncode(target);
    }
    if (!this._subjects[target]) {
      if (this._apiKey) {
        this._permanentFailReason = {reason: AutoTranslateDisabledReasonKey.NO_PROVIDER};
      } else {
        this._permanentFailReason = {reason: AutoTranslateDisabledReasonKey.NO_KEY};
      }
      this._subjects[target] = new BehaviorSubject<Language[]>([]);
      if (this._apiKey) {
        const languagesRequestUrl = this._rootUrl + 'language/translate/v2/languages' + '?key=' + this._apiKey + '&target=' + target;
        this.httpClient.get<{data: LanguagesListResponse}>(languagesRequestUrl).pipe(
            catchError((error: Response) => {
            if (this.isInvalidApiKeyError(error)) {
              this._permanentFailReason = {reason: AutoTranslateDisabledReasonKey.INVALID_KEY};
            } else {
              this._permanentFailReason = {reason: AutoTranslateDisabledReasonKey.CONNECT_PROBLEM, details: JSON.stringify(error.body)};
            }
            return [];
           }),
            map((response) => {
          const result: LanguagesListResponse = response.data;
          return result.languages;
        })).subscribe((languages) => {
          this._subjects[target].next(languages);
        });
      }
    }
    return this._subjects[target];
  }

  private isInvalidApiKeyError(error: Response): boolean {
    if (!error) {
      return false;
    }
    if (error.status === 400) {
      const body = error.body;
      if (body) {
        return JSON.stringify(body).indexOf('API key not valid') >= 0;
      }
    }
    return false;
  }

  /**
   * Translate a message.
   * @param message the message to be translated
   * @param from source language code
   * @param to target language code
   * @return Observable with translated message or error
   */
  public translate(message: string, from: string, to: string): Observable<string> {
    if (!this._apiKey) {
      return observableThrowError('error, no api key');
    }
    from = AutoTranslateGoogleService.stripRegioncode(from);
    to = AutoTranslateGoogleService.stripRegioncode(to);
    const translateRequest: TranslateTextRequest = {
      q: [message],
      target: to,
      source: from,
      // format: TODO useful html or text
    };
    const realUrl = this._rootUrl + 'language/translate/v2' + '?key=' + this._apiKey;
    return this.httpClient.post<{data: TranslationsListResponse}>(realUrl, translateRequest).pipe(map((response) => {
      const result: TranslationsListResponse = response.data;
      return result.translations[0].translatedText;
    }));
  }

  /**
   * Translate an array of messages at once.
   * @param messages the messages to be translated
   * @param from source language code
   * @param to target language code
   * @return Observable with translated messages or error
   */
  public translateMultipleStrings(messages: string[], from: string, to: string): Observable<string[]> {
    if (!this._apiKey) {
      return observableThrowError('error, no api key');
    }
    if (messages.length === 0) {
      return of([]);
    }
    from = AutoTranslateGoogleService.stripRegioncode(from);
    to = AutoTranslateGoogleService.stripRegioncode(to);
    const allRequests: Observable<string[]>[] = this.splitMessagesToGoogleLimit(messages).map((partialMessages: string[]) => {
      return this.limitedTranslateMultipleStrings(partialMessages, from, to);
    });
    return forkJoin(allRequests).pipe(map((allTranslations: string[][]) => {
      let all = [];
      for (let i = 0; i < allTranslations.length; i++) {
        all = all.concat(allTranslations[i]);
      }
      return all;
    }));
  }

  /**
   * Return translation request, but messages must be limited to google limits.
   * Not more that 128 single messages.
   * @param messages messages
   * @param from from
   * @param to to
   * @return the translated strings
   */
  private limitedTranslateMultipleStrings(messages: string[], from: string, to: string): Observable<string[]> {
    if (!this._apiKey) {
      return observableThrowError('error, no api key');
    }
    from = AutoTranslateGoogleService.stripRegioncode(from);
    to = AutoTranslateGoogleService.stripRegioncode(to);
    const translateRequest: TranslateTextRequest = {
      q: messages,
      target: to,
      source: from,
      // format: TODO useful html or text
    };
    const realUrl = this._rootUrl + 'language/translate/v2' + '?key=' + this._apiKey;
    return this.httpClient.post<{data: TranslationsListResponse}>(realUrl, translateRequest).pipe(map((response) => {
      const result: TranslationsListResponse = response.data;
      return result.translations.map((translation: TranslationsResource) => {
        // just for tests, provoke errors and warnings, if explicitly wanted
        if (this.failByDesign) {
          if (translation.translatedText.indexOf('{') >= 0) {
            return 'oopsi';
          }
          if (translation.translatedText.indexOf('<') >= 0) {
            return 'oopsala';
          }
        }
        return translation.translatedText;
      });
    }));
  }

  /**
   * Splits one array of messages to n arrays, where each has at least 128 (const MAX_ENTRIES) entries.
   * @param messages messages
   * @return splitted array
   */
  private splitMessagesToGoogleLimit(messages: string[]): string[][] {
    if (messages.length <= MAX_SEGMENTS) {
      return [messages];
    }
    const result = [];
    let currentPackage = [];
    let packageSize = 0;
    for (let i = 0; i < messages.length; i++) {
      currentPackage.push(messages[i]);
      packageSize++;
      if (packageSize >= MAX_SEGMENTS) {
        result.push(currentPackage);
        currentPackage = [];
        packageSize = 0;
      }
    }
    if (currentPackage.length > 0) {
      result.push(currentPackage);
    }
    return result;
  }


}
