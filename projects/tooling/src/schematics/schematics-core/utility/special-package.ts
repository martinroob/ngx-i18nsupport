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

