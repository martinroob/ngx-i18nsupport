import {Component, Inject, OnInit} from '@angular/core';
import {Observable, of, Subject} from 'rxjs';
import {IFileDescriptionDirectory} from '../i-file-description-directory';
import {IFileDescription} from '../i-file-description';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {FileAccessServiceFactoryService} from '../file-access-service-factory.service';
import {catchError, map} from 'rxjs/operators';
import {IFileAccessConfiguration} from '../i-file-access-configuration';

export interface FileExplorerDialogData {
  configuration: IFileAccessConfiguration;
  selectableFileType?: 'file'|'dir';
}

/**
 * A dialog containing a file explorer.
 */
@Component({
  selector: 'app-file-explorer-dialog',
  templateUrl: './file-explorer-dialog.component.html',
  styleUrls: ['./file-explorer-dialog.component.css']
})
export class FileExplorerDialogComponent implements OnInit {

  configuration: IFileAccessConfiguration;
  selectableFileType: 'file'|'dir';
  root: Observable<IFileDescriptionDirectory>;
  errorLoading$ = new Subject<string>();
  _selectedFile: IFileDescription;

  constructor(
      private dialogRef: MatDialogRef<FileExplorerDialogComponent>,
      @Inject(MAT_DIALOG_DATA) data: FileExplorerDialogData,
      private fileAccessServiceFactoryService: FileAccessServiceFactoryService) {
    this.configuration = data.configuration;
    this.selectableFileType = data.selectableFileType;
  }

  ngOnInit() {
    const accessService = this.fileAccessServiceFactoryService.getFileAccessService(this.configuration.type);
    const rootDir = this.configuration.rootDescription();
    this.root = accessService.load(rootDir).pipe(
        map(file => file as IFileDescriptionDirectory),
        catchError((error) => {
          this.errorLoading$.next(error.message);
          return of(undefined);
        }));
  }

  selectedFile(file: IFileDescription) {
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
