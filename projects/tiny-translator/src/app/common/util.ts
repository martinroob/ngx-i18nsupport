/**
 * Sammlung einfacher Hilfsfunktionen, die man ab und an mal braucht.
 */

/**
 * Ersatz für deprecated node isNullOrUndefined-Funktion.
 * @param value
 * @return {boolean}
 */
export function isNullOrUndefined(value: any) {
    return value === undefined || value === null;
}

/**
 * Ersatz für deprecated node isString-Funktion.
 * @param value
 * @return {boolean}
 */
export function isString(value: any) {
    return typeof value === 'string';
}

/**
 * Ersatz für deprecated node isBoolean-Funktion.
 * @param value
 * @return {boolean}
 */
export function isBoolean(value: any) {
    return typeof value === 'boolean';
}

/**
 * Ersatz für deprecated node isNumber-Funktion.
 * @param value
 * @return {boolean}
 */
export function isNumber(value: any) {
    return typeof value === 'number';
}

/**
 * Ersatz für deprecated node isArray-Funktion.
 * @param value
 * @return {boolean}
 */
export function isArray(value: any) {
    return Array.isArray(value);
}

/**
 * Function to filter out duplicates.
 * Usage: anArray.filter( onlyUnique )
 * @param value
 * @param index
 * @param self
 * @return {boolean}
 */
export function onlyUnique(value, index, self) {
    return self.indexOf(value) === index;
}

/**
 * Liste als kommaseparierter String.
 * @param {string[]} list
 * @return {string}
 */
export function asCommaSeparatedList(list: string[]): string {
    if (isNullOrUndefined(list)) {
        return '';
    }
    let result = '';
    for (let i = 0; i < list.length; i++) {
        if (i > 0) {
            result = result + ',';
        }
        result = result + list[i];
    }
    return result;
}
