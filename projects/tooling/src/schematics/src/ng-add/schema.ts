/**
 * Options that can be used with ng add @ngx-i18nsupport.
 */
export interface NgAddOptions {
    path: string; // project path, normally $projectRoot, xliffmerge-config.json will be created here
    project: string; // project name
    localePath: string;
    srcDir: string;
    genDir: string;
    'i18n-format': string;
    'i18n-locale': string;
    languages?: string;
    parsedLanguages: string[];
}
