import {ITranslationMessagesFile, ITransUnit, STATE_NEW, STATE_TRANSLATED} from '../api';
import {isNullOrUndefined} from 'util';
import {DOMParser} from 'xmldom';
import {XmlSerializer, XmlSerializerOptions} from './xml-serializer';
/**
 * Created by roobm on 09.05.2017.
 * Abstract superclass for all implementations of ITranslationMessagesFile.
 */

export abstract class AbstractTranslationMessagesFile implements ITranslationMessagesFile {

    protected _filename: string;

    protected _encoding: string;

    protected _parsedDocument: Document;

    protected _fileEndsWithEOL: boolean;

    // trans-unit elements and their id from the file
    protected transUnits: ITransUnit[];

    protected _warnings: string[];

    protected _numberOfTransUnitsWithMissingId: number;

    protected _numberOfUntranslatedTransUnits: number;

    protected _numberOfReviewedTransUnits: number;

    protected targetPraefix: string;

    protected targetSuffix: string;

    constructor() {
        this.transUnits = null;
        this._warnings = [];
    }

    /**
     * Parse file content.
     * Sets _parsedDocument, line ending, encoding, etc.
     * @param {string} xmlString
     * @param {string} path
     * @param {string} encoding
     * @param {{xmlContent: string; path: string; encoding: string}} optionalMaster
     */
    protected parseContent(xmlString: string, path: string, encoding: string, optionalMaster?: { xmlContent: string, path: string, encoding: string }): void {
        this._filename = path;
        this._encoding = encoding;
        this._parsedDocument = new DOMParser().parseFromString(xmlString, 'text/xml');
        this._fileEndsWithEOL = xmlString.endsWith('\n');
    }

    abstract i18nFormat(): string;

    abstract fileType(): string;

    /**
     * return tag names of all elements that have mixed content.
     * These elements will not be beautified.
     * Typical candidates are source and target.
     */
    protected abstract elementsWithMixedContent(): string[];

    /**
     * Read all trans units from xml content.
     * Puts the found units into transUnits.
     * Puts warnings for missing ids.
     */
    protected abstract initializeTransUnits();

    protected lazyInitializeTransUnits() {
        if (isNullOrUndefined(this.transUnits)) {
            this.initializeTransUnits();
            this.countNumbers();
        }
    }

    /**
     * count units after changes of trans units
     */
    public countNumbers() {
        this._numberOfTransUnitsWithMissingId = 0;
        this._numberOfUntranslatedTransUnits = 0;
        this._numberOfReviewedTransUnits = 0;
        this.forEachTransUnit((tu: ITransUnit) => {
            if (isNullOrUndefined(tu.id) || tu.id === '') {
                this._numberOfTransUnitsWithMissingId++;
            }
            const state = tu.targetState();
            if (isNullOrUndefined(state) || state === STATE_NEW) {
                this._numberOfUntranslatedTransUnits++;
            }
            if (state === STATE_TRANSLATED) {
                this._numberOfReviewedTransUnits++;
            }
        });
    }

    public warnings(): string[] {
        this.lazyInitializeTransUnits();
        return this._warnings;
    }

    /**
     * Total number of translation units found in the file.
     */
    public numberOfTransUnits(): number {
        this.lazyInitializeTransUnits();
        return this.transUnits.length;
    }

    /**
     * Number of translation units without translation found in the file.
     * These units have state 'translated'.
     */
    numberOfUntranslatedTransUnits(): number {
        this.lazyInitializeTransUnits();
        return this._numberOfUntranslatedTransUnits;
    }

    /**
     * Number of translation units with state 'final'.
     */
    numberOfReviewedTransUnits(): number {
        this.lazyInitializeTransUnits();
        return this._numberOfReviewedTransUnits;
    }

    /**
     * Number of translation units without translation found in the file.
     * These units have state 'translated'.
     */
    public numberOfTransUnitsWithMissingId(): number {
        this.lazyInitializeTransUnits();
        return this._numberOfTransUnitsWithMissingId;
    }

    /**
     * Get source language.
     * @return {string}
     */
    abstract sourceLanguage(): string;

    /**
     * Get target language.
     * @return {string}
     */
    abstract targetLanguage(): string;

    /**
     * Loop over all Translation Units.
     * @param callback
     */
    public forEachTransUnit(callback: ((transunit: ITransUnit) => void)) {
        this.lazyInitializeTransUnits();
        this.transUnits.forEach((tu) => callback(tu));
    }

    /**
     * Get trans-unit with given id.
     * @param id
     * @return {ITransUnit}
     */
    public transUnitWithId(id: string): ITransUnit {
        this.lazyInitializeTransUnits();
        return this.transUnits.find((tu) => tu.id === id);
    }

