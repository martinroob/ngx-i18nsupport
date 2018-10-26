/**
 * Created by roobm on 21.03.2017.
 */
import {TranslationMessagesFileFactory, ITranslationMessagesFile} from 'ngx-i18nsupport-lib';
import {FileUtil} from '../common/file-util';
import {XmlReader} from './xml-reader';

/**
 * Helper class to read translation files depending on format.
 */
export class TranslationMessagesFileReader {

    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param i18nFormat format
     * @param path path
     * @param encoding encoding
     * @param optionalMasterFilePath optionalMasterFilePath
     * @return XliffFile
     */
    public static fromFile(i18nFormat: string,
                           path: string,
                           encoding: string,
                           optionalMasterFilePath?: string): ITranslationMessagesFile {
        const xmlContent = XmlReader.readXmlFileContent(path, encoding);
        const optionalMaster = TranslationMessagesFileReader.masterFileContent(optionalMasterFilePath, encoding);
        return TranslationMessagesFileFactory.fromFileContent(i18nFormat, xmlContent.content, path, xmlContent.encoding, optionalMaster);
    }

    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param path path
     * @param encoding encoding
     * @param optionalMasterFilePath optionalMasterFilePath
     * @return XliffFile
     */
    public static fromUnknownFormatFile(path: string,
                                        encoding: string,
                                        optionalMasterFilePath?: string): ITranslationMessagesFile {
        const xmlContent = XmlReader.readXmlFileContent(path, encoding);
        const optionalMaster = TranslationMessagesFileReader.masterFileContent(optionalMasterFilePath, encoding);
        return TranslationMessagesFileFactory.fromUnknownFormatFileContent(xmlContent.content, path, xmlContent.encoding, optionalMaster);
    }

    /**
     * Read master xmb file
     * @param optionalMasterFilePath optionalMasterFilePath
     * @param encoding encoding
     * @return content and encoding of file
     */
    private static masterFileContent(optionalMasterFilePath: string, encoding: string)
        : {xmlContent: string, path: string, encoding: string} {
        if (optionalMasterFilePath) {
            const masterXmlContent = XmlReader.readXmlFileContent(optionalMasterFilePath, encoding);
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
     * @param messagesFile messagesFile
     * @param beautifyOutput Flag whether to use pretty-data to format the output.
     * XMLSerializer produces some correct but strangely formatted output, which pretty-data can correct.
     * See issue #64 for details.
     * Default is false.
     */
    public static save(messagesFile: ITranslationMessagesFile, beautifyOutput?: boolean) {
        FileUtil.replaceContent(messagesFile.filename(), messagesFile.editedContent(beautifyOutput), messagesFile.encoding());
    }
}

