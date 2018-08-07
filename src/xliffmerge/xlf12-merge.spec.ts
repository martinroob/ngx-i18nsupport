import * as fs from "fs";
import {XliffMerge} from './xliff-merge';
import {IConfigFile} from './i-xliff-merge-options';
import {CommandOutput} from '../common/command-output';
import WritableStream = NodeJS.WritableStream;
import {WriterToString} from '../common/writer-to-string';
import {FileUtil} from '../common/file-util';
import {ITranslationMessagesFile, ITransUnit} from 'ngx-i18nsupport-lib';
import {TranslationMessagesFileReader} from './translation-messages-file-reader';
import {format} from 'util';
import {getApiKey} from '../autotranslate/auto-translate-service.spec';
import {STATE_FINAL, STATE_NEW, STATE_TRANSLATED} from 'ngx-i18nsupport-lib/dist';
import {XmlReader} from './xml-reader';

/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge Format XLIFF 1.2.
 */

describe('XliffMerge XLIFF 1.2 format tests', () => {

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
     * Helper function to read Xliff from File
     * @type {string}
     */
    function readXliff(path: string): ITranslationMessagesFile {
        if (!path) {
            throw new Error('oops, no file');
        }
        try {
            return TranslationMessagesFileReader.fromFile('xlf', path, ENCODING);
        } catch (err) {
            console.log(format('error reading %s: "%s"', path, err.message));
            return null;
        }
    }

    describe('Merge process checks for format xlf', () => {
        let MASTER1FILE = 'ngExtractedMaster1.xlf';
        let MASTER2FILE = 'ngExtractedMaster2.xlf';
        let MASTER1SRC = SRCDIR + MASTER1FILE;
        let MASTER2SRC = SRCDIR + MASTER2FILE;
        let MASTERFILE = 'messages.xlf';
        let MASTER = WORKDIR + MASTERFILE;

        let ID_TRANSLATED_SCHLIESSEN = "1ead0ad1063d0c9e005fe56c9529aef4c1ef9d21"; // an ID from ngExtractedMaster1.xlf
        let ID_REMOVED_STARTSEITE = "c536247d71822c272f8e9155f831e0efb5aa0d31"; // an ID that will be removed in master2
        let ID_REMOVED_SUCHEN = "d17aee1ddf9fe1c0afe8440e02ef5ab906a69699"; // another removed ID
        let ID_WITH_PLACEHOLDER = "af0819ea4a5db68737ebcabde2f5e432b66352e8";
        let ID_MISSING_SOURCEREF = '57e605bfa130afb4de4ee40e496e854a9e8a28a7';
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
            let master: ITranslationMessagesFile = readXliff(MASTER);
            expect(master.sourceLanguage()).toBe('en'); // master is german, but ng-18n extracts it as en
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('master says to have source-language="en"');
            expect(ws.writtenData()).toContain('changed master source-language="en" to "de"');
            let newmaster: ITranslationMessagesFile = readXliff(MASTER);
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
                    i18nFile: MASTERFILE,
		            useSourceAsTarget: false
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('de'));
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
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
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
                    i18nFile: MASTERFILE,
		            useSourceAsTarget: false
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.sourceLanguage()).toBe('de');
            expect(langFileEnglish.targetLanguage()).toBe('en');
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe('');
                expect(tu.targetState()).toBe('new');
            });
            done();
        });

        it('should generate translated file for all languages with set praefix and suffix (#70)', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    targetPraefix: '%%',
                    targetSuffix: '!!',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                if (!tu.targetContent().startsWith('{VAR')) {
                    expect(tu.targetContent()).toBe('%%' + tu.sourceContent() + '!!');
                } else {
                    expect(tu.targetContent()).toBe(tu.sourceContent());
                }
                expect(tu.targetState()).toBe('final');
            });
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.sourceLanguage()).toBe('de');
            expect(langFileEnglish.targetLanguage()).toBe('en');
            langFileEnglish.forEachTransUnit((tu: ITransUnit) => {
                if (!tu.targetContent().startsWith('{VAR')) {
                    expect(tu.targetContent()).toBe('%%' + tu.sourceContent() + '!!');
                } else {
                    expect(tu.targetContent()).toBe(tu.sourceContent());
                }
                expect(tu.targetState()).toBe('new');
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
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu).toBeTruthy();
            tu.translate('Close');
            TranslationMessagesFileReader.save(langFileEnglish);

            // next step, use another master
            FileUtil.copy(MASTER2SRC, MASTER);
            ws = new WriterToString();
            commandOut = new CommandOutput(ws);
            xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('merged 12 trans-units from master to "en"');
            expect(ws.writtenData()).toContain('removed 5 unused trans-units in "en"');

            // look, that the new file contains the old translation
            langFileEnglish = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN).targetContent()).toBe('Close');

            // look, that the removed IDs are really removed.

            expect(langFileEnglish.transUnitWithId(ID_REMOVED_STARTSEITE)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_SUCHEN)).toBeFalsy();
            done();
        });

        it('should merge changed source content with explicit ID to default language file (#81)', (done) => {
            const ID_SOURCE_CHANGE = 'sourcechanged';
            const ID_SOURCE_CHANGE_STATE_FINAL = 'sourcechanged_state_final';
            const TRANSLATED_FILE = 'WithSourceContentChange.de.xlf';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithSourceContentChange.xlf', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.de.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: transferred 2 changed source content from master to "de"');

            // check that source is changed
            let langFileGerman: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('de'));
            let tu: ITransUnit = langFileGerman.transUnitWithId(ID_SOURCE_CHANGE);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Test Änderung Source (geändert!)');
            expect(tu.targetContent()).toBe('Test Änderung Source (geändert!)');
            expect(tu.targetState()).toBe(STATE_FINAL);
            done();
        });

        it('should merge changed source content to already translated files', (done) => {
            const ID_SOURCE_CHANGE = 'sourcechanged';
            const ID_SOURCE_CHANGE_STATE_FINAL = 'sourcechanged_state_final';
            const TRANSLATED_FILE = 'WithSourceContentChange.en.xlf';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithSourceContentChange.xlf', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: transferred 2 changed source content from master to "en"');

            // check that source is changed
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
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

        it('should merge missing source refs to already translated files', (done) => {
            let MISSING_SOURCEREF_FILE = 'missingSourcerefs.en.xlf';
            FileUtil.copy(MASTER1SRC, MASTER);
            FileUtil.copy(SRCDIR + MISSING_SOURCEREF_FILE, WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: transferred 2 source references');

            // check that there is a translated english version with missing sourcerefs
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_MISSING_SOURCEREF);
            expect(tu).toBeTruthy();
            expect(tu.targetContent()).toBe('News');
            expect(tu.sourceReferences().length).toBe(2);
            done();
        });

        it('should merge changed descriptions and meanings to already translated files', (done) => {
            const TRANSLATED_FILE = 'WithDescriptions.en.xlf';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithDescriptions.xlf', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: transferred 3 changed descriptions/meanings from master to "en"');

            // check that description and meaning are changed
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
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

        it('should preserve order when merging new units (#96)', (done) => {
            FileUtil.copy(SRCDIR + 'preserveOrderMaster1.xlf', MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'en',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['en', 'de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // next step, use new master that has added 3 units
            FileUtil.copy(SRCDIR + 'preserveOrderMaster2.xlf', MASTER);
            ws = new WriterToString();
            commandOut = new CommandOutput(ws);
            xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['en', 'de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('merged 3 trans-units from master to "de"');

            // look, that the new file contains the new units at the correct position
            const langFileGerman = readXliff(xliffMergeCmd.generatedI18nFile('de'));
            const addedTu = langFileGerman.transUnitWithId('addedunit1');
            expect(addedTu).toBeTruthy();
            expect(addedTu.sourceContent()).toBe('added unit 1');
            // check position
            expect(langFileGerman.editedContent().replace(/(\r\n|\n|\r)/gm,"")).toMatch(/addedunit1.*firstunit.*addedunit2.*lastunit.*addedunit3/);
            done();
        });

        it('should not remove trailing line break when merging', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            const masterContent = FileUtil.read(MASTER, XmlReader.DEFAULT_ENCODING);
            expect(masterContent.endsWith('\n')).toBeTruthy('master file should end with EOL');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            const newContent = FileUtil.read(xliffMergeCmd.generatedI18nFile('de'), XmlReader.DEFAULT_ENCODING);
            expect(newContent.endsWith('\n')).toBeTruthy('file should end with EOL');
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
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            tu.translate('Item <x id="INTERPOLATION"/> of <x id="INTERPOLATION_1"/> added.');
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContent()).toBe('Item <x id="INTERPOLATION"/> of <x id="INTERPOLATION_1"/> added.');
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContentNormalized().asDisplayString()).toBe('Item {{0}} of {{1}} added.');

            done();
        });

        it('should translate messages with 2 custom tags with different ids (#84)', (done) => {
            const ID_2_CUSTOM_TAGS = '8856d298b6fa89a339475c5d5cd20f2d2afcfbf7';
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_2_CUSTOM_TAGS);
            expect(tu).toBeTruthy();
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('Neues <bs-activity-stream-element></bs-activity-stream-element> wurde gemeldet durch <bs-activity-stream-element id="1"></bs-activity-stream-element>');
            const translation = tu.sourceContentNormalized().translate('New <bs-activity-stream-element></bs-activity-stream-element> was reported by <bs-activity-stream-element id="1"></bs-activity-stream-element>');
            tu.translate(translation);
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_2_CUSTOM_TAGS).targetContent()).toBe('New <x id="START_TAG_BS-ACTIVITY-STREAM-ELEMENT" ctype="x-bs-activity-stream-element" equiv-text="&lt;bs-activity-stream-element>"/><x id="CLOSE_TAG_BS-ACTIVITY-STREAM-ELEMENT" ctype="x-bs-activity-stream-element"/> was reported by <x id="START_TAG_BS-ACTIVITY-STREAM-ELEMENT_1" ctype="x-bs-activity-stream-element" equiv-text="&lt;bs-activity-stream-element>"/><x id="CLOSE_TAG_BS-ACTIVITY-STREAM-ELEMENT" ctype="x-bs-activity-stream-element"/>');
            expect(langFileEnglish.transUnitWithId(ID_2_CUSTOM_TAGS).targetContentNormalized().asDisplayString()).toBe('New <bs-activity-stream-element></bs-activity-stream-element> was reported by <bs-activity-stream-element id="1"></bs-activity-stream-element>');

            done();
        });

        it('should translate ICU message with placeholder (#83)', (done) => {
            const ID_ICU_WITH_PLACEHOLDER = '8856d298b6fa89a339475c5d5cd20f2d2afcfbf8';
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_ICU_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            expect(tu.sourceContentNormalized().asDisplayString()).toBe('<ICU-Message/>');
            const t = '{VAR_PLURAL, plural, =1 {Crash <x id="INTERPOLATION" equiv-text="{{ a }}"/> was} other {Crashes <x id="INTERPOLATION" equiv-text="{{ a}}"/> were} }';
            const translation = tu.sourceContentNormalized().translateICUMessage({"=1": 'Crash <x id="INTERPOLATION" equiv-text="{{ a }}"/> was'});
            tu.translate(translation);
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_ICU_WITH_PLACEHOLDER).targetContentNormalized().asDisplayString()).toBe('<ICU-Message/>');
            expect(langFileEnglish.transUnitWithId(ID_ICU_WITH_PLACEHOLDER).targetContentNormalized().getICUMessage().asNativeString()).toContain('Crash');

            done();
        });

        it('allowIdChange feature, should merge only white space changed content with changed ID to already translated files (#65)', (done) => {
            const ID_ORIGINAL = 'originalId';
            const ID_CHANGED = 'changedId';
            const TRANSLATED_FILE = 'WithIdChange.en.xlf';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithIdChange.xlf', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    allowIdChange: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: found 2 changed id\'s in "en"');

            // check that changed id is merged
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tuChanged: ITransUnit = langFileEnglish.transUnitWithId(ID_CHANGED);
            expect(tuChanged).toBeTruthy();
            expect(tuChanged.sourceContent().trim()).toBe('Test kleine Änderung, nur white spaces!');
            expect(tuChanged.targetState()).toBe(STATE_TRANSLATED);
            expect(tuChanged.targetContent()).toBe('Test for a small white space change');
            let tuOriginal: ITransUnit = langFileEnglish.transUnitWithId(ID_ORIGINAL);
            expect(tuOriginal).toBeFalsy();
            done();
        });

        it('allowIdChange feature, should merge untranslated only white space changed content with changed ID, but should set preserve state "new" (#68)', (done) => {
            const ID_ORIGINAL = 'originalIdUntranslated';
            const ID_CHANGED = 'changedIdUntranslated';
            const TRANSLATED_FILE = 'WithIdChange.en.xlf';
            FileUtil.copy(SRCDIR + 'ngExtractedMasterWithIdChange.xlf', MASTER);
            FileUtil.copy(SRCDIR + TRANSLATED_FILE,WORKDIR + 'messages.en.xlf');
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    allowIdChange: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en'], verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('WARNING: found 2 changed id\'s in "en"');

            // check that changed id is merged
            let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            let tuChanged: ITransUnit = langFileEnglish.transUnitWithId(ID_CHANGED);
            expect(tuChanged).toBeTruthy();
            expect(tuChanged.sourceContent().trim()).toBe('Unübersetzt');
            expect(tuChanged.targetState()).toBe(STATE_NEW);
            expect(tuChanged.targetContent()).toBe(''); // not translated
            let tuOriginal: ITransUnit = langFileEnglish.transUnitWithId(ID_ORIGINAL);
            expect(tuOriginal).toBeFalsy();
            done();
        });

        it('should report an error with filename when there is something wrong', (done) => {
            FileUtil.copy(SRCDIR + 'schrott.xlf', MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            // we activate ngxtranslate support, so that the wrong close tag in schrott produces an error
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    supportNgxTranslate: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            try {
                xliffMergeCmd.run();
            } catch (e) {}
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('messages.de.xlf');
            done();
        });

        it('should use beautify when requested (#64, #88)', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            const unformattedContent = XmlReader.readXmlFileContent(xliffMergeCmd.generatedI18nFile('en'));
            expect(unformattedContent.content).toContain('<xliff version="1.2" xmlns="urn:oasis:names:tc:xliff:document:1.2">');
// to debug formatting:                        FileUtil.copy(xliffMergeCmd.generatedI18nFile('en'), SRCDIR + 'nobeautify');

            // next step, same with beautify
            FileUtil.deleteFile(xliffMergeCmd.generatedI18nFile('en'));
            ws = new WriterToString();
            commandOut = new CommandOutput(ws);
            profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    beautifyOutput: true
                }
            };
            xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            const formattedContent = XmlReader.readXmlFileContent(xliffMergeCmd.generatedI18nFile('en'));
            expect(formattedContent.content).toContain('\n        <source>Nachrichten</source>');
