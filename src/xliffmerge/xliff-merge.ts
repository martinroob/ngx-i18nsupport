import * as program from 'commander';
import {CommandOutput} from '../common/command-output';
import {XliffMergeParameters} from "./xliff-merge-parameters";
import {XliffMergeError} from './xliff-merge-error';
import {FileUtil} from '../common/file-util';
import {VERSION} from './version';
import WritableStream = NodeJS.WritableStream;
import {isNullOrUndefined} from 'util';
import {ITranslationMessagesFile, ITransUnit} from 'ngx-i18nsupport-lib';
import {ProgramOptions, IConfigFile} from './i-xliff-merge-options';
import {NgxTranslateExtractor} from './ngx-translate-extractor';
import {TranslationMessagesFileReader} from './translation-messages-file-reader';

/**
 * Created by martin on 17.02.2017.
 * XliffMerge - read xliff or xmb file and put untranslated parts in language specific xliff or xmb files.
 *
 */

export class XliffMerge {

    static main(argv: string[]) {
        let options = XliffMerge.parseArgs(argv);
        let result = new XliffMerge(new CommandOutput(process.stdout), options).run();
        process.exit(result);
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
                console.log('\tquiet verbose defaultLanguage languages srcDir i18nFile i18nFormat encoding genDir removeUnusedIds');
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
    private master: ITranslationMessagesFile; // XliffFile or XmbFile

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

    public run(): number {
        try {
            this.doRun();
            return 0;
        } catch (err) {
            if (err instanceof XliffMergeError) {
                this.commandOutput.error(err.message);
                return -1;
            } else {
                // unhandled
                this.commandOutput.error('oops ' + err);
                throw err;
            }
        }
    }

    /**
     * Ausführen merge-Process.
     */
    private doRun() {
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
            return;
        }
        if (this.parameters.warningsFound.length > 0) {
            for (let warn of this.parameters.warningsFound) {
                this.commandOutput.warn(warn);
            }
        }
        this.readMaster();
        this.parameters.languages().forEach((lang: string) => {
            this.processLanguage(lang);
        });
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

    private readMaster() {
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
            TranslationMessagesFileReader.save(this.master);
            this.commandOutput.warn('changed master source-language="%s" to "%s"', sourceLang, this.parameters.defaultLanguage());
        }
    }

    private processLanguage(lang: string) {
        this.commandOutput.debug('processing language %s', lang);
        let languageXliffFile = this.parameters.generatedI18nFile(lang);
        if (!FileUtil.exists(languageXliffFile)) {
            this.createUntranslatedXliff(lang, languageXliffFile);
        } else {
            this.mergeMasterTo(lang, languageXliffFile);
        }
        if (this.parameters.supportNgxTranslate()) {
            let languageSpecificMessagesFile: ITranslationMessagesFile = TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), languageXliffFile, this.parameters.encoding());
            NgxTranslateExtractor.extract(languageSpecificMessagesFile, this.parameters.generatedNgxTranslateFile(lang));
        }
    }

    /**
     * create a new file for the language, which contains no translations, but all keys.
     * in principle, this is just a copy of the master with target-language set.
     * @param lang
     * @param languageXliffFilePath
     */
    private createUntranslatedXliff(lang: string, languageXliffFilePath: string) {
        // copy master ...
        FileUtil.copy(this.parameters.i18nFile(), languageXliffFilePath);

        // read copy and set target-language
        let languageSpecificMessagesFile: ITranslationMessagesFile = TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), languageXliffFilePath, this.parameters.encoding());
        languageSpecificMessagesFile.setTargetLanguage(lang);

        // copy source to target
        let isDefaultLang: boolean = (lang == this.parameters.defaultLanguage());
        languageSpecificMessagesFile.forEachTransUnit((transUnit: ITransUnit) => {
            languageSpecificMessagesFile.useSourceAsTarget(transUnit, isDefaultLang);
        });
        // write it to file
        TranslationMessagesFileReader.save(languageSpecificMessagesFile);
        this.commandOutput.info('created new file "%s" for target-language="%s"', languageXliffFilePath, lang);
        if (!isDefaultLang) {
            this.commandOutput.warn('please translate file "%s" to target-language="%s"', languageXliffFilePath, lang);
        }
    }

    /**
     * Merge all
     * @param lang
     * @param languageXliffFilePath
     */
    private mergeMasterTo(lang: string, languageXliffFilePath: string) {
        // read lang specific file
        let languageSpecificMessagesFile: ITranslationMessagesFile = TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), languageXliffFilePath, this.parameters.encoding());

        let isDefaultLang: boolean = (lang == this.parameters.defaultLanguage());
        let newCount = 0;
        this.master.forEachTransUnit((masterTransUnit) => {
            let transUnit: ITransUnit = languageSpecificMessagesFile.transUnitWithId(masterTransUnit.id);
            if (!transUnit) {
                // oops, no translation, must be a new key, so add it
                languageSpecificMessagesFile.useSourceAsTarget(masterTransUnit, isDefaultLang);
                languageSpecificMessagesFile.addNewTransUnit(masterTransUnit);
                newCount++;
            }
        });
        if (newCount > 0) {
            this.commandOutput.warn('merged %s trans-units from master to "%s"', newCount, lang);
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

        if (newCount == 0 && removeCount == 0) {
            this.commandOutput.info('file for "%s" was up to date', lang);
        } else {
            // write it to file
            TranslationMessagesFileReader.save(languageSpecificMessagesFile);
            this.commandOutput.info('updated file "%s" for target-language="%s"', languageXliffFilePath, lang);
            if (newCount > 0 && !isDefaultLang) {
                this.commandOutput.warn('please translate file "%s" to target-language="%s"', languageXliffFilePath, lang);
            }

        }
    }

}