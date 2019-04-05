import {IFileAccessConfiguration} from '../common/i-file-access-configuration';
import {FileAccessorType} from '../common/file-accessor-type';
import {SerializationService} from '../../model/serialization.service';
import {IFileDescription} from '../common/i-file-description';
import {DownloadUploadFileDescription} from './download-upload-file-description';

interface SerializedFormV1 {
    accessorType: FileAccessorType.DOWNLOAD_UPLOAD;
    version: '1';
}

export class DownloadUploadConfiguration implements IFileAccessConfiguration {

    static _instance = new DownloadUploadConfiguration();

    readonly type = FileAccessorType.DOWNLOAD_UPLOAD;

    readonly id = '0';

    public static singleInstance() {
        return this._instance;
    }

    static deserialize(serializationService: SerializationService, serializedForm: string): DownloadUploadConfiguration {
        return this._instance;
    }

    public serialize(serializationService: SerializationService): string {
        const v1Object: SerializedFormV1 = {
            accessorType: FileAccessorType.DOWNLOAD_UPLOAD,
            version: '1'
        };
        return JSON.stringify(v1Object);
    }

    public equals(another: IFileAccessConfiguration): boolean {
        return another && another.type === FileAccessorType.DOWNLOAD_UPLOAD;
    }

    public shortLabel(): string {
        return '';
    }

    public fullLabel(): { maticon?: string; icon?: string; label: string } {
        return {
            maticon: 'save',
            label: ''
        };
    }

    public rootDescription(): IFileDescription {
        return new DownloadUploadFileDescription('dir', this, null);
    }

    /**
     * Return a directory with the given path
     */
    public directoryDescription(dirPath: string): IFileDescription {
        return null;
    }

    /**
     * Check, wether a publish is possible.
     */
    public canPublish(): boolean {
        return false;
    }

    public copy() {
        return this;
    }
}
