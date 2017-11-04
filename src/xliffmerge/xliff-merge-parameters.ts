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

export class XliffMergeParameters {

    private _quiet: boolean;
    private _verbose: boolean;
    private _defaultLanguage: string;
    private _srcDir: string;
    private _i18nFile: string;
    private _i18nFormat: string;
    private _encoding: string;
    private _genDir: string;
    private _languages: string[];
    private _removeUnusedIds: boolean;
    private _supportNgxTranslate: boolean;
    private _useSourceAsTarget: boolean;
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
            return {};
        }
        let content:string;
        try {
            content = fs.readFileSync(profilePath, 'UTF-8');
        } catch (err) {
            this.errorsFound.push(new XliffMergeError('could not read profile "' + profilePath + '"'));
            return null;
        }
        return JSON.parse(content);
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
            if (!isNullOrUndefined(profile.useSourceAsTarget)) {
                this._useSourceAsTarget = profile.useSourceAsTarget;
            }
            if (!isNullOrUndefined(profile.autotranslate)) {
                this._autotranslate = profile.autotranslate;
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
     }

    /**
     * Check syntax of language.
     * Must be compatible with XML Schema type xsd:language.
     * Pattern: [a-zA-Z]{1,8}((-|_)[a-zA-Z0-9]{1,8})*
     * @param lang
     */
    private checkLanguageSyntax(lang: string) {
        let pattern = /^[a-zA-Z]{1,8}((-|_)[a-zA-Z0-9]{1,8})*$/;
        if (!pattern.test(lang)) {
            this.errorsFound.push(new XliffMergeError('language "' + lang + '" is not valid'));
        }
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
        commandOutput.debug('defaultLanguage:\t"%s"', this.defaultLanguage());
        commandOutput.debug('srcDir:\t"%s"', this.srcDir());
        commandOutput.debug('genDir:\t"%s"', this.genDir());
        commandOutput.debug('i18nFile:\t"%s"', this.i18nFile());
        commandOutput.debug('languages:\t%s', this.languages());
        commandOutput.debug('removeUnusedIds:\t%s', this.removeUnusedIds());
        commandOutput.debug('supportNgxTranslate:\t%s', this.supportNgxTranslate());
        commandOutput.debug('useSourceAsTarget:\t%s', this.useSourceAsTarget());
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
     * The master xlif file (the one generated by ng-xi18n).
     * Default is <srcDir>/messages.xlf.
     * @return {string}
     */
    public i18nFile(): string {
        return this.srcDir() + '/' + (this._i18nFile ? this._i18nFile : 'messages.' + this.i18nFormat());
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
        return this.genDir() + '/' + 'messages.' + lang + '.' + this.suffixForGeneratedI18nFile();
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
        return this.genDir() + '/' + 'messages.' + lang + '.' + 'json';
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

    /**
     * Whether source must be used as target for new trans-units
     * Default is true
     */
    public useSourceAsTarget(): boolean {
        return (isNullOrUndefined(this._useSourceAsTarget)) ? true : this._useSourceAsTarget;
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
