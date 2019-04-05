import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { FileToSaveComponent } from './file-to-save.component';

describe('FileToSaveComponent', () => {
  let component: FileToSaveComponent;
  let fixture: ComponentFixture<FileToSaveComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ FileToSaveComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(FileToSaveComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
