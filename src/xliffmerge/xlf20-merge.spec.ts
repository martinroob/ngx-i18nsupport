import * as fs from "fs";
import {XliffMerge} from './xliff-merge';
import {IConfigFile} from './i-xliff-merge-options';
import {CommandOutput} from '../common/command-output';
import WritableStream = NodeJS.WritableStream;
import {WriterToString} from '../common/writer-to-string';
import {FileUtil} from '../common/file-util';
import {ITranslationMessagesFile, ITransUnit} from 'ngx-i18nsupport-lib';
import {TranslationMessagesFileReader} from './translation-messages-file-reader';
import {STATE_NEW, STATE_TRANSLATED} from 'ngx-i18nsupport-lib/dist';
import {getApiKey} from '../autotranslate/auto-translate-service.spec';

/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge Format XLIFF 2.0.
 */

describe('XliffMerge XLIFF 2.0 format tests', () => {

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
     * Helper function to read XLIFF 2.0 from File
     * @type {string}
     */
    function readXliff2(path: string): ITranslationMessagesFile {
        return TranslationMessagesFileReader.fromFile('xlf2', path, ENCODING);
    }

    describe('Merge process checks for format XLIFF 2.0', () => {
        let MASTER1FILE = 'ngExtractedMaster1.xlf2';
        let MASTER2FILE = 'ngExtractedMaster2.xlf2';
        let MASTER1SRC = SRCDIR + MASTER1FILE;
        let MASTER2SRC = SRCDIR + MASTER2FILE;
        let MASTERFILE = 'messages.xlf2';
        let MASTER = WORKDIR + MASTERFILE;

        let ID_APP_RUNS = "4371668001355139802"; // an ID from ngExtractedMaster1.xlf
        let ID_REMOVED_MYFIRST = "2047558209369508311"; // an ID that will be removed in master2
        let ID_REMOVED_APPDESCRIPTION = "7499557905529977371"; // another removed ID
        let ID_WITH_PLACEHOLDER = "9030312858648510700";
        let ID_DESCRIPTION_CHANGE = 'DescriptionAndMeaning1';
        let ID_DESCRIPTION_ADD = 'AddDescriptionAndMeaning';
        let ID_DESCRIPTION_REMOVE = 'RemoveDescriptionAndMeaning';

        beforeEach(() => {
            if (!fs.existsSync(WORKDIR)){
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            FileUtil.deleteFolderContentRecursive(WORKDIR);
        });

        it('should fix source language, if the masters lang is not the default', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXliff2(MASTER);
            expect(master.sourceLanguage()).toBe('en'); // master is german, but ng-18n extracts it as en
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('master says to have source-language="en"');
            expect(ws.writtenData()).toContain('changed master source-language="en" to "de"');
            let newmaster: ITranslationMessagesFile = readXliff2(MASTER);
            expect(newmaster.sourceLanguage()).toBe('de'); // master is german
            done();
        });

        it('should generate translated file for default language de from master', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
                    useSourceAsTarget: false
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFile.sourceLanguage()).toBe('de');
            expect(langFile.targetLanguage()).toBe('de');
            langFile.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            done();
        });

        it('should generate translated file for all languages', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.sourceLanguage()).toBe('de');
            expect(langFileEnglish.targetLanguage()).toBe('en');
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('new');
            });
            done();
        });

        it('should generate translated file for all languages with empty targets for non default languages', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
                    useSourceAsTarget: false
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.sourceLanguage()).toBe('de');
            expect(langFileEnglish.targetLanguage()).toBe('en');
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe('');
                expect(tu.targetState()).toBe('new');
            });
            done();
        });

        it('should generate translated file with natove trans unit status "initial", testcase for issue #57', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
                    useSourceAsTarget: false
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('de'));
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                // need a cast to <any> to call nativeTargetState, which is not part of the official API
                expect((<any>tu).nativeTargetState()).toBe('final');
            });
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                // need a cast to <any> to call nativeTargetState, which is not part of the official API
                expect((<any>tu).nativeTargetState()).toBe('initial'); // #56, state should be new, but in file we expect initial
            });
            done();
        });

        it('should merge translated file for all languages', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_APP_RUNS);
            expect(tu).toBeTruthy();
            tu.translate('App runs');
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
            expect(ws.writtenData()).toContain('WARNING: transferred 1 source references');

            // look, that the new file contains the old translation
            langFileEnglish = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_APP_RUNS).targetContent()).toBe('App runs');

            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_MYFIRST)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_APPDESCRIPTION)).toBeFalsy();
            done();
        });

        it('should merge changed source content to already translated files', (done) => {
            const ID_SOURCE_CHANGE = 'sourcechanged';
            const ID_SOURCE_CHANGE_STATE_FINAL = 'sourcechanged_state_final';
            const TRANSLATED_FILE = 'WithSourceContentChange.en.xlf2';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithSourceContentChange.xlf2', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: transferred 2 changed source content from master to "en"');

            // check that source is changed
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_SOURCE_CHANGE);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Test Änderung Source (geändert!)');
            expect(tu.targetState()).toBe(STATE_NEW);
            let tuFinal: ITransUnit = langFileEnglish.transUnitWithId(ID_SOURCE_CHANGE_STATE_FINAL);
            expect(tuFinal).toBeTruthy();
            expect(tuFinal.sourceContent()).toBe('Test Änderung Source (state final, geändert!)');
            expect(tuFinal.targetState()).toBe(STATE_TRANSLATED);
            done();
        });

        it('should merge changed descriptions and meanings to already translated files', (done) => {
            const TRANSLATED_FILE = 'WithDescriptions.en.xlf2';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithDescriptions.xlf2', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: transferred 3 changed descriptions/meanings from master to "en"');

            // check that description and meaning are changed
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_DESCRIPTION_CHANGE);
            expect(tu).toBeTruthy();
            expect(tu.description()).toBe('changed description');
            expect(tu.meaning()).toBe('changed meaning');
            // added description
            let tuAdded: ITransUnit = langFileEnglish.transUnitWithId(ID_DESCRIPTION_ADD);
            expect(tuAdded).toBeTruthy();
            expect(tuAdded.description()).toBe('added description');
            expect(tuAdded.meaning()).toBe('added meaning');
            // removed description
            let tuRemoved: ITransUnit = langFileEnglish.transUnitWithId(ID_DESCRIPTION_REMOVE);
            expect(tuRemoved).toBeTruthy();
            expect(tuRemoved.description()).toBeNull();
            expect(tuRemoved.meaning()).toBeNull();
            done();
        });

        it('should translate messages with placeholder', (done) => {
            FileUtil.copy(MASTER2SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            tu.translate('Item <ph id="0" equiv="INTERPOLATION" disp="{{number()}}"/> of <ph id="1" equiv="INTERPOLATION_1" disp="{{total()}}"/> added.');
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContent()).toBe('Item <ph id="0" equiv="INTERPOLATION" disp="{{number()}}"/> of <ph id="1" equiv="INTERPOLATION_1" disp="{{total()}}"/> added.');
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContentNormalized().asDisplayString()).toBe('Item {{0}} of {{1}} added.');

            done();
        });

        it('should not output a warning when autotranslate is not enabled for a language (issue #49)', (done) => {
            FileUtil.copy(MASTER2SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            const apiKey = getApiKey();
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    languages: ['de', 'ru', 'en'],
                    autotranslate: ['ru'],
                    apikey: apiKey,
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run(() => {
                if (apiKey) {
                    expect(ws.writtenData()).not.toContain('ERROR');
                    expect(ws.writtenData()).not.toContain('Auto translation from "de" to "en"');
                    expect(ws.writtenData()).toContain('Auto translation from "de" to "ru"');
                } else {
                    expect(ws.writtenData()).toContain('ERROR: autotranslate requires an API key');
                }

                done();
            });
        });

    });

    describe('ngx-translate processing for format XLIFF 2.0', () => {

        let MASTER1FILE = 'ngxtranslate.xlf2';
        let MASTER1SRC = SRCDIR + MASTER1FILE;
        let MASTER_WITHOUT_NGX_TRANSLATE_STUFF = SRCDIR + 'ngExtractedMaster1.xlf2';
        let MASTERFILE = 'messages.xlf2';
        let MASTER = WORKDIR + MASTERFILE;

        let ID_NODESC_NOMEANING = "2047558209369508311"; // an ID without set meaning and description
        let ID_MONDAY = "6830980354990918030"; // an ID from ngxtranslate.xlf with meaning "x.y" and description "ngx-translate"

        beforeEach(() => {
            if (!fs.existsSync(WORKDIR)){
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            FileUtil.deleteFolderContentRecursive(WORKDIR);
        });

        it('should return null for unset description and meaning in master xlf2 file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXliff2(MASTER);
            expect(master.transUnitWithId(ID_NODESC_NOMEANING).description()).toBeFalsy();
            expect(master.transUnitWithId(ID_NODESC_NOMEANING).meaning()).toBeFalsy();
            done();
        });

        it('should find description and meaning in master xlf2 file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXliff2(MASTER);
            expect(master.transUnitWithId(ID_MONDAY).description()).toBe('ngx-translate');
            expect(master.transUnitWithId(ID_MONDAY).meaning()).toBe('dateservice.monday');
            done();
        });

        it('should find description and meaning in translated xlf2 file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: ITranslationMessagesFile = readXliff2(xliffMergeCmd.generatedI18nFile('de'));
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
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
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
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
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
                    i18nFormat: 'xlf2',
                    i18nFile: MASTERFILE,
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

    });

});
