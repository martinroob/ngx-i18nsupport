import { Injectable } from '@angular/core';
import {Observable} from 'rxjs/Observable';
import {ReplaySubject} from 'rxjs/ReplaySubject';

/**
 * Service to read a file.
 * (File means an uploaded Blob file object)
 * It gives an observable based API instead of just using basic FileReader.
 */

export interface AsynchronousFileReaderResult {
  name: string; // name of file
  size: number; // size in bytes
  content: string; // content of file
}

@Injectable()
export class AsynchronousFileReaderService {

  constructor() { }

  /**
   * Asynchronously read an uploaded file.
   * @param file the file to (may be null, then the Observable will return result with name and content null)
   * @return Observable of file name and content.
   */
  public readFile(file: File): Observable<AsynchronousFileReaderResult> {
    const subject = new ReplaySubject<AsynchronousFileReaderResult>();
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const fileContent = reader.result;
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
