import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectStatusComponent } from './project-status.component';
import {TranslationFileStatusComponent} from '../translation-file-status/translation-file-status.component';
import {LanguageComponent} from '../language/language.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {Router} from '@angular/router';
import {AppModule} from '../app.module';

describe('ProjectStatusComponent', () => {
  let component: ProjectStatusComponent;
  let fixture: ComponentFixture<ProjectStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      imports: [AppModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectStatusComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
