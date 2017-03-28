import {XliffFile} from './xliff-file';
import {XmbFile} from './xmb-file';
import {FileUtil} from '../common/file-util';
import {format} from 'util';
import {ITransUnit} from './i-trans-unit';

/**
 * The Common interface of XliffFile and XmbFile.
 * The merge process only uses this interface.
 * Created by martin on 10.03.2017.
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
     * The filename where the data is read from.
     */
    filename(): string;

    /**
     * The encoding if the xml content (UTF-8, ISO-8859-1, ...)
     */
    encoding(): string;

    /**
     * The xml content to be saved after changes are made.
     */
    editedContent(): string;

}