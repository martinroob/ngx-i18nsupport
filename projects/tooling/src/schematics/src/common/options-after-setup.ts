import {Tree, SchematicContext, SchematicsException} from '@angular-devkit/schematics';
import {getWorkspace} from '../../schematics-core/utility/config';
import {WorkspaceSchema} from '../../schematics-core/utility/workspace-models';
import {Location} from '../../schematics-core/utility/parse-name';
import {parseName} from '../../schematics-core';

export interface CommonOptions {
    path?: string; // project path, normally $projectRoot, xliffmerge-config.json will be created here
    project?: string; // project name
}

/**
 * All relevant option values that are given by input, set by default or read from project.
 */
export interface OptionsAfterSetup {
    path: string; // project path, normally $projectRoot, xliffmerge-config.json will be created here
    project: string; // project name
    isDefaultProject: boolean;
    localePath: string;
    srcDir: string;
    genDir: string;
    i18nFormat: string; // the used format (xlf, xlf2, xmb)
    i18nLocale: string; // the default language
    languages?: string; // languages given at command line as comma separated list
    parsedLanguages: string[]; // languages given at command line plus default language
    configuredLanguages: string[]; // languages that are already in the workspace
    useComandlineForLanguages: boolean; // if set, all languages are given as command line argument to xliffmerge
                                        // if not, they are configured in xliffmerge.json (preferred variant)
    skipInstall?: boolean; // When true, does not install dependency packages.
    useXliffmergeBuilder?: boolean; // use builder if true
    profileUsedByBuilder?: string; // if builder is used and the builder is using a profile, the path of the profile
}

export function setupCommonOptions(optionsFromCommandline: CommonOptions, host: Tree, context: SchematicContext): OptionsAfterSetup {
    const options: OptionsAfterSetup = <OptionsAfterSetup> Object.assign({}, optionsFromCommandline);
    let workspace: WorkspaceSchema;
    try {
        workspace = getWorkspace(host);
    } catch (e) {
        const msg = 'Could not find a workspace (must contain angular.json or .angular.json)';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (!workspace.projects) {
        const msg = 'Returned workspace contains no projects, workspace (content of angular.json) was: ' + JSON.stringify(workspace);
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    const defaultProjectName = Object.keys(workspace.projects)[0];
    options.isDefaultProject = !optionsFromCommandline.project || optionsFromCommandline.project === defaultProjectName;
    if (!options.project) {
        options.project = defaultProjectName;
    }
    const project = workspace.projects[options.project];
    if (!project) {
        const msg = 'Workspace contains no project named "' + options.project + '".';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (project.projectType !== 'application') {
        const msg = 'Project must be of type "application", but it is of type "' + project.projectType + '".';
        context.logger.fatal(msg);
        throw new SchematicsException(msg);
    }
    if (options.path === undefined) {
        options.path = `/${project.root}`;
    }
    const parsedPath: Location = parseName(options.path, 'anyfile');
    options.path = parsedPath.path;
    options.srcDir = 'src';
    options.genDir = 'src';
    if (options.localePath) {
        options.srcDir = options.srcDir + '/' + options.localePath;
        options.genDir = options.genDir + '/' + options.localePath;
    }
    options.configuredLanguages = [];
    options.useComandlineForLanguages = false;
    return options;
}
