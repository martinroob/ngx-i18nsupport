/**
 * A service to access the github api v3.
 * It can read and write repositories and directories and files in the repositories.
 * Access is authenticated via an OAuth access token.
 */
import {Inject, Injectable} from '@angular/core';
import {APP_CONFIG, AppConfig} from '../../app.config';
import {HttpClient, HttpHeaders, HttpParams} from '@angular/common/http';
import {isArray, isNullOrUndefined} from '../../common/util';
import {Observable} from 'rxjs';
import {map} from 'rxjs/operators';
import {Base64} from 'js-base64';
import toBase64 = Base64.toBase64;
import fromBase64 = Base64.fromBase64;

/**
 * Representation of a repository.
 */
export interface GithubRepo {
  owner: string;
  name: string;
}

/**
 * Representation of a branch in a repository.
 */
export interface GithubBranch {
  repo: GithubRepo; // the repo containing the branch
  name: string; // name of branch
}

/**
 * A file.
 */
export interface GithubFileContents {
  type: 'file';
  branch: GithubBranch;
  path: string; // path including name
  name: string; // only name
  sha: string; // SHA1 of file (needed for update operations)
  size: number;
  content?: string; // decoded content, as part of a directory response this is not filled
}

export interface GithubDirectory {
  type: 'dir';
  branch: GithubBranch;
  path: string; // path including name
  name: string; // only name
  sha: string; // SHA1 of file (needed for update operations)
  entries?: (GithubFileContents|GithubDirectory)[]; // absent if directory is not read until now
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
  sha: string;
}

interface DirectoryEntryContentsFromAPI {
  type: 'dir';
  name: string;
  path: string;
  size: number; // always 0 I guess
  sha: string;
}

interface SymlinkContentsFromAPI {
  type: 'symlink';
  name: string;
  path: string;
  size: number;
  target: string;
  sha: string;
}

interface SubmoduleContentsFromAPI {
  type: 'submodule';
  name: string;
  path: string;
  size: number;
  sha: string;
}

type ContentsFromAPI = FileContentsFromAPI | DirectoryEntryContentsFromAPI | SymlinkContentsFromAPI | SubmoduleContentsFromAPI;

/**
 * input type of content update call.
 */
interface ContentsUpdateInputAPI {
  message: string; // Required. The commit message.
  content: string; // Required. The new file content, using Base64 encoding.
  sha: string; // Required. The blob SHA of the file being replaced.
  branch?: string; // The branch name. Default: the repository’s default branch (usually master)
  // committer and author not used here
}

/**
 * return type of content update call.
 */
interface ContentsUpdateFromAPI {
  content: {
    name: string;
    path: string;
    sha: string;
    size: number;
  };
}

// subset of the data returned from the GitHub API v3
// Contains only data that is used here.
// if requested path is a directory, the answer is an array of the directory content, otherwise it is just the object (normally a file)
type FileOrDirectoryContentsFromAPI = ContentsFromAPI | [ContentsFromAPI];

@Injectable({
  providedIn: 'root'
})
export class GithubApiService {

