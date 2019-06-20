/**
 * Common constants.
 */

/**
 * xliffmerge package that will be added to package.json
 */
export const xliffmergePackage = '@ngx-i18nsupport/ngx-i18nsupport';

/**
 * Current version of @ngx-i18nsupport/xliffmerge
 * This value will be written into package.json of the project that uses ng add.
 * TODO must be changed for every new release.
 */
export const xliffmergeVersion = '^1.1.6';

/**
 * The default language (i18nLocale) when you do not specify anything.
 */
export const defaultI18nLocale = 'en';

/**
 * The default i18n format used when you do not specify anything.
 */
export const defaultI18nFormat = 'xlf';

/**
 * Name of extract script.
 * The script for default project is named this way.
 * The script for other projects is named `${extractScriptNameSuffix}-${project}`
 */
const extractScriptNameSuffix = 'extract-i18n';

/**
 * Name of extract script for a project
 * @param project name of project
 * @param isDefaultProject flag, wethe it is the default project.
 */
export function extractScriptName(project: string|null, isDefaultProject: boolean) {
    if (!project || isDefaultProject) {
        return extractScriptNameSuffix;
    } else {
        return `${extractScriptNameSuffix}-${project}`;
    }
}

/**
 * Name of xliffmerge builder.
 */
export const xliffmergeBuilderName = 'xliffmerge';

/**
 * Spec of xliffmerge builder.
 */
export const xliffmergeBuilderSpec = '@ngx-i18nsupport/tooling:' + xliffmergeBuilderName;
