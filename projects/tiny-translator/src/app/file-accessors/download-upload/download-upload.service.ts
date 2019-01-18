import {Observable, of} from 'rxjs';
import {Injectable} from '@angular/core';
import {IFileAccessService} from '../common/i-file-access-service';
import {IFile} from '../common/i-file';
import {DownloadedFile} from './downloaded-file';
import {AsynchronousFileReaderService} from './asynchronous-file-reader.service';
import {DownloaderService} from './downloader.service';
import {map} from 'rxjs/operators';

@Injectable()
export class DownloadUploadService implements IFileAccessService {

    constructor(
        private fileReaderService: AsynchronousFileReaderService,
        private downloaderService: DownloaderService) {}

    load(description: DownloadedFile): Observable<IFile> {
        const file = description.browserFile;
        return this.fileReaderService.readFile(file).pipe(
            map(result => {
                return {
                    description: description,
                    name: result.name,
                    size: result.size,
                    content: result.content
                };
            })
        );
    }

    save(file: IFile): Observable<any> {
        this.downloaderService.downloadXliffFile(file.name, file.content);
        // TODO
        return of('ok');
    }
}
