import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectEditorComponent } from './project-editor.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {FormBuilder} from '@angular/forms';

describe('ProjectEditorComponent', () => {
  let component: ProjectEditorComponent;
  let fixture: ComponentFixture<ProjectEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectEditorComponent ],
      providers: [FormBuilder],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
