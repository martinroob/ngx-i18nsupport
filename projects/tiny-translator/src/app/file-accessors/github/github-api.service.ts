/**
 * A service to access the github api v3.
 * It can read repositories and directories and files in the repositories.
 * Access is authenticated via an OAuth access token.
 */
import {Inject, Injectable} from '@angular/core';
import {AutoTranslateDisabledReason, AutoTranslateDisabledReasonKey} from '../../model/auto-translate-service-api';
import {APP_CONFIG, AppConfig} from '../../app.config';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {isArray, isNullOrUndefined} from '../../common/util';
import {Observable, of} from 'rxjs';
import {map} from 'rxjs/operators';
import {format} from 'util';

/**
 * Representation of a repository.
 */
export interface Repo {
  name: string;
  owner: string;
}

/**
 * Representation of a branch in a repository.
 */
export interface Branch {
  repo: Repo; // the repo containing the branch
  name: string; // name of branch
}

/**
 * A file.
 */
export interface FileContents {
  type: 'file';
  branch: Branch;
  path: string; // path including name
  name: string; // only name
  size: number;
  content?: string; // decoded content, as part of a directory response this is not filled
}

export interface Directory {
  type: 'dir';
  branch: Branch;
  path: string; // path including name
  name: string; // only name
  entries?: (FileContents|Directory)[]; // absent if directory is not read until now
}

// subset of the data returned from the GitHub API v3
// Contains only data that is used here.
interface RepoFromAPI {
  name: string;
  owner: {
    login: string;
  };
}

// subset of the data returned from the GitHub API v3
// Contains only data that is used here.
interface BranchFromAPI {
  name: string;
}

interface FileContentsFromAPI {
  type: 'file';
  name: string;
  path: string;
  size: number;
  encoding?: 'base64'; // TODO can there be anything else?
  content?: string;
}

interface DirectoryEntryContentsFromAPI {
  type: 'dir';
  name: string;
  path: string;
  size: number; // always 0 I guess
}

interface SymlinkContentsFromAPI {
  type: 'symlink';
  name: string;
  path: string;
  size: number;
  target: string;
}

interface SubmoduleContentsFromAPI {
  type: 'submodule';
  name: string;
  path: string;
  size: number;
}

type AnyContentsFromAPI = FileContentsFromAPI | DirectoryEntryContentsFromAPI | SymlinkContentsFromAPI | SubmoduleContentsFromAPI;

// subset of the data returned from the GitHub API v3
// Contains only data that is used here.
// if requested path is a directory, the answer is an array of the directory content, otherwise it is just the object (normally a file)
type FileOrDirectoryContentsFromAPI = AnyContentsFromAPI | [AnyContentsFromAPI];

@Injectable({
  providedIn: 'root'
})
export class GithubApiService {

  private _rootUrl: string;

  private _apiKey: string;

  // a setting for tests!!
  // if set to true, some functions (TODO which functions?) will FAIL BY DESIGN
  // Used to allow testing of failures.
  private failByDesign: boolean;

  constructor(@Inject(APP_CONFIG) app_config: AppConfig, private httpClient: HttpClient) {
    this._rootUrl = app_config.GITHUB_API_ROOT_URL;
    // API key is secret, normally it is not configured and will be null
    // it can be set interactively in the app
    // but in the karma tests it will be set. It is stored than in environment.secret.ts (not in Git)
    this.setApiKey(app_config.GITHUB_API_KEY); // must be set explicitly via setApiKey()
    this.failByDesign = false;
    if (app_config.GITHUB_PROVOKE_FAILURES === true) {
      this.failByDesign = true;
    }
  }

  /**
   * Headers used for every request.
   */
  private headers(apiKey?: string): HttpHeaders {
    const key = (apiKey) ? apiKey : this.apiKey();
    const _headers = new HttpHeaders()
        .append('Accept', 'application/vnd.github.v3+json')
        .append('Authorization', 'token ' + key);
    return _headers;
  }

