/**
 * Created by martin on 17.02.2017.
 * Collection of all parameters used by the tool.
 * The parameters are read form the profile or defaults are used.
 */

import * as fs from "fs";
import {XliffMergeError} from './xliff-merge-error';
import {Stats} from 'fs';
import {CommandOutput} from '../common/command-output';
import {format, isArray, isNullOrUndefined} from 'util';
import {ProgramOptions, IConfigFile} from './i-xliff-merge-options';
import {FileUtil} from '../common/file-util';
import {NgxTranslateExtractor} from './ngx-translate-extractor';

const PROFILE_CANDIDATES = ['package.json', '.angular-cli.json'];

export class XliffMergeParameters {

    private usedProfilePath: string;
    private _quiet: boolean;
    private _verbose: boolean;
    private _allowIdChange: boolean;
    private _defaultLanguage: string;
    private _srcDir: string;
    private _i18nBaseFile: string;
    private _i18nFile: string;
    private _i18nFormat: string;
    private _encoding: string;
    private _genDir: string;
    private _languages: string[];
    private _removeUnusedIds: boolean;
    private _supportNgxTranslate: boolean;
    private _ngxTranslateExtractionPattern: string;
    private _useSourceAsTarget: boolean;
    private _targetPraefix: string;
    private _targetSuffix: string;
    private _beautifyOutput: boolean;
    private _autotranslate: boolean|string[];
    private _apikey: string;
    private _apikeyfile: string;

    public errorsFound: XliffMergeError[];
    public warningsFound: string[];

    /**
     * Create Parameters.
     * @param options command options
     * @param profileContent given profile (if not, it is read from the profile path from options).
     * @return {XliffMergeParameters}
     */
    public static createFromOptions(options: ProgramOptions, profileContent?: IConfigFile) {
        let parameters = new XliffMergeParameters();
        parameters.configure(options, profileContent);
        return parameters;
    }

    private constructor() {
        this.errorsFound = [];
        this.warningsFound = [];
    }

    /**
     * Initialize me from the profile content.
     * (public only for test usage).
     * @param options
     * @param profileContent if null, read it from profile.
     */
    private configure(options: ProgramOptions, profileContent?: IConfigFile) {
        this.errorsFound = [];
        this.warningsFound = [];
        if (!profileContent) {
            profileContent = this.readProfile(options);
        }
        let validProfile: boolean = (!!profileContent);
        if (options.quiet) {
            this._quiet = options.quiet;
        }
        if (options.verbose) {
            this._verbose = options.verbose;
        }
        if (validProfile) {
            this.initializeFromConfig(profileContent);
            // if languages are given as parameters, they ovveride everything said in profile
            if (!!options.languages && options.languages.length > 0) {
                this._languages = options.languages;
                if (!this._defaultLanguage) {
                    this._defaultLanguage = this._languages[0];
                }
            }
            this.checkParameters();
        }
    }

    /**
     * Read profile.
     * @param options program options
     * @return the read profile (empty, if none, null if errors)
     */
    private readProfile(options: ProgramOptions): IConfigFile {
        let profilePath: string = options.profilePath;
        if (!profilePath) {
            for (let configfilename of PROFILE_CANDIDATES) {
                const profile = XliffMergeParameters.readProfileCandidate(configfilename);
                if (profile) {
                    this.usedProfilePath = configfilename;
                    return profile;
                }
            }
            return {};
        }
        let content:string;
        try {
            content = fs.readFileSync(profilePath, 'UTF-8');
        } catch (err) {
            this.errorsFound.push(new XliffMergeError('could not read profile "' + profilePath + '"'));
            return null;
        }
        this.usedProfilePath = profilePath;
        return JSON.parse(content);
    }

