/**
 * Additional angular.json spefific tool functions that are not part of normal project.ts
 */

import {SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {WorkspaceSchema, WorkspaceProject, ProjectType} from './workspace-models';

export interface WorkspaceToChange {
    workspace: WorkspaceSchema;
    host: Tree;
    context?: SchematicContext;
}

/**
 * Start working on angular.json
 * Due to the fact, that angular-devkit does not support multiple changes on a single file,
 * we have to use this construct.
 * All changing methods get the returned workspace as a parameter and can change it.
 * At the end we call commitWorkspaceChanges() to write angular.json.
 * @param host host tree
 * @param context context (used for logging)
 * @return object to do changes on it.
 * @throws SchematicsException when angular.json does not exists.
 */
export function startChangingWorkspace(host: Tree, context?: SchematicContext): WorkspaceToChange {
    const ws = readAngularJson(host);
    return {
        workspace: ws,
        host: host,
        context: context
    };
}

/**
 * Commit all changes done on workspace.
 * (writes angular.json)
 * @param host host tree
 * @param workspaceToChange the workspace returned by startChangingWorkspace
 */
export function commitWorkspaceChanges(host: Tree, workspaceToChange: WorkspaceToChange) {
    const newAngularJsonContent = JSON.stringify(workspaceToChange.workspace, null, 2);
    host.overwrite('/angular.json', newAngularJsonContent);
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

/**
 * Get project from angular.json.
 * @param workspaceToChange the workspace returned by startChangingWorkspace
 * @param projectName Name of project
 * @throws an exception if angular.json or project does not exist.
 */
export function getProjectByName(
    workspaceToChange: WorkspaceToChange,
    projectName: string,
): WorkspaceProject<ProjectType> {
        const projects = workspaceToChange.workspace.projects;
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
 * Add a build configuration to angular.json.
 * Configuration is stored under architect.build.configurations
 * @param workspaceToChange the workspace
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
export function addArchitectBuildConfigurationToProject(
    workspaceToChange: WorkspaceToChange,
    projectName: string,
    configurationName: string,
    configuration: any) {

    return addObjectToProjectPath(workspaceToChange, projectName,
        'build configuration',
        ['architect', 'build', 'configurations'],
        configurationName, configuration);
}

/**
 * Add a serve configuration to angular.json.
 * Configuration is stored under architect.serve.configurations
 * @param workspaceToChange the workspace
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
export function addArchitectServeConfigurationToProject(
    workspaceToChange: WorkspaceToChange,
    projectName: string,
    configurationName: string,
    configuration: any) {

    return addObjectToProjectPath(workspaceToChange, projectName,
        'serve configuration',
        ['architect', 'serve', 'configurations'],
        configurationName, configuration);
}

/**
 * Add a builder to angular.json.
 * Builder is stored under architect
 * @param workspaceToChange the workspace
 * @param projectName Name of project
 * @param builderName Name of builder to add
 * @param builder builder in syntax <class|package>:name
 * @param options options
 * @param configuration optional configuration object
 */
export function addArchitectBuilderToProject(
    workspaceToChange: WorkspaceToChange,
    projectName: string,
    builderName: string,
    builder: string,
    options: any,
    configuration?: any) {

    const builderSpec: any = {
        builder: builder,
        options: options
    };
    if (configuration) {
        builderSpec.configuration = configuration;
    }
    return addObjectToProjectPath(workspaceToChange, projectName,
        'architect builder',
        ['architect'],
        builderName, builderSpec);
}

/**
 * (private) get a special object from project by navigating a path
 * Throws an exception if path does not exist.
 * @param projectName Name of project.
 * @param project the project read from angular.json
 * @param path path like ['architect', 'build', 'configurations']
 * @return the object at the path position
 * @throws SchematicsException if path does not exist.
 */
function getObjectFromProjectUsingPath(projectName: string, project: WorkspaceProject<ProjectType>, path: string[]): any {
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

/*
private helper function to read angular.json
 */
function readAngularJson(
    host: Tree
): WorkspaceSchema  {
    const noAngularJsonMsg = 'file angular.json not found';
    if (host.exists('/angular.json')) {
        const content = host.read('/angular.json');
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
 * (private) Add an object to angular.json.
 * Object is stored under path given as parameter.
 * @param workspaceToChange the workspace
 * @param objectType Type of object, will be shown in log (either a build or serve configuration or a builder)
 * @param projectName Name of project
 * @param path path in project, like ['architect', 'build', 'configurations']
 * @param objectName Name of object to add
 * @param objectToAdd object to be added (either a configuration or a builder)
 */
function addObjectToProjectPath(
    workspaceToChange: WorkspaceToChange,
    projectName: string,
    objectType: string,
    path: string[],
    objectName: string,
    objectToAdd: any) {

    const projects = workspaceToChange.workspace.projects;
    if (!projects) {
        throw new SchematicsException('angular.json does not contain projects');
    }
    const project = projects[projectName];
    if (!project) {
        throw new SchematicsException('angular.json does not contain project ' + projectName);
    }
    const container = getObjectFromProjectUsingPath(projectName, project, path);
    const addedOrChanged = (container[objectName]) ? 'changed' : 'added';
    container[objectName] = objectToAdd;
    if (workspaceToChange.context) {
        workspaceToChange.context.logger.info(`${addedOrChanged} ${objectType} ${objectName} to project ${projectName}`);
    }
}
