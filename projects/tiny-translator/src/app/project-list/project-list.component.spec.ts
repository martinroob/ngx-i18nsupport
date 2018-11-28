import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectListComponent } from './project-list.component';
import {ProjectComponent} from '../project/project.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';

describe('ProjectListComponent', () => {
  let component: ProjectListComponent;
  let fixture: ComponentFixture<ProjectListComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ProjectListComponent, ProjectComponent ],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
