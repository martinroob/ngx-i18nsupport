import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateProjectPageComponent } from './create-project-page.component';
import {ProjectStarterComponent} from '../project-starter/project-starter.component';
import {NO_ERRORS_SCHEMA} from '@angular/core';
import {TinyTranslatorService} from '../model/tiny-translator.service';
import {BackendServiceAPI} from '../model/backend-service-api';
import {AsynchronousFileReaderService} from '../file-accessors/download-upload/asynchronous-file-reader.service';
import {DownloaderService} from '../file-accessors/download-upload/downloader.service';
import {AppModule} from '../app.module';

describe('CreateProjectPageComponent', () => {
  let component: CreateProjectPageComponent;
  let fixture: ComponentFixture<CreateProjectPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [],
      imports: [AppModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateProjectPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
