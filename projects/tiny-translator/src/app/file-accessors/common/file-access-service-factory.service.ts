import {Injectable} from '@angular/core';
import {DownloadUploadService} from '../download-upload/download-upload.service';
import {IFileAccessService} from './i-file-access-service';
import {FileAccessorType} from './file-accessor-type';
import {GithubAccessorService} from '../github/github-accessor.service';

/**
 * This service returns a suitable service used to load and save a translation file.
 */
@Injectable({
  providedIn: 'root'
})
export class FileAccessServiceFactoryService {

  constructor(
      private downloadUploadService: DownloadUploadService,
      private githubAccessorService: GithubAccessorService
  ) { }

  getFileAccessService(filetype: FileAccessorType): IFileAccessService {
    switch (filetype) {
      case FileAccessorType.DOWNLOAD_UPLOAD:
        return this.downloadUploadService;
      case FileAccessorType.GITHUB:
        return this.githubAccessorService;
      default:
        throw new Error('Unknown file type ' + filetype);
    }
  }

}
