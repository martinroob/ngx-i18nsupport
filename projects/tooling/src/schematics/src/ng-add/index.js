"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const tasks_1 = require("@angular-devkit/schematics/tasks");
const schematics_core_1 = require("../../schematics-core");
/**
 * Current version of @ngx-i18nsupport/xliffmerge
 * This value will be written into package.json of the project that uses ng add.
 * TODO must be changed for every new release.
 */
const xliffmergeVersion = '^0.19.0';
/**
 * Adds a script to the package.json
 */
function addScriptToPackageJson(host, scriptName, content) {
    if (host.exists('package.json')) {
        const scriptsSection = 'scripts';
        const packageJsonContent = host.read('package.json');
        if (packageJsonContent) {
            const sourceText = packageJsonContent.toString('utf-8');
            const json = JSON.parse(sourceText);
            if (!json[scriptsSection]) {
                json[scriptsSection] = {};
            }
            if (!json[scriptsSection][scriptName]) {
                json[scriptsSection][scriptName] = content;
            }
            host.overwrite('package.json', JSON.stringify(json, null, 2));
        }
    }
    return host;
}
function addXliffmergeDependencyToPackageJson() {
    return (host, context) => {
        schematics_core_1.addPackageToPackageJson(host, 'devDependencies', '@ngx-i18nsupport/xliffmerge', xliffmergeVersion);
        context.addTask(new tasks_1.NodePackageInstallTask());
        return host;
    };
}
function addExtractScriptToPackageJson(options) {
    return (host, context) => {
        addScriptToPackageJson(host, 'extract-i18n', fullExtractScript(options));
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
    return `ng xi18n --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage} && xliffmerge --profile ${configFilePath} ${languagesBlankSeparated}`;
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
        return schematics_1.chain([
            schematics_1.branchAndMerge(schematics_1.chain([addExtractScriptToPackageJson(options), schematics_1.mergeWith(templateSource)])),
            addXliffmergeDependencyToPackageJson(),
        ])(host, context);
        /*    host.create('hello.txt', 'Hello World!, Default lang is ' + options.defaultLanguage);
              host.create('xliffmerge.json', 'Hello World!, Default lang is ' + options.defaultLanguage);
            return host;*/
    };
}
exports.ngAdd = ngAdd;
//# sourceMappingURL=index.js.map