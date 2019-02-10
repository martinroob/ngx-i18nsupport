import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {AbstractControl, AsyncValidatorFn, FormBuilder, FormGroup, Validators} from '@angular/forms';
import {GithubBranch, GithubDirectory, GithubFileContents, GithubApiService, GithubRepo} from '../github-api.service';
import {catchError, finalize, first, map, switchMap} from 'rxjs/operators';
import {Observable, of} from 'rxjs';
import {GithubConfiguration} from '../github-configuration';
import {IFileDescription} from '../../common/i-file-description';
import {MatDialog} from '@angular/material';
import {FileExplorerDialogComponent, FileExplorerDialogData} from '../../common/file-explorer-dialog/file-explorer-dialog.component';

@Component({
  selector: 'app-github-config-editor',
  templateUrl: './github-config-editor.component.html',
  styleUrls: ['./github-config-editor.component.css']
})
export class GithubConfigEditorComponent implements OnInit {

  @Input() githubConfiguration: GithubConfiguration;
  @Output() storeConfiguration: EventEmitter<GithubConfiguration> = new EventEmitter<GithubConfiguration>();

  form: FormGroup;
  private _apiTokenValid = false;
  private _repos: GithubRepo[] = []; // repos for selected api token read from api
  private _branches: GithubBranch[] = []; // branches for selected repo read from api

  constructor(
      private formBuilder: FormBuilder,
      private githubApiService: GithubApiService,
      public dialog: MatDialog) { }

  ngOnInit() {
    this.initForm();
  }

  checkApiTokenValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{[key: string]: any} | null> => {
      const token = control.value;
      return of(null).pipe(
          switchMap(() => {
            if (!token) {
              this._apiTokenValid = false;
              this._repos = [];
              return of(null);
            }
            return this.githubApiService.repos(token).pipe(
                first(),
                map(repos => {
                  this._apiTokenValid = true;
                  this._repos = repos;
                  return null;
                }),
                catchError(() => {
                  this._apiTokenValid = false;
                  this._repos = [];
                  return of({'tokenInvalid': {value: token}});
                })
            );
          }),
          finalize(() => {
            if (this.form) {
              this.form.get('repo').updateValueAndValidity();
            }
          })
      );
    };
  }

  checkRepoValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{[key: string]: any} | null> => {
      return of(null).pipe(
          switchMap(() => {
            const reponame = control.value;
            if (!reponame) {
              this._branches = [];
              return of(null);
            }
            if (!this._apiTokenValid) {
              this._branches = [];
              return of({'repoUncheckable': {value: reponame}});
            }
            const repo = this._repos.find(r => r.name === reponame);
            if (!repo) {
              this._branches = [];
              return of({'repoInvalid': {value: reponame}});
            }
            return this.githubApiService.branches(repo, this.form.value.apiToken).pipe(
                first(),
                map(branches => {
                  this._branches = branches;
                  return null;
                }),
                catchError(() => {
                  this._apiTokenValid = false;
                  this._branches = [];
                  return of({'repoInvalid': {value: reponame}});
                }),
            );
          }),
          finalize(() => {
            if (this.form) {
              this.form.get('branch').updateValueAndValidity();
            }
          })
      );
    };
  }

  checkBranchValidator(): AsyncValidatorFn {
    return ((control: AbstractControl): Observable<{[key: string]: any} | null> => {
      return of(null).pipe(
          switchMap(() => {
            const branchname = control.value;
            if (!branchname) {
              return of(null);
            }
            if (!this._apiTokenValid) {
              return of({'branchUncheckable': {value: branchname}});
            }
            const branch = this._branches.find(b => b.name === branchname);
            return of(branch ? null : {'branchInvalid': {value: branchname}});
          }),
          finalize(() => {
            if (this.form) {
              this.form.get('path').updateValueAndValidity();
            }
          })
      );
    });
  }

  /**
   * Validator to check for valid path.
   */
  checkPathValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<{ [key: string]: any } | null> => {
      return of(null).pipe(
          switchMap(() => {
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
                map((content: GithubFileContents | GithubDirectory) => {
                  if (content.type !== 'dir') {
                    control.markAsTouched();
                    return {'pathIsNoDir': {value: path}};
                  }
                }),
                catchError(() => {
                  control.markAsTouched();
                  return of({'pathInvalid': {value: path}});
                })
            );
          })
      );
    };
  }


  initForm() {
    if (!this.form) {
      const configuration = (this.githubConfiguration) ? this.githubConfiguration : {apiToken: '', repo: '', branch: '', path: ''};
      this.form = this.formBuilder.group({
        apiToken: [configuration.apiToken, [Validators.required], [this.checkApiTokenValidator()]],
        repo: [configuration.repo, [Validators.required], [this.checkRepoValidator()]],
        branch: [configuration.branch, [], [this.checkBranchValidator()]],
        path: [configuration.path, [], [this.checkPathValidator()]]
      });
    }
  }

  private currentConfiguration(actualPath: string): GithubConfiguration {
      const id = (this.githubConfiguration) ? this.githubConfiguration.id : null;
      const repo = this.form.value.repo;
      const owner = (repo) ? this._repos.find(r => r.name === repo).owner : null;
      return new GithubConfiguration(
          id,
          this.form.value.apiToken,
          owner,
          repo,
          this.form.value.branch,
          actualPath);
  }

  store() {
    const configuration = this.currentConfiguration(this.form.value.path);
    this.storeConfiguration.emit(configuration);
    this.githubConfiguration = configuration;
  }

  availableBranches(): string[] {
    return this._branches.map(branch => branch.name);
  }

  availableRepos(): string[] {
    return this._repos.map(repo => repo.name);
  }

  openPathBrowser() {
      const dialogRef = this.dialog.open(FileExplorerDialogComponent, {
          data: {
              configuration: this.currentConfiguration(''),
              selectableFileType: 'dir'
          } as FileExplorerDialogData
      });

      dialogRef.afterClosed().subscribe((result: IFileDescription) => {
          if (result) {
              this.form.get('path').patchValue(result.name);
          }
      });

  }
}
