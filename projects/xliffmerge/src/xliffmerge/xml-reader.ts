import {FileUtil} from '../common/file-util';
/**
 * Created by martin on 10.03.2017.
 * Helper class to read XMl with a correct encoding.
 */

export class XmlReader {
    static DEFAULT_ENCODING = 'utf-8' as BufferEncoding;

    /**
     * Read an xml-File.
     * @param path Path to file
     * @param encoding optional encoding of the xml.
     * This is read from the file, but if you know it before, you can avoid reading the file twice.
     * @return file content and encoding found in the file.
     */
    public static readXmlFileContent(path: string, encoding?: BufferEncoding): {content: string, encoding: BufferEncoding } {
        if (!encoding) {
            encoding = XmlReader.DEFAULT_ENCODING as BufferEncoding;
        }
        let content: string = FileUtil.read(path, encoding);
        const foundEncoding = XmlReader.encodingFromXml(content) as BufferEncoding;
        if (foundEncoding !== encoding) {
            // read again with the correct encoding
            content = FileUtil.read(path, foundEncoding);
        }
        return {
            content: content,
            encoding: foundEncoding
        };
    }

    /**
     * Read the encoding from the xml.
     * xml File starts with .. encoding=".."
     * @param xmlString xmlString
     * @return encoding
     */
    private static encodingFromXml(xmlString: string): string {
        const index = xmlString.indexOf('encoding="');
        if (index < 0) {
            return this.DEFAULT_ENCODING; // default in xml if not explicitly set
        }
        const endIndex = xmlString.indexOf('"', index + 10); // 10 = length of 'encoding="'
        return xmlString.substring(index + 10, endIndex);
    }

}