  private get<T>(relativeUrl: string, apiKey: string, parameters?: HttpParams): Observable<T> {
    return this.httpClient.get(this.fullUrl(relativeUrl), {headers: this.headers(apiKey), params: parameters}).pipe(
      map(response => response as T)
    );
  }

  private fullUrl(relativeUrl: string): string {
    return this._rootUrl + relativeUrl;
  }

  public apiKey(): string {
    return this._apiKey;
  }

  public setApiKey(key: string) {
    this._apiKey = key;
  }

  /**
   * Get a list of repos of the authenticated user.
   * @param apiKey OAuth token of user.
   */
  public repos(apiKey?: string): Observable<Repo[]> {
    return this.get<RepoFromAPI[]>('user/repos', apiKey).pipe(
      map(response => response.map((repo: RepoFromAPI) => {
        return {
          name: repo.name,
          owner: repo.owner.login
        };
      }))
    );
  }

  /**
   * Get a list of branches of the authenticated user and selected repo.
   * @param repo the repository to be accessed
   * @param apiKey OAuth token of user.
   */
  public branches(repo: Repo, apiKey?: string): Observable<Branch[]> {
    return this.get<BranchFromAPI[]>(format('repos/%s/%s/branches', repo.owner, repo.name), apiKey).pipe(
        map(response => response.map((branch: BranchFromAPI) => {
          return {
            name: branch.name,
            repo: repo
          };
        }))
    );
  }

  public content(branch: Branch, path: string, apiKey?: string): Observable<FileContents|Directory> {
    const repo = branch.repo;
    return this.get<FileOrDirectoryContentsFromAPI>(
        format('repos/%s/%s/contents/%s', repo.owner, repo.name, path),
        apiKey,
        new HttpParams().append('ref', branch.name)
    ).pipe(
        map((response: FileOrDirectoryContentsFromAPI) => {
          if (isArray(response)) {
            // it is a directory
            return this.toDirectory(branch, path, response as AnyContentsFromAPI[]);
          } else {
            const singleResponse: AnyContentsFromAPI = response as AnyContentsFromAPI;
            switch (singleResponse.type) {
              case 'file':
                return this.toFileContents(branch, path, response as FileContentsFromAPI);
              case 'symlink':
              default:
                // TODO
            }
          }
        })
    );
  }

  private toFileContents(branch: Branch, path: string, contentApiResponse: FileContentsFromAPI): FileContents {
    const content = contentApiResponse.content;
    let decodedContent: string|undefined;
    if (!isNullOrUndefined(content) && !isNullOrUndefined(contentApiResponse.encoding)) {
      if (contentApiResponse.encoding === 'base64') {
        decodedContent = atob(content);
      } else {
        decodedContent = '??? unknown encoding' + contentApiResponse.encoding;
      }
    } else {
      decodedContent = undefined;
    }
    return {
      type: 'file',
      branch: branch,
      path: contentApiResponse.path,
      name: contentApiResponse.name,
      size: contentApiResponse.size,
      content: decodedContent
    };
  }

  private toDirectory(branch: Branch, path: string, contentApiResponse: AnyContentsFromAPI[]): Directory {
    const entries: (Directory|FileContents|null)[] = contentApiResponse.map((entry: AnyContentsFromAPI) => {
      switch (entry.type) {
        case 'file':
          return this.toFileContents(branch, entry.path, entry);
        case 'symlink':
          return null;
        case 'submodule':
          return null;
        case 'dir':
          return {
            type: 'dir',
            branch: branch,
            path: path,
            name: entry.name
          } as Directory;
        default:
          return null;
      }
    }).filter(entry => entry !== null);
    return {
      type: 'dir',
      branch: branch,
      path: path,
      name: this.basename(path),
      entries: entries
    };
  }

  basename(path: string): string {
    const index = path.lastIndexOf('/');
    if (index >= 0) {
      return path.substr(index + 1);
    } else {
      return path;
    }
  }
}
