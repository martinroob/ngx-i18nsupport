/**
 * Functions shared between the schematics.
 **/

import {OptionsAfterSetup} from './options-after-setup';
import {SchematicContext, Tree} from '@angular-devkit/schematics';
import {
    addArchitectBuildConfigurationToProject, addArchitectBuilderToProject,
    addArchitectServeConfigurationToProject,
    addScriptToPackageJson, getProjectByName, WorkspaceToChange
} from '../../schematics-core';
import {xliffmergeBuilderName, xliffmergeBuilderSpec} from './constants';
import {ProjectType, WorkspaceProject} from '../../schematics-core/utility/workspace-models';
import {IXliffMergeOptions} from '@ngx-i18nsupport/ngx-i18nsupport';

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

/**
 * Add a start script.
 * Script will be named 'start-<language>' or 'start-<project>-<language'.
 * @param options options options containing project etc.
 * @param language language to be added.
 */
export function addStartScriptToPackageJson(options: OptionsAfterSetup, language: string) {
    return (host: Tree, context: SchematicContext) => {
        const scriptName = (options.isDefaultProject) ? `start-${language}` : `start-${options.project}-${language}`;
        addScriptToPackageJson(
            host,
            scriptName,
            startScript(options, language)
        );
        context.logger.info(`added npm script to start app for language ${language}, run "npm run ${scriptName}"`);
        return host;
    };
}

/**
 * returns the start script to be added.
 */
function startScript(options: OptionsAfterSetup, language: string): string {
    if (options.isDefaultProject) {
        return `ng serve --configuration=${language}`;
    } else {
        return `ng serve ${options.project} --configuration=${language}`;
    }
}

/**
 * Add the build and serve configuration for a given language to angular.json.
 * @param workspace the workspace to change
 * @param options options containing project etc.
 * @param language the language to be added.
 */
export function addLanguageConfigurationToProject(workspace: WorkspaceToChange,
                                                  options: OptionsAfterSetup,
                                                  language: string) {
        addArchitectBuildConfigurationToProject(
            workspace,
            options.project,
            language,
            buildConfigurationForLanguage(options, language)
        );
        if (workspace.context) {
            workspace.context.logger.info(`added build configuration for language "${language}" to project "${options.project}"`);
        }
        addArchitectServeConfigurationToProject(
            workspace,
            options.project,
            language,
            serveConfigurationForLanguage(options, language)
        );
        if (workspace.context) {
            workspace.context.logger.info(`added serve configuration for language "${language}" to project "${options.project}"`);
        }
}

/**
 * Add the builder configuration for xliffmerge builder to angular.json.
 * @param workspace the workspace to change
 * @param options options containing project etc.
 */
export function addBuilderConfigurationToProject(workspace: WorkspaceToChange,
                                                 options: OptionsAfterSetup) {
        const builderOptions = {
            xliffmergeOptions: {
                i18nFormat: options.i18nFormat,
                srcDir: options.srcDir,
                genDir: options.genDir,
                defaultLanguage: options.parsedLanguages[0],
                languages: options.parsedLanguages
            }
        };
        addArchitectBuilderToProject(
            workspace,
            options.project,
            xliffmergeBuilderName,
            xliffmergeBuilderSpec,
            builderOptions
        );
        if (workspace.context) {
            workspace.context.logger.info(`added builder xliffmerge to project "${options.project}"`);
        }
}

/**
 * Read the xliffmerge configuration form the builder options.
 * @param workspaceToChange the workspace returned by startChangingWorkspace
 * @param projectName name of project
 */
export function getActualXliffmergeConfigFromWorkspace(workspaceToChange: WorkspaceToChange, projectName: string)
    : {xliffmergeOptions: IXliffMergeOptions, profile?: string} | null {
    if (!projectName) {
        return null;
    }
    const project: WorkspaceProject<ProjectType>|null = getProjectByName(workspaceToChange, projectName);
    if (!project || !project.architect) {
        return null;
    }
    const xliffmergeBuilder = project.architect['xliffmerge'];
    if (!xliffmergeBuilder || !xliffmergeBuilder.options) {
        return null;
    }
    if (xliffmergeBuilder.options && xliffmergeBuilder.options.xliffmergeOptions) {
        return xliffmergeBuilder.options;
    } else if (xliffmergeBuilder.options.profile) {
        // read profile
        const content = workspaceToChange.host.read(xliffmergeBuilder.options.profile);
        if (!content) {
            return null;
        }
        const contentString = content.toString('UTF-8');
        const profileContent = JSON.parse(contentString) as {xliffmergeOptions: IXliffMergeOptions};
        return {
            xliffmergeOptions: profileContent.xliffmergeOptions,
            profile: xliffmergeBuilder.options.profile
        };
    } else {
        return null;
    }
}
