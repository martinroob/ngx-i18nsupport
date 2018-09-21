"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// You don't have to export the function as default. You can also have more than one rule factory
// per file.
function ngAdd(_options) {
    return (tree, _context) => {
        tree.create('hello.txt', 'Hello World!');
        return tree;
    };
}
exports.ngAdd = ngAdd;
//# sourceMappingURL=index.js.map