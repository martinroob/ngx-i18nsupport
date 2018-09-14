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

import chalk from "chalk";
import WritableStream = NodeJS.WritableStream;
import * as util from "util";

enum LogLevel {
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG"
}

export class CommandOutput {

    /**
     * verbose enables output of everything.
     */
    public _verbose: boolean;

    /**
     * quiet disables output of everything but errors.
     */
    public _quiet: boolean;

    private outputStream: WritableStream;

    constructor(stdout?: WritableStream) {
        this._quiet = false;
        this._verbose = false;
        if (stdout) {
            this.outputStream = stdout;
        } else {
            this.outputStream = process.stdout;
        }
    }

    public setVerbose() {
        this._verbose = true;
    }

    public setQuiet() {
        this._quiet = true;
    }

    /**
     * Test, wether verbose is enabled.
     * @return {boolean}
     */
    public verbose(): boolean {
        return this._verbose;
    }

    /**
     * Test, wether queit is enabled.
     * @return {boolean}
     */
    public quiet(): boolean {
        return this._quiet;
    }

    public error(msg, ...params: any[]) {
        this.log(LogLevel.ERROR, msg, params);
    }

    public warn(msg, ...params: any[]) {
        this.log(LogLevel.WARN, msg, params);
    }

    public info(msg, ...params: any[]) {
        this.log(LogLevel.INFO, msg, params);
    }

    public debug(msg, ...params: any[]) {
        this.log(LogLevel.DEBUG, msg, params);
    }

    private log(level: LogLevel, msg, params: any[]) {
        if (!this.isOutputEnabled(level)) {
            return;
        }
        let coloredMessage;
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
        let outMsg = util.format(coloredMessage, ...params);
        this.outputStream.write(outMsg + '\n');
    }

    private isOutputEnabled(level: LogLevel): boolean {
        let quietEnabled, verboseEnabled: boolean;
        if (this._quiet && this._verbose) {
            quietEnabled = false;
            verboseEnabled = false;
        } else {
            quietEnabled = this._quiet;
            verboseEnabled = this._verbose;
        }
        switch (level) {
            case LogLevel.ERROR:
                return true;    // always output errors
            case LogLevel.WARN:
                return (!quietEnabled);
            case LogLevel.INFO:
                return (verboseEnabled && !quietEnabled);
            case LogLevel.DEBUG:
                return verboseEnabled;
            default:
                return true;
        }
    }
}