    /**
     * Read potential profile.
     * To be a candidate, file must exist and contain property "xliffmergeOptions".
     * @param {string} profilePath
     * @return {IConfigFile} parsed content of file or null, if file does not exist or is not a profile candidate.
     */
    private static readProfileCandidate(profilePath: string): IConfigFile {
        let content:string;
        try {
            content = fs.readFileSync(profilePath, 'UTF-8');
        } catch (err) {
            return null;
        }
        const parsedContent: IConfigFile = JSON.parse(content);
        if (parsedContent && parsedContent.xliffmergeOptions) {
            return parsedContent;
        } else {
            return null;
        }
    }

    private initializeFromConfig(profileContent: IConfigFile) {
        if (!profileContent) {
            return;
        }
        let profile = profileContent.xliffmergeOptions;
        if (profile) {
            if (!isNullOrUndefined(profile.quiet)) {
                this._quiet = profile.quiet;
            }
            if (!isNullOrUndefined(profile.verbose)) {
                this._verbose = profile.verbose;
            }
            if(!isNullOrUndefined(profile.allowIdChange)) {
                this._allowIdChange = profile.allowIdChange;
            }
            if (profile.defaultLanguage) {
                this._defaultLanguage = profile.defaultLanguage;
            }
            if (profile.languages) {
                this._languages = profile.languages;
            }
            if (profile.srcDir) {
                this._srcDir = profile.srcDir;
            }
            if (profile.angularCompilerOptions) {
                if (profile.angularCompilerOptions.genDir)
                    this._genDir = profile.angularCompilerOptions.genDir;
            }
            if (profile.genDir) {
                // this must be after angularCompilerOptions to be preferred
                this._genDir = profile.genDir;
            }
            if (profile.i18nBaseFile) {
                this._i18nBaseFile = profile.i18nBaseFile;
            }
            if (profile.i18nFile) {
                this._i18nFile = profile.i18nFile;
            }
            if (profile.i18nFormat) {
                this._i18nFormat = profile.i18nFormat;
            }
            if (profile.encoding) {
                this._encoding = profile.encoding;
            }
            if (!isNullOrUndefined(profile.removeUnusedIds)) {
                this._removeUnusedIds = profile.removeUnusedIds;
            }
            if (!isNullOrUndefined(profile.supportNgxTranslate)) {
                this._supportNgxTranslate = profile.supportNgxTranslate;
            }
            if (!isNullOrUndefined(profile.ngxTranslateExtractionPattern)) {
                this._ngxTranslateExtractionPattern = profile.ngxTranslateExtractionPattern;
            }
            if (!isNullOrUndefined(profile.useSourceAsTarget)) {
                this._useSourceAsTarget = profile.useSourceAsTarget;
            }
            if (!isNullOrUndefined(profile.targetPraefix)) {
                this._targetPraefix = profile.targetPraefix;
            }
            if (!isNullOrUndefined(profile.targetSuffix)) {
                this._targetSuffix = profile.targetSuffix;
            }
            if (!isNullOrUndefined(profile.autotranslate)) {
                this._autotranslate = profile.autotranslate;
            }
            if (!isNullOrUndefined(profile.beautifyOutput)) {
                this._beautifyOutput = profile.beautifyOutput;
            }
            if (!isNullOrUndefined(profile.apikey)) {
                this._apikey = profile.apikey;
            }
            if (!isNullOrUndefined(profile.apikeyfile)) {
                this._apikeyfile = profile.apikeyfile;
            }
        } else {
            this.warningsFound.push('did not find "xliffmergeOptions" in profile, using defaults');
        }
    }

