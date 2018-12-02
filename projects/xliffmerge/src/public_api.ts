/*
 * Public API Surface of xliffmerge
 * In principle, there is only the bin file xliffmerge,
 * because this is not mentioned as a library.
 * But the tooling uses the configuration file type.
 */

// The module is here only because ng-packagr needs it
export * from './lib/xliffmerge.module';
export {IXliffMergeOptions, IConfigFile, ProgramOptions} from './xliffmerge/i-xliff-merge-options';
export {WriterToString} from './common/writer-to-string';
export {CommandOutput} from './common/command-output';
export {XliffMerge} from './xliffmerge/xliff-merge';
