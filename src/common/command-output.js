/**
 * Created by martin on 17.02.2017.
 * Very simple class to control the output of a command.
 * Output can be errors, warnings, infos and debug-Outputs.
 * The output can be controlled via 2 flags, quiet and verbose.
 * If quit is enabled only error messages are shown.
 * If verbose is enabled, everything is shown.
 * If both are not enabled (the default) errors, warnings and infos are shown.
 * If not are enabled (strange), we assumed the default.
 */
"use strict";
var chalk = require("chalk");
var util = require("util");
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (LogLevel = {}));
var CommandOutput = (function () {
    function CommandOutput(stdout) {
        this._quiet = false;
        this._verbose = false;
        if (stdout) {
            this.outputStream = stdout;
        }
        else {
            this.outputStream = process.stdout;
        }
    }
    CommandOutput.prototype.setVerbose = function () {
        this._verbose = true;
    };
    CommandOutput.prototype.setQuiet = function () {
        this._quiet = true;
    };
    /**
     * Test, wether verbose is enabled.
     * @return {boolean}
     */
    CommandOutput.prototype.verbose = function () {
        return this._verbose;
    };
    /**
     * Test, wether queit is enabled.
     * @return {boolean}
     */
    CommandOutput.prototype.quiet = function () {
        return this._quiet;
    };
    CommandOutput.prototype.error = function (msg) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        this.log(LogLevel.ERROR, msg, params);
    };
    CommandOutput.prototype.warn = function (msg) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        this.log(LogLevel.WARN, msg, params);
    };
    CommandOutput.prototype.info = function (msg) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        this.log(LogLevel.INFO, msg, params);
    };
    CommandOutput.prototype.debug = function (msg) {
        var params = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            params[_i - 1] = arguments[_i];
        }
        this.log(LogLevel.DEBUG, msg, params);
    };
    CommandOutput.prototype.log = function (level, msg, params) {
        if (!this.isOutputEnabled(level)) {
            return;
        }
        var coloredMessage;
        switch (level) {
            case LogLevel.ERROR:
                coloredMessage = chalk.red('ERROR: ' + msg);
                break;
            case LogLevel.WARN:
                coloredMessage = chalk.magenta('WARNING: ' + msg);
                break;
            default:
                coloredMessage = chalk.gray('* ' + msg);
                break;
        }
        var outMsg = util.format.apply(util, [coloredMessage].concat(params));
        this.outputStream.write(outMsg + '\n');
    };
    CommandOutput.prototype.isOutputEnabled = function (level) {
        var quietEnabled, verboseEnabled;
        if (this._quiet && this._verbose) {
            quietEnabled = false;
            verboseEnabled = false;
        }
        else {
            quietEnabled = this._quiet;
            verboseEnabled = this._verbose;
        }
        switch (level) {
            case LogLevel.ERROR:
                return true; // always output errors
            case LogLevel.WARN:
                return (!quietEnabled);
            case LogLevel.INFO:
                return (verboseEnabled && !quietEnabled);
            case LogLevel.DEBUG:
                return verboseEnabled;
            default:
                return true;
        }
    };
    return CommandOutput;
}());
exports.CommandOutput = CommandOutput;
