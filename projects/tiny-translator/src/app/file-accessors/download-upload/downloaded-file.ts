import {IFileDescription} from '../common/i-file-description';
import {FileAccessorType} from '../common/file-accessor-type';
import {DownloadUploadConfiguration} from './download-upload-configuration';
import {IFileDescriptionFile} from '../common/i-file-description-file';

export class DownloadedFile implements IFileDescriptionFile {

    readonly type = 'file';
    readonly configuration = DownloadUploadConfiguration.singleInstance();

    constructor(private _file: File) {}

    get browserFile(): File {
        return this._file;
    }

    get name(): string {
        return this._file ? this._file.name : '';
    }
}
