import {XliffFile} from './xliff-file';
import {XmbFile} from './xmb-file';
import {FileUtil} from '../common/file-util';
import {format} from 'util';
/**
 * The Common interface of XliffFile and XmbFile.
 * The merge process only uses this interface.
 * Created by martin on 10.03.2017.
 */

/**
 * Helper class to read file depending on format.
 */
export class TranslationMessagesFileReader {

    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param format
     * @param path
     * @param encoding
     * @return {XliffFile}
     */
    public static fromFile(i18nFormat: string, path: string, encoding: string): ITranslationMessagesFile {
        if (i18nFormat === 'xlf') {
            return XliffFile.fromFile(path, encoding);
        }
        if (i18nFormat === 'xmb') {
            return XmbFile.fromFile(path, encoding);
        }
        throw new Error(format('oops, unsupported format "%s"', i18nFormat));
    }
}

/**
 * Interface of a translation unit in the file.
 */
export interface ITransUnit {

    readonly id: string;

    sourceContent(): string;

    /**
     * the translated value (containing all markup, depends on the concrete format used).
     */
    targetContent(): string;

    /**
     * the translated value, but all placeholders are replaced with {{n}} (starting at 0)
     * and all embedded html is replaced by direct html markup.
     */
    targetContentNormalized(): string;

    /**
     * State of the translation.
     * (new, final, ...)
     */
    targetState(): string;

    /**
     * The description set in the template as value of the i18n-attribute.
     * e.g. i18n="mydescription".
     */
    description(): string;

    /**
     * The meaning (intent) set in the template as value of the i18n-attribute.
     * This is the part in front of the | symbol.
     * e.g. i18n="meaning|mydescription".
     */
    meaning(): string;

    /**
     * the real xml element used for trans unit.
     * @return {CheerioElement}
     */
    asXmlElement(): CheerioElement;

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    useSourceAsTarget(isDefaultLang: boolean);

    /**
     * Translate trans unit.
     * (very simple, just for tests)
     * @param translation the translated string
     */
    translate(translation: string);
}

/**
 * The Common interface of XliffFile and XmbFile.
 * The merge process only uses this interface.
 */

export interface ITranslationMessagesFile {

    /**
     * warnings found in the file
     */
    warnings(): string[];

    /**
     * Number of translations found in the file.
     */
    numberOfTransUnits(): number;

    /**
     * Number of translations without id found in the file.
     */
    numberOfTransUnitsWithMissingId(): number;

    /**
     * Get source language.
     * @return {string}
     */
    sourceLanguage(): string;

    /**
     * Edit the source language.
     * @param language
     */
    setSourceLanguage(language: string);

    /**
     * Get target language.
     * @return {string}
     */
    targetLanguage(): string;

    /**
     * Edit the target language.
     * @param language
     */
    setTargetLanguage(language: string);

    /**
     * Loop over all Translation Units.
     * @param callback
     */
    forEachTransUnit(callback: ((transunit: ITransUnit) => void));

    /**
     * Get trans-unit with given id.
     * @param id
     * @return {Cheerio}
     */
    transUnitWithId(id: string): ITransUnit;

    /**
     * Edit functions following her
     */

    /**
     * Add a new trans-unit.
     * @param transUnit
     */
    addNewTransUnit(transUnit: ITransUnit);

    /**
     * Remove the trans-unit with the given id.
     * @param id
     */
    removeTransUnitWithId(id: string);

    /**
     * Copy source to target to use it as dummy translation.
     * (better than missing value)
     */
    useSourceAsTarget(transUnit: ITransUnit, isDefaultLang: boolean);

    /**
     * Translate a given trans unit.
     * (very simple, just for tests)
     * @param transUnit
     * @param translation the translated string
     */
    translate(transUnit: ITransUnit, translation: string);

    /**
     * Save edited content to file.
     */
    save();

}