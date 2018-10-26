/**
 * Created by roobm on 21.03.2017.
 */
import {ITranslationMessagesFile} from './i-translation-messages-file';
import {XliffFile} from '../impl/xliff-file';
import {XmbFile} from '../impl/xmb-file';
import {format} from 'util';
import {Xliff2File} from '../impl/xliff2-file';
import {FORMAT_XLIFF12, FORMAT_XLIFF20, FORMAT_XMB, FORMAT_XTB} from './constants';
import {XtbFile} from '../impl/xtb-file';

/**
 * Helper class to read translation files depending on format.
 * This is part of the public api
 */
export class TranslationMessagesFileFactory {

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
     * @return {ITranslationMessagesFile} either XliffFile or XmbFile
     */
    public static fromFileContent(i18nFormat: string,
                                  xmlContent: string,
                                  path: string,
                                  encoding: string,
                                  optionalMaster?: {xmlContent: string, path: string, encoding: string}): ITranslationMessagesFile {
        if (i18nFormat === FORMAT_XLIFF12) {
            return new XliffFile(xmlContent, path, encoding);
        }
        if (i18nFormat === FORMAT_XLIFF20) {
            return new Xliff2File(xmlContent, path, encoding);
        }
        if (i18nFormat === FORMAT_XMB) {
            return new XmbFile(xmlContent, path, encoding);
        }
        if (i18nFormat === FORMAT_XTB) {
            return new XtbFile(xmlContent, path, encoding, optionalMaster);
        }
        throw new Error(format('oops, unsupported format "%s"', i18nFormat));

    }

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
     * @return {ITranslationMessagesFile} either XliffFile or XmbFile
     */
    public static fromUnknownFormatFileContent(xmlContent: string,
                                  path: string,
                                  encoding: string,
                                  optionalMaster?: {xmlContent: string, path: string, encoding: string}): ITranslationMessagesFile {
        let formatCandidates = [FORMAT_XLIFF12, FORMAT_XLIFF20, FORMAT_XMB, FORMAT_XTB];
        if (path && path.endsWith('xmb')) {
            formatCandidates = [FORMAT_XMB, FORMAT_XTB, FORMAT_XLIFF12, FORMAT_XLIFF20];
        }
        if (path && path.endsWith('xtb')) {
            formatCandidates = [FORMAT_XTB, FORMAT_XMB, FORMAT_XLIFF12, FORMAT_XLIFF20];
        }
        // try all candidate formats to get the right one
        for (let i = 0; i < formatCandidates.length; i++) {
            const format = formatCandidates[i];
            try {
                const translationFile = TranslationMessagesFileFactory.fromFileContent(format, xmlContent, path, encoding, optionalMaster);
                if (translationFile) {
                    return translationFile;
                }
            } catch (e) {
                // seams to be the wrong format
            }
        }
        throw new Error(format('could not identify file format, it is neiter XLIFF (1.2 or 2.0) nor XMB/XTB'));
    }

}

