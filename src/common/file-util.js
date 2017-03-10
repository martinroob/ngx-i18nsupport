"use strict";
var fs = require("fs");
/**
 * Created by martin on 17.02.2017.
 * Some (a few) simple utils for file operations.
 * Just for convenience.
 */
var FileUtil = (function () {
    function FileUtil() {
    }
    /**
     * Check for existence.
     * @param filename
     * @return {boolean}
     */
    FileUtil.exists = function (filename) {
        return fs.existsSync(filename);
    };
    /**
     * Read a file.
     * @param filename
     * @param encoding
     * @return {string}
     */
    FileUtil.read = function (filename, encoding) {
        return fs.readFileSync(filename, encoding);
    };
    /**
     * Write a file with given content.
     * @param filename
     * @param newContent
     * @param encoding
     */
    FileUtil.replaceContent = function (filename, newContent, encoding) {
        fs.writeFileSync(filename, newContent, { encoding: encoding });
    };
    FileUtil.copy = function (srcFile, destFile) {
        var BUF_LENGTH = 64 * 1024;
        var buff = new Buffer(BUF_LENGTH);
        var fdr = fs.openSync(srcFile, 'r');
        var fdw = fs.openSync(destFile, 'w');
        var bytesRead = 1;
        var pos = 0;
        while (bytesRead > 0) {
            bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
            fs.writeSync(fdw, buff, 0, bytesRead);
            pos += bytesRead;
        }
        fs.closeSync(fdr);
        fs.closeSync(fdw);
    };
    /**
     * Delete the folder and all of its content (rm -rf).
     * @param path
     */
    FileUtil.deleteFolderRecursive = function (path) {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    FileUtil.deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    };
    ;
    /**
     * Delete folders content recursively, but do not delete folder.
     * Folder is left empty at the end.
     * @param path
     */
    FileUtil.deleteFolderContentRecursive = function (path) {
        var files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file, index) {
                var curPath = path + "/" + file;
                if (fs.lstatSync(curPath).isDirectory()) {
                    FileUtil.deleteFolderRecursive(curPath);
                }
                else {
                    fs.unlinkSync(curPath);
                }
            });
        }
    };
    ;
    return FileUtil;
}());
exports.FileUtil = FileUtil;
