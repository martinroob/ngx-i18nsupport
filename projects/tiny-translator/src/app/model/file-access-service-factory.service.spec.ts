import { TestBed } from '@angular/core/testing';

import { FileAccessServiceFactoryService } from './file-access-service-factory.service';

describe('FileAccessServiceFactoryService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: FileAccessServiceFactoryService = TestBed.get(FileAccessServiceFactoryService);
    expect(service).toBeTruthy();
  });
});
