import { Injectable } from '@angular/core';
import {FileSaver} from 'file-saver';

@Injectable()
export class DownloaderService {

  constructor() { }

  downloadFile(filename: string, content: string, filetype: string) {
    const blob = new Blob([content], {type: filetype});
    FileSaver.saveAs(blob, filename);
  }

  downloadXliffFile(filename: string, content: string) {
    this.downloadFile(filename, content, 'application/xml');
  }
}
