import { TestBed, inject } from '@angular/core/testing';

import { TinyTranslatorService } from './tiny-translator.service';
import {BackendServiceAPI} from './backend-service-api';
import {DownloaderService} from '../file-accessors/download-upload/downloader.service';
import {AsynchronousFileReaderService} from '../file-accessors/download-upload/asynchronous-file-reader.service';
import {AutoTranslateGoogleService} from './auto-translate-google.service';
import {AutoTranslateServiceAPI} from './auto-translate-service-api';

describe('TinyTranslatorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TinyTranslatorService, BackendServiceAPI, AsynchronousFileReaderService, DownloaderService, AutoTranslateServiceAPI]
    });
  });

  it('should ...', inject([TinyTranslatorService], (service: TinyTranslatorService) => {
    expect(service).toBeTruthy();
  }));
});
