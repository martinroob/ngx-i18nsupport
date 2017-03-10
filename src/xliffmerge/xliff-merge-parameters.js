/**
 * Created by martin on 17.02.2017.
 * Collection of all parameters used by the tool.
 * The parameters are read form the profile or defaults are used.
 */
"use strict";
var fs = require("fs");
var xliff_merge_error_1 = require("./xliff-merge-error");
var util_1 = require("util");
var XliffMergeParameters = (function () {
    function XliffMergeParameters() {
        this.errorsFound = [];
        this.warningsFound = [];
    }
    /**
     * Create Parameters.
     * @param options command options
     * @param profileContent given profile (if not, it is read from the profile path from options).
     * @return {XliffMergeParameters}
     */
    XliffMergeParameters.createFromOptions = function (options, profileContent) {
        var parameters = new XliffMergeParameters();
        parameters.configure(options, profileContent);
        return parameters;
    };
    /**
     * Initialize me from the profile content.
     * (public only for test usage).
     * @param options
     * @param profileContent if null, read it from profile.
     */
    XliffMergeParameters.prototype.configure = function (options, profileContent) {
        this.errorsFound = [];
        this.warningsFound = [];
        if (!profileContent) {
            profileContent = this.readProfile(options);
        }
        var validProfile = (!!profileContent);
        if (options.quiet) {
            this._quiet = options.quiet;
        }
        if (options.verbose) {
            this._verbose = options.verbose;
        }
        if (validProfile) {
            this.initializeFromConfig(profileContent);
            // if languages are given as parameters, they ovveride everything said in profile
            if (!!options.languages && options.languages.length > 0) {
                this._languages = options.languages;
                if (!this._defaultLanguage) {
                    this._defaultLanguage = this._languages[0];
                }
            }
            this.checkParameters();
        }
    };
    /**
     * Read profile.
     * @param profilePath
     * @return the read profile (empty, if none, null if errors)
     */
    XliffMergeParameters.prototype.readProfile = function (options) {
        var profilePath = options.profilePath;
        if (!profilePath) {
            return {};
        }
        var content;
        try {
            content = fs.readFileSync(profilePath, 'UTF-8');
        }
        catch (err) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('could not read profile "' + profilePath + '"'));
            return null;
        }
        var profileContent = JSON.parse(content);
        return profileContent;
    };
    XliffMergeParameters.prototype.initializeFromConfig = function (profileContent) {
        if (!profileContent) {
            return;
        }
        var profile = profileContent.xliffmergeOptions;
        if (profile) {
            if (!util_1.isNullOrUndefined(profile.quiet)) {
                this._quiet = profile.quiet;
            }
            if (!util_1.isNullOrUndefined(profile.verbose)) {
                this._verbose = profile.verbose;
            }
            if (profile.defaultLanguage) {
                this._defaultLanguage = profile.defaultLanguage;
            }
            if (profile.languages) {
                this._languages = profile.languages;
            }
            if (profile.srcDir) {
                this._srcDir = profile.srcDir;
            }
            if (profile.angularCompilerOptions) {
                if (profile.angularCompilerOptions.genDir)
                    this._genDir = profile.angularCompilerOptions.genDir;
            }
            if (profile.genDir) {
                // this must be after angularCompilerOptions to be preferred
                this._genDir = profile.genDir;
            }
            if (profile.i18nFile) {
                this._i18nFile = profile.i18nFile;
            }
            if (profile.i18nFormat) {
                this._i18nFormat = profile.i18nFormat;
            }
            if (profile.encoding) {
                this._encoding = profile.encoding;
            }
            if (profile.removeUnusedIds) {
                this._removeUnusedIds = profile.removeUnusedIds;
            }
        }
        else {
            this.warningsFound.push('did not find "xliffmergeOptions" in profile, using defaults');
        }
    };
    /**
     * Check all Parameters, wether they are complete and consistent.
     * if something is wrong with the parameters, it is collected in errorsFound.
     */
    XliffMergeParameters.prototype.checkParameters = function () {
        var _this = this;
        this.checkLanguageSyntax(this.defaultLanguage());
        if (this.languages().length == 0) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('no languages specified'));
        }
        this.languages().forEach(function (lang) {
            _this.checkLanguageSyntax(lang);
        });
        var stats;
        var err;
        // srcDir should exists
        try {
            stats = fs.statSync(this.srcDir());
        }
        catch (e) {
            err = e;
        }
        if (!!err || !stats.isDirectory()) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('srcDir "' + this.srcDir() + '" is not a directory'));
        }
        // genDir should exists
        try {
            stats = fs.statSync(this.genDir());
        }
        catch (e) {
            err = e;
        }
        if (!!err || !stats.isDirectory()) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('genDir "' + this.genDir() + '" is not a directory'));
        }
        // master file MUST exist
        try {
            fs.accessSync(this.i18nFile(), fs.constants.R_OK);
        }
        catch (err) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('i18nFile "' + this.i18nFile() + '" is not readable'));
        }
        // i18nFormat must be xlf or xmb
        if (!(this.i18nFormat() === 'xlf' || this.i18nFormat() === 'xmb')) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('i18nFormat "' + this.i18nFormat() + '" invalid, must be "xlf" or "xmb"'));
        }
    };
    /**
     * Check syntax of language.
     * Must be compatible with XML Schema type xsd:language.
     * Pattern: [a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*
     * @param lang
     */
    XliffMergeParameters.prototype.checkLanguageSyntax = function (lang) {
        var pattern = /^[a-zA-Z]{1,8}(-[a-zA-Z0-9]{1,8})*$/;
        if (!pattern.test(lang)) {
            this.errorsFound.push(new xliff_merge_error_1.XliffMergeError('language "' + lang + '" is not valid'));
        }
    };
    XliffMergeParameters.prototype.verbose = function () {
        return (util_1.isNullOrUndefined(this._verbose)) ? false : this._verbose;
    };
    XliffMergeParameters.prototype.quiet = function () {
        return (util_1.isNullOrUndefined(this._quiet)) ? false : this._quiet;
    };
    /**
     * Debug output all parameters to commandOutput.
     */
    XliffMergeParameters.prototype.showAllParameters = function (commandOutput) {
        commandOutput.debug('xliffmerge Used Parameters:');
        commandOutput.debug('defaultLanguage:\t"%s"', this.defaultLanguage());
        commandOutput.debug('srcDir:\t"%s"', this.srcDir());
        commandOutput.debug('genDir:\t"%s"', this.genDir());
        commandOutput.debug('i18nFile:\t"%s"', this.i18nFile());
        commandOutput.debug('languages:\t%s', this.languages());
    };
    /**
     * Default-Language, default en.
     * @return {string}
     */
    XliffMergeParameters.prototype.defaultLanguage = function () {
        return this._defaultLanguage ? this._defaultLanguage : 'en';
    };
    /**
     * Liste der zu bearbeitenden Sprachen.
     * @return {string[]}
     */
    XliffMergeParameters.prototype.languages = function () {
        return this._languages ? this._languages : [];
    };
    /**
     * src directory, where the master xlif is located.
     * @return {string}
     */
    XliffMergeParameters.prototype.srcDir = function () {
        return this._srcDir ? this._srcDir : '.';
    };
    /**
     * The master xlif file (the one generated by ng-xi18n).
     * Default is <srcDir>/messages.xlf.
     * @return {string}
     */
    XliffMergeParameters.prototype.i18nFile = function () {
        return this.srcDir() + '/' + (this._i18nFile ? this._i18nFile : 'messages.' + this.i18nFormat());
    };
    /**
     * Format of the master xlif file.
     * Default is "xlf", possible are "xlf" or "xmb".
     * @return {string}
     */
    XliffMergeParameters.prototype.i18nFormat = function () {
        return (this._i18nFormat ? this._i18nFormat : 'xlf');
    };
    /**
     * evtl zu generierendes I18n-File mit den Übersetzungen für eine Sprache.
     * @param lang
     * @return {string}
     */
    XliffMergeParameters.prototype.generatedI18nFile = function (lang) {
        return this.genDir() + '/' + 'messages.' + lang + '.' + this.i18nFormat();
    };
    /**
     * The encoding used to write new XLIFF-files.
     * @return {string}
     */
    XliffMergeParameters.prototype.encoding = function () {
        return this._encoding ? this._encoding : 'UTF-8';
    };
    /**
     * Output-Directory, where the output is written to.
     * Default is <srcDir>.
    */
    XliffMergeParameters.prototype.genDir = function () {
        return this._genDir ? this._genDir : this.srcDir();
    };
    XliffMergeParameters.prototype.removeUnusedIds = function () {
        return (util_1.isNullOrUndefined(this._removeUnusedIds)) ? true : this._removeUnusedIds;
    };
    return XliffMergeParameters;
}());
exports.XliffMergeParameters = XliffMergeParameters;
