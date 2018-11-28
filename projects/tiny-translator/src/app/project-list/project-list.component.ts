import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TranslationProject} from '../model/translation-project';

@Component({
  selector: 'app-project-list',
  templateUrl: './project-list.component.html',
  styleUrls: ['./project-list.component.css']
})
export class ProjectListComponent implements OnInit {

  @Input() projects: TranslationProject[];

  @Output() onStartProject: EventEmitter<TranslationProject> = new EventEmitter();
  @Output() onDeleteProject: EventEmitter<TranslationProject> = new EventEmitter();
  @Output() onSaveProject: EventEmitter<TranslationProject> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  public startWork(project: TranslationProject) {
    this.onStartProject.emit(project);
  }

  public deleteProject(project: TranslationProject) {
    this.onDeleteProject.emit(project);
  }

  public saveProject(project: TranslationProject) {
    this.onSaveProject.emit(project);
  }

}
