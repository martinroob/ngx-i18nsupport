import {ITranslationMessagesFile, ITransUnit, NORMALIZATION_FORMAT_NGXTRANSLATE} from 'ngx-i18nsupport-lib';
import {FileUtil} from '../common/file-util';
import {isNullOrUndefined} from 'util';
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
        if (translations && Object.keys(translations).length > 0) {
            FileUtil.replaceContent(outputFile, JSON.stringify(translations, null, 4), 'UTF-8')
        } else {
            if (FileUtil.exists(outputFile)) {
                FileUtil.deleteFile(outputFile);
            }
        }
    }

    /**
     *  Extract messages and convert them to ngx translations.
     *  @return the translation objects.
     */
    private extract(): NgxMessage[] {
        let result: NgxMessage[] = [];
        this.messagesFile.forEachTransUnit((tu: ITransUnit) => {
            let ngxId = this.ngxTranslateIdFromTU(tu);
            if (ngxId) {
                let messagetext = tu.targetContentNormalized().asDisplayString(NORMALIZATION_FORMAT_NGXTRANSLATE);
                result.push({id: ngxId, message: messagetext});
            }
        });
        return result;
    }

    /**
     * Check, wether this tu should be extracted for ngx-translate usage, and return its id for ngx-translate.
     * There are 2 possibilities:
     * 1. description is set to "ngx-translate" and meaning contains the id.
     * 2. id is explicitly set to a string.
     * @param tu
     * @return an id or null, if this tu should not be extracted.
     */
    private ngxTranslateIdFromTU(tu: ITransUnit): string {
        if (this.isExplicitlySetId(tu.id)) {
            return tu.id;
        }
        let description = tu.description();
        if (description && description === 'ngx-translate') {
            return tu.meaning();
        }
    }

    /**
     * Test, wether ID was explicitly set (via i18n="@myid).
     * Just heuristic, an ID is explicitly that, if it does not look like a generated one.
     * @param id
     * @return {boolean}
     */
    private isExplicitlySetId(id: string): boolean {
        if (isNullOrUndefined(id)) {
            return false;
        }
        // generated IDs are either decimal or sha1 hex
        let reForGeneratedId = /^[0-9a-f]{11,}$/;
        return !reForGeneratedId.test(id);
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