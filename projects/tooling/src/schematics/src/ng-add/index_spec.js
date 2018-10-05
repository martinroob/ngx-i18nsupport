"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const testing_1 = require("@angular-devkit/schematics/testing");
const pathUtils = require("path");
const index_1 = require("./index");
const collectionPath = pathUtils.join(__dirname, '../collection.json');
function readAsJson(tree, path) {
    const content = tree.read(path);
    if (!content) {
        throw new Error('file ' + path + ' not found in tree');
    }
    const contentString = content.toString('UTF-8');
    return JSON.parse(contentString);
}
describe('ng-add', () => {
    const testRunner = new testing_1.SchematicTestRunner('schematics', collectionPath);
    const workspaceOptions = {
        name: 'workspace',
        newProjectRoot: 'projects',
        version: '6.0.0',
    };
    it('should throw an exception that there is no workspace when run on an empty tree', () => {
        try {
            testRunner.runSchematic('ng-add', {}, schematics_1.Tree.empty());
            fail('expected exception (no workspace found) did not occure');
        }
        catch (e) {
            expect(e.message).toContain('Could not find a workspace');
        }
    });
    describe('with project', () => {
        const appOptions = {
            name: 'bar',
            inlineStyle: false,
            inlineTemplate: false,
            routing: false,
            style: 'css',
            skipTests: false,
            skipPackageJson: false,
        };
        let appTree;
        beforeEach(() => {
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'workspace', workspaceOptions);
            appTree = testRunner.runExternalSchematic('@schematics/angular', 'application', appOptions, appTree);
        });
        it('should create xliffmerge configuration file when called without any options', () => {
            const tree = testRunner.runSchematic('ng-add', {}, appTree);
            expect(tree.files).toContain('/projects/bar/xliffmerge.json');
            const configFile = readAsJson(tree, '/projects/bar/xliffmerge.json');
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
            const packageJson = readAsJson(tree, '/package.json');
            expect(packageJson.devDependencies['@ngx-i18nsupport/xliffmerge']).toBe(index_1.xliffmergeVersion);
        });
        it('should add configurations for non default languages to angular.json', () => {
            const tree = testRunner.runSchematic('ng-add', { languages: 'en,de' }, appTree);
            expect(tree.files).toContain('/angular.json');
            const angularJson = readAsJson(tree, '/angular.json');
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
            const packageJson = readAsJson(tree, '/package.json');
            expect(packageJson).toBeTruthy();
            console.log('packageJson', packageJson);
            const extractScript = packageJson.scripts['extract-i18n'];
            expect(extractScript).toBeTruthy();
            expect(extractScript).toBe('ng xi18n --i18n-format xlf --output-path i18n --i18n-locale en && xliffmerge --profile xliffmerge.json en');
        });
    });
});
//# sourceMappingURL=index_spec.js.map