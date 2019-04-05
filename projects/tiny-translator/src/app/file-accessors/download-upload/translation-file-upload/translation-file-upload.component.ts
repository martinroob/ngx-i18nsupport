import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup} from '@angular/forms';
import {TranslationProject} from '../../../model/translation-project';
import {FILETYPE_XTB} from '@ngx-i18nsupport/ngx-i18nsupport-lib';
import {IFileDescription} from '../../common/i-file-description';
import {DownloadUploadFileDescription} from '../download-upload-file-description';
import {DownloadUploadConfiguration} from '../download-upload-configuration';

@Component({
  selector: 'app-translation-file-upload',
  templateUrl: './translation-file-upload.component.html',
  styleUrls: ['./translation-file-upload.component.scss']
})
export class TranslationFileUploadComponent implements OnInit {

  @Input() createdProject?: TranslationProject;
  @Input() configuration: DownloadUploadConfiguration;
  @Output() fileSelected: EventEmitter<IFileDescription> = new EventEmitter();
  @Output() masterXmlFileSelected: EventEmitter<IFileDescription> = new EventEmitter();

  form: FormGroup;
  private selectedFiles: FileList;
  private selectedMasterXmbFiles: FileList;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    if (!this.form) {
      this.form = this.formBuilder.group({
        selectedFiles: [''],
        selectedMasterXmbFiles: ['']
      });
    }
  }

  fileSelectionChange(input: HTMLInputElement) {
    if (input) {
      this.selectedFiles = input.files;
    }
    if (input.files && input.files.length > 0) {
      const file: File = input.files.item(0);
      this.fileSelected.emit(
        DownloadUploadFileDescription.fromBrowserFile(DownloadUploadConfiguration.singleInstance(), file));
    }
  }

  masterXmlFileSelectionChange(input: HTMLInputElement) {
    if (input) {
      this.selectedMasterXmbFiles = input.files;
    }
    if (input.files && input.files.length > 0) {
      const file: File = input.files.item(0);
      this.masterXmlFileSelected.emit(
        DownloadUploadFileDescription.fromBrowserFile(DownloadUploadConfiguration.singleInstance(), file));
    }
  }

  selectedFilesFormatted(): string {
    return this.fileListFormatted(this.selectedFiles);
  }

  selectedMasterFilesFormatted(): string {
    return this.fileListFormatted(this.selectedMasterXmbFiles);
  }

  private fileListFormatted(fileList: FileList): string {
    if (fileList) {
      let result = '';
      for (let i = 0; i < fileList.length; i++) {
        if (i > 0) {
          result = result + ', ';
        }
        result = result + fileList.item(i).name;
      }
      return result;
    } else {
      return '';
    }
  }

  /**
   * If the first file was a xmb file, master is needed.
   * Enables the input for a second file, the master xmb.
   */
  isMasterXmbFileNeeded(): boolean {
    return this.isFileSelected() &&
        this.createdProject &&
        this.createdProject.translationFile &&
        this.createdProject.translationFile.fileType() === FILETYPE_XTB;
  }

  isFileSelected(): boolean {
    return this.selectedFiles && this.selectedFiles.length > 0 && !!this.createdProject;
  }

}
