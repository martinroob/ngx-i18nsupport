import {FileAccessorType} from './file-accessor-type';
import {SerializationService} from '../../model/serialization.service';
import {IFileDescription} from './i-file-description';

/**
 * A generic configuration of a file access service.
 * It contains informations like access tokens, directory names, etc.
 * The details depend on the concrete file accessor.
 */
export interface IFileAccessConfiguration {
    type: FileAccessorType;
    id?: string; // id is auto set when stored

    /**
     * Test for equality.
     * They are equal if they describe the same storage position.
     * @param another file description
     */
    equals(another: IFileAccessConfiguration): boolean;

    /**
     * Return a short text that describes the configuration.
     * This is used in the GUI to show available configurations.
     */
    shortLabel(): string;

    /**
     * Return a full text that describes the configuation including its full storage path.
     * This is used in the GUI in the saveAs dialogs.
     * Can also return an icon to be show (must be a name of a mat-icon or an existing file under assets.
     * The label returned must contain enough information to show the user the full storage location.
     */
    fullLabel(): {maticon?: string; icon?: string; label: string};

    /**
     * Return a string representation of translation file content.
     * This will be stored in BackendService.
     */
    serialize(serializationService: SerializationService): string;

    /**
     * return the root directory.
     */
    rootDescription(): IFileDescription;

    /**
     * Return a directory with the given path
     */
    directoryDescription(dirPath: string): IFileDescription;

    /**
     * Check, wether a publish is possible.
     */
    canPublish(): boolean;

    /**
     * Create a copy.
     */
    copy(): IFileAccessConfiguration;
}
