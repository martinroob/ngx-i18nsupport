/**
 * Collection of utility functions used in schematics.
 * (mainly copied from @ngrx schematics)
 */

import {
    dasherize,
    decamelize,
    camelize,
    classify,
    underscore,
    group,
    capitalize,
    featurePath,
} from './utility/strings';

import {commaseparatedToArrayString} from './utility/special-strings';

export { parseName } from './utility/parse-name';
export { getProjectPath, getProject, isLib } from './utility/project';
export { AppConfig, getWorkspace, getWorkspacePath } from './utility/config';
export { addPackageToPackageJson } from './utility/package';
export {addScriptToPackageJson} from './utility/special-package';
export {addArchitectBuildConfigurationToProject, addArchitectServeConfigurationToProject} from './utility/special-project';

export const stringUtils = {
    dasherize,
    decamelize,
    camelize,
    classify,
    underscore,
    group,
    capitalize,
    featurePath,
    commaseparatedToArrayString
};
