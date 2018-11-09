/**
 * Schematic to add one or more additional languages to a project using @ngx-i18nsupport.
 */

import {branchAndMerge, chain, Rule, SchematicContext, SchematicsException, Tree, noop} from '@angular-devkit/schematics';
import {AddLanguageOptions} from './schema';
import {addScriptToPackageJson, getScriptFromPackageJson} from '../../schematics-core';
import {CommonOptions, extractScriptName, OptionsAfterSetup, setupCommonOptions} from '../common';
import {IXliffMergeOptions} from '@ngx-i18nsupport/ngx-i18nsupport/src/xliffmerge/i-xliff-merge-options';
import {
    addLanguageConfigurationToProject,
    addStartScriptToPackageJson, defaultI18nFormat, defaultI18nLocale,
    fullExtractScript,
    isValidLanguageSyntax
} from '../common';

/*
return rule to change extract script "extract-i18n" to contain newly added languages.
 */
function changeExtractScriptInPackageJson(options: OptionsAfterSetup, host: Tree): Rule {
    // check wether it is changed
    const existingScript = getScriptFromPackageJson(host, extractScriptName);
    const changedScript = fullExtractScript(options);
    if (existingScript !== changedScript) {
        return (_host: Tree, context: SchematicContext) => {
            addScriptToPackageJson(
                _host,
                extractScriptName,
                fullExtractScript(options)
            );
            context.logger.info(`changed npm script to extract i18n message, run "npm run ${extractScriptName}" for extraction`);
            return _host;
        };
    } else {
        return noop();
    }
}

/*
return rule to add language configuration of newly added languages.
 */
function addLanguagesToXliffmergeConfiguration(options: OptionsAfterSetup, host: Tree, languagesToAdd: string[]): Rule {
    const xliffmergeJson: {xliffmergeOptions: IXliffMergeOptions}|null = readXliffmergeJson(options, host);
    if (xliffmergeJson) {
        const newLanguagesArray: string[] = [];
        const languages = xliffmergeJson.xliffmergeOptions.languages;
        if (languages) {
            newLanguagesArray.push(...languages);
        }
        for (const lang of languagesToAdd) {
            if (newLanguagesArray.indexOf(lang) < 0) {
                newLanguagesArray.push(lang);
            }
        }
        xliffmergeJson.xliffmergeOptions.languages = newLanguagesArray;
        return (_host: Tree, context: SchematicContext) => {
            changeXliffmergeJson(
                options, _host, xliffmergeJson
            );
            context.logger.info('changed xliffmerge.json, added languages');
            return _host;
        };
    } else {
        return (_host: Tree, context: SchematicContext) => {
            const msg = 'did not find xliffmerge.conf';
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
        };
    }
}

function readXliffmergeJson(options: CommonOptions, host: Tree): {xliffmergeOptions: IXliffMergeOptions} | null {
    const path = options.path ? `/${options.path}/xliffmerge.json` : '/xliffmerge.json';
    const content = host.read(path);
    if (!content) {
        return null;
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString) as {xliffmergeOptions: IXliffMergeOptions};
}

function changeXliffmergeJson(options: CommonOptions, host: Tree, xliffmergeJson: {xliffmergeOptions: IXliffMergeOptions}): Tree {
    const configPath = options.path ? `/${options.path}/xliffmerge.json` : '/xliffmerge.json';
    if (host.exists(configPath)) {
        host.overwrite(configPath, JSON.stringify(xliffmergeJson, null, 2));
    }
    return host;
}

function findConfiguredLanguages(options: CommonOptions, host: Tree): string[] {
    const result: string[] = [];
    // we get it from xliffmerge configuration
    const xliffmergeJson: {xliffmergeOptions: IXliffMergeOptions}|null = readXliffmergeJson(options, host);
    if (xliffmergeJson) {
        const languages = xliffmergeJson.xliffmergeOptions.languages;
        if (languages) {
            result.push(...languages);
        }
    }
    return result;
}

