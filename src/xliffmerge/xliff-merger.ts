import {XliffMergeParameters} from "./xliff-merge-parameters";
import * as cheerio from "cheerio";
import {Logger, LogLevel} from '../common/logger';
import {XliffMergeError} from './xliff-merge-error';
import {FileUtil} from '../common/file-util';

/**
 * Created by martin on 17.02.2017.
 * XliffMerger - reaf xlif file and put untranslated parts in language specific xlif files.
 *
 */

/**
 * Read-Options for cheerio, enable xml mode.
 * @type {{xmlMode: boolean}}
 */
const CheerioOptions: CheerioOptionsInterface = {
    xmlMode: true,
    decodeEntities: false,
}

export class XliffMerger {

    private parameters: XliffMergeParameters;

    // trans-unit elements amd their id from master
    private transUnitsFromMaster: {
        transunit: CheerioElement;
        id: string;
    }[];

    constructor(languages: string[], profilePath: string, verbose: boolean) {
        Logger.verbose = verbose;
        this.parameters = new XliffMergeParameters(languages, profilePath, verbose);
    }

    /**
     * Ausführen merge-Process.
     * @param languages Array mit den Sprachen (de, en, ..)
     * @param profilePath Pfad zur Profile-Datei
     */
    public run() {
        this.readMaster();
        this.parameters.languages().forEach((lang: string) => {
            this.processLanguage(lang);
        });
    }

    private readMaster() {
        let masterContent = FileUtil.read(this.parameters.i18nFile(), this.parameters.encoding());
        let master: CheerioStatic = cheerio.load(masterContent, CheerioOptions);
        // cross check, that master has the expected encoding
        let foundEncoding = this.encodingFromXml(masterContent);
        if (foundEncoding !== this.parameters.encoding()) {
            Logger.log(LogLevel.ERROR, 'found encoding "%s" in master file, expecting "%s", please set it correct in configuration file', foundEncoding, this.parameters.encoding());
            throw new XliffMergeError('bad encoding found in master');
        }
        let transUnitsFromMaster = master('trans-unit');
        this.transUnitsFromMaster = [];
        let missingIdCount = 0;
        transUnitsFromMaster.each((index, transunit: CheerioElement) => {
            let id = cheerio(transunit).attr('id');
            if (!id) {
                Logger.log(LogLevel.WARN, 'oops, trans-unit without "id" found in master, please check file %s', this.parameters.i18nFile());
                missingIdCount++;
            }
            this.transUnitsFromMaster.push({transunit: transunit, id: id});

        });
        let count = transUnitsFromMaster.length;
        Logger.log(LogLevel.INFO, 'master contains %s trans-units', count);
        if (missingIdCount > 0) {
            Logger.log(LogLevel.WARN, 'master contains %s trans-units, but there are %s without id', count, missingIdCount);
        }
        let sourceLang: string = master('file').attr('source-language');
        if (sourceLang !== this.parameters.defaultLanguage()) {
            Logger.log(LogLevel.WARN, 'master says to have source-language="%s", should be "%s" (your defaultLanguage)', sourceLang, this.parameters.defaultLanguage());
            master('file').attr('source-language', this.parameters.defaultLanguage());
            FileUtil.replaceContent(this.parameters.i18nFile(), master.xml(), this.parameters.encoding());
            Logger.log(LogLevel.WARN, 'changed master source-language="%s"', sourceLang);
        }
    }

    /**
     * Read the encoding from the xml.
     * xml File starts with .. encoding=".."
     * @param xmlString
     * @return {any}
     */
    private encodingFromXml(xmlString: string): string {
        let index = xmlString.indexOf('encoding="');
        if (index < 0) {
            return 'UTF-8'; // default in xml if not explicitly set
        }
        let endIndex = xmlString.indexOf('"', index + 10); // 10 = length of 'encoding="'
        return xmlString.substring(index + 10, endIndex);
    }

    private processLanguage(lang: string) {
        Logger.log(LogLevel.DEBUG, 'processing language %s', lang);
        let languageXliffFile = this.parameters.generatedI18nFile(lang);
        if (!FileUtil.exists(languageXliffFile)) {
            this.createUntranslatedXliff(lang, languageXliffFile);
        } else {
            this.mergeMasterTo(lang, languageXliffFile);
        }
    }

