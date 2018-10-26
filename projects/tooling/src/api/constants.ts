/**
 * Created by roobm on 08.05.2017.
 * Some constant values used in the API.
 */

/**
 * supported file formats
 */
export const FORMAT_XLIFF12: string = 'xlf';
export const FORMAT_XLIFF20: string = 'xlf2';
export const FORMAT_XMB: string = 'xmb';
export const FORMAT_XTB: string = 'xtb';

/**
 * File types
 * (returned by fileType() method)
 */
export const FILETYPE_XLIFF12: string = 'XLIFF 1.2';
export const FILETYPE_XLIFF20: string = 'XLIFF 2.0';
export const FILETYPE_XMB: string = 'XMB';
export const FILETYPE_XTB: string = 'XTB';

/**
 * abstract state value.
 * There are only 3 supported state values.
 * @type {string}
 */

/**
 * State NEW.
 * Signals an untranslated unit.
 * @type {string}
 */
export const STATE_NEW: string = 'new';
/**
 * State TRANSLATED.
 * Signals a translated unit, that is not reviewed until now.
 * @type {string}
 */
export const STATE_TRANSLATED: string = 'translated';
/**
 * State FINAL.
 * Signals a translated unit, that is reviewed and ready for use.
 * @type {string}
 */
export const STATE_FINAL: string = 'final';

/**
 * Normalizaton message formats.
 * @type {string}
 */

/**
 * Default format, contains placeholders, html markup.
 * @type {string}
 */
export const NORMALIZATION_FORMAT_DEFAULT = 'default';

/**
 * Format for usage in ngxtranslate messages.
 * Placeholder are in the form {{n}}, no html markup.
 * @type {string}
 */
export const NORMALIZATION_FORMAT_NGXTRANSLATE = 'ngxtranslate';
