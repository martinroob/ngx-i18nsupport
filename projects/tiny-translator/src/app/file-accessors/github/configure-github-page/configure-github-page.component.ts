import {Component, OnDestroy, OnInit} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, ValidatorFn, Validators} from '@angular/forms';
import {Branch, Directory, FileContents, GithubApiService, Repo} from '../github-api.service';
import {catchError, distinctUntilChanged, first, map, switchMap, tap} from 'rxjs/operators';
import {Observable, of, Subscription} from 'rxjs';
import {FileAccessorType} from '../../common/file-accessor-type';
import {GithubConfiguration} from '../github-configuration';
import {BackendServiceAPI} from '../../../model/backend-service-api';

@Component({
  selector: 'app-configure-github-page',
  templateUrl: './configure-github-page.component.html',
  styleUrls: ['./configure-github-page.component.css']
})
export class ConfigureGithubPageComponent implements OnInit, OnDestroy {

  private currentConfiguration: GithubConfiguration;
  form: FormGroup;
  private subscriptions: Subscription;
  private _repos: Repo[]; // repos for selected api token read from api
  private _branches: Branch[]; // branches for selected repo read from api

  constructor(
      private formBuilder: FormBuilder,
      private githubApiService: GithubApiService,
      private backendServiceAPI: BackendServiceAPI) { }

  ngOnInit() {
    // TODO there can be more than 1 config...
    this.currentConfiguration =
        this.backendServiceAPI.fileAccessConfigurations()
            .find(config => config.type === FileAccessorType.GITHUB) as GithubConfiguration;
    this._repos = [];
    this._branches = [];
    this.initForm();
    this.subscriptions = this.form.get('repo').valueChanges.pipe(
        switchMap((repoName) => {
          const apiToken = this.form.value.apiToken;
          const repo: Repo = this._repos.find(r => r.name === repoName);
          if (apiToken && repo) {
            return this.githubApiService.branches(repo, apiToken).pipe(
                catchError(() => of([]))
            );
          } else {
            return of([]);
          }
        })
    ).subscribe(
        branches => {
          this._branches = branches;
        }
    );
    this.subscriptions.add(this.form.valueChanges.pipe(
        map(val => {
          return {path: val.path, branchname: val.branch};
        }),
        distinctUntilChanged((val1, val2) => val1.branchname === val2.branchname && val1.path === val2.path),
        switchMap((branchAndPath) => {
          const apiToken = this.form.value.apiToken;
          const branch: Branch = this._branches.find(b => b.name === branchAndPath.branchname);
          const path = branchAndPath.path;
          if (apiToken && branch && path) {
            return this.githubApiService.content(branch, path, apiToken).pipe(
                catchError(() => of([]))
            );
          } else {
            return of([]);
          }
        })
    ).subscribe(
        contents => {
          console.log(contents);
        }
    ));
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  /**
   * Validator to check for valid token.
   * As a side effect the list of available repos is set, if token is valid.
   */
  checkToken(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{[key: string]: any} | null> => {
      if (!control.value) {
        return of(null);
      }
      return this.githubApiService.repos(control.value).pipe(
          first(),
          tap(repos => this._repos = repos),
          map(() => null),
          catchError(() => {
            this._repos = [];
            return of({'tokenInvalid': {value: control.value}});
          })
      );
    };
  }

  /**
   * Validator to check for valid repository.
   */
  checkRepo(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const reponame = control.value;
      if (!reponame) {
        return null;
      }
      const repo = this._repos.find(r => r.name === reponame);
      return repo ? null : {'repoInvalid': {value: reponame}};
    };
  }

  /**
   * Validator to check for valid branch.
   */
  checkBranch(): ValidatorFn {
    return (control: AbstractControl): {[key: string]: any} | null => {
      const branchname = control.value;
      if (!branchname) {
        return null;
      }
      const branch = this._branches.find(b => b.name === branchname);
      return branch ? null : {'branchInvalid': {value: branchname}};
    };
  }

  /**
   * Validator to check for valid path.
   */
  checkPath(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{[key: string]: any} | null> => {
      if (!this.form) {
        return of(null);
      }
      const path = control.value;
      const apiToken = this.form.value.apiToken;
      const branchname = this.form.value.branch;
      const branch = this._branches.find(b => b.name === branchname);
      if (!path || !branch) {
        return of(null);
      }
      return this.githubApiService.content(branch, path, apiToken).pipe(
          first(),
          map((content: FileContents|Directory) => {
            if (content.type !== 'dir') {
              return {'pathIsNoDir': {value: path}};
            }
          }),
          catchError(() => {
            return of({'pathInvalid': {value: path}});
          })
      );
    };
  }

  initForm() {
    if (!this.form) {
      if (this.currentConfiguration) {
        this.form = this.formBuilder.group({
          apiToken: [this.currentConfiguration.apiToken, Validators.required, this.checkToken()],
          repo: [this.currentConfiguration.repo, [Validators.required, this.checkRepo()]],
          branch: [this.currentConfiguration.branch, this.checkBranch()],
          path: [this.currentConfiguration.path, [], this.checkPath()]
        });
      } else {
        this.form = this.formBuilder.group({
          apiToken: ['', Validators.required, this.checkToken()],
          repo: ['', [Validators.required, this.checkRepo()]],
          branch: ['', this.checkBranch()],
          path: ['', [], this.checkPath()]
        });
      }
    }
  }

  store() {
    const id = (this.currentConfiguration) ? this.currentConfiguration.id : null;
    const configuration = new GithubConfiguration(
        id,
        this.form.value.apiToken,
        this.form.value.repo,
        this.form.value.branch,
        this.form.value.path);
    this.backendServiceAPI.storeFileAccessConfiguration(configuration);
    this.currentConfiguration = configuration;
  }

  availableBranches(): string[] {
    return this._branches.map(branch => branch.name);
  }

  availableRepos(): string[] {
    return this._repos.map(repo => repo.name);
  }

}
