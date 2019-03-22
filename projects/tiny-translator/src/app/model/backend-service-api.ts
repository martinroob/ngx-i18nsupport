import {TranslationProject} from './translation-project';
import {IFileAccessConfiguration} from '../file-accessors/common/i-file-access-configuration';
import {Observable, of} from 'rxjs';

/**
 * Interface of BackendService.
 * A BackendService can store and retrieve translation projects.
 * It also can store an API key for Google Translate.
 * And it can store FileAccessConfigurations.
 */
export class BackendServiceAPI {

  /**
   * Helper function to generate a unique ID.
   * (from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
   * @return a unique id
   */
  static generateUUID(): string {
    // Public Domain/MIT
    let d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      d += performance.now(); // use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }

  /**
   * Store a project.
   */
  store(project: TranslationProject) {

  }

  /**
   * Get all stored projects.
   */
  projects(): TranslationProject[] {
    return [];
  }

  /**
   * Save id of curent project.
   * @param id of project, null to remove.
   */
  storeCurrentProjectId(id: string) {

  }

  /**
   * ID if current project.
   * @return id of current project or null
   */
  currentProjectId(): string {
    return null;
  }

  /**
   * Save ID of last active TransUnit
   * @param tuId active unit id or null.
   */
  storeCurrentTransUnitId(tuId: string) {

  }

  /**
   * ID of last active TransUnit
   * @return active unit or null.
   */
  currentTransUnitId(): string {
    return null;
  }

  /**
   * Delete a project from store.
   * @param project to delete
   */
  deleteProject(project: TranslationProject) {

  }

  /**
   * Save API Key in store.
   * @param key to store
   */
  storeAutoTranslateApiKey(key: string) {

  }

  /**
   * Get API key from store.
   * @return the key
   */
  autoTranslateApiKey(): string {
    return null;
  }

  /**
   * Store a file access configuration.
   * @param configuration the configuration to store.
   */
  storeFileAccessConfiguration(configuration: IFileAccessConfiguration): Observable<IFileAccessConfiguration> {
    return null;
  }

  deleteFileAccessConfiguration(configuration: IFileAccessConfiguration): Observable<IFileAccessConfiguration> {
    return null;
  }

  /**
   * Return all saved file access configurations.
   */
  fileAccessConfigurations(): Observable<IFileAccessConfiguration[]> {
    return of([]);
  }
}
