/**
 * Additional package.json spefific tool functions that are not part of normal package.ts
 */

import {SchematicContext, SchematicsException, Tree} from '@angular-devkit/schematics';
import {OptionsAfterSetup} from './options-after-setup';
import {extractScriptName} from './constants';
import {ExtractScript} from './extract-script';

/**
 * rudimentary interface of package.json (only what is used here).
 */
export interface IPackageJson {
    devDependencies: { [packagename: string]: string };
    scripts: { [scriptname: string]: string };
}

/**
 * Read and edit functionality on package.json
 * It allows multiple changes on package.json file.
 * At the end we call commit() to write angular.json.
 */
export class PackageJsonSnapshot {

    private readonly packageJson: IPackageJson;

    /**
     * Create it.
     * Read the file package.json
     * @param _path path where package.json is expected.
     * @param host host tree
     * @param context context (used for logging)
     * @throws SchematicsException when package.json does not exists.
     */
    constructor(private _path: string, private host: Tree, private context?: SchematicContext) {
        this.packageJson = this.readPackageJson();
    }

    /**
     * Patht of package json.
     */
    public path(): string {
        return this._path;
    }

    /**
     * Actual content of package json.
     */
    public content(): string {
        return JSON.stringify(this.packageJson, null, 2);
    }

    /**
     * Commit all changes done on workspace.
     * (writes angular.json)
     */
    public commit() {
        this.host.overwrite(`${this._path}/package.json`, this.content());
    }

    /**
     * Get a script with given name or null, if not existing.
     * @param scriptName name of script
     * @return content of script
     */
    public getScript(
        scriptName: string
    ): string | null {
        return this.packageJson.scripts[scriptName];
    }

    /**
     * Get the extract script, if contained in package.json.
     */
    public getExtractScriptForProject(project: string|null, isDefaultProject: boolean): ExtractScript|null {
        const scriptname = extractScriptName(project, isDefaultProject);
        const content = this.getScript(scriptname);
        if (content) {
            return new ExtractScript(scriptname, content);
        } else {
            return null;
        }
    }

    /**
     * Add a script to package.json
     * @param scriptName name of script to be added.
     * @param content content of script
     */
    public addOrReplaceScript(
        scriptName: string,
        content: string
    ) {
        const scriptsSection = 'scripts';
        if (!this.packageJson[scriptsSection]) {
            this.packageJson[scriptsSection] = {};
        }
        const isOverride = !!this.packageJson[scriptsSection][scriptName];
        this.packageJson[scriptsSection][scriptName] = content;
        if (this.context) {
            if (isOverride) {
                this.context.logger.info(`changed script ${scriptName} in ${this._path}/package.json`);
            } else {
                this.context.logger.info(`added script ${scriptName} to ${this._path}/package.json`);
            }
       }
    }

    /**
     * Remove a script from package.json
     * @param scriptName name of script to be removed.
     */
    public removeScript(scriptName: string) {
        const scriptsSection = 'scripts';
        if (!this.packageJson[scriptsSection]) {
            return;
        }
        const exists = !!this.packageJson[scriptsSection][scriptName];
        if (exists) {
            delete this.packageJson[scriptsSection][scriptName];
        }
        if (this.context) {
            if (exists) {
                this.context.logger.info(`removed script ${scriptName} from ${this._path}/package.json`);
            }
        }
    }

    public addExtractScript(options: OptionsAfterSetup) {
        const extractScript = ExtractScript.createExtractScript(options);
        this.addOrReplaceScript(
            extractScript.name,
            extractScript.content
        );
        if (this.context) {
            this.context.logger.info(`added npm script to extract i18n message, run "npm run ${extractScript.name}" for extraction`);
        }
    }

    /*
    change extract script "extract-i18n" to contain newly added languages.
     */
    public changeExtractScript(options: OptionsAfterSetup) {
        // check wether it is changed
        const existingScriptContent = this.getScript(extractScriptName(options.project, options.isDefaultProject));
        const extractScript = ExtractScript.createExtractScript(options);
        if (existingScriptContent !== extractScript.content) {
            this.addOrReplaceScript(
                extractScript.name,
                extractScript.content
            );
            if (this.context) {
                this.context.logger.info(
                    `changed npm script to extract i18n message, run "npm run ${extractScript.name}" for extraction`);
            }
        }
    }

    /**
     * Add a start script.
     * Script will be named 'start-<language>' or 'start-<project>-<language'.
     * @param options options options containing project etc.
     * @param language language to be added.
     */
    public addStartScript(options: OptionsAfterSetup, language: string) {
        const scriptName = (options.isDefaultProject) ? `start-${language}` : `start-${options.project}-${language}`;
        this.addOrReplaceScript(
            scriptName,
            this.startScript(options, language)
        );
        if (this.context) {
            this.context.logger.info(`added npm script to start app for language ${language}, run "npm run ${scriptName}"`);
        }
    }

    /**
     * returns the start script to be added.
     */
    private startScript(options: OptionsAfterSetup, language: string): string {
        if (options.isDefaultProject) {
            return `ng serve --configuration=${language}`;
        } else {
            return `ng serve ${options.project} --configuration=${language}`;
        }
    }

    /**
     * Read package.json
     * @host the tree to read from
     * @return content or null, if file does not exist.
     */
    private readPackageJson(): IPackageJson {
        const packageJsonPath = `${this._path}/package.json`;
        const content = this.host.read(packageJsonPath);
        if (!content) {
            throw new SchematicsException(`${packageJsonPath} does not exist`);
        }
        const contentString = content.toString('UTF-8');
        return JSON.parse(contentString) as IPackageJson;
    }
}
