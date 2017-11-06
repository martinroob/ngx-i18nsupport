import {XliffMerge} from './xliff-merge';
import {ProgramOptions, IConfigFile} from './i-xliff-merge-options';
import {CommandOutput} from '../common/command-output';
import WritableStream = NodeJS.WritableStream;
import {WriterToString} from '../common/writer-to-string';

/**
 * Created by martin on 18.02.2017.
 * Testcases for XliffMerge.
 */

describe('XliffMerge test spec', () => {

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

        it('should accept en_US (with underscore) as a valid language code (#59)', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'en_US',
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).not.toContain('language "en_US" is not valid');
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

        it('should output an error when autotranslate is set to true and there is no api key set', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    autotranslate: true,
                    apikey: "",
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('autotranslate requires an API key');
            done();
        });

        it('should output an error when autotranslate is set to a list of languages and there is no api key set', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    autotranslate: ['de'],
                    apikey: "",
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('autotranslate requires an API key');
            done();
        });

        it('should read api key from file if apikeyfile is set', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    autotranslate: ['de'],
                    apikeyfile: "package.json",
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {verbose: true}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('apikeyfile:\tpackage.json');
            expect(ws.writtenData()).toContain('apikey:\t****');
            done();
        });

        it('should output an error when autotranslate language is not in list of languages', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    languages: ['en', 'ru'],
                    autotranslate: ['de'],
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('autotranslate language "de" is not in list of languages');
            done();
        });

        it('should output an error when autotranslate language is set to default language', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    languages: ['en', 'ru'],
                    autotranslate: ['en', 'ru'],
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).toContain('autotranslate language "en" cannot be translated, because it is the source language');
            done();
        });

        it('should not output error ".. because it is the source language" when autotranslate language is not set to default language (issue #52)', (done) => {
            let ws: WriterToString = new WriterToString();
            let commandOut = new CommandOutput(ws);
            let profileContent: IConfigFile = {
                xliffmergeOptions: {
                    defaultLanguage: 'zh-CN',
                    languages: ['en', 'ja'],
                    autotranslate: ['en', 'ja'],
                }
            };
            let xliffMergeCmd = XliffMerge.createFromOptions(commandOut, {}, profileContent);
            xliffMergeCmd.run();
            expect(ws.writtenData()).toContain('ERROR');
            expect(ws.writtenData()).not.toContain('autotranslate language "en" cannot be translated, because it is the source language');
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

});
