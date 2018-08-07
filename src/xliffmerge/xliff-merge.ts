import * as program from 'commander';
import {CommandOutput} from '../common/command-output';
import {XliffMergeParameters} from "./xliff-merge-parameters";
import {XliffMergeError} from './xliff-merge-error';
import {FileUtil} from '../common/file-util';
import {VERSION} from './version';
import {format, isNullOrUndefined} from 'util';
import {ITranslationMessagesFile, ITransUnit, FORMAT_XMB, FORMAT_XTB} from 'ngx-i18nsupport-lib';
import {ProgramOptions, IConfigFile} from './i-xliff-merge-options';
import {NgxTranslateExtractor} from './ngx-translate-extractor';
import {TranslationMessagesFileReader} from './translation-messages-file-reader';
import {Observable, of, forkJoin} from 'rxjs';
import {map, catchError} from 'rxjs/operators';
import {XliffMergeAutoTranslateService} from '../autotranslate/xliff-merge-auto-translate-service';
import {AutoTranslateSummaryReport} from '../autotranslate/auto-translate-summary-report';
import {NORMALIZATION_FORMAT_DEFAULT, STATE_FINAL, STATE_TRANSLATED} from 'ngx-i18nsupport-lib/dist';

/**
 * Created by martin on 17.02.2017.
 * XliffMerge - read xliff or xmb file and put untranslated parts in language specific xliff or xmb files.
 *
 */

export class XliffMerge {

    static main(argv: string[]) {
        let options = XliffMerge.parseArgs(argv);
        new XliffMerge(new CommandOutput(process.stdout), options).run((result) => {
            process.exit(result);
        });
    }

    static parseArgs(argv: string[]): ProgramOptions {
        let languages: string[] = null;
        delete program.verbose;
        delete program.quiet;
        delete program.profilePath;
        delete program.languages;
        program
            .version(VERSION)
            .arguments('<language...>')
            .option('-p, --profile [configfile]', 'a json configuration file containing all relevant parameters (see details below)')
            .option('-v, --verbose', 'show some output for debugging purposes')
            .option('-q, --quiet', 'only show errors, nothing else')
            .on('--help', () => {
                console.log('  <language> has to be a valid language short string, e,g. "en", "de", "de-ch"');
                console.log('');
                console.log('  configfile can contain the following values:');
                console.log('\tquiet verbose defaultLanguage languages srcDir i18nBaseFile i18nFile i18nFormat encoding genDir' +
                    '\n\tremoveUnusedIds allowIdChange' +
                    '\n\tsupportNgxTranslate ngxTranslateExtractionPattern' +
                    '\n\tuseSourceAsTarget targetPraefix targetSuffix' +
                    '\n\tautotranslate apikey apikeyfile');
                console.log('\tfor details please consult the home page https://github.com/martinroob/ngx-i18nsupport');
            })
            .action((languageArray) => {
                languages = languageArray;
            })
            .parse(argv);

        let options: ProgramOptions = {
            languages: languages
        };
        if (program.profile) {
            options.profilePath = program.profile;
        }
        if (program.quiet) {
            options.quiet = true;
        }
        if (program.verbose && program.verbose > 0) {
            options.verbose = true;
        }
        return options;
    }

    private commandOutput: CommandOutput;

    private options: ProgramOptions;

    private parameters: XliffMergeParameters;

    /**
     * The read master xlf file.
     */
    private master: ITranslationMessagesFile; // XliffFile or Xliff2File or XmbFile

    private autoTranslateService: XliffMergeAutoTranslateService;

    /**
     * For Tests, create instance with given profile
     * @param commandOutput
     * @param options
     * @param profileContent
     */
    public static createFromOptions(commandOutput: CommandOutput, options: ProgramOptions, profileContent?: IConfigFile) {
        let instance = new XliffMerge(commandOutput, options);
        instance.parameters = XliffMergeParameters.createFromOptions(options, profileContent);
        return instance;
    }

    constructor(commandOutput: CommandOutput, options: ProgramOptions) {
        this.commandOutput = commandOutput;
        this.options = options;
        this.parameters = null;
    }

