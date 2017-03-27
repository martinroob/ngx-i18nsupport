import {ITranslationMessagesFile} from './i-translation-messages-file';
import {FileUtil} from '../common/file-util';
import {isNullOrUndefined} from 'util';
import {ITransUnit} from './i-trans-unit';
/**
 * Created by roobm on 15.03.2017.
 * A tool for extracting messages in ngx-translate format.
 * Generates a json-file to be used with ngx-translate.
 */

/**
 * The interface used for translations in ngx-translate.
 * A hash that contains either the translation or another hash.
 */
interface NgxTranslations {
    [id: string]: NgxTranslations | string;
}

/**
 * internal,
 * a message with id (a dot-separated string).
 */
interface NgxMessage {
    id: string; // dot separated name, e.g. "myapp.service1.message1"
    message: string; // the message, placeholder are in {{n}} syntax, e.g. "a test with value: {{0}}
}

export class NgxTranslateExtractor {

    public static extract(messagesFile: ITranslationMessagesFile, outputFile: string) {
        new NgxTranslateExtractor(messagesFile).extractTo(outputFile);
    }

    constructor(private messagesFile: ITranslationMessagesFile) {
    }

    /**
     * Extact messages and write them to a file.
     * @param outputFile
     */
    public extractTo(outputFile: string) {
        let translations: NgxTranslations = this.toNgxTranslations(this.extract());
        FileUtil.replaceContent(outputFile, JSON.stringify(translations, null, 4), 'UTF-8')
    }

    /**
     *  Extract messages and convert them to ngx translations.
     *  @return the translation objects.
     */
    private extract(): NgxMessage[] {
        let result: NgxMessage[] = [];
        this.messagesFile.forEachTransUnit((tu: ITransUnit) => {
            let description = tu.description();
            let id = tu.meaning();
            if (description && description === 'ngx-translate') {
                let messagetext = this.toTranslateString(tu.targetContentNormalized());
                result.push({id: id, message: messagetext});
            }
        });
        return result;
    }

    private toTranslateString(contentFromTU: string): string {
        return contentFromTU;
    }

    /**
     * Convert list of relevant TUs to ngx translations object.
     * @param msgList
     */
    private toNgxTranslations(msgList: NgxMessage[]): NgxTranslations {
        let translationObject: NgxTranslations = {};
        msgList.forEach((msg: NgxMessage) => {
            this.putInTranslationObject(translationObject, msg);
        });
        return translationObject;
    }

    /**
     * Put a new messages into the translation data object.
     * If you add, e.g. "{id: 'myapp.example', message: 'test'}",
     * the translation object will then contain an object myapp that has property example:
     * {myapp: {
     *   example: 'test'
     *   }}
     * @param translationObject
     * @param msg
     */
    private putInTranslationObject(translationObject: NgxTranslations, msg: NgxMessage) {
        let firstPartOfId: string;
        let restOfId: string;
        let indexOfDot = msg.id.indexOf('.');
        if (indexOfDot == 0 || indexOfDot == (msg.id.length - 1)) {
            throw new Error('bad nxg-translate id "' + msg.id + '"');
        }
        if (indexOfDot < 0) {
            firstPartOfId = msg.id;
            restOfId = '';
        } else {
            firstPartOfId = msg.id.substring(0, indexOfDot);
            restOfId = msg.id.substring(indexOfDot + 1);
        }
        let object = translationObject[firstPartOfId];
        if (isNullOrUndefined(object)) {
            if (restOfId === '') {
                translationObject[firstPartOfId] = msg.message;
                return;
            }
            object = {};
            translationObject[firstPartOfId] = object;
        } else {
            if (restOfId === '') {
                throw new Error('duplicate id praefix "' + msg.id + '"');
            }
        }
        this.putInTranslationObject(<NgxTranslations> object, {id: restOfId, message: msg.message});
    }
}