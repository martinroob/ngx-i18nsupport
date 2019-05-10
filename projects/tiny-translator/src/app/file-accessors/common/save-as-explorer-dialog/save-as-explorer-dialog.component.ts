import {Component, Inject, OnInit} from '@angular/core';
import {IFileAccessConfiguration} from '../i-file-access-configuration';
import {IFileDescription} from '../i-file-description';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";

export interface SaveAsExplorerDialogData {
  configurations?: IFileAccessConfiguration[];
  configuration?: IFileAccessConfiguration;
  file?: IFileDescription;
}

/**
 * A Dialog to choose a file to save.
 */
@Component({
  selector: 'app-save-as-explorer-dialog',
  templateUrl: './save-as-explorer-dialog.component.html',
  styleUrls: ['./save-as-explorer-dialog.component.scss']
})
export class SaveAsExplorerDialogComponent implements OnInit {

  configurations: IFileAccessConfiguration[];
  file: IFileDescription;
  _result: IFileDescription;

  constructor(private dialogRef: MatDialogRef<SaveAsExplorerDialogData>,
              @Inject(MAT_DIALOG_DATA) data: SaveAsExplorerDialogData) {
    this.configurations = data.configurations;
    this.file = data.file;
    this._result = this.file;
  }

  ngOnInit() {
  }

  selectedFile(f: IFileDescription) {
    this._result = f;
  }

  isFileSelected(): boolean {
    return !!this._result;
  }

  result(): IFileDescription {
    return this._result;
  }

  cancel() {
    this.dialogRef.close(null);
  }
}
