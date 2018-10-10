/**
 * Additional angular.json spefific tool functions that are not part of normal project.ts
 */

import {SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {WorkspaceSchema} from './config';
import {WorkspaceProject} from './project';

/*
private helper function
 */
function readAngularJson(
    host: Tree
): WorkspaceSchema  {
    const noAngularJsonMsg = 'file angular.json not found';
    if (host.exists('angular.json')) {
        const content = host.read('angular.json');
        if (!content) {
            throw new SchematicsException(noAngularJsonMsg);
        }
        const sourceText = content.toString('utf-8');
        return JSON.parse(sourceText);
    } else {
        throw new SchematicsException(noAngularJsonMsg);
    }
}

/**
 * Get project from angular.json.
 * @param host Host (Tree)
 * @param _context Context
 * @param projectName Name of project
 */
export function getProjectByName(
    host: Tree,
    _context: SchematicContext,
    projectName: string,
): WorkspaceProject {
        const json = readAngularJson(host);
        const projects = json['projects'];
        if (!projects) {
            throw new SchematicsException('angular.json does not contain projects');
        }
        const project = projects[projectName];
        if (!project) {
            throw new SchematicsException('angular.json does not contain project ' + projectName);
        }
        return project;
}

/**
 * (private) Add a configuration to angular.json.
 * Configuration is stored under path given as parameter.
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

    const json = readAngularJson(host);
    const projects = json['projects'];
    if (!projects) {
        throw new SchematicsException('angular.json does not contain projects');
    }
    const project = projects[projectName];
    if (!project) {
        throw new SchematicsException('angular.json does not contain project ' + projectName);
    }
    const configurations = getObjectFromProjectUsingPath(projectName, project, path);
    configurations[configurationName] = configuration;
    context.logger.debug('added configuration ' + configurationName + ' to project ' + projectName);
    host.overwrite('angular.json', JSON.stringify(json, null, 2));

    return host;
}

/**
 * Add a build configuration to angular.json.
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
 * Add a serve configuration to angular.json.
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

/**
 * (private) get a special object from project by navigating a path
 * Throws an exception if path does not exist.
 * @param projectName Name of project.
 * @param project the project read from angular.json
 * @param path path like ['architect', 'build', 'configurations']
 * @return the object at the path position
 */
function getObjectFromProjectUsingPath(projectName: string, project: WorkspaceProject, path: string[]): any {
    let object: any = project;
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

/**
 * Read angular.json
 * @return content or null, if file does not exist.
 */
export function getAngularJson(host: Tree): WorkspaceSchema | null {
    const path = `/angular.json`;
    const content = host.read(path);
    if (!content) {
        return null;
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString) as WorkspaceSchema;
}