    /**
     * Check all Parameters, wether they are complete and consistent.
     * if something is wrong with the parameters, it is collected in errorsFound.
     */
    private checkParameters(): void {
        this.checkLanguageSyntax(this.defaultLanguage());
        if (this.languages().length == 0) {
            this.errorsFound.push(new XliffMergeError('no languages specified'));
        }
        this.languages().forEach((lang) => {
            this.checkLanguageSyntax(lang);
        });
        let stats: Stats;
        let err: any;
        // srcDir should exists
        try {
            stats = fs.statSync(this.srcDir());
        } catch (e) {
            err = e;
        }
        if (!!err || !stats.isDirectory()) {
            this.errorsFound.push(new XliffMergeError('srcDir "' + this.srcDir() + '" is not a directory'));
        }
        // genDir should exists
        try {
            stats = fs.statSync(this.genDir());
        } catch (e) {
            err = e;
        }
        if (!!err || !stats.isDirectory()) {
            this.errorsFound.push(new XliffMergeError('genDir "' + this.genDir() + '" is not a directory'));
        }
        // master file MUST exist
        try {
            fs.accessSync(this.i18nFile(), fs.constants.R_OK);
        } catch (err) {
            this.errorsFound.push(new XliffMergeError('i18nFile "' + this.i18nFile() + '" is not readable'));
        }
        // i18nFormat must be xlf xlf2 or xmb
        if (!(this.i18nFormat() === 'xlf' || this.i18nFormat() === 'xlf2' || this.i18nFormat() === 'xmb')) {
            this.errorsFound.push(new XliffMergeError('i18nFormat "' + this.i18nFormat() + '" invalid, must be "xlf" or "xlf2" or "xmb"'));
        }
        // autotranslate requires api key
        if (this.autotranslate() && !this.apikey()) {
            this.errorsFound.push(new XliffMergeError('autotranslate requires an API key, please set one'));
        }
        // autotranslated languages must be in list of all languages
        this.autotranslatedLanguages().forEach((lang) => {
            if (this.languages().indexOf(lang) < 0) {
                this.errorsFound.push(new XliffMergeError('autotranslate language "' + lang + '" is not in list of languages'));
            }
            if (lang === this.defaultLanguage()) {
                this.errorsFound.push(new XliffMergeError('autotranslate language "' + lang + '" cannot be translated, because it is the source language'));
            }
        });
        // ngx translate pattern check
        if (this.supportNgxTranslate()) {
            const checkResult = NgxTranslateExtractor.checkPattern(this.ngxTranslateExtractionPattern());
            if (!isNullOrUndefined(checkResult)) {
                this.errorsFound.push(new XliffMergeError('ngxTranslateExtractionPattern "' + this.ngxTranslateExtractionPattern() + '": ' + checkResult));
            }
        }
        // targetPraefix and targetSuffix check
        if (!this.useSourceAsTarget()) {
            if (this.targetPraefix().length > 0) {
                this.warningsFound.push('configured targetPraefix "' + this.targetPraefix() + '" will not be used because "useSourceAsTarget" is disabled"');
            }
            if (this.targetSuffix().length > 0) {
                this.warningsFound.push('configured targetSuffix "' + this.targetSuffix() + '" will not be used because "useSourceAsTarget" is disabled"');
            }
        }
     }

    /**
     * Check syntax of language.
     * Must be compatible with XML Schema type xsd:language.
     * Pattern: [a-zA-Z]{1,8}((-|_)[a-zA-Z0-9]{1,8})*
     * @param lang
     */
    private checkLanguageSyntax(lang: string) {
        let pattern = /^[a-zA-Z]{1,8}([-_][a-zA-Z0-9]{1,8})*$/;
        if (!pattern.test(lang)) {
            this.errorsFound.push(new XliffMergeError('language "' + lang + '" is not valid'));
        }
    }

    public allowIdChange(): boolean {
        return (isNullOrUndefined(this._allowIdChange)) ? false : this._allowIdChange;
    }

    public verbose(): boolean {
        return (isNullOrUndefined(this._verbose)) ? false : this._verbose;
    }

    public quiet(): boolean {
        return (isNullOrUndefined(this._quiet)) ? false : this._quiet;
    }