  private readonly _rootUrl: string;

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
    this.failByDesign = app_config.GITHUB_PROVOKE_FAILURES;
  }

  /**
   * Headers used for every request.
   */
  private headers(apiKey?: string): HttpHeaders {
    const key = (apiKey) ? apiKey : this.apiKey();
    return new HttpHeaders()
        .append('Accept', 'application/vnd.github.v3+json')
        .append('Authorization', 'token ' + key);
  }

  /**
   * Send GET request to API.
   * @param relativeUrl URL relative to API root.
   * @param apiKey OAuth-Token
   * @param parameters additional HTTP Parameters.
   * @return GET result of type T
   */
  private get<T>(relativeUrl: string, apiKey: string, parameters?: HttpParams): Observable<T> {
    return this.httpClient.get(this.fullUrl(relativeUrl), {headers: this.headers(apiKey), params: parameters}).pipe(
      map(response => response as T)
    );
  }

  /**
   * Send PUT request to API.
   * Put an Object of type T, return a result of type U.
   * @param relativeUrl URL relative to API root.
   * @param apiKey OAuth-Token
   * @param body request body to send, will be send as a JSON object.
   * @param parameters additional HTTP Parameters.
   * @return PUT result of type U
   */
  private put<T, U>(relativeUrl: string, apiKey: string, body: T, parameters?: HttpParams): Observable<U> {
    return this.httpClient.put(this.fullUrl(relativeUrl), body, {headers: this.headers(apiKey), params: parameters}).pipe(
        map(response => response as U)
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
  public repos(apiKey?: string): Observable<GithubRepo[]> {
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
  public branches(repo: GithubRepo, apiKey?: string): Observable<GithubBranch[]> {
    return this.get<BranchFromAPI[]>(`repos/${repo.owner}/${repo.name}/branches`, apiKey).pipe(
        map(response => response.map((branch: BranchFromAPI) => {
          return {
            name: branch.name,
            repo: repo
          };
        }))
    );
  }

  /**
   * Get content of a file or directory.
   * @param branch branch
   * @param path path
   * @param apiKey OAuth token of user.
   */
  public content(branch: GithubBranch, path: string, apiKey?: string): Observable<GithubFileContents|GithubDirectory> {
    const repo = branch.repo;
    const url = `repos/${repo.owner}/${repo.name}/contents/${path}`;
    return this.get<FileOrDirectoryContentsFromAPI>(
        url,
        apiKey,
        new HttpParams().append('ref', branch.name)
    ).pipe(
        map((response: FileOrDirectoryContentsFromAPI) => {
          if (isArray(response)) {
            // it is a directory
            return this.toDirectory(branch, path, response as ContentsFromAPI[]);
          } else {
            const singleResponse: ContentsFromAPI = response as ContentsFromAPI;
            switch (singleResponse.type) {
              case 'file':
                return this.toFileContents(branch, response as FileContentsFromAPI);
              case 'symlink':
              default:
                // TODO
            }
          }
        })
    );
  }

  /**
   * Update (or create) a file
   * @param branch the branch
   * @param newContents the updated content (path and content must be set, sha must be set, if it is an update)
   * @param message the commit message
   * @param apiKey OAuth token of user.
   */
  public updateContent(
      branch: GithubBranch,
      newContents: GithubFileContents,
      message: string,
      apiKey?: string): Observable<GithubFileContents> {
    const repo = branch.repo;
    const url = `repos/${repo.owner}/${repo.name}/contents/${newContents.path}`;
    return this.put<ContentsUpdateInputAPI, ContentsUpdateFromAPI>(
        url,
        apiKey,
        {
          message: message,
          content: this.toBase64(newContents.content),
          sha: newContents.sha,
          branch: branch.name
        } as ContentsUpdateInputAPI
    ).pipe(
        map((response: ContentsUpdateFromAPI) => {
          return {
            type: 'file',
            branch: branch,
            path: response.content.path,
            name: response.content.name,
            size: response.content.size,
            content: newContents.content,
            sha: response.content.sha
          } as GithubFileContents;
        })
    );
  }

  private toFileContents(branch: GithubBranch, contentApiResponse: FileContentsFromAPI): GithubFileContents {
    const content = contentApiResponse.content;
    let decodedContent: string|undefined;
    if (!isNullOrUndefined(content) && !isNullOrUndefined(contentApiResponse.encoding)) {
      if (contentApiResponse.encoding === 'base64') {
        decodedContent = this.fromBase64(content);
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
      content: decodedContent,
      sha: contentApiResponse.sha
    };
  }

  private toDirectory(branch: GithubBranch, path: string, contentApiResponse: ContentsFromAPI[]): GithubDirectory {
    const entries: (GithubDirectory|GithubFileContents|null)[] = contentApiResponse.map((entry: ContentsFromAPI) => {
      switch (entry.type) {
        case 'file':
          return this.toFileContents(branch, entry);
        case 'symlink':
          return null;
        case 'submodule':
          return null;
        case 'dir':
          return {
            type: 'dir',
            branch: branch,
            path: path,
            name: entry.name,
            sha: entry.sha
          } as GithubDirectory;
        default:
          return null;
      }
    }).filter(entry => entry !== null);
    return {
      type: 'dir',
      branch: branch,
      path: path,
      name: this.basename(path),
      sha: '',
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

  private toBase64(str: string): string {
    return toBase64(str);
  }

  private fromBase64(b64str: string): string {
    return fromBase64(b64str);
  }

}
