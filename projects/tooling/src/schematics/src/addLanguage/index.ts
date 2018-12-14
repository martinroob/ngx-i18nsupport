/**
 * Schematic to add one or more additional languages to a project using @ngx-i18nsupport.
 */

import {branchAndMerge, chain, Rule, SchematicContext, SchematicsException, Tree, noop} from '@angular-devkit/schematics';
import {AddLanguageOptions} from './schema';
import {
    addArchitectBuilderToProject,
    addScriptToPackageJson, commitWorkspaceChanges,
    getScriptFromPackageJson,
    startChangingWorkspace, WorkspaceToChange
} from '../../schematics-core';
import {
    CommonOptions,
    extractScriptName,
    OptionsAfterSetup,
    getActualXliffmergeConfigFromWorkspace,
    setupCommonOptions,
    xliffmergeBuilderName, xliffmergeBuilderSpec
} from '../common';
import {IXliffMergeOptions, IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';
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
Add language configuration of newly added languages.
This adds the new language to the xliffmerge.json config file.
Returns the changed config file content.
 */
function addLanguagesToXliffmergeConfiguration(
    options: OptionsAfterSetup,
    host: Tree,
    context: SchematicContext,
    languagesToAdd: string[]): IConfigFile {

    const xliffmergeConf: {xliffmergeOptions: IXliffMergeOptions}|null = readXliffmergeJson(options, host);
    if (!xliffmergeConf) {
            const msg = 'did not find any configuration information (xliffmerge.conf)';
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
    }
    const foundConfiguration = {
        xliffmergeOptions: xliffmergeConf.xliffmergeOptions
    };
    const newLanguagesArray: string[] = [];
    const languages = foundConfiguration.xliffmergeOptions.languages;
    if (languages) {
        newLanguagesArray.push(...languages);
    }
    newLanguagesArray.push(...languagesToAdd);
    foundConfiguration.xliffmergeOptions.languages = newLanguagesArray;
    context.logger.info('changed xliffmerge.json, added languages');
    return foundConfiguration;
}

function readXliffmergeJson(options: OptionsAfterSetup, host: Tree): {xliffmergeOptions: IXliffMergeOptions}|null {
    const path = `${options.path}/xliffmerge.json`;
    const content = host.read(path);
    if (!content) {
        return null;
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString);
}

/*
Add language configuration of newly added languages.
This adds the new language
- to the builder configuration
- or to the config file mentioned in the builder configuration
depending on what is used.
 */
function addLanguagesToBuilderConfiguration(workspaceToChange: WorkspaceToChange, options: OptionsAfterSetup, languagesToAdd: string[]) {
    const xliffmergeConf: {xliffmergeOptions: IXliffMergeOptions}|null
        = getActualXliffmergeConfigFromWorkspace(workspaceToChange, options.project);
    if (!xliffmergeConf) {
        return (_host: Tree, context: SchematicContext) => {
            const msg = 'did not find any configuration information in xliffmerge builder configuration';
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
        };
    }
    const foundConfiguration = {
        xliffmergeOptions: xliffmergeConf.xliffmergeOptions
    };
    const newLanguagesArray: string[] = [];
    const languages = foundConfiguration.xliffmergeOptions.languages;
    if (languages) {
        newLanguagesArray.push(...languages);
    }
    newLanguagesArray.push(...languagesToAdd);
    foundConfiguration.xliffmergeOptions.languages = newLanguagesArray;
    addArchitectBuilderToProject(workspaceToChange, options.project,
                xliffmergeBuilderName, xliffmergeBuilderSpec, foundConfiguration);
}

function changeXliffmergeJson(options: CommonOptions, host: Tree, xliffmergeJson: IConfigFile): Tree {
    const configPath = options.path ? `/${options.path}/xliffmerge.json` : '/xliffmerge.json';
    if (host.exists(configPath)) {
        host.overwrite(configPath, JSON.stringify(xliffmergeJson, null, 2));
    }
    return host;
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
    let  xliffmergeOptions: {xliffmergeOptions: IXliffMergeOptions}|null;
    const ws = startChangingWorkspace(host, context);
    const optionsFromBuilder = getActualXliffmergeConfigFromWorkspace(ws, options.project);
    if (optionsFromBuilder) {
        options.useXliffmergeBuilder = true;
        if (optionsFromBuilder.profile) {
            options.profileUsedByBuilder = optionsFromBuilder.profile;
        }
        xliffmergeOptions = optionsFromBuilder;
    } else {
        // read xliffmerge.json
        xliffmergeOptions = readXliffmergeJson(options, host);
        if (!xliffmergeOptions) {
            const msg = 'No builder configuration and also no config file "xliffmerge.json" could be found. ' +
                'Please install @ngx-i18nsupport via "ng add @ngx-i18nsupport/tooling" to create it';
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
        }
        options.useXliffmergeBuilder = false;
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
    options.configuredLanguages = xliffmergeOptions.xliffmergeOptions.languages ? xliffmergeOptions.xliffmergeOptions.languages : [];
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
        const changesToDo: Rule[] = [];
        if (!options.useXliffmergeBuilder) {
            changesToDo.push((tree: Tree, context2: SchematicContext) => {
                const changedConfig = addLanguagesToXliffmergeConfiguration(options, tree, context2, languagesToAdd);
                changeXliffmergeJson(options, tree, changedConfig);
            });
        }
        changesToDo.push((tree: Tree, context2: SchematicContext) => {
            const ws: WorkspaceToChange = startChangingWorkspace(tree, context2);
            languagesToAdd
                .forEach(lang => addLanguageConfigurationToProject(ws, options, lang));
            if (options.useXliffmergeBuilder) {
                addLanguagesToBuilderConfiguration(ws, options, languagesToAdd);
            }
            commitWorkspaceChanges(tree, ws);
        });
        const startScriptAdditions = languagesToAdd
            .map(lang => addStartScriptToPackageJson(options, lang));
        return chain([
            branchAndMerge(
                chain([
                    ...changesToDo,
                    changeExtractScriptInPackageJson(options, host),
                    ...startScriptAdditions]
                )
            )
        ])(host, context);
    };
}
