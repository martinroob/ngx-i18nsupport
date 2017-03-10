"use strict";
var xliff_file_1 = require("./xliff-file");
var xmb_file_1 = require("./xmb-file");
var util_1 = require("util");
/**
 * The Common interface of XliffFile and XmbFile.
 * The merge process only uses this interface.
 * Created by martin on 10.03.2017.
 */
/**
 * Helper class to read file depending on format.
 */
var TranslationMessagesFileReader = (function () {
    function TranslationMessagesFileReader() {
    }
    /**
     * Read file function, result depends on format, either XliffFile or XmbFile.
     * @param format
     * @param path
     * @param encoding
     * @return {XliffFile}
     */
    TranslationMessagesFileReader.fromFile = function (i18nFormat, path, encoding) {
        if (i18nFormat === 'xlf') {
            return xliff_file_1.XliffFile.fromFile(path, encoding);
        }
        if (i18nFormat === 'xmb') {
            return xmb_file_1.XmbFile.fromFile(path, encoding);
        }
        throw new Error(util_1.format('oops, unsupported format "%s"', i18nFormat));
    };
    return TranslationMessagesFileReader;
}());
exports.TranslationMessagesFileReader = TranslationMessagesFileReader;
