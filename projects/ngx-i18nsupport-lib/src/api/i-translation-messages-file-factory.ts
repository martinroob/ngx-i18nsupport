import {ITranslationMessagesFile} from './i-translation-messages-file';

export interface ITranslationMessagesFileFactory {
    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param i18nFormat currently 'xlf' or 'xlf2' or 'xmb' or 'xtb' are supported
     * @param xmlContent the file content
     * @param path the path of the file (only used to remember it)
     * @param encoding utf-8, ... used to parse XML.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @param optionalMaster in case of xmb the master file, that contains the original texts.
     * (this is used to support state infos, that are based on comparing original with translated version)
     * Ignored for other formats.
     * @return either XliffFile or XmbFile
     */
    createFileFromFileContent(i18nFormat: string,
                              xmlContent: string,
                              path: string,
                              encoding: string,
                              optionalMaster?: { xmlContent: string, path: string, encoding: string }): ITranslationMessagesFile;

    /**
     * Read file function for any file with unknown format.
     * This functions tries to guess the format based on the filename and the content of the file.
     * Result depends on detected format, either XliffFile or XmbFile.
     * @param xmlContent the file content
     * @param path the path of the file (only used to remember it)
     * @param encoding utf-8, ... used to parse XML.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @param optionalMaster in case of xmb the master file, that contains the original texts.
     * (this is used to support state infos, that are based on comparing original with translated version)
     * Ignored for other formats.
     * @return either XliffFile or XmbFile
     */
    createFileFromUnknownFormatFileContent(xmlContent: string,
                                           path: string,
                                           encoding: string,
                                           optionalMaster?: { xmlContent: string, path: string, encoding: string })
        : ITranslationMessagesFile;
}