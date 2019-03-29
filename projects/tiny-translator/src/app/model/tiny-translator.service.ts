import {Injectable} from '@angular/core';
import {TranslationFile} from './translation-file';
import {isNullOrUndefined} from '../common/util';
import {BackendServiceAPI} from './backend-service-api';
import {TranslationProject, WorkflowType} from './translation-project';
import {combineLatest, Observable, of} from 'rxjs';
import {AutoTranslateDisabledReasonKey, AutoTranslateServiceAPI} from './auto-translate-service-api';
import {AutoTranslateSummaryReport} from './auto-translate-summary-report';
import {TranslationUnit} from './translation-unit';
import {map, switchMap, tap} from 'rxjs/operators';
import {IFileDescription} from '../file-accessors/common/i-file-description';
import {FileStatus, ICommitData, IFileAccessService, IFileStats} from '../file-accessors/common/i-file-access-service';
import {FileAccessServiceFactoryService} from '../file-accessors/common/file-access-service-factory.service';
import {IFileAccessConfiguration} from '../file-accessors/common/i-file-access-configuration';
import {FileAccessorType} from '../file-accessors/common/file-accessor-type';
import {IFile} from '../file-accessors/common/i-file';
import {DownloadUploadConfiguration} from '../file-accessors/download-upload/download-upload-configuration';

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
              private fileAccessServiceFactoryService: FileAccessServiceFactoryService,
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
   * @param project project
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
   * @param projectName projectName
   * @param file selected xlf or xmb file to translate
   * @param masterXmbFile in case of xmb the master file
   * @param workflowType Type of workflow used in project (singleUser versus withReview).
   * @return TranslationProject
   */
  public createProject(projectName: string,
                       file: IFileDescription,
                       masterXmbFile?: IFileDescription,
                       workflowType?: WorkflowType): Observable<TranslationProject> {
    if (isNullOrUndefined(file)) {
      return of(new TranslationProject(projectName, null, workflowType));
    }
    const fileAccessService: IFileAccessService = this.fileAccessServiceFactoryService.getFileAccessService(file.configuration.type);
    return combineLatest(fileAccessService.load(file), (masterXmbFile) ? fileAccessService.load(masterXmbFile) : of(null)).pipe(
        map(contentArray => {
          const loadedFile = contentArray[0];
          const loadedMaster = contentArray[1];
          return TranslationFile.fromFile(loadedFile as IFile, loadedMaster);
        }),
        map((translationFile: TranslationFile) => {
          return new TranslationProject(projectName, translationFile, workflowType);
        })
    );
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
   * @param transUnit transUnit
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

  public projects(): TranslationProject[] {
    return this._projects;
  }

  public commitChanges(project: TranslationProject) {
    this.backendService.store(project);
  }

  public downloadProject(project: TranslationProject) {
    this.fileAccessServiceFactoryService.getFileAccessService(FileAccessorType.DOWNLOAD_UPLOAD)
        .save(project.translationFile.editedFile());
    project.translationFile.markExported();
    this.commitChanges(project);
  }

  public publishProject(
    project: TranslationProject,
    saveAs: IFileDescription|null,
    commitData: ICommitData,
    confirmModifiedCallback: () => Observable<boolean>,
    confirmOverrideCallback: () => Observable<boolean>): Observable<boolean> {
    let fileToSave = project.translationFile.editedFile();
    const isSavePositionChanged = !!saveAs && !saveAs.equals(fileToSave.description);
    if (isSavePositionChanged) {
      fileToSave = fileToSave.copyForNewDescription(saveAs);
    }
    const fileAccessService =
      this.fileAccessServiceFactoryService.getFileAccessService(fileToSave.description.configuration.type);
    return fileAccessService.stats(fileToSave).pipe(
      switchMap((stats: IFileStats) => {
        if (isSavePositionChanged && stats.status !== FileStatus.EXISTS_NOT) {
          return confirmOverrideCallback().pipe(
            tap(doSave => {commitData.override = doSave; })
          );
        }
        if (!isSavePositionChanged && stats.status === FileStatus.CHANGED) {
          return confirmModifiedCallback().pipe(
            tap(doSave => {commitData.override = doSave; })
          );
        }
        if (!isSavePositionChanged) {
          commitData.override = true;
        }
        return of(true);
      }),
      switchMap((doSave: boolean) => {
        if (doSave) {
          return fileAccessService.save(fileToSave, commitData)
            .pipe(
              tap(() => {
                if (!saveAs) {
                  project.translationFile.markExported();
                  this.commitChanges(project);
                }
              }),
              map(() => {
                return true;
              })
            );
        } else {
          return of(false);
        }
      })
    );
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
   * @param key key
   */
  public setAutoTranslateApiKey(key: string) {
    this.autoTranslateService.setApiKey(key);
    this.backendService.storeAutoTranslateApiKey(key);
  }

  /**
   * Get the currently active Google Translate API key.
   * @return api key
   */
  public autoTranslateApiKey(): string {
    return this.autoTranslateService.apiKey();
  }

  /**
   * Test, wether auto translation is possible for current project.
   * @return Observable<boolean>
   */
  public canAutoTranslate(): Observable<boolean> {
    if (isNullOrUndefined(this.currentProject()) || !this.currentProject().canTranslate()) {
      return of(false);
    }
    return this.canAutoTranslateForLanguages(
      this.currentProject().translationFile.sourceLanguage(),
      this.currentProject().translationFile.targetLanguage());
  }

  /**
   * Test, wether auto translation is possible for given languages.
   * @param source Source Language
   * @param target Target Language
   * @return Observable<boolean>
   */
  public canAutoTranslateForLanguages(source: string, target: string): Observable<boolean> {
    return this.autoTranslateService.canAutoTranslate(source, target);
  }

  /**
   * Reason, why auto translation is not possible for current project.
   * @return Observable<string>
   */
  public autoTranslateDisabledReason(): Observable<string> {
    if (isNullOrUndefined(this.currentProject()) || !this.currentProject().canTranslate()) {
      return of('no translatable project');
    }
    return this.autoTranslateDisabledReasonForLanguages(
      this.currentProject().translationFile.sourceLanguage(),
      this.currentProject().translationFile.targetLanguage());
  }

  /**
   * Reason, why auto translation is not possible for given languages.
   * @return Observable<string>
   */
  public autoTranslateDisabledReasonForLanguages(source: string, target: string): Observable<string> {
    return this.autoTranslateService.disabledReason(source, target).pipe(
        map((reason) => {
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
        }
    ));
  }

  /**
   * Test call the auto translate service.
   * @param message message
   * @param source source
   * @param target target
   * @return translated string
   */
  public testAutoTranslate(message: string, source: string, target: string): Observable<string> {
    return this.autoTranslateService.translate(message, source, target);
  }

  /**
   * Auto translate all untranslated units.
   */
  public autoTranslate(): Observable<AutoTranslateSummaryReport>  {
    if (this.currentProject() && this.currentProject().translationFile) {
      return this.currentProject().translationFile.autoTranslateUsingService(this.autoTranslateService).pipe(
          map((summary) => {
            this.commitChanges(this.currentProject());
            return summary;
          }
      ));
    } else {
      return of(new AutoTranslateSummaryReport());
    }
  }

  /**
   * Get all available accessor configurations from backend.
   */
  getFileAccessConfigurations(): Observable<IFileAccessConfiguration[]> {
    return this.backendService.fileAccessConfigurations().pipe(
      map(configs => [DownloadUploadConfiguration.singleInstance(), ...configs])
    );
  }

}
