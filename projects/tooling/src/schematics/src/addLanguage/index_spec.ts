import { Tree } from '@angular-devkit/schematics';
import { SchematicTestRunner, UnitTestTree } from '@angular-devkit/schematics/testing';
import * as path from 'path';
import {
    readAngularJson,
    readPackageJson,
    readXliffmergeJson,
    workspaceOptions,
    appOptions,
    readXliffmergeConfigFromWorkspace
} from '../common/common-testing_spec';
import {AddLanguageOptions} from './schema';
import {WorkspaceSchema} from '../../schematics-core/utility/workspace-models';

const collectionPath = path.join(__dirname, '../collection.json');

describe('addLanguage', () => {
    const testRunner = new SchematicTestRunner('schematics', collectionPath);

    function runSchematic(options: AddLanguageOptions, tree: Tree): UnitTestTree {
        return testRunner.runSchematic('addLanguage', options, tree);
    }

    it('should throw an exception that there is no workspace when run on an empty tree', () => {
        try {
            runSchematic({}, Tree.empty());
            fail('expected exception (no workspace found) did not occur');
        } catch (e) {
            expect(e.message).toContain('Could not find a workspace');
        }
    });

    describe('with workspace without installed tooling', () => {

        let appTree: UnitTestTree;
        beforeEach(() => {
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
        });

        it('should throw an exception when called with no existing project', () => {
            try {
                runSchematic({project: 'foo'}, appTree);
                fail('expected exception (workspace contains no project named) did not occur');
            } catch (e) {
                expect(e.message).toContain('Workspace contains no project named');
            }
        });

        it('should throw an exception when called on a workspace without ngx-i18nsupport installed', () => {
            try {
                runSchematic({language: 'de'}, appTree);
                fail('expected exception (Config file "xliffmerge.json" not found.) did not occur');
            } catch (e) {
                expect(e.message).toContain('No builder configuration and also no config file');
            }
        });
    });

    describe('with one instrumented project using old style xliffmerge command line and config file', () => {

        let appTree: UnitTestTree;
        beforeEach(() => {
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
            appTree = testRunner.runSchematic('ng-add', {useXliffmergeBuilder: false}, appTree);
        });

        it('should throw an exception when called without a language', () => {
            try {
                runSchematic({}, appTree);
                fail('expected exception (At least 1 language must be specified.) did not occur');
            } catch (e) {
                expect(e.message).toContain('At least 1 language must be specified.');
            }
        });

        it('should throw an exception when called with both language and languages', () => {
            try {
                runSchematic({languages: 'a,b', language: 'c'}, appTree);
                fail('expected exception (Only language as parameter or --languages can be used, not both.) did not occur');
            } catch (e) {
                expect(e.message).toContain('Only language as parameter or --languages can be used, not both.');
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

        it('should throw an exception when trying to add the default language', () => {
            try {
                runSchematic({language: 'en'}, appTree);
                fail('expected exception (Language "en" is already configured) did not occur');
            } catch (e) {
                expect(e.message).toContain('Language "en" is already configured');
            }
        });

        it('should throw an exception when trying to add an already existing language', () => {
            // first add a language
            appTree = runSchematic({language: 'de'}, appTree);
            // then try to do it again
            try {
                appTree = runSchematic({language: 'de'}, appTree);
                fail('expected exception (Language "de" is already configured) did not occur');
            } catch (e) {
                expect(e.message).toContain('Language "de" is already configured');
            }
        });

        it('should add a language to workspace', () => {
            const lang = 'de';
            const tree = runSchematic({language: lang}, appTree);
            // there should be a start script for new language
            const packageJson = readPackageJson(tree);
            const startScript = packageJson.scripts['start-' + lang];
            expect(startScript).toBeTruthy();
            expect(startScript).toBe(
                'ng serve --configuration=' + lang);
            // there should be a build and serve configuration
            const angularJson: WorkspaceSchema = readAngularJson(tree);
            // @ts-ignore
            expect(angularJson.projects.bar.architect.build.configurations[lang]).toBeTruthy();
            // @ts-ignore
            expect(angularJson.projects.bar.architect.build.configurations[lang] as any).toEqual({
                aot: true,
                outputPath: 'dist/bar-de',
                i18nFile: 'src/i18n/messages.de.xlf',
                i18nFormat: 'xlf',
                i18nLocale: 'de'
            });
            // @ts-ignore
            expect(angularJson.projects.bar.architect.serve.configurations[lang]).toBeTruthy();
            // @ts-ignore
            expect(angularJson.projects.bar.architect.serve.configurations[lang]).toEqual({
                browserTarget: 'bar:build:de'
            });
            // there should be no addition in extract command, because it is read from xliffmerge.json
            const xliffmergeJson = readXliffmergeJson(tree, 'bar');
            expect(xliffmergeJson).toBeTruthy();
            if (xliffmergeJson && xliffmergeJson.xliffmergeOptions) {
                expect(xliffmergeJson.xliffmergeOptions.languages).toEqual(['en', 'de']);
            }
            // TODO check that it is not in extract-script
        });

    });

    describe('with one instrumented project using builder', () => {

        let appTree: UnitTestTree;
        beforeEach(() => {
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
            appTree = testRunner.runSchematic('ng-add', {}, appTree);
        });

        it('should throw an exception when called without a language', () => {
            try {
                runSchematic({}, appTree);
                fail('expected exception (At least 1 language must be specified.) did not occur');
            } catch (e) {
                expect(e.message).toContain('At least 1 language must be specified.');
            }
        });

        it('should throw an exception when called with both language and languages', () => {
            try {
                runSchematic({languages: 'a,b', language: 'c'}, appTree);
                fail('expected exception (Only language as parameter or --languages can be used, not both.) did not occur');
            } catch (e) {
                expect(e.message).toContain('Only language as parameter or --languages can be used, not both.');
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

        it('should throw an exception when trying to add the default language', () => {
            try {
                runSchematic({language: 'en'}, appTree);
                fail('expected exception (Language "en" is already configured) did not occur');
            } catch (e) {
                expect(e.message).toContain('Language "en" is already configured');
            }
        });

        it('should throw an exception when trying to add an already existing language', () => {
            // first add a language
            appTree = runSchematic({language: 'de'}, appTree);
            // then try to do it again
            try {
                runSchematic({language: 'de'}, appTree);
                fail('expected exception (Language "de" is already configured) did not occur');
            } catch (e) {
                expect(e.message).toContain('Language "de" is already configured');
            }
        });

        it('should add a language to workspace', () => {
            const lang = 'de';
            const tree = runSchematic({language: lang}, appTree);
            // there should be a start script for new language
            const packageJson = readPackageJson(tree);
            const startScript = packageJson.scripts['start-' + lang];
            expect(startScript).toBeTruthy();
            expect(startScript).toBe(
                'ng serve --configuration=' + lang);
            // there should be a build and serve configuration
            const angularJson: WorkspaceSchema = readAngularJson(tree);
            // @ts-ignore
            expect(angularJson.projects.bar.architect.build.configurations[lang]).toBeTruthy();
            // @ts-ignore
            expect(angularJson.projects.bar.architect.build.configurations[lang] as any).toEqual({
                aot: true,
                outputPath: 'dist/bar-de',
                i18nFile: 'src/i18n/messages.de.xlf',
                i18nFormat: 'xlf',
                i18nLocale: 'de'
            });
            // @ts-ignore
            expect(angularJson.projects.bar.architect.serve.configurations[lang]).toBeTruthy();
            // @ts-ignore
            expect(angularJson.projects.bar.architect.serve.configurations[lang]).toEqual({
                browserTarget: 'bar:build:de'
            });
            // there should be no addition in extract command, because it is read from xliffmerge.json
            const xliffmergeJson = readXliffmergeConfigFromWorkspace(tree, 'bar');
            expect(xliffmergeJson).toBeTruthy();
            if (xliffmergeJson && xliffmergeJson.xliffmergeOptions) {
                expect(xliffmergeJson.xliffmergeOptions.languages).toEqual(['en', 'de']);
            }
        });

    });
});
