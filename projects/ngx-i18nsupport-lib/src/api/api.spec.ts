import {TranslationMessagesFileFactory, ITranslationMessagesFile} from './index';
import * as fs from 'fs';

/**
 * Created by martin on 10.04.2017.
 * Testcases for public API.
 * Just reading different file formats.
 * Detail Tests are in the files for the specific formats.
 */

describe('ngx-i18nsupport-lib API test spec', () => {

    const SRCDIR = 'test/testdata/i18n/';

    const ENCODING = 'UTF-8';

    /**
     * Helper function to read Xliff from File
     */
    function readXliff(path: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        return TranslationMessagesFileFactory.fromFileContent('xlf', content, path, ENCODING);
    }

    /**
     * Helper function to read XLIFF 2.0 from File
     */
    function readXliff2(path: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        return TranslationMessagesFileFactory.fromFileContent('xlf2', content, path, ENCODING);
    }

    /**
     * Helper function to read Xmb from File
     */
    function readXmb(path: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        return TranslationMessagesFileFactory.fromFileContent('xmb', content, path, ENCODING);
    }

    /**
     * Helper function to read Xmb from 2 Files, the xmb and the master
     */
    function readXtbWithMaster(path: string, masterPath: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        if (masterPath) {
            const masterContent = fs.readFileSync(masterPath, ENCODING);
            const optionalMaster = {xmlContent: masterContent, path: masterPath, encoding: ENCODING};
            return TranslationMessagesFileFactory.fromFileContent('xtb', content, path, ENCODING, optionalMaster);
        } else {
            return TranslationMessagesFileFactory.fromFileContent('xtb', content, path, ENCODING);
        }
    }

    /**
     * Helper function to read translation file of any format
     */
    function readFile(path: string, masterPath?: string): ITranslationMessagesFile {
        const content = fs.readFileSync(path, ENCODING);
        if (masterPath) {
            const masterContent = fs.readFileSync(masterPath, ENCODING);
            const optionalMaster = {xmlContent: masterContent, path: masterPath, encoding: ENCODING};
            return TranslationMessagesFileFactory.fromUnknownFormatFileContent(content, path, ENCODING, optionalMaster);
        } else {
            return TranslationMessagesFileFactory.fromUnknownFormatFileContent(content, path, ENCODING);
        }
    }

    describe('api tests', () => {
        const MASTER1SRC_XLIFF = SRCDIR + 'ngExtractedMaster1.xlf';
        const MASTER1SRC_XLIFF2 = SRCDIR + 'ngExtractedMaster1.xlf2';
        const MASTER1SRC_XMB = SRCDIR + 'ngExtractedMaster1.xmb';
        const MASTER_DE_XMB = SRCDIR + 'ngExtractedMaster1.de.xmb';
        const MASTER_EN_XTB = SRCDIR + 'ngExtractedMaster1.en.xtb';

        it('should read xlf file', () => {
            const file: ITranslationMessagesFile = readXliff(MASTER1SRC_XLIFF);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XLIFF 1.2');
        });

        it('should read XLIFF 2.0 file', () => {
            const file: ITranslationMessagesFile = readXliff2(MASTER1SRC_XLIFF2);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XLIFF 2.0');
        });

        it('should read xmb file', () => {
            const file: ITranslationMessagesFile = readXmb(MASTER1SRC_XMB);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XMB');
        });

        it('should read xtb file with master', () => {
            const file: ITranslationMessagesFile = readXtbWithMaster(MASTER_EN_XTB, MASTER_DE_XMB);
            expect(file).toBeTruthy();
            expect(file.fileType()).toBe('XTB');
            expect(file.sourceLanguage()).toBe('de');
            expect(file.targetLanguage()).toBe('en');
        });

        it('should autodetect file format', () => {
            const file1: ITranslationMessagesFile = readFile(MASTER1SRC_XLIFF);
            expect(file1).toBeTruthy();
            expect(file1.fileType()).toBe('XLIFF 1.2');
            const file2: ITranslationMessagesFile = readFile(MASTER1SRC_XMB);
            expect(file2).toBeTruthy();
            expect(file2.fileType()).toBe('XMB');
            const file3: ITranslationMessagesFile = readFile(MASTER_EN_XTB, MASTER1SRC_XMB);
            expect(file3).toBeTruthy();
            expect(file3.fileType()).toBe('XTB');
            const file4: ITranslationMessagesFile = readFile(MASTER1SRC_XLIFF2);
            expect(file4).toBeTruthy();
            expect(file4.fileType()).toBe('XLIFF 2.0');
        });

        it ('should detect files with wrong format', () => {
           try {
               TranslationMessagesFileFactory.fromUnknownFormatFileContent('schrott', 'dummyfile', 'UTF-X');
           }  catch (error) {
               expect(error.toString()).toBe('Error: could not identify file format, it is neiter XLIFF (1.2 or 2.0) nor XMB/XTB');
               return;
           }
           fail('expected error not received');
        });

        it ('should report wrong format as error', () => {
            try {
                TranslationMessagesFileFactory.fromFileContent('schrott', 'schrott', 'dummyfile', 'UTF-X');
            }  catch (error) {
                expect(error.toString()).toBe('Error: oops, unsupported format "schrott"');
                return;
            }
            fail('expected error not received');
        });

        it('should detect error when reading xtb file with no xmb master', () => {
            try {
                readXtbWithMaster(MASTER_EN_XTB, MASTER1SRC_XLIFF);
                fail('expected error not received');
            } catch (error) {
                expect(error.toString()).toContain('An xtb file needs xmb as master file.');
            }
        });

    });
});
