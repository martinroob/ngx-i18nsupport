import {forkJoin, Observable, of} from 'rxjs';
import {isNullOrUndefined} from '../common/util';
import {catchError, map} from 'rxjs/operators';
import {
  FILETYPE_XTB,
  FORMAT_XMB,
  IICUMessage,
  IICUMessageTranslation,
  ITranslationMessagesFile,
  ITransUnit,
  TranslationMessagesFileFactory
} from '@ngx-i18nsupport/ngx-i18nsupport-lib';
import {TranslationUnit} from './translation-unit';
import {AutoTranslateServiceAPI} from './auto-translate-service-api';
import {AutoTranslateSummaryReport} from './auto-translate-summary-report';
import {AutoTranslateResult} from './auto-translate-result';
import {IFileDescription} from '../file-accessors/common/i-file-description';
import {DownloadUploadFileDescription} from '../file-accessors/download-upload/download-upload-file-description';
import {IFile} from '../file-accessors/common/i-file';
import {SerializationService} from './serialization.service';
import {GenericFile} from '../file-accessors/common/generic-file';

/**
 * A single xlf or xmb file ready for work.
 * This is a wrapper around ITranslationMessagesFile.
 * It can read from uploaded files and adds errorhandling.
 * Created by roobm on 22.03.2017.
 */

// internal representation of serialized form.
// format used since v0.15
interface ISerializedTranslationFileV2 {
  version: string;
  file: string; // serialized
  editedContent: string;
  master?: string; // serialized
  explicitSourceLanguage: string;
}

// elder internal representation of serialized form.
// old format, used until v0.14
interface ISerializedTranslationFile {
  name: string;
  size: number;
  fileContent: string;
  editedContent: string;
  masterContent: string;
  masterName: string;
  explicitSourceLanguage: string;
}

export class TranslationFile {

  private _file: IFile;

  private _error: string = null;

  private _master?: IFile;

  private _translationFile: ITranslationMessagesFile;

  private _explicitSourceLanguage: string;

  /**
   * all TransUnits read from file.
   */
  private _allTransUnits: TranslationUnit[];

  /**
   * Create a TranslationFile from the read file.
   * @param loadedFile read in translation file (xliff, xmb)
   * @param loadedMasterXmbFile optional master for xmb file
   */
  static fromFile(loadedFile: IFile, loadedMasterXmbFile?: IFile): TranslationFile {
    const newInstance = new TranslationFile();
    newInstance._file = loadedFile;
    if (loadedFile.content) {
      try {
        let optionalMaster: any = null;
        if (loadedMasterXmbFile && loadedMasterXmbFile.content) {
          optionalMaster = {
            path: loadedMasterXmbFile.description.name,
            xmlContent: loadedMasterXmbFile.content,
            encoding: null
          };
          newInstance._master = loadedMasterXmbFile;
        }
        newInstance._translationFile =
            TranslationMessagesFileFactory.fromUnknownFormatFileContent(
                loadedFile.content, loadedFile.description.name, 'utf-8', optionalMaster);
        if (newInstance._translationFile.i18nFormat() === FORMAT_XMB) {
          newInstance._error = 'xmb files cannot be translated, use xtb instead'; // TODO i18n
        }
        newInstance.readTransUnits();
      } catch (err) {
        newInstance._error = err.toString();
      }
    }
    return newInstance;
  }

  /**
   * Create a translation file from the serialization.
   * @param serializationService serializationService
   * @param serializationString serializationString
   * @return TranslationFile
   */
  static deserialize(serializationService: SerializationService, serializationString: string): TranslationFile {
    const deserializedObject = <ISerializedTranslationFile> JSON.parse(serializationString);
    return TranslationFile.fromDeserializedObject(serializationService, deserializedObject);
  }

  static fromDeserializedObject(
      serializationService: SerializationService,
      deserializedJsonObject: ISerializedTranslationFile|ISerializedTranslationFileV2|any): TranslationFile {
    let deserializedObject: ISerializedTranslationFileV2;
    if (deserializedJsonObject.version) {
      deserializedObject = deserializedJsonObject as ISerializedTranslationFileV2;
    } else {
      // migration from old format
      const v1Object = deserializedJsonObject as ISerializedTranslationFile;
      deserializedObject = {
        version: '1',
        file: new GenericFile(DownloadUploadFileDescription.deserialize(serializationService, null),
          v1Object.name, v1Object.size, v1Object.fileContent)
            .serialize(serializationService),
        editedContent: v1Object.editedContent,
        explicitSourceLanguage: v1Object.explicitSourceLanguage
      };
      if (v1Object.masterContent) {
        deserializedObject.master =
            new GenericFile(DownloadUploadFileDescription.deserialize(serializationService, null),
              v1Object.masterName, 0, v1Object.masterContent)
            .serialize(serializationService);
      }
    }
    const newInstance = new TranslationFile();
    newInstance._file = serializationService.deserializeIFile(deserializedObject.file);
    newInstance._explicitSourceLanguage = deserializedObject.explicitSourceLanguage;
    try {
      const encoding = null; // unknown, lib can find it
      let optionalMaster: {xmlContent: string, path: string, encoding: string} = null;
      if (deserializedObject.master) {
        newInstance._master = serializationService.deserializeIFile(deserializedObject.master);
        optionalMaster = {
          xmlContent: newInstance._master.content,
          path: newInstance._master.description.name,
          encoding: encoding
        };
      }
      newInstance._translationFile = TranslationMessagesFileFactory.fromUnknownFormatFileContent(
          deserializedObject.editedContent,
          newInstance._file.description.name,
          encoding,
          optionalMaster);
      newInstance.readTransUnits();
    } catch (err) {
      newInstance._error = err.toString();
    }
    return newInstance;
  }

