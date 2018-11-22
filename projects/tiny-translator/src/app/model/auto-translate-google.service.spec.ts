import { TestBed, inject, async } from '@angular/core/testing';

import {HttpClientModule} from '@angular/common/http';
import { AutoTranslateGoogleService } from './auto-translate-google.service';
import {APP_CONFIG, APP_CONFIG_VALUE} from '../app.config';
import {AutoTranslateDisabledReasonKey} from './auto-translate-service-api';
import {pairwise} from 'rxjs/operators';

describe('AutoTranslateGoogleService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientModule],
      providers: [AutoTranslateGoogleService, {provide: APP_CONFIG, useValue: APP_CONFIG_VALUE}]
    });
  });

  it('should be created', inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    expect(service).toBeTruthy();
  }));

  it('should detect missing key', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.setApiKey(null);
    service.canAutoTranslate('en', 'de').subscribe((result) => {
      expect(result).toBeFalsy();
    });
    service.disabledReason('en', 'de').subscribe((result) => {
      expect(result.reason).toBe(AutoTranslateDisabledReasonKey.NO_KEY);
    });
  })));

  it('should detect invalid key', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.setApiKey('definitely_not_a_valid_key');
    service.canAutoTranslate('en', 'de').pipe(pairwise()).subscribe((results) => {
      expect(results[1]).toBeFalsy();
    });
    service.disabledReason('en', 'de').pipe(pairwise()).subscribe((results) => {
      expect(results[1].reason).toBe(AutoTranslateDisabledReasonKey.INVALID_KEY);
    });
  })));

  it('should support en and de', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.canAutoTranslate('en', 'de').pipe(pairwise()).subscribe((results) => {
      expect(results[1]).toBeTruthy();
    });
    service.disabledReason('en', 'de').pipe(pairwise()).subscribe((results) => {
      expect(results[1]).toBeFalsy();
    });
  })));

  it('should not support fantasy language', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.canAutoTranslate('en', 'fantasy').pipe(pairwise()).subscribe((results) => {
      expect(results[1]).toBeFalsy();
    });
    service.disabledReason('en', 'fantasy').pipe(pairwise()).subscribe((results) => {
      expect(results[1].reason).toBe(AutoTranslateDisabledReasonKey.TARGET_LANG_NOT_SUPPORTED);
    });
  })));

  it('should detect missing source language', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.canAutoTranslate('', 'de').pipe(pairwise()).subscribe((results) => {
      expect(results[1]).toBeFalsy();
    });
    service.disabledReason('', 'de').pipe(pairwise()).subscribe((results) => {
      expect(results[1].reason).toBe(AutoTranslateDisabledReasonKey.SOURCE_LANG_NOT_SUPPORTED);
    });
  })));

  it('should detect missing target language', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.canAutoTranslate('en', '').pipe(pairwise()).subscribe((results) => {
      expect(results[1]).toBeFalsy();
    });
    service.disabledReason('en', '').pipe(pairwise()).subscribe((results) => {
      expect(results[1].reason).toBe(AutoTranslateDisabledReasonKey.TARGET_LANG_NOT_SUPPORTED);
    });
  })));

  it('should translate hello from english to german', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.translate('Hello', 'en', 'de').subscribe((translation) => {
      expect(translation).toBe('Hallo');
    });
  })));

  it('should translate hello from english to german ignoring region codes',
      async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.translate('Hello', 'en-us', 'DE-DE').subscribe((translation) => {
      expect(translation).toBe('Hallo');
    });
  })));

  it('should translate multiple string at once', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.translateMultipleStrings(['Hello', 'world'], 'en', 'de').subscribe((translations) => {
      expect(translations[0]).toBe('Hallo');
      expect(translations[1]).toBe('Welt');
    });
  })));

  it('should translate more than 128 multiple strings at once (exceeding google limit)',
      async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    const NUM = 1000; // internal google limit is 128, so service has to split it...
    const manyMessages: string[] = [];
    for (let i = 0; i < NUM; i++) {
      manyMessages.push('Hello world!');
    }
    service.translateMultipleStrings(manyMessages, 'en', 'de').subscribe((translations) => {
      expect(translations[0]).toBe('Hallo Welt!');
      expect(translations[NUM - 1 ]).toBe('Hallo Welt!');
    });
  })));

  it('should return a list of languages supported', async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.supportedLanguages('en').pipe(pairwise()).subscribe((lists) => {
      const list = lists[1];
      expect(list.length).toBeGreaterThan(10);
      let index = list.findIndex((lang) => lang.language === 'en');
      expect(index).toBeGreaterThan(0);
      expect(list[index].name).toBe('English');
      index = list.findIndex((lang) => lang.language === 'de');
      expect(index).toBeGreaterThan(0);
      expect(list[index].name).toBe('German');
    });
  })));

  it('should return a list of languages supported in german too',
      async(inject([AutoTranslateGoogleService], (service: AutoTranslateGoogleService) => {
    service.supportedLanguages('de').pipe(pairwise()).subscribe((lists) => {
      const list = lists[1];
      expect(list.length).toBeGreaterThan(10);
      let index = list.findIndex((lang) => lang.language === 'en');
      expect(index).toBeGreaterThan(0);
      expect(list[index].name).toBe('Englisch');
      index = list.findIndex((lang) => lang.language === 'de');
      expect(index).toBeGreaterThan(0);
      expect(list[index].name).toBe('Deutsch');
    });
  })));

});
