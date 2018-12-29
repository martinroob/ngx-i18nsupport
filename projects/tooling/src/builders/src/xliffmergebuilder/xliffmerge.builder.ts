/**
 An Angular Builder to run xliffmerge.
 Work is based on nice blog article
 https://medium.com/dailyjs/angular-cli-6-under-the-hood-builders-demystified-f0690ebcf01 by Evgeny Barabanov
**/
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {asWindowsPath, getSystemPath, join, Path} from '@angular-devkit/core';
import {Builder, BuilderConfiguration, BuilderContext, BuildEvent} from '@angular-devkit/architect';
import {XliffmergeBuilderSchema} from './schema';
import {XliffMerge, CommandOutput, WriterToString, ProgramOptions, IXliffMergeOptions, IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';
import {isAbsolute} from 'path';

export class XliffmergeBuilder implements Builder<XliffmergeBuilderSchema> {

    constructor(private context: BuilderContext) {
    }

    run(builderConfig: BuilderConfiguration<Partial<XliffmergeBuilderSchema>>): Observable<BuildEvent> {
        const programOptions: ProgramOptions = this.createProgramOptionsFromConfig(builderConfig);
        const options: IConfigFile|undefined = (programOptions.profilePath) ?
            undefined :
            this.createProfileContentFromConfig(builderConfig);
        const ws: WriterToString = new WriterToString();
        const commandOutput: CommandOutput = new CommandOutput(ws);
        const xliffmerge = XliffMerge.createFromOptions(commandOutput, programOptions, options);
        return xliffmerge.runAsync().pipe(
            map((rc) => {
                const success = (rc === 0);
                if (!success) {
                    this.context.logger.warn(`xliffmerge rc=${rc}`);
                }
                this.context.logger.info(ws.writtenData());
                return {success: success};
            }),
            catchError((error) => {
                this.context.logger.info(ws.writtenData());
                this.context.logger.error('xliffmerge failed: ' + error);
                return of({success: false});
            })
        );
    }

    createProgramOptionsFromConfig(builderConfig: BuilderConfiguration<Partial<XliffmergeBuilderSchema>>): ProgramOptions {
        const profile = builderConfig.options.profile;
        if (profile) {
            const root = this.context.workspace.root;
            const profilePath = `${getSystemPath(root)}/${profile}`;
            return {profilePath: profilePath};
        } else {
            return {};
        }
    }

    createProfileContentFromConfig(builderConfig: BuilderConfiguration<Partial<XliffmergeBuilderSchema>>): IConfigFile|undefined {
        const xliffmergeOptions: IXliffMergeOptions|undefined = builderConfig.options.xliffmergeOptions;
        if (xliffmergeOptions) {
            const wsRoot: Path = this.context.workspace.root;
            // replace all pathes in options by absolute paths
            xliffmergeOptions.srcDir = this.adjustPathToWorkspaceRoot(wsRoot, xliffmergeOptions.srcDir);
            xliffmergeOptions.genDir = this.adjustPathToWorkspaceRoot(wsRoot, xliffmergeOptions.genDir);
            xliffmergeOptions.apikeyfile = this.adjustPathToWorkspaceRoot(wsRoot, xliffmergeOptions.apikeyfile);
            return {xliffmergeOptions: xliffmergeOptions};
        } else {
            return undefined;
        }
    }

    private adjustPathToWorkspaceRoot(wsRoot: Path, pathToAdjust: string | undefined): string | undefined {
        if (!pathToAdjust || isAbsolute(pathToAdjust)) {
            return pathToAdjust;
        }
        const adjustedPath = join(wsRoot, pathToAdjust);
        return (process.platform === 'win32') ? asWindowsPath(adjustedPath) : adjustedPath;
    }
}

export default XliffmergeBuilder;

