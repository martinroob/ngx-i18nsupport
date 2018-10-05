import { Rule } from '@angular-devkit/schematics';
import { NgAddOptions } from './schema';
/**
 * Current version of @ngx-i18nsupport/xliffmerge
 * This value will be written into package.json of the project that uses ng add.
 * TODO must be changed for every new release.
 */
export declare const xliffmergeVersion = "^0.19.0";
export declare function ngAdd(options: NgAddOptions): Rule;
