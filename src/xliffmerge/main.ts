/**
 * Created by martin on 15.02.2017.
 * Command line interface xliffmerge
 */

import * as program from "commander";
import * as chalk from "chalk";
import {XliffMerge} from './xliff-merger';
import {XliffMergeError} from './xliff-merge-error';

let version = '0.0.1'; // TODO Version setzbar beim build
console.log(chalk.blue('** xliffmerge ' + version + '**'));
let languages;
program
    .version(version)
    .arguments('<language...>')
    .option('-p, --profile [configfile]', 'a json configuration file containing all relevant parameters (see details below)')
    .option('-v, --verbose', 'show some output for debugging purposes')
    .on('--help', () => {
        console.log('  <language> has to be a valid language short string, e,g. "en", "de", "de-ch"');
        console.log('');
        console.log('  configfile can contain the following values:');
        console.log('\tdefaultLanguage');
    })
    .action((languageArray) => {
        languages = languageArray;
    })
    .parse(process.argv);

try {
    new XliffMerge(languages, program.profile, program.verbose)
        .run();
} catch (err) {
    if (err instanceof XliffMergeError) {
        console.log(chalk.red(err.message));
        process.exit(-1);
    } else {
        // unhandled
        throw err;
    }
}
process.exit(0);
