import {Injectable} from '@angular/core';
import {FileStatus, ICommitData, IFileAccessService, IFileStats} from '../common/i-file-access-service';
import {IFileDescription} from '../common/i-file-description';
import {Observable, of, throwError} from 'rxjs';
import {GithubConfiguration} from './github-configuration';
import {catchError, first, map, switchMap} from 'rxjs/operators';
import {GithubApiService, GithubBranch, GithubDirectory, GithubFileContents} from './github-api.service';
import {SerializationService} from '../../model/serialization.service';
import {IFile} from '../common/i-file';
import {GithubFileDescription} from './github-file-description';
import {GithubFile} from './github-file';

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

  load(description: IFileDescription): Observable<GithubFile|IFileDescription> {
    const configuration: GithubConfiguration = description.configuration as GithubConfiguration;
    const branch: GithubBranch = {
      repo: {
        owner: configuration.owner,
        name: configuration.repo
      },
      name: configuration.branch
    };
    const apiToken = configuration.apiToken;
    const path = pathjoin(configuration.path, description.path);
    return this.githubApiService.content(branch, path, apiToken).pipe(
        first(),
        map((content: GithubFileContents|GithubDirectory) => {
          if (content.type === 'dir') {
            const children = content.entries.map((entry: GithubFileContents|GithubDirectory) => {
              if (entry.type === 'dir') {
                return new GithubFileDescription('dir', configuration, pathjoin(description.path, entry.name), entry.name);
              } else {
                return new GithubFileDescription('file', configuration, pathjoin(description.path, entry.name), entry.name);
              }
            });
            return new GithubFileDescription('dir', configuration, description.path, description.name, children);
          } else {
            const descr = new GithubFileDescription('file', configuration, description.path, description.name);
            return new GithubFile(descr, content.name, content.size, content.content, content.sha);
          }
        })
    );
  }

  save(file: GithubFile, commitData: ICommitData): Observable<GithubFile> {
    const configuration: GithubConfiguration = file.description.configuration as GithubConfiguration;
    const branch: GithubBranch = {
      name: configuration.branch,
      repo: {
        name: configuration.repo,
        owner: configuration.owner
      },
    };
    const content: GithubFileContents = {
      type: 'file',
      name: file.description.name,
      branch: branch,
      path: pathjoin(configuration.path, file.description.path),
      size: file.size,
      content: file.content,
      sha: file.sha
    };
    const apiKey = configuration.apiToken;
    if (!commitData || !commitData.message) {
      return throwError('no commit message');
    }
    const message = commitData.message;
    return this.stats(file).pipe(
      map((stats: IFileStats) => {
        console.log('stats', stats, commitData);
        if (stats.status !== FileStatus.EXISTS_NOT) {
          if (commitData.override) {
            console.log('sha', (stats as any).sha);
            return (stats as any).sha;
          } else {
            throw Error('file exists');
          }
        } else {
          return null;
        }
      }),
      switchMap((sha: string) => {
        console.log('sha', sha);
        content.sha = sha;
        return this.githubApiService.updateContent(branch, content, message, apiKey).pipe(
          map((newFileContent: GithubFileContents) => {
            return new GithubFile(
              file.description,
              newFileContent.name,
              newFileContent.size,
              newFileContent.content,
              newFileContent.sha);
          })
        );
      })
    );
  }

  stats(file: IFile): Observable<IFileStats> {
    const configuration: GithubConfiguration = file.description.configuration as GithubConfiguration;
    const branch: GithubBranch = {
      name: configuration.branch,
      repo: {
        name: configuration.repo,
        owner: configuration.owner
      },
    };
    return this.githubApiService.content(branch, pathjoin(configuration.path, file.description.path), configuration.apiToken).pipe(
      map((content: GithubFileContents|GithubDirectory) => {
        if (content.sha === (file as GithubFile).sha) {
          return {status: FileStatus.UNCHANGED, sha: content.sha};
        } else {
          return {status: FileStatus.CHANGED, sha: content.sha};
        }
      }),
      catchError(() => {
        return of({status: FileStatus.EXISTS_NOT});
      })
    );
  }

  serialize(serializationService: SerializationService, configuration: GithubConfiguration): string {
    return configuration.serialize(serializationService);
  }

  deserialize(serializationService: SerializationService, serializedConfiguration: string): GithubConfiguration {
    return GithubConfiguration.deserialize(serializationService, serializedConfiguration);
  }

}
