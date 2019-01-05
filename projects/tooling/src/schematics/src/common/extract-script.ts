/**
 * This class contains all informations about the extract i18n script used in a package.json file.
 * It can create such a script and can analyze an existing script.
 */
import {extractScriptName} from './constants';
import {OptionsAfterSetup} from './options-after-setup';

export class ExtractScript {

    private static fullExtractScript(options: OptionsAfterSetup): string {
        const defaultLanguage = options.i18nLocale;
        const i18nFormat = options.i18nFormat;
        const languagesBlankSeparated = options.languages ? options.languages.replace(/,/g, ' ') : '';
        const languagesCommandLineArgument = (options.useComandlineForLanguages) ? ' ' + languagesBlankSeparated : '';
        const baseOutputPath = (options.isDefaultProject) ? '' : 'src/';
        const localeDir = options.localePath ? `${baseOutputPath}${options.localePath}` : baseOutputPath;
        if (options.useXliffmergeBuilder) {
            return `ng xi18n ${options.project} --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage}\
 && ng run ${options.project}:xliffmerge`;
        } else {
            // old style before builder
            const configFilePath = 'xliffmerge.json';
            return `ng xi18n ${options.project} --i18n-format ${i18nFormat} --output-path ${localeDir} --i18n-locale ${defaultLanguage}\
 && xliffmerge --profile ${configFilePath}${languagesCommandLineArgument}`;
        }
    }

    /**
     * Create the script.
     */
    static createExtractScript(options: OptionsAfterSetup): ExtractScript {
        return new ExtractScript(extractScriptName(options.project, options.isDefaultProject), ExtractScript.fullExtractScript(options));
    }

    constructor(private _name: string, private _content: string) {
    }

    get name(): string {
        return this._name;
    }

    get content(): string {
        return this._content;
    }

    public usesXliffmergeCommandline(): boolean {
        return /&& xliffmerge/.test(this.content);
    }

    public usesXliffmergeBuilder(): boolean {
        return /&& ng run .*:xliffmerge/.test(this.content);
    }

    public xliffmergeProfile(): string|null {
        const match = /&& xliffmerge.*(--profile|-p) ([^ ]*)/.exec(this.content);
        if (match) {
            return match[2];
        } else {
            return null;
        }
    }

    public projectName(): string|null {
        // Syntax ng xi18n <project>
        const match = /ng xi18n *([^ ]*)/.exec(this.content);
        if (match) {
            return match[1];
        } else {
            return null;
        }
    }

    /**
     * Parse languages from command line.
     * Commandline contains something like xliffmerge [options] lang1 lang2 ...
     * Returns [lang1, lang2, ..]
     * */
    public languages(): string[] {
        const startIndex = this.content.indexOf('&& xliffmerge');
        if (startIndex < 0) {
            return [];
        }
        const languages = [];
        const params = this.content.substr(startIndex + '&& xliffmerge'.length).split(/\s+/);
        for (let i = 0; i < params.length; i++) {
            const p = params[i];
            if (!p.startsWith('-') && p !== '' && !(i > 0 && (params[i - 1] === '-p' || params[i - 1] === '--profile'))) {
                languages.push(p);
            }
        }
        return languages;
    }
}
