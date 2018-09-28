"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@angular-devkit/core");
function parseName(path, name) {
    const nameWithoutPath = core_1.basename(name);
    const namePath = core_1.dirname((path + '/' + name));
    return {
        name: nameWithoutPath,
        path: core_1.normalize('/' + namePath),
    };
}
exports.parseName = parseName;
//# sourceMappingURL=parse-name.js.map