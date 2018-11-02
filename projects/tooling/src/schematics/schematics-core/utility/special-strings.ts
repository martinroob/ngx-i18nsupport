/**
 * Some additional helper string functions.
 */

/**
 * Converts a string that contains comma separated values to a string containing json array syntax.
 * Example: commaseparatedToArrayString('en,de') return '["en", "de"]'.
 * @param commaSeparatedList the list string
 * @return the formatted string
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
/**
 * Converts a string[] that contains some values to a string containing json array syntax.
 * Example: toArrayString(['en', 'de']) return '["en", "de"]'.
 * @param values the strings to be formatted
 * @return the formatted string
 */
export function toArrayString(values: string[]): string {
    if (!values) {
        return '[]';
    }
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
