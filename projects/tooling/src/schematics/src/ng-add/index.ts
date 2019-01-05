/**
 * Schematic to automatically add support for using @ngx-i18nsupport.
 * Will be called when you call 'ng add @ngx-i18nsupport/tooling'.
 */

import {
    apply,
    branchAndMerge,
    chain,
    mergeWith,
    move, noop,
    Rule,
    SchematicContext,
    SchematicsException,
    template,
    Tree,
    url
} from '@angular-devkit/schematics';
import {NgAddOptions} from './schema';
import {
    stringUtils
} from '../../schematics-core';
import {
    defaultI18nLocale,
    isValidLanguageSyntax,
    OptionsAfterSetup,
    setupCommonOptions,
    WorkspaceSnaphot, PackageJsonSnapshot, addXliffmergeDependencyToPackageJson
} from '../common';

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
    if (options.useXliffmergeBuilder) {
        options.profileUsedByBuilder = undefined;
    }
    options.useComandlineForLanguages = optionsFromCommandline.useCommandlineForLanguages ?
        optionsFromCommandline.useCommandlineForLanguages
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

      const angularJsonChanges: Rule = (tree: Tree, context2: SchematicContext) => {
          const ws: WorkspaceSnaphot = new WorkspaceSnaphot(tree, context2);
          options.parsedLanguages
              .filter(lang => lang !== options.i18nLocale)
              .forEach(lang => ws.addLanguageConfigurationToProject(options, lang));
          if (options.useXliffmergeBuilder) {
              ws.addBuilderConfigurationToProject(options);
          }
          ws.commit();
      };
      const packageJsonChanges: Rule = (tree: Tree, context2: SchematicContext) => {
          const packageJson: PackageJsonSnapshot = new PackageJsonSnapshot('/', tree, context2);
          packageJson.addExtractScript(options);
          options.parsedLanguages
              .filter(lang => lang !== options.i18nLocale)
              .forEach(lang => packageJson.addStartScript(options, lang));
          packageJson.commit();
      };
      return chain([
          branchAndMerge(
              chain([
                  packageJsonChanges,
                  angularJsonChanges,
                  (options.useXliffmergeBuilder) ? noop() : mergeWith(templateSource)]
              )
          ),
          addXliffmergeDependencyToPackageJson(options.skipInstall),
      ])(host, context);
  };
}