  constructor() {
    this._allTransUnits = [];
  }

  private readTransUnits() {
    this._allTransUnits = [];
    if (this._translationFile) {
      this._translationFile.forEachTransUnit((tu: ITransUnit) => {
        this._allTransUnits.push(new TranslationUnit(this, tu));
      });
    }
  }

  get name(): string {
    return (this._file && this._file.description) ? this._file.description.name : '';
  }

  /**
   * In case of xmb/xtb the name of the master xmb file.
   * @return name of master file or null
   */
  get masterName(): string|null {
    return (this._master) ? this._master.description.name : null;
  }

  get size(): number {
    return this._file.size;
  }

  get numberOfTransUnits(): number {
    return this._allTransUnits.length;
  }

  get numberOfUntranslatedTransUnits(): number {
    return (this._translationFile) ? this._translationFile.numberOfUntranslatedTransUnits() : 0;
  }

  public fileDescription(): IFileDescription {
    return this._file.description;
  }

  public editedFile(): IFile {
    const content = this.editedContent();
    return this._file.copyWithNewContent(content);
  }

  /**
   * Type of file.
   * Currently 'xlf', 'xlf2', 'xmb' or or 'xtb'
   * @return type of file
   */
  public fileType(): string {
    if (this._translationFile) {
      return this._translationFile.fileType();
    } else {
      // try to get it by name
      if (this.name && this.name.endsWith('xtb')) {
        return FILETYPE_XTB;
      } else {
        return null;
      }
    }
  }

  /**
   * Source language as stored in translation file.
   * @return source language
   */
  public sourceLanguageFromFile(): string {
    return this._translationFile ? this._translationFile.sourceLanguage() : 'unknown';
  }

  /**
   * Source language from file or explicitly set.
   * @return source language
   */
  public sourceLanguage(): string {
    if (this._translationFile) {
      const srcLang = this._translationFile.sourceLanguage();
      if (isNullOrUndefined(srcLang)) {
        return this._explicitSourceLanguage ? this._explicitSourceLanguage : '';
      } else {
        return srcLang;
      }
    } else {
      return '';
    }
  }

  /**
   * Explicitly set source language.
   * Only used, when file format does not store this (xmb case).
   * @param srcLang source language
   */
  public setSourceLanguage(srcLang: string) {
    this._explicitSourceLanguage = srcLang;
  }

  public targetLanguage(): string {
    return this._translationFile ? this._translationFile.targetLanguage() : '';
  }

  public percentageUntranslated(): number {
    if (this.numberOfTransUnits === 0) {
      return 100;
    }
    return 100 * this.numberOfUntranslatedTransUnits / this.numberOfTransUnits;
  }

  public percentageTranslated(): number {
    return 100 - this.percentageUntranslated();
  }

  public hasErrors(): boolean {
    return !isNullOrUndefined(this._error);
  }

  public canTranslate(): boolean {
    return !this.hasErrors() && this.numberOfTransUnits > 0;
  }

  get error(): string {
    return this._error;
  }

  /**
   * Show warnings detected in file.
   * @return array of warnings
   */
  public warnings(): string[] {
    return this._translationFile ? this._translationFile.warnings() : [];
  }

  /**
   * Check, wether file is changed.
   * @return wether file is changed.
   */
  public isDirty(): boolean {
    return this._translationFile && this._file.content !== this.editedContent();
  }

  /**
   * return content with all changes.
   */
  public editedContent(): string {
    if (this._translationFile) {
      return this._translationFile.editedContent();
    } else {
      this._error = 'cannot save, no valid file';
    }
  }

  /**
   * Mark file as "exported".
   * This means, that the file was downloaded.
   * So the new file content is the edited one.
   */
  public markExported() {
    this._file.content = this.editedContent();
  }

  /**
   * Return all trans units found in file.
   * @return all trans units found in file
   */
  public allTransUnits(): TranslationUnit[] {
    return this._allTransUnits;
  }

