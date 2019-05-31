import {Component, Inject, OnInit} from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from "@angular/material/dialog";
import {GithubConfiguration} from '../github-configuration';

export interface GithubConfigEditorDialogData {
  configuration: GithubConfiguration;
}

@Component({
  selector: 'app-github-config-editor-dialog',
  templateUrl: './github-config-editor-dialog.component.html',
  styleUrls: ['./github-config-editor-dialog.component.css']
})
export class GithubConfigEditorDialogComponent implements OnInit {

  activeConfiguration: {valid: boolean, configuration: GithubConfiguration};

  constructor(private dialogRef: MatDialogRef<GithubConfigEditorDialogComponent>,
              @Inject(MAT_DIALOG_DATA) data: GithubConfigEditorDialogData) {
    this.activeConfiguration = {valid: false, configuration: data.configuration.copy()};
  }

  ngOnInit() {
  }

  cancel() {
    this.dialogRef.close();
  }

  changeActiveConfiguration(newValue: {valid: boolean, configuration: GithubConfiguration}) {
    this.activeConfiguration = newValue;
  }

  isActiveConfigurationValid(): boolean {
    return this.activeConfiguration && this.activeConfiguration.valid;
  }

  result(): GithubConfiguration {
    return this.isActiveConfigurationValid() ? this.activeConfiguration.configuration : null;
  }
}
