import {IFileDescription} from '../common/i-file-description';
import {FileAccessorType} from '../common/file-accessor-type';
import {DownloadUploadConfiguration} from './download-upload-configuration';

export class DownloadedFile implements IFileDescription {

    readonly type = FileAccessorType.DOWNLOAD_UPLOAD;
    readonly configuration = DownloadUploadConfiguration.singleInstance();

    constructor(private _file: File) {}

    get browserFile(): File {
        return this._file;
    }
}
