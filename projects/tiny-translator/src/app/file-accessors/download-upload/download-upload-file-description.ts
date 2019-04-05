import {SerializationService} from '../../model/serialization.service';
import {FileAccessorType} from '../common/file-accessor-type';
import {IFileDescription} from '../common/i-file-description';
import {IFileAccessConfiguration} from '../common/i-file-access-configuration';

interface SerializedFormV1 {
    type: FileAccessorType.DOWNLOAD_UPLOAD;
    version: '1';
    name: string;
}

export class DownloadUploadFileDescription implements IFileDescription {

    name: string;
    children = [];

    static fromBrowserFile(configuration: IFileAccessConfiguration, file: File) {
        return new DownloadUploadFileDescription('file', configuration, file);
    }

    static deserialize(serializationService: SerializationService, serializedForm: string): DownloadUploadFileDescription {
        return DownloadUploadFileDescription.fromBrowserFile(serializationService.deserializeIFileConfiguration(serializedForm), null);
    }

    constructor(public type: 'file'|'dir',
                public readonly configuration: IFileAccessConfiguration,
                private _file: File, newName?: string) {
        if (!newName && this._file) {
            this.name = this._file.name;
        } else {
            this.name = newName;
        }
    }

    get browserFile(): File {
        return this._file;
    }

    get path(): string {
        return this.name;
    }

    /**
     * Download targets are never equal.
     */
    public equals(another: IFileDescription): boolean {
        return false;
    }

    public isDirectory(): boolean {
        return this.type === 'dir';
    }

    public serialize(serializationService: SerializationService): string {
        return JSON.stringify({
            type: FileAccessorType.DOWNLOAD_UPLOAD,
            version: '1',
            name: this.name
        } as SerializedFormV1);
    }

    public dirname(): IFileDescription|null {
        return null;
    }

    public createFileDescription(newName: string): IFileDescription {
        return new DownloadUploadFileDescription('file', this.configuration, this._file, newName);
    }
}
