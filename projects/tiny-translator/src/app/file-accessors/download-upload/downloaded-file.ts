import {IFileDescription} from '../common/i-file-description';
import {FileAccessorType} from '../common/file-accessor-type';

export class DownloadedFile implements IFileDescription {

    constructor(private _file: File) {}

    get type(): FileAccessorType {
        return FileAccessorType.DOWNLOAD_UPLOAD;
    }

    get browserFile(): File {
        return this._file;
    }
}