    /**
     * Debug output all parameters to commandOutput.
     */
    public showAllParameters(commandOutput: CommandOutput): void {
        commandOutput.debug('xliffmerge Used Parameters:');
        commandOutput.debug('usedProfilePath:\t"%s")', this.usedProfilePath);
        commandOutput.debug('defaultLanguage:\t"%s"', this.defaultLanguage());
        commandOutput.debug('srcDir:\t"%s"', this.srcDir());
        commandOutput.debug('genDir:\t"%s"', this.genDir());
        commandOutput.debug('i18nBaseFile:\t"%s"', this.i18nBaseFile());
        commandOutput.debug('i18nFile:\t"%s"', this.i18nFile());
        commandOutput.debug('languages:\t%s', this.languages());
        for (let language of this.languages()) {
            commandOutput.debug('outputFile[%s]:\t%s', language, this.generatedI18nFile(language));
        }
        commandOutput.debug('removeUnusedIds:\t%s', this.removeUnusedIds());
        commandOutput.debug('supportNgxTranslate:\t%s', this.supportNgxTranslate());
        if (this.supportNgxTranslate()) {
            commandOutput.debug('ngxTranslateExtractionPattern:\t%s', this.ngxTranslateExtractionPattern());
        }
        commandOutput.debug('useSourceAsTarget:\t%s', this.useSourceAsTarget());
        if (this.useSourceAsTarget()) {
            commandOutput.debug('targetPraefix:\t"%s"', this.targetPraefix());
            commandOutput.debug('targetSuffix:\t"%s"', this.targetSuffix());
        }
        commandOutput.debug('allowIdChange:\t%s', this.allowIdChange());
        commandOutput.debug('beautifyOutput:\t%s', this.beautifyOutput());
        commandOutput.debug('autotranslate:\t%s', this.autotranslate());
        if (this.autotranslate()) {
            commandOutput.debug('autotranslated languages:\t%s', this.autotranslatedLanguages());
            commandOutput.debug('apikey:\t%s', this.apikey() ? '****' : 'NOT SET');
            commandOutput.debug('apikeyfile:\t%s', this.apikeyfile());
        }
    }

    /**
     * Default-Language, default en.
     * @return {string}
     */
    public defaultLanguage(): string {
        return this._defaultLanguage ? this._defaultLanguage : 'en';
    }

    /**
     * Liste der zu bearbeitenden Sprachen.
     * @return {string[]}
     */
    public languages(): string[] {
        return this._languages ? this._languages : [];
    }

    /**
     * src directory, where the master xlif is located.
     * @return {string}
     */
    public srcDir(): string {
        return this._srcDir ? this._srcDir : '.';
    }

    /**
     * The base file name of the xlif file for input and output.
     * Default is messages
     * @return {string}
     */
    public i18nBaseFile(): string {
        return this._i18nBaseFile ? this._i18nBaseFile : 'messages';
    }

    /**
     * The master xlif file (the one generated by ng-xi18n).
     * Default is <srcDir>/<i18nBaseFile>.xlf.
     * @return {string}
     */
    public i18nFile(): string {
        return this.srcDir() + '/' + (
            this._i18nFile ? this._i18nFile : this.i18nBaseFile() + '.' + this.i18nFormat()
        );
    }

    /**
     * Format of the master xlif file.
     * Default is "xlf", possible are "xlf" or "xlf2" or "xmb".
     * @return {string}
     */
    public i18nFormat(): string {
        return (this._i18nFormat ? this._i18nFormat : 'xlf');
    }

    /**
     * potentially to be generated I18n-File with the translations for one language.
     * @param lang language shortcut
     * @return {string} Path of file
     */
    public generatedI18nFile(lang: string): string {
        return this.genDir() + '/' + this.i18nBaseFile() + '.' + lang + '.' + this.suffixForGeneratedI18nFile();
    }

    private suffixForGeneratedI18nFile(): string {
        switch (this.i18nFormat()) {
            case 'xlf':
                return 'xlf';
            case 'xlf2':
                return 'xlf';
            case 'xmb':
                return 'xtb';
        }
    }

