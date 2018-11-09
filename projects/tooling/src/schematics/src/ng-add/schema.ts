/**
 * Options that can be used with ng add @ngx-i18nsupport.
 */
import {CommonOptions} from '../common';

export interface NgAddOptions extends CommonOptions {
    localePath?: string;
    i18nFormat?: string; // the used format
    i18nLocale?: string; // the default language
    languages?: string; // comma separared list of languages
    useComandlineForLanguages?: boolean; // if set, all languages are given as command line argument to xliffmerge
                                        // if not, they are configured in xliffmerge.json (preferred variant)
}
