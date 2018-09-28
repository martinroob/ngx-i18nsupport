/**
 * Converts a string that contains comma separated values to a string containing json array syntax.
 * Example: commaseparatedToArrayString('en,de') return '["en", "de"]'.
 * @param {string} commaSeparatedList
 * @return {string}
 */
export function commaseparatedToArrayString(commaSeparatedList: string): string {
    if (!commaSeparatedList) {
        return '[]';
    }
    const values: string[] = commaSeparatedList.split(',');
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