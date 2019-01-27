import { TestBed } from '@angular/core/testing';

import { GithubAccessorService } from './github-accessor.service';

describe('GithubAccessorService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: GithubAccessorService = TestBed.get(GithubAccessorService);
    expect(service).toBeTruthy();
  });
});
