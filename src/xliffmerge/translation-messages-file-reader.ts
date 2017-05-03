/**
 * Created by roobm on 21.03.2017.
 */
import {TranslationMessagesFileFactory, ITranslationMessagesFile, ITransUnit} from 'ngx-i18nsupport-lib';
import {FileUtil} from '../common/file-util';
import {XmlReader} from './xml-reader';

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
    public static fromFile(i18nFormat: string,
                           path: string,
                           encoding: string,
                           optionalMasterFilePath?: string): ITranslationMessagesFile {
        let xmlContent = XmlReader.readXmlFileContent(path, encoding);
        let optionalMaster = TranslationMessagesFileReader.masterFileContent(optionalMasterFilePath, encoding);
        return TranslationMessagesFileFactory.fromFileContent(i18nFormat, xmlContent.content, path, xmlContent.encoding, optionalMaster);
    }

    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param format
     * @param path
     * @param encoding
     * @return {XliffFile}
     */
    public static fromUnknownFormatFile(path: string,
                                        encoding: string,
                                        optionalMasterFilePath?: string): ITranslationMessagesFile {
        let xmlContent = XmlReader.readXmlFileContent(path, encoding);
        let optionalMaster = TranslationMessagesFileReader.masterFileContent(optionalMasterFilePath, encoding);
        return TranslationMessagesFileFactory.fromUnknownFormatFileContent(xmlContent.content, path, xmlContent.encoding, optionalMaster);
    }

    /**
     * Read master xmb file
     * @param optionalMasterFilePath
     * @param encoding
     * @return {any} content and encoding of file
     */
    private static masterFileContent(optionalMasterFilePath: string, encoding: string): {xmlContent: string, path: string, encoding: string} {
        if (optionalMasterFilePath) {
            let masterXmlContent = XmlReader.readXmlFileContent(optionalMasterFilePath, encoding);
            return {
                xmlContent: masterXmlContent.content,
                path: optionalMasterFilePath,
                encoding: masterXmlContent.encoding
            };
        } else {
            return null;
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

