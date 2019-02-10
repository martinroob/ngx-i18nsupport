import { Component, OnInit } from '@angular/core';
import {FileAccessorType} from '../../common/file-accessor-type';
import {GithubConfiguration} from '../github-configuration';
import {BackendServiceAPI} from '../../../model/backend-service-api';

@Component({
  selector: 'app-configure-github-page',
  templateUrl: './configure-github-page.component.html',
  styleUrls: ['./configure-github-page.component.css']
})
export class ConfigureGithubPageComponent implements OnInit {

  githubConfigurations: GithubConfiguration[];

  constructor(
      private backendServiceAPI: BackendServiceAPI) {
    this.githubConfigurations =
        this.backendServiceAPI.fileAccessConfigurations()
            .filter(config => config.type === FileAccessorType.GITHUB)
            .map(config => config  as GithubConfiguration);
  }

  ngOnInit() {
  }

  addConfiguration() {
    this.githubConfigurations.push(new GithubConfiguration(null, '', '', null, null, null));
  }

  storeConfiguration(configuration: GithubConfiguration) {
    this.backendServiceAPI.storeFileAccessConfiguration(configuration);
  }

  deleteConfiguration(configuration: GithubConfiguration) {
    this.backendServiceAPI.deleteFileAccessConfiguration(configuration);
    this.githubConfigurations = this.githubConfigurations.filter(config => config !== configuration);
  }
}
