import {IFileDescription} from './i-file-description';
import {SerializationService} from '../../model/serialization.service';

/**
 * A file loaded from any source (Upload, GitHub, ..)
 */
export interface IFile {
    description: IFileDescription; // all infos from where the file was loaded
    size: number; // size in bytes
    content: string; // content of file

    /**
     * Return a string representation of translation file content.
     * This will be stored in BackendService.
     */
    serialize(serializationService: SerializationService): string;

    /**
     * Return a copy that has some edited content.
     * @param newContent the changed content
     */
    copyWithNewContent(newContent: string): IFile;

    /**
     * Create a copy that can be stored under a new location.
     * @param saveAs new location to save file
     */
    copyForNewDescription(saveAs: IFileDescription): IFile;

}
