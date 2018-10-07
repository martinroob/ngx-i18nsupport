/**
 * Some common functions used by testcases.
 */

import {UnitTestTree} from '@angular-devkit/schematics/testing';
import {Schema as WorkspaceOptions} from '@schematics/angular/workspace/schema';
import {IPackageJson} from '../../schematics-core';
import {WorkspaceSchema} from '../../schematics-core/utility/config';
import {IXliffMergeOptions} from '@ngx-i18nsupport/ngx-i18nsupport/src/xliffmerge/i-xliff-merge-options';

export const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
};

export function readAsJson<T>(tree: UnitTestTree, path: string): T {
    const content = tree.read(path);
    if (!content) {
        throw new Error('file ' + path + ' not found in tree');
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString) as T;
}

export function readPackageJson(tree: UnitTestTree): IPackageJson {
    expect(tree.files).toContain('/package.json');
    return readAsJson<IPackageJson>(tree, '/package.json');
}

export function readAngularJson(tree: UnitTestTree): WorkspaceSchema {
    expect(tree.files).toContain('/angular.json');
    return readAsJson<WorkspaceSchema>(tree, '/angular.json');
}

export function readXliffmergeJson(projectName: string, tree: UnitTestTree): {xliffmergeOptions: IXliffMergeOptions} {
    const path = projectName ? `/projects/${projectName}/xliffmerge.json` : '/xliffmerge.json';
    expect(tree.files).toContain(path);
    return readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, path);
}

