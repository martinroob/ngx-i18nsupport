/**
 * A generic entry in a file system.
 */
import {IFileDescriptionFile} from './i-file-description-file';
import {IFileDescriptionDirectory} from './i-file-description-directory';

export type IFileDescription = IFileDescriptionFile | IFileDescriptionDirectory;
