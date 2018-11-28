import { TestBed, inject } from '@angular/core/testing';

import { BackendLocalStorageService } from './backend-local-storage.service';

describe('BackendLocalStorageService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [BackendLocalStorageService]
    });
  });

  it('should ...', inject([BackendLocalStorageService], (service: BackendLocalStorageService) => {
    expect(service).toBeTruthy();
  }));
});
