import {Injectable} from '@angular/core';
import {IFileDescription} from '../file-accessors/common/i-file-description';
import {IFileAccessConfiguration} from '../file-accessors/common/i-file-access-configuration';
import {FileAccessorType} from '../file-accessors/common/file-accessor-type';
import {DownloadUploadFileDescription} from '../file-accessors/download-upload/download-upload-file-description';
import {DownloadUploadConfiguration} from '../file-accessors/download-upload/download-upload-configuration';
import {GithubConfiguration} from '../file-accessors/github/github-configuration';
import {GithubFileDescription} from '../file-accessors/github/github-file-description';
import {IFile} from '../file-accessors/common/i-file';
import {GenericFile} from '../file-accessors/common/generic-file';
import {GithubFile} from '../file-accessors/github/github-file';

interface SerializedFormOfFile {
  type?: 'github';
}

interface SerializedFormOfDescription {
  accessorType: FileAccessorType;
  type: 'file'|'dir';
}

interface SerializedFormOfConfiguration {
  accessorType: FileAccessorType;
}

/**
 * A service to serialize tiny translator objects to strings and deserialze back.
 */
@Injectable({
  providedIn: 'root'
})
export class SerializationService {

  constructor() { }

  public deserializeIFile(serializedForm: string): IFile {
    const obj: SerializedFormOfFile = JSON.parse(serializedForm);
    if (!obj) {
      return null;
    }
    switch (obj.type) {
      case 'github':
        return GithubFile.deserialize(this, serializedForm);
      default:
        return GenericFile.deserialize(this, serializedForm);
    }
  }

  public deserializeIFileDescription(serializedForm: string): IFileDescription {
    const obj: SerializedFormOfDescription = JSON.parse(serializedForm);
    if (!obj) {
      return null;
    }
    switch (obj.accessorType) {
      case FileAccessorType.DOWNLOAD_UPLOAD:
        return DownloadUploadFileDescription.deserialize(this, serializedForm);
      case FileAccessorType.GITHUB:
        return GithubFileDescription.deserialize(this, serializedForm);
    }
    return null;
  }

  public deserializeIFileConfiguration(serializedForm: string): IFileAccessConfiguration {
    const obj: SerializedFormOfConfiguration = JSON.parse(serializedForm);
    if (!obj) {
      return null;
    }
    switch (obj.accessorType) {
      case FileAccessorType.DOWNLOAD_UPLOAD:
        return DownloadUploadConfiguration.deserialize(this, serializedForm);
      case FileAccessorType.GITHUB:
        return GithubConfiguration.deserialize(this, serializedForm);
    }
    return null;
  }
}
