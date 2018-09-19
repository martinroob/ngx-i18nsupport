import { TestBed } from '@angular/core/testing';

import { ToolingService } from './tooling.service';

describe('ToolingService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: ToolingService = TestBed.get(ToolingService);
    expect(service).toBeTruthy();
  });
});
