import {experimental, getSystemPath, join, normalize, Path, schema} from '@angular-devkit/core';
import {TestingArchitectHost, TestProjectHost} from '@angular-devkit/architect/testing';
import {WorkspaceNodeModulesArchitectHost} from '@angular-devkit/architect/node';
import {Architect} from '@angular-devkit/architect';

/**
 * We are using a test workspace from the test folder.
 * In this workspace the xliffmerge builder is already configured.
 */
const ngxi18nsupportRoot = normalize(join(normalize(__dirname), '../../../..'));
export const workspaceRoot = join(
  ngxi18nsupportRoot,
  'src/builders/test/hello-world-app/',
);
export const host = new TestProjectHost(workspaceRoot);
export const outputPath: Path = normalize('dist');

export async function createArchitect(wsRoot: Path) {
  const registry = new schema.CoreSchemaRegistry();
  registry.addPostTransform(schema.transforms.addUndefinedDefaults);
  const workspaceSysPath = getSystemPath(wsRoot);

  const workspace = await experimental.workspace.Workspace.fromPath(host, host.root(), registry);
  const architectHost = new TestingArchitectHost(
    workspaceSysPath,
    workspaceSysPath,
    new WorkspaceNodeModulesArchitectHost(workspace, workspaceSysPath),
  );
  const architect = new Architect(architectHost, registry);

  return {
    workspace,
    architectHost: architectHost,
    architect,
  };
}
