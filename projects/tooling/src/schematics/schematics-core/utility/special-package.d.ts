/**
 * Adds a script to the package.json
 */
import { Tree } from '@angular-devkit/schematics';
/**
 * Add a script to package.json
 * @param host
 * @param scriptName
 * @param content
 */
export declare function addScriptToPackageJson(host: Tree, scriptName: string, content: string): Tree;
