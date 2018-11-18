import {TranslationProject} from './translation-project';
import {InjectionToken} from '@angular/core';

/**
 * Interface of BackendService.
 * A BackendService can store and retrieve translation projects.
 * It also can store an API key for Google Translate.
 */
export class BackendServiceAPI {

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
   * @return {string} id of current project or null
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
   * @return {string} active unit or null.
   */
  currentTransUnitId(): string {
    return null;
  }

  /**
   * Delete a project from store.
   * @param project
   */
  deleteProject(project: TranslationProject) {

  }

  /**
   * Save API Key in store.
   * @param key
   */
  storeAutoTranslateApiKey(key: string) {

  }

  /**
   * Get API key from store.
   * @return {null}
   */
  autoTranslateApiKey(): string {
    return null;
  }

  /**
   * Helper function to generate a unique ID.
   * (from http://stackoverflow.com/questions/105034/create-guid-uuid-in-javascript)
   * @return {string}
   */
  static generateUUID(): string {
    // Public Domain/MIT
    var d = new Date().getTime();
    if (typeof performance !== 'undefined' && typeof performance.now === 'function'){
      d += performance.now(); //use high-precision timer if available
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (d + Math.random() * 16) % 16 | 0;
      d = Math.floor(d / 16);
      return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
    });
  }
}