/**
 * Sets all options given by commandline or defaults.
 * It also checks values for correctness.
 * @param optionsFromCommandline command line options.
 * @param host the tree to lookup some workspace settings.
 * @param context use for error logging.
 * @return an object where all relevant values are set.
 */
function setupOptions(optionsFromCommandline: AddLanguageOptions, host: Tree, context: SchematicContext): OptionsAfterSetup {
    const options: OptionsAfterSetup = setupCommonOptions(optionsFromCommandline, host, context);
    // read xliffmerge.json
    const xliffmergeOptions: {xliffmergeOptions: IXliffMergeOptions}|null = readXliffmergeJson(options, host);
    if (!xliffmergeOptions) {
        const msg = 'Config file "xliffmerge.json" not found. ' +
            'Please install @ngx-i18nsupport via "ng add @ngx-i18nsupport/tooling" to create it';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (xliffmergeOptions.xliffmergeOptions.i18nFormat) {
        options.i18nFormat = xliffmergeOptions.xliffmergeOptions.i18nFormat;
    } else {
        options.i18nFormat = defaultI18nFormat;
    }
    if (xliffmergeOptions.xliffmergeOptions.srcDir) {
        options.srcDir = xliffmergeOptions.xliffmergeOptions.srcDir;
    }
    if (xliffmergeOptions.xliffmergeOptions.genDir) {
        options.genDir = xliffmergeOptions.xliffmergeOptions.genDir;
    }
    if (xliffmergeOptions.xliffmergeOptions.defaultLanguage) {
        options.i18nLocale = xliffmergeOptions.xliffmergeOptions.defaultLanguage;
    } else {
        options.i18nLocale = defaultI18nLocale;
    }
    if (optionsFromCommandline.language && optionsFromCommandline.languages) {
        const msg = 'Only language as parameter or --languages can be used, not both.';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (optionsFromCommandline.language) {
        options.parsedLanguages = [optionsFromCommandline.language];
    } else {
        if (!optionsFromCommandline.languages) {
            options.parsedLanguages = [];
        } else {
            options.parsedLanguages = optionsFromCommandline.languages.split(',');
        }
    }
    if (options.parsedLanguages.length === 0) {
        const msg = 'At least 1 language must be specified.';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (options.parsedLanguages.indexOf(options.i18nLocale) >= 0) {
        const msg = `Language "${options.i18nLocale}" is already configured (as default language).`;
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    options.configuredLanguages = findConfiguredLanguages(options, host);
    // check languages
    for (const lang of options.parsedLanguages) {
        if (options.configuredLanguages.indexOf(lang) >= 0) {
            const msg = `Language "${lang}" is already configured.`;
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
        }
    }
    for (const lang of options.parsedLanguages) {
        if (!isValidLanguageSyntax(lang)) {
            const msg = `"${lang}" is not a valid language code.`;
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
        }
    }
    return options;
}

/**
 * The schematic factory addLanguage.
 * @param optionsFromCommandline contains the languages to be added.
 */
export function addLanguage(optionsFromCommandline: AddLanguageOptions): Rule {
    return (host: Tree, context: SchematicContext) => {
        const options: OptionsAfterSetup = setupOptions(optionsFromCommandline, host, context);
        const languagesToAdd = options.parsedLanguages
            .filter(lang => lang !== options.i18nLocale);
        const configurationAdditions = languagesToAdd
            .map(lang => addLanguageConfigurationToProject(options, lang));
        const startScriptAdditions = languagesToAdd
            .map(lang => addStartScriptToPackageJson(options, lang));
        return chain([
            branchAndMerge(
                chain([
                    addLanguagesToXliffmergeConfiguration(options, host, languagesToAdd),
                    changeExtractScriptInPackageJson(options, host),
                    ...configurationAdditions,
                    ...startScriptAdditions]
                )
            )
        ])(host, context);
    };
}
