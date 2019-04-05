import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {TranslationProject} from '../model/translation-project';
import {TranslationFile} from '../model/translation-file';

@Component({
  selector: 'app-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit {

  @Input() project: TranslationProject;
  @Input() showActions = true;

  @Output() onStartWork: EventEmitter<TranslationProject> = new EventEmitter();
  @Output() onDeleteProject: EventEmitter<TranslationProject> = new EventEmitter();
  @Output() onSave: EventEmitter<TranslationProject> = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  save(translationFile: TranslationFile) {
    this.onSave.emit(this.project);
  }

  startWork() {
    this.onStartWork.emit(this.project);
  }

  deleteProject() {
    this.onDeleteProject.emit(this.project);
  }
}
