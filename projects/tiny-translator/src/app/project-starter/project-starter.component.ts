import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {TranslationProject, UserRole, WorkflowType} from '../model/translation-project';
import {isNullOrUndefined} from '../common/util';
import {FormBuilder, FormGroup} from '@angular/forms';
import {IFileDescription} from '../file-accessors/common/i-file-description';
import {FileAccessorType} from '../file-accessors/common/file-accessor-type';
import {FileAccessServiceFactoryService} from '../file-accessors/common/file-access-service-factory.service';
import {IFileAccessConfiguration} from '../file-accessors/common/i-file-access-configuration';
import {Observable} from 'rxjs';

/**
 * The ProjectStarter is an upload component.
 * You can upload a file for translation (xliff file normally) to start working with it.
 */
@Component({
  selector: 'app-project-starter',
  templateUrl: './project-starter.component.html',
  styleUrls: ['./project-starter.component.scss']
})
export class ProjectStarterComponent implements OnInit {

  @Output() addProject: EventEmitter<TranslationProject> = new EventEmitter();

  createdProject: TranslationProject;

  form: FormGroup;
  private selectedFile: IFileDescription;
  private selectedMasterXmbFile: IFileDescription;
  private _fileAccessConfigurations: Observable<IFileAccessConfiguration[]>;

  constructor(private formBuilder: FormBuilder,
              private translatorService: TinyTranslatorService,
              private fileAccessServiceFactoryService: FileAccessServiceFactoryService) { }

  ngOnInit() {
    this.initForm();
    this._fileAccessConfigurations = this.translatorService.getFileAccessConfigurations();
    this.form.valueChanges.subscribe(formValue => {
      this.valueChanged(formValue);
    });
  }

  private initForm() {
    if (!this.form) {
      this.form = this.formBuilder.group({
        projectName: [''],
        selectedFileAccessConfigurationIndex: 0,
        workflowType: ['singleuser'],
        userRole: ['translator'],
        sourceLanguage: [''],
      });
    }
  }

  fileAccessConfigurations(): Observable<IFileAccessConfiguration[]> {
    return this._fileAccessConfigurations;
  }

  selectedFileAccessConfiguration() {
    return this._fileAccessConfigurations[this.form.value['selectedFileAccessConfigurationIndex']];
  }

  fileSelectionChange(file: IFileDescription) {
    this.selectedFile = file;
    this.valueChanged(this.form.value);
  }

  masterXmlFileSelectionChange(file: IFileDescription) {
    this.selectedMasterXmbFile = file;
    this.valueChanged(this.form.value);
  }

  valueChanged(formValue) {
    const translationFile = this.selectedFile;
    const masterXmbFile = this.selectedMasterXmbFile;
    this.translatorService.createProject(
      formValue.projectName,
      translationFile,
      masterXmbFile,
      this.toWorkflowType(formValue.workflowType)
    ).subscribe((newProject) => {
      this.createdProject = newProject;
      if (this.createdProject) {
        this.createdProject.setUserRole(this.toUserRole(formValue.userRole));
        if (this.createdProject.translationFile) {
          this.createdProject.translationFile.setSourceLanguage(formValue.sourceLanguage);
        }
      }
    });
  }

  /**
   * Convert string type from form to enum.
   * @param type type
   * @return type as enum
   */
  toWorkflowType(type: string): WorkflowType {
    switch (type) {
      case 'singleuser':
        return WorkflowType.SINGLE_USER;
      case 'withReview':
        return WorkflowType.WITH_REVIEW;
      default:
        return null;
    }
  }

  /**
   * Convert string type from form to enum.
   * @param role type
   * @return role as enum
   */
  toUserRole(role: string): UserRole {
    switch (role) {
      case 'translator':
        return UserRole.TRANSLATOR;
      case 'reviewer':
        return UserRole.REVIEWER;
      default:
        return null;
    }
  }

  emitAddProject() {
      this.addProject.emit(this.createdProject);
  }

  /**
   * Check, wether all needed is typed in.
   * Enables the add button.
   */
  isInputComplete(): boolean {
    return this.createdProject && this.createdProject.name && !this.createdProject.hasErrors() && this.isFileSelected();
  }

  isFileSelected(): boolean {
    return this.selectedFile && !!this.createdProject;
  }

  needsExplicitSourceLanguage(): boolean {
    return this.createdProject &&
      this.createdProject.translationFile &&
      !this.createdProject.translationFile.hasErrors() &&
      isNullOrUndefined(this.createdProject.translationFile.sourceLanguageFromFile());
  }

  isWorkflowWithReview(): boolean {
    return this.createdProject && this.createdProject.workflowType === WorkflowType.WITH_REVIEW;
  }
}
