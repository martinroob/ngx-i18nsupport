import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TranslationFileUploadComponent } from './translation-file-upload.component';

describe('TranslationFileUploadComponent', () => {
  let component: TranslationFileUploadComponent;
  let fixture: ComponentFixture<TranslationFileUploadComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslationFileUploadComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationFileUploadComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
