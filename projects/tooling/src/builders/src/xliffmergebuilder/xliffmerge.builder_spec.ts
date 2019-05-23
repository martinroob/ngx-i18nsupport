import {join, JsonObject, normalize, virtualFs} from '@angular-devkit/core';
import {Architect, BuilderOutput, Target} from '@angular-devkit/architect';
import {createArchitect, host} from './testing_utils';
import {TestLogger} from './testlogger_spec';
import {XliffmergeBuilderSchema} from './schema';
import {IConfigFile} from '@ngx-i18nsupport/ngx-i18nsupport';

describe('xliffmerge.builder', () => {

  let architect: Architect;
  const xliffmergeTargetSpec: Target = {project: 'hello-world-app', target: 'xliffmerge'};

  async function runXliffmergeBuilderOnTestWorkspace(configuration: XliffmergeBuilderSchema|undefined,
                                                 logger: TestLogger): Promise<BuilderOutput> {
    const run = await architect.scheduleTarget(xliffmergeTargetSpec, configuration as JsonObject, {logger: logger});
    const output: BuilderOutput = await run.result;
    await run.stop();
    return output;
  }

    beforeEach(async () => {
      /**
       * We are using a test workspace from the test folder.
       * In this workspace the xliffmerge builder is already configured.
       */
      await host.initialize().toPromise();
      const architectInfo = await createArchitect(host.root());
      architect = architectInfo.architect;
    });

  afterEach(async () => {
    host.restore().toPromise();
  });

    it('should show error when called with illegal profile', async () => {
        const logger = new TestLogger('logger');
        const profileName = 'nonexistentfile';
        const builderOutput = await runXliffmergeBuilderOnTestWorkspace({profile: profileName}, logger);
        expect(builderOutput.success).toBe(false);
        const msg = 'could not read profile';
        expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
        expect(logger.includes(profileName)).toBe(true, `filename "${profileName}" not found in log`);
    });

    it('should show error when called with illegal configuration', async () => {
        const logger = new TestLogger('logger');
        const xlfFileName = 'nonexistentxlffile';
        const builderOutput = await runXliffmergeBuilderOnTestWorkspace({xliffmergeOptions: {i18nFile: xlfFileName}}, logger);
        expect(builderOutput.success).toBe(false);
        const msg = 'is not readable';
        expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
        expect(logger.includes(xlfFileName)).toBe(true, `filename "${xlfFileName}" not found in log`);
    });

    it('should use profile when called with both profile and configuration', async () => {
        const logger = new TestLogger('logger');
        const profileName = 'nonexistentfile';
        const xlfFileName = 'nonexistentxlffile';
        const builderOutput = await runXliffmergeBuilderOnTestWorkspace({
          profile: profileName, xliffmergeOptions: {i18nFile: xlfFileName}},
          logger);
        expect(builderOutput.success).toBe(false);
        const msg = 'could not read profile';
        expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
        expect(logger.includes(profileName)).toBe(true, `filename "${profileName}" not found in log`);
    });

    it('should run successfully with given xliffmergeOptions', async () => {
        const logger = new TestLogger('logger');
        const configuration: IConfigFile = {
            xliffmergeOptions: {
                'srcDir': 'src/i18n',
                'genDir': 'src/i18nout',
                languages: ['en', 'de'],
              verbose: true
            }
        };
        const generatedFileEN = join(normalize('src'),  'i18nout', 'messages.en.xlf');
        const generatedFileDE = join(normalize('src'),  'i18nout', 'messages.de.xlf');
        const builderOutput = await runXliffmergeBuilderOnTestWorkspace(configuration, logger);
        expect(builderOutput.success).toBe(true);
        const msg = 'WARNING: please translate file';
        expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
        host.scopedSync().read(generatedFileEN);
        host.scopedSync().read(generatedFileDE);
        expect(await host.scopedSync().exists(generatedFileEN)).toBe(true, `file ${generatedFileEN} not generated`);
        expect(await host.scopedSync().exists(generatedFileDE)).toBe(true, `file ${generatedFileDE} not generated`);
    });

    it('should run successfully with options from profile', async () => {
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
      const builderOutput = await runXliffmergeBuilderOnTestWorkspace(configuration, logger);
      expect(builderOutput.success).toBe(true);
      const msg = 'WARNING: please translate file';
      expect(logger.includes(msg)).toBe(true, `msg "${msg}" not found in log`);
      expect(host.scopedSync().exists(generatedFileEN)).toBe(true, `file ${generatedFileEN} not generated`);
      expect(host.scopedSync().exists(generatedFileDE)).toBe(true, `file ${generatedFileDE} not generated`);
    });
});