    /**
     * Run the command.
     * This runs async.
     * @param callbackFunction when command is executed, called with the return code (0 for ok), if given.
     * @param errorFunction callbackFunction for error handling
     */
    public run(callbackFunction?: ((retcode: number) => any), errorFunction?: ((error: any) => any)) {
        this.doRun()
            .subscribe((retcode: number) => {
                if (!isNullOrUndefined(callbackFunction)) {
                    callbackFunction(retcode);
                }
            }, (error) => {
                if (!isNullOrUndefined(errorFunction)) {
                    errorFunction(error);
                }
            });
    }

    /**
     * Execute merge-Process.
     * @return Async operation, on completion returns retcode 0=ok, other = error.
     */
    private doRun(): Observable<number> {
        if (this.options && this.options.quiet) {
            this.commandOutput.setQuiet();
        }
        if (this.options && this.options.verbose) {
            this.commandOutput.setVerbose();
        }
        if (!this.parameters) {
            this.parameters = XliffMergeParameters.createFromOptions(this.options);
        }
        this.commandOutput.info('xliffmerge version %s', VERSION);
        if (this.parameters.verbose()) {
            this.parameters.showAllParameters(this.commandOutput);
        }
        if (this.parameters.errorsFound.length > 0) {
            for (let err of this.parameters.errorsFound) {
                this.commandOutput.error(err.message);
            }
            return of(-1);
        }
        if (this.parameters.warningsFound.length > 0) {
            for (let warn of this.parameters.warningsFound) {
                this.commandOutput.warn(warn);
            }
        }
        this.readMaster();
        if (this.parameters.autotranslate()) {
            this.autoTranslateService = new XliffMergeAutoTranslateService(this.parameters.apikey());
        }
        const executionForAllLanguages: Observable<number>[] = [];
        this.parameters.languages().forEach((lang: string) => {
            executionForAllLanguages.push(this.processLanguage(lang));
        });
        return forkJoin(executionForAllLanguages).pipe(
            map((retcodes: number[]) => {return this.totalRetcode(retcodes)}));
    }

    /**
     * Give an array of retcodes for the different languages, return the total retcode.
     * If all are 0, it is 0, otherwise the first non zero.
     * @param retcodes
     * @return {number}
     */
    private totalRetcode(retcodes: number[]): number {
        for (let i = 0; i < retcodes.length; i++) {
            if (retcodes[i] !== 0) {
                return retcodes[i];
            }
        }
        return 0;
    }

    /**
     * Return the name of the generated file for given lang.
     * @param lang
     * @return {string}
     */
    public generatedI18nFile(lang: string): string {
        return this.parameters.generatedI18nFile(lang);
    }

    /**
     * Return the name of the generated ngx-translation file for given lang.
     * @param lang
     * @return {string}
     */
    public generatedNgxTranslateFile(lang: string): string {
        return this.parameters.generatedNgxTranslateFile(lang);
    }

    /**
     * Warnings found during the run.
     * @return {string[]}
     */
    public warnings(): string[] {
        return this.parameters.warningsFound;
    }

