import { Component, OnInit } from '@angular/core';
import {FileAccessorType} from '../../common/file-accessor-type';
import {GithubConfiguration} from '../github-configuration';
import {BackendServiceAPI} from '../../../model/backend-service-api';
import {map} from 'rxjs/operators';
import {BehaviorSubject, combineLatest, Observable} from 'rxjs';

@Component({
  selector: 'app-configure-github-page',
  templateUrl: './configure-github-page.component.html',
  styleUrls: ['./configure-github-page.component.css']
})
export class ConfigureGithubPageComponent implements OnInit {

  githubConfigurations: Observable<GithubConfiguration[]>;
  addedConfiguration: BehaviorSubject<GithubConfiguration>;

  constructor(
      private backendServiceAPI: BackendServiceAPI) {
  }

  ngOnInit() {
    this.addedConfiguration = new BehaviorSubject<GithubConfiguration>(null);
    this.githubConfigurations = combineLatest(
      this.backendServiceAPI.fileAccessConfigurations().pipe(
        map(configs => configs
          .filter(config => config.type === FileAccessorType.GITHUB)
          .map(config => config  as GithubConfiguration))
      ), this.addedConfiguration
    ).pipe(
        map(values => {
          const configs = values[0];
          const added = values[1];
          return (added === null) ? configs : configs.concat([added]);
        })
    );
  }

  addConfiguration() {
    this.addedConfiguration.next(new GithubConfiguration(null, '', '', null, null, null));
  }

  storeConfiguration(configuration: GithubConfiguration) {
    if (!configuration.id) {
      this.addedConfiguration.next(null);
    }
    this.backendServiceAPI.storeFileAccessConfiguration(configuration);
  }

  deleteConfiguration(configuration: GithubConfiguration) {
    if (!configuration.id) {
      this.addedConfiguration.next(null);
    } else {
      this.backendServiceAPI.deleteFileAccessConfiguration(configuration);
    }
  }

  isExpanded(configuration: GithubConfiguration): boolean {
    return configuration.id === null;
  }
}
