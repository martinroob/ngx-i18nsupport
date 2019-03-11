import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileAccessConfigurationEditorDialogComponent } from './file-access-configuration-editor-dialog.component';

describe('FileAccessConfigurationEditorDialogComponent', () => {
  let component: FileAccessConfigurationEditorDialogComponent;
  let fixture: ComponentFixture<FileAccessConfigurationEditorDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileAccessConfigurationEditorDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileAccessConfigurationEditorDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
