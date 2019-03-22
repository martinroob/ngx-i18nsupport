import { Injectable } from '@angular/core';
import {BackendServiceAPI} from './backend-service-api';
import {TranslationProject} from './translation-project';
import {IFileAccessConfiguration} from '../file-accessors/common/i-file-access-configuration';
import {FileAccessServiceFactoryService} from '../file-accessors/common/file-access-service-factory.service';
import {FileAccessorType} from '../file-accessors/common/file-accessor-type';
import {SerializationService} from './serialization.service';
import {BehaviorSubject, Observable, of} from 'rxjs';

@Injectable()
export class BackendLocalStorageService extends BackendServiceAPI {

  private PRAEFIX = 'tinytranslator.';
  private PRAEFIX_PROJECT = this.PRAEFIX + 'project.';
  private KEY_CURRENT_PROJECT_ID = this.PRAEFIX + 'currentproject.id';
  private KEY_CURRENT_TRANSUNIT_ID = this.PRAEFIX + 'currenttransunit.id';
  private KEY_APIKEY = this.PRAEFIX + 'googletranslate.apikey';
  private PRAEFIX_FILE_ACCESS_CONFIGURATION = this.PRAEFIX + 'fileaccessconfiguration.';

  private _fileAccessConfigurations: BehaviorSubject<IFileAccessConfiguration[]>;

  constructor(
      private fileAccessServiceFactoryService: FileAccessServiceFactoryService,
      private serializationService: SerializationService
  ) {
    super();
    if (!localStorage) {
      throw new Error('oops, local storage not supported');
    }
  }

  /**
   * Store a project.
   */
  store(project: TranslationProject) {
    if (!project.id) {
      project.id = BackendServiceAPI.generateUUID();
    }
    localStorage.setItem(this.keyForProject(project), project.serialize(this.serializationService));
  }

  /**
   * Get all stored projects.
   */
  projects(): TranslationProject[] {
    const projectKeys = this.getProjectKeys();
    return projectKeys
      .map(key => TranslationProject.deserialize(this.serializationService, localStorage.getItem(key)))
      .sort((p1, p2) => p1.name.localeCompare(p2.name));
  }

  /**
   * Save id of curent project.
   * @param id of project, null to remove.
   */
  storeCurrentProjectId(id: string) {
    if (!id) {
      localStorage.removeItem(this.KEY_CURRENT_PROJECT_ID);
    } else {
      localStorage.setItem(this.KEY_CURRENT_PROJECT_ID, id);
    }
  }

  /**
   * ID if current project.
   * @return id of current project or null
   */
  currentProjectId(): string {
    return localStorage.getItem(this.KEY_CURRENT_PROJECT_ID);
  }

  /**
   * Save ID of last active TransUnit
   * @param tuId active unit id or null.
   */
  storeCurrentTransUnitId(tuId: string) {
    if (!tuId) {
      localStorage.removeItem(this.KEY_CURRENT_TRANSUNIT_ID);
    } else {
      localStorage.setItem(this.KEY_CURRENT_TRANSUNIT_ID, tuId);
    }
  }

  /**
   * ID of last active TransUnit
   * @return active unit or null.
   */
  currentTransUnitId(): string {
    return localStorage.getItem(this.KEY_CURRENT_TRANSUNIT_ID);
  }

  deleteProject(project: TranslationProject) {
    if (project && project.id) {
      const key = this.keyForProject(project);
      localStorage.removeItem(key);
    }
  }

  /**
   * Save API Key in store.
   * @param key GoogleTranslate API Key
   */
  storeAutoTranslateApiKey(key: string) {
    if (!key) {
      localStorage.removeItem(this.KEY_APIKEY);
    } else {
      localStorage.setItem(this.KEY_APIKEY, key);
    }
  }

  /**
   * Get API key from store.
   * @return GoogleTranslate API Key
   */
  autoTranslateApiKey(): string {
    return localStorage.getItem(this.KEY_APIKEY);
  }

  /**
   * Store a file access configuration.
   * @param configuration the configuration to store.
   */
  storeFileAccessConfiguration(configuration: IFileAccessConfiguration): Observable<IFileAccessConfiguration> {
    const added = !configuration.id;
    if (added) {
      configuration.id = BackendServiceAPI.generateUUID();
    }
    const key = this.keyForFileAccessConfiguration(configuration);
    const serialization = this.fileAccessServiceFactoryService.getFileAccessService(configuration.type)
      .serialize(this.serializationService, configuration);
    localStorage.setItem(key, serialization);
    if (this._fileAccessConfigurations) {
      const configs = this._fileAccessConfigurations.getValue();
      const changedConfigs = added ?
        [...configs, configuration] :
        configs.map(conf => conf.id === configuration.id ? configuration : conf);
      this._fileAccessConfigurations.next(changedConfigs);
    }
    return of(configuration);
  }

  deleteFileAccessConfiguration(configuration: IFileAccessConfiguration): Observable<IFileAccessConfiguration> {
    if (configuration && configuration.id) {
      const key = this.keyForFileAccessConfiguration(configuration);
      localStorage.removeItem(key);
      if (this._fileAccessConfigurations) {
        const changedConfigs = this._fileAccessConfigurations.getValue().filter(conf => conf.id !== configuration.id);
        this._fileAccessConfigurations.next(changedConfigs);
      }
      return of(configuration);
    } else {
      return of(null);
    }
  }

  /**
   * Return all saved file access configurations.
   */
  fileAccessConfigurations(): Observable<IFileAccessConfiguration[]> {
    if (!this._fileAccessConfigurations) {
      const configKeys = this.getFileAccessConfigurationKeys();
      const configs = configKeys
        .map(key => {
          const fileAccessorType = this.getFileAccessorTypeFromKey(key);
          const accessorService = this.fileAccessServiceFactoryService.getFileAccessService(fileAccessorType);
          return accessorService.deserialize(this.serializationService, localStorage.getItem(key));
        })
        .sort((cfg1, cfg2) => cfg1.shortLabel().localeCompare(cfg2.shortLabel()));
      this._fileAccessConfigurations = new BehaviorSubject<IFileAccessConfiguration[]>(configs);
    }
    return this._fileAccessConfigurations;
  }

  private keyForFileAccessConfiguration(configuration: IFileAccessConfiguration): string {
    return this.PRAEFIX_FILE_ACCESS_CONFIGURATION + configuration.type + '.' + configuration.id;
  }

  private getFileAccessorTypeFromKey(key: string): FileAccessorType {
    const keyParts = key.split('.');
    const type: string = keyParts[keyParts.length - 2];
    return type as FileAccessorType;
  }

  private getFileAccessConfigurationKeys(): string[] {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PRAEFIX_FILE_ACCESS_CONFIGURATION)) {
        result.push(key);
      }
    }
    return result;
  }

  private keyForProject(project: TranslationProject) {
    return this.PRAEFIX_PROJECT + project.id;
  }

  private getProjectKeys(): string[] {
    const result = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(this.PRAEFIX_PROJECT)) {
        result.push(key);
      }
    }
    return result;
  }

}
