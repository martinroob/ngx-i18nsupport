/**
 * A directory loaded from any source (GitHub, ..)
 */
import {IFileDescription} from './i-file-description';
import {IFileAccessConfiguration} from './i-file-access-configuration';

export interface IFileDescriptionDirectory {
    readonly type: 'dir';
    configuration: IFileAccessConfiguration;
    name: string;
    children?: IFileDescription[]; // undefined if children are not loaded until now
}
