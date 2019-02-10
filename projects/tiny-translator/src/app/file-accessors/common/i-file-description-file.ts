/**
 * A generic description of a "file".
 * It contains enough information to load and save it.
 */
import {FileAccessorType} from './file-accessor-type';
import {IFileAccessConfiguration} from './i-file-access-configuration';

export interface IFileDescriptionFile {
    readonly type: 'file';
    configuration: IFileAccessConfiguration;
    name: string;
}
