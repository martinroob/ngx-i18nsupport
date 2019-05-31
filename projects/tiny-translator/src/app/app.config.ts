import {InjectionToken} from '@angular/core';
import {environment} from '../environments/environment';
/**
 * Created by martin on 23.03.2017.
 * Configuration Data of the application.
 */

export class AppConfig {
  // URL to Google translate API (optional)
  GOOGLETRANSLATE_API_ROOT_URL?: string;
  // Your API Key, should not be set here, because it is secret
  // can be typed in in the application, but test config needs it
  GOOGLETRANSLATE_API_KEY?: string;
  // a setting for tests!!
  // if set to true, all autotranslations containing placeholder or tags will FAIL BY DESIGN
  // Used to allow testing of report page and filters for failed translations.
  GOOGLETRANSLATE_PROVOKE_FAILURES?: boolean;
  // URL to Github API (optional)
  GITHUB_API_ROOT_URL?: string;
  // Your API Key, should not be set here, because it is secret
  // can be typed in in the application, but test config needs it
  GITHUB_API_KEY?: string;
  GITHUB_PROVOKE_FAILURES?: boolean;
  BUILDVERSION: string;
  BUILDTIME: string;
}

export const APP_CONFIG_VALUE: AppConfig = {
  // set values here
  'BUILDVERSION': '0.16.0',
  'BUILDTIME': '2019-05-31', // TODO should be dynamic
  GOOGLETRANSLATE_API_ROOT_URL: 'https://translation.googleapis.com/',
  GOOGLETRANSLATE_API_KEY: environment.googletranslate_api_key,
  GOOGLETRANSLATE_PROVOKE_FAILURES: environment.googletranslate_provoke_failures,
  GITHUB_API_ROOT_URL: 'https://api.github.com/',
  GITHUB_API_KEY: environment.github_api_key,
  GITHUB_PROVOKE_FAILURES: environment.github_provoke_failures,
};

export let APP_CONFIG = new InjectionToken<AppConfig>('app.config');
