import {TranslationFile} from './translation-file';
import {TranslationFileView} from './translation-file-view';
import {isNullOrUndefined} from '../common/util';
import {AutoTranslateSummaryReport} from './auto-translate-summary-report';
import {SerializationService} from './serialization.service';

/**
 * Workflow type determines, how you work with the tool.
 * There are 2 modes:
 * SINGLE_USER: You are developer and translator in one person.
 * You just translate the messages and, when done, reimport it into your application.
 * All translations are marked as state "final" directly after input.
 * WITH_REVIEW: Developer and translator are distinct people.
 * All translation are first marked as "translated".
 * When done, the translator gives it back to the developer, who reviews all marked as "translated".
 * He then can mark them all as "final" or give them back to the translator.
 */
export enum WorkflowType {
  SINGLE_USER,
  WITH_REVIEW
}

/**
 * The role the user has, when working with the tool.
 * As a reviewer you can check the translations and mark them as "final" at the end.
 * As a translator you can translate and give it back to the reviever.
 */
export enum UserRole {
  REVIEWER,
  TRANSLATOR
}

/**
 * A Translation Project.
 * A name and a translation file.
 */
export class TranslationProject {

  public id: string;

  private _view: TranslationFileView;

  private _userRole: UserRole;

  private _autoTranslateSummaryReport: AutoTranslateSummaryReport;

  /**
   * Create a project from the serialization.
   * @param serializationString string returned from serialize()
   * @return deserialized project
   */
  static deserialize(serializationService: SerializationService, serializationString: string): TranslationProject {
    const deserializedObject: any = JSON.parse(serializationString);
    const project = new TranslationProject(
      deserializedObject.name,
      TranslationFile.deserialize(serializationService, deserializedObject.translationFile),
      deserializedObject.workflowType);
    project.id = deserializedObject.id;
    project.setUserRole(deserializedObject.userRole);
    return project;
  }

  constructor(private _name: string, private _translationFile: TranslationFile, private _workflowType?: WorkflowType) {
    if (isNullOrUndefined(this._workflowType)) {
      this._workflowType = WorkflowType.SINGLE_USER;
    }
    this._view = new TranslationFileView(_translationFile);
  }

  /**
   * Return a string represenation of project state.
   * This will be stored in BackendService.
   */
  public serialize(serializationService: SerializationService): string {
    const serializedObject = {
      id: this.id,
      name: this.name,
      translationFile: this.translationFile.serialize(serializationService),
      workflowType: this.workflowType,
      userRole: this.userRole
    };
    return JSON.stringify(serializedObject);
  }

  get name(): string {
    return this._name;
  }

  public setName(name: string) {
    this._name = name;
  }

  get translationFile(): TranslationFile {
    return this._translationFile;
  }

  get translationFileView(): TranslationFileView {
    return this._view;
  }

  get workflowType(): WorkflowType {
    return this._workflowType ? this._workflowType : WorkflowType.SINGLE_USER;
  }

  public setWorkflowType(type: WorkflowType) {
    this._workflowType = type;
  }

  get userRole(): UserRole {
    return isNullOrUndefined(this._userRole) ? UserRole.TRANSLATOR : this._userRole;
  }

  public setUserRole(role: UserRole) {
    this._userRole = role;
  }

  public isReviewModeActive(): boolean {
    return this._userRole === UserRole.REVIEWER;
  }

  public hasErrors(): boolean {
    return this.translationFile && this.translationFile.hasErrors();
  }

  public canTranslate(): boolean {
    return this.translationFile && this.translationFile.canTranslate();
  }

  /**
   * Check, wether a publish is possible.
   */
  public canPublish(): boolean {
    return this.translationFile && this.translationFile.fileDescription().configuration.canPublish();
  }

  /**
   * Return report about last executed Autotranslate run.
   * @return report about last executed Autotranslate run.
   */
  public autoTranslateSummaryReport(): AutoTranslateSummaryReport {
    return this._autoTranslateSummaryReport;
  }

  /**
   * Store summary of last executed AutoTranslate run.
   * @param summary summary of last executed AutoTranslate run
   */
  public setAutoTranslateSummaryReport(summary: AutoTranslateSummaryReport) {
    this._autoTranslateSummaryReport = summary;
  }
}
