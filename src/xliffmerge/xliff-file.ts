import * as cheerio from "cheerio";
import {isNullOrUndefined, format} from 'util';
import {ITranslationMessagesFile} from './i-translation-messages-file';
import {ITransUnit} from './i-trans-unit';
/**
 * Created by martin on 23.02.2017.
 * Ab xliff file read from a source file.
 * Defines some relevant get and set method for reading and modifying such a file.
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

    constructor(private _transUnit: CheerioElement, private _id: string) {

    }

    public get id(): string {
        return this._id;
    }

    public sourceContent(): string {
        return cheerio('source', this._transUnit).html();
    }

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    public targetContent(): string {
        return cheerio('target', this._transUnit).html();
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
        let re0: RegExp = /<x id="INTERPOLATION"><\/x>/g;
        normalized = normalized.replace(re0, '{{0}}');
        let reN: RegExp = /<x id="INTERPOLATION_(\d*)"><\/x>/g;
        normalized = normalized.replace(reN, '{{$1}}');

        let reStartBold: RegExp = /<x id="START_BOLD_TEXT" ctype="x-b"><\/x>/g;
        normalized = normalized.replace(reStartBold, '<b>');
        let reCloseBold: RegExp = /<x id="CLOSE_BOLD_TEXT" ctype="x-b"><\/x>/g;
        normalized = normalized.replace(reCloseBold, '</b>');

        let reStartAnyTag: RegExp = /<x id="START_TAG_(\w*)" ctype="x-(\w*)"><\/x>/g;
        normalized = normalized.replace(reStartAnyTag, '<$2>');
        let reCloseAnyTag: RegExp = /<x id="CLOSE_TAG_(\w*)" ctype="x-(\w*)"><\/x>/g;
        normalized = normalized.replace(reCloseAnyTag, '</$2>');

        return normalized;
    }

    /**
     * State of the translation.
     * (new, final, ...)
     */
    public targetState(): string {
        return cheerio('target', this._transUnit).attr('state');
    }

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     * In xliff this is stored as a note element with attribute from="description".
     */
    public description(): string {
        let descriptionElem = cheerio('note', this._transUnit).filter((index, elem) => cheerio(elem).attr('from') == 'description');
        return descriptionElem ? descriptionElem.html() : null;
    }

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     * In xliff this is stored as a note element with attribute from="meaning".
     */
    public meaning(): string {
        let meaningElem = cheerio('note', this._transUnit).filter((index, elem) => cheerio(elem).attr('from') == 'meaning');
        return meaningElem ? meaningElem.html() : null;
    }

    /**
     * the real xml element used for trans unit.
     * Here it is a <trans-unit> element defined in XLIFF Spec.
     * @return {CheerioElement}
     */
    public asXmlElement(): CheerioElement {
        return this._transUnit;
    }

    /**
     * Translate trans unit.
     * (very simple, just for tests)
     * @param translation the translated string
     */
    public translate(translation: string) {
        let target = cheerio('target', this._transUnit);
        if (!target) {
            let source = cheerio('source', this._transUnit);
            source.parent().append('<target/>');
            target = cheerio('target', source.parent());
        }
        let translationContainer: CheerioStatic = cheerio.load('<dummy>' + translation + '</dummy>', CheerioOptions);
        let translationParts: Cheerio = translationContainer('dummy');
        target.contents().remove();
        translationParts.contents().each((index, element) => {target.append(cheerio(element));});
        target.attr('state', 'final');
    }

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    public useSourceAsTarget(isDefaultLang: boolean) {
        let source = cheerio('source', this._transUnit);
        let target = cheerio('target', this._transUnit);
        if (!target) {
            source.parent().append('<target/>');
            target = cheerio('target', source.parent());
        }
        target.html(source.html());
        if (isDefaultLang) {
            target.attr('state', 'final');
        } else {
            target.attr('state', 'new');
        }
    }

}

export class XliffFile implements ITranslationMessagesFile {

    private _filename: string;

    private _encoding: string;

    private xliffContent: CheerioStatic;

    // trans-unit elements and their id from the file
    private transUnits: ITransUnit[];

    private _warnings: string[];
    private _numberOfTransUnitsWithMissingId: number;

    /**
     * Create an xlf-File from source.
     * @param xmlString source read from file.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XliffFile}
     */
    constructor(xmlString: string, path: string, encoding: string) {
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
        this.initializeFromContent(xmlString, path, encoding);
    }

    private initializeFromContent(xmlString: string, path: string, encoding: string): XliffFile {
        this._filename = path;
        this._encoding = encoding;
        this.xliffContent = cheerio.load(xmlString, CheerioOptions);
        if (this.xliffContent('xliff').length < 1) {
            throw new Error(format('File "%s" seems to be no xliff file (should contain an xliff element)', path));
        }
        return this;
    }

    /**
     * File type.
     * Here 'XLIFF 1.2'
     */
    public fileType(): string {
        return 'XLIFF 1.2';
    }

    public forEachTransUnit(callback: ((transunit: ITransUnit) => void)) {
        this.initializeTransUnits();
        this.transUnits.forEach((tu) => callback(tu));
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
     * Get trans-unit with given id.
     * @param id
     * @return {Cheerio}
     */
    public transUnitWithId(id: string): ITransUnit {
        this.initializeTransUnits();
        return this.transUnits.find((tu) => tu.id == id);
    }

    private initializeTransUnits() {
        if (isNullOrUndefined(this.transUnits)) {
            this.transUnits = [];
            let transUnitsInFile = this.xliffContent('trans-unit');
            transUnitsInFile.each((index, transunit: CheerioElement) => {
                let id = cheerio(transunit).attr('id');
                if (!id) {
                    this._warnings.push(format('oops, trans-unit without "id" found in master, please check file %s', this.filename));
                    this._numberOfTransUnitsWithMissingId++;
                }
                this.transUnits.push(new TransUnit(transunit, id));
            });
        }
    }

    /**
     * Get source language.
     * @return {string}
     */
    public sourceLanguage(): string {
        return this.xliffContent('file').attr('source-language');
    }

    /**
     * Edit the source language.
     * @param language
     */
    public setSourceLanguage(language: string) {
        this.xliffContent('file').attr('source-language', language);
    }

    /**
     * Get target language.
     * @return {string}
     */
    public targetLanguage(): string {
        return this.xliffContent('file').attr('target-language');
    }

    /**
     * Edit the target language.
     * @param language
     */
    public setTargetLanguage(language: string) {
        this.xliffContent('file').attr('target-language', language);
    }

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
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
        this.xliffContent('body').append(cheerio(transUnit.asXmlElement()));
        this.initializeTransUnits();
        this.transUnits.push(transUnit);
    }

    /**
     * Remove the trans-unit with the given id.
     * @param id
     */
    public removeTransUnitWithId(id: string) {
        this.xliffContent('#' + id).remove();
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
     * The encoding if the xml content (UTF-8, ISO-8859-1, ...)
     */
    public encoding(): string {
        return this._encoding;
    }

    /**
     * The xml to be saved after changes are made.
     */
    public editedContent(): string {
        return this.xliffContent.xml();
    }

}