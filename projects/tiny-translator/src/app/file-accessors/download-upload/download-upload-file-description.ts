import {DownloadUploadConfiguration} from './download-upload-configuration';
import {SerializationService} from '../../model/serialization.service';
import {FileAccessorType} from '../common/file-accessor-type';
import {IFileDescription} from '../common/i-file-description';

interface SerializedFormV1 {
    type: FileAccessorType.DOWNLOAD_UPLOAD;
    version: '1';
    name: string;
}

export class DownloadUploadFileDescription implements IFileDescription {

    readonly type = 'file';
    readonly configuration = DownloadUploadConfiguration.singleInstance();
    readonly path = '';

    static deserialize(): DownloadUploadFileDescription {
        return new DownloadUploadFileDescription(null);
    }

    constructor(private _file: File) {}

    get browserFile(): File {
        return this._file;
    }

    get name(): string {
        return this._file ? this._file.name : '';
    }

    public isDirectory(): boolean {
        return false;
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

    public createFileDescription(name: string): IFileDescription {
        return null;
    }
}
