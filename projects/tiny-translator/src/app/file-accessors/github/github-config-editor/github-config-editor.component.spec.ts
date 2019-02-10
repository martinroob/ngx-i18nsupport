import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubConfigEditorComponent } from './github-config-editor.component';

describe('ConfigureGithubPageComponent', () => {
  let component: GithubConfigEditorComponent;
  let fixture: ComponentFixture<GithubConfigEditorComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GithubConfigEditorComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GithubConfigEditorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
