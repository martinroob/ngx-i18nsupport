"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const schematics_1 = require("@angular-devkit/schematics");
const testing_1 = require("@angular-devkit/schematics/testing");
const path = require("path");
const collectionPath = path.join(__dirname, '../collection.json');
describe('addLanguage', () => {
    it('works', () => {
        const runner = new testing_1.SchematicTestRunner('schematics', collectionPath);
        const tree = runner.runSchematic('addLanguage', {}, schematics_1.Tree.empty());
        expect(tree.files).toEqual(['/added.txt']);
    });
});
//# sourceMappingURL=index_spec.js.map