  /**
   * Return a string representation of translation file content.
   * This will be stored in BackendService.
   */
  public serialize(serializationService: SerializationService): string {
    const serializedObject: ISerializedTranslationFileV2 = {
      version: '2',
      file: this._file.serialize(serializationService),
      editedContent: this.editedContent(),
      master: (this._master) ? this._master.serialize(serializationService) : null,
      explicitSourceLanguage: this._explicitSourceLanguage
    };
    return JSON.stringify(serializedObject);
  }

  /**
   * Auto translate this file via Google Translate.
   * Translates all untranslated units.
   * @param autoTranslateService the service for the raw text translation via Google Translate
   * @return a summary of the run (how many units are handled, how many sucessful, errors, ..)
   */
  public autoTranslateUsingService(autoTranslateService: AutoTranslateServiceAPI): Observable<AutoTranslateSummaryReport> {
    return forkJoin([
      this.doAutoTranslateNonICUMessages(autoTranslateService),
      ...this.doAutoTranslateICUMessages(autoTranslateService)])
      .pipe(
          map((summaries: AutoTranslateSummaryReport[]) => {
            const summary = summaries[0];
            for (let i = 1; i < summaries.length; i++) {
              summary.merge(summaries[i]);
            }
            return summary;
          }
      ));
  }

  /**
   * Auto translate this file via Google Translate.
   * Translates all untranslated units.
   * @param autoTranslateService the service for the raw text translation via Google Translate
   * @return a summary of the run (how many units are handled, how many sucessful, errors, ..)
   */
  private doAutoTranslateNonICUMessages(autoTranslateService: AutoTranslateServiceAPI): Observable<AutoTranslateSummaryReport> {
    // collect all units, that should be auto translated
    const allUntranslated: TranslationUnit[] = this.allTransUnits().filter((tu) => !tu.isTranslated());
    const allTranslatable = allUntranslated.filter((tu) => !tu.sourceContentNormalized().isICUMessage());
    const allMessages: string[] = allTranslatable.map((tu) => {
      return tu.sourceContentNormalized().dislayText(true);
    });
    return autoTranslateService.translateMultipleStrings(allMessages, this.sourceLanguage(), this.targetLanguage())
      .pipe(
          map((translations: string[]) => {
            const summary = new AutoTranslateSummaryReport();
            for (let i = 0; i < translations.length; i++) {
              const tu = allTranslatable[i];
              const translationText = translations[i];
              const result = tu.autoTranslateNonICUUnit(translationText);
              summary.addSingleResult(result);
            }
            return summary;
          }
      ));
  }

  private doAutoTranslateICUMessages(autoTranslateService: AutoTranslateServiceAPI): Observable<AutoTranslateSummaryReport>[] {
    // collect all units, that should be auto translated
    const allUntranslated: TranslationUnit[] = this.allTransUnits().filter((tu) => !tu.isTranslated());
    const allTranslatableICU = allUntranslated.filter((tu) => !isNullOrUndefined(tu.sourceContentNormalized().getICUMessage()));
    return allTranslatableICU.map((tu) => {
      return this.doAutoTranslateICUMessage(autoTranslateService, tu);
    });
  }

  /**
   * Translate single ICU Messages.
   * @param autoTranslateService autoTranslateService
   * @param tu transunit to translate (must contain ICU Message)
   * @return summaryReport
   */
  private doAutoTranslateICUMessage(
      autoTranslateService: AutoTranslateServiceAPI,
      tu: TranslationUnit): Observable<AutoTranslateSummaryReport> {
    const icuMessage: IICUMessage = tu.sourceContentNormalized().getICUMessage();
    const categories = icuMessage.getCategories();
    // check for nested ICUs, we do not support that
    if (categories.find((category) => !isNullOrUndefined(category.getMessageNormalized().getICUMessage()))) {
      const summary = new AutoTranslateSummaryReport();
      summary.addSingleResult(AutoTranslateResult.Ignored(tu, 'nested icu message'));
      return of(summary);
    }
    const allMessages: string[] = categories.map((category) => category.getMessageNormalized().asDisplayString());
    return autoTranslateService.translateMultipleStrings(allMessages, this.sourceLanguage(), this.targetLanguage())
      .pipe(
          map((translations: string[]) => {
            const summary = new AutoTranslateSummaryReport();
            const icuTranslation: IICUMessageTranslation = {};
            for (let i = 0; i < translations.length; i++) {
              icuTranslation[categories[i].getCategory()] = translations[i];
            }
            const result = tu.autoTranslateICUUnit(icuTranslation);
            summary.addSingleResult(result);
            return summary;
          }
        ), catchError((err) => {
            const failSummary = new AutoTranslateSummaryReport();
            failSummary.addSingleResult(AutoTranslateResult.Failed(tu, err.message));
            return of(failSummary);
          }
      ));
  }

}
