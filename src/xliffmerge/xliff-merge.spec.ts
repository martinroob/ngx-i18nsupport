import fs = require("fs");
import child_process = require("child_process");
import {XliffMerge, ProgramOptions, IConfigFile} from './xliff-merge';
import {CommandOutput} from '../common/command-output';
import WritableStream = NodeJS.WritableStream;
import {WriterToString} from '../common/writer-to-string';
import {FileUtil} from '../common/file-util';
import {XliffFile, TransUnit} from './xliff-file';
/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge.
 */

describe('XliffMerge test spec', () => {

    let MASTER1FILE = 'ngExtractedMaster1.xlf';
    let MASTER2FILE = 'ngExtractedMaster2.xlf';
    let SRCDIR = 'test/testdata/i18n/';
    let MASTER1SRC = SRCDIR + MASTER1FILE;
    let MASTER2SRC = SRCDIR + MASTER2FILE;

    /**
     * Workdir, not in git.
     * Cleaned up for every test.
     * Tests, that work on files, copy everything they need into this directory.
     * @type {string}
     */
    let WORKDIR = 'test/work/';
    let MASTERFILE = 'messages.xlf';
    let MASTER = WORKDIR + MASTERFILE;

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

        it('should output an errror (srcDir not readable) when called with a non existing srcDir', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    srcDir: 'lmaa',
                }
            }
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
            }
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
            }
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
            }
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('language "de/ch" is not valid');
            done();
        });

    });

    describe('Merge process checks', () => {

        let ID_TRANSLATED_SCHLIESSEN = "1ead0ad1063d0c9e005fe56c9529aef4c1ef9d21"; // an ID from ngExtractedMaster1.xlf
        let ID_REMOVED_STARTSEITE = "c536247d71822c272f8e9155f831e0efb5aa0d31"; // an ID that will be removed in master2
        let ID_REMOVED_SUCHEN = "d17aee1ddf9fe1c0afe8440e02ef5ab906a69699"; // another removed ID

        beforeEach(() => {
            if (!fs.existsSync(WORKDIR)){
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            FileUtil.deleteFolderContentRecursive(WORKDIR);
        });

        it('should fix source language, if the masters lang is not the default', (done) => {
            FileUtil.copy(MASTER1SRC, MASTER);
            let master: XliffFile = XliffFile.fromFile(MASTER);
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
            }
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('master says to have source-language="en"');
            expect(ws.writtenData()).toContain('changed master source-language="en" to "de"');
            let newmaster: XliffFile = XliffFile.fromFile(MASTER);
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
                    i18nFile: MASTERFILE
                }
            }
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFile: XliffFile = XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFile.sourceLanguage()).toBe('de');
            expect(langFile.targetLanguage()).toBe('de');
            langFile.forEachTransUnit((tu: TransUnit) => {
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
            }
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            let langFileGerman: XliffFile = XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit((tu: TransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            let langFileEnglish: XliffFile = XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.sourceLanguage()).toBe('de');
            expect(langFileEnglish.targetLanguage()).toBe('en');
            langFileEnglish.forEachTransUnit((tu: TransUnit) => {
                expect(tu.targetContent()).toBe(tu.sourceContent());
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
            }
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {languages: ['de', 'en']}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');

            // now translate some texts in the English version
            let langFileEnglish: XliffFile = XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            let tu: TransUnit = langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu).toBeTruthy();
            langFileEnglish.translate(tu, 'Close');
            langFileEnglish.save();

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
            langFileEnglish = XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN).targetContent()).toBe('Close');

            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_STARTSEITE)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_SUCHEN)).toBeFalsy();
            done();
        });

    });

});
