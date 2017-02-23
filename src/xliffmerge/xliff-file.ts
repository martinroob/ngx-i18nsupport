import * as cheerio from "cheerio";
import util = require('util');
import {FileUtil} from '../common/file-util';
import {isNullOrUndefined} from 'util';
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
}

export class TransUnit {

    constructor(private _transUnit: CheerioElement, private _id: string) {

    }

    public get _transUnitElement() {
        return this._transUnit;
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

}

export class XliffFile {

    static DEFAULT_ENCODING = 'UTF-8';

    /**
     * Read an xlf-File.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return {XliffFile}
     */
    public static fromFile(path: string, encoding?: string): XliffFile {
        let xlf = new XliffFile();
        if (!encoding) {
            encoding = XliffFile.DEFAULT_ENCODING;
        }
        let content: string = FileUtil.read(path, encoding);
        let foundEncoding = XliffFile.encodingFromXml(content);
        if (foundEncoding != encoding) {
            // read again with the correct encoding
            content = FileUtil.read(path, foundEncoding);
        }
        xlf.initializeFromContent(content, path, foundEncoding);
        return xlf;
    }

    /**
     * Read the encoding from the xml.
     * xml File starts with .. encoding=".."
     * @param xmlString
     * @return {any}
     */
    public static encodingFromXml(xmlString: string): string {
        let index = xmlString.indexOf('encoding="');
        if (index < 0) {
            return XliffFile.DEFAULT_ENCODING; // default in xml if not explicitly set
        }
        let endIndex = xmlString.indexOf('"', index + 10); // 10 = length of 'encoding="'
        return xmlString.substring(index + 10, endIndex);
    }

    private filename: string;

    private encoding: string;

    private xliffContent: CheerioStatic;

    // trans-unit elements and their id from the file
    private transUnits: TransUnit[];

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

    public forEachTransUnit(callback: ((transunit: TransUnit) => void)) {
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
    public transUnitWithId(id: string): TransUnit {
        this.initializeTransUnits();
        return this.transUnits.find((tu) => tu.id == id);
    }

    /**
     * Add a new trans-unit.
     * @param transUnit
     */
    public addNewTransUnit(transUnit: TransUnit) {
        this.xliffContent('body').append(cheerio(transUnit._transUnitElement));
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

    private initializeTransUnits() {
        if (isNullOrUndefined(this.transUnits)) {
            this.transUnits = [];
            let transUnitsInFile = this.xliffContent('trans-unit');
            transUnitsInFile.each((index, transunit: CheerioElement) => {
                let id = cheerio(transunit).attr('id');
                if (!id) {
                    this._warnings.push(util.format('oops, trans-unit without "id" found in master, please check file %s', this.filename));
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
    public useSourceAsTarget(transUnit: TransUnit, isDefaultLang: boolean) {
        let source = cheerio('source', transUnit._transUnitElement);
        let target = cheerio('target', transUnit._transUnitElement);
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

    /**
     * Translate a given trans unit.
     * (very simple, just for tests)
     * @param transUnit
     * @param translation the translated string
     */
    public translate(transUnit: TransUnit, translation: string) {
        let target = cheerio('target', transUnit._transUnitElement);
        if (!target) {
            let source = cheerio('source', transUnit._transUnitElement);
            source.parent().append('<target/>');
            target = cheerio('target', source.parent());
        }
        target.html(translation);
        target.attr('state', 'final');
    }

    /**
     * Save edited content to file.
     */
    public save() {
        FileUtil.replaceContent(this.filename, this.xliffContent.xml(), this.encoding);
    }
}