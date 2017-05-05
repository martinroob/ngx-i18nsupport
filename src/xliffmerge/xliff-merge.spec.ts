import * as fs from "fs";
import * as child_process from "child_process";
import {XliffMerge} from './xliff-merge';
import {ProgramOptions, IConfigFile} from './i-xliff-merge-options';
import {CommandOutput} from '../common/command-output';
import WritableStream = NodeJS.WritableStream;
import {WriterToString} from '../common/writer-to-string';
import {FileUtil} from '../common/file-util';
import {TranslationMessagesFileFactory, ITranslationMessagesFile, ITransUnit} from 'ngx-i18nsupport-lib';
import {TranslationMessagesFileReader} from './translation-messages-file-reader';

/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge.
 */

describe('XliffMerge test spec', () => {

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
        return TranslationMessagesFileReader.fromFile('xlf', path, ENCODING);
    }

    /**
     * Helper function to read XLIFF 2.0 from File
     * @type {string}
     */
    function readXliff2(path: string): ITranslationMessagesFile {
        return TranslationMessagesFileReader.fromFile('xlf2', path, ENCODING);
    }

    /**
     * Helper function to read Xmb from File
     * @type {string}
     */
    function readXmb(path: string): ITranslationMessagesFile {
        return TranslationMessagesFileReader.fromFile('xmb', path, ENCODING);
    }

    /**
     * Helper function to read Xmb from 2 Files, the xmb and the master
     * @type {string}
     */
    function readXmbWithMaster(path: string, masterPath: string): ITranslationMessagesFile {
        return TranslationMessagesFileReader.fromFile('xmb', path, ENCODING, masterPath);
    }

    describe('test the tooling used in the tests', () => {
        it('should write output to string (Test WriterToString)', () => {
            let ws: WriterToString = new WriterToString();
            ws.write('test test test\n');
            ws.write('line 2');
            expect(ws.writtenData()).toContain('line 2');
        });
    });

    describe('command line and configuration checks', () => {
        it('should parse -v option', () => {
            let options: ProgramOptions = XliffMerge.parseArgs(['node', 'xliffmerge', '-v']);
            expect(options.verbose).toBeTruthy();
            expect(options.quiet).toBeFalsy();
        });

        it('should parse -q option', () => {
            let options: ProgramOptions = XliffMerge.parseArgs(['node', 'xliffmerge', '-q']);
            expect(options.quiet).toBeTruthy();
            expect(options.verbose).toBeFalsy();
        });

        it('should output version and used parameters when called with defaults and verbose flag', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let xliffMergeCmd = new XliffMerge(commandOut, {verbose: true});
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('xliffmerge version');
            expect(ws.writtenData()).toContain('Used Parameters:');
            done();
        });

        it('should not output version and used parameters when called with defaults and both verbose and quiet flag', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let xliffMergeCmd = new XliffMerge(commandOut, {verbose: true, quiet: true});
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('xliffmerge version');
            expect(ws.writtenData()).not.toContain('Used Parameters:');
            done();
        });

        it('should output an errror (no languages) when called with defaults', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let xliffMergeCmd = new XliffMerge(commandOut, {});
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('no languages specified');
            done();
        });

        it('should output an errror (i18nfile) when called with defaults', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let xliffMergeCmd = new XliffMerge(commandOut, {languages: ['de', 'en']});
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('i18nFile');
            done();
        });

        it('should output an errror (could not read) when called with a non existing profile', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let xliffMergeCmd = new XliffMerge(commandOut, {verbose: true, profilePath: 'lmaa'});
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('could not read profile');
            done();
        });

        it('should read test config file', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {profilePath: './test/testdata/xliffmergeconfig.json', verbose: true}, null);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('languages:	de,en');
            done();
        });

        it('should output an errror (srcDir not readable) when called with a non existing srcDir', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    srcDir: 'lmaa',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('srcDir "lmaa" is not a directory');
            done();
        });

        it('should output an errror (genDir not existing) when called with a non existing genDir', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    genDir: 'lmaa',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('genDir "lmaa" is not a directory');
            done();
        });

        it('should output an errror (i18nFile is not readable) when called with a non existing master file', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    srcDir: 'test/testdata',
                    i18nFile: 'nonexistingmaster.xlf'
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('i18nFile "test/testdata/nonexistingmaster.xlf" is not readable');
            done();
        });

        it('should output an errror (language not valid) when called with an invalid language code', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'de/ch',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('language "de/ch" is not valid');
            done();
        });

        it('should output an errror (i18nFormat invalid) when called with an invalid i18n format', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    i18nFormat: 'unknown',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('i18nFormat "unknown" invalid');
            done();
        });

        it('should accept i18n format xlf', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    i18nFormat: 'xlf',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('i18nFormat');
            done();
        });

        it('should accept i18n format xlf2', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    i18nFormat: 'xlf2',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('i18nFormat');
            done();
        });

        it('should accept i18n format xmb', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    i18nFormat: 'xmb',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('i18nFormat');
            done();
        });

        it('should read languages from config file', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    languages: ['de', 'en', 'fr'],
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('languages:	de,en,fr');
            done();
        });

    });

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
            langFileEnglish.translate(tu, 'Close');
            TranslationMessagesFileReader.save(langFileEnglish);

            // next step, use another master
            FileUtil.copy(MASTER2SRC, MASTER);
            ws = new WriterToString();
            commandOut = new CommandOutput(ws);
            xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('merged 12 trans-units from master to "en"');
            expect(ws.writtenData()).toContain('removed 2 unused trans-units in "en"');

            // look, that the new file contains the old translation
            langFileEnglish = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN).targetContent()).toBe('Close');

            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_STARTSEITE)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_SUCHEN)).toBeFalsy();
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
            langFileEnglish.translate(tu, 'Item <x id="INTERPOLATION"/> of <x id="INTERPOLATION_1"/> added.');
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXliff(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContent()).toBe('Item <x id="INTERPOLATION"/> of <x id="INTERPOLATION_1"/> added.');
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContentNormalized()).toBe('Item {{0}} of {{1}} added.');

            done();
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

    });

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
            langFileEnglish.translate(tu, 'App runs');
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

            // look, that the new file contains the old translation
            langFileEnglish = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_APP_RUNS).targetContent()).toBe('App runs');

            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_MYFIRST)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_APPDESCRIPTION)).toBeFalsy();
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
            langFileEnglish.translate(tu, 'Item <ph id="0" equiv="INTERPOLATION" disp="{{number()}}"/> of <ph id="1" equiv="INTERPOLATION_1" disp="{{total()}}"/> added.');
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXliff2(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContent()).toBe('Item <ph id="0" equiv="INTERPOLATION" disp="{{number()}}"/> of <ph id="1" equiv="INTERPOLATION_1" disp="{{total()}}"/> added.');
            expect(langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER).targetContentNormalized()).toBe('Item {{0}} of {{1}} added.');

            done();
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
            let langFile: ITranslationMessagesFile = readXmb(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFile.sourceLanguage()).toBeFalsy(); // not supported in xmb when there is no master
            expect(langFile.targetLanguage()).toBe('de'); // guess from filename
            langFile.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBeFalsy();
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
            let langFileGerman: ITranslationMessagesFile = readXmb(xliffMergeCmd.generatedI18nFile('de'));
            langFileGerman.forEachTransUnit((tu: ITransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
            });
            let langFileEnglish: ITranslationMessagesFile = readXmb(xliffMergeCmd.generatedI18nFile('en'));
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
            let langFileEnglish: ITranslationMessagesFile = readXmb(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST);
            expect(tu).toBeTruthy();
            langFileEnglish.translate(tu, 'My first app');
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

            // look, that the new file contains the old translation
            langFileEnglish = readXmb(xliffMergeCmd.generatedI18nFile('en'));
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
            let langFileEnglish: ITranslationMessagesFile = readXmb(xliffMergeCmd.generatedI18nFile('en'));
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_WITH_PLACEHOLDER);
            expect(tu).toBeTruthy();
            langFileEnglish.translate(tu, 'Item <ph name="INTERPOLATION"><ex>INTERPOLATION</ex></ph> of <ph name="INTERPOLATION_1"><ex>INTERPOLATION_1</ex></ph> added.');
            TranslationMessagesFileReader.save(langFileEnglish);

            // look, that the new file contains the translation
            langFileEnglish = readXmb(xliffMergeCmd.generatedI18nFile('en'));
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
            let langFileEnglish: ITranslationMessagesFile = readXmbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
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
            let langFileEnglish: ITranslationMessagesFile = readXmbWithMaster(xliffMergeCmd.generatedI18nFile('en'), MASTER);
            // now translate some texts in the English version
            let tu: ITransUnit = langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST);
            expect(tu).toBeTruthy();
            expect(tu.sourceContent()).toBe('Meine erste I18N-Anwendung');
            expect(tu.targetState()).toBe('new');
            langFileEnglish.translate(tu, 'my first i18n application');
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
            let langFile: ITranslationMessagesFile = readXmb(xliffMergeCmd.generatedI18nFile('de'));
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
