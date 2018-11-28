import { Component, OnInit } from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {TranslationProject} from '../model/translation-project';
import {Router} from '@angular/router';

@Component({
  selector: 'app-create-project-page',
  templateUrl: './create-project-page.component.html',
  styleUrls: ['./create-project-page.component.css']
})
export class CreateProjectPageComponent implements OnInit {

  constructor(private translatorService: TinyTranslatorService, private router: Router) { }

  ngOnInit() {
  }

  public addProject(newProject: TranslationProject) {
      this.translatorService.addProject(newProject);
      this.translatorService.setCurrentProject(newProject);
      this.router.navigateByUrl('/translate');
  }

}
