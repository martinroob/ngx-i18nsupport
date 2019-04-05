import {ITransUnit, INormalizedMessage, STATE_NEW, IICUMessageTranslation} from '@ngx-i18nsupport/ngx-i18nsupport-lib';
import {TranslationFile} from './translation-file';
import {NormalizedMessage} from './normalized-message';
import {format} from 'util';
import {isNullOrUndefined} from '../common/util';
import {AutoTranslateResult} from './auto-translate-result';

/**
 * A wrapper around ITransUnit.
 * Adds some support for easier GUI handling.
 * Created by martin on 24.03.2017.
 */

export class TranslationUnit {

  private _isDirty: boolean;
  private _normalizedSourceContent: NormalizedMessage;
  private _normalizedTargetContent: NormalizedMessage;

  constructor(private _translationFile: TranslationFile, private _transUnit: ITransUnit) {
    this._isDirty = false;
  }

  public translationFile(): TranslationFile {
    return this._translationFile;
  }

  public id(): string {
    if (this._transUnit) {
      return this._transUnit.id;
    } else {
      return null;
    }
  }

  public sourceContent(): string {
    if (this._transUnit) {
      return this._transUnit.sourceContent();
    } else {
      return null;
    }
  }

  public sourceContentNormalized(): NormalizedMessage {
    if (this._transUnit) {
      if (!this._normalizedSourceContent) {
        const original = this._transUnit.sourceContent();
        let normalizedMessage: INormalizedMessage = null;
        let parseError: string = null;
        try {
          normalizedMessage = this._transUnit.sourceContentNormalized();
        } catch (error) {
          parseError = error.message;
        }
        this._normalizedSourceContent = new NormalizedMessage(original, normalizedMessage, parseError, normalizedMessage);
      }
      return this._normalizedSourceContent;
    } else {
      return null;
    }
  }

  public targetContent(): string {
    if (this._transUnit) {
      return this._transUnit.targetContent();
    } else {
      return null;
    }
  }

  public targetContentNormalized(): NormalizedMessage {
    if (this._transUnit) {
      if (!this._normalizedTargetContent) {
        const original = this._transUnit.targetContent();
        let normalizedMessage: INormalizedMessage = null;
        let parseError: string = null;
        try {
          normalizedMessage = this._transUnit.targetContentNormalized();
        } catch (error) {
          parseError = error.message;
        }
        this._normalizedTargetContent = new NormalizedMessage(
            original, normalizedMessage, parseError, this._transUnit.sourceContentNormalized());
      }
      return this._normalizedTargetContent;
    } else {
      return null;
    }
  }

  public description(): string {
    if (this._transUnit) {
      return this._transUnit.description();
    } else {
      return null;
    }
  }

  public meaning(): string {
    if (this._transUnit) {
      return this._transUnit.meaning();
    } else {
      return null;
    }
  }

  public sourceReferences(): {sourcefile: string, linenumber: number}[] {
    if (this._transUnit) {
      return this._transUnit.sourceReferences();
    } else {
      return null;
    }
  }

  public targetState(): string {
    if (this._transUnit) {
      return this._transUnit.targetState();
    } else {
      return null;
    }
  }

  public setTargetState(newState: string) {
    if (this._transUnit) {
      this._transUnit.setTargetState(newState);
    }
  }

  public isDirty(): boolean {
    return this._isDirty;
  }

  public isTranslated(): boolean {
    return this.targetState() && this.targetState() !== STATE_NEW;
  }

  public translate(newTranslation: NormalizedMessage) {
    if (this._transUnit) {
      this._transUnit.translate(newTranslation.nativeString());
      this._isDirty = true;
      this._normalizedSourceContent = null;
      this._normalizedTargetContent = null;
    }
  }

  public autoTranslateNonICUUnit(translatedMessage: string): AutoTranslateResult {
    return this.autoTranslate(this.sourceContentNormalized().translate(translatedMessage, true));
  }

  public autoTranslateICUUnit(translation: IICUMessageTranslation): AutoTranslateResult {
    return this.autoTranslate(this.sourceContentNormalized().translateICUMessage(translation));
  }

  /**
   * Try to use the given generated message as a translation.
   * If there are any errors or warnings, translation will not take place.
   * @param translatedMessage translatedMessage
   * @return wether it was successful or not.
   */
  public autoTranslate(translatedMessage: NormalizedMessage): AutoTranslateResult {
    const errors = translatedMessage.validate(true);
    const warnings = translatedMessage.validateWarnings(true);
    if (!isNullOrUndefined(errors)) {
      return AutoTranslateResult.Failed(this, format('errors detected, not translated: %s', JSON.stringify(errors)));
    } else if (!isNullOrUndefined(warnings)) {
      return AutoTranslateResult.Failed(this, format('warnings detected, not translated: %s', JSON.stringify(warnings)));
    } else {
      this.translate(translatedMessage);
      return AutoTranslateResult.Success(this);
    }
  }
}
