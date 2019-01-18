import { Injectable } from '@angular/core';
import {Observable, ReplaySubject} from 'rxjs';
import {IFile} from '../common/i-file';

/**
 * Service to read a file.
 * (File means an uploaded Blob file object)
 * It gives an observable based API instead of just using basic FileReader.
 */

interface FileResult {
  name: string;
  size: number;
  content: string;
}

@Injectable()
export class AsynchronousFileReaderService {

  constructor() { }

  /**
   * Asynchronously read an uploaded file.
   * @param file the file to (may be null, then the Observable will return result with name and content null)
   * @return Observable of file name and content.
   */
  public readFile(file: File): Observable<FileResult> {
    const subject = new ReplaySubject<FileResult>();
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileContent = reader.result as string;
        subject.next({name: file.name, size: file.size, content: fileContent});
        subject.complete();
      };
      reader.onerror = () => {
        subject.error(reader.error);
      };
      reader.onabort = () => {
        subject.error('read aborted');
      };
      reader.readAsText(file);
    } else {
      subject.next({name: null, size: 0, content: null});
      subject.complete();
    }
    return subject;
  }

}
