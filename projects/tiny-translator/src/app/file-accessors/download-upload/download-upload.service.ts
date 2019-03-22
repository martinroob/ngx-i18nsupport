import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {FileStatus, IFileAccessService, IFileStats} from '../common/i-file-access-service';
import {IFile} from '../common/i-file';
import {DownloadUploadFileDescription} from './download-upload-file-description';
import {AsynchronousFileReaderService} from './asynchronous-file-reader.service';
import {DownloaderService} from './downloader.service';
import {map} from 'rxjs/operators';
import {IFileAccessConfiguration} from '../common/i-file-access-configuration';
import {DownloadUploadConfiguration} from './download-upload-configuration';
import {SerializationService} from '../../model/serialization.service';
import {GenericFile} from '../common/generic-file';
import {IFileDescription} from '../common/i-file-description';

@Injectable()
export class DownloadUploadService implements IFileAccessService {

    constructor(
        private fileReaderService: AsynchronousFileReaderService,
        private downloaderService: DownloaderService) {}

    load(description: DownloadUploadFileDescription): Observable<IFile|IFileDescription> {
        if (description.isDirectory()) {
            return of(description);
        }
        const file = description.browserFile;
        return this.fileReaderService.readFile(file).pipe(
            map(result => {
                return new GenericFile(description, result.name, result.size, result.content);
            })
        );
    }

    save(file: IFile): Observable<IFile> {
        this.downloaderService.downloadXliffFile(file.description.name, file.content);
        return of(file);
    }

    stats(file: IFile): Observable<IFileStats> {
        return of({status: FileStatus.EXISTS_NOT});
    }

    serialize(serializationService: SerializationService, configuration: IFileAccessConfiguration): string {
        return 'DOWNLOAD_UPLOAD';
    }

    deserialize(serializationService: SerializationService, serialzedConfiguration: string): IFileAccessConfiguration {
        return DownloadUploadConfiguration.singleInstance();
    }
}
