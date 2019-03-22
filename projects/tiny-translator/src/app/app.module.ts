import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {HttpClientModule} from '@angular/common/http';
import {ServiceWorkerModule} from '@angular/service-worker';
import {environment} from '../environments/environment';

import {APP_CONFIG, APP_CONFIG_VALUE} from './app.config';
import {routing, appRoutingProviders} from './app.routing';

import 'hammerjs';

import { AppComponent } from './app.component';
import { ProjectStarterComponent } from './project-starter/project-starter.component';
import {TinyTranslatorService} from './model/tiny-translator.service';
import { TranslationFileStatusComponent } from './translation-file-status/translation-file-status.component';
import { HomePageComponent } from './home-page/home-page.component';
import { TranslatePageComponent } from './translate-page/translate-page.component';
import { TranslateUnitComponent } from './translate-unit/translate-unit.component';
import {DownloaderService} from './file-accessors/download-upload/downloader.service';
import { TranslateUnitListComponent } from './translate-unit-list/translate-unit-list.component';
import { AbbreviatePipe } from './common/abbreviate.pipe';
import { LanguageComponent } from './language/language.component';
import {ActiveProjectGuard} from './active-project.guard';
import {BackendServiceAPI} from './model/backend-service-api';
import {BackendLocalStorageService} from './model/backend-local-storage.service';
import {AutoTranslateServiceAPI} from './model/auto-translate-service-api';
import {AutoTranslateGoogleService} from './model/auto-translate-google.service';
import { ProjectComponent } from './project/project.component';
import { ProjectListComponent } from './project-list/project-list.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import { CreateProjectPageComponent } from './create-project-page/create-project-page.component';
import { ProjectStatusComponent } from './project-status/project-status.component';
import {AsynchronousFileReaderService} from './file-accessors/download-upload/asynchronous-file-reader.service';
import { NormalizedMessageInputComponent } from './normalized-message-input/normalized-message-input.component';
import {TranslateUnitWarningConfirmDialogComponent} from './translate-unit-warning-confirm-dialog/translate-unit-warning-confirm-dialog.component';
import {AppMaterialModule} from './app-material.module';
import { EditProjectPageComponent } from './edit-project-page/edit-project-page.component';
import { ProjectEditorComponent } from './project-editor/project-editor.component';
import { ConfigureAutoTranslatePageComponent } from './configure-auto-translate-page/configure-auto-translate-page.component';
import { AutoTranslateSummaryPageComponent } from './auto-translate-summary-page/auto-translate-summary-page.component';
import { TranslationUnitFilterService } from './model/filters/translation-unit-filter.service';
import { FilterStatusComponent } from './filter-status/filter-status.component';
import { FilterPageComponent } from './filter-page/filter-page.component';
import { UpdateAvailableComponent } from './update-available/update-available.component';
import {TranslationFileUploadComponent} from './file-accessors/download-upload/translation-file-upload/translation-file-upload.component';
import {DownloadUploadService} from './file-accessors/download-upload/download-upload.service';
import {TranslationFileFromGithubComponent} from './file-accessors/github/translation-file-from-github/translation-file-from-github.component';
import {GithubAccessorService} from './file-accessors/github/github-accessor.service';
import {GithubConfigEditorComponent} from './file-accessors/github/github-config-editor/github-config-editor.component';
import {ConfigureGithubPageComponent} from './file-accessors/github/configure-github-page/configure-github-page.component';
import {FileExplorerComponent} from './file-accessors/common/file-explorer/file-explorer.component';
import {FileExplorerDialogComponent} from './file-accessors/common/file-explorer-dialog/file-explorer-dialog.component';
import {PublishProjectPageComponent} from './publish-project-page/publish-project-page.component';
import {GithubConfigEditorDialogComponent} from './file-accessors/github/github-config-editor-dialog/github-config-editor-dialog.component';
import {ConfirmDialogComponent} from './confirm-dialog/confirm-dialog.component';
import {SaveAsExplorerComponent} from './file-accessors/common/save-as-explorer/save-as-explorer.component';
import {FileToSaveComponent} from './file-accessors/common/file-to-save/file-to-save.component';
import {SaveAsExplorerDialogComponent} from './file-accessors/common/save-as-explorer-dialog/save-as-explorer-dialog.component';

@NgModule({
  declarations: [
    AbbreviatePipe,
    AppComponent,
    AutoTranslateSummaryPageComponent,
    ConfigureAutoTranslatePageComponent,
    ConfigureGithubPageComponent,
    ConfirmDialogComponent,
    CreateProjectPageComponent,
    EditProjectPageComponent,
    FileToSaveComponent,
    FileExplorerComponent,
    FileExplorerDialogComponent,
    FilterStatusComponent,
    FilterPageComponent,
    GithubConfigEditorComponent,
    GithubConfigEditorDialogComponent,
    HomePageComponent,
    LanguageComponent,
    NormalizedMessageInputComponent,
    ProjectComponent,
    ProjectEditorComponent,
    ProjectListComponent,
    ProjectStarterComponent,
    ProjectStatusComponent,
    PublishProjectPageComponent,
    SaveAsExplorerComponent,
    SaveAsExplorerDialogComponent,
    TranslationFileStatusComponent,
    TranslatePageComponent,
    TranslateUnitComponent,
    TranslateUnitListComponent,
    TranslationFileUploadComponent,
    TranslationFileFromGithubComponent,
    TranslateUnitWarningConfirmDialogComponent,
    UpdateAvailableComponent
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    FormsModule,
    ReactiveFormsModule,
    HttpClientModule,
    AppMaterialModule,
    routing,
    ServiceWorkerModule.register(environment.base_href + 'ngsw-worker.js', { enabled: environment.production })
  ],
  providers: [
    {provide: APP_CONFIG, useValue: APP_CONFIG_VALUE},
    appRoutingProviders,
    TinyTranslatorService,
    AsynchronousFileReaderService,
    DownloaderService,
    DownloadUploadService,
    GithubAccessorService,
    ActiveProjectGuard,
    {provide: BackendServiceAPI, useClass: BackendLocalStorageService},
    {provide: AutoTranslateServiceAPI, useClass: AutoTranslateGoogleService},
    TranslationUnitFilterService,
  ],
  entryComponents: [
    ConfirmDialogComponent,
    FileExplorerDialogComponent,
    GithubConfigEditorDialogComponent,
    SaveAsExplorerDialogComponent,
    TranslateUnitWarningConfirmDialogComponent,
    UpdateAvailableComponent
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
