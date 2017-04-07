import * as cheerio from "cheerio";
import {ITranslationMessagesFile} from './i-translation-messages-file';
import {isNullOrUndefined, format} from 'util';
import {ITransUnit} from './i-trans-unit';
/**
 * Created by martin on 10.03.2017.
 * xmb-File access.
 */

/**
 * Read-Options for cheerio, enable xml mode.
 * @type {{xmlMode: boolean}}
 */
const CheerioOptions: CheerioOptionsInterface = {
    xmlMode: true,
    decodeEntities: false,
};

class TransUnit implements ITransUnit {

    constructor(private _msg: CheerioElement, private _id: string, private _sourceTransUnitFromMaster: ITransUnit) {

    }

    public get id(): string {
        return this._id;
    }

    public sourceContent(): string {
        return cheerio(this._msg).html();
    }

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    public targetContent(): string {
        // in fact, target and source are just the same in xmb
        return cheerio(this._msg).html();
    }

    /**
     * the translated value, but all placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    targetContentNormalized(): string {
        let directHtml = this.targetContent();
        if (!directHtml) {
            return directHtml;
        }
        let normalized = directHtml;
        let re0: RegExp = /<ph name="INTERPOLATION"><ex>INTERPOLATION<\/ex><\/ph>/g;
        normalized = normalized.replace(re0, '{{0}}');
        let reN: RegExp = /<ph name="INTERPOLATION_1"><ex>INTERPOLATION_(\d*)<\/ex><\/ph>/g;
        normalized = normalized.replace(reN, '{{$1}}');

        let reStartAnyTag: RegExp = /<ph name="START_\w*"><ex>&amp;lt;(\w*)&amp;gt;<\/ex><\/ph>/g;
        normalized = normalized.replace(reStartAnyTag, '<$1>');
        let reCloseAnyTag: RegExp = /<ph name="CLOSE_\w*"><ex>&amp;lt;\/(\w*)&amp;gt;<\/ex><\/ph>/g;
        normalized = normalized.replace(reCloseAnyTag, '</$1>');

        return normalized;
    }

    /**
     * State of the translation.
     * (not supported in xmb)
     * If we have a master, we assumed it is translated if the content is not the same as the masters one.
     */
    public targetState(): string {
        if (this._sourceTransUnitFromMaster) {
            let sourceContent = this._sourceTransUnitFromMaster.sourceContent();
            if (!sourceContent || sourceContent == this.targetContent()) {
                return 'new';
            } else {
                return 'final';
            }
        }
        return null; // not supported in xmb
    }

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     * In xmb this is stored in the attribute "desc".
     */
    public description(): string {
        return cheerio(this._msg).attr('desc');
    }

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     * In xmb this is stored in the attribute "meaning".
     */
    public meaning(): string {
        return cheerio(this._msg).attr('meaning');
    }

    /**
     * the real xml element used for trans unit.
     * Here it is a <msg> element.
     * @return {CheerioElement}
     */
    public asXmlElement(): CheerioElement {
        return this._msg;
    }

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     * In xmb there is nothing to do, because there is only a target, no source.
     */
    public useSourceAsTarget(isDefaultLang: boolean) {
    }

    /**
     * Translate trans unit.
     * (very simple, just for tests)
     * @param translation the translated string
     */
    public translate(translation: string) {
        let target = cheerio(this._msg);
        target.html(translation);
    }

}

export class XmbFile implements ITranslationMessagesFile {

    private _filename: string;

    private _encoding: string;

    private xmbContent: CheerioStatic;

    // trans-unit elements and their id from the file
    private transUnits: ITransUnit[];

    private _warnings: string[];
    private _numberOfTransUnitsWithMissingId: number;

    // attached master file, if any
    // used as source to determine state ...
    private _masterFile: XmbFile;

    /**
     * Create an xmb-File from source.
     * @param xmlString file content
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @param optionalMaster in case of xmb the master file, that contains the original texts.
     * (this is used to support state infos, that are based on comparing original with translated version)
     * @return {XmbFile}
     */
    constructor(xmlString: string, path: string, encoding: string, optionalMaster?: {xmlContent: string, path: string, encoding: string}) {
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
        this.initializeFromContent(xmlString, path, encoding, optionalMaster);
    }

