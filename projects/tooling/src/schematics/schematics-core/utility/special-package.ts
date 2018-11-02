/**
 * Additional package.json spefific tool functions that are not part of normal package.ts
 */

import {Tree} from '@angular-devkit/schematics';

/**
 * rudimentary interface of package.json (only what is used here).
 */
export interface IPackageJson {
    devDependencies: { [packagename: string]: string };
    scripts: { [scriptname: string]: string };
}

/**
 * Read package.json
 * @host the tree to read from
 * @return content or null, if file does not exist.
 */
export function readPackageJson(host: Tree): IPackageJson|null {
    const path = `/package.json`;
    const content = host.read(path);
    if (!content) {
        return null;
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString) as IPackageJson;
}

/**
 * Get a script with given name or null, if not existing.
 * @param host the tree to read from
 * @param scriptName name of script
 */
export function getScriptFromPackageJson(
    host: Tree,
    scriptName: string
): string | null {
    const packageJson: IPackageJson|null = readPackageJson(host);
    if (!packageJson) {
        return null;
    }
    return packageJson.scripts[scriptName];
}

/**
 * Add a script to package.json
 * @param host the tree containing package.json
 * @param scriptName name of script to be added.
 * @param content content of script
 */
export function addScriptToPackageJson(
    host: Tree,
    scriptName: string,
    content: string
): Tree {
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
