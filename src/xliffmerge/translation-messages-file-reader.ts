/**
 * Created by roobm on 21.03.2017.
 */
import {ITranslationMessagesFile} from './i-translation-messages-file';
import {XmlReader} from './xml-reader';
import {XliffFile} from './xliff-file';
import {XmbFile} from './xmb-file';
import {format} from 'util';
import {FileUtil} from '../common/file-util';

/**
 * Helper class to read translation files depending on format.
 */
export class TranslationMessagesFileReader {

    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param format
     * @param path
     * @param encoding
     * @return {XliffFile}
     */
    public static fromFile(i18nFormat: string, path: string, encoding: string): ITranslationMessagesFile {
        let xmlContent = XmlReader.readXmlFileContent(path, encoding);
        if (i18nFormat === 'xlf') {
            return new XliffFile(xmlContent.content, path, xmlContent.encoding);
        }
        if (i18nFormat === 'xmb') {
            return new XmbFile(xmlContent.content, path, xmlContent.encoding);
        } else {
            throw new Error(format('oops, unsupported format "%s"', i18nFormat));
        }
    }

    /**
     * Save edited file.
     * @param messagesFile
     */
    public static save(messagesFile: ITranslationMessagesFile) {
        FileUtil.replaceContent(messagesFile.filename(), messagesFile.editedContent(), messagesFile.encoding());
    }
}

