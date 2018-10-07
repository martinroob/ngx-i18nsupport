/**
 * Options that can be used with ng addLanguage.
 */
import {CommonOptions} from '../common';

export interface AddLanguageOptions extends CommonOptions {
    // only one of language or languages must be used
    language?: string; // single language
    languages?: string; // comma separated list
}
