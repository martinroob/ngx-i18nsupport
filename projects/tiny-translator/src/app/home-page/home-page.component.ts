import { Component, OnInit } from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {Router} from '@angular/router';
import {TranslationProject} from '../model/translation-project';

@Component({
  selector: 'app-home-page',
  templateUrl: './home-page.component.html',
  styleUrls: ['./home-page.component.css']
})
export class HomePageComponent implements OnInit {

  constructor(private translatorService: TinyTranslatorService, private router: Router) { }

  ngOnInit() {
  }

  public projects(): TranslationProject[] {
    return this.translatorService.projects();
  }

  public startProject(project: TranslationProject) {
    this.translatorService.setCurrentProject(project);
    this.router.navigateByUrl('translate');
  }

  public deleteProject(project: TranslationProject) {
    this.translatorService.deleteProject(project);
  }

  public saveProject(project: TranslationProject) {
    this.translatorService.downloadProject(project);
  }
}
