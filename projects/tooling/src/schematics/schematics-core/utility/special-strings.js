"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * Converts a string that contains comma separated values to a string containing json array syntax.
 * Example: commaseparatedToArrayString('en,de') return '["en", "de"]'.
 * @param {string} commaSeparatedList
 * @return {string}
 */
function commaseparatedToArrayString(commaSeparatedList) {
    if (!commaSeparatedList) {
        return '[]';
    }
    const values = commaSeparatedList.split(',');
    let result = '[';
    for (let i = 0; i < values.length; i++) {
        if (i > 0) {
            result = result + ', ';
        }
        result = result + '"' + values[i] + '"';
    }
    result = result + ']';
    return result;
}
exports.commaseparatedToArrayString = commaseparatedToArrayString;
//# sourceMappingURL=special-strings.js.map