    /**
     * Edit functions following her
     */

    /**
     * Edit the source language.
     * @param language
     */
    abstract setSourceLanguage(language: string);

    /**
     * Edit the target language.
     * @param language
     */
    abstract setTargetLanguage(language: string);

    /**
     * Set the praefix used when copying source to target.
     * This is used by importNewTransUnit and createTranslationFileForLang methods.
     * (since 1.8.0)
     * @param {string} targetPraefix
     */
    public setNewTransUnitTargetPraefix(targetPraefix: string) {
        this.targetPraefix = targetPraefix;
    }

    /**
     * Get the praefix used when copying source to target.
     * (since 1.8.0)
     * @return {string}
     */
    getNewTransUnitTargetPraefix(): string {
        return isNullOrUndefined(this.targetPraefix) ? '' : this.targetPraefix;
    }

    /**
     * Set the suffix used when copying source to target.
     * This is used by importNewTransUnit and createTranslationFileForLang methods.
     * (since 1.8.0)
     * @param {string} targetSuffix
     */
    public setNewTransUnitTargetSuffix(targetSuffix: string) {
        this.targetSuffix = targetSuffix;
    }

    /**
     * Get the suffix used when copying source to target.
     * (since 1.8.0)
     * @return {string}
     */
    getNewTransUnitTargetSuffix(): string {
        return isNullOrUndefined(this.targetSuffix) ? '' : this.targetSuffix;
    }

    /**
     * Add a new trans-unit to this file.
     * The trans unit stems from another file.
     * It copies the source content of the tu to the target content too,
     * depending on the values of isDefaultLang and copyContent.
     * So the source can be used as a dummy translation.
     * (used by xliffmerge)
     * @param foreignTransUnit the trans unit to be imported.
     * @param isDefaultLang Flag, wether file contains the default language.
     * Then source and target are just equal.
     * The content will be copied.
     * State will be final.
     * @param copyContent Flag, wether to copy content or leave it empty.
     * Wben true, content will be copied from source.
     * When false, content will be left empty (if it is not the default language).
     * @param importAfterElement optional (since 1.10) other transunit (part of this file), that should be used as ancestor.
     * Newly imported trans unit is then inserted directly after this element.
     * If not set or not part of this file, new unit will be imported at the end.
     * If explicity set to null, new unit will be imported at the start.
     * @return the newly imported trans unit (since version 1.7.0)
     * @throws an error if trans-unit with same id already is in the file.
     */
    abstract importNewTransUnit(foreignTransUnit: ITransUnit, isDefaultLang: boolean, copyContent: boolean, importAfterElement?: ITransUnit): ITransUnit;

    /**
     * Remove the trans-unit with the given id.
     * @param id
     */
    public removeTransUnitWithId(id: string) {
        let tuNode: Node = this._parsedDocument.getElementById(id);
        if (tuNode) {
            tuNode.parentNode.removeChild(tuNode);
            this.lazyInitializeTransUnits();
            this.transUnits = this.transUnits.filter((tu) => tu.id !== id);
            this.countNumbers();
        }
    }

    /**
     * The filename where the data is read from.
     */
    public filename(): string {
        return this._filename;
    }

    /**
     * The encoding if the xml content (UTF-8, ISO-8859-1, ...)
     */
    public encoding(): string {
        return this._encoding;
    }

    /**
     * The xml content to be saved after changes are made.
     * @param beautifyOutput Flag whether to use pretty-data to format the output.
     * XMLSerializer produces some correct but strangely formatted output, which pretty-data can correct.
     * See issue #64 for details.
     * Default is false.
     */
    public editedContent(beautifyOutput?: boolean): string {
        let options: XmlSerializerOptions = {};
        if (beautifyOutput === true) {
           options.beautify = true;
           options.indentString = '  ';
           options.mixedContentElements = this.elementsWithMixedContent();
        }
        let result = new XmlSerializer().serializeToString(this._parsedDocument, options);
        if (this._fileEndsWithEOL) {
            // add eol if there was eol in original source
            return result + '\n';
        } else {
            return result;
        }
    }

    /**
     * Create a new translation file for this file for a given language.
     * Normally, this is just a copy of the original one.
     * But for XMB the translation file has format 'XTB'.
     * @param lang Language code
     * @param filename expected filename to store file
     * @param isDefaultLang Flag, wether file contains the default language.
     * Then source and target are just equal.
     * The content will be copied.
     * State will be final.
     * @param copyContent Flag, wether to copy content or leave it empty.
     * Wben true, content will be copied from source.
     * When false, content will be left empty (if it is not the default language).
     */
    abstract createTranslationFileForLang(lang: string, filename: string, isDefaultLang: boolean, copyContent: boolean): ITranslationMessagesFile;
}
