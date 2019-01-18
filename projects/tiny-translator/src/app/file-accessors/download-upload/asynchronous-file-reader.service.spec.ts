import { TestBed, inject } from '@angular/core/testing';

import { AsynchronousFileReaderService } from './asynchronous-file-reader.service';

describe('AsynchronousFileReaderService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AsynchronousFileReaderService]
    });
  });

  it('should ...', inject([AsynchronousFileReaderService], (service: AsynchronousFileReaderService) => {
    expect(service).toBeTruthy();
  }));
});
