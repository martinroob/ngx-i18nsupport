import * as cheerio from "cheerio";
import {FileUtil} from '../common/file-util';
import {isNullOrUndefined, format} from 'util';
import {XmlReader} from './xml-reader';
import {ITranslationMessagesFile, ITransUnit} from './i-translation-messages-file';
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

    public targetContent(): string {
        return cheerio('target', this._transUnit).html();
    }

    public targetState(): string {
        return cheerio('target', this._transUnit).attr('state');
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

    /**
     * Read an xlf-File.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XliffFile}
     */
    public static fromFile(path: string, encoding?: string): XliffFile {
        let xlf = new XliffFile();
        let xmlContent = XmlReader.readXmlFileContent(path, encoding);
        xlf.initializeFromContent(xmlContent.content, path, xmlContent.encoding);
        return xlf;
    }

    private filename: string;

    private encoding: string;

    private xliffContent: CheerioStatic;

    // trans-unit elements and their id from the file
    private transUnits: ITransUnit[];

    private _warnings: string[];
    private _numberOfTransUnitsWithMissingId: number;

    constructor() {
        this._warnings = [];
        this._numberOfTransUnitsWithMissingId = 0;
    }

    private initializeFromContent(xmlString: string, path: string, encoding: string): XliffFile {
        this.filename = path;
        this.encoding = encoding;
        this.xliffContent = cheerio.load(xmlString, CheerioOptions);
        return this;
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
     * Save edited content to file.
     */
    public save() {
        FileUtil.replaceContent(this.filename, this.xliffContent.xml(), this.encoding);
    }
}