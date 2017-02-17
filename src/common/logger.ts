/**
 * Created by martin on 17.02.2017.
 * Very simple logger.
 */

import * as chalk from "chalk";

export enum LogLevel {
    "ERROR",
    "WARN",
    "INFO",
    "DEBUG"
}

export class Logger {

    public static verbose: boolean;

    public static log(level: LogLevel, msg, ...params: any[]) {
        if (level == LogLevel.WARN || level == LogLevel.ERROR || Logger.verbose) {
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
            console.log(coloredMessage, ...params);
        }
    }

}