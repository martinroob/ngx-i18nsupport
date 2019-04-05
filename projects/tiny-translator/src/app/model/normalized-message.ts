import {INormalizedMessage, IICUMessage, IICUMessageTranslation} from '@ngx-i18nsupport/ngx-i18nsupport-lib';
import {ValidationErrors} from '@angular/forms';
import {isNullOrUndefined} from '../common/util';
import {AutoTranslateServiceAPI} from './auto-translate-service-api';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
/**
 * Created by martin on 19.05.2017.
 * Wrapper around INormalizedMessage for GUI usage.
 * Holds the normalized form and the original.
 */
export class NormalizedMessage {

  /**
   * Original source as string.
   */
  private _original: string;

  /**
   * normalized message.
   * null if original is unparsable.
   */
  private _normalizedMessage: INormalizedMessage;

  /**
   * Parse error if message was unparsable.
   */
  private _parseError: string;

  /**
   * Errors and warnings, lazy evaluated.
   */
  private _errors: ValidationErrors;
  private _errorsInitialized = false;
  private _warnings: ValidationErrors;
  private _warningsInitialized = false;

  private _sourceMessage: INormalizedMessage;

  /**
   * Create normalized message
   * @param original the original string.
   * @param normalizedMessage parsed version or null, if parsing error.
   * @param parseError parsing error or (normally) null, if no error.
   */
  constructor(original: string, normalizedMessage: INormalizedMessage, parseError: string, sourceMessage: INormalizedMessage) {
    this._original = original;
    this._normalizedMessage = normalizedMessage;
    this._parseError = parseError;
    this._sourceMessage = sourceMessage;
    this._errorsInitialized = false;
    this._warningsInitialized = false;
  }

  /**
   * Return a copy of the message.
   */
  public copy(): NormalizedMessage {
    return new NormalizedMessage(this._original, this._normalizedMessage, this._parseError, this._sourceMessage);
  }

  public dislayText(normalize: boolean): string {
    if (normalize) {
      if (this._normalizedMessage) {
        if (this.isICUMessage()) {
          return this._normalizedMessage.asDisplayString() + ' ' + this._normalizedMessage.getICUMessage().asNativeString();
        } else {
          return this._normalizedMessage.asDisplayString();
        }
      } else {
        return this._parseError;
      }
    } else {
      return this._original;
    }
  }

  /**
   * Test, wether it is an ICU message.
   */
  isICUMessage(): boolean {
    return this._normalizedMessage && !isNullOrUndefined(this._normalizedMessage.getICUMessage());
  }

  getICUMessage(): IICUMessage {
    return this._normalizedMessage ? this._normalizedMessage.getICUMessage() : null;
  }

  public translate(newValue: string, normalize: boolean): NormalizedMessage {
    let newOriginal: string;
    let newMessage: INormalizedMessage;
    let parseError: string;
    if (normalize) {
      try {
        newMessage = this._sourceMessage.translate(newValue);
        newOriginal = newMessage.asNativeString();
        parseError = null;
      } catch (error) {
        parseError = error.message;
        newMessage = null;
        newOriginal = null;
      }
    } else {
      newOriginal = newValue;
      try {
        newMessage = this._sourceMessage.translateNativeString(newValue);
        parseError = null;
      } catch (error) {
        parseError = error.message;
      }
    }
    return new NormalizedMessage(newOriginal, newMessage, parseError, this._sourceMessage);
  }

  /**
   * Auto translate this normalized message via Google Translate.
   * @param autoTranslateService autoTranslateService
   * @param sourceLanguage Language of source
   * @param targetLanguage Language of target
   * @return new translated message (as Observable, it is an async call)
   */
  public autoTranslateUsingService(autoTranslateService: AutoTranslateServiceAPI,
                                   sourceLanguage: string,
                                   targetLanguage: string): Observable<NormalizedMessage> {
    // TODO corner cases to be researched like special tags, ...
    if (this.getICUMessage()) {
      return this.autoTranslateICUMessageUsingService(autoTranslateService, sourceLanguage, targetLanguage);
    } else {
      return autoTranslateService.translate(this.dislayText(true), sourceLanguage, targetLanguage).pipe(
          map((translation: string) => {
            if (!isNullOrUndefined(translation)) {
              return this.translate(translation, true);
            } else {
              return null;
            }
          }
      ));
    }
  }

  private autoTranslateICUMessageUsingService(autoTranslateService: AutoTranslateServiceAPI,
                                              sourceLanguage: string,
                                              targetLanguage: string): Observable<NormalizedMessage> {
    const icuMessage: IICUMessage = this.getICUMessage();
    const categories = icuMessage.getCategories();
    // check for nested ICUs, we do not support that
    if (categories.find((category) => !isNullOrUndefined(category.getMessageNormalized().getICUMessage()))) {
      throw new Error('nested ICU message not supported');
    }
    const allMessages: string[] = categories.map((category) => category.getMessageNormalized().asDisplayString());
    return autoTranslateService.translateMultipleStrings(allMessages, sourceLanguage, targetLanguage)
      .pipe(map((translations: string[]) => {
        const icuTranslation: IICUMessageTranslation = {};
        for (let i = 0; i < translations.length; i++) {
          const translationText = translations[i];
          icuTranslation[categories[i].getCategory()] = translationText;
        }
        const result = this.translateICUMessage(icuTranslation);
        return result;
      }));
  }

  public translateICUMessage(newValue: IICUMessageTranslation): NormalizedMessage {
    let newOriginal: string;
    let newMessage: INormalizedMessage;
    let parseError: string;
      try {
        if (this._normalizedMessage) {
          newMessage = this._normalizedMessage.translateICUMessage(newValue);
        } else {
          newMessage = this._sourceMessage.translateICUMessage(newValue);
        }
        newOriginal = newMessage.asNativeString();
        parseError = null;
      } catch (error) {
        parseError = error.message;
        newMessage = null;
        newOriginal = null;
      }
    return new NormalizedMessage(newOriginal, newMessage, parseError, this._sourceMessage);
  }

  public nativeString(): string {
    if (this._normalizedMessage) {
      return this._normalizedMessage.asNativeString();
    } else {
      return this._original;
    }
  }

  public validate(normalize: boolean): ValidationErrors | null {
    if (!this._errorsInitialized) {
      if (normalize) {
        if (this._normalizedMessage) {
          this._errors = this._normalizedMessage.validate();
        } else {
          this._errors = {'parseError': this._parseError};
        }
      } else {
        this._errors = null;
      }
      this._errorsInitialized = true;
    }
    return this._errors;
  }

  public validateWarnings(normalize: boolean): ValidationErrors | null {
    if (!this._warningsInitialized) {
      if (normalize) {
        if (this._normalizedMessage) {
          this._warnings = this._normalizedMessage.validateWarnings();
        } else {
          this._warnings = null;
        }
      } else {
        this._warnings = null;
      }
      this._warningsInitialized = true;
    }
    return this._warnings;
  }
}
