"use strict";
var file_util_1 = require("../common/file-util");
/**
 * Created by martin on 10.03.2017.
 * Helper class to read XMl with a correct encoding.
 */
var XmlReader = (function () {
    function XmlReader() {
    }
    /**
     * Read an xml-File.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return file content and encoding found in the file.
     */
    XmlReader.readXmlFileContent = function (path, encoding) {
        if (!encoding) {
            encoding = XmlReader.DEFAULT_ENCODING;
        }
        var content = file_util_1.FileUtil.read(path, encoding);
        var foundEncoding = XmlReader.encodingFromXml(content);
        if (foundEncoding != encoding) {
            // read again with the correct encoding
            content = file_util_1.FileUtil.read(path, foundEncoding);
        }
        return {
            content: content,
            encoding: foundEncoding
        };
    };
    /**
     * Read the encoding from the xml.
     * xml File starts with .. encoding=".."
     * @param xmlString
     * @return {any}
     */
    XmlReader.encodingFromXml = function (xmlString) {
        var index = xmlString.indexOf('encoding="');
        if (index < 0) {
            return this.DEFAULT_ENCODING; // default in xml if not explicitly set
        }
        var endIndex = xmlString.indexOf('"', index + 10); // 10 = length of 'encoding="'
        return xmlString.substring(index + 10, endIndex);
    };
    return XmlReader;
}());
XmlReader.DEFAULT_ENCODING = 'UTF-8';
exports.XmlReader = XmlReader;
