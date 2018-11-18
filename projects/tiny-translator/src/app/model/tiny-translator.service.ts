import {Injectable} from '@angular/core';
import {TranslationFile} from './translation-file';
import {isNullOrUndefined} from 'util';
import {BackendServiceAPI} from './backend-service-api';
import {TranslationProject, WorkflowType} from './translation-project';
import {Observable} from 'rxjs/Observable';
import {DownloaderService} from './downloader.service';
import {AsynchronousFileReaderService} from './asynchronous-file-reader.service';
import {
  AutoTranslateDisabledReasonKey,
  AutoTranslateServiceAPI
} from './auto-translate-service-api';
import {AutoTranslateSummaryReport} from './auto-translate-summary-report';
import {TranslationUnit} from './translation-unit';

@Injectable()
export class TinyTranslatorService {

  /**
   * List of projects for work.
   */
  private _projects: TranslationProject[];

  /**
   * The current project.
   */
  private _currentProject: TranslationProject;

  constructor(private backendService: BackendServiceAPI,
              private fileReaderService: AsynchronousFileReaderService,
              private downloaderService: DownloaderService,
              private autoTranslateService: AutoTranslateServiceAPI) {
    this._projects = this.backendService.projects();
    const currentProjectId = this.backendService.currentProjectId();
    if (currentProjectId) {
      this._currentProject = this._projects.find((project) => project.id === currentProjectId);
    }
    const currentTransUnitId: string = this.backendService.currentTransUnitId();
    if (currentTransUnitId && this.currentProject()) {
      const transUnit = this.currentProject().translationFile.allTransUnits().find(tu => tu.id() === currentTransUnitId);
      this.currentProject().translationFileView.selectTransUnit(transUnit);
    }
    this.autoTranslateService.setApiKey(this.backendService.autoTranslateApiKey());
  }

  /**
   * Add a new project.
   * @param project
   * @return list of errors found in file selection.
   */
  public addProject(project: TranslationProject): string[] {
    this._projects.push(project);
    this.backendService.store(project);
    // TODO error handling
    return [];
  }

  /**
   * Create a new project.
   * (you must add it with addProject to use it).
   * @param projectName
   * @param file selected xlf or xmb file to translate
   * @param masterXmbFile in case of xmb the master file
   * @param workflowType Type of workflow used in project (singleUser versus withReview).
   * @return {TranslationProject}
   */
  public createProject(projectName: string, file: File, masterXmbFile?: File, workflowType?: WorkflowType): Observable<TranslationProject> {
    const uploadingFile = this.fileReaderService.readFile(file);
    const readingMaster = this.fileReaderService.readFile(masterXmbFile);
    return TranslationFile.fromUploadedFile(uploadingFile, readingMaster)
      .map((translationfile: TranslationFile) => {
        return new TranslationProject(projectName, translationfile, workflowType);
      });
  }

  public setCurrentProject(project: TranslationProject) {
    let id: string = null;
    if (project) {
      if (isNullOrUndefined(this._projects.find(p => p === project))) {
        throw new Error('oops, selected project not in list');
      }
      id = project.id;
    }
    this._currentProject = project;
    this.backendService.storeCurrentProjectId(id);
  }

  public currentProject(): TranslationProject {
    return this._currentProject;
  }

  /**
   * Select a TranslationUnit, if it is currently in the filtered list.
   * If it is not, will do nothing.
   * @param transUnit
   */
  public selectTransUnit(transUnit: TranslationUnit) {
    if (!this.currentProject()) {
      return;
    } else {
      if (this.currentProject().translationFileView.selectTransUnit(transUnit)) {
        this.backendService.storeCurrentTransUnitId(transUnit.id());
      }
    }
  }

  /**
   * Navigate to next unit.
   */
  public nextTransUnit() {
    if (!this.currentProject()) {
      return;
    } else {
      const transUnit = this.currentProject().translationFileView.nextTransUnit();
      this.backendService.storeCurrentTransUnitId(transUnit.id());
    }
  }

  /**
   * Navigate to previous unit.
   */
  public prevTransUnit() {
    if (!this.currentProject()) {
      return;
    } else {
      const transUnit = this.currentProject().translationFileView.prevTransUnit();
      this.backendService.storeCurrentTransUnitId(transUnit.id());
    }
  }

