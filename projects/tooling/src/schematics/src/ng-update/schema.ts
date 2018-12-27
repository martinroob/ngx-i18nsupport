/**
 * Options that can be used with ng update @ngx-i18nsupport.
 */
import {CommonOptions} from '../common';

export interface NgUpdateOptions extends CommonOptions {
    useXliffmergeBuilder?: boolean; // use builder if true
}
