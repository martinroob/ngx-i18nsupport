import {format} from 'util';
import {Observable} from 'rxjs';
import {RxHR} from "@akanass/rx-http-request";
/**
 * Created by roobm on 03.07.2017.
 */

/**
 * Types form google translate api.
 */

interface GetSupportedLanguagesRequest {
    target: string; // The language to use to return localized, human readable names of supported\nlanguages.
}

interface LanguagesResource {
    language: string; // code of the language
    name: string; // human readable name (in target language)
}

interface LanguagesListResponse {
    languages: LanguagesResource[];
}

interface TranslateTextRequest {
    q: string[];  // The input texts to translate
    target: string; // The language to use for translation of the input text
    source: string; // The language of the source text
    format?: string; // "html" (default) or "text"
    model?: string; // see public documentation
}

interface TranslationsResource {
    detectedSourceLanguage?: string;
    model?: string;
    translatedText: string;
}

interface TranslationsListResponse {
    translations: TranslationsResource[];
}

const MAX_SEGMENTS = 128;

export class AutoTranslateService {

    _rootUrl: string;
    _apiKey: string;

    constructor(apiKey: string) {
        this._apiKey = apiKey;
        this._rootUrl = 'https://translation.googleapis.com/';
    }

    /**
     * Change API key (just for tests).
     * @param apikey
     */
    public setApiKey(apikey: string) {
        this._apiKey = apikey;
    }

    /**
     * Translate an array of messages at once.
     * @param messages the messages to be translated
     * @param from source language code
     * @param to target language code
     * @return Observable with translated messages or error
     */
    public translateMultipleStrings(messages: string[], from: string, to: string): Observable<string[]> {
        if (!this._apiKey) {
            return Observable.throw('cannot autotranslate: no api key');
        }
        if (!from || !to) {
            return Observable.throw('cannot autotranslate: source and target language must be set');
        }
        from = this.stripRegioncode(from);
        to = this.stripRegioncode(to);
        const allRequests: Observable<string[]>[] = this.splitMessagesToGoogleLimit(messages).map((partialMessages: string[]) => {
            return this.limitedTranslateMultipleStrings(partialMessages, from, to);
        })
        return Observable.forkJoin(allRequests).map((allTranslations: string[][]) => {
            let all = [];
            for (let i = 0; i < allTranslations.length; i++) {
                all = all.concat(allTranslations[i]);
            }
            return all;
        })
    }

    private splitMessagesToGoogleLimit(messages: string[]): string[][] {
        if (messages.length <= MAX_SEGMENTS) {
            return [messages];
        }
        const result = [];
        let currentPackage = [];
        let packageSize = 0;
        for (let i = 0; i < messages.length; i++) {
            currentPackage.push(messages[i]);
            packageSize++;
            if (packageSize >= MAX_SEGMENTS) {
                result.push(currentPackage);
                currentPackage = [];
                packageSize = 0;
            }
        }
        if (currentPackage.length > 0) {
            result.push(currentPackage);
        }
        return result;
    }

    /**
     * Return translation request, but messages must be limited to google limits.
     * Not more that 128 single messages.
     * Size < TODO
     * @param messages
     * @param from
     * @param to
     * @return {Observable<R>}
     */
    private limitedTranslateMultipleStrings(messages: string[], from: string, to: string): Observable<string[]> {
        const realUrl = this._rootUrl + 'language/translate/v2' + '?key=' + this._apiKey;
        const translateRequest: TranslateTextRequest = {
            q: messages,
            target: to,
            source: from,
        };
        const options = {
            url: realUrl,
            body: translateRequest,
            json: true,
//            proxy: 'http://127.0.0.1:8888' To set a proxy use env var HTTPS_PROXY
        };
        return RxHR.post(realUrl, options).map((data) => {
            const body: any = data.body;
            if (!body) {
                throw new Error('no result received');
            }
            if (body.error) {
                if (body.error.code === 400) {
                    if (body.error.message === 'Invalid Value') {
                        throw new Error(format('Translation from "%s" to "%s" not supported', from, to));
                    }
                    throw new Error(format('Invalid request: %s', body.error.message));
                } else {
                    throw new Error(format('Error %s: %s', body.error.code, body.error.message));
                }
            }
            const result = body.data;
            return result.translations.map((translation: TranslationsResource) => {
                return translation.translatedText;
            });
        });
    }

    /**
     * Strip region code and convert to lower
     * @param lang
     * @return {string} lang without region code and in lower case.
     */
    public stripRegioncode(lang: string): string {
        const langLower = lang.toLowerCase();
        for(let i = 0; i < langLower.length; i++) {
            const c = langLower.charAt(i);
            if (c < 'a' || c > 'z') {
                return langLower.substring(0, i);
            }
        }
        return langLower;
    }
}