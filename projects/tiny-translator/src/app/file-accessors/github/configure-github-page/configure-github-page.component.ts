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
  activeConfigurations: {[index: number]: {valid: boolean, configuration: GithubConfiguration}};

  constructor(
      private backendServiceAPI: BackendServiceAPI) {
    this.githubConfigurations =
        this.backendServiceAPI.fileAccessConfigurations()
            .filter(config => config.type === FileAccessorType.GITHUB)
            .map(config => config  as GithubConfiguration);
  }

  ngOnInit() {
    this.activeConfigurations = [];
  }

  changeActiveConfiguration(index: number, newValue: {valid: boolean, configuration: GithubConfiguration}) {
    this.activeConfigurations[index] = newValue;
  }

  isActiveConfigurationValid(index: number): boolean {
    return this.activeConfigurations[index] && this.activeConfigurations[index].valid;
  }

  storeActiveConfiguration(index: number) {
    if (this.isActiveConfigurationValid(index)) {
      this.storeConfiguration(this.activeConfigurations[index].configuration);
    }
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
