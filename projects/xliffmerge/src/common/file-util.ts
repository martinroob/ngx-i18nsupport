import * as fs from 'fs';

/**
 * Created by martin on 17.02.2017.
 * Some (a few) simple utils for file operations.
 * Just for convenience.
 */

export class FileUtil {

    /**
     * Check for existence.
     * @param filename filename
     * @return wether file exists
     */
    public static exists(filename: string) {
        return fs.existsSync(filename);
    }

    /**
     * Read a file.
     * @param filename filename
     * @param encoding encoding
     * @return content of file
     */
    public static read(filename: string, encoding: BufferEncoding) {
        return fs.readFileSync(filename, encoding);
    }

    /**
     * Write a file with given content.
     * @param filename filename
     * @param newContent newContent
     * @param encoding encoding
     */
    public static replaceContent(filename: string, newContent: string, encoding: BufferEncoding) {
        fs.writeFileSync(filename, newContent, {encoding: encoding});
    }

    public static copy(srcFile: string, destFile: string) {
        const BUF_LENGTH = 64 * 1024;
        const buff = Buffer.alloc(BUF_LENGTH);
        const fdr = fs.openSync(srcFile, 'r');
        const fdw = fs.openSync(destFile, 'w');
        let bytesRead = 1;
        let pos = 0;
        while (bytesRead > 0) {
            bytesRead = fs.readSync(fdr, buff, 0, BUF_LENGTH, pos);
            fs.writeSync(fdw, buff, 0, bytesRead);
            pos += bytesRead;
        }
        fs.closeSync(fdr);
        fs.closeSync(fdw);
    }

    /**
     * Delete the folder and all of its content (rm -rf).
     * @param path path
     */
    public static deleteFolderRecursive(path: string) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
                const curPath = path + '/' + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    FileUtil.deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
            fs.rmdirSync(path);
        }
    }

    /**
     * Delete folders content recursively, but do not delete folder.
     * Folder is left empty at the end.
     * @param path path
     */
    public static deleteFolderContentRecursive(path: string) {
        let files = [];
        if (fs.existsSync(path)) {
            files = fs.readdirSync(path);
            files.forEach(function (file) {
                const curPath = path + '/' + file;
                if (fs.lstatSync(curPath).isDirectory()) { // recurse
                    FileUtil.deleteFolderRecursive(curPath);
                } else { // delete file
                    fs.unlinkSync(curPath);
                }
            });
        }
    }

    /**
     * Delete a file.
     * @param path path
     */
    public static deleteFile(path: string) {
        fs.unlinkSync(path);
    }
}
