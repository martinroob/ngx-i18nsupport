import {Injectable} from '@angular/core';
import {DownloadUploadService} from '../file-accessors/download-upload/download-upload.service';
import {IFileDescription} from '../file-accessors/common/i-file-description';
import {IFileAccessService} from '../file-accessors/common/i-file-access-service';
import {FileAccessorType} from '../file-accessors/common/file-accessor-type';

@Injectable({
  providedIn: 'root'
})
export class FileAccessServiceFactoryService {

  constructor(
      private downloadUploadService: DownloadUploadService
  ) { }

  getFileAccessService(file: IFileDescription): IFileAccessService {
    switch (file.type()) {
      case FileAccessorType.DOWNLOAD_UPLOAD:
        return this.downloadUploadService;
      default:
        throw new Error('Unknown file type ' + file.type());
    }
  }
}
