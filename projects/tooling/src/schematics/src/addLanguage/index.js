"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// You don't have to export the function as default. You can also have more than one rule factory
// per file.
function addLanguage(_options) {
    return (tree, _context) => {
        tree.create('added.txt', 'Hello World!, added lang is ' + _options.language);
        return tree;
    };
}
exports.addLanguage = addLanguage;
//# sourceMappingURL=index.js.map