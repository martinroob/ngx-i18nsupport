import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TranslationProject, UserRole, WorkflowType} from '../model/translation-project';
import {FormBuilder, FormGroup} from '@angular/forms';
import {isNullOrUndefined} from '../common/util';

/**
 * Component to edit some properties of the current project.
 * (name, workflowType).-
 */
@Component({
  selector: 'app-project-editor',
  templateUrl: './project-editor.component.html',
  styleUrls: ['./project-editor.component.css']
})
export class ProjectEditorComponent implements OnInit {

  @Output() onEditProject: EventEmitter<TranslationProject> = new EventEmitter();

  @Input() project: TranslationProject;

  form: FormGroup;

  constructor(private formBuilder: FormBuilder) { }

  ngOnInit() {
    this.initForm();
  }

  private initForm() {
    if (!this.form) {
      if (this.project) {
        this.form = this.formBuilder.group({
          projectName: [this.project.name],
          workflowType: [this.workflowTypeToString(this.project.workflowType)],
          userRole: [this.userRoleToString(this.project.userRole)],
          sourceLanguage: [this.project.translationFile.sourceLanguage()],
        });
      } else {
        this.form = this.formBuilder.group({
          projectName: [''],
          workflowType: [this.workflowTypeToString(WorkflowType.SINGLE_USER)],
          userRole: [this.userRoleToString(UserRole.TRANSLATOR)],
          sourceLanguage: [null],
        });
      }
    }
  }

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

  workflowTypeToString(type: WorkflowType): string {
    switch (type) {
      case WorkflowType.SINGLE_USER:
        return 'singleuser';
      case WorkflowType.WITH_REVIEW:
        return 'withReview';
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

  userRoleToString(role: UserRole): string {
    switch (role) {
      case UserRole.TRANSLATOR:
        return 'translator';
      case UserRole.REVIEWER:
        return 'reviewer';
    }
  }

  editProject() {
    this.project.setName(this.form.value.projectName);
    this.project.setWorkflowType(this.toWorkflowType(this.form.value.workflowType));
    this.project.setUserRole(this.toUserRole(this.form.value.userRole));
    this.project.translationFile.setSourceLanguage(this.form.value.sourceLanguage);
    this.onEditProject.emit(this.project);
  }

  selectedFilesFormatted(): string {
    if (this.project && this.project.translationFile) {
      return this.project.translationFile.name;
    } else {
      return null;
    }
  }

  isWorkflowWithReview(): boolean {
    return this.toWorkflowType(this.form.value.workflowType) === WorkflowType.WITH_REVIEW;
  }

  hasExplicitSourceLanguage(): boolean {
    return this.project &&
      this.project.translationFile &&
      !this.project.translationFile.hasErrors() &&
      isNullOrUndefined(this.project.translationFile.sourceLanguageFromFile());
  }

}
