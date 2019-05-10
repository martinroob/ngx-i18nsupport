import {Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges} from '@angular/core';
import {IFileAccessConfiguration} from '../i-file-access-configuration';
import {IFileDescription} from '../i-file-description';
import {FileExplorerDialogComponent, FileExplorerDialogData} from '../file-explorer-dialog/file-explorer-dialog.component';
import { MatDialog } from "@angular/material/dialog";
import {SaveAsExplorerDialogComponent, SaveAsExplorerDialogData} from '../save-as-explorer-dialog/save-as-explorer-dialog.component';

/**
 * A component showing a file.
 * Normally readonly, but if you set "configurations", there will be a button opening a save as dialog.
 */
@Component({
  selector: 'app-file-to-save',
  templateUrl: './file-to-save.component.html',
  styleUrls: ['./file-to-save.component.scss']
})
export class FileToSaveComponent implements OnInit, OnChanges {

  /**
   * The configurations that can be used to save file.
   * If set, a save as dialog can be opened.
   */
  @Input() configurations: IFileAccessConfiguration[];

  /**
   * The file to show.
   */
  @Input() file: IFileDescription;

  /**
   * The file selected in the save as dialog.
   */
  @Output() selectedFile = new EventEmitter<IFileDescription>();

  configuration: IFileAccessConfiguration;

  constructor(private dialog: MatDialog) { }

  ngOnInit() {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.configuration = this.file.configuration;
  }

  openSaveAsExplorer() {
    const dialogRef = this.dialog.open(SaveAsExplorerDialogComponent, {
      data: {
        configurations: this.configurations,
        configuration: this.configuration,
        file: this.file
      } as SaveAsExplorerDialogData
    });
    dialogRef.afterClosed().subscribe((result: IFileDescription) => {
      if (result) {
        this.selectedFile.emit(result);
      }
    });
  }
}
