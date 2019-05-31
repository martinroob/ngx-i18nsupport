import {Component, Inject, OnInit} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {IFileDescription} from '../i-file-description';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {FileAccessServiceFactoryService} from '../file-access-service-factory.service';
import {catchError} from 'rxjs/operators';
import {IFileAccessConfiguration} from '../i-file-access-configuration';

export interface FileExplorerDialogData {
  configurations?: IFileAccessConfiguration[];
  configuration?: IFileAccessConfiguration;
  file?: IFileDescription;
  selectableFileType?: 'file'|'dir';
}

/**
 * A dialog containing a file explorer.
 */
@Component({
  selector: 'app-file-explorer-dialog',
  templateUrl: './file-explorer-dialog.component.html',
  styleUrls: ['./file-explorer-dialog.component.scss']
})
export class FileExplorerDialogComponent implements OnInit {

  configurations?: IFileAccessConfiguration[];
  configuration: IFileAccessConfiguration;
  file: IFileDescription;
  selectableFileType: 'file'|'dir';
  root: Observable<IFileDescription>;
  errorLoading$ = new Subject<string>();
  _selectedFile: IFileDescription;

  constructor(
      private dialogRef: MatDialogRef<FileExplorerDialogComponent>,
      @Inject(MAT_DIALOG_DATA) data: FileExplorerDialogData,
      private fileAccessServiceFactoryService: FileAccessServiceFactoryService) {
    this.configurations = data.configurations;
    this.configuration = data.configuration;
    this.file = data.file;
    this.selectableFileType = data.selectableFileType;
    this._selectedFile = (this.file) ? this.file : null;
  }

  ngOnInit() {
    const accessService = this.fileAccessServiceFactoryService.getFileAccessService(this.configuration.type);
    const rootDir = this.configuration.rootDescription();
    this.root = accessService.load(rootDir).pipe(
        catchError((error) => {
          this.errorLoading$.next(error.message);
          return of(undefined);
        }));
  }

  selectedFile(file: IFileDescription) {
    console.log('selected file', file);
    this._selectedFile = file;
  }

  isFileSelected(): boolean {
    return !!this._selectedFile;
  }

  result() {
    return this._selectedFile;
  }

  cancel() {
    this.dialogRef.close();
  }
}
