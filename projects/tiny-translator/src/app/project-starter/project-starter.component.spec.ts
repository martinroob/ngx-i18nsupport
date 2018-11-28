import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectStarterComponent } from './project-starter.component';
import {AppModule} from '../app.module';

describe('ProjectStarterComponent', () => {
  let component: ProjectStarterComponent;
  let fixture: ComponentFixture<ProjectStarterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [AppModule]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ProjectStarterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
