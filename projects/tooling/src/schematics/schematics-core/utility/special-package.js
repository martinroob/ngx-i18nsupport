"use strict";
/**
 * Adds a script to the package.json
 */
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Add a script to package.json
 * @param host
 * @param scriptName
 * @param content
 */
function addScriptToPackageJson(host, scriptName, content) {
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
exports.addScriptToPackageJson = addScriptToPackageJson;
//# sourceMappingURL=special-package.js.map