// to debug formatting:            FileUtil.copy(xliffMergeCmd.generatedI18nFile('en'), SRCDIR + 'beautify');
            done();
        });

        it('should not add empty lines when using beautify whith complex content (#97)', (done) => {
            FileUtil.copy(SRCDIR + 'issue97emptylines.xlf', MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'en',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    beautifyOutput: true
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['en', 'ru']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            const formattedContent1 = XmlReader.readXmlFileContent(xliffMergeCmd.generatedI18nFile('ru'));
// to debug formatting: FileUtil.copy(xliffMergeCmd.generatedI18nFile('ru'), SRCDIR + 'beautify1');

            // next step, once again with beautify
            ws = new WriterToString();
            commandOut = new CommandOutput(ws);
            profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'en',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    beautifyOutput: true
                }
            };
            xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['en', 'ru']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            const formattedContent2 = XmlReader.readXmlFileContent(xliffMergeCmd.generatedI18nFile('ru'));
            expect(formattedContent2.content).toMatch(/I accept the\r?\n[ \t]*<x/);
            expect(formattedContent2.content).not.toMatch(/I accept the\r?\n[ \t]*\r?\n[ \t]*<x/);
// to debug formatting: FileUtil.copy(xliffMergeCmd.generatedI18nFile('ru'), SRCDIR + 'beautify2');
            done();
        });

        describe('autotranslate via google translate', () => {

            let apikey: string;

            const ID_NACHRICHTEN = '57e605bfa130afb4de4ee40e496e854a9e8a28a7';
            const ID_BESCHREIBUNG_WITH_PLACEHOLDER = 'a52ba049c16778bdb2e5a19a41acaadf87b104dc';
            const ID_ICUMESSAGE = 'efec69fdcf74bd6d640b2a771558b7b09e271c28';

            beforeEach(() => {
                apikey = getApiKey();
            });

            it('should detect invalid key', (done) => {
                if (!apikey) {
                    // skip test
                    done();
                    return;
                }
                FileUtil.copy(MASTER1SRC, MASTER);
                let ws: WriterToString = new WriterToString();
                let commandOut = new CommandOutput(ws);
                let profileContent: IConfigFile = {
                    xliffmergeOptions: {
                        defaultLanguage: 'de',
                        srcDir: WORKDIR,
                        genDir: WORKDIR,
                        i18nFile: MASTERFILE,
                        autotranslate: true,
                        apikey: 'lmaa'
                    }
                };
                let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
                xliffMergeCmd.run((retcode) => {
                    expect(ws.writtenData()).toContain('API key not valid');
                    done();
                });
            });

            it('should auto translate file', (done) => {
                if (!apikey) {
                    // skip test
                    done();
                    return;
                }
                FileUtil.copy(MASTER1SRC, MASTER);
                let ws: WriterToString = new WriterToString();
                let commandOut = new CommandOutput(ws);
                let profileContent: IConfigFile = {
                    xliffmergeOptions: {
                        defaultLanguage: 'de',
                        srcDir: WORKDIR,
                        genDir: WORKDIR,
                        i18nFile: MASTERFILE,
                        autotranslate: true,
                        apikey: apikey
                    }
                };
                let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
                xliffMergeCmd.run(() => {
                    expect(ws.writtenData()).not.toContain('ERROR');
                    let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
                    expect(langFileEnglish.targetLanguage()).toBe('en');
                    let tu = langFileEnglish.transUnitWithId(ID_NACHRICHTEN);
                    expect(tu.sourceContent()).toBe('Nachrichten');
                    expect(tu.targetContent()).toBe('news');
                    expect(tu.targetState()).toBe('translated');
                    let tuICU = langFileEnglish.transUnitWithId(ID_ICUMESSAGE);
                    expect(tuICU.sourceContent()).toContain('VAR_PLURAL');
                    expect(tuICU.targetContent()).toBe('{VAR_PLURAL, plural, =0 {no sheep} =1 {1 sheep} other {x sheep}}');
                    expect(tuICU.targetState()).toBe('translated');
                    done();
                });
            });

            it('should auto translate file with region code (which will be ignored)', (done) => {
                if (!apikey) {
                    // skip test
                    done();
                    return;
                }
                FileUtil.copy(MASTER1SRC, MASTER);
                let ws: WriterToString = new WriterToString();
                let commandOut = new CommandOutput(ws);
                let profileContent: IConfigFile = {
                    xliffmergeOptions: {
                        defaultLanguage: 'de-de',
                        srcDir: WORKDIR,
                        genDir: WORKDIR,
                        i18nFile: MASTERFILE,
                        autotranslate: true,
                        apikey: apikey
                    }
                };
                let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de-de', 'en-us']}, profileContent);
                xliffMergeCmd.run((retcode) => {
                    expect(ws.writtenData()).not.toContain('ERROR');
                    let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en-us'));
                    expect(langFileEnglish).toBeTruthy();
                    if (langFileEnglish) {
                        expect(langFileEnglish.targetLanguage()).toBe('en-us');
                        let tu = langFileEnglish.transUnitWithId(ID_BESCHREIBUNG_WITH_PLACEHOLDER);
                        expect(tu.sourceContentNormalized().asDisplayString()).toBe('Beschreibung zu {{0}} ({{1}})');
                        expect(tu.targetContentNormalized().asDisplayString()).toBe('Description of {{0}} ({{1}})');
                        expect(tu.targetState()).toBe('translated');
                    }
                    done();
                });
            });

            it('should detect unsupported language when using auto translate', (done) => {
                if (!apikey) {
                    // skip test
                    done();
                    return;
                }
                FileUtil.copy(MASTER1SRC, MASTER);
                let ws: WriterToString = new WriterToString();
                let commandOut = new CommandOutput(ws);
                let profileContent: IConfigFile = {
                    xliffmergeOptions: {
                        defaultLanguage: 'de',
                        languages: ['de', 'xy', 'en'],
                        srcDir: WORKDIR,
                        genDir: WORKDIR,
                        i18nFile: MASTERFILE,
                        autotranslate: true,
                        apikey: apikey
                    }
                };
                let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {verbose: true}, profileContent);
                xliffMergeCmd.run((retcode) => {
                    expect(ws.writtenData()).toContain('ERROR');
                    expect(ws.writtenData()).toContain('"xy" not supported');
                    let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
                    expect(langFileEnglish).toBeTruthy();
                    if (langFileEnglish) {
                        expect(langFileEnglish.targetLanguage()).toBe('en');
                        let tu = langFileEnglish.transUnitWithId(ID_BESCHREIBUNG_WITH_PLACEHOLDER);
                        expect(tu.sourceContentNormalized().asDisplayString()).toBe('Beschreibung zu {{0}} ({{1}})');
                        expect(tu.targetContentNormalized().asDisplayString()).toBe('Description of {{0}} ({{1}})');
                        expect(tu.targetState()).toBe('translated');
                    }
                    let langFileXy: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('xy'));
                    expect(langFileXy).toBeTruthy();
                    if (langFileXy) {
                        expect(langFileXy.targetLanguage()).toBe('xy');
                        let tu = langFileXy.transUnitWithId(ID_BESCHREIBUNG_WITH_PLACEHOLDER);
                        expect(tu.sourceContentNormalized().asDisplayString()).toBe('Beschreibung zu {{0}} ({{1}})');
                        expect(tu.targetContentNormalized().asDisplayString()).toBe('Beschreibung zu {{0}} ({{1}})');
                        expect(tu.targetState()).toBe('new');
                    }
                    done();
                });
            });

            it('should auto translate text containing linefeeds (originated by #78)', (done) => {
                if (!apikey) {
                    // skip test
                    done();
                    return;
                }
                FileUtil.copy(SRCDIR + 'autotranslateMaster1.xlf', MASTER);
                let ws: WriterToString = new WriterToString();
                let commandOut = new CommandOutput(ws);
                let profileContent: IConfigFile = {
                    xliffmergeOptions: {
                        defaultLanguage: 'de',
                        srcDir: WORKDIR,
                        genDir: WORKDIR,
                        i18nFile: MASTERFILE,
                        autotranslate: true,
                        apikey: apikey
                    }
                };
                let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
                xliffMergeCmd.run(() => {
                    expect(ws.writtenData()).not.toContain('ERROR');
                    let langFileEnglish: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('en'));
                    let tu1 = langFileEnglish.transUnitWithId('totallyEmptyline1');
                    expect(tu1.sourceContent().trim()).toBe('');
                    expect(tu1.targetContent()).toBe('');
                    expect(tu1.targetState()).toBe('translated');
                    let tu2 = langFileEnglish.transUnitWithId('nearlytotallyEmptyline');
                    expect(tu2.sourceContent()).toContain('START_BOLD_TEXT');
                    // translation is nearly equal to source, because there is no translatable text
                    expect(tu2.targetContent().trim()).toEqual(tu2.sourceContent().trim());
                    expect(tu2.targetState()).toBe('translated');
                    let tu3 = langFileEnglish.transUnitWithId('emptylineText');
                    expect(tu3.sourceContent()).toContain('Text mit Zeilenumbruch');
                    expect(tu3.targetContent()).toBe('Text with line break');
                    expect(tu3.targetState()).toBe('translated');
                    done();
                });
            });

            it('should auto translate english text to french containing apostrophes (originated by #94)', (done) => {
                if (!apikey) {
                    // skip test
                    done();
                    return;
                }
                FileUtil.copy(SRCDIR + 'englishToFrench.xlf', MASTER);
                let ws: WriterToString = new WriterToString();
                let commandOut = new CommandOutput(ws);
                let profileContent: IConfigFile = {
                    xliffmergeOptions: {
                        defaultLanguage: 'en',
                        srcDir: WORKDIR,
                        genDir: WORKDIR,
                        i18nFile: MASTERFILE,
                        autotranslate: true,
                        apikey: apikey
                    }
                };
                const ID_OPERATOR_LOG = "50614ab096d22b3796a4891f21ab7e38b527b72b";
                let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['en', 'fr']}, profileContent);
                    xliffMergeCmd.run((retcode) => {
                        expect(ws.writtenData()).not.toContain('ERROR');
                        let langFileFrench: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('fr'));
                        let tu1 = langFileFrench.transUnitWithId(ID_OPERATOR_LOG);
                        expect(tu1).toBeTruthy();
                        expect(tu1.sourceContent().trim()).toBe('Operator Logs');
                        expect(tu1.targetContent()).toBe('Journaux de l\'opérateur');
                        expect(tu1.targetState()).toBe('translated');
                        done();
                    });
            });

        });
    });

    describe('ngx-translate processing for format xlf', () => {

        let MASTER1FILE = 'ngxtranslate.xlf';
        let MASTER1SRC = SRCDIR + MASTER1FILE;
        let MASTER_WITHOUT_NGX_TRANSLATE_STUFF = SRCDIR + 'ngExtractedMaster1.xlf';
        let MASTERFILE = 'messages.xlf';
        let MASTER = WORKDIR + MASTERFILE;

        let ID_NODESC_NOMEANING = "a8f10794864e49b16224b22faaf4a86229b6c53d"; // an ID without set meaning and description
        let ID_MONDAY = "84e8cd8ba480129d90f512cc3462bb43efcf389f"; // an ID from ngxtranslate.xlf with meaning "x.y" and description "ngx-translate"

        beforeEach(() => {
            if (!fs.existsSync(WORKDIR)){
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            FileUtil.deleteFolderContentRecursive(WORKDIR);
        });

        it('should return null for unset description and meaning in master  xlf file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXliff(MASTER);
            expect(master.transUnitWithId(ID_NODESC_NOMEANING).description()).toBeFalsy();
            expect(master.transUnitWithId(ID_NODESC_NOMEANING).meaning()).toBeFalsy();
            done();
        });

        it('should find description and meaning in master  xlf file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: ITranslationMessagesFile = readXliff(MASTER);
            expect(master.transUnitWithId(ID_MONDAY).description()).toBe('ngx-translate');
            expect(master.transUnitWithId(ID_MONDAY).meaning()).toBe('dateservice.monday');
            done();
        });

        it('should find description and meaning in translated xlf file', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: ITranslationMessagesFile = readXliff(xliffMergeCmd.generatedI18nFile('de'));
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

        it('should not export @@ids to translation json file, when this is supressed in pattern (issue #62)', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    supportNgxTranslate: true,
                    ngxTranslateExtractionPattern: 'ngx-translate'
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
            expect(translation.dateservice.monday).toBe("Montag");
            expect(translation.explicitlysetids).toBeFalsy();
            expect(translation["alt-ngx-translate"]).toBeFalsy();
            done();
        });

        it('should export other then ngx-translate description marked entries to translation json file, when this is specified in pattern (issue #62)', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                    supportNgxTranslate: true,
                    ngxTranslateExtractionPattern: 'ngx-translate|alt-ngx-translate'
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
            expect(translation.dateservice.monday).toBe("Montag");
            expect(translation.explicitlysetids).toBeFalsy();
            expect(translation["alt-ngx-translate"].example1).toBe('Alternate description for ngx-translate export');
            done();
        });

    });

});