  /**
   * Check, wether there are errors in any of the selected files.
   * @return {boolean}
   */
  public hasErrors(): boolean {
    if (!this._projects || this._projects.length === 0) {
      return false;
    }
    const projectWithErrors = this._projects.find((p) => p.hasErrors());
    return !isNullOrUndefined(projectWithErrors);
  }

  public projects(): TranslationProject[] {
    return this._projects;
  }

  public commitChanges(project: TranslationProject) {
    this.backendService.store(project);
  }

  public saveProject(project: TranslationProject) {
    this.downloaderService.downloadXliffFile(project.translationFile.name, project.translationFile.editedContent());
    project.translationFile.markExported();
    this.commitChanges(project);
  }

  public deleteProject(project: TranslationProject) {
    this.backendService.deleteProject(project);
    const index = this._projects.findIndex(p => p === project);
    if (index >= 0) {
      this._projects = this._projects.slice(0, index).concat(this._projects.slice(index + 1));
      if (project === this.currentProject()) {
        this.setCurrentProject(null);
      }
    }
  }

  /**
   * Set an API key for Google Translate.
   * Will be stored in local storage.
   * @param key
   */
  public setAutoTranslateApiKey(key: string) {
    this.autoTranslateService.setApiKey(key);
    this.backendService.storeAutoTranslateApiKey(key);
  }

  /**
   * Get the currently active Google Translate API key.
   * @return {string}
   */
  public autoTranslateApiKey(): string {
    return this.autoTranslateService.apiKey();
  }

  /**
   * Test, wether auto translation is possible for current project.
   * @return {Observable<boolean>}
   */
  public canAutoTranslate(): Observable<boolean> {
    if (isNullOrUndefined(this.currentProject()) || !this.currentProject().canTranslate()) {
      return Observable.of(false);
    }
    return this.canAutoTranslateForLanguages(
      this.currentProject().translationFile.sourceLanguage(),
      this.currentProject().translationFile.targetLanguage());
  }

  /**
   * Test, wether auto translation is possible for given languages.
   * @param source Source Language
   * @param target Target Language
   * @return {Observable<boolean>}
   */
  public canAutoTranslateForLanguages(source: string, target: string): Observable<boolean> {
    return this.autoTranslateService.canAutoTranslate(source, target);
  }

  /**
   * Reason, why auto translation is not possible for current project.
   * @return {Observable<string>}
   */
  public autoTranslateDisabledReason(): Observable<string> {
    if (isNullOrUndefined(this.currentProject()) || !this.currentProject().canTranslate()) {
      return Observable.of('no translatable project');
    }
    return this.autoTranslateDisabledReasonForLanguages(
      this.currentProject().translationFile.sourceLanguage(),
      this.currentProject().translationFile.targetLanguage());
  }

  /**
   * Reason, why auto translation is not possible for given languages.
   * @return {Observable<string>}
   */
  public autoTranslateDisabledReasonForLanguages(source: string, target: string): Observable<string> {
    return this.autoTranslateService.disabledReason(source, target).map((reason) => {
      if (isNullOrUndefined(reason)) {
        return null; // means not disabled, everything is ok!
      }
      switch (reason.reason) {
        case AutoTranslateDisabledReasonKey.NO_PROVIDER:
          return 'no provider';
        case AutoTranslateDisabledReasonKey.NO_KEY:
          return 'no key';
        case AutoTranslateDisabledReasonKey.INVALID_KEY:
          return 'invalid key';
        case AutoTranslateDisabledReasonKey.SOURCE_LANG_NOT_SUPPORTED:
          return 'source language not supported';
        case AutoTranslateDisabledReasonKey.TARGET_LANG_NOT_SUPPORTED:
          return 'target language not supported';
        case AutoTranslateDisabledReasonKey.CONNECT_PROBLEM:
          return 'connection problem: ' + reason.details;
      }
    });
  }

  /**
   * Test call the auto translate service.
   * @param message
   * @param source
   * @param target
   * @return {Observable<string>}
   */
  public testAutoTranslate(message: string, source: string, target: string): Observable<string> {
    return this.autoTranslateService.translate(message, source, target);
  }

  /**
   * Auto translate all untranslated units.
   */
  public autoTranslate(): Observable<AutoTranslateSummaryReport>  {
    if (this.currentProject() && this.currentProject().translationFile) {
      return this.currentProject().translationFile.autoTranslateUsingService(this.autoTranslateService).map((summary) => {
        this.commitChanges(this.currentProject());
        return summary;
      });
    } else {
      return Observable.of(new AutoTranslateSummaryReport());
    }
  }

}
