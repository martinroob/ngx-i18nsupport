/**
 * Functions shared between the schematics.
 **/

import {OptionsAfterSetup} from './options-after-setup';
import {SchematicContext, Tree} from '@angular-devkit/schematics';
import {addPackageJsonDependency, NodeDependency, NodeDependencyType} from '../../schematics-core';
import {xliffmergePackage, xliffmergeVersion} from './constants';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';

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
 * Add dev dependencies to actual xliffmerge version to package.json
 * @param skipInstall wether install should be skipped
 */
export function addXliffmergeDependencyToPackageJson(skipInstall: boolean|undefined) {
    return (host: Tree, context: SchematicContext) => {
        const dependencyToXliffmerge: NodeDependency = {
            type: NodeDependencyType.Dev,
            name: xliffmergePackage,
            version: xliffmergeVersion,
            overwrite: true
        };
        addPackageJsonDependency(host, dependencyToXliffmerge);
        if (!skipInstall) {
            context.addTask(new NodePackageInstallTask());
        }
        return host;
    };
}

