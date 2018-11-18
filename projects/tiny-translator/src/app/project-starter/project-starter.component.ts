import {Component, EventEmitter, OnInit, Output} from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {TranslationProject, UserRole, WorkflowType} from '../model/translation-project';
import {FILETYPE_XTB} from 'ngx-i18nsupport-lib/dist';
import {isNullOrUndefined} from 'util';
import {FormBuilder, FormGroup} from '@angular/forms';

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

  @Output() onAddProject: EventEmitter<TranslationProject> = new EventEmitter();

  private createdProject: TranslationProject;

  form: FormGroup;
  private selectedFiles: FileList;
  private selectedMasterXmbFiles: FileList;

  constructor(private formBuilder: FormBuilder, private translatorService: TinyTranslatorService) { }

  ngOnInit() {
    this.initForm();
    this.form.valueChanges.subscribe(formValue => {
      this.valueChanged(formValue);
    });
  }

  private initForm() {
    if (!this.form) {
      this.form = this.formBuilder.group({
        projectName: [''],
        workflowType: ['singleuser'],
        userRole: ['translator'],
        selectedFiles: [''],
        selectedMasterXmbFiles: [''],
        sourceLanguage: [''],
      });
    }
  }

  fileSelectionChange(input: HTMLInputElement) {
    this.selectedFiles = input.files;
    this.valueChanged(this.form.value);
  }

  masterXmlFileSelectionChange(input: HTMLInputElement) {
    this.selectedMasterXmbFiles = input.files;
    this.valueChanged(this.form.value);
  }

  valueChanged(formValue) {
    const translationFile = (this.selectedFiles) ? this.selectedFiles.item(0) : null;
    const masterXmbFile = (this.selectedMasterXmbFiles) ? this.selectedMasterXmbFiles.item(0) : null;
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
   * @param type
   * @return {any}
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
   * @param type
   * @return {any}
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

  addProject() {
      this.onAddProject.emit(this.createdProject);
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

  /**
   * Check, wether all needed is typed in.
   * Enables the add button.
   */
  isInputComplete(): boolean {
    return this.createdProject && this.createdProject.name && !this.createdProject.hasErrors() && this.isFileSelected();
  }

  isFileSelected(): boolean {
    return this.selectedFiles && this.selectedFiles.length > 0 && !!this.createdProject;
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
