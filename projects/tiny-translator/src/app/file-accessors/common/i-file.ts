/**
 * A file loaded from any source (Upload, GitHub, ..)
 */
import {IFileDescription} from './i-file-description';

export interface IFile {
    description: IFileDescription; // all infos from where the file was loaded
    name: string; // name of file
    size: number; // size in bytes
    content: string; // content of file
}
