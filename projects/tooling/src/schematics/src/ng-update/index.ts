import {Rule, SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import chalk from 'chalk';
import {
    addXliffmergeDependencyToPackageJson,
    defaultI18nFormat, defaultI18nLocale, extractScriptName,
    OptionsAfterSetup,
    PackageJsonSnapshot,
    setupCommonOptions,
    WorkspaceSnaphot, xliffmergeBuilderName, xliffmergeBuilderSpec
} from '../common';
import {ExtractScript} from '../common/extract-script';
import {NgUpdateOptions} from './schema';
import {XliffmergeConfigJsonSnapshot} from '../common/xliffmerge-config-json-snapshot';
import {IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';

function setupOptions(optionsFromCommandline: NgUpdateOptions,
                      extractScript: ExtractScript,
                      extractScriptPath: string,
                      host: Tree,
                      context: SchematicContext): OptionsAfterSetup {
    const options = setupCommonOptions(optionsFromCommandline, host, context);
    let  xliffmergeOptions: IConfigFile|null;
    const ws = new WorkspaceSnaphot(host, context);
    const optionsFromBuilder = ws.getActualXliffmergeConfigFromWorkspace(options.project);
    if (optionsFromBuilder) {
        options.useXliffmergeBuilder = true;
        if (optionsFromBuilder.profile) {
            options.profileUsedByBuilder = optionsFromBuilder.profile;
        }
        xliffmergeOptions = optionsFromBuilder;
    } else {
        // read xliffmerge.json used in extract script
        xliffmergeOptions = getProfileContent(extractScript, extractScriptPath, host, context).content;
    }
    if (!xliffmergeOptions) {
        const msg = 'No builder configuration and also no config file "xliffmerge.json" could be found. ' +
            'Please install @ngx-i18nsupport via "ng add @ngx-i18nsupport/tooling" to create it';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    options.useXliffmergeBuilder = false;
    if (!xliffmergeOptions.xliffmergeOptions) {
        xliffmergeOptions.xliffmergeOptions = {};
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
    options.configuredLanguages = xliffmergeOptions.xliffmergeOptions.languages ? xliffmergeOptions.xliffmergeOptions.languages : [];
    return options;
}

function getProfileContent(extractScript: ExtractScript,
                           packageJsonPath: string,
                           host: Tree,
                           context: SchematicContext): {profile: string, content: IConfigFile|null} {
    const profile = extractScript.xliffmergeProfile();
    if (profile) {
        const path = packageJsonPath + '/' + profile;
        try {
            const snapshot = new XliffmergeConfigJsonSnapshot(path, host, context);
            return {profile: path, content: snapshot.getXliffmergeConfigJson()};
        } catch (e) {
            const msg = `Could not find config file "${path}"`;
            context.logger.warn(msg);
            throw new SchematicsException(msg);
        }
    } else {
        return {profile: '', content: null};
    }
}

export function updateToV11(options: NgUpdateOptions): Rule {
    return (host: Tree, context: SchematicContext) => {
        context.logger.info('Update @ngx-i18nsupport to version 1.1');
        // find all projects that are using xliffmerge
        const angularJson = new WorkspaceSnaphot(host, context);
        const defaultProjectName = angularJson.getDefaultProjectName();
        const projects = angularJson.getAllProjects();
        if (projects.length === 0) {
            context.logger.warn('Did not find any projects in angular.json');
            return;
        }
        let packageJson: PackageJsonSnapshot;
        try {
            packageJson = new PackageJsonSnapshot('/', host, context);
        } catch (e) {
            context.logger.error('Did not find package.json');
            return;
        }
        let migrationCount = 0;
        projects.forEach(project => {
            const isDefaultProject = (defaultProjectName === project.name);
            let extractScript: ExtractScript | null =
                packageJson.getExtractScriptForProject(project.name, isDefaultProject);
            if (!extractScript && !isDefaultProject) {
                const extractScriptForDefaultProject = packageJson.getExtractScriptForProject(null, true);
                if (extractScriptForDefaultProject && extractScriptForDefaultProject.projectName() === project.name) {
                    // this script has old name extract-i18n, but should be extract-i18n-<projectname>
                    packageJson.removeScript(extractScriptForDefaultProject.name);
                    extractScript = new ExtractScript(
                        extractScriptName(project.name, isDefaultProject),
                        extractScriptForDefaultProject.content);
                }
            }
            if (extractScript) {
                if (extractScript.usesXliffmergeCommandline()) {
                    options.project = project.name;
                    try {
                        const optionsAfterSetup: OptionsAfterSetup = setupOptions(options, extractScript, '/', host, context);
                        optionsAfterSetup.isDefaultProject = isDefaultProject;
                        optionsAfterSetup.project = project.name;
                        const {profile, content} = getProfileContent(extractScript, '/', host, context);
                        const languagesFromCommandline = extractScript.languages();
                        if (content && languagesFromCommandline.length > 0) {
                            if (!content.xliffmergeOptions) {
                                content.xliffmergeOptions = {};
                            }
                            content.xliffmergeOptions.languages = languagesFromCommandline;
                        }
                        optionsAfterSetup.useXliffmergeBuilder = true;
                        packageJson.addExtractScript(optionsAfterSetup);
                        packageJson.commit();
                        angularJson.addArchitectBuilderToProject(project.name,
                            xliffmergeBuilderName, xliffmergeBuilderSpec, content);
                        host.delete(profile);
                        migrationCount++;
                        // TODO config script etc...
                    } catch (e) {
                        context.logger.warn(`Could not migrate project ${project.name}: ${e.toString()}`);
                    }
                } else {
                    context.logger.info(`project ${project.name} does not use xliffmerge command line`);
                }
            } else {
                const scriptName = extractScriptName(project.name, defaultProjectName === project.name);
                context.logger.info(`project ${project.name} does not use i18n (no ${scriptName} script found)`);
            }
        });
        if (migrationCount === 0) {
            context.logger.warn('Did not find any projects using xliffmerge in angular.json');
        } else {
            angularJson.commit();
            addXliffmergeDependencyToPackageJson(false)(host, context);
        }
    };
}

/** Post-update schematic to be called when update is finished. */
export function postUpdate(): Rule {
    return () => {
        console.log();
        console.log(chalk.green('  ✓  @ngx-i18nsupport update complete'));
        console.log();
        console.log(chalk.yellow('  ⚠  Please check the output above for any issues that were detected ' +
            'but could not be automatically fixed.'));
    };
}
