import { Tree, SchematicContext } from '@angular-devkit/schematics';
/**
 * Add a configuration to anguar.json.
 * Configuration is stored under architect.build.configurations
 * @param host Host (Tree)
 * @param context Context
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
export declare function addArchitectBuildConfigurationToProject(host: Tree, context: SchematicContext, projectName: string, configurationName: string, configuration: any): Tree;
/**
 * Add a configuration to anguar.json.
 * Configuration is stored under architect.serve.configurations
 * @param host Host (Tree)
 * @param context Context
 * @param projectName Name of project
 * @param configurationName Name of configuration to add
 * @param configuration configuration object
 */
export declare function addArchitectServeConfigurationToProject(host: Tree, context: SchematicContext, projectName: string, configurationName: string, configuration: any): Tree;
