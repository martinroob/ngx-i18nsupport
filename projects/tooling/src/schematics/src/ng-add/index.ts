import { Rule,
    SchematicContext,
    Tree,
    SchematicsException,
    apply,
    branchAndMerge,
    chain,
    mergeWith,
    template,
    url,
    move } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import {NgAddOptions} from './schema';
import {addPackageToPackageJson, getWorkspace, parseName, stringUtils} from '../../schematics-core';
import {Location} from '../../schematics-core/utility/parse-name';
import {WorkspaceSchema} from '../../schematics-core/utility/config';
import {addScriptToPackageJson} from '../../schematics-core/utility/special-package';
import {
    addArchitectBuildConfigurationToProject,
    addArchitectServeConfigurationToProject
} from '../../schematics-core/utility/special-project';

/**
 * Current version of @ngx-i18nsupport/xliffmerge
 * This value will be written into package.json of the project that uses ng add.
 * TODO must be changed for every new release.
 */
export const xliffmergeVersion = '^0.19.0';

function addXliffmergeDependencyToPackageJson() {
    return (host: Tree, context: SchematicContext) => {
        addPackageToPackageJson(
            host,
            'devDependencies',
            '@ngx-i18nsupport/xliffmerge',
            xliffmergeVersion
        );
        context.addTask(new NodePackageInstallTask());
        return host;
    };
}

function addExtractScriptToPackageJson(options: NgAddOptions) {
    return (host: Tree, context: SchematicContext) => {
        addScriptToPackageJson(
            host,
            'extract-i18n',
            fullExtractScript(options)
        );
        context.logger.info('added npm script to extract i18n message, run "npm run extract-i18n" for extraction');
        return host;
    };
}

function fullExtractScript(options: NgAddOptions): string {
    const defaultLanguage = options['i18n-locale'];
    const i18nFormat = options['i18n-format'];
    const languagesBlankSeparated = options.languages ? options.languages.replace(/,/g, ' ') : '';
    const localeDir = options.localePath;
    const configFilePath = 'xliffmerge.json';
    return `ng xi18n --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage}\
 && xliffmerge --profile ${configFilePath} ${languagesBlankSeparated}`;
}

function addLanguageConfigurationToProject(options: NgAddOptions, language: string) {
    return (host: Tree, context: SchematicContext) => {
        addArchitectBuildConfigurationToProject(
            host,
            context,
            options.project,
            language,
            buildConfigurationForLanguage(options, language)
        );
        context.logger.info('added build configuration for language ' + language);
        addArchitectServeConfigurationToProject(
            host,
            context,
            options.project,
            language,
            serveConfigurationForLanguage(options, language)
        );
        context.logger.info('added build configuration for language ' + language);
        return host;
    };
}

function buildConfigurationForLanguage(options: NgAddOptions, language: string): any {
    return {
        aot: true,
        outputPath: `dist/${options.project}-${language}`,
        i18nFile: `${options.genDir}/messages.${language}.xlf`,
        i18nFormat: options['i18n-format'],
        i18nLocale: language
    };
}

function serveConfigurationForLanguage(options: NgAddOptions, language: string): any {
    return {
        browserTarget: `${options.project}:build:${language}`
    };
}

function setupOptions(options: NgAddOptions, host: Tree, context: SchematicContext): void {
    let workspace: WorkspaceSchema;
    try {
        workspace = getWorkspace(host);
    } catch (e) {
        const msg = 'Could not find a workspace (must contain angular.json or .angular.json)';
        context.logger.fatal(msg);
        throw new SchematicsException(msg + ', exception ' + e);
    }
    if (!workspace.projects) {
        const msg = 'returned workspace contains no projects, workspace (content of angular.json) was: ' + JSON.stringify(workspace);
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (!options.project) {
        options.project = Object.keys(workspace.projects)[0];
    }
    const project = workspace.projects[options.project];

    if (options.path === undefined) {
        options.path = `/${project.root}`;
//        const projectDirName = project.projectType === 'application' ? 'app' : 'lib';
//        options.path = `/${project.root}/src/${projectDirName}`;
    }
    const parsedPath: Location = parseName(options.path, '');
    options.path = parsedPath.path;
    if (!options.languages) {
        options.parsedLanguages = [];
    } else {
        options.parsedLanguages = options.languages.split(',');
    }
    options.srcDir = 'src' + '/' + options.localePath;
    options.genDir = 'src' + '/' + options.localePath;
    context.logger.info('Path is set to ' + options.path);
    context.logger.info('srcDir, genDir ' + options.srcDir + ', ' + options.genDir);
}

// You don't have to export the function as default. You can also have more than one rule factory
// per file.
export function ngAdd(options: NgAddOptions): Rule {
  return (host: Tree, context: SchematicContext) => {
      setupOptions(options, host, context);
      const templateSource = apply(url('./files'), [
          template({
              ...stringUtils,
              ...(options as object),
              'i18nLocale': options['i18n-locale'],
              'i18nFormat': options['i18n-format']
          } as any),
          move(options.path ? options.path : ''),
      ]);

      const configurationAdditions = options.parsedLanguages
          .filter(lang => lang !== options['i18n-locale'])
          .map(lang => addLanguageConfigurationToProject(options, lang));
      return chain([
          branchAndMerge(
              chain([addExtractScriptToPackageJson(options), ...configurationAdditions, mergeWith(templateSource)])
          ),
          addXliffmergeDependencyToPackageJson(),
      ])(host, context);
  };
}
