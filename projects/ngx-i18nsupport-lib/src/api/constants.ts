/**
 * Created by roobm on 08.05.2017.
 * Some constant values used in the API.
 */

/**
 * supported file formats
 */
export const FORMAT_XLIFF12 = 'xlf';
export const FORMAT_XLIFF20 = 'xlf2';
export const FORMAT_XMB = 'xmb';
export const FORMAT_XTB = 'xtb';

/**
 * File types
 * (returned by fileType() method)
 */
export const FILETYPE_XLIFF12 = 'XLIFF 1.2';
export const FILETYPE_XLIFF20 = 'XLIFF 2.0';
export const FILETYPE_XMB = 'XMB';
export const FILETYPE_XTB = 'XTB';

/**
 * abstract state value.
 * There are only 3 supported state values.
 */

/**
 * State NEW.
 * Signals an untranslated unit.
 */
export const STATE_NEW = 'new';
/**
 * State TRANSLATED.
 * Signals a translated unit, that is not reviewed until now.
 */
export const STATE_TRANSLATED = 'translated';
/**
 * State FINAL.
 * Signals a translated unit, that is reviewed and ready for use.
 */
export const STATE_FINAL = 'final';

/**
 * Normalizaton message formats.
 */

/**
 * Default format, contains placeholders, html markup.
 */
export const NORMALIZATION_FORMAT_DEFAULT = 'default';

/**
 * Format for usage in ngxtranslate messages.
 * Placeholder are in the form {{n}}, no html markup.
 */
export const NORMALIZATION_FORMAT_NGXTRANSLATE = 'ngxtranslate';