    private initializeFromContent(xmlString: string, path: string, encoding: string, optionalMaster?: {xmlContent: string, path: string, encoding: string}): XmbFile {
        this._filename = path;
        this._encoding = encoding;
        this.xmbContent = cheerio.load(xmlString, CheerioOptions);
        if (this.xmbContent('messagebundle').length != 1) {
            throw new Error(format('File "%s" seems to be no xmb file (should contain a messagebundle element)', path));
        }
        if (optionalMaster) {
            this._masterFile = new XmbFile(optionalMaster.xmlContent, optionalMaster.path, optionalMaster.encoding);
            // TODO check, wether this can be the master ...
        }
        return this;
    }

    private initializeTransUnits() {
        if (isNullOrUndefined(this.transUnits)) {
            this.transUnits = [];
            let transUnitsInFile = this.xmbContent('msg');
            transUnitsInFile.each((index, msg: CheerioElement) => {
                let id = cheerio(msg).attr('id');
                if (!id) {
                    this._warnings.push(format('oops, msg without "id" found in master, please check file %s', this.filename));
                    this._numberOfTransUnitsWithMissingId++;
                }
                let masterUnit: ITransUnit = null;
                if (this._masterFile) {
                    masterUnit = this._masterFile.transUnitWithId(id);
                }
                this.transUnits.push(new TransUnit(msg, id, masterUnit));
            });
        }
    }

    /**
     * File type.
     * Here 'XMB'
     */
    public fileType(): string {
        return 'XMB';
    }

    public forEachTransUnit(callback: ((transunit: ITransUnit) => void)) {
        this.initializeTransUnits();
        this.transUnits.forEach((tu) => callback(tu));
    }

    /**
     * Get trans-unit with given id.
     * @param id
     * @return {Cheerio}
     */
    public transUnitWithId(id: string): ITransUnit {
        this.initializeTransUnits();
        return this.transUnits.find((tu) => tu.id == id);
    }

    public warnings(): string[] {
        this.initializeTransUnits();
        return this._warnings;
    }

    public numberOfTransUnits(): number {
        this.initializeTransUnits();
        return this.transUnits.length;
    }

    public numberOfTransUnitsWithMissingId(): number {
        this.initializeTransUnits();
        return this._numberOfTransUnitsWithMissingId;
    }

    /**
     * Guess language from filename.
     * If filename is foo.xy.xmb, than language is assumed to be xy.
     * @return {string} Language or null
     */
    private guessLanguageFromFilename(): string {
        if (this._filename) {
            let parts: string[] = this._filename.split('.');
            if (parts.length > 2 && parts[parts.length -1].toLowerCase() == 'xmb') {
                return parts[parts.length - 2];
            }
        }
        return null;
    }

    /**
     * Get source language.
     * Unsupported in xmb.
     * Try to guess it from master filename if any..
     * @return {string}
     */
    public sourceLanguage(): string {
        if (this._masterFile) {
            return this._masterFile.guessLanguageFromFilename();
        } else {
            return null;
        }
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
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     * In xmb there is nothing to do, because there is only a target, no source.
     */
    public useSourceAsTarget(transUnit: ITransUnit, isDefaultLang: boolean) {
        transUnit.useSourceAsTarget(isDefaultLang);
    }

    /**
     * Translate a given trans unit.
     * (very simple, just for tests)
     * @param transUnit
     * @param translation the translated string
     */
    public translate(transUnit: ITransUnit, translation: string) {
        transUnit.translate(translation);
    }

    /**
     * Add a new trans-unit.
     * @param transUnit
     */
    public addNewTransUnit(transUnit: ITransUnit) {
        this.xmbContent('messagebundle').append(cheerio(transUnit.asXmlElement()));
        this.initializeTransUnits();
        this.transUnits.push(transUnit);
    }

    /**
     * Remove the trans-unit with the given id.
     * @param id
     */
    public removeTransUnitWithId(id: string) {
        this.xmbContent('#' + id).remove();
        this.initializeTransUnits();
        this.transUnits = this.transUnits.filter((tu) => tu.id != id);
    }

    /**
     * The filename where the data is read from.
     */
    public filename(): string {
        return this._filename;
    }

    /**
     * The encoding of the xml content (UTF-8, ISO-8859-1, ...)
     */
    public encoding(): string {
        return this._encoding;
    }

    /**
     * The xml to be saved after changes are made.
     */
    public editedContent(): string {
        return this.xmbContent.xml();
    }

}