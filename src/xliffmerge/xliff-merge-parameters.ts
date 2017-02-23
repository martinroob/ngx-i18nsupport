/**
 * Created by martin on 17.02.2017.
 * Collection of all parameters used by the tool.
 * The parameters are read form the profile or defaults are used.
 */

import fs = require("fs");
import {XliffMergeError} from './xliff-merge-error';
import {Stats} from 'fs';
import {CommandOutput} from '../common/command-output';
import {isNullOrUndefined} from 'util';
import {ProgramOptions, IConfigFile} from './xliff-merge';

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
     * @param profilePath
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
        let profileContent: IConfigFile = JSON.parse(content);
        return profileContent;
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
            if (profile.encoding) {
                this._encoding = profile.encoding;
            }
            if (profile.removeUnusedIds) {
                this._removeUnusedIds = profile.removeUnusedIds;
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
     }

    /**
     * Check syntax of language.
     * Must be compatible with XML Schema type xsd:language.
     * Pattern: [a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*
     * @param lang
     */
    private checkLanguageSyntax(lang: string) {
        let pattern = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;
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
        return this.srcDir() + '/' + (this._i18nFile ? this._i18nFile : 'messages.xlf');
    }

    /**
     * evtl zu generierendes I18n-File mit den Übersetzungen für eine Sprache.
     * @param lang
     * @return {string}
     */
    public generatedI18nFile(lang: string): string {
        return this.genDir() + '/' + 'messages.' + lang + '.xlf';
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
}