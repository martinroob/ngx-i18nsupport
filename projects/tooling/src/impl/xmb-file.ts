import {DOMParser} from "xmldom";
import {ITranslationMessagesFile, ITransUnit, FORMAT_XMB, FILETYPE_XMB} from '../api';
import {format} from 'util';
import {XmbTransUnit} from './xmb-trans-unit';
import {AbstractTranslationMessagesFile} from './abstract-translation-messages-file';
import {XTB_DOCTYPE, XtbFile} from './xtb-file';
/**
 * Created by martin on 10.03.2017.
 * xmb-File access.
 */

export class XmbFile extends AbstractTranslationMessagesFile implements ITranslationMessagesFile {

    /**
     * Create an xmb-File from source.
     * @param xmlString file content
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XmbFile}
     */
    constructor(xmlString: string, path: string, encoding: string) {
        super();
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
        this.initializeFromContent(xmlString, path, encoding);
    }

    private initializeFromContent(xmlString: string, path: string, encoding: string): XmbFile {
        this.parseContent(xmlString, path, encoding);
        if (this._parsedDocument.getElementsByTagName('messagebundle').length !== 1) {
            throw new Error(format('File "%s" seems to be no xmb file (should contain a messagebundle element)', path));
        }
        return this;
    }

    protected initializeTransUnits() {
        this.transUnits = [];
        let transUnitsInFile = this._parsedDocument.getElementsByTagName('msg');
        for (let i = 0; i < transUnitsInFile.length; i++) {
            let msg = transUnitsInFile.item(i);
            let id = msg.getAttribute('id');
            if (!id) {
                this._warnings.push(format('oops, msg without "id" found in master, please check file %s', this._filename));
            }
            this.transUnits.push(new XmbTransUnit(msg, id, this));
        }
    }

    /**
     * File format as it is used in config files.
     * Currently 'xlf', 'xmb', 'xmb2'
     * Returns one of the constants FORMAT_..
     */
    public i18nFormat(): string {
        return FORMAT_XMB;
    }

    /**
     * File type.
     * Here 'XMB'
     */
    public fileType(): string {
        return FILETYPE_XMB;
    }

    /**
     * return tag names of all elements that have mixed content.
     * These elements will not be beautified.
     * Typical candidates are source and target.
     */
    protected elementsWithMixedContent(): string[] {
        return ['message'];
    }

    /**
     * Guess language from filename.
     * If filename is foo.xy.xmb, than language is assumed to be xy.
     * @return {string} Language or null
     */
    private guessLanguageFromFilename(): string {
        if (this._filename) {
            let parts: string[] = this._filename.split('.');
            if (parts.length > 2 && parts[parts.length - 1].toLowerCase() === 'xmb') {
                return parts[parts.length - 2];
            }
        }
        return null;
    }

    /**
     * Get source language.
     * Unsupported in xmb.
     * Try to guess it from filename if any..
     * @return {string}
     */
    public sourceLanguage(): string {
        return this.guessLanguageFromFilename();
    }

    /**
     * Edit the source language.
     * Unsupported in xmb.
     * @param language
     */
    public setSourceLanguage(language: string) {
        // do nothing, xmb has no notation for this.
    }

    /**
     * Get target language.
     * Unsupported in xmb.
     * Try to guess it from filename if any..
     * @return {string}
     */
    public targetLanguage(): string {
        return this.guessLanguageFromFilename();
    }

    /**
     * Edit the target language.
     * Unsupported in xmb.
     * @param language
     */
    public setTargetLanguage(language: string) {
        // do nothing, xmb has no notation for this.
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
        throw Error('xmb file cannot be used to store translations, use xtb file');
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
        let translationbundleXMLSource = '<?xml version="1.0" encoding="UTF-8"?>\n' + XTB_DOCTYPE + '\n<translationbundle>\n</translationbundle>\n';
        let translationFile = new XtbFile(translationbundleXMLSource, filename, this.encoding(), {xmlContent: this.editedContent(), path: this.filename(), encoding: this.encoding()});
        translationFile.setNewTransUnitTargetPraefix(this.targetPraefix);
        translationFile.setNewTransUnitTargetSuffix(this.targetSuffix);
        translationFile.setTargetLanguage(lang);
        translationFile.setNewTransUnitTargetPraefix(this.getNewTransUnitTargetPraefix());
        translationFile.setNewTransUnitTargetSuffix(this.getNewTransUnitTargetSuffix());
        this.forEachTransUnit((tu) => {
            translationFile.importNewTransUnit(tu, isDefaultLang, copyContent);
        });
        return translationFile;
    }

}