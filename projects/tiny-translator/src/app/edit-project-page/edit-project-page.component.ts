import { Component, OnInit } from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {Router} from '@angular/router';
import {TranslationProject} from '../model/translation-project';

/**
 * Page to show and edit some properties of the current project.
 * (name, workflowType).-
 */
@Component({
  selector: 'app-edit-project-page',
  templateUrl: './edit-project-page.component.html',
  styleUrls: ['./edit-project-page.component.css']
})
export class EditProjectPageComponent implements OnInit {

  constructor(private translatorService: TinyTranslatorService, private router: Router) { }

  ngOnInit() {
  }

  public editProject(newProject: TranslationProject) {
    this.translatorService.setCurrentProject(newProject);
    this.translatorService.commitChanges(newProject);
    this.router.navigateByUrl('/translate');
  }

  public currentProject(): TranslationProject {
    return this.translatorService.currentProject();
  }
}
