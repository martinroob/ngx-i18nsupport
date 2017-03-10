"use strict";
var fs = require("fs");
var xliff_merge_1 = require("./xliff-merge");
var command_output_1 = require("../common/command-output");
var writer_to_string_1 = require("../common/writer-to-string");
var file_util_1 = require("../common/file-util");
var xliff_file_1 = require("./xliff-file");
var xmb_file_1 = require("./xmb-file");
/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge.
 */
describe('XliffMerge test spec', function () {
    var MASTER1FILE = 'ngExtractedMaster1.xlf';
    var MASTER2FILE = 'ngExtractedMaster2.xlf';
    var MASTER1XMBFILE = 'ngExtractedMaster1.xmb';
    var MASTER2XMBFILE = 'ngExtractedMaster2.xmb';
    var SRCDIR = 'test/testdata/i18n/';
    var MASTER1SRC = SRCDIR + MASTER1FILE;
    var MASTER2SRC = SRCDIR + MASTER2FILE;
    var MASTER1XMBSRC = SRCDIR + MASTER1XMBFILE;
    var MASTER2XMBSRC = SRCDIR + MASTER2XMBFILE;
    /**
     * Workdir, not in git.
     * Cleaned up for every test.
     * Tests, that work on files, copy everything they need into this directory.
     * @type {string}
     */
    var WORKDIR = 'test/work/';
    var MASTERFILE = 'messages.xlf';
    var MASTER = WORKDIR + MASTERFILE;
    var MASTERXMBFILE = 'messages.xmb';
    var MASTERXMB = WORKDIR + MASTERXMBFILE;
    describe('test the tooling used in the tests', function () {
        it('should write output to string (Test WriterToString)', function () {
            var ws = new writer_to_string_1.WriterToString();
            ws.write('test test test\n');
            ws.write('line 2');
            expect(ws.writtenData()).toContain('line 2');
        });
    });
    describe('command line and configuration checks', function () {
        it('should parse -v option', function () {
            var options = xliff_merge_1.XliffMerge.parseArgs(['node', 'xliffmerge', '-v']);
            expect(options.verbose).toBeTruthy();
            expect(options.quiet).toBeFalsy();
        });
        it('should parse -q option', function () {
            var options = xliff_merge_1.XliffMerge.parseArgs(['node', 'xliffmerge', '-q']);
            expect(options.quiet).toBeTruthy();
            expect(options.verbose).toBeFalsy();
        });
        it('should output an errror (no languages) when called with defaults', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var xliffMergeCmd = new xliff_merge_1.XliffMerge(commandOut, {});
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('no languages specified');
            done();
        });
        it('should output an errror (i18nfile) when called with defaults', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var xliffMergeCmd = new xliff_merge_1.XliffMerge(commandOut, { languages: ['de', 'en'] });
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('i18nFile');
            done();
        });
        it('should output an errror (could not read) when called with a non existing profile', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var xliffMergeCmd = new xliff_merge_1.XliffMerge(commandOut, { verbose: true, profilePath: 'lmaa' });
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('could not read profile');
            done();
        });
        it('should read test config file', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { profilePath: './test/testdata/xliffmergeconfig.json', verbose: true }, null);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('languages:	de,en');
            done();
        });
        it('should output an errror (srcDir not readable) when called with a non existing srcDir', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    srcDir: 'lmaa',
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { verbose: true }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('srcDir "lmaa" is not a directory');
            done();
        });
        it('should output an errror (genDir not existing) when called with a non existing genDir', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    genDir: 'lmaa',
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { verbose: true }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('genDir "lmaa" is not a directory');
            done();
        });
        it('should output an errror (i18nFile is not readable) when called with a non existing master file', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    srcDir: 'test/testdata',
                    i18nFile: 'nonexistingmaster.xlf'
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('i18nFile "test/testdata/nonexistingmaster.xlf" is not readable');
            done();
        });
        it('should output an errror (language not valid) when called with an invalid language code', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de/ch',
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('language "de/ch" is not valid');
            done();
        });
        it('should output an errror (i18nFormat invalid) when called with an invalid i18n format', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    i18nFormat: 'unknown',
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('i18nFormat "unknown" invalid');
            done();
        });
        it('should accept i18n format xlf', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    i18nFormat: 'xlf',
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('i18nFormat');
            done();
        });
        it('should accept i18n format xmb', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    i18nFormat: 'xmb',
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('i18nFormat');
            done();
        });
        it('should read languages from config file', function (done) {
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    languages: ['de', 'en', 'fr'],
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { verbose: true }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('languages:	de,en,fr');
            done();
        });
    });
    describe('Merge process checks for format xlf', function () {
        var ID_TRANSLATED_SCHLIESSEN = "1ead0ad1063d0c9e005fe56c9529aef4c1ef9d21"; // an ID from ngExtractedMaster1.xlf
        var ID_REMOVED_STARTSEITE = "c536247d71822c272f8e9155f831e0efb5aa0d31"; // an ID that will be removed in master2
        var ID_REMOVED_SUCHEN = "d17aee1ddf9fe1c0afe8440e02ef5ab906a69699"; // another removed ID
        beforeEach(function () {
            if (!fs.existsSync(WORKDIR)) {
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            file_util_1.FileUtil.deleteFolderContentRecursive(WORKDIR);
        });
        it('should fix source language, if the masters lang is not the default', function (done) {
            file_util_1.FileUtil.copy(MASTER1SRC, MASTER);
            var master = xliff_file_1.XliffFile.fromFile(MASTER);
            expect(master.sourceLanguage()).toBe('en'); // master is german, but ng-18n extracts it as en
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE,
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('master says to have source-language="en"');
            expect(ws.writtenData()).toContain('changed master source-language="en" to "de"');
            var newmaster = xliff_file_1.XliffFile.fromFile(MASTER);
            expect(newmaster.sourceLanguage()).toBe('de'); // master is german
            done();
        });
        it('should generate translated file for default language de from master', function (done) {
            file_util_1.FileUtil.copy(MASTER1SRC, MASTER);
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            var langFile = xliff_file_1.XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFile.sourceLanguage()).toBe('de');
            expect(langFile.targetLanguage()).toBe('de');
            langFile.forEachTransUnit(function (tu) {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            done();
        });
        it('should generate translated file for all languages', function (done) {
            file_util_1.FileUtil.copy(MASTER1SRC, MASTER);
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de', 'en'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            var langFileGerman = xliff_file_1.XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFileGerman.sourceLanguage()).toBe('de');
            expect(langFileGerman.targetLanguage()).toBe('de');
            langFileGerman.forEachTransUnit(function (tu) {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('final');
            });
            var langFileEnglish = xliff_file_1.XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.sourceLanguage()).toBe('de');
            expect(langFileEnglish.targetLanguage()).toBe('en');
            langFileEnglish.forEachTransUnit(function (tu) {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBe('new');
            });
            done();
        });
        it('should merge translated file for all languages', function (done) {
            file_util_1.FileUtil.copy(MASTER1SRC, MASTER);
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERFILE
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de', 'en'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            // now translate some texts in the English version
            var langFileEnglish = xliff_file_1.XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            var tu = langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN);
            expect(tu).toBeTruthy();
            langFileEnglish.translate(tu, 'Close');
            langFileEnglish.save();
            // next step, use another master
            file_util_1.FileUtil.copy(MASTER2SRC, MASTER);
            ws = new writer_to_string_1.WriterToString();
            commandOut = new command_output_1.CommandOutput(ws);
            xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de', 'en'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('merged 12 trans-units from master to "en"');
            expect(ws.writtenData()).toContain('removed 2 unused trans-units in "en"');
            // look, that the new file contains the old translation
            langFileEnglish = xliff_file_1.XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_TRANSLATED_SCHLIESSEN).targetContent()).toBe('Close');
            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_STARTSEITE)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_SUCHEN)).toBeFalsy();
            done();
        });
    });
    describe('Merge process checks for format xmb', function () {
        var ID_TRANSLATED_MYFIRST = "2047558209369508311"; // an ID from ngExtractedMaster1.xlf
        var ID_REMOVED_DESCRIPTION = "7499557905529977371"; // an ID that will be removed in master2
        var ID_REMOVED_DESCRIPTION2 = "3274258156935474372"; // another removed ID
        var ID_ADDED = "3274258156935474372"; // an ID that will be added in master2
        beforeEach(function () {
            if (!fs.existsSync(WORKDIR)) {
                fs.mkdirSync(WORKDIR);
            }
            // cleanup workdir
            file_util_1.FileUtil.deleteFolderContentRecursive(WORKDIR);
        });
        it('should generate translated file for default language de from xmb master', function (done) {
            file_util_1.FileUtil.copy(MASTER1XMBSRC, MASTERXMB);
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERXMBFILE,
                    i18nFormat: 'xmb'
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            var langFile = xmb_file_1.XmbFile.fromFile(xliffMergeCmd.generatedI18nFile('de'));
            expect(langFile.sourceLanguage()).toBeFalsy(); // not supported in xmb
            expect(langFile.targetLanguage()).toBeFalsy();
            langFile.forEachTransUnit(function (tu) {
                expect(tu.targetContent()).toBe(tu.sourceContent());
                expect(tu.targetState()).toBeFalsy();
            });
            done();
        });
        it('should generate translated file for all languages using format xmb', function (done) {
            file_util_1.FileUtil.copy(MASTER1XMBSRC, MASTERXMB);
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERXMBFILE,
                    i18nFormat: 'xmb'
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de', 'en'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            var langFileGerman = xmb_file_1.XmbFile.fromFile(xliffMergeCmd.generatedI18nFile('de'));
            langFileGerman.forEachTransUnit(function (tu) {
                expect(tu.targetContent()).toBe(tu.sourceContent());
            });
            var langFileEnglish = xmb_file_1.XmbFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            langFileEnglish.forEachTransUnit(function (tu) {
                expect(tu.targetContent()).toBe(tu.sourceContent());
            });
            done();
        });
        it('should merge translated file for all languages using format xmb', function (done) {
            file_util_1.FileUtil.copy(MASTER1XMBSRC, MASTERXMB);
            var ws = new writer_to_string_1.WriterToString();
            var commandOut = new command_output_1.CommandOutput(ws);
            var profileContent = {
                xliffmergeOptions: {
                    defaultLanguage: 'de',
                    srcDir: WORKDIR,
                    genDir: WORKDIR,
                    i18nFile: MASTERXMBFILE,
                    i18nFormat: 'xmb'
                }
            };
            var xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de', 'en'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            // now translate some texts in the English version
            var langFileEnglish = xmb_file_1.XmbFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            var tu = langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST);
            expect(tu).toBeTruthy();
            langFileEnglish.translate(tu, 'My first app');
            langFileEnglish.save();
            // next step, use another master
            file_util_1.FileUtil.copy(MASTER2XMBSRC, MASTER);
            ws = new writer_to_string_1.WriterToString();
            commandOut = new command_output_1.CommandOutput(ws);
            xliffMergeCmd = xliff_merge_1.XliffMerge.createFromOptions(commandOut, { languages: ['de', 'en'] }, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('ERROR');
            expect(ws.writtenData()).toContain('merged 100 trans-units from master to "en"');
            expect(ws.writtenData()).toContain('removed 100 unused trans-units in "en"');
            // look, that the new file contains the old translation
            langFileEnglish = xliff_file_1.XliffFile.fromFile(xliffMergeCmd.generatedI18nFile('en'));
            expect(langFileEnglish.transUnitWithId(ID_TRANSLATED_MYFIRST).targetContent()).toBe('My first app');
            // look, that the removed IDs are really removed.
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_DESCRIPTION)).toBeFalsy();
            expect(langFileEnglish.transUnitWithId(ID_REMOVED_DESCRIPTION2)).toBeFalsy();
            done();
        });
    });
});
