import {Component, Inject, OnInit, Optional} from '@angular/core';
import {AppConfig, APP_CONFIG} from './app.config';
import {TinyTranslatorService} from './model/tiny-translator.service';
import {Router} from '@angular/router';
import {SwUpdate} from '@angular/service-worker';
import { MatSnackBar } from '@angular/material/snack-bar';
import {UpdateAvailableEvent} from '@angular/service-worker';
import {UpdateAvailableComponent} from './update-available/update-available.component';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'app works!';

  constructor(
    @Inject(APP_CONFIG) private appConfig: AppConfig,
    private translatorService: TinyTranslatorService,
    private router: Router,
    @Optional() private swUpdate: SwUpdate,
    private matSnackBar: MatSnackBar
  ) {

  }

  ngOnInit() {
    if (this.swUpdate) {
      this.swUpdate.available.subscribe((event: UpdateAvailableEvent) => {
        console.log('[App] Update available: current version is ', event.current, ', available version is', event.available);
        this.matSnackBar.openFromComponent(UpdateAvailableComponent, {duration: 3000});
      });
    }
  }

  buildtime() {
    return this.appConfig.BUILDTIME;
  }

  buildversion() {
    return this.appConfig.BUILDVERSION;
  }

  currentProjectName(): string {
    const project = this.translatorService.currentProject();
    return project ? project.name : '';
  }

  /**
   * Download using Browser functionality..
   */
  download() {
    this.translatorService.downloadProject(this.translatorService.currentProject());
  }

  /**
   * Publish to the configured backend (Github, ...)
   */
  publish() {
    this.router.navigateByUrl('publishproject');
  }

  publishEnabled(): boolean {
    return this.translatorService.currentProject() && this.translatorService.currentProject().canPublish();
  }
  /**
   * Auto translate all untranslated units.
   * Redirects to a config page, if Google Translate is currently not available.
   * Otherwise auto translates all untranslated units..
   */
  autoTranslate() {
    this.translatorService.canAutoTranslate().subscribe((canTranslate: boolean) => {
      if (canTranslate) {
        this.translatorService.autoTranslate().subscribe((summary) => {
          console.log('Summary: ', summary.content(), summary); // TODO show Toast or result page...
          this.translatorService.currentProject().setAutoTranslateSummaryReport(summary);
          this.router.navigateByUrl('autotranslatesummary');
        });
      } else {
        this.router.navigateByUrl('configureautotranslate');
      }
    });
  }

  configureAutoTranslate() {
    this.router.navigateByUrl('configureautotranslate');
  }

  navigateToAutoTranslateSummary() {
    this.router.navigateByUrl('autotranslatesummary');
  }

  configureGithub() {
    this.router.navigateByUrl('configuregithub');
  }

}