    /**
     * create a new file for the language, which contains no translations, but all keys.
     * in principle, this is just a copy of the master with target-language set.
     * @param lang
     * @param languageXliffFile
     */
    private createUntranslatedXliff(lang: string, languageXliffFile: string) {
        // copy master ...
        FileUtil.copy(this.parameters.i18nFile(), languageXliffFile);

        // read copy and set target-language
        let xliffContent: string = FileUtil.read(languageXliffFile, this.parameters.encoding());
        let xliff: CheerioStatic = cheerio.load(xliffContent, CheerioOptions);
        xliff('file').attr('target-language', lang);

        // copy source to target
        let isDefaultLang: boolean = (lang == this.parameters.defaultLanguage());
        xliff('trans-unit').each((index, transUnit: CheerioElement) => {
            this.setDummyTranslation(transUnit, isDefaultLang);
        });
        // write it to file
        FileUtil.replaceContent(languageXliffFile, xliff.xml(), this.parameters.encoding());
        Logger.log(LogLevel.INFO, 'created new file "%s" for target-language="%s"', languageXliffFile, lang);
        if (!isDefaultLang) {
            Logger.log(LogLevel.WARN, 'please translate file "%s" to target-language="%s"', languageXliffFile, lang);
        }
    }

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    private setDummyTranslation(transUnit: CheerioElement, isDefaultLang: boolean) {
        let source = cheerio('source', transUnit);
        let target = cheerio('target', transUnit);
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
     * Merge all
     * @param lang
     * @param languageXliffFile
     */
    private mergeMasterTo(lang: string, languageXliffFile: string) {
        // read lang specific file
        let xliffContent: string = FileUtil.read(languageXliffFile, this.parameters.encoding());
        let xliff: CheerioStatic = cheerio.load(xliffContent, CheerioOptions);

        let isDefaultLang: boolean = (lang == this.parameters.defaultLanguage());
        let newCount = 0;
        this.transUnitsFromMaster.forEach((transUnitAndIdFromMaster) => {
            let id = transUnitAndIdFromMaster.id;
            let transUnit = xliff('#' + id);
            if (transUnit.length == 0) {
                // oops, no translation, must be a new key, so add it
                let masterTransUnit: CheerioElement = transUnitAndIdFromMaster.transunit;
                this.setDummyTranslation(masterTransUnit, isDefaultLang);
                xliff('body').append(cheerio(masterTransUnit));
                newCount++;
            }
        });
        if (newCount > 0) {
            Logger.log(LogLevel.WARN, 'merged %s trans-units from master to "%s"', newCount, lang);
        }

        // remove all elements that are no longer used
        let removeCount = 0;
        xliff('trans-unit').map((index, transUnit: CheerioElement) => {
            let id = cheerio(transUnit).attr('id');
            let existsInMaster = this.transUnitsFromMaster.find((transUnitFromMaster) => transUnitFromMaster.id == id);
            if (!existsInMaster) {
                if (this.parameters.removeUnusedIds()) {
                    xliff('#' + id).remove();
                }
                removeCount++;
            }
        });
        if (removeCount > 0) {
            if (this.parameters.removeUnusedIds()) {
                Logger.log(LogLevel.WARN, 'removed %s unused trans-units in "%s"', removeCount, lang);
            } else {
                Logger.log(LogLevel.WARN, 'keeping %s unused trans-units in "%s", because removeUnused is disabled', removeCount, lang);
            }
        }

        if (newCount == 0 && removeCount == 0) {
            Logger.log(LogLevel.INFO, 'file for "%s" was up to date', lang);
        } else {
            // write it to file
            FileUtil.replaceContent(languageXliffFile, xliff.xml(), this.parameters.encoding());
            Logger.log(LogLevel.INFO, 'updated file "%s" for target-language="%s"', languageXliffFile, lang);
            if (newCount > 0 && !isDefaultLang) {
                Logger.log(LogLevel.WARN, 'please translate file "%s" to target-language="%s"', languageXliffFile, lang);
            }

        }
    }

}