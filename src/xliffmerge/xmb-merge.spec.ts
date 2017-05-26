import * as fs from "fs";
import {XliffMerge} from './xliff-merge';
import {ProgramOptions, IConfigFile} from './i-xliff-merge-options';
import {CommandOutput} from '../common/command-output';
import WritableStream = NodeJS.WritableStream;
import {WriterToString} from '../common/writer-to-string';
import {FileUtil} from '../common/file-util';
import {ITranslationMessagesFile, ITransUnit, STATE_NEW} from 'ngx-i18nsupport-lib';
import {TranslationMessagesFileReader} from './translation-messages-file-reader';

/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge Format XMB.
 */

describe('XliffMerge XMB format tests', () => {

    /**
     * Workdir, not in git.
     * Cleaned up for every test.
     * Tests, that work on files, copy everything they need into this directory.
     * @type {string}
     */
    let WORKDIR = 'test/work/';
    let SRCDIR = 'test/testdata/i18n/';

    let ENCODING = 'UTF-8';

    /**
     * Helper function to read Xmb from File
     * @type {string}
     */
    function readXmb(path: string): ITranslationMessagesFile {
        return TranslationMessagesFileReader.fromFile('xmb', path, ENCODING);
    }

    /**
     * Helper function to read Xtb from 2 Files, the xtb and the master xmb file
     * @type {string}
     */
    function readXtbWithMaster(path: string, masterPath?: string): ITranslationMessagesFile {
        return TranslationMessagesFileReader.fromFile('xtb', path, ENCODING, masterPath);
    }

    describe('Merge process checks for format xmb', () => {

        let MASTER1FILE = 'ngExtractedMaster1.xmb';
        let MASTER2FILE = 'ngExtractedMaster2.xmb';
        let MASTER1SRC = SRCDIR + MASTER1FILE;
        let MASTER2SRC = SRCDIR + MASTER2FILE;
        let MASTERFILE = 'messages.xmb';
        let MASTER = WORKDIR + MASTERFILE;

        let ID_TRANSLATED_MYFIRST = "2047558209369508311"; // an ID from ngExtractedMaster1.xlf
        let ID_REMOVED_DESCRIPTION = "7499557905529977371"; // an ID that will be removed in master2
        let ID_REMOVED_DESCRIPTION2 = "3274258156935474372"; // another removed ID
        let ID_ADDED = "8998006760999956868";  // an ID that will be added in master2
        let ID_WITH_PLACEHOLDER = "9030312858648510700";

        beforeEach(() => {
            if (!fs.existsSync(WORKDIR)){
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            FileUtil.deleteFolderContentRecursive(WORKDIR);
        });

        it('should generate translated file for default language de from xmb master', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('de'), MASTER);
            expect(langFile.sourceLanguage()).toBeFalsy(); // not supported in xmb
            expect(langFile.targetLanguage()).toBe('de');
            langFile.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe(STATE_NEW);
            });
            done();
        });

        it('should generate translated file for all languages using format xmb', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('de'), MASTER);
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
            });
            let langFileEnglish: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
            });
            done();
        });

        it('should merge translated file for all languages using format xmb', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST);
            expect(tu).toBeTruthy();
            tu.translate('My first app');
            TranslationMessagesFileReader.save(langFileEnglish);

            // next step, use another master
            FileUtil.copy(MASTER2SRC, MASTER);
            ws = new WriterToString();
            commandOut = new CommandOutput(ws);
            xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('merged 1 trans-units from master to "en"');
            expect(ws.writtenData()).toContain('removed 2 unused trans-units in "en"');
            expect(ws.writtenData()).not.toContain('WARNING: transferred');

            // look, that the new file contains the old translation
            langFileEnglish = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            expect(langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST).targetContent()).toBe('My first app');

            // look, that the new file contains the new translation
            expect(langFileEnglish.transUnitWithId(ID_ADDED)).toBeTruthy();

            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_DESCRIPTION)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_DESCRIPTION2)).toBeFalsy();
            done();
        });

        it('should translate messages with placeholder in format xmb', (done) => {
            FileUtil.copy(MASTER2SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            tu.translate('Item <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph> of <ph name="INTERPOLATION_1"><ex>INTERPOLATION_1</ex></ph> added.');
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContent()).toBe('Item <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph> of <ph name="INTERPOLATION_1"><ex>INTERPOLATION_1</ex></ph> added.');

            done();
        });

        it('should return status new for all trans units using format xmb with master file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileEnglish: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetState()).toBe('new');
            });
            done();
        });

        it('should return status final for a translated trans unit using format xmb with master file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileEnglish: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            // now translate some texts in the English version
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Meine erste I18N-Anwendung');
            expect(tu.targetState()).toBe('new');
            tu.translate('my first i18n application');
            expect(tu.targetState()).toBe('final');
            done();
        });

    });

    describe('ngx-translate processing for format xmb', () => {

        let MASTER1FILE = 'ngxtranslate.xmb';
        let MASTER1SRC = SRCDIR + MASTER1FILE;
        let MASTER_WITHOUT_NGX_TRANSLATE_STUFF = SRCDIR + 'ngExtractedMaster1.xmb';
        let MASTERFILE = 'messages.xmb';
        let MASTER = WORKDIR + MASTERFILE;

        let ID_NODESC_NOMEANING = "2047558209369508311"; // an ID without set meaning and description
        let ID_MONDAY = "6830980354990918030"; // an ID from ngxtranslate.xmb with meaning "x.y" and description "ngx-translate"

        beforeEach(() => {
            if (!fs.existsSync(WORKDIR)){
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            FileUtil.deleteFolderContentRecursive(WORKDIR);
        });

        it('should return null for unset description and meaning in master xmb file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXmb(MASTER);
            expect(master.transUnitWithId(ID_NODESC_NOMEANING).description()).toBeFalsy();
            expect(master.transUnitWithId(ID_NODESC_NOMEANING).meaning()).toBeFalsy();
            done();
        });

        it('should find description and meaning in master  xmb file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXmb(MASTER);
            expect(master.transUnitWithId(ID_MONDAY).description()).toBe('ngx-translate');
            expect(master.transUnitWithId(ID_MONDAY).meaning()).toBe('dateservice.monday');
            done();
        });

        it('should find description and meaning in translated xmb file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: ITranslationMessagesFile = readXtbWithMaster(xliffMergeCmd.generatedI18nFile('de'), MASTER);
            expect(langFile.transUnitWithId(ID_MONDAY).description()).toBe('ngx-translate');
            expect(langFile.transUnitWithId(ID_MONDAY).meaning()).toBe('dateservice.monday');
            done();
        });

        it('should write translation json file for ngx-translate', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb',
                    supportNgxTranslate: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let translationJsonFilename = xliffMergeCmd.generatedNgxTranslateFile('de');
            expect(FileUtil.exists(translationJsonFilename)).toBeTruthy();
            let fileContent = FileUtil.read(translationJsonFilename, 'UTF-8');
            let translation: any = JSON.parse(fileContent);
            expect(translation).toBeTruthy();
            expect(translation.myapp).toBeTruthy();
            expect(translation.dateservice.monday).toBe("Montag");
            expect(translation.dateservice.friday).toBe("Freitag");
            expect(translation.explicitlysetids.test1).toBe("Explizit gesetzte ID");
            expect(Object.keys(translation).length).toBe(5);
            done();
        });

        it('should handle placeholders in json file for ngx-translate', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb',
                    supportNgxTranslate: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let translationJsonFilename = xliffMergeCmd.generatedNgxTranslateFile('de');
            expect(FileUtil.exists(translationJsonFilename)).toBeTruthy();
            let fileContent = FileUtil.read(translationJsonFilename, 'UTF-8');
            let translation: any = JSON.parse(fileContent);
            expect(translation).toBeTruthy();
            expect(translation.placeholders).toBeTruthy();
            expect(translation.placeholders.test1placeholder).toBe('{{0}}: Eine Nachricht mit einem Platzhalter');
            expect(translation.placeholders.test2placeholder).toBe('{{0}}: Eine Nachricht mit 2 Platzhaltern: {{1}}');
            expect(translation.placeholders.test2placeholderRepeated).toBe('{{0}}: Eine Nachricht mit 2 Platzhaltern: {{0}} {{1}}');
            done();
        });

        it('should handle embedded html markup in json file for ngx-translate', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb',
                    supportNgxTranslate: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let translationJsonFilename = xliffMergeCmd.generatedNgxTranslateFile('de');
            expect(FileUtil.exists(translationJsonFilename)).toBeTruthy();
            let fileContent = FileUtil.read(translationJsonFilename, 'UTF-8');
            let translation: any = JSON.parse(fileContent);
            expect(translation).toBeTruthy();
            expect(translation.embeddedhtml).toBeTruthy();
            expect(translation.embeddedhtml.bold).toBe('Diese Nachricht ist <b>WICHTIG</b>');
            expect(translation.embeddedhtml.boldstrong).toBe('Diese Nachricht ist <b><strong>SEHR WICHTIG</strong></b>');
            expect(translation.embeddedhtml.strange).toBe('Diese Nachricht ist <strange>{{0}}</strange>');
            done();
        });

        it('should not write empty translation json file for ngx-translate, if there are no translation (issue #18)', (done) => {
            FileUtil.copy(MASTER_WITHOUT_NGX_TRANSLATE_STUFF, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    i18nFormat: 'xmb',
                    supportNgxTranslate: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let translationJsonFilename = xliffMergeCmd.generatedNgxTranslateFile('de');
            expect(FileUtil.exists(translationJsonFilename)).toBeFalsy();
            done();
        });

    });
});
