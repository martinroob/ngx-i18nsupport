import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {IFileDescription} from '../i-file-description';
import {IFileAccessConfiguration} from '../i-file-access-configuration';
import {FormBuilder, FormGroup} from '@angular/forms';

@Component({
  selector: 'app-save-as-explorer',
  templateUrl: './save-as-explorer.component.html',
  styleUrls: ['./save-as-explorer.component.css']
})
export class SaveAsExplorerComponent implements OnInit {

  @Input() configurations: IFileAccessConfiguration[];
  @Input() file: IFileDescription;
  private _selectedFileInExplorer: IFileDescription;
  @Output() selectedFile = new EventEmitter<IFileDescription>();

  configuration: IFileAccessConfiguration;
  form: FormGroup;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.initForm();
    this.configuration = this.file.configuration;
    this._selectedFileInExplorer = this.file;
    this.form.valueChanges.subscribe(val => {
      if (val.name) {
        this.selectedFile.emit(this._selectedFileInExplorer.createFileDescription(val.name));
      }
    });
  }

  private initForm() {
    if (!this.form) {
      this.form = this.formBuilder.group({
        name: [this.file.name]
      });
    }
  }

  setSelectedFileFromExplorer(newFile: IFileDescription) {
    this._selectedFileInExplorer = newFile;
    if (newFile && newFile.type === 'file') {
      this.form.patchValue({
        name: newFile.name
      });
    } else {
      this.selectedFile.emit(this._selectedFileInExplorer.createFileDescription(this.form.value.name));
    }
  }
}
