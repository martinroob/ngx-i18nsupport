import { TestBed } from '@angular/core/testing';

import { NgxI18nsupportLibService } from './ngx-i18nsupport-lib.service';

describe('NgxI18nsupportLibService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: NgxI18nsupportLibService = TestBed.get(NgxI18nsupportLibService);
    expect(service).toBeTruthy();
  });
});
