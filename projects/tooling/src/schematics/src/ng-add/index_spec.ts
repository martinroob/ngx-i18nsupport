import { Tree} from '@angular-devkit/schematics';
import {Schema as WorkspaceOptions} from '@schematics/angular/workspace/schema';
import {Schema as ApplicationOptions} from '@schematics/angular/application/schema';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import {IXliffMergeOptions} from '@ngx-i18nsupport/ngx-i18nsupport/src/xliffmerge/i-xliff-merge-options';
import * as pathUtils from 'path';
import {xliffmergeVersion} from './index';

const collectionPath = pathUtils.join(__dirname, '../collection.json');

function readAsJson<T>(tree: Tree, path: string): T {
    const content = tree.read(path);
    if (!content) {
        throw new Error('file ' + path + ' not found in tree');
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString) as T;
}

describe('ng-add', () => {

  const testRunner = new SchematicTestRunner('schematics', collectionPath);

  const workspaceOptions: WorkspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
  };

  it('should throw an exception that there is no workspace when run on an empty tree', () => {
    try {
        testRunner.runSchematic('ng-add', {}, Tree.empty());
        fail('expected exception (no workspace found) did not occure');
    } catch (e) {
        expect(e.message).toContain('Could not find a workspace');
    }
  });

  describe('with project', () => {

      const appOptions: ApplicationOptions = {
          name: 'bar',
          inlineStyle: false,
          inlineTemplate: false,
          routing: false,
          style: 'css',
          skipTests: false,
          skipPackageJson: false,
      };

      let appTree: UnitTestTree;
      beforeEach(() => {
          appTree = testRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
          appTree = testRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
      });

      it('should create xliffmerge configuration file when called without any options', () => {
          const tree = testRunner.runSchematic('ng-add', {}, appTree);
          expect(tree.files).toContain('/projects/bar/xliffmerge.json');
          const configFile = readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, '/projects/bar/xliffmerge.json');
          expect(configFile.xliffmergeOptions).toBeTruthy();
          expect(configFile.xliffmergeOptions.i18nFormat).toBe('xlf');
          expect(configFile.xliffmergeOptions.defaultLanguage).toBe('en');
          expect(configFile.xliffmergeOptions.languages).toEqual(['en']);
          expect(configFile.xliffmergeOptions.srcDir).toBe('src/i18n');
          expect(configFile.xliffmergeOptions.genDir).toBe('src/i18n');
      });

      it('should add xliffmerge dev dependency to package.json', () => {
          const tree = testRunner.runSchematic('ng-add', {}, appTree);
          expect(tree.files).toContain('/package.json');
          const packageJson = readAsJson<any>(tree, '/package.json');
          expect(packageJson.devDependencies['@ngx-i18nsupport/xliffmerge']).toBe(xliffmergeVersion);
      });

      it('should add configurations for non default languages to angular.json', () => {
          const tree = testRunner.runSchematic('ng-add', {languages: 'en,de'}, appTree);
          expect(tree.files).toContain('/angular.json');
          const angularJson = readAsJson<any>(tree, '/angular.json');
          expect(angularJson).toBeTruthy();
          expect(angularJson.projects.bar.architect.build.configurations.en).toBeFalsy();
          expect(angularJson.projects.bar.architect.build.configurations.de).toBeTruthy();
          expect(angularJson.projects.bar.architect.build.configurations.de).toEqual({
              aot: true,
              outputPath: 'dist/bar-de',
              i18nFile: 'src/i18n/messages.de.xlf',
              i18nFormat: 'xlf',
              i18nLocale: 'de'
          });
          expect(angularJson.projects.bar.architect.serve.configurations.de).toBeTruthy();
          expect(angularJson.projects.bar.architect.serve.configurations.de).toEqual({
              browserTarget: 'bar:build:de'
          });
      });

      it('should add npm script "extract-i18n" to package.json', () => {
          const tree = testRunner.runSchematic('ng-add', {}, appTree);
          expect(tree.files).toContain('/package.json');
          const packageJson = readAsJson<any>(tree, '/package.json');
          expect(packageJson).toBeTruthy();
          const extractScript = packageJson.scripts['extract-i18n'];
          expect(extractScript).toBeTruthy();
          expect(extractScript).toBe(
              'ng xi18n --i18n-format xlf --output-path i18n --i18n-locale en && xliffmerge --profile xliffmerge.json en');
      });
  });
});
