import { Injectable } from '@angular/core';
import {IFileAccessService} from '../common/i-file-access-service';
import {IFileDescription} from '../common/i-file-description';
import {from, Observable} from 'rxjs';
import {IFile} from '../common/i-file';
import {GithubConfiguration} from './github-configuration';
import {first, map} from 'rxjs/operators';
import {GithubBranch, GithubDirectory, GithubFileContents, GithubApiService} from './github-api.service';
import {IFileDescriptionDirectory} from '../common/i-file-description-directory';
import {IFileDescriptionFile} from '../common/i-file-description-file';

function pathjoin(path: string, subdir: string) {
  if (subdir && subdir.startsWith('/')) {
    subdir = subdir.substr(1);
  }
  if (path && path.endsWith('/')) {
    return path + subdir;
  }
  return (path) ? path + '/' + subdir : subdir;
}

@Injectable({
  providedIn: 'root'
})
export class GithubAccessorService implements IFileAccessService {

  constructor(private githubApiService: GithubApiService) { }

  load(description: IFileDescription): Observable<IFile|IFileDescriptionDirectory> {
    const configuration: GithubConfiguration = description.configuration as GithubConfiguration;
    const branch: GithubBranch = {
      repo: {
        owner: configuration.owner,
        name: configuration.repo
      },
      name: configuration.branch
    };
    const apiToken = configuration.apiToken;
    const path = pathjoin(configuration.path, description.name);
    return this.githubApiService.content(branch, path, apiToken).pipe(
        first(),
        map((content: GithubFileContents|GithubDirectory) => {
          if (content.type === 'dir') {
            return {
              type: 'dir',
              name: content.name,
              configuration: configuration,
              children: content.entries.map((entry: GithubFileContents|GithubDirectory) => {
                if (entry.type === 'dir') {
                  return {
                    type: 'dir',
                    configuration: configuration,
                    name: pathjoin(description.name, entry.name)
                  } as IFileDescriptionDirectory;
                } else {
                  return {
                    type: 'file',
                    configuration: configuration,
                    name: pathjoin(description.name, entry.name)
                  } as IFileDescriptionFile;
                }
              })
            } as IFileDescriptionDirectory;
          } else {
            const file: IFile = {
              description: {
                type: 'file',
                configuration: configuration,
                name: content.name
              },
              size: content.size,
              content: content.content
            };
            return file;
          }
        })
    );
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
