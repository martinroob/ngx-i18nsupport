import {join, normalize, virtualFs} from '@angular-devkit/core';
import {BuildEvent, TargetSpecifier} from '@angular-devkit/architect';
import {TestProjectHost, runTargetSpec, TestLogger, DefaultTimeout} from '@angular-devkit/architect/testing';
import {tap} from 'rxjs/operators';
import {XliffmergeBuilderSchema} from './schema';
import {Observable} from 'rxjs';
import {IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';

describe('xliffmerge.builder', () => {

    /**
     * We are using a test workspace from the test folder.
     * In this workspace the builder is already configured.
     */
    const ngxi18nsupportRoot = normalize(join(normalize(__dirname), '../../../..'));
    const workspaceRoot = join(ngxi18nsupportRoot, 'src/builders/test/hello-world-app/');
    const host = new TestProjectHost(workspaceRoot);
    const xliffmergeTargetSpec: TargetSpecifier = {project: 'hello-world-app', target: 'xliffmerge'};

    function runXliffmergeBuilderOnTestWorkspace(configuration: XliffmergeBuilderSchema|undefined,
                                                 logger: TestLogger): Observable<BuildEvent> {
        return runTargetSpec(host, xliffmergeTargetSpec, configuration, DefaultTimeout, logger);
    }

    beforeEach(done => {
        host.initialize().toPromise().then(done, done.fail);
    });

    afterEach(done => {
        host.restore().toPromise().then(done, done.fail);
    });

    it('should show error when called with illegal profile', (done) => {
        const logger = new TestLogger('logger');
        const profileName = 'nonexistentfile';
        runXliffmergeBuilderOnTestWorkspace({profile: profileName}, logger).pipe(
            tap((buildEvent) => {
                expect(buildEvent.success).toBe(false);
                const msg = 'could not read profile';
                expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
                expect(logger.includes(profileName)).toBe(true, `filename "${profileName}" not found in log`);
            })
        ).toPromise().then(done, done.fail);
    });

    it('should show error when called with illegal configuration', (done) => {
        const logger = new TestLogger('logger');
        const xlfFileName = 'nonexistentxlffile';
        runXliffmergeBuilderOnTestWorkspace({xliffmergeOptions: {i18nFile: xlfFileName}}, logger).pipe(
            tap((buildEvent) => {
                expect(buildEvent.success).toBe(false);
                const msg = 'is not readable';
                expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
                expect(logger.includes(xlfFileName)).toBe(true, `filename "${xlfFileName}" not found in log`);
            })
        ).toPromise().then(done, done.fail);
    });

    it('should use profile when called with both profile and configuration', (done) => {
        const logger = new TestLogger('logger');
        const profileName = 'nonexistentfile';
        const xlfFileName = 'nonexistentxlffile';
        runXliffmergeBuilderOnTestWorkspace({profile: profileName, xliffmergeOptions: {i18nFile: xlfFileName}}, logger).pipe(
            tap((buildEvent) => {
                expect(buildEvent.success).toBe(false);
                const msg = 'could not read profile';
                expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
                expect(logger.includes(profileName)).toBe(true, `filename "${profileName}" not found in log`);
            })
        ).toPromise().then(done, done.fail);
    });

    it('should run successfully with given xliffmergeOptions', (done) => {
        const logger = new TestLogger('logger');
        const configuration: IConfigFile = {
            xliffmergeOptions: {
                'srcDir': 'src/i18n',
                'genDir': 'src/i18nout',
                languages: ['en', 'de']
            }
        };
        const generatedFileEN = join(normalize('src'),  'i18nout', 'messages.en.xlf');
        const generatedFileDE = join(normalize('src'),  'i18nout', 'messages.de.xlf');
        runXliffmergeBuilderOnTestWorkspace(configuration, logger).pipe(
            tap((buildEvent) => expect(buildEvent.success).toBe(true)),
            tap(() => {
                const msg = 'WARNING: please translate file';
                expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
                expect(host.scopedSync().exists(generatedFileEN)).toBe(true, `file ${generatedFileEN} not generated`);
                expect(host.scopedSync().exists(generatedFileDE)).toBe(true, `file ${generatedFileDE} not generated`);
            })
        ).toPromise().then(done, done.fail);
    });

    it('should run successfully with options from profile', (done) => {
        const logger = new TestLogger('logger');
        const profileContent: IConfigFile = {
            xliffmergeOptions: {
                'srcDir': 'src/i18n',
                'genDir': 'src/i18nout',
                languages: ['en', 'de']
            }
        };
        host.scopedSync().write(
            join(normalize('.'), 'xliffmergeconfig.json'),
            virtualFs.stringToFileBuffer(JSON.stringify(profileContent)));
        const configuration: XliffmergeBuilderSchema = {
            profile: 'xliffmergeconfig.json'
        };
        const generatedFileEN = join(normalize('src'),  'i18nout', 'messages.en.xlf');
        const generatedFileDE = join(normalize('src'),  'i18nout', 'messages.de.xlf');
        runXliffmergeBuilderOnTestWorkspace(configuration, logger).pipe(
            tap((buildEvent) => expect(buildEvent.success).toBe(true)),
            tap(() => {
                const msg = 'WARNING: please translate file';
                expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
                expect(host.scopedSync().exists(generatedFileEN)).toBe(true, `file ${generatedFileEN} not generated`);
                expect(host.scopedSync().exists(generatedFileDE)).toBe(true, `file ${generatedFileDE} not generated`);
            })
        ).toPromise().then(done, done.fail);
    });
});
