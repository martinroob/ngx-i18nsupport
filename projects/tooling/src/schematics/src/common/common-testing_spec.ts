/**
 * Some common functions used by testcases.
 */

import {UnitTestTree} from '@angular-devkit/schematics/testing';
import {Schema as WorkspaceOptions} from '@schematics/angular/workspace/schema';
import {Schema as ApplicationOptions, Style} from '@schematics/angular/application/schema';
import {Schema as LibraryOptions} from '@schematics/angular/library/schema';
import {IPackageJson} from './package-json-snapshot';
import {WorkspaceSchema} from '../../schematics-core/utility/workspace-models';
import {IXliffMergeOptions} from '@ngx-i18nsupport/ngx-i18nsupport';
import {WorkspaceSnaphot} from './workspace-snapshot';

export const workspaceOptions: WorkspaceOptions = {
    name: 'workspace',
    newProjectRoot: 'projects',
    version: '6.0.0',
};

export const appOptions: ApplicationOptions = {
    name: 'bar',
    experimentalIvy: false,
    inlineStyle: false,
    inlineTemplate: false,
    minimal: true,
    routing: false,
    style: Style.Css,
    skipTests: true,
    skipPackageJson: true,
};

export const libOptions: LibraryOptions = {
    name: 'bar',
    entryFile: 'public_api',
    prefix: 'lib',
    skipPackageJson: true,
    skipInstall: true,
    skipTsConfig: true
};

export function readAsJson<T>(tree: UnitTestTree, path: string): T {
    const content = tree.read(path);
    if (!content) {
        throw new Error('file ' + path + ' not found in tree');
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString) as T;
}

export function readPackageJson(tree: UnitTestTree, projectName?: string): IPackageJson {
    const path = (!projectName) ? '' : '/' + projectName;
    expect(tree.files).toContain(`${path}/package.json`);
    return readAsJson<IPackageJson>(tree, `${path}/package.json`);
}

export function readAngularJson(tree: UnitTestTree): WorkspaceSchema {
    expect(tree.files).toContain('/angular.json');
    return readAsJson<WorkspaceSchema>(tree, '/angular.json');
}

export function readXliffmergeJson(tree: UnitTestTree, projectName: string): {xliffmergeOptions: IXliffMergeOptions} {
    const path = projectName ? `/projects/${projectName}/xliffmerge.json` : '/xliffmerge.json';
    expect(tree.files).toContain(path);
    return readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, path);
}

/**
 * Read the xliffmerge configuration form the builder options.
 * @param tree Tree
 * @param projectName name of project
 */
export function readXliffmergeConfigFromWorkspace(tree: UnitTestTree, projectName: string): {xliffmergeOptions: IXliffMergeOptions}|null {
    const ws = new WorkspaceSnaphot(tree);
    return ws.getActualXliffmergeConfigFromWorkspace(projectName);
}
