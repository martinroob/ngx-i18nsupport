import { Tree } from '@angular-devkit/schematics';
export interface WorkspaceProject {
    root: string;
    projectType: string;
}
export declare function getProject(host: Tree, options: {
    project?: string | undefined;
    path?: string | undefined;
}): WorkspaceProject;
export declare function getProjectPath(host: Tree, options: {
    project?: string | undefined;
    path?: string | undefined;
}): string;
export declare function isLib(host: Tree, options: {
    project?: string | undefined;
    path?: string | undefined;
}): boolean;