    private readMaster() {
        try {
            this.master = TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), this.parameters.i18nFile(), this.parameters.encoding());
            this.master.warnings().forEach((warning: string) =>{
                this.commandOutput.warn(warning);
            });
            let count = this.master.numberOfTransUnits();
            let missingIdCount = this.master.numberOfTransUnitsWithMissingId();
            this.commandOutput.info('master contains %s trans-units', count);
            if (missingIdCount > 0) {
                this.commandOutput.warn('master contains %s trans-units, but there are %s without id', count, missingIdCount);
            }
            let sourceLang: string = this.master.sourceLanguage();
            if (sourceLang && sourceLang !== this.parameters.defaultLanguage()) {
                this.commandOutput.warn('master says to have source-language="%s", should be "%s" (your defaultLanguage)', sourceLang, this.parameters.defaultLanguage());
                this.master.setSourceLanguage(this.parameters.defaultLanguage());
                TranslationMessagesFileReader.save(this.master, this.parameters.beautifyOutput());
                this.commandOutput.warn('changed master source-language="%s" to "%s"', sourceLang, this.parameters.defaultLanguage());
            }
        } catch (err) {
            if (err instanceof XliffMergeError) {
                this.commandOutput.error(err.message);
                return of(-1);
            } else {
                // unhandled
                const currentFilename = this.parameters.i18nFile();
                let filenameString = (currentFilename) ? format('file "%s", ', currentFilename) : '';
                this.commandOutput.error(filenameString + 'oops ' + err);
                throw err;
            }
        }
    }

    /**
     * Process the given language.
     * Async operation.
     * @param lang
     * @return {Observable<number>} on completion 0 for ok, other for error
     */
    private processLanguage(lang: string): Observable<number> {
        this.commandOutput.debug('processing language %s', lang);
        let languageXliffFile = this.parameters.generatedI18nFile(lang);
        let currentFilename = languageXliffFile;
        let result: Observable<void>;
        if (!FileUtil.exists(languageXliffFile)) {
            result = this.createUntranslatedXliff(lang, languageXliffFile);
        } else {
            result = this.mergeMasterTo(lang, languageXliffFile);
        }
        return result
            .pipe(map(() => {
                if (this.parameters.supportNgxTranslate()) {
                    let languageSpecificMessagesFile: ITranslationMessagesFile = TranslationMessagesFileReader.fromFile(XliffMerge.translationFormat(this.parameters.i18nFormat()), languageXliffFile, this.parameters.encoding(), this.master.filename());
                    NgxTranslateExtractor.extract(languageSpecificMessagesFile, this.parameters.ngxTranslateExtractionPattern(), this.parameters.generatedNgxTranslateFile(lang));
                }
                return 0;
            }), catchError((err) => {
                if (err instanceof XliffMergeError) {
                    this.commandOutput.error(err.message);
                    return of(-1);
                } else {
                    // unhandled
                    let filenameString = (currentFilename) ? format('file "%s", ', currentFilename) : '';
                    this.commandOutput.error(filenameString + 'oops ' + err);
                    throw err;
                }
            }));
    }

    /**
     * create a new file for the language, which contains no translations, but all keys.
     * in principle, this is just a copy of the master with target-language set.
     * @param lang
     * @param languageXliffFilePath
     */
    private createUntranslatedXliff(lang: string, languageXliffFilePath: string): Observable<void> {
        // copy master ...
        // and set target-language
        // and copy source to target if necessary
        let isDefaultLang: boolean = (lang == this.parameters.defaultLanguage());
        this.master.setNewTransUnitTargetPraefix(this.parameters.targetPraefix());
        this.master.setNewTransUnitTargetSuffix(this.parameters.targetSuffix());
        let languageSpecificMessagesFile: ITranslationMessagesFile = this.master.createTranslationFileForLang(lang, languageXliffFilePath, isDefaultLang, this.parameters.useSourceAsTarget());
        return this.autoTranslate(this.master.sourceLanguage(), lang, languageSpecificMessagesFile).pipe(
            map((summary) => {
            // write it to file
            TranslationMessagesFileReader.save(languageSpecificMessagesFile, this.parameters.beautifyOutput());
            this.commandOutput.info('created new file "%s" for target-language="%s"', languageXliffFilePath, lang);
            if (!isDefaultLang) {
                this.commandOutput.warn('please translate file "%s" to target-language="%s"', languageXliffFilePath, lang);
            }
            return null;
        }));
    }

    /**
     * Map the input format to the format of the translation.
     * Normally they are the same but for xmb the translation format is xtb.
     * @param i18nFormat
     */
    private static translationFormat(i18nFormat: string): string {
        if (i18nFormat === FORMAT_XMB) {
            return FORMAT_XTB;
        } else {
            return i18nFormat;
        }
    }

    /**
     * Merge all
     * @param lang
     * @param languageXliffFilePath
     */
    private mergeMasterTo(lang: string, languageXliffFilePath: string): Observable<void> {
        // read lang specific file
        let languageSpecificMessagesFile: ITranslationMessagesFile = TranslationMessagesFileReader.fromFile(XliffMerge.translationFormat(this.parameters.i18nFormat()), languageXliffFilePath, this.parameters.encoding());
        let isDefaultLang: boolean = (lang == this.parameters.defaultLanguage());
        let newCount = 0;
        let correctSourceContentCount = 0;
        let correctSourceRefCount = 0;
        let correctDescriptionOrMeaningCount = 0;
        let idChangedCount = 0;
        languageSpecificMessagesFile.setNewTransUnitTargetPraefix(this.parameters.targetPraefix());
        languageSpecificMessagesFile.setNewTransUnitTargetSuffix(this.parameters.targetSuffix());
        let lastProcessedUnit: ITransUnit = null;
        this.master.forEachTransUnit((masterTransUnit) => {
            let transUnit: ITransUnit = languageSpecificMessagesFile.transUnitWithId(masterTransUnit.id);

            if (!transUnit) {
                // oops, no translation, must be a new key, so add it
                let newUnit;
                if (this.parameters.allowIdChange() && (newUnit = this.processChangedIdUnit(masterTransUnit, languageSpecificMessagesFile, lastProcessedUnit))) {
                    lastProcessedUnit = newUnit;
                    idChangedCount++;
                } else {
                    lastProcessedUnit = languageSpecificMessagesFile.importNewTransUnit(masterTransUnit, isDefaultLang, this.parameters.useSourceAsTarget(), lastProcessedUnit);
                    newCount++;
                }
            } else {
                // check for changed source content and change it if needed
                // (can only happen if ID is explicitely set, otherwise ID would change if source content is changed.
                if (transUnit.supportsSetSourceContent() && masterTransUnit.sourceContent() !== transUnit.sourceContent()) {
                    transUnit.setSourceContent(masterTransUnit.sourceContent());
                    if (isDefaultLang) {
                        // #81 changed source must be copied to target for default lang
                        transUnit.translate(masterTransUnit.sourceContent());
                        transUnit.setTargetState(STATE_FINAL);
                    } else {
                        if (transUnit.targetState() == STATE_FINAL) {
                            // source is changed, so translation has to be checked again
                            transUnit.setTargetState(STATE_TRANSLATED);
                        }
                    }
                    correctSourceContentCount++;
                }
                // check for missing or changed source ref and add it if needed
                if (transUnit.supportsSetSourceReferences() && !this.areSourceReferencesEqual(masterTransUnit.sourceReferences(), transUnit.sourceReferences())) {
                    transUnit.setSourceReferences(masterTransUnit.sourceReferences());
                    correctSourceRefCount++;
                }
                // check for changed description or meaning
                if (transUnit.supportsSetDescriptionAndMeaning()) {
                    let changed = false;
                    if (transUnit.description() !== masterTransUnit.description()) {
                        transUnit.setDescription(masterTransUnit.description());
                        changed = true;
                    }
                    if (transUnit.meaning() !== masterTransUnit.meaning()) {
                        transUnit.setMeaning(masterTransUnit.meaning());
                        changed = true;
                    }
                    if (changed) {
                        correctDescriptionOrMeaningCount++;
                    }
                }
                lastProcessedUnit = transUnit;
            }
        });
        if (newCount > 0) {
            this.commandOutput.warn('merged %s trans-units from master to "%s"', newCount, lang);
        }
        if (correctSourceContentCount > 0) {
            this.commandOutput.warn('transferred %s changed source content from master to "%s"', correctSourceContentCount, lang);
        }
        if (correctSourceRefCount > 0) {
            this.commandOutput.warn('transferred %s source references from master to "%s"', correctSourceRefCount, lang);
        }
        if(idChangedCount > 0) {
            this.commandOutput.warn('found %s changed id\'s in "%s"', idChangedCount, lang);
        }
        if (correctDescriptionOrMeaningCount > 0) {
            this.commandOutput.warn('transferred %s changed descriptions/meanings from master to "%s"', correctDescriptionOrMeaningCount, lang);
        }

        // remove all elements that are no longer used
        let removeCount = 0;
        languageSpecificMessagesFile.forEachTransUnit((transUnit: ITransUnit) => {
            let existsInMaster = !isNullOrUndefined(this.master.transUnitWithId(transUnit.id));
            if (!existsInMaster) {
                if (this.parameters.removeUnusedIds()) {
                    languageSpecificMessagesFile.removeTransUnitWithId(transUnit.id);
                }
                removeCount++;
            }
        });
        if (removeCount > 0) {
            if (this.parameters.removeUnusedIds()) {
                this.commandOutput.warn('removed %s unused trans-units in "%s"', removeCount, lang);
            } else {
                this.commandOutput.warn('keeping %s unused trans-units in "%s", because removeUnused is disabled', removeCount, lang);
            }
        }

        if (newCount == 0 && removeCount == 0 && correctSourceContentCount == 0 && correctSourceRefCount == 0 && correctDescriptionOrMeaningCount == 0) {
            this.commandOutput.info('file for "%s" was up to date', lang);
            return of(null);
        } else {
            return this.autoTranslate(this.master.sourceLanguage(), lang, languageSpecificMessagesFile)
                .pipe(map(() => {
                    // write it to file
                    TranslationMessagesFileReader.save(languageSpecificMessagesFile, this.parameters.beautifyOutput());
                    this.commandOutput.info('updated file "%s" for target-language="%s"', languageXliffFilePath, lang);
                    if (newCount > 0 && !isDefaultLang) {
                        this.commandOutput.warn('please translate file "%s" to target-language="%s"', languageXliffFilePath, lang);
                    }
                    return null;
                }));
        }
    }

    /**
     * Handle the case of changed id due to small white space changes.
     * @param {ITransUnit} masterTransUnit unit in master file
     * @param {ITranslationMessagesFile} languageSpecificMessagesFile translation file
     * @param lastProcessedUnit Unit before the one processed here. New unit will be inserted after this one.
     * @return {ITransUnit} processed unit, if done, null if no changed unit found
     */
    private processChangedIdUnit(masterTransUnit: ITransUnit, languageSpecificMessagesFile: ITranslationMessagesFile, lastProcessedUnit: ITransUnit): ITransUnit {
        const masterSourceString = masterTransUnit.sourceContentNormalized().asDisplayString(NORMALIZATION_FORMAT_DEFAULT).trim();
        let changedTransUnit: ITransUnit = null;
        languageSpecificMessagesFile.forEachTransUnit((languageTransUnit) => {
                if(languageTransUnit.sourceContentNormalized().asDisplayString(NORMALIZATION_FORMAT_DEFAULT).trim() === masterSourceString) {
                    changedTransUnit = languageTransUnit;
                }
        });
        if (!changedTransUnit) {
            return null;
        }
        const mergedTransUnit = languageSpecificMessagesFile.importNewTransUnit(masterTransUnit, false, false, lastProcessedUnit);
        const translatedContent = changedTransUnit.targetContent();
        if (translatedContent) { // issue #68 set translated only, if it is really translated
            mergedTransUnit.translate(translatedContent);
            mergedTransUnit.setTargetState(STATE_TRANSLATED);
        }
        return mergedTransUnit;
    }

    private areSourceReferencesEqual(ref1: {sourcefile: string; linenumber: number;}[], ref2: {sourcefile: string; linenumber: number;}[]): boolean {
        if ((isNullOrUndefined(ref1) && !isNullOrUndefined(ref2)) || (isNullOrUndefined(ref2) && !isNullOrUndefined(ref1))) {
            return false;
        }
        if (isNullOrUndefined(ref1) && isNullOrUndefined(ref2)) {
            return true;
        }
        // bot refs are set now, convert to set to compare them
        let set1: Set<string> = new Set<string>();
        ref1.forEach((ref) => {set1.add(ref.sourcefile + ':' + ref.linenumber)});
        let set2: Set<string> = new Set<string>();
        ref2.forEach((ref) => {set2.add(ref.sourcefile + ':' + ref.linenumber)});
        if (set1.size !== set2.size) {
            return false;
        }
        let match = true;
        set2.forEach((ref) => {
            if (!set1.has(ref)) {
                match = false;
            }
        });
        return match;
    }

    /**
     * Auto translate file via Google Translate.
     * Will translate all new units in file.
     * @param from
     * @param to
     * @param languageSpecificMessagesFile
     * @return a promise with the execution result as a summary report.
     */
    private autoTranslate(from: string, to: string, languageSpecificMessagesFile: ITranslationMessagesFile): Observable<AutoTranslateSummaryReport> {
        let serviceCall: Observable<AutoTranslateSummaryReport>;
        let autotranslateEnabled: boolean = this.parameters.autotranslateLanguage(to);
        if (autotranslateEnabled) {
            serviceCall = this.autoTranslateService.autoTranslate(from, to, languageSpecificMessagesFile);
        } else {
            serviceCall = of(new AutoTranslateSummaryReport(from, to));
        }
        return serviceCall.pipe(map((summary) => {
            if (autotranslateEnabled) {
                if (summary.error() || summary.failed() > 0) {
                    this.commandOutput.error(summary.content());
                } else {
                    this.commandOutput.warn(summary.content());
                }
            }
            return summary;
        }));
    }

}
