/**
 * Schematic to automatically add support for using @ngx-i18nsupport.
 * Will be called when you call 'ng add @ngx-i18nsupport/tooling'.
 */

import {apply, branchAndMerge, chain, mergeWith, move,
    Rule, SchematicContext, SchematicsException,
    template, Tree, url} from '@angular-devkit/schematics';
import {NodePackageInstallTask} from '@angular-devkit/schematics/tasks';
import {NgAddOptions} from './schema';
import {addPackageToPackageJson, addScriptToPackageJson, stringUtils} from '../../schematics-core';
import {
    addLanguageConfigurationToProject,
    isValidLanguageSyntax,
    addStartScriptToPackageJson,
    fullExtractScript,
    OptionsAfterSetup, setupCommonOptions,
    xliffmergeVersion, extractScriptName, defaultI18nLocale, xliffmergePackage
} from '../common';

function addXliffmergeDependencyToPackageJson() {
    return (host: Tree, context: SchematicContext) => {
        addPackageToPackageJson(
            host,
            'devDependencies',
            xliffmergePackage,
            xliffmergeVersion
        );
        context.addTask(new NodePackageInstallTask());
        return host;
    };
}

function addExtractScriptToPackageJson(options: OptionsAfterSetup) {
    return (host: Tree, context: SchematicContext) => {
        addScriptToPackageJson(
            host,
            extractScriptName,
            fullExtractScript(options)
        );
        context.logger.info(`added npm script to extract i18n message, run "npm run ${extractScriptName}" for extraction`);
        return host;
    };
}

/**
 * Sets all options given by commandline or defaults.
 * It also checks values for correctness.
 * @param optionsFromCommandline command line options.
 * @param context use for error logging.
 * @param host the tree to lookup some workspace settings.
 * @return an object where all relevant values are set.
 */
function setupOptions(optionsFromCommandline: NgAddOptions, host: Tree, context: SchematicContext): OptionsAfterSetup {
    const options: OptionsAfterSetup = setupCommonOptions(optionsFromCommandline, host, context);
    options.useComandlineForLanguages = optionsFromCommandline.useComandlineForLanguages ?
        optionsFromCommandline.useComandlineForLanguages
        : false;
    const languagesFromCommandline = (optionsFromCommandline.languages) ? optionsFromCommandline.languages.split(',') : [];
    if (!optionsFromCommandline.i18nLocale) {
        if (languagesFromCommandline.length > 0) {
            options.i18nLocale = languagesFromCommandline[0];
        } else {
            options.i18nLocale = defaultI18nLocale;
        }
    }
    options.parsedLanguages = [options.i18nLocale];
    if (optionsFromCommandline.languages) {
        options.parsedLanguages.push(...languagesFromCommandline);
    }
    // remove duplicates
    options.parsedLanguages = options.parsedLanguages.filter((v, i, a) => a.indexOf(v) === i);
    for (const lang of options.parsedLanguages) {
        if (!isValidLanguageSyntax(lang)) {
            const msg = `"${lang}" is not a valid language code.`;
            context.logger.fatal(msg);
            throw new SchematicsException(msg);
        }
    }
    return options;
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
// noinspection JSUnusedGlobalSymbols
export function ngAdd(optionsFromCommandline: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
      const options: OptionsAfterSetup = setupOptions(optionsFromCommandline, host, context);
      const templateSource = apply(url('./files'), [
          template({
              ...stringUtils,
              ...(options as object),
              'i18nLocale': options.i18nLocale,
              'i18nFormat': options.i18nFormat
          } as any),
          move(options.path ? options.path : ''),
      ]);

      const configurationAdditions = options.parsedLanguages
          .filter(lang => lang !== options.i18nLocale)
          .map(lang => addLanguageConfigurationToProject(options, lang));
      const startScriptAdditions = options.parsedLanguages
          .filter(lang => lang !== options.i18nLocale)
          .map(lang => addStartScriptToPackageJson(options, lang));
      return chain([
          branchAndMerge(
              chain([
                  addExtractScriptToPackageJson(options),
                  ...configurationAdditions,
                  ...startScriptAdditions,
                  mergeWith(templateSource)]
              )
          ),
          addXliffmergeDependencyToPackageJson(),
      ])(host, context);
  };
}
