import {ModuleWithProviders} from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import {HomePageComponent} from './home-page/home-page.component';
import {TranslatePageComponent} from './translate-page/translate-page.component';
import {FilterPageComponent} from './filter-page/filter-page.component';
import {ActiveProjectGuard} from './active-project.guard';
import {CreateProjectPageComponent} from './create-project-page/create-project-page.component';
import {EditProjectPageComponent} from './edit-project-page/edit-project-page.component';
import {AutoTranslateSummaryPageComponent} from './auto-translate-summary-page/auto-translate-summary-page.component';
import {ConfigureAutoTranslatePageComponent} from './configure-auto-translate-page/configure-auto-translate-page.component';
import {ConfigureGithubPageComponent} from './file-accessors/github/configure-github-page/configure-github-page.component';
import {PublishProjectPageComponent} from './publish-project-page/publish-project-page.component';

/**
 * Created by martin on 23.03.2017.
 * Routing informations.
 */

const appRoutes: Routes = [
  { path: 'home', component: HomePageComponent },
  { path: 'createproject', component: CreateProjectPageComponent },
  { path: 'editproject', component: EditProjectPageComponent, canActivate: [ActiveProjectGuard] },
  { path: 'publishproject', component: PublishProjectPageComponent, canActivate: [ActiveProjectGuard]},
  { path: 'translate', component: TranslatePageComponent, canActivate: [ActiveProjectGuard] },
  { path: 'selectfilter', component: FilterPageComponent, canActivate: [ActiveProjectGuard] },
  { path: 'autotranslatesummary', component: AutoTranslateSummaryPageComponent},
  { path: 'configureautotranslate', component: ConfigureAutoTranslatePageComponent},
  { path: 'configuregithub', component: ConfigureGithubPageComponent},
  { path: '', redirectTo: '/translate', pathMatch: 'full' },
];

export const appRoutingProviders: any[] = [

];

export const routing: ModuleWithProviders = RouterModule.forRoot(appRoutes, { useHash: true });
