import {Tree, SchematicContext, SchematicsException} from '@angular-devkit/schematics';

/**
 * Add a configuration to anguar.json.
 * Configuration is stored under architect.build.configurations
 * @param host Host (Tree)
 * @param context Context
 * @param projectName Name of project
 * @param path path in project, like ['architect', 'build', 'configurations']
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
function addConfigurationToProjectPath(
    host: Tree,
    context: SchematicContext,
    projectName: string,
    path: string[],
    configurationName: string,
    configuration: any): Tree {

    const noAngularJsonMsg = 'file angular.json not found';
    if (host.exists('angular.json')) {
        const content = host.read('angular.json');
        if (!content) {
            throw new SchematicsException(noAngularJsonMsg);
        }
        const sourceText = content.toString('utf-8');
        const json = JSON.parse(sourceText);
        const projects = json['projects'];
        if (!projects) {
            throw new SchematicsException('angular.json does not contain projects');
        }
        const project = projects[projectName];
        if (!project) {
            throw new SchematicsException('angular.json does not contain project ' + projectName);
        }
        const configurations = getPathFromProject(projectName, project, path);
        configurations[configurationName] = configuration;
        context.logger.info('added configuration ' + configurationName + ' to project ' + projectName);
        host.overwrite('angular.json', JSON.stringify(json, null, 2));
    } else {
        throw new SchematicsException(noAngularJsonMsg);
    }

    return host;
}

/**
 * Add a configuration to anguar.json.
 * Configuration is stored under architect.build.configurations
 * @param host Host (Tree)
 * @param context Context
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
export function addArchitectBuildConfigurationToProject(
    host: Tree,
    context: SchematicContext,
    projectName: string,
    configurationName: string,
    configuration: any): Tree {

    return addConfigurationToProjectPath(host, context, projectName,
        ['architect', 'build', 'configurations'],
        configurationName, configuration);
}

/**
 * Add a configuration to anguar.json.
 * Configuration is stored under architect.serve.configurations
 * @param host Host (Tree)
 * @param context Context
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
export function addArchitectServeConfigurationToProject(
    host: Tree,
    context: SchematicContext,
    projectName: string,
    configurationName: string,
    configuration: any): Tree {

    return addConfigurationToProjectPath(host, context, projectName,
        ['architect', 'serve', 'configurations'],
        configurationName, configuration);
}

function getPathFromProject(projectName: string, project: any, path: string[]): any {
    let object = project;
    let currentPath = '';
    for (let i = 0; i < path.length; i++) {
        currentPath = currentPath + '.' + path[i];
        object = object[path[i]];
        if (!object) {
            throw new SchematicsException('angular.json does not contain ' + currentPath + ' in project ' + projectName);
        }
    }
    return object;
}
