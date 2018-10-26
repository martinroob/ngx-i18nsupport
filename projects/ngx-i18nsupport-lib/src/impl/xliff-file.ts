import {format} from 'util';
import {ITranslationMessagesFile, ITransUnit, FORMAT_XLIFF12, FILETYPE_XLIFF12} from '../api';
import {DOMUtilities} from './dom-utilities';
import {XliffTransUnit} from './xliff-trans-unit';
import {AbstractTranslationMessagesFile} from './abstract-translation-messages-file';
import {AbstractTransUnit} from './abstract-trans-unit';
/**
 * Created by martin on 23.02.2017.
 * Ab xliff file read from a source file.
 * Defines some relevant get and set method for reading and modifying such a file.
 */

export class XliffFile extends AbstractTranslationMessagesFile implements ITranslationMessagesFile {

    /**
     * Create an xlf-File from source.
     * @param xmlString source read from file.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XliffFile}
     */
    constructor(xmlString: string, path: string, encoding: string) {
        super();
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
        this.initializeFromContent(xmlString, path, encoding);
    }

    private initializeFromContent(xmlString: string, path: string, encoding: string): XliffFile {
        this.parseContent(xmlString, path, encoding);
        const xliffList = this._parsedDocument.getElementsByTagName('xliff');
        if (xliffList.length !== 1) {
            throw new Error(format('File "%s" seems to be no xliff file (should contain an xliff element)', path));
        } else {
            const version = xliffList.item(0).getAttribute('version');
            const expectedVersion = '1.2';
            if (version !== expectedVersion) {
                throw new Error(format('File "%s" seems to be no xliff 1.2 file, version should be %s, found %s', path, expectedVersion, version));
            }
        }
        return this;
    }

    /**
     * File format as it is used in config files.
     * Currently 'xlf', 'xmb', 'xmb2'
     * Returns one of the constants FORMAT_..
     */
    public i18nFormat(): string {
        return FORMAT_XLIFF12;
    }

    /**
     * File type.
     * Here 'XLIFF 1.2'
     */
    public fileType(): string {
        return FILETYPE_XLIFF12;
    }

    /**
     * return tag names of all elements that have mixed content.
     * These elements will not be beautified.
     * Typical candidates are source and target.
     */
    protected elementsWithMixedContent(): string[] {
        return ['source', 'target', 'tool', 'seg-source', 'g', 'ph', 'bpt', 'ept', 'it', 'sub', 'mrk'];
    }

    protected initializeTransUnits() {
        this.transUnits = [];
        let transUnitsInFile = this._parsedDocument.getElementsByTagName('trans-unit');
        for (let i = 0; i < transUnitsInFile.length; i++) {
            let transunit = transUnitsInFile.item(i);
            let id = transunit.getAttribute('id');
            if (!id) {
                this._warnings.push(format('oops, trans-unit without "id" found in master, please check file %s', this._filename));
            }
            this.transUnits.push(new XliffTransUnit(transunit, id, this));
        }
    }

    /**
     * Get source language.
     * @return {string}
     */
    public sourceLanguage(): string {
        const fileElem = DOMUtilities.getFirstElementByTagName(this._parsedDocument, 'file');
        if (fileElem) {
            return fileElem.getAttribute('source-language');
        } else {
            return null;
        }
    }

    /**
     * Edit the source language.
     * @param language
     */
    public setSourceLanguage(language: string) {
        const fileElem = DOMUtilities.getFirstElementByTagName(this._parsedDocument, 'file');
        if (fileElem) {
            fileElem.setAttribute('source-language', language);
        }
    }

    /**
     * Get target language.
     * @return {string}
     */
    public targetLanguage(): string {
        const fileElem = DOMUtilities.getFirstElementByTagName(this._parsedDocument, 'file');
        if (fileElem) {
            return fileElem.getAttribute('target-language');
        } else {
            return null;
        }
    }

    /**
     * Edit the target language.
     * @param language
     */
    public setTargetLanguage(language: string) {
        const fileElem = DOMUtilities.getFirstElementByTagName(this._parsedDocument, 'file');
        if (fileElem) {
            fileElem.setAttribute('target-language', language);
        }
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
    importNewTransUnit(foreignTransUnit: ITransUnit, isDefaultLang: boolean, copyContent: boolean, importAfterElement?: ITransUnit): ITransUnit {
        if (this.transUnitWithId(foreignTransUnit.id)) {
            throw new Error(format('tu with id %s already exists in file, cannot import it', foreignTransUnit.id));
        }
        let newTu = (<AbstractTransUnit> foreignTransUnit).cloneWithSourceAsTarget(isDefaultLang, copyContent, this);
        let bodyElement = DOMUtilities.getFirstElementByTagName(this._parsedDocument, 'body');
        if (!bodyElement) {
            throw new Error(format('File "%s" seems to be no xliff 1.2 file (should contain a body element)', this._filename));
        }
        let inserted = false;
        let isAfterElementPartOfFile = false;
        if (!!importAfterElement) {
            let insertionPoint = this.transUnitWithId(importAfterElement.id);
            if (!!insertionPoint) {
                isAfterElementPartOfFile = true;
            }
        }
        if (importAfterElement === undefined || (importAfterElement && !isAfterElementPartOfFile)) {
            bodyElement.appendChild(newTu.asXmlElement());
            inserted = true;
        } else if (importAfterElement === null) {
            let firstUnitElement = DOMUtilities.getFirstElementByTagName(this._parsedDocument, 'trans-unit');
            if (firstUnitElement) {
                DOMUtilities.insertBefore(newTu.asXmlElement(), firstUnitElement);
                inserted = true;
            } else {
                // no trans-unit, empty file, so add to body
                bodyElement.appendChild(newTu.asXmlElement());
                inserted = true;
            }
        } else {
            let refUnitElement = DOMUtilities.getElementByTagNameAndId(this._parsedDocument, 'trans-unit', importAfterElement.id);
            if (refUnitElement) {
                DOMUtilities.insertAfter(newTu.asXmlElement(), refUnitElement);
                inserted = true;
            }
        }
        if (inserted) {
            this.lazyInitializeTransUnits();
            this.transUnits.push(newTu);
            this.countNumbers();
            return newTu;
        } else {
         return null;
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
    public createTranslationFileForLang(lang: string, filename: string, isDefaultLang: boolean, copyContent: boolean): ITranslationMessagesFile {
        let translationFile = new XliffFile(this.editedContent(), filename, this.encoding());
        translationFile.setNewTransUnitTargetPraefix(this.targetPraefix);
        translationFile.setNewTransUnitTargetSuffix(this.targetSuffix);
        translationFile.setTargetLanguage(lang);
        translationFile.forEachTransUnit((transUnit: ITransUnit) => {
            (<AbstractTransUnit> transUnit).useSourceAsTarget(isDefaultLang, copyContent);
        });
        return translationFile;
    }
}