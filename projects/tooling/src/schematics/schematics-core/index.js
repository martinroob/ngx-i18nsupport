"use strict";
/**
 * Collection of utility functions used in schematics.
 * (mainly copied from @ngrx schematics)
 */
Object.defineProperty(exports, "__esModule", { value: true });
const strings_1 = require("./utility/strings");
const special_strings_1 = require("./utility/special-strings");
var parse_name_1 = require("./utility/parse-name");
exports.parseName = parse_name_1.parseName;
var project_1 = require("./utility/project");
exports.getProjectPath = project_1.getProjectPath;
exports.getProject = project_1.getProject;
exports.isLib = project_1.isLib;
var config_1 = require("./utility/config");
exports.getWorkspace = config_1.getWorkspace;
exports.getWorkspacePath = config_1.getWorkspacePath;
var package_1 = require("./utility/package");
exports.addPackageToPackageJson = package_1.addPackageToPackageJson;
exports.stringUtils = {
    dasherize: strings_1.dasherize,
    decamelize: strings_1.decamelize,
    camelize: strings_1.camelize,
    classify: strings_1.classify,
    underscore: strings_1.underscore,
    group: strings_1.group,
    capitalize: strings_1.capitalize,
    featurePath: strings_1.featurePath,
    commaseparatedToArrayString: special_strings_1.commaseparatedToArrayString
};
//# sourceMappingURL=index.js.map