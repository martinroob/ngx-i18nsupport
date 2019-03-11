import {Component, Inject, OnDestroy, OnInit} from '@angular/core';
import {MAT_DIALOG_DATA, MatDialogRef} from '@angular/material';
import {IFileAccessConfiguration} from '../i-file-access-configuration';
import {GithubConfiguration} from '../../github/github-configuration';
import {FormBuilder, FormGroup} from '@angular/forms';
import {FileAccessServiceFactoryService} from '../file-access-service-factory.service';
import {Subscription} from 'rxjs';

export interface FileAccessConfigurationEditorDialogData {
  fileAccessConfigurations: IFileAccessConfiguration[];
  configuration: IFileAccessConfiguration;
}

@Component({
  selector: 'app-file-access-configuration-editor-dialog',
  templateUrl: './file-access-configuration-editor-dialog.component.html',
  styleUrls: ['./file-access-configuration-editor-dialog.component.scss']
})
export class FileAccessConfigurationEditorDialogComponent implements OnInit, OnDestroy {

  form: FormGroup;
  subscription: Subscription;
  activeConfiguration: {valid: boolean, configuration: IFileAccessConfiguration};
  editedConfiguration: {valid: boolean, configuration: IFileAccessConfiguration};
  private _fileAccessConfigurations: IFileAccessConfiguration[];

  constructor(private dialogRef: MatDialogRef<FileAccessConfigurationEditorDialogComponent>,
              @Inject(MAT_DIALOG_DATA) data: FileAccessConfigurationEditorDialogData,
              private formBuilder: FormBuilder,
              private fileAccessServiceFactoryService: FileAccessServiceFactoryService) {
    this._fileAccessConfigurations = data.fileAccessConfigurations;
    this.activeConfiguration = {valid: false, configuration: data.configuration.copy()};
  }

  ngOnInit() {
    this.initForm();
    this.subscription = this.form.valueChanges.subscribe(formValue => {
      this.activeConfiguration = {
        valid: false,
        configuration: this._fileAccessConfigurations[formValue.selectedFileAccessConfigurationIndex].copy()
      };
      console.log('active conf now', this.activeConfiguration);
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }

  private initForm() {
    if (!this.form) {
      this.form = this.formBuilder.group({
        selectedFileAccessConfigurationIndex:
          this._fileAccessConfigurations.findIndex(conf => conf.id === this.activeConfiguration.configuration.id)
      });
    }
  }

  fileAccessConfigurations() {
    return this._fileAccessConfigurations;
  }

  selectedFileAccessConfiguration() {
    return this._fileAccessConfigurations[this.form.value.selectedFileAccessConfigurationIndex];
  }

  cancel() {
    this.dialogRef.close();
  }

  setActiveConfiguration(newValue: {valid: boolean, configuration: GithubConfiguration}) {
    console.log('conf changed', newValue);
    this.editedConfiguration = newValue;
  }

  isActiveConfigurationValid(): boolean {
    return this.editedConfiguration && this.editedConfiguration.valid;
  }

  result(): IFileAccessConfiguration {
    return this.isActiveConfigurationValid() ? this.editedConfiguration.configuration : null;
  }
}
