"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
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
function addConfigurationToProjectPath(host, context, projectName, path, configurationName, configuration) {
    const noAngularJsonMsg = 'file angular.json not found';
    if (host.exists('angular.json')) {
        const content = host.read('angular.json');
        if (!content) {
            throw new schematics_1.SchematicsException(noAngularJsonMsg);
        }
        const sourceText = content.toString('utf-8');
        const json = JSON.parse(sourceText);
        const projects = json['projects'];
        if (!projects) {
            throw new schematics_1.SchematicsException('angular.json does not contain projects');
        }
        const project = projects[projectName];
        if (!project) {
            throw new schematics_1.SchematicsException('angular.json does not contain project ' + projectName);
        }
        const configurations = getPathFromProject(projectName, project, path);
        configurations[configurationName] = configuration;
        context.logger.info('added configuration ' + configurationName + ' to project ' + projectName);
        host.overwrite('angular.json', JSON.stringify(json, null, 2));
    }
    else {
        throw new schematics_1.SchematicsException(noAngularJsonMsg);
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
function addArchitectBuildConfigurationToProject(host, context, projectName, configurationName, configuration) {
    return addConfigurationToProjectPath(host, context, projectName, ['architect', 'build', 'configurations'], configurationName, configuration);
}
exports.addArchitectBuildConfigurationToProject = addArchitectBuildConfigurationToProject;
/**
 * Add a configuration to anguar.json.
 * Configuration is stored under architect.serve.configurations
 * @param host Host (Tree)
 * @param context Context
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
function addArchitectServeConfigurationToProject(host, context, projectName, configurationName, configuration) {
    return addConfigurationToProjectPath(host, context, projectName, ['architect', 'serve', 'configurations'], configurationName, configuration);
}
exports.addArchitectServeConfigurationToProject = addArchitectServeConfigurationToProject;
function getPathFromProject(projectName, project, path) {
    let object = project;
    let currentPath = '';
    for (let i = 0; i < path.length; i++) {
        currentPath = currentPath + '.' + path[i];
        object = object[path[i]];
        if (!object) {
            throw new schematics_1.SchematicsException('angular.json does not contain ' + currentPath + ' in project ' + projectName);
        }
    }
    return object;
}
//# sourceMappingURL=special-project.js.map