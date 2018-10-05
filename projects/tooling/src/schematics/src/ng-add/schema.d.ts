/**
 * Options that can be used with ng add @ngx-i18nsupport.
 */
export interface NgAddOptions {
    path: string;
    project: string;
    localePath: string;
    srcDir: string;
    genDir: string;
    'i18n-format': string;
    'i18n-locale': string;
    languages?: string;
    parsedLanguages: string[];
}