    /**
     * potentially to be generated translate-File for ngx-translate with the translations for one language.
     * @param lang language shortcut
     * @return {string} Path of file
     */
    public generatedNgxTranslateFile(lang: string): string {
        return this.genDir() + '/' + this.i18nBaseFile() + '.' + lang + '.' + 'json';
    }

    /**
     * The encoding used to write new XLIFF-files.
     * @return {string}
     */
    public encoding(): string {
        return this._encoding ? this._encoding : 'UTF-8';
    }

     /**
      * Output-Directory, where the output is written to.
      * Default is <srcDir>.
     */
    public genDir(): string {
        return this._genDir ? this._genDir : this.srcDir();
    }

    public removeUnusedIds(): boolean {
        return (isNullOrUndefined(this._removeUnusedIds)) ? true : this._removeUnusedIds;
    }

    public supportNgxTranslate(): boolean {
        return (isNullOrUndefined(this._supportNgxTranslate)) ? false : this._supportNgxTranslate;
    }

    public ngxTranslateExtractionPattern(): string {
        return (isNullOrUndefined(this._ngxTranslateExtractionPattern)) ? NgxTranslateExtractor.DefaultExtractionPattern : this._ngxTranslateExtractionPattern;
    }

    /**
     * Whether source must be used as target for new trans-units
     * Default is true
     */
    public useSourceAsTarget(): boolean {
        return (isNullOrUndefined(this._useSourceAsTarget)) ? true : this._useSourceAsTarget;
    }

    /**
     * Praefix used for target when copying new trans-units
     * Default is ""
     */
    public targetPraefix(): string {
        return (isNullOrUndefined(this._targetPraefix)) ? "" : this._targetPraefix;
    }

    /**
     * Suffix used for target when copying new trans-units
     * Default is ""
     */
    public targetSuffix(): string {
        return (isNullOrUndefined(this._targetSuffix)) ? "" : this._targetSuffix;
    }

    /**
     * If set, run xml result through beautifier (pretty-data).
     * @return {boolean}
     */
    public beautifyOutput(): boolean {
        return (isNullOrUndefined(this._beautifyOutput)) ? false : this._beautifyOutput;
    }

    /**
     * Whether to use autotranslate for new trans-units
     * Default is false
     */
    public autotranslate(): boolean {
        if (isNullOrUndefined(this._autotranslate)) {
            return false;
        }
        if (isArray(this._autotranslate)) {
            return (<string[]>this._autotranslate).length > 0;
        }
        return <boolean> this._autotranslate;
    }

    /**
     * Whether to use autotranslate for a given language.
     * @param lang language code.
     */
    public autotranslateLanguage(lang: string): boolean {
        return this.autotranslatedLanguages().indexOf(lang) >= 0;
    }

    /**
     * Return a list of languages to be autotranslated.
     */
    public autotranslatedLanguages(): string[] {
        if (isNullOrUndefined(this._autotranslate) || this._autotranslate === false) {
            return [];
        }
        if (isArray(this._autotranslate)) {
            return (<string[]>this._autotranslate);
        }
        return this.languages().slice(1); // first is source language
    }

    /**
     * API key to be used for Google Translate
     * @return {string}
     */
    public apikey(): string {
        if (!isNullOrUndefined(this._apikey)) {
            return this._apikey;
        } else {
            const apikeyPath = this.apikeyfile();
            if (this.apikeyfile()) {
                if (fs.existsSync(apikeyPath)) {
                    return FileUtil.read(apikeyPath, 'utf-8');
                } else {
                    throw new Error(format('api key file not found: API_KEY_FILE=%s', apikeyPath));
                }
            } else {
                return null;
            }
        }
    }

    /**
     * file name for API key to be used for Google Translate.
     * Explicitly set or read from env var API_KEY_FILE.
     * @return {string}
     */
    public apikeyfile(): string {
        if (this._apikeyfile) {
            return this._apikeyfile;
        } else if (process.env.API_KEY_FILE) {
            return process.env.API_KEY_FILE;
        } else {
            return null;
        }
    }
}
