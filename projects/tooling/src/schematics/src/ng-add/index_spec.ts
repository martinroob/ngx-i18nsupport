import { Tree} from '@angular-devkit/schematics';
import {Schema as ApplicationOptions} from '@schematics/angular/application/schema';
import {Schema as LibraryOptions} from '@schematics/angular/application/schema';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import {IXliffMergeOptions} from '@ngx-i18nsupport/ngx-i18nsupport';
import * as pathUtils from 'path';
import {extractScriptName, xliffmergeBuilderName, xliffmergePackage, xliffmergeVersion} from '../common';
import {NgAddOptions} from './schema';
import {readAngularJson, readAsJson, readPackageJson, workspaceOptions, appOptions, libOptions} from '../common/common-testing_spec';
import {WorkspaceSchema} from '../../schematics-core/utility/workspace-models';
import {IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';

const collectionPath = pathUtils.join(__dirname, '../collection.json');

describe('ng-add', () => {

  const testRunner = new SchematicTestRunner('schematics', collectionPath);

  function runSchematic(options: NgAddOptions, tree: Tree): UnitTestTree {
      return testRunner.runSchematic('ng-add', options, tree);
  }

  it('should throw an exception that there is no workspace when run on an empty tree', () => {
    try {
        runSchematic({}, Tree.empty());
        fail('expected exception (no workspace found) did not occur');
    } catch (e) {
        expect(e.message).toContain('Could not find a workspace');
    }
  });

  describe('with one project', () => {

      let appTree: UnitTestTree;
      beforeEach(async () => {
          appTree = await testRunner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
          appTree = await testRunner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions, appTree).toPromise();
      });

      it('should throw an exception when called with no existing project', () => {
          try {
              runSchematic({project: 'foo'}, appTree);
              fail('expected exception (workspace contains no project named) did not occur');
          } catch (e) {
              expect(e.message).toContain('Workspace contains no project named');
          }
      });

      it('should throw an exception when called with invalid language code as default language', () => {
          try {
              runSchematic({i18nLocale: 'a,b'}, appTree);
              fail('expected exception (is not a valid language code) did not occur');
          } catch (e) {
              expect(e.message).toContain('is not a valid language code');
          }
      });

      it('should throw an exception when called with any invalid language code', () => {
          try {
              runSchematic({languages: 'a,b,x*'}, appTree);
              fail('expected exception (is not a valid language code) did not occur');
          } catch (e) {
              expect(e.message).toContain('is not a valid language code');
          }
      });

      it('should create xliffmerge configuration file when called with doNotUseBuilder option', () => {
          const tree = runSchematic({useXliffmergeBuilder: false}, appTree);
          expect(tree.files).toContain('/projects/bar/xliffmerge.json');
          const configFile = readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, '/projects/bar/xliffmerge.json');
          expect(configFile.xliffmergeOptions).toBeTruthy();
          expect(configFile.xliffmergeOptions.i18nFormat).toBe('xlf');
          expect(configFile.xliffmergeOptions.defaultLanguage).toBe('en');
          expect(configFile.xliffmergeOptions.languages).toEqual(['en']);
          expect(configFile.xliffmergeOptions.srcDir).toBe('src/i18n');
          expect(configFile.xliffmergeOptions.genDir).toBe('src/i18n');
      });

      it('should create xliffmerge configuration file with first given language as default', () => {
          const tree = runSchematic({useXliffmergeBuilder: false, languages: 'de'}, appTree);
          expect(tree.files).toContain('/projects/bar/xliffmerge.json');
          const configFile = readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, '/projects/bar/xliffmerge.json');
          expect(configFile.xliffmergeOptions).toBeTruthy();
          // de is default because it is the first in list
          expect(configFile.xliffmergeOptions.defaultLanguage).toBe('de');
          expect(configFile.xliffmergeOptions.languages).toEqual(['de']);
      });

      it('should create xliffmerge configuration file containing all given languages', () => {
          const tree = runSchematic({useXliffmergeBuilder: false, languages: 'de,fr,ru'}, appTree);
          expect(tree.files).toContain('/projects/bar/xliffmerge.json');
          const configFile = readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, '/projects/bar/xliffmerge.json');
          expect(configFile.xliffmergeOptions).toBeTruthy();
          // de is default because it is the first in list
          expect(configFile.xliffmergeOptions.defaultLanguage).toBe('de');
          expect(configFile.xliffmergeOptions.languages).toEqual(['de', 'fr', 'ru']);
      });

      it('should create xliffmerge configuration file containing all given languages and default language', () => {
          const tree = runSchematic({useXliffmergeBuilder: false, i18nLocale: 'en', languages: 'de,fr,ru'}, appTree);
          expect(tree.files).toContain('/projects/bar/xliffmerge.json');
          const configFile = readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, '/projects/bar/xliffmerge.json');
          expect(configFile.xliffmergeOptions).toBeTruthy();
          // en is default, becuase it was explicitly set
          expect(configFile.xliffmergeOptions.defaultLanguage).toBe('en');
          expect(configFile.xliffmergeOptions.languages).toEqual(['en', 'de', 'fr', 'ru']);
      });

      it('should create xliffmerge configuration with specified xlf format', () => {
          const tree = runSchematic({useXliffmergeBuilder: false, i18nLocale: 'en', i18nFormat: 'xlf2'}, appTree);
          expect(tree.files).toContain('/projects/bar/xliffmerge.json');
          const configFile = readAsJson<{xliffmergeOptions: IXliffMergeOptions}>(tree, '/projects/bar/xliffmerge.json');
          expect(configFile.xliffmergeOptions).toBeTruthy();
          expect(configFile.xliffmergeOptions.i18nFormat).toBe('xlf2');
      });

      it('should add xliffmerge dev dependency to package.json', () => {
          const tree = runSchematic( {}, appTree);
          const packageJson = readPackageJson(tree);
          expect(packageJson.devDependencies[xliffmergePackage]).toBe(xliffmergeVersion);
      });

      it('should add configurations for non default languages to angular.json', () => {
          const tree = runSchematic({languages: 'en,de'}, appTree);
          const angularJson: WorkspaceSchema = readAngularJson(tree);
          // @ts-ignore
          expect(angularJson.projects.bar.architect.build.configurations.en).toBeFalsy();
          // @ts-ignore
          expect(angularJson.projects.bar.architect.build.configurations.de).toBeTruthy();
          // @ts-ignore
          expect(angularJson.projects.bar.architect.build.configurations.de as any).toEqual({
              aot: true,
              outputPath: 'dist/bar-de',
              i18nFile: 'src/i18n/messages.de.xlf',
              i18nFormat: 'xlf',
              i18nLocale: 'de'
          });
          // @ts-ignore
          expect(angularJson.projects.bar.architect.serve.configurations.de).toBeTruthy();
          // @ts-ignore
          expect(angularJson.projects.bar.architect.serve.configurations.de).toEqual({
              browserTarget: 'bar:build:de'
          });
      });

      it('should add npm script "extract-i18n" to package.json using command line xliffmerge', () => {
          const tree = runSchematic({useXliffmergeBuilder: false}, appTree);
          const packageJson = readPackageJson(tree);
          const extractScript = packageJson.scripts[extractScriptName('bar', true)];
          expect(extractScript).toBeTruthy();
          expect(extractScript).toBe(
              'ng xi18n bar --i18n-format xlf --output-path i18n --i18n-locale en && xliffmerge --profile xliffmerge.json');
      });

      it('should add npm script "extract-i18n" to package.json including language list as command line parameter', () => {
          const tree = runSchematic({useXliffmergeBuilder: false, useCommandlineForLanguages: true, languages: 'en,de'}, appTree);
          const packageJson = readPackageJson(tree);
          const extractScript = packageJson.scripts['extract-i18n'];
          expect(extractScript).toBeTruthy();
          expect(extractScript).toBe(
              'ng xi18n bar --i18n-format xlf --output-path i18n --i18n-locale en && xliffmerge --profile xliffmerge.json en de');
      });

      it('should add npm script "start-xyz" to package.json when called with language xyz', () => {
          const lang = 'xyz';
          const tree = runSchematic({useXliffmergeBuilder: false, i18nLocale: 'de', languages: lang}, appTree);
          const packageJson = readPackageJson(tree);
          const startScriptDefaultLang = packageJson.scripts['start-de'];
          expect(startScriptDefaultLang).toBeFalsy(); // no start script for default lang needed
          const startScript = packageJson.scripts['start-' + lang];
          expect(startScript).toBeTruthy();
          expect(startScript).toBe(
              'ng serve --configuration=' + lang);
      });

      it('should add npm script "start-xyz" to package.json when called with language xyz' +
          'even if project is set, but it is the default project', () => {
          // normally, when you specify a project "bar", start script should be called start-bar-xyz
          // but if bar is the default project, it is just called start-xyz.
          const lang = 'xyz';
          const tree = runSchematic({useXliffmergeBuilder: false, i18nLocale: 'de', project: 'bar', languages: lang}, appTree);
          const packageJson = readPackageJson(tree);
          const startScriptDefaultLang = packageJson.scripts['start-de'];
          expect(startScriptDefaultLang).toBeFalsy(); // no start script for default lang needed
          const startScript = packageJson.scripts['start-' + lang];
          expect(startScript).toBeTruthy();
          expect(startScript).toBe(
              'ng serve --configuration=' + lang);
      });

      it('should configure builder with defaults when called without any parameters', () => {
          const tree = runSchematic({}, appTree);
          const angularJson = readAngularJson(tree);
          // @ts-ignore
          const builderEntry: any = angularJson.projects['bar'].architect[xliffmergeBuilderName];
          expect(builderEntry).toBeTruthy('no xliffmerge builder entry found');
          expect(builderEntry.builder).toBe('@ngx-i18nsupport/tooling:xliffmerge');
          const options: IConfigFile = builderEntry.options;
          expect(options).toBeTruthy('no xliffmerge builder options found');
          expect(options.xliffmergeOptions).toBeTruthy();
          if (options.xliffmergeOptions) {
              expect(options.xliffmergeOptions.i18nFormat).toBe('xlf');
              expect(options.xliffmergeOptions.srcDir).toBe('src/i18n');
              expect(options.xliffmergeOptions.genDir).toBe('src/i18n');
              expect(options.xliffmergeOptions.defaultLanguage).toBe('en');
              expect(options.xliffmergeOptions.languages).toEqual(['en']);
          }
      });

      it('should configure builder with given parametest', () => {
          const tree = runSchematic({i18nFormat: 'xlf2', localePath: 'xy', i18nLocale: 'de', languages: 'en,fr,ru'}, appTree);
          const angularJson = readAngularJson(tree);
          // @ts-ignore
          const builderEntry: any = angularJson.projects['bar'].architect[xliffmergeBuilderName];
          expect(builderEntry).toBeTruthy('no xliffmerge builder entry found');
          expect(builderEntry.builder).toBe('@ngx-i18nsupport/tooling:xliffmerge');
          const options: IConfigFile = builderEntry.options;
          expect(options).toBeTruthy('no xliffmerge builder options found');
          expect(options.xliffmergeOptions).toBeTruthy();
          if (options.xliffmergeOptions) {
              expect(options.xliffmergeOptions.i18nFormat).toBe('xlf2');
              expect(options.xliffmergeOptions.srcDir).toBe('src/xy');
              expect(options.xliffmergeOptions.genDir).toBe('src/xy');
              expect(options.xliffmergeOptions.defaultLanguage).toBe('de');
              expect(options.xliffmergeOptions.languages).toEqual(['de', 'en', 'fr', 'ru']);
          }
      });

      it('should add npm script "extract-i18n" to package.json using builder xliffmerge', () => {
          const tree = runSchematic({}, appTree);
          const packageJson = readPackageJson(tree);
          const extractScript = packageJson.scripts[extractScriptName('bar', true)];
          expect(extractScript).toBeTruthy();
          expect(extractScript).toBe(
              'ng xi18n bar --i18n-format xlf --output-path i18n --i18n-locale en && ng run bar:xliffmerge');
      });

      it('should add npm script "start-xyz" to package.json when called with language xyz', () => {
          const lang = 'xyz';
          const tree = runSchematic({i18nLocale: 'de', languages: lang}, appTree);
          const packageJson = readPackageJson(tree);
          const startScriptDefaultLang = packageJson.scripts['start-de'];
          expect(startScriptDefaultLang).toBeFalsy(); // no start script for default lang needed
          const startScript = packageJson.scripts['start-' + lang];
          expect(startScript).toBeTruthy();
          expect(startScript).toBe(
              'ng serve --configuration=' + lang);
      });

      it('should add npm script "start-xyz" to package.json when called with language xyz' +
          'even if project is set, but it is the default project', () => {
          // normally, when you specify a project "bar", start script should be called start-bar-xyz
          // but if bar is the default project, it is just called start-xyz.
          const lang = 'xyz';
          const tree = runSchematic({i18nLocale: 'de', project: 'bar', languages: lang}, appTree);
          const packageJson = readPackageJson(tree);
          const startScriptDefaultLang = packageJson.scripts['start-de'];
          expect(startScriptDefaultLang).toBeFalsy(); // no start script for default lang needed
          const startScript = packageJson.scripts['start-' + lang];
          expect(startScript).toBeTruthy();
          expect(startScript).toBe(
              'ng serve --configuration=' + lang);
      });
  });

    describe('with multiple projects', () => {

        const appOptions1: ApplicationOptions = Object.assign({}, appOptions, {name: 'bar'});

        const appOptions2: ApplicationOptions = Object.assign({}, appOptions, {name: 'foo'});

        const libOptions1: LibraryOptions = Object.assign({}, libOptions, {name: 'foolib'});

        let appTree: UnitTestTree;
        beforeEach(async () => {
            appTree = await testRunner.runExternalSchematicAsync('@schematics/angular', 'workspace', workspaceOptions).toPromise();
            appTree = await testRunner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions1, appTree).toPromise();
            appTree = await testRunner.runExternalSchematicAsync('@schematics/angular', 'application', appOptions2, appTree).toPromise();
            appTree = await testRunner.runExternalSchematicAsync('@schematics/angular', 'library', libOptions1, appTree).toPromise();
        });

        it('should throw an exception when called with a library project', () => {
            try {
                runSchematic({project: 'foolib'}, appTree);
                fail('expected exception (called on library) did not occur');
            } catch (e) {
                expect(e.message).toContain('Project must be of type "application"');
            }
        });

        it('should add npm script "start-foolib-xyz" to package.json when called with language xyz', () => {
            // when you specify a project "foo", start script should be called start-foo-xyz
            const lang = 'xyz';
            const tree = runSchematic({i18nLocale: 'de', project: 'foo', languages: lang}, appTree);
            const packageJson = readPackageJson(tree);
            const startScriptDefaultLang = packageJson.scripts['start-de'];
            expect(startScriptDefaultLang).toBeFalsy(); // no start script for default lang needed
            const startScript = packageJson.scripts['start-foo-' + lang];
            expect(startScript).toBeTruthy();
            expect(startScript).toBe(
                'ng serve foo --configuration=' + lang);
        });

        it('should add npm script "extract-i18n" to package.json using command line xliffmerge', () => {
            const tree = runSchematic({project: 'foo', useXliffmergeBuilder: false}, appTree);
            const packageJson = readPackageJson(tree);
            const extractScript = packageJson.scripts[extractScriptName('foo', false)];
            expect(extractScript).toBeTruthy();
            // here output-path should be src/i18n, because it is relative to project root for non default projects
            expect(extractScript).toBe(
                'ng xi18n foo --i18n-format xlf --output-path src/i18n --i18n-locale en && xliffmerge --profile xliffmerge.json');
        });

    });
});
