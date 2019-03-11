import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GithubConfigEditorDialogComponent } from './github-config-editor-dialog.component';

describe('GithubConfigEditorDialogComponent', () => {
  let component: GithubConfigEditorDialogComponent;
  let fixture: ComponentFixture<GithubConfigEditorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GithubConfigEditorDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GithubConfigEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
