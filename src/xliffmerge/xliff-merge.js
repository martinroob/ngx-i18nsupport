"use strict";
var program = require("commander");
var command_output_1 = require("../common/command-output");
var xliff_merge_parameters_1 = require("./xliff-merge-parameters");
var xliff_merge_error_1 = require("./xliff-merge-error");
var file_util_1 = require("../common/file-util");
var version_1 = require("./version");
var util_1 = require("util");
var i_translation_messages_file_1 = require("./i-translation-messages-file");
var XliffMerge = (function () {
    function XliffMerge(commandOutput, options) {
        this.commandOutput = commandOutput;
        this.options = options;
        this.parameters = null;
    }
    XliffMerge.main = function (argv) {
        var options = XliffMerge.parseArgs(argv);
        var result = new XliffMerge(new command_output_1.CommandOutput(process.stdout), options).run();
        process.exit(result);
    };
    XliffMerge.parseArgs = function (argv) {
        var languages = null;
        delete program.verbose;
        delete program.quiet;
        delete program.profilePath;
        delete program.languages;
        program
            .version(version_1.VERSION)
            .arguments('<language...>')
            .option('-p, --profile [configfile]', 'a json configuration file containing all relevant parameters (see details below)')
            .option('-v, --verbose', 'show some output for debugging purposes')
            .option('-q, --quiet', 'only show errors, nothing else')
            .on('--help', function () {
            console.log('  <language> has to be a valid language short string, e,g. "en", "de", "de-ch"');
            console.log('');
            console.log('  configfile can contain the following values:');
            console.log('\tquiet verbose defaultLanguage languages srcDir i18nFile i18nFormat encoding genDir removeUnusedIds');
            console.log('\tfor details please consult the home page https://github.com/martinroob/ngx-i18nsupport');
        })
            .action(function (languageArray) {
            languages = languageArray;
        })
            .parse(argv);
        var options = {
            languages: languages
        };
        if (program.profile) {
            options.profilePath = program.profile;
        }
        if (program.quiet) {
            options.quiet = true;
        }
        if (program.verbose && program.verbose > 0) {
            options.verbose = true;
        }
        return options;
    };
    /**
     * For Tests, create instance with given profile
     * @param commandOutput
     * @param options
     * @param profileContent
     */
    XliffMerge.createFromOptions = function (commandOutput, options, profileContent) {
        var instance = new XliffMerge(commandOutput, options);
        instance.parameters = xliff_merge_parameters_1.XliffMergeParameters.createFromOptions(options, profileContent);
        return instance;
    };
    XliffMerge.prototype.run = function () {
        try {
            this.doRun();
            return 0;
        }
        catch (err) {
            if (err instanceof xliff_merge_error_1.XliffMergeError) {
                this.commandOutput.error(err.message);
                return -1;
            }
            else {
                // unhandled
                this.commandOutput.error('oops ' + err);
                throw err;
            }
        }
    };
    /**
     * Ausführen merge-Process.
     */
    XliffMerge.prototype.doRun = function () {
        var _this = this;
        if (this.options && this.options.quiet) {
            this.commandOutput.setQuiet();
        }
        if (this.options && this.options.verbose) {
            this.commandOutput.setVerbose();
        }
        if (!this.parameters) {
            this.parameters = xliff_merge_parameters_1.XliffMergeParameters.createFromOptions(this.options);
        }
        this.commandOutput.info('xliffmerge version %s', version_1.VERSION);
        if (this.parameters.verbose()) {
            this.parameters.showAllParameters(this.commandOutput);
        }
        if (this.parameters.errorsFound.length > 0) {
            for (var _i = 0, _a = this.parameters.errorsFound; _i < _a.length; _i++) {
                var err = _a[_i];
                this.commandOutput.error(err.message);
            }
            return;
        }
        if (this.parameters.warningsFound.length > 0) {
            for (var _b = 0, _c = this.parameters.warningsFound; _b < _c.length; _b++) {
                var warn = _c[_b];
                this.commandOutput.warn(warn);
            }
        }
        this.readMaster();
        this.parameters.languages().forEach(function (lang) {
            _this.processLanguage(lang);
        });
    };
    /**
     * Return the name of the generated file for given lang.
     * @param lang
     * @return {string}
     */
    XliffMerge.prototype.generatedI18nFile = function (lang) {
        return this.parameters.generatedI18nFile(lang);
    };
    XliffMerge.prototype.readMaster = function () {
        var _this = this;
        this.master = i_translation_messages_file_1.TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), this.parameters.i18nFile(), this.parameters.encoding());
        this.master.warnings().forEach(function (warning) {
            _this.commandOutput.warn(warning);
        });
        var count = this.master.numberOfTransUnits();
        var missingIdCount = this.master.numberOfTransUnitsWithMissingId();
        this.commandOutput.info('master contains %s trans-units', count);
        if (missingIdCount > 0) {
            this.commandOutput.warn('master contains %s trans-units, but there are %s without id', count, missingIdCount);
        }
        var sourceLang = this.master.sourceLanguage();
        if (sourceLang && sourceLang !== this.parameters.defaultLanguage()) {
            this.commandOutput.warn('master says to have source-language="%s", should be "%s" (your defaultLanguage)', sourceLang, this.parameters.defaultLanguage());
            this.master.setSourceLanguage(this.parameters.defaultLanguage());
            this.master.save();
            this.commandOutput.warn('changed master source-language="%s" to "%s"', sourceLang, this.parameters.defaultLanguage());
        }
    };
    XliffMerge.prototype.processLanguage = function (lang) {
        this.commandOutput.debug('processing language %s', lang);
        var languageXliffFile = this.parameters.generatedI18nFile(lang);
        if (!file_util_1.FileUtil.exists(languageXliffFile)) {
            this.createUntranslatedXliff(lang, languageXliffFile);
        }
        else {
            this.mergeMasterTo(lang, languageXliffFile);
        }
    };
    /**
     * create a new file for the language, which contains no translations, but all keys.
     * in principle, this is just a copy of the master with target-language set.
     * @param lang
     * @param languageXliffFilePath
     */
    XliffMerge.prototype.createUntranslatedXliff = function (lang, languageXliffFilePath) {
        // copy master ...
        file_util_1.FileUtil.copy(this.parameters.i18nFile(), languageXliffFilePath);
        // read copy and set target-language
        var languageSpecificMessagesFile = i_translation_messages_file_1.TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), languageXliffFilePath, this.parameters.encoding());
        languageSpecificMessagesFile.setTargetLanguage(lang);
        // copy source to target
        var isDefaultLang = (lang == this.parameters.defaultLanguage());
        languageSpecificMessagesFile.forEachTransUnit(function (transUnit) {
            languageSpecificMessagesFile.useSourceAsTarget(transUnit, isDefaultLang);
        });
        // write it to file
        languageSpecificMessagesFile.save();
        this.commandOutput.info('created new file "%s" for target-language="%s"', languageXliffFilePath, lang);
        if (!isDefaultLang) {
            this.commandOutput.warn('please translate file "%s" to target-language="%s"', languageXliffFilePath, lang);
        }
    };
    /**
     * Merge all
     * @param lang
     * @param languageXliffFilePath
     */
    XliffMerge.prototype.mergeMasterTo = function (lang, languageXliffFilePath) {
        var _this = this;
        // read lang specific file
        var languageSpecificMessagesFile = i_translation_messages_file_1.TranslationMessagesFileReader.fromFile(this.parameters.i18nFormat(), languageXliffFilePath, this.parameters.encoding());
        var isDefaultLang = (lang == this.parameters.defaultLanguage());
        var newCount = 0;
        this.master.forEachTransUnit(function (masterTransUnit) {
            var transUnit = languageSpecificMessagesFile.transUnitWithId(masterTransUnit.id);
            if (!transUnit) {
                // oops, no translation, must be a new key, so add it
                languageSpecificMessagesFile.useSourceAsTarget(masterTransUnit, isDefaultLang);
                languageSpecificMessagesFile.addNewTransUnit(masterTransUnit);
                newCount++;
            }
        });
        if (newCount > 0) {
            this.commandOutput.warn('merged %s trans-units from master to "%s"', newCount, lang);
        }
        // remove all elements that are no longer used
        var removeCount = 0;
        languageSpecificMessagesFile.forEachTransUnit(function (transUnit) {
            var existsInMaster = !util_1.isNullOrUndefined(_this.master.transUnitWithId(transUnit.id));
            if (!existsInMaster) {
                if (_this.parameters.removeUnusedIds()) {
                    languageSpecificMessagesFile.removeTransUnitWithId(transUnit.id);
                }
                removeCount++;
            }
        });
        if (removeCount > 0) {
            if (this.parameters.removeUnusedIds()) {
                this.commandOutput.warn('removed %s unused trans-units in "%s"', removeCount, lang);
            }
            else {
                this.commandOutput.warn('keeping %s unused trans-units in "%s", because removeUnused is disabled', removeCount, lang);
            }
        }
        if (newCount == 0 && removeCount == 0) {
            this.commandOutput.info('file for "%s" was up to date', lang);
        }
        else {
            // write it to file
            languageSpecificMessagesFile.save();
            this.commandOutput.info('updated file "%s" for target-language="%s"', languageXliffFilePath, lang);
            if (newCount > 0 && !isDefaultLang) {
                this.commandOutput.warn('please translate file "%s" to target-language="%s"', languageXliffFilePath, lang);
            }
        }
    };
    return XliffMerge;
}());
exports.XliffMerge = XliffMerge;
