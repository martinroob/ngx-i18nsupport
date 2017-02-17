import fs = require("fs");
/**
 * Created by martin on 17.02.2017.
 * Some (a few) simple utils for file operations.
 * Just for convenience.
 */

export class FileUtil {

    /**
     * Check for existence.
     * @param filename
     * @return {boolean}
     */
    public static exists(filename: string) {
        return fs.existsSync(filename);
    }

    /**
     * Read a file.
     * @param filename
     * @param encoding
     * @return {string}
     */
    public static read(filename: string, encoding: string) {
        return fs.readFileSync(filename, encoding);
    }

    /**
     * Write a file with given content.
     * @param filename
     * @param newContent
     * @param encoding
     */
    public static replaceContent(filename: string, newContent: string, encoding: string) {
        fs.writeFileSync(filename, newContent, {encoding: encoding});
    }

    public static copy(srcFile: string, destFile: string) {
        let BUF_LENGTH = 64*1024;
        let buff = new Buffer(BUF_LENGTH);
        let fdr = fs.openSync(srcFile, 'r');
        let fdw = fs.openSync(destFile, 'w');
        let bytesRead = 1;
        let pos = 0;
        while (bytesRead > 0) {
            bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
            fs.writeSync(fdw,buff,0,bytesRead);
            pos += bytesRead;
        }
        fs.closeSync(fdr);
        fs.closeSync(fdw);
    }
}