import {IFileAccessConfiguration} from '../common/i-file-access-configuration';
import {FileAccessorType} from '../common/file-accessor-type';
import {IFileDescriptionDirectory} from '../common/i-file-description-directory';

export class DownloadUploadConfiguration implements IFileAccessConfiguration {

    static _instance = new DownloadUploadConfiguration();

    readonly type = FileAccessorType.DOWNLOAD_UPLOAD;

    readonly label = '';

    readonly id = '0';

    public static singleInstance() {
        return this._instance;
    }

    public rootDescription(): IFileDescriptionDirectory {
        return null;
    }
}
