import { TestBed } from '@angular/core/testing';

import { SerializationService } from './serialization.service';

describe('SerializationService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: SerializationService = TestBed.get(SerializationService);
    expect(service).toBeTruthy();
  });
});
