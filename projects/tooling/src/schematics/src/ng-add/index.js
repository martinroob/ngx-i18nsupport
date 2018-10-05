"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const schematics_core_1 = require("../../schematics-core");
const special_package_1 = require("../../schematics-core/utility/special-package");
const special_project_1 = require("../../schematics-core/utility/special-project");
/**
 * Current version of @ngx-i18nsupport/xliffmerge
 * This value will be written into package.json of the project that uses ng add.
 * TODO must be changed for every new release.
 */
exports.xliffmergeVersion = '^0.19.0';
function addXliffmergeDependencyToPackageJson() {
    return (host, context) => {
        schematics_core_1.addPackageToPackageJson(host, 'devDependencies', '@ngx-i18nsupport/xliffmerge', exports.xliffmergeVersion);
        context.addTask(new tasks_1.NodePackageInstallTask());
        return host;
    };
}
function addExtractScriptToPackageJson(options) {
    return (host, context) => {
        special_package_1.addScriptToPackageJson(host, 'extract-i18n', fullExtractScript(options));
        context.logger.info('added npm script to extract i18n message, run "npm run extract-i18n" for extraction');
        return host;
    };
}
function fullExtractScript(options) {
    const defaultLanguage = options['i18n-locale'];
    const i18nFormat = options['i18n-format'];
    const languagesBlankSeparated = options.languages ? options.languages.replace(/,/g, ' ') : '';
    const localeDir = options.localePath;
    const configFilePath = 'xliffmerge.json';
    return `ng xi18n --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage}\
 && xliffmerge --profile ${configFilePath} ${languagesBlankSeparated}`;
}
function addLanguageConfigurationToProject(options, language) {
    return (host, context) => {
        special_project_1.addArchitectBuildConfigurationToProject(host, context, options.project, language, buildConfigurationForLanguage(options, language));
        context.logger.info('added build configuration for language ' + language);
        special_project_1.addArchitectServeConfigurationToProject(host, context, options.project, language, serveConfigurationForLanguage(options, language));
        context.logger.info('added build configuration for language ' + language);
        return host;
    };
}
function buildConfigurationForLanguage(options, language) {
    return {
        aot: true,
        outputPath: `dist/${options.project}-${language}`,
        i18nFile: `${options.genDir}/messages.${language}.xlf`,
        i18nFormat: options['i18n-format'],
        i18nLocale: language
    };
}
function serveConfigurationForLanguage(options, language) {
    return {
        browserTarget: `${options.project}:build:${language}`
    };
}
function setupOptions(options, host, context) {
    let workspace;
    try {
        workspace = schematics_core_1.getWorkspace(host);
    }
    catch (e) {
        const msg = 'Could not find a workspace (must contain angular.json or .angular.json)';
        context.logger.fatal(msg);
        throw new schematics_1.SchematicsException(msg + ', exception ' + e);
    }
    if (!workspace.projects) {
        const msg = 'returned workspace contains no projects, workspace (content of angular.json) was: ' + JSON.stringify(workspace);
        context.logger.fatal(msg);
        throw new schematics_1.SchematicsException(msg);
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
    const parsedPath = schematics_core_1.parseName(options.path, '');
    options.path = parsedPath.path;
    if (!options.languages) {
        options.parsedLanguages = [];
    }
    else {
        options.parsedLanguages = options.languages.split(',');
    }
    options.srcDir = 'src' + '/' + options.localePath;
    options.genDir = 'src' + '/' + options.localePath;
    context.logger.info('Path is set to ' + options.path);
    context.logger.info('srcDir, genDir ' + options.srcDir + ', ' + options.genDir);
}
// You don't have to export the function as default. You can also have more than one rule factory
// per file.
function ngAdd(options) {
    return (host, context) => {
        setupOptions(options, host, context);
        const templateSource = schematics_1.apply(schematics_1.url('./files'), [
            schematics_1.template(Object.assign({}, schematics_core_1.stringUtils, options, { 'i18nLocale': options['i18n-locale'], 'i18nFormat': options['i18n-format'] })),
            schematics_1.move(options.path ? options.path : ''),
        ]);
        const configurationAdditions = options.parsedLanguages
            .filter(lang => lang !== options['i18n-locale'])
            .map(lang => addLanguageConfigurationToProject(options, lang));
        return schematics_1.chain([
            schematics_1.branchAndMerge(schematics_1.chain([addExtractScriptToPackageJson(options), ...configurationAdditions, schematics_1.mergeWith(templateSource)])),
            addXliffmergeDependencyToPackageJson(),
        ])(host, context);
    };
}
exports.ngAdd = ngAdd;
//# sourceMappingURL=index.js.map