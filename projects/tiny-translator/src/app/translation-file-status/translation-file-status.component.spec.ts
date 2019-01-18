import { async, ComponentFixture, TestBed } from '@angular/core/testing';
import {TranslationFile} from '../model/translation-file';

import { TranslationFileStatusComponent } from './translation-file-status.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {DownloaderService} from '../file-accessors/download-upload/downloader.service';

describe('TranslationFileStatusComponent', () => {
  let component: TranslationFileStatusComponent;
  let fixture: ComponentFixture<TranslationFileStatusComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TranslationFileStatusComponent ],
      providers: [DownloaderService],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TranslationFileStatusComponent);
    component = fixture.componentInstance;
    component.translationFile = new TranslationFile();
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
