import * as fs from "fs";
import {FileUtil} from '../common/file-util';
import {format} from 'util';
import {AutoTranslateService} from './auto-translate-service';
/**
 * Created by roobm on 06.07.2017.
 * Testcases for the autotranslate service.
 */

/**
 * Get google Translate API key from file.
 * Which file is read, is determined by env var API_KEY_FILE.
 * @return a (hopefully) valid API key or null
 */
export function getApiKey(): string {
        const apikeyPath = process.env.API_KEY_FILE;
        if (apikeyPath){
            if (fs.existsSync(apikeyPath)) {
                return FileUtil.read(apikeyPath, 'utf-8');
            } else {
                throw new Error(format('api key file not found: API_KEY_FILE=%s', apikeyPath));
            }
        } else {
            return null;
        }
}

describe('Autotranslate tests', () => {

    let apikey: string;
    let service: AutoTranslateService;

    beforeEach(() => {
        apikey = getApiKey();
        if (apikey) {
            service = new AutoTranslateService(apikey);
        } else {
            service = null;
        }
    });

    it('should detect wrong api key', (done) => {
        if (!service) {
            done();
            return;
        }
        service.setApiKey('lmaa');
        service.translateMultipleStrings(['a', 'b'], 'en', 'de').subscribe((translations: string[]) => {
            expect('should not be called').toBe('');
            done();
        }, (err) => {
            expect(err.message).toContain('API key not valid');
            done();
        });
    });

    it('should detect unsupported language', (done) => {
        if (!service) {
            done();
            return;
        }
        service.translateMultipleStrings(['a', 'b'], 'en', 'klingon').subscribe((translations: string[]) => {
            expect('should not be called').toBe('');
            done();
        }, (err) => {
            expect(err.message).toBe('Translation from "en" to "klingon" not supported');
            done();
        });
    });

    it('should translate simple words form en to de', (done) => {
        if (!service) {
            done();
            return;
        }
        service.translateMultipleStrings(['Hello', 'world'], 'en', 'de').subscribe((translations: string[]) => {
            expect(translations).toBeTruthy();
            expect(translations.length).toBe(2);
            expect(translations[0]).toBe('Hallo');
            expect(translations[1]).toBe('Welt');
            done();
        }, (err) => {
            expect(err.message).toBe(''); // should not be invoked
            done();
        });
    });

    it('should ignore region codes', (done) => {
        if (!service) {
            done();
            return;
        }
        service.translateMultipleStrings(['Hello', 'world'], 'en-uk', 'de-ch').subscribe((translations: string[]) => {
            expect(translations).toBeTruthy();
            expect(translations.length).toBe(2);
            expect(translations[0]).toBe('Hallo');
            expect(translations[1]).toBe('Welt');
            done();
        }, (err) => {
            expect(err.message).toBe(''); // should not be invoked
            done();
        });
    });

    it('should translate very large number of messages', (done) => {
        if (!service) {
            done();
            return;
        }
        const NUM = 1000; // internal google limit is 128, so service has to split it...
        const manyMessages: string[] = [];
        for (let i = 0; i < NUM; i++) {
            manyMessages.push('Hello world!');
        }
        service.translateMultipleStrings(manyMessages, 'en', 'de').subscribe((translations: string[]) => {
            expect(translations).toBeTruthy();
            expect(translations.length).toBe(NUM);
            done();
        }, (err) => {
            expect(err.message).toBe(''); // should not be invoked
            done();
        });
    });

    it('should translate very long messages that exceeds google size limit of 5000 chars ', (done) => {
        if (!service) {
            done();
            return;
        }
        const longString = 'abcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvwabcdefghijklmnopqrstuvw';
        const longMessages: string[] = [];
        const NUM = 30;  // 30 * 260char = 5200
        for (let i = 0; i < NUM; i++) {
            longMessages.push(longString);
        }

        service.translateMultipleStrings(longMessages, 'en', 'de').subscribe((translations: string[]) => {
            expect(translations).toBeTruthy();
            expect(translations.length).toBe(NUM);
            done();
        }, (err) => {
            expect(err.message).toBe(''); // should not be invoked
            done();
        });
    });

});