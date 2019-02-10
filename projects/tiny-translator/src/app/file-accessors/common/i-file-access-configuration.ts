/**
 * A generic configuration of a file access service.
 * It contains informations like access tokens, directory names, etc.
 * The details depend on the concrete file accessor.
 */
import {FileAccessorType} from './file-accessor-type';
import {IFileDescriptionDirectory} from './i-file-description-directory';

export interface IFileAccessConfiguration {
    type: FileAccessorType;
    id?: string; // id is auto set when stored
    label: string;
    rootDescription(): IFileDescriptionDirectory;
}
