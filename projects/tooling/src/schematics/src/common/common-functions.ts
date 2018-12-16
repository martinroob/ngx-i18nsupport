/**
 * Functions shared between the schematics.
 **/

import {OptionsAfterSetup} from './options-after-setup';

/**
 * Check syntax of language code.
 * (pattern copied from xliffmerge)
 * Must be compatible with XML Schema type xsd:language.
 * Pattern: [a-zA-Z]{1,8}((-|_)[a-zA-Z0-9]{1,8})*
 * @param lang the language code
 * @return true, if valid, false otherwise
 */
export function isValidLanguageSyntax(lang: string): boolean {
    const pattern = /^[a-zA-Z]{1,8}([-_][a-zA-Z0-9]{1,8})*$/;
    return pattern.test(lang);
}

export function fullExtractScript(options: OptionsAfterSetup): string {
    const defaultLanguage = options.i18nLocale;
    const i18nFormat = options.i18nFormat;
    const languagesBlankSeparated = options.languages ? options.languages.replace(/,/g, ' ') : '';
    const languagesCommandLineArgument = (options.useComandlineForLanguages) ? ' ' + languagesBlankSeparated : '';
    const localeDir = options.localePath;
    if (options.useXliffmergeBuilder) {
        return `ng xi18n ${options.project} --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage}\
 && ng run ${options.project}:xliffmerge`;
    } else {
        // old style before builder
        const configFilePath = 'xliffmerge.json';
        return `ng xi18n ${options.project} --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage}\
 && xliffmerge --profile ${configFilePath}${languagesCommandLineArgument}`;
    }
}

/**
 * returns the build configuration to be set.
 */
export function buildConfigurationForLanguage(options: OptionsAfterSetup, language: string): any {
    return {
        aot: true,
        outputPath: `dist/${options.project}-${language}`,
        i18nFile: `${options.genDir}/messages.${language}.xlf`,
        i18nFormat: options.i18nFormat,
        i18nLocale: language
    };
}

/**
 * returns the serve configuration to be set.
 */
export function serveConfigurationForLanguage(options: OptionsAfterSetup, language: string): any {
    return {
        browserTarget: `${options.project}:build:${language}`
    };
}

