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
    capitalize
} from './utility/strings';

import {commaseparatedToArrayString, toArrayString} from './utility/special-strings';

export { parseName } from './utility/parse-name';
export { getProject} from './utility/project';
export { AppConfig, getWorkspace, getWorkspacePath } from './utility/config';
export { addPackageJsonDependency, getPackageJsonDependency, NodeDependency, NodeDependencyType } from './utility/dependencies';

export const stringUtils = {
    dasherize,
    decamelize,
    camelize,
    classify,
    underscore,
    capitalize,
    commaseparatedToArrayString,
    toArrayString
};
