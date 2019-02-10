import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileExplorerDialogComponent } from './file-explorer-dialog.component';

describe('FileExplorerDialogComponent', () => {
  let component: FileExplorerDialogComponent;
  let fixture: ComponentFixture<FileExplorerDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileExplorerDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileExplorerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
