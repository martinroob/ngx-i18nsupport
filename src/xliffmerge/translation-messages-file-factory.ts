/**
 * Created by roobm on 21.03.2017.
 */
import {ITranslationMessagesFile} from './i-translation-messages-file';
import {XmlReader} from './xml-reader';
import {XliffFile} from './xliff-file';
import {XmbFile} from './xmb-file';
import {format} from 'util';

/**
 * Helper class to read translation files depending on format.
 * This is part of the public api
 */
export class TranslationMessagesFileFactory {

    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param format
     * @param xmlContent the file content
     * @param path the path of the file (only used to remember it)
     * @param encoding
     * @return {XliffFile}
     */
    public static fromFileContent(i18nFormat: string, xmlContent: string, path: string, encoding: string): ITranslationMessagesFile {
        if (i18nFormat === 'xlf') {
            return new XliffFile(xmlContent, path, encoding);
        }
        if (i18nFormat === 'xmb') {
            return new XmbFile(xmlContent, path, encoding);
        } else {
            throw new Error(format('oops, unsupported format "%s"', i18nFormat));
        }
    }

}

