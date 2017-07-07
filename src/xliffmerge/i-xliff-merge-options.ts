/**
 * Created by roobm on 15.03.2017.
 * Interfaces for command line call and config file content.
 */

/**
 * Options that can be passed as program arguments.
 */
export interface ProgramOptions {
    quiet?: boolean;
    verbose?: boolean;
    profilePath?: string;
    languages?: string[];
}

/**
 * Definition of the possible values used in the config file
 */
export interface IConfigFile {
    // content is wrapped in "xliffmergeOptions" to allow to use it embedded in another config file (e.g. tsconfig.json)
    xliffmergeOptions?: IXliffMergeOptions;
}

export interface IXliffMergeOptions {
    quiet?: boolean;   // Flag to only output error messages
    verbose?: boolean;   // Flag to generate debug output messages
    defaultLanguage?: string;    // the default language (the language, which is used in the original templates)
    languages?: string[];   // all languages, if not specified via commandline
    srcDir?: string;    // Directory, where the master file is
    i18nFile?: string;  // master file, if not absolute, it is relative to srcDir
    i18nFormat?: string; // xlf or xmb
    encoding?: string;  // encoding to write xml
    genDir?: string;    // directory, where the files are written to
    angularCompilerOptions?: {
        genDir?: string;    // same as genDir, just to be compatible with ng-xi18n
    };
    removeUnusedIds?: boolean;
    supportNgxTranslate?: boolean;  // Flag, wether output for ngs-translate should be generated
    useSourceAsTarget?: boolean; // Flag, whether source must be used as target for new trans-units
    autotranslate?: boolean|string[]; // enable auto translate via Google Translate
        // if it is an array, list of languages to autotranslate
        // if it is true, autotranslate all languages (except source language of course)
        // if it is false (default) no autotranslate
    apikey?: string;    // API Key for Google Translate, required if autotranslate is enabled
    apikeyfile?: string;    // file name where API Key for Google Translate can be read from
}

