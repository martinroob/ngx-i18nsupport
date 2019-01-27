import { Injectable } from '@angular/core';
import {IFileAccessService} from '../common/i-file-access-service';
import {IFileDescription} from '../common/i-file-description';
import {from, Observable} from 'rxjs';
import {IFile} from '../common/i-file';
import {GithubConfiguration} from './github-configuration';
import {IFileAccessConfiguration} from '../common/i-file-access-configuration';
import {FileAccessorType} from '../common/file-accessor-type';

@Injectable({
  providedIn: 'root'
})
export class GithubAccessorService implements IFileAccessService {

  constructor() { }

  load(description: IFileDescription): Observable<IFile> {
    // TODO
    return from([]);
  }

  save(file: IFile): Observable<any> {
    // TODO
    return from([]);
  }

  serialize(configuration: GithubConfiguration): string {
    return configuration.serialize();
  }

  deserialize(serializedConfiguration: string): GithubConfiguration {
    return GithubConfiguration.deserialize(serializedConfiguration);
  }

}
