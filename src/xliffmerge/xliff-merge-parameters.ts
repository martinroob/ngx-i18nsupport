/**
 * Created by martin on 17.02.2017.
 * Collection of all parameters used by the tool.
 * The parameters are read form the profile or defaults are used.
 */

import fs = require("fs");
import {XliffMergeError} from './xliff-merge-error';
import {Stats} from 'fs';
import {Logger, LogLevel} from '../common/logger';
import {isNullOrUndefined} from 'util';

/**
 * Definition of the possible values used in the config file
 */
interface IConfigFile {
    // content is wrapped in "xliffmergeOptions" to allow to use it embedded in another config file (e.g. tsconfig.json)
    xliffmergeOptions?: IXliffMergeOptions;
}

interface IXliffMergeOptions {
    verbose?: boolean;   // Flag to generate debug output messages
    defaultLanguage?: string;    // the default language (the language, which is used in the original templates)
    srcDir?: string;    // Directory, where the master file is
    i18nFile?: string;  // master file, if not absolute, it is relative to srcDir
    i18nFormat?: string; // xlf (unused in the moment)
    encoding?: string;  // encoding to write xml
    genDir?: string;    // directory, where the files are written to
    angularCompilerOptions?: {
        genDir?: string;    // same as genDir, just to be compatible with ng-xi18n
    };
    removeUnusedIds?: boolean;
}

export class XliffMergeParameters {

    private _verbose: boolean;
    private _defaultLanguage: string;
    private _srcDir: string;
    private _i18nFile: string;
    private _i18nFormat: string;
    private _encoding: string;
    private _genDir: string;
    private _languages: string[];
    private _removeUnusedIds: boolean;

    constructor(languages: string[], profilePath: string, verbose: boolean) {
        this._verbose = verbose;
        this.readFromProfile(profilePath);
        // if languages are given as parameters, they ovveride everything said in profile
        if (!!languages && languages.length > 0) {
            this._languages = languages;
            if (!this._defaultLanguage) {
                this._defaultLanguage = this._languages[0];
            }
        }
        if (this.verbose()) {
            this.showAllParameters();
        }
        this.checkParameters();
    }

    private readFromProfile(profilePath: string) {
        if (!profilePath) {
            return;
        }
        let content:string;
        try {
            content = fs.readFileSync(profilePath, 'UTF-8');
        } catch (err) {
            console.log('error');
            throw new XliffMergeError('could not read profile ' + profilePath);
        }
        // TODO error handling
        let profileContent: IConfigFile = JSON.parse(content);
        let profile = profileContent.xliffmergeOptions;
        if (profile) {
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
            Logger.log(LogLevel.WARN, 'did not find "xliffmergeOptions" in profile, using defaults');
        }
    }

    /**
     * Check all Parameters, wether they are complete and consistent.
     * @throws an exception, if something is wrong with the parameters.
     */
    private checkParameters(): void {
        this.checkLanguageSyntax(this.defaultLanguage());
        if (this.languages().length == 0) {
            throw new XliffMergeError('no languages specified');
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
            throw new XliffMergeError('srcDir "' + this.srcDir() + '" is not a directory');
        }
        // genDir should exists
        try {
            stats = fs.statSync(this.genDir());
        } catch (e) {
            err = e;
        }
        if (!!err || !stats.isDirectory()) {
            throw new XliffMergeError('genDir "' + this.genDir() + '" is not a directory');
        }
        // master file MUST exist
        try {
            fs.accessSync(this.i18nFile(), fs.constants.R_OK);
        } catch (err) {
            throw new XliffMergeError('i18nFile "' + this.i18nFile() + '" is not readable');
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
            throw new XliffMergeError('language "' + lang + '" is not valid');
        }
    }

    public verbose(): boolean {
        return this._verbose;
    }

    /**
     * Debug output all parameters to console.
     */
    private showAllParameters(): void {
        console.log('xliffmerge Used Parameters');
        console.log('defaultLanguage:\t', this.defaultLanguage());
        console.log('srcDir:\t', this.srcDir());
        console.log('genDir:\t', this.genDir());
        console.log('i18nFile:\t', this.i18nFile());
        console.log('languages:\t', this.languages());
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
        return this._i18nFile ? this._i18nFile : this.srcDir() + '/' + 'messages.xlf';
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