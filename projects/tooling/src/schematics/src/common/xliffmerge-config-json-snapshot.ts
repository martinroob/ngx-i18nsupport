import {SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';

/**
 * Read and edit functionality on xliffmerge.json
 * It allows changes on xliffmerge.json file.
 * At the end we call commit() to write angular.json.
 */
export class XliffmergeConfigJsonSnapshot {

    private readonly xliffmergeConfigJson: IConfigFile;
    private readonly configPath: string;

    /**
     * Create it.
     * Read the file xliffmerge.json
     * @param filename filename to config file (including name)
     * @param host host tree
     * @param context context (used for logging)
     * @throws SchematicsException when package.json does not exists.
     */
    constructor(filename: string, private host: Tree, private context?: SchematicContext) {
        this.configPath = filename;
        this.xliffmergeConfigJson = this.readXliffmergeConfigJson();
    }

    public getXliffmergeConfigJson(): IConfigFile {
        return this.xliffmergeConfigJson;
    }

    /**
     * Commit all changes done on workspace.
     * (writes angular.json)
     */
    public commit() {
        const newConfigJsonContent = JSON.stringify(this.xliffmergeConfigJson, null, 2);
        this.host.overwrite(this.configPath, newConfigJsonContent);
    }

    /*
    Add language configuration of newly added languages.
    This adds the new language to the xliffmerge.json config file.
    Returns the changed config file content.
     */
    public addLanguagesToXliffmergeConfiguration(
        languagesToAdd: string[]) {

        if (!this.xliffmergeConfigJson.xliffmergeOptions) {
            this.xliffmergeConfigJson.xliffmergeOptions = {};
        }
        const newLanguagesArray: string[] = [];
        const languages = this.xliffmergeConfigJson.xliffmergeOptions.languages;
        if (languages) {
            newLanguagesArray.push(...languages);
        }
        newLanguagesArray.push(...languagesToAdd);
        this.xliffmergeConfigJson.xliffmergeOptions.languages = newLanguagesArray;
        if (this.context) {
            this.context.logger.info(`changed ${this.configPath}, added languages`);
        }
    }

    /**
     * Read xliffmerge.json
     * @return content or exception, if file does not exist.
     */
    private readXliffmergeConfigJson(): IConfigFile {
        const content = this.host.read(this.configPath);
        if (!content) {
            const msg = `Did not find any configuration information (${this.configPath})`;
            if (this.context) {
                this.context.logger.fatal(msg);
            }
            throw new SchematicsException(msg);
        }
        const contentString = content.toString('UTF-8');
        return JSON.parse(contentString) as IConfigFile;
    }
}
