import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IFileAccessConfiguration} from '../i-file-access-configuration';
import {IFileDescription} from '../i-file-description';

/**
 * A file explorer where you can choose one of some configurations to use.
 */
@Component({
  selector: 'app-file-explorer-for-configurations',
  templateUrl: './file-explorer-for-configurations.component.html',
  styleUrls: ['./file-explorer-for-configurations.component.css']
})
export class FileExplorerForConfigurationsComponent implements OnInit {

  /**
   * The selectable configurations.
   */
  @Input() configurations: IFileAccessConfiguration[];

  /**
   * The currently selected file.
   */
  @Input() file: IFileDescription;

  /**
   * Determine what sort of entries can be selected.
   * 'file': only files.
   * 'dir': only directories
   * undefined: everything.
   */
  @Input() selectableFileType?: 'file'|'dir';

  /**
   * The selected file node.
   */
  @Output() selectedFile: EventEmitter<IFileDescription> = new EventEmitter<IFileDescription>();

  constructor() { }

  ngOnInit() {
  }

}
