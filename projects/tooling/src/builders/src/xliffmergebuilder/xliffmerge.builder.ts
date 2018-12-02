/**
 An Angular Builder to run xliffmerge.
 Work is based on nice blog article
 https://medium.com/dailyjs/angular-cli-6-under-the-hood-builders-demystified-f0690ebcf01 by Evgeny Barabanov
**/
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {getSystemPath} from '@angular-devkit/core';
import {Builder, BuilderConfiguration, BuilderContext, BuildEvent} from '@angular-devkit/architect';
import {XliffmergeBuilderSchema} from './schema';
import {XliffMerge, CommandOutput, WriterToString, ProgramOptions, IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';

export default class XliffmergeBuilder implements Builder<XliffmergeBuilderSchema> {

    constructor(private context: BuilderContext) {
    }

    run(builderConfig: BuilderConfiguration<Partial<XliffmergeBuilderSchema>>): Observable<BuildEvent> {
        const {xliffmergeOptions, profile} = builderConfig.options;
        console.log('xliffmergeOptions, profile', xliffmergeOptions, profile);
        let programOptions: ProgramOptions = {};
        let options: IConfigFile|undefined = {xliffmergeOptions: xliffmergeOptions};
        if (profile) {
            const root = this.context.workspace.root;
            const profilePath = `${getSystemPath(root)}/${profile}`;
            programOptions = {profilePath: profilePath};
            options = undefined;
        }
        const ws: WriterToString = new WriterToString();
        const commandOutput: CommandOutput = new CommandOutput(ws);
        const xliffmerge = XliffMerge.createFromOptions(commandOutput, programOptions, options);
        return xliffmerge.runAsync().pipe(
            map((rc) => {
                if (rc !== 0) {
                    this.context.logger.warn(`xliffmerge rc=${rc}`);
                }
                this.context.logger.info(ws.writtenData());
                return {success: true};
            }),
            catchError((error) => {
                this.context.logger.info(ws.writtenData());
                this.context.logger.error('xliffmerge failed: ' + error);
                return of({success: false});
            })
        );
    }

}
