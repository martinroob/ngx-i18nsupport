/**
 * Collection of utility functions that are deprecated in nodes util.
 */

/**
 * Replaces node isNullOrUndefined.
 */
export function isNullOrUndefined(value: any) {
    return value === undefined || value === null;
}

/**
 * Replaces node isString.
 */
export function isString(value: any) {
    return typeof value === 'string';
}

/**
 * Replaces node isBoolean.
 */
export function isBoolean(value: any) {
    return typeof value === 'boolean';
}

/**
 * Replaces node isNumber.
 */
export function isNumber(value: any) {
    return typeof value === 'number';
}

/**
 * Replaces node isArray.
 */
export function isArray(value: any) {
    return Array.isArray(value);
}
