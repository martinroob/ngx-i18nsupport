import { TestBed, inject } from '@angular/core/testing';

import { TranslationUnitFilterService } from './translation-unit-filter.service';

describe('TranslationUnitFilterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TranslationUnitFilterService]
    });
  });

  it('should be created', inject([TranslationUnitFilterService], (service: TranslationUnitFilterService) => {
    expect(service).toBeTruthy();
  }